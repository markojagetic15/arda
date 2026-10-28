import { FieldError, Input, Label, TextField } from '@heroui/react'
import { Eye, EyeOff } from 'lucide-react'
import { useState, type ReactNode } from 'react'
import { Controller, type Control, type FieldValues, type Path } from 'react-hook-form'

interface FormFieldProps<TFieldValues extends FieldValues> {
  control: Control<TFieldValues>
  name: Path<TFieldValues>
  label: string
  type?: 'text' | 'email' | 'password'
  placeholder?: string
  autoComplete?: string
  autoFocus?: boolean
  /** Rendered at the right of the label row, e.g. a "Forgot password?" link. */
  labelAction?: ReactNode
  /** Rendered under the input (above any validation error). */
  children?: (value: string) => ReactNode
}

export function FormField<TFieldValues extends FieldValues>({
  control,
  name,
  label,
  type = 'text',
  placeholder,
  autoComplete,
  autoFocus,
  labelAction,
  children,
}: FormFieldProps<TFieldValues>) {
  const [revealed, setRevealed] = useState(false)
  const isPassword = type === 'password'

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
          <div className="flex items-center justify-between">
            <Label className="text-sm font-medium">{label}</Label>
            {labelAction}
          </div>
          <div className="relative">
            <Input
              type={isPassword && revealed ? 'text' : type}
              placeholder={placeholder}
              autoComplete={autoComplete}
              autoFocus={autoFocus}
              className={`h-11 ${isPassword ? 'pr-11' : ''}`}
              fullWidth
            />
            {isPassword ? (
              <button
                type="button"
                onClick={() => setRevealed((value) => !value)}
                aria-label={revealed ? 'Hide password' : 'Show password'}
                className="absolute inset-y-0 right-0 flex w-11 items-center justify-center text-muted hover:text-foreground"
              >
                {revealed ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            ) : null}
          </div>
          {children?.(field.value ?? '')}
          {fieldState.error ? <FieldError>{fieldState.error.message}</FieldError> : null}
        </TextField>
      )}
    />
  )
}
