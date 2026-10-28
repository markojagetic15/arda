import { Alert, Button, Form, Spinner } from '@heroui/react'

import { HttpError } from '@/shared/api/http-client'
import { useAppForm } from '@/shared/lib/form/use-app-form'
import { FormField } from '@/shared/ui/form-field'

import { loginSchema, type LoginFormValues } from '../model/login.schema'
import { useLogin } from '../model/use-login'

export function LoginForm({ onSuccess }: { onSuccess?: () => void }) {
  const { control, handleSubmit } = useAppForm(loginSchema)
  const login = useLogin()

  const onSubmit = (values: LoginFormValues) => {
    login.mutate(values, { onSuccess })
  }

  return (
    <Form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
      {login.isError ? (
        <Alert status="danger">
          <Alert.Description>
            {login.error instanceof HttpError ? login.error.message : 'Something went wrong.'}
          </Alert.Description>
        </Alert>
      ) : null}

      <FormField control={control} name="email" label="Email" type="email" autoComplete="email" />
      <FormField
        control={control}
        name="password"
        label="Password"
        type="password"
        autoComplete="current-password"
      />

      <Button type="submit" isDisabled={login.isPending} fullWidth>
        {login.isPending ? <Spinner size="sm" /> : 'Sign in'}
      </Button>
    </Form>
  )
}
