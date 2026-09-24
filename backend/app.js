import express from 'express'
import cors from 'cors'
import 'dotenv/config'
import path from 'path'
import { fileURLToPath } from 'url'

import userRouter from './routes/userRoute.js'
import doctorRouter from './routes/doctorRoute.js'
import adminRouter from './routes/adminRoute.js'
import contactRouter from './routes/contactRoute.js'
import { notFound, errorHandler } from './middleware/errorMiddleware.js'
import { paymentStatus } from './services/paymentService.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const rootDir = path.join(__dirname, '..')

const app = express()

// ---------- global middleware ----------
app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(cors())

// serve locally-stored uploads when Cloudinary is not configured
app.use('/uploads', express.static(path.join(__dirname, 'uploads')))

// unified launcher: patient + doctor logins on one page (local development)
app.use('/portal', express.static(path.join(rootDir, 'portal')))

// ---------- routes ----------
app.get('/', (req, res) => res.json({ success: true, message: 'Prescrip API working' }))
app.get('/api/health', (req, res) =>
  res.json({
    success: true,
    message: 'API healthy',
    data: { payment: paymentStatus(), cloudinary: Boolean(process.env.CLOUDINARY_NAME) },
  }),
)

app.use('/api/user', userRouter)
app.use('/api/doctor', doctorRouter)
app.use('/api/admin', adminRouter)
app.use('/api/contact', contactRouter)

// ---------- error handling ----------
app.use(notFound)
app.use(errorHandler)

export default app
