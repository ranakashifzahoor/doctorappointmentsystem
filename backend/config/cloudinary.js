import { v2 as cloudinary } from 'cloudinary'

/**
 * Configure Cloudinary only when the credentials are present.
 * When they are absent we silently fall back to local disk storage
 * (see utils/upload.js) so the app keeps working without third-party keys.
 */
const cloudinaryConnect = () => {
  try {
    if (!process.env.CLOUDINARY_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_SECRET_KEY) {
      console.log('Cloudinary not configured -> using local /uploads fallback')
      return false
    }
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_SECRET_KEY,
    })
    console.log('Cloudinary configured')
    return true
  } catch (error) {
    console.error('Cloudinary config failed:', error.message)
    return false
  }
}

export const isCloudinaryReady = () =>
  Boolean(process.env.CLOUDINARY_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_SECRET_KEY)

export default cloudinaryConnect
