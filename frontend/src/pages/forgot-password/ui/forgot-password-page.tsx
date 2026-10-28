import { ArrowLeft } from 'lucide-react'
import { Link } from 'react-router-dom'

import { ForgotPasswordForm } from '@/features/auth/forgot-password'
import { AuthLayout } from '@/shared/ui/auth-layout'

export function ForgotPasswordPage() {
  return (
    <AuthLayout
      title="Forgot your password?"
      description="Enter your email and we'll send you a link to choose a new one."
      footer={
        <Link to="/login" className="inline-flex items-center gap-1.5 font-semibold text-accent hover:underline">
          <ArrowLeft className="h-4 w-4" /> Back to sign in
        </Link>
      }
    >
      <ForgotPasswordForm />
    </AuthLayout>
  )
}
