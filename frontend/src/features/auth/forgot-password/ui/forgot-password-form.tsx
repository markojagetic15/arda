import { Button, Form, Spinner } from '@heroui/react'
import { useMutation } from '@tanstack/react-query'
import { MailCheck } from 'lucide-react'

import { authApi } from '@/entities/session'
import { useAppForm } from '@/shared/lib/form/use-app-form'
import { errorMessage } from '@/shared/api/error-message'
import { FormAlert } from '@/shared/ui/form-alert'
import { FormField } from '@/shared/ui/form-field'

import { forgotPasswordSchema, type ForgotPasswordFormValues } from '../model/forgot-password.schema'

export function ForgotPasswordForm() {
  const { control, handleSubmit, getValues } = useAppForm(forgotPasswordSchema)
  const requestReset = useMutation({ mutationFn: authApi.requestPasswordReset })

  const onSubmit = (values: ForgotPasswordFormValues) => {
    requestReset.mutate(values)
  }

  if (requestReset.isSuccess) {
    return (
      <div className="flex flex-col items-center rounded-2xl border border-border bg-surface p-6 text-center animate-fade-in">
        <span className="flex h-12 w-12 items-center justify-center rounded-full bg-accent-soft text-accent">
          <MailCheck className="h-6 w-6" />
        </span>
        <p className="mt-4 font-semibold">Check your inbox</p>
        <p className="mt-1 text-sm text-muted">
          If an account exists for <span className="font-medium text-foreground">{getValues('email')}</span>, a
          reset link is on its way. It expires in 15 minutes.
        </p>
      </div>
    )
  }

  return (
    <Form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5">
      {requestReset.isError ? <FormAlert>{errorMessage(requestReset.error)}</FormAlert> : null}

      <FormField
        control={control}
        name="email"
        label="Email"
        type="email"
        placeholder="you@company.com"
        autoComplete="email"
        autoFocus
      />

      <Button type="submit" isDisabled={requestReset.isPending} fullWidth size="lg" className="h-11 font-semibold">
        {requestReset.isPending ? <Spinner size="sm" color="current" /> : 'Send reset link'}
      </Button>
    </Form>
  )
}
