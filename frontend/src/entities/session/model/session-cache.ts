import type { QueryClient } from '@tanstack/react-query'

import { setAccessToken } from '@/shared/api/auth-token-store'
import type { User } from '@/entities/user'

export const ME_QUERY_KEY = ['me'] as const

export function applySession(queryClient: QueryClient, session: { user: User; accessToken: string }): void {
  setAccessToken(session.accessToken)
  queryClient.setQueryData(ME_QUERY_KEY, session.user)
}

export function clearSession(queryClient: QueryClient): void {
  setAccessToken(null)
  queryClient.setQueryData(ME_QUERY_KEY, null)
}
