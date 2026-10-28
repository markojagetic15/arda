import * as yup from 'yup'

export const resetPasswordSchema = yup.object({
  newPassword: yup
    .string()
    .min(8, 'Use at least 8 characters')
    .max(72, 'Use at most 72 characters')
    .required('Password is required'),
})

export type ResetPasswordFormValues = yup.InferType<typeof resetPasswordSchema>
