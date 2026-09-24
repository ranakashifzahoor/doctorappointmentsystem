import jwt from 'jsonwebtoken'
import { extractToken } from './authUser.js'

const authAdmin = async (req, res, next) => {
  const token = extractToken(req)
  if (!token) return res.status(401).json({ success: false, message: 'Not Authorized, login again' })

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    if (decoded?.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Admin access required' })
    }
    req.admin = decoded
    next()
  } catch (error) {
    return res.status(401).json({ success: false, message: 'Invalid or expired token, login again' })
  }
}

export default authAdmin
