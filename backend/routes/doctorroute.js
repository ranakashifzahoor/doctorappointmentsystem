import express from 'express'
import upload from '../middleware/multer.js'
import authDoctor from '../middleware/authDoctor.js'
import {
  listDoctors,
  getDoctorById,
  getDoctorReviews,
  registerDoctor,
  loginDoctor,
  getDoctorProfile,
  updateDoctorProfile,
  changeAvailability,
  doctorAppointments,
  completeAppointment,
  cancelAppointmentByDoctor,
} from '../controllers/doctorController.js'

const router = express.Router()

// public
router.get('/list', listDoctors)
router.post('/register', upload.single('image'), registerDoctor)
router.post('/login', loginDoctor)

// protected (doctor)
router.get('/profile', authDoctor, getDoctorProfile)
router.post('/update-profile', authDoctor, upload.single('image'), updateDoctorProfile)
router.post('/change-availability', authDoctor, changeAvailability)
router.get('/appointments', authDoctor, doctorAppointments)
router.post('/complete-appointment', authDoctor, completeAppointment)
router.post('/cancel-appointment', authDoctor, cancelAppointmentByDoctor)

// dynamic routes last
router.get('/:id/reviews', getDoctorReviews)
router.get('/:id', getDoctorById)

export default router
