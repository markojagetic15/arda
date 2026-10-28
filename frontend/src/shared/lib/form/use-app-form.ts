import { yupResolver } from '@hookform/resolvers/yup'
import { useForm, type UseFormProps } from 'react-hook-form'
import type { AnyObjectSchema, InferType } from 'yup'

/**
 * Template wrapper around React Hook Form pre-wired with a Yup schema resolver.
 * Feature slices should call this instead of `useForm` directly so validation
 * stays consistent across the app.
 */
export function useAppForm<TSchema extends AnyObjectSchema>(
  schema: TSchema,
  options?: Omit<UseFormProps<InferType<TSchema>>, 'resolver'>,
) {
  return useForm<InferType<TSchema>>({
    mode: 'onBlur',
    ...options,
    resolver: yupResolver(schema),
  })
}
