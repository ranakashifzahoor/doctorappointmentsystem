export const notFound = (req, res, next) => {
  res.status(404).json({ success: false, message: `Route not found: ${req.method} ${req.originalUrl}` })
}

// eslint-disable-next-line no-unused-vars
export const errorHandler = (err, req, res, next) => {
  console.error('Unhandled error:', err)
  const status = err.statusCode || (err.name === 'MulterError' ? 400 : 500)
  res.status(status).json({ success: false, message: err.message || 'Internal server error' })
}

/** Small helper so every controller answers in the same envelope. */
export const ok = (res, message = '', data = undefined, status = 200) =>
  res.status(status).json({ success: true, message, ...(data !== undefined ? { data } : {}) })

export const fail = (res, message = 'Something went wrong', status = 400) =>
  res.status(status).json({ success: false, message })
