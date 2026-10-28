import { useMutation, useQueryClient } from '@tanstack/react-query'

import { applySession, authApi } from '@/entities/session'

export function useRegister() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: authApi.register,
    onSuccess: (result) => applySession(queryClient, result),
  })
}
