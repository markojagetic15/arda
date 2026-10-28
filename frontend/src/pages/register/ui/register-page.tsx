import { Link, useNavigate } from 'react-router-dom'

import { RegisterForm } from '@/features/auth/register'
import { AuthLayout } from '@/shared/ui/auth-layout'

export function RegisterPage() {
  const navigate = useNavigate()

  return (
    <AuthLayout
      title="Create an account"
      description="Start collaborating in Arda."
      footer={
        <>
          Already have an account?
          <Link to="/login" className="underline">
            Sign in
          </Link>
        </>
      }
    >
      <RegisterForm onSuccess={() => navigate('/profile', { replace: true })} />
    </AuthLayout>
  )
}
