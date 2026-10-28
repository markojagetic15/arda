import * as yup from 'yup'

export const updateProfileSchema = yup.object({
  name: yup.string().trim().min(1, 'Name is required').max(120).required('Name is required'),
})

export type UpdateProfileFormValues = yup.InferType<typeof updateProfileSchema>
