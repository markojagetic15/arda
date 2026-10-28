import { Alert, Button, Form, Spinner } from '@heroui/react'
import { useMutation } from '@tanstack/react-query'

import { authApi } from '@/entities/session'
import { HttpError } from '@/shared/api/http-client'
import { useAppForm } from '@/shared/lib/form/use-app-form'
import { FormField } from '@/shared/ui/form-field'

import { resetPasswordSchema, type ResetPasswordFormValues } from '../model/reset-password.schema'

export function ResetPasswordForm({ token, onSuccess }: { token: string; onSuccess?: () => void }) {
  const { control, handleSubmit } = useAppForm(resetPasswordSchema)
  const resetPassword = useMutation({ mutationFn: authApi.resetPassword })

  const onSubmit = (values: ResetPasswordFormValues) => {
    resetPassword.mutate({ token, newPassword: values.newPassword }, { onSuccess })
  }

  return (
    <Form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
      {resetPassword.isError ? (
        <Alert status="danger">
          <Alert.Description>
            {resetPassword.error instanceof HttpError
              ? resetPassword.error.message
              : 'Something went wrong.'}
          </Alert.Description>
        </Alert>
      ) : null}

      <FormField
        control={control}
        name="newPassword"
        label="New password"
        type="password"
        autoComplete="new-password"
      />
      <FormField
        control={control}
        name="confirmPassword"
        label="Confirm new password"
        type="password"
        autoComplete="new-password"
      />

      <Button type="submit" isDisabled={resetPassword.isPending} fullWidth>
        {resetPassword.isPending ? <Spinner size="sm" /> : 'Reset password'}
      </Button>
    </Form>
  )
}
