import mongoose from 'mongoose'

const contactSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true, lowercase: true },
    subject: { type: String, default: 'General enquiry' },
    message: { type: String, required: true },
    read: { type: Boolean, default: false },
  },
  { timestamps: true },
)

const contactModel = mongoose.models.contact || mongoose.model('contact', contactSchema)

export default contactModel
