import { Button, Form, Spinner } from '@heroui/react'

import type { User } from '@/entities/user'
import { useAppForm } from '@/shared/lib/form/use-app-form'
import { errorMessage } from '@/shared/api/error-message'
import { FormAlert } from '@/shared/ui/form-alert'
import { FormField } from '@/shared/ui/form-field'

import { updateProfileSchema, type UpdateProfileFormValues } from '../model/update-profile.schema'
import { useUpdateProfile } from '../model/use-update-profile'

interface UpdateProfileFormProps {
  user: User
}

export function UpdateProfileForm({ user }: UpdateProfileFormProps) {
  const { control, handleSubmit } = useAppForm(updateProfileSchema, {
    defaultValues: { name: user.name },
  })
  const updateProfile = useUpdateProfile()

  const onSubmit = (values: UpdateProfileFormValues) => {
    updateProfile.mutate(values)
  }

  return (
    <Form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
      {updateProfile.isError ? <FormAlert>{errorMessage(updateProfile.error)}</FormAlert> : null}
      {updateProfile.isSuccess ? <FormAlert tone="success">Your name was updated.</FormAlert> : null}

      <FormField control={control} name="name" label="Display name" autoComplete="name" />
      <div className="flex flex-col gap-1.5">
        <span className="text-sm font-medium">Email</span>
        <p className="flex h-11 items-center rounded-[var(--field-radius)] border border-border bg-surface-secondary px-3 text-sm text-muted">
          {user.email}
        </p>
      </div>

      <Button type="submit" isDisabled={updateProfile.isPending} className="self-start font-semibold">
        {updateProfile.isPending ? <Spinner size="sm" color="current" /> : 'Save changes'}
      </Button>
    </Form>
  )
}
