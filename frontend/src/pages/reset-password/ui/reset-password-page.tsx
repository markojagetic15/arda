import { Alert } from '@heroui/react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'

import { ResetPasswordForm } from '@/features/auth/reset-password'
import { AuthLayout } from '@/shared/ui/auth-layout'

export function ResetPasswordPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const token = searchParams.get('token')

  return (
    <AuthLayout
      title="Choose a new password"
      footer={
        <Link to="/login" className="underline">
          Back to sign in
        </Link>
      }
    >
      {token ? (
        <ResetPasswordForm
          token={token}
          onSuccess={() => navigate('/login', { replace: true })}
        />
      ) : (
        <Alert status="danger">
          <Alert.Description>
            This reset link is missing its token. Please request a new one.
          </Alert.Description>
        </Alert>
      )}
    </AuthLayout>
  )
}
