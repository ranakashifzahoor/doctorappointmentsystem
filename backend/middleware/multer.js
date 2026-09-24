import multer from 'multer'

// keep the file in memory, then push it to Cloudinary (or local disk)
const storage = multer.memoryStorage()

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
  fileFilter: (req, file, cb) => {
    const ok = /^image\/(jpe?g|png|webp|gif)$/.test(file.mimetype)
    if (!ok) return cb(new Error('Only image files are allowed'))
    cb(null, true)
  },
})

export default upload
