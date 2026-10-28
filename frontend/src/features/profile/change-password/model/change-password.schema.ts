import * as yup from 'yup'

export const changePasswordSchema = yup.object({
  currentPassword: yup.string().required('Enter your current password'),
  newPassword: yup
    .string()
    .min(8, 'Use at least 8 characters')
    .max(72, 'Use at most 72 characters')
    .notOneOf([yup.ref('currentPassword')], 'Choose a different password')
    .required('Choose a new password'),
})

export type ChangePasswordFormValues = yup.InferType<typeof changePasswordSchema>
