import type { PropsWithChildren } from 'react'
import { BrowserRouter } from 'react-router-dom'

import { AuthProvider } from '@/entities/session'
import { ThemeProvider } from '@/shared/lib/theme'
import { ErrorBoundary } from '@/shared/ui/error-boundary'

import { QueryProvider } from './query-provider'

export function AppProviders({ children }: PropsWithChildren) {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <QueryProvider>
          <BrowserRouter>
            <AuthProvider>{children}</AuthProvider>
          </BrowserRouter>
        </QueryProvider>
      </ThemeProvider>
    </ErrorBoundary>
  )
}
