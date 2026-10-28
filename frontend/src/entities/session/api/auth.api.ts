import { httpClient } from '@/shared/api/http-client'
import type { User } from '@/entities/user'

export interface AuthResult {
  user: User
  accessToken: string
}

export const authApi = {
  register: (input: { email: string; password: string; name: string }) =>
    httpClient.post<AuthResult>('/auth/register', input),
  login: (input: { email: string; password: string }) =>
    httpClient.post<AuthResult>('/auth/login', input),
  refresh: () => httpClient.post<AuthResult>('/auth/refresh'),
  logout: () => httpClient.post<{ success: boolean }>('/auth/logout'),
  requestPasswordReset: (input: { email: string }) =>
    httpClient.post<{ success: boolean }>('/auth/password-reset/request', input),
  resetPassword: (input: { token: string; newPassword: string }) =>
    httpClient.post<{ success: boolean }>('/auth/password-reset/confirm', input),
}
