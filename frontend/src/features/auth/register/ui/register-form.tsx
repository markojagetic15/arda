import { Button, Form, Spinner } from '@heroui/react'
import { ArrowRight } from 'lucide-react'

import { useAppForm } from '@/shared/lib/form/use-app-form'
import { errorMessage } from '@/shared/api/error-message'
import { FormAlert } from '@/shared/ui/form-alert'
import { FormField } from '@/shared/ui/form-field'
import { PasswordStrengthMeter } from '@/shared/ui/password-strength-meter'

import { registerSchema, type RegisterFormValues } from '../model/register.schema'
import { useRegister } from '../model/use-register'

export function RegisterForm({ onSuccess, defaultEmail }: { onSuccess?: () => void; defaultEmail?: string }) {
  const { control, handleSubmit } = useAppForm(registerSchema, {
    defaultValues: { name: '', email: defaultEmail ?? '', password: '' },
  })
  const register = useRegister()

  const onSubmit = (values: RegisterFormValues) => {
    register.mutate(values, { onSuccess })
  }

  return (
    <Form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5">
      {register.isError ? <FormAlert>{errorMessage(register.error)}</FormAlert> : null}

      <FormField
        control={control}
        name="name"
        label="Full name"
        placeholder="Ana Horvat"
        autoComplete="name"
        autoFocus
      />
      <FormField
        control={control}
        name="email"
        label="Work email"
        type="email"
        placeholder="you@company.com"
        autoComplete="email"
      />
      <FormField
        control={control}
        name="password"
        label="Password"
        type="password"
        placeholder="At least 8 characters"
        autoComplete="new-password"
      >
        {(value) => <PasswordStrengthMeter password={value} />}
      </FormField>

      <Button type="submit" isDisabled={register.isPending} fullWidth size="lg" className="mt-1 h-11 font-semibold">
        {register.isPending ? (
          <Spinner size="sm" color="current" />
        ) : (
          <>
            Create free account <ArrowRight className="h-4 w-4" />
          </>
        )}
      </Button>
      <p className="text-center text-xs text-muted">
        By creating an account you agree to use proarda responsibly and keep your password safe.
      </p>
    </Form>
  )
}
