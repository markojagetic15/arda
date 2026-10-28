import { httpClient } from './http-client'

export const IMAGE_TYPES = ['image/png', 'image/jpeg', 'image/gif', 'image/webp']
export const MAX_IMAGE_BYTES = 10 * 1024 * 1024

/** Uploads an image added to a page and returns its URL. Throws with a readable message on bad files. */
export async function uploadImage(pageId: string, file: File): Promise<string> {
  if (!IMAGE_TYPES.includes(file.type)) throw new Error(`"${file.name}" isn't a PNG, JPEG, GIF or WebP image.`)
  if (file.size > MAX_IMAGE_BYTES) throw new Error(`"${file.name}" is larger than 10 MB.`)
  const form = new FormData()
  form.append('pageId', pageId)
  form.append('file', file)
  const { url } = await httpClient.upload<{ url: string }>('/uploads', form)
  return url
}
