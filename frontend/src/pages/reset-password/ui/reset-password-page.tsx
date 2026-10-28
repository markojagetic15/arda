import { ArrowLeft } from 'lucide-react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'

import { ResetPasswordForm } from '@/features/auth/reset-password'
import { AuthLayout } from '@/shared/ui/auth-layout'
import { FormAlert } from '@/shared/ui/form-alert'

export function ResetPasswordPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const token = searchParams.get('token')

  return (
    <AuthLayout
      title="Choose a new password"
      description="Pick something you haven't used before."
      footer={
        <Link to="/login" className="inline-flex items-center gap-1.5 font-semibold text-accent hover:underline">
          <ArrowLeft className="h-4 w-4" /> Back to sign in
        </Link>
      }
    >
      {token ? (
        <ResetPasswordForm token={token} onSuccess={() => navigate('/login', { replace: true })} />
      ) : (
        <FormAlert>This reset link is incomplete. Please request a new one.</FormAlert>
      )}
    </AuthLayout>
  )
}
