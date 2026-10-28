import { env } from '@/shared/config/env'

import { getAccessToken, setAccessToken } from './auth-token-store'
import { handleMockRequest } from './mock-backend'

export class HttpError extends Error {
  status: number

  constructor(status: number, message: string) {
    super(message)
    this.name = 'HttpError'
    this.status = status
  }
}

async function extractErrorMessage(response: Response): Promise<string> {
  const text = await response.text()
  try {
    const body = JSON.parse(text) as { message?: string | string[] }
    if (Array.isArray(body.message)) return body.message.join(', ')
    if (typeof body.message === 'string') return body.message
  } catch {
    // not a JSON error body — fall through to the raw text
  }
  return text || response.statusText
}

let refreshPromise: Promise<boolean> | null = null

async function refreshAccessToken(): Promise<boolean> {
  refreshPromise ??= (async () => {
    try {
      const response = await fetch(`${env.apiUrl}/auth/refresh`, {
        method: 'POST',
        credentials: 'include',
      })
      if (!response.ok) {
        setAccessToken(null)
        return false
      }
      const data = (await response.json()) as { accessToken: string }
      setAccessToken(data.accessToken)
      return true
    } catch {
      setAccessToken(null)
      return false
    } finally {
      refreshPromise = null
    }
  })()
  return refreshPromise
}

async function request<T>(path: string, init?: RequestInit, allowRetry = true): Promise<T> {
  if (env.mockAuth) {
    const mocked = handleMockRequest(path, init)
    if (mocked.handled) return mocked.data as T
  }

  const token = getAccessToken()
  const response = await fetch(`${env.apiUrl}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...init?.headers,
    },
    credentials: 'include',
  })

  // Auth endpoints 401 to report bad credentials/tokens, not an expired
  // session — only retry the silent refresh for protected resource calls.
  if (response.status === 401 && allowRetry && !path.startsWith('/auth/')) {
    const refreshed = await refreshAccessToken()
    if (refreshed) {
      return request<T>(path, init, false)
    }
  }

  if (!response.ok) {
    throw new HttpError(response.status, await extractErrorMessage(response))
  }

  if (response.status === 204) {
    return undefined as T
  }

  return (await response.json()) as T
}

export const httpClient = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: 'POST', body: body === undefined ? undefined : JSON.stringify(body) }),
  patch: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: 'PATCH', body: JSON.stringify(body) }),
  delete: <T>(path: string) => request<T>(path, { method: 'DELETE' }),
}
