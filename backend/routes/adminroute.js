import express from 'express'
import upload from '../middleware/multer.js'
import authAdmin from '../middleware/authAdmin.js'
import {
  loginAdmin,
  dashboard,
  allDoctors,
  addDoctor,
  updateDoctor,
  removeDoctor,
  verifyDoctor,
  changeDoctorAvailability,
  allAppointments,
  cancelAppointment,
  allMessages,
  markMessageRead,
  deleteMessage,
  allReviews,
} from '../controllers/adminController.js'

const router = express.Router()

router.post('/login', loginAdmin)

router.get('/dashboard', authAdmin, dashboard)

router.get('/doctors', authAdmin, allDoctors)
router.post('/add-doctor', authAdmin, upload.single('image'), addDoctor)
router.post('/update-doctor', authAdmin, upload.single('image'), updateDoctor)
router.post('/remove-doctor', authAdmin, removeDoctor)
router.post('/verify-doctor', authAdmin, verifyDoctor)
router.post('/change-availability', authAdmin, changeDoctorAvailability)

router.get('/appointments', authAdmin, allAppointments)
router.post('/cancel-appointment', authAdmin, cancelAppointment)

router.get('/messages', authAdmin, allMessages)
router.post('/message-read', authAdmin, markMessageRead)
router.post('/message-delete', authAdmin, deleteMessage)

router.get('/reviews', authAdmin, allReviews)

export default router
