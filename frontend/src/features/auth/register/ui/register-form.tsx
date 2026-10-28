import { Alert, Button, Form, Spinner } from '@heroui/react'

import { HttpError } from '@/shared/api/http-client'
import { useAppForm } from '@/shared/lib/form/use-app-form'
import { FormField } from '@/shared/ui/form-field'

import { registerSchema, type RegisterFormValues } from '../model/register.schema'
import { useRegister } from '../model/use-register'

export function RegisterForm({ onSuccess }: { onSuccess?: () => void }) {
  const { control, handleSubmit } = useAppForm(registerSchema)
  const register = useRegister()

  const onSubmit = (values: RegisterFormValues) => {
    register.mutate(values, { onSuccess })
  }

  return (
    <Form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
      {register.isError ? (
        <Alert status="danger">
          <Alert.Description>
            {register.error instanceof HttpError ? register.error.message : 'Something went wrong.'}
          </Alert.Description>
        </Alert>
      ) : null}

      <FormField control={control} name="name" label="Name" autoComplete="name" />
      <FormField control={control} name="email" label="Email" type="email" autoComplete="email" />
      <FormField
        control={control}
        name="password"
        label="Password"
        type="password"
        autoComplete="new-password"
      />
      <FormField
        control={control}
        name="confirmPassword"
        label="Confirm password"
        type="password"
        autoComplete="new-password"
      />

      <Button type="submit" isDisabled={register.isPending} fullWidth>
        {register.isPending ? <Spinner size="sm" /> : 'Create account'}
      </Button>
    </Form>
  )
}
