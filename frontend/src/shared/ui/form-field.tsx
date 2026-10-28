import { FieldError, Input, Label, TextField } from '@heroui/react'
import { Controller, type Control, type FieldValues, type Path } from 'react-hook-form'

interface FormFieldProps<TFieldValues extends FieldValues> {
  control: Control<TFieldValues>
  name: Path<TFieldValues>
  label: string
  type?: 'text' | 'email' | 'password'
  placeholder?: string
  autoComplete?: string
}

export function FormField<TFieldValues extends FieldValues>({
  control,
  name,
  label,
  type = 'text',
  placeholder,
  autoComplete,
}: FormFieldProps<TFieldValues>) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => (
        <TextField
          value={field.value ?? ''}
          onChange={field.onChange}
          onBlur={field.onBlur}
          name={field.name}
          isInvalid={!!fieldState.error}
          className="flex flex-col gap-1.5"
        >
          <Label>{label}</Label>
          <Input type={type} placeholder={placeholder} autoComplete={autoComplete} fullWidth />
          {fieldState.error ? <FieldError>{fieldState.error.message}</FieldError> : null}
        </TextField>
      )}
    />
  )
}
