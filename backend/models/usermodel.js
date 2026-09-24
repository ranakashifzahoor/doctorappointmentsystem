import mongoose from 'mongoose'

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true },
    image: { type: String, default: '' },
    phone: { type: String, default: '0000000000' },
    address: {
      line1: { type: String, default: '' },
      line2: { type: String, default: '' },
    },
    gender: { type: String, enum: ['Not Selected', 'Male', 'Female', 'Other'], default: 'Not Selected' },
    dob: { type: String, default: 'Not Selected' },
  },
  { minimize: false, timestamps: true },
)

const userModel = mongoose.models.user || mongoose.model('user', userSchema)

export default userModel
