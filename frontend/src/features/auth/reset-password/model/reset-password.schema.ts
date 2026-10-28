import * as yup from 'yup'

export const resetPasswordSchema = yup.object({
  newPassword: yup
    .string()
    .min(8, 'Must be at least 8 characters')
    .max(72, 'Must be at most 72 characters')
    .required('Password is required'),
  confirmPassword: yup
    .string()
    .oneOf([yup.ref('newPassword')], 'Passwords must match')
    .required('Confirm your new password'),
})

export type ResetPasswordFormValues = yup.InferType<typeof resetPasswordSchema>
