import jwt from 'jsonwebtoken'
import { extractToken } from './authUser.js'

const authDoctor = async (req, res, next) => {
  const token = extractToken(req)
  if (!token) return res.status(401).json({ success: false, message: 'Not Authorized, login again' })

  try {
    // `role` guards against a patient/admin token being used on doctor routes
    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    if (!decoded?.id) throw new Error('bad token')
    if (decoded.role && decoded.role !== 'doctor') {
      return res.status(403).json({ success: false, message: 'Doctor access required' })
    }
    req.doctorId = decoded.id
    next()
  } catch (error) {
    return res.status(401).json({ success: false, message: 'Invalid or expired token, login again' })
  }
}

export default authDoctor
