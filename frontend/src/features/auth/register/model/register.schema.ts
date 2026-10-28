import * as yup from 'yup'

export const registerSchema = yup.object({
  name: yup.string().trim().min(1, 'Name is required').max(120).required('Name is required'),
  email: yup.string().trim().email('Enter a valid email').required('Email is required'),
  password: yup
    .string()
    .min(8, 'Must be at least 8 characters')
    .max(72, 'Must be at most 72 characters')
    .required('Password is required'),
  confirmPassword: yup
    .string()
    .oneOf([yup.ref('password')], 'Passwords must match')
    .required('Confirm your password'),
})

export type RegisterFormValues = yup.InferType<typeof registerSchema>
