import { Card } from '@heroui/react'
import type { PropsWithChildren, ReactNode } from 'react'

interface AuthLayoutProps {
  title: string
  description?: ReactNode
  footer?: ReactNode
}

export function AuthLayout({ title, description, footer, children }: PropsWithChildren<AuthLayoutProps>) {
  return (
    <main className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-sm">
        <Card.Header>
          <Card.Title>{title}</Card.Title>
          {description ? <Card.Description>{description}</Card.Description> : null}
        </Card.Header>
        <Card.Content>{children}</Card.Content>
        {footer ? (
          <Card.Footer className="flex justify-center gap-2 text-sm">{footer}</Card.Footer>
        ) : null}
      </Card>
    </main>
  )
}
