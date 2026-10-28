import type { PropsWithChildren, ReactElement } from 'react'
import { Navigate, useLocation } from 'react-router-dom'

import { useAuth } from '@/entities/session'

function FullPageSpinner() {
  return <div className="flex min-h-screen items-center justify-center">Loading…</div>
}

export function RequireAuth({ children }: PropsWithChildren): ReactElement {
  const { user, isInitializing } = useAuth()
  const location = useLocation()

  if (isInitializing) {
    return <FullPageSpinner />
  }

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />
  }

  return <>{children}</>
}

export function RequireGuest({ children }: PropsWithChildren): ReactElement {
  const { user, isInitializing } = useAuth()

  if (isInitializing) {
    return <FullPageSpinner />
  }

  if (user) {
    return <Navigate to="/profile" replace />
  }

  return <>{children}</>
}
