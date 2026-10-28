import { Alert, Button, Form, Spinner } from '@heroui/react'
import { useMutation } from '@tanstack/react-query'

import { authApi } from '@/entities/session'
import { HttpError } from '@/shared/api/http-client'
import { useAppForm } from '@/shared/lib/form/use-app-form'
import { FormField } from '@/shared/ui/form-field'

import { forgotPasswordSchema, type ForgotPasswordFormValues } from '../model/forgot-password.schema'

export function ForgotPasswordForm() {
  const { control, handleSubmit } = useAppForm(forgotPasswordSchema)
  const requestReset = useMutation({ mutationFn: authApi.requestPasswordReset })

  const onSubmit = (values: ForgotPasswordFormValues) => {
    requestReset.mutate(values)
  }

  if (requestReset.isSuccess) {
    return (
      <Alert status="success">
        <Alert.Description>
          If an account exists for that email, a password reset link is on its way.
        </Alert.Description>
      </Alert>
    )
  }

  return (
    <Form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
      {requestReset.isError ? (
        <Alert status="danger">
          <Alert.Description>
            {requestReset.error instanceof HttpError
              ? requestReset.error.message
              : 'Something went wrong.'}
          </Alert.Description>
        </Alert>
      ) : null}

      <FormField control={control} name="email" label="Email" type="email" autoComplete="email" />

      <Button type="submit" isDisabled={requestReset.isPending} fullWidth>
        {requestReset.isPending ? <Spinner size="sm" /> : 'Send reset link'}
      </Button>
    </Form>
  )
}
