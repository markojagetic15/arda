import * as yup from 'yup'

export const registerSchema = yup.object({
  name: yup.string().trim().min(1, 'Name is required').max(120).required('Name is required'),
  email: yup.string().trim().email('Enter a valid email').required('Email is required'),
  password: yup
    .string()
    .min(8, 'Use at least 8 characters')
    .max(72, 'Use at most 72 characters')
    .required('Password is required'),
})

export type RegisterFormValues = yup.InferType<typeof registerSchema>
