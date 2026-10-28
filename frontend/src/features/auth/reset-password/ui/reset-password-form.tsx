import { Button, Form, Spinner } from '@heroui/react'
import { useMutation } from '@tanstack/react-query'

import { authApi } from '@/entities/session'
import { useAppForm } from '@/shared/lib/form/use-app-form'
import { errorMessage } from '@/shared/api/error-message'
import { FormAlert } from '@/shared/ui/form-alert'
import { FormField } from '@/shared/ui/form-field'
import { PasswordStrengthMeter } from '@/shared/ui/password-strength-meter'

import { resetPasswordSchema, type ResetPasswordFormValues } from '../model/reset-password.schema'

export function ResetPasswordForm({ token, onSuccess }: { token: string; onSuccess?: () => void }) {
  const { control, handleSubmit } = useAppForm(resetPasswordSchema)
  const resetPassword = useMutation({ mutationFn: authApi.resetPassword })

  const onSubmit = (values: ResetPasswordFormValues) => {
    resetPassword.mutate({ token, newPassword: values.newPassword }, { onSuccess })
  }

  return (
    <Form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5">
      {resetPassword.isError ? <FormAlert>{errorMessage(resetPassword.error)}</FormAlert> : null}

      <FormField
        control={control}
        name="newPassword"
        label="New password"
        type="password"
        placeholder="At least 8 characters"
        autoComplete="new-password"
        autoFocus
      >
        {(value) => <PasswordStrengthMeter password={value} />}
      </FormField>

      <Button type="submit" isDisabled={resetPassword.isPending} fullWidth size="lg" className="h-11 font-semibold">
        {resetPassword.isPending ? <Spinner size="sm" color="current" /> : 'Save new password'}
      </Button>
    </Form>
  )
}
