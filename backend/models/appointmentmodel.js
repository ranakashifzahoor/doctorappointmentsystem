import mongoose from 'mongoose'

/**
 * We snapshot only the *non-sensitive* patient/doctor information that the UI
 * needs at display time (name, image, speciality, address...). Passwords and
 * other credentials are never copied into an appointment.
 */
const appointmentSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true, index: true },
    doctorId: { type: String, required: true, index: true },

    userData: { type: Object, required: true },
    doctorData: { type: Object, required: true },

    amount: { type: Number, required: true },

    slotDate: { type: String, required: true }, // YYYY-MM-DD
    slotTime: { type: String, required: true }, // HH:mm

    payment: { type: Boolean, default: false },
    paymentMethod: { type: String, default: 'Online' }, // Online | Cash
    paymentRef: { type: String, default: '' },

    isCompleted: { type: Boolean, default: false },
    cancelled: { type: Boolean, default: false },

    // date + time combined for easy sorting
    createdAt: { type: Number },
  },
  { minimize: false, timestamps: true },
)

appointmentSchema.index({ doctorId: 1, slotDate: 1, slotTime: 1 })

const appointmentModel =
  mongoose.models.appointment || mongoose.model('appointment', appointmentSchema)

export default appointmentModel
