/**
 * Vercel serverless entry point.
 * The Express app is exported as a single function; vercel.json rewrites all
 * paths to it. MongoDB connects once per cold start (mongoose buffers queries
 * until the connection is ready).
 *
 * Required env vars on Vercel: MONGODB_URI, JWT_SECRET, ADMIN_EMAIL,
 * ADMIN_PASSWORD, PAYMENT_DEMO / PAYMENT_* and optionally CLOUDINARY_*.
 */
import mongoose from 'mongoose'
import app from '../app.js'
import cloudinaryConnect from '../config/cloudinary.js'

if (process.env.MONGODB_URI) {
  mongoose
    .connect(process.env.MONGODB_URI)
    .then(() => console.log('MongoDB connected (serverless)'))
    .catch((err) => console.error('MongoDB connection failed:', err.message))
} else {
  console.error('MONGODB_URI is not set — set it in the Vercel project environment variables')
}

cloudinaryConnect()

export default app
