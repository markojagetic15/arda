import { useMutation, useQueryClient } from '@tanstack/react-query'

import { ME_QUERY_KEY } from '@/entities/session'
import { userApi } from '@/entities/user'

export function useUpdateProfile() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: userApi.updateProfile,
    onSuccess: (user) => queryClient.setQueryData(ME_QUERY_KEY, user),
  })
}
