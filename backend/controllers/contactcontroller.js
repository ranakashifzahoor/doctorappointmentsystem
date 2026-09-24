import validator from 'validator'
import contactModel from '../models/contactModel.js'
import { notify } from '../services/emailService.js'
import { ok, fail } from '../middleware/errorMiddleware.js'

/** POST /api/contact (public) — store a contact message from the website. */
export const createMessage = async (req, res) => {
  try {
    const { name, email, subject, message } = req.body
    if (!name || !email || !message) return fail(res, 'Name, email and message are required')
    if (!validator.isEmail(email)) return fail(res, 'Please enter a valid email')

    const saved = await contactModel.create({ name, email, subject: subject || 'General enquiry', message })
    notify('contact-message', { from: email })
    return ok(res, 'Thanks! Your message has been received.', { message: saved }, 201)
  } catch (error) {
    return fail(res, error.message)
  }
}
