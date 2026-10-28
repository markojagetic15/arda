import { Link, useLocation, useNavigate } from 'react-router-dom'

import { LoginForm } from '@/features/auth/login'
import { AuthLayout } from '@/shared/ui/auth-layout'

export function LoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const from = (location.state as { from?: string } | null)?.from ?? '/profile'

  return (
    <AuthLayout
      title="Sign in"
      description="Welcome back to Arda."
      footer={
        <>
          <Link to="/forgot-password" className="underline">
            Forgot password?
          </Link>
          <span>·</span>
          <Link to="/register" className="underline">
            Create an account
          </Link>
        </>
      }
    >
      <LoginForm onSuccess={() => navigate(from, { replace: true })} />
    </AuthLayout>
  )
}
