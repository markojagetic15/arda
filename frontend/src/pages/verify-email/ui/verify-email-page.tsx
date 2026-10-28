import { Spinner } from '@heroui/react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { CheckCircle2 } from 'lucide-react'
import { useEffect, useRef } from 'react'
import { Link, useSearchParams } from 'react-router-dom'

import { authApi, ME_QUERY_KEY } from '@/entities/session'
import { errorMessage } from '@/shared/api/error-message'
import { AuthLayout } from '@/shared/ui/auth-layout'
import { FormAlert } from '@/shared/ui/form-alert'

export function VerifyEmailPage() {
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token') ?? ''
  const queryClient = useQueryClient()
  const verify = useMutation({
    mutationFn: authApi.verifyEmail,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ME_QUERY_KEY }),
  })
  const started = useRef(false)

  // Runs once; the ref guards against Strict Mode's double effect in development.
  useEffect(() => {
    if (token && !started.current) {
      started.current = true
      verify.mutate({ token })
    }
  }, [token, verify])

  return (
    <AuthLayout
      title={verify.isSuccess ? 'Email confirmed' : 'Confirming your email'}
      footer={
        <Link to="/workspace" className="font-semibold text-accent hover:underline">
          Go to your workspace
        </Link>
      }
    >
      {!token ? (
        <FormAlert>This confirmation link is incomplete. Request a new one from the banner in your workspace.</FormAlert>
      ) : verify.isError ? (
        <FormAlert>{errorMessage(verify.error)}</FormAlert>
      ) : verify.isSuccess ? (
        <div className="flex flex-col items-center rounded-2xl border border-border bg-surface p-6 text-center animate-fade-in">
          <CheckCircle2 className="h-10 w-10 text-success" />
          <p className="mt-3 font-semibold">Thanks, {verify.data.name.split(' ')[0]}!</p>
          <p className="mt-1 text-sm text-muted">{verify.data.email} is confirmed.</p>
        </div>
      ) : (
        <div className="flex justify-center py-8">
          <Spinner />
        </div>
      )}
    </AuthLayout>
  )
}
