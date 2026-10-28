import { Link } from 'react-router-dom'

import { ForgotPasswordForm } from '@/features/auth/forgot-password'
import { AuthLayout } from '@/shared/ui/auth-layout'

export function ForgotPasswordPage() {
  return (
    <AuthLayout
      title="Reset your password"
      description="We'll email you a link to choose a new password."
      footer={
        <Link to="/login" className="underline">
          Back to sign in
        </Link>
      }
    >
      <ForgotPasswordForm />
    </AuthLayout>
  )
}
