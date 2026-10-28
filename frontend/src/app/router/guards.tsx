import type { PropsWithChildren, ReactElement } from 'react'
import { Navigate, useLocation } from 'react-router-dom'

import { useAuth } from '@/entities/session'
import { LogoMark } from '@/shared/ui/logo'

function FullPageSpinner() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <LogoMark className="h-10 w-10 animate-pulse" />
    </div>
  )
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
  const location = useLocation()

  if (isInitializing) {
    return <FullPageSpinner />
  }

  if (user) {
    // e.g. back to an invite link after signing in from it
    const from = (location.state as { from?: string } | null)?.from
    return <Navigate to={from ?? '/workspace'} replace />
  }

  return <>{children}</>
}
