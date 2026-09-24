import mongoose from 'mongoose'

const doctorSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true },
    image: { type: String, default: '' },
    speciality: { type: String, required: true },
    degree: { type: String, required: true },
    experience: { type: String, required: true },
    about: { type: String, required: true },
    fee: { type: Number, required: true },
    address: {
      line1: { type: String, default: '' },
      line2: { type: String, default: '' },
    },
    available: { type: Boolean, default: true },
    // doctors self-registering start unverified until an admin approves them
    verified: { type: Boolean, default: false },
    verificationNote: { type: String, default: '' },
    // { "YYYY-MM-DD": ["10:00", "10:30", ...] } -> booked times per date
    slots_booked: { type: Object, default: {} },
    date: { type: Number, required: true },
  },
  { minimize: false, timestamps: true },
)

const doctorModel = mongoose.models.doctor || mongoose.model('doctor', doctorSchema)

export default doctorModel
