import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useSyncExternalStore, type PropsWithChildren } from 'react'

import { getAccessToken, setAccessToken, subscribeAccessToken } from '@/shared/api/auth-token-store'
import { userApi } from '@/entities/user'

import { authApi } from '../api/auth.api'
import { AuthContext, type AuthContextValue } from './auth-context'
import { ME_QUERY_KEY } from './session-cache'

export function AuthProvider({ children }: PropsWithChildren) {
  const accessToken = useSyncExternalStore(subscribeAccessToken, getAccessToken, () => null)
  const queryClient = useQueryClient()

  // Attempt a silent login via the httpOnly refresh cookie on first mount.
  const bootstrapQuery = useQuery({
    queryKey: ['auth-bootstrap'],
    queryFn: async () => {
      const result = await authApi.refresh()
      setAccessToken(result.accessToken)
      queryClient.setQueryData(ME_QUERY_KEY, result.user)
      return result
    },
    retry: false,
    staleTime: Infinity,
  })

  const meQuery = useQuery({
    queryKey: ME_QUERY_KEY,
    queryFn: userApi.getMe,
    enabled: Boolean(accessToken) && !bootstrapQuery.isPending,
    staleTime: 60_000,
    retry: false,
  })

  const value: AuthContextValue = {
    user: meQuery.data ?? null,
    isInitializing: bootstrapQuery.isPending,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
