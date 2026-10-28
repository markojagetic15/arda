import { Button, Form, Spinner } from '@heroui/react'
import { ArrowRight } from 'lucide-react'
import { Link } from 'react-router-dom'

import { useAppForm } from '@/shared/lib/form/use-app-form'
import { errorMessage } from '@/shared/api/error-message'
import { FormAlert } from '@/shared/ui/form-alert'
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
    <Form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5">
      {login.isError ? <FormAlert>{errorMessage(login.error)}</FormAlert> : null}

      <FormField
        control={control}
        name="email"
        label="Email"
        type="email"
        placeholder="you@company.com"
        autoComplete="email"
        autoFocus
      />
      <FormField
        control={control}
        name="password"
        label="Password"
        type="password"
        placeholder="Your password"
        autoComplete="current-password"
        labelAction={
          <Link to="/forgot-password" className="text-xs font-medium text-accent hover:underline">
            Forgot password?
          </Link>
        }
      />

      <Button type="submit" isDisabled={login.isPending} fullWidth size="lg" className="mt-1 h-11 font-semibold">
        {login.isPending ? (
          <Spinner size="sm" color="current" />
        ) : (
          <>
            Sign in <ArrowRight className="h-4 w-4" />
          </>
        )}
      </Button>
    </Form>
  )
}
