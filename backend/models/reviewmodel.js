import mongoose from 'mongoose'

const reviewSchema = new mongoose.Schema(
  {
    doctorId: { type: String, required: true, index: true },
    userId: { type: String, required: true, index: true },
    appointmentId: { type: String, required: true, unique: true }, // one review per appointment
    userName: { type: String, default: 'Patient' },
    userImage: { type: String, default: '' },
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, default: '' },
  },
  { timestamps: true },
)

const reviewModel = mongoose.models.review || mongoose.model('review', reviewSchema)

export default reviewModel
