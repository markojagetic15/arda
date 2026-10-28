import { httpClient } from '@/shared/api/http-client'

import type { User } from '../model/types'

export const userApi = {
  getMe: () => httpClient.get<User>('/users/me'),
  updateProfile: (input: { name: string }) => httpClient.patch<User>('/users/me', input),
  resendVerification: () => httpClient.post<{ success: boolean }>('/users/me/verify-email'),
  changePassword: (input: { currentPassword: string; newPassword: string }) =>
    httpClient.post<{ success: boolean }>('/users/me/password', input),
}
