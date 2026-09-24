import mongoose from 'mongoose'

/**
 * Connect to MongoDB. Throws a short, actionable error instead of exiting
 * silently so the failure is obvious when running `npm run dev`.
 */
const connectDB = async () => {
  const uri = process.env.MONGODB_URI

  if (!uri) {
    throw new Error(
      'MONGODB_URI is not set. Copy backend/.env.example to backend/.env and set MONGODB_URI.',
    )
  }

  mongoose.connection.on('connected', () => console.log('MongoDB connected'))
  mongoose.connection.on('disconnected', () => console.warn('MongoDB disconnected'))
  mongoose.connection.on('error', (err) => console.error('MongoDB error:', err.message))

  try {
    // fail fast (8s) instead of hanging for the default 30s
    await mongoose.connect(uri, { serverSelectionTimeoutMS: 8000 })
  } catch (error) {
    throw new Error(
      `Could not connect to MongoDB at ${uri}\n` +
        '  Is the MongoDB service running?  Windows: Services -> MongoDB Server -> Start\n' +
        '  Or point MONGODB_URI at a MongoDB Atlas cluster.',
    )
  }
}

export default connectDB
