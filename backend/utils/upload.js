import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { v2 as cloudinary } from 'cloudinary'
import { isCloudinaryReady } from '../config/cloudinary.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const LOCAL_DIR = path.join(__dirname, '..', 'uploads')

/**
 * Upload an image buffer and return its public URL.
 *  - Cloudinary when credentials are configured
 *  - local disk (/uploads/<file>) otherwise, so no third-party key is mandatory
 */
export const uploadImage = (buffer, mimetype, prefix = 'img') => {
  if (isCloudinaryReady()) {
    return new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        { resource_type: 'image', folder: 'prescripto' },
        (error, result) => {
          if (error) return reject(error)
          resolve(result.secure_url)
        },
      )
      stream.end(buffer)
    })
  }

  // local fallback
  if (!fs.existsSync(LOCAL_DIR)) fs.mkdirSync(LOCAL_DIR, { recursive: true })
  const ext = (mimetype || 'image/png').split('/')[1]?.replace('jpeg', 'jpg') || 'png'
  const filename = `${prefix}_${Date.now()}_${Math.round(Math.random() * 1e6)}.${ext}`
  fs.writeFileSync(path.join(LOCAL_DIR, filename), buffer)
  const base = process.env.BACKEND_URL || `http://localhost:${process.env.PORT || 4000}`
  return Promise.resolve(`${base}/uploads/${filename}`)
}
