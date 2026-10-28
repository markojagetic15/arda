import { Button, Form, Spinner } from '@heroui/react'
import { useMutation } from '@tanstack/react-query'

import { userApi } from '@/entities/user'
import { useAppForm } from '@/shared/lib/form/use-app-form'
import { errorMessage } from '@/shared/api/error-message'
import { FormAlert } from '@/shared/ui/form-alert'
import { FormField } from '@/shared/ui/form-field'
import { PasswordStrengthMeter } from '@/shared/ui/password-strength-meter'

import { changePasswordSchema, type ChangePasswordFormValues } from '../model/change-password.schema'

export function ChangePasswordForm() {
  const { control, handleSubmit, reset } = useAppForm(changePasswordSchema)
  const changePassword = useMutation({ mutationFn: userApi.changePassword })

  const onSubmit = (values: ChangePasswordFormValues) => {
    changePassword.mutate(values, { onSuccess: () => reset({ currentPassword: '', newPassword: '' }) })
  }

  return (
    <Form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
      {changePassword.isError ? <FormAlert>{errorMessage(changePassword.error)}</FormAlert> : null}
      {changePassword.isSuccess ? (
        <FormAlert tone="success">Password changed. Other devices have been signed out.</FormAlert>
      ) : null}
      <FormField
        control={control}
        name="currentPassword"
        label="Current password"
        type="password"
        autoComplete="current-password"
      />
      <FormField
        control={control}
        name="newPassword"
        label="New password"
        type="password"
        placeholder="At least 8 characters"
        autoComplete="new-password"
      >
        {(value) => <PasswordStrengthMeter password={value} />}
      </FormField>
      <Button type="submit" isDisabled={changePassword.isPending} className="self-start font-semibold">
        {changePassword.isPending ? <Spinner size="sm" color="current" /> : 'Update password'}
      </Button>
    </Form>
  )
}
