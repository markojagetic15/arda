import { Link, useLocation, useNavigate } from 'react-router-dom'

import { LoginForm } from '@/features/auth/login'
import { AuthLayout } from '@/shared/ui/auth-layout'

export function LoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const from = (location.state as { from?: string } | null)?.from ?? '/workspace'

  return (
    <AuthLayout
      title="Welcome back"
      description="Sign in to pick up where your team left off."
      footer={
        <>
          New to proarda?{' '}
          <Link to="/register" state={location.state} className="font-semibold text-accent hover:underline">
            Create an account
          </Link>
        </>
      }
    >
      <LoginForm onSuccess={() => navigate(from, { replace: true })} />
    </AuthLayout>
  )
}
