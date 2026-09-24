import jwt from 'jsonwebtoken'

const authUser = async (req, res, next) => {
  const token = extractToken(req)
  if (!token) return res.status(401).json({ success: false, message: 'Not Authorized, login again' })

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    if (!decoded?.id) throw new Error('bad token')
    req.userId = decoded.id
    next()
  } catch (error) {
    return res.status(401).json({ success: false, message: 'Invalid or expired token, login again' })
  }
}

export function extractToken(req) {
  const header = req.headers.authorization || req.headers.token || ''
  if (header.startsWith('Bearer ')) return header.slice(7).trim()
  return header.trim()
}

export default authUser
