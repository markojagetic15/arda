import { useMutation, useQueryClient } from '@tanstack/react-query'

import { applySession, authApi } from '@/entities/session'

export function useLogin() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: authApi.login,
    onSuccess: (result) => applySession(queryClient, result),
  })
}
