import { useMutation, useQueryClient } from '@tanstack/react-query'

import { authApi, clearSession } from '@/entities/session'

export function useLogout() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: authApi.logout,
    onSettled: () => clearSession(queryClient),
  })
}
