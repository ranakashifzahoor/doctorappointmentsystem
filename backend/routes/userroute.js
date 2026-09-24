import express from 'express'
import upload from '../middleware/multer.js'
import authUser from '../middleware/authUser.js'
import {
  registerUser,
  loginUser,
  logoutUser,
  getProfile,
  updateProfile,
  bookAppointment,
  rescheduleAppointment,
  listAppointments,
  cancelAppointment,
  reviewDoctor,
  getPaymentMethods,
  createPayment,
  confirmPayment,
} from '../controllers/userController.js'

const router = express.Router()

router.post('/register', registerUser)
router.post('/login', loginUser)
router.post('/logout', authUser, logoutUser)

router.get('/profile', authUser, getProfile)
router.post('/update-profile', authUser, upload.single('image'), updateProfile)

router.get('/appointments', authUser, listAppointments)
router.post('/book-appointment', authUser, bookAppointment)
router.post('/reschedule-appointment', authUser, rescheduleAppointment)
router.post('/cancel-appointment', authUser, cancelAppointment)
router.post('/review', authUser, reviewDoctor)

router.get('/payment-methods', getPaymentMethods)
router.post('/payment', authUser, createPayment)
router.post('/verify-payment', authUser, confirmPayment)

export default router
