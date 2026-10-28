import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom'

import { RegisterForm } from '@/features/auth/register'
import { AuthLayout } from '@/shared/ui/auth-layout'

export function RegisterPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const [searchParams] = useSearchParams()
  const from = (location.state as { from?: string } | null)?.from ?? '/workspace'

  return (
    <AuthLayout
      title="Create your account"
      description="Set up your workspace in under a minute."
      footer={
        <>
          Already have an account?{' '}
          <Link to="/login" state={location.state} className="font-semibold text-accent hover:underline">
            Sign in
          </Link>
        </>
      }
    >
      <RegisterForm
        defaultEmail={searchParams.get('email') ?? undefined}
        onSuccess={() => navigate(from, { replace: true })}
      />
    </AuthLayout>
  )
}
