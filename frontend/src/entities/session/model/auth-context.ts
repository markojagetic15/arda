import { createContext, useContext } from 'react'

import type { User } from '@/entities/user'

export interface AuthContextValue {
  user: User | null
  isInitializing: boolean
}

export const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
