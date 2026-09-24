import jwt from 'jsonwebtoken'

/**
 * Issue a JWT. `role` is embedded so each middleware can enforce
 * role-based authorization (user | doctor | admin).
 */
const generateToken = (id, role = 'user', expiresIn = '7d') =>
  jwt.sign({ id, role }, process.env.JWT_SECRET, { expiresIn })

export default generateToken
