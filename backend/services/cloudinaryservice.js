import { uploadImage } from '../utils/upload.js'

/**
 * Thin service layer around image uploads so controllers stay provider-agnostic.
 * Returns a public URL string (Cloudinary when configured, local disk otherwise).
 */
export const storeImage = async (file, prefix = 'img') => {
  if (!file) return ''
  return uploadImage(file.buffer, file.mimetype, prefix)
}

export default { storeImage }
