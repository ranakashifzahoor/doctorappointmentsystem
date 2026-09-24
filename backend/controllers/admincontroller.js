import validator from 'validator'
import bcrypt from 'bcryptjs'

import doctorModel from '../models/doctorModel.js'
import userModel from '../models/userModel.js'
import appointmentModel from '../models/appointmentModel.js'
import contactModel from '../models/contactModel.js'
import reviewModel from '../models/reviewModel.js'
import generateToken from '../utils/generateToken.js'
import { storeImage } from '../services/cloudinaryService.js'
import { notify } from '../services/emailService.js'
import { ok, fail } from '../middleware/errorMiddleware.js'
import { SPECIALITIES } from './doctorController.js'

// ----------------------------- AUTH -----------------------------

export const loginAdmin = async (req, res) => {
  try {
    const { email, password } = req.body
    if (!email || !password) return fail(res, 'Missing details')
    if (
      email.toLowerCase() !== (process.env.ADMIN_EMAIL || '').toLowerCase() ||
      password !== process.env.ADMIN_PASSWORD
    ) {
      return fail(res, 'Invalid credentials', 401)
    }
    return ok(res, 'Admin logged in successfully', { token: generateToken('admin', 'admin') })
  } catch (error) {
    return fail(res, error.message)
  }
}

// ----------------------------- DASHBOARD -----------------------------

export const dashboard = async (req, res) => {
  try {
    const [doctors, users, appointments, reviews, unreadMessages, pendingDoctors, latestAppointments] =
      await Promise.all([
        doctorModel.countDocuments(),
        userModel.countDocuments(),
        appointmentModel.countDocuments(),
        reviewModel.countDocuments(),
        contactModel.countDocuments({ read: false }),
        doctorModel.countDocuments({ verified: false }),
        appointmentModel.find().sort({ createdAt: -1 }).limit(5),
      ])
    return ok(res, 'Dashboard data', {
      dashboard: { doctors, users, appointments, reviews, unreadMessages, pendingDoctors, latestAppointments },
    })
  } catch (error) {
    return fail(res, error.message)
  }
}

// ----------------------------- DOCTORS -----------------------------

export const allDoctors = async (req, res) => {
  try {
    const doctors = await doctorModel.find().select('-password').sort({ createdAt: -1 })
    return ok(res, 'Doctors fetched', { doctors, specialities: SPECIALITIES })
  } catch (error) {
    return fail(res, error.message)
  }
}

export const addDoctor = async (req, res) => {
  try {
    const { name, email, password, speciality, degree, experience, about, fee, address } = req.body
    if (!name || !email || !password || !speciality || !degree || !experience || !about || !fee)
      return fail(res, 'Missing doctor details')
    if (!validator.isEmail(email)) return fail(res, 'Please enter a valid email')
    if (password.length < 8) return fail(res, 'Password must be at least 8 characters')
    if (await doctorModel.findOne({ email: email.toLowerCase() }))
      return fail(res, 'A doctor already exists with this email')

    const salt = await bcrypt.genSalt(10)
    const doctor = await doctorModel.create({
      name,
      email: email.toLowerCase(),
      password: await bcrypt.hash(password, salt),
      speciality,
      degree,
      experience,
      about,
      fee: Number(fee),
      address: address ? (typeof address === 'string' ? JSON.parse(address) : address) : { line1: '', line2: '' },
      image: req.file ? await storeImage(req.file, 'doctor') : '',
      available: true,
      verified: true, // admin-created doctors are verified immediately
      slots_booked: {},
      date: Date.now(),
    })
    const created = doctor.toObject()
    delete created.password
    return ok(res, 'Doctor added successfully', { doctor: created }, 201)
  } catch (error) {
    return fail(res, error.message)
  }
}

/** Edit an existing doctor (any subset of fields; optional new image). */
export const updateDoctor = async (req, res) => {
  try {
    const { doctorId, name, email, password, speciality, degree, experience, about, fee, address } = req.body
    if (!doctorId) return fail(res, 'Doctor id is required')

    const doctor = await doctorModel.findById(doctorId)
    if (!doctor) return fail(res, 'Doctor not found', 404)

    if (email && email.toLowerCase() !== doctor.email) {
      if (!validator.isEmail(email)) return fail(res, 'Please enter a valid email')
      if (await doctorModel.findOne({ email: email.toLowerCase() }))
        return fail(res, 'Another doctor already uses this email')
      doctor.email = email.toLowerCase()
    }
    if (name) doctor.name = name
    if (speciality) doctor.speciality = speciality
    if (degree) doctor.degree = degree
    if (experience) doctor.experience = experience
    if (about) doctor.about = about
    if (fee !== undefined) doctor.fee = Number(fee)
    if (password) {
      if (password.length < 8) return fail(res, 'Password must be at least 8 characters')
      doctor.password = await bcrypt.hash(password, await bcrypt.genSalt(10))
    }
    if (address) {
      try {
        doctor.address = typeof address === 'string' ? JSON.parse(address) : address
      } catch {
        return fail(res, 'Invalid address payload')
      }
    }
    if (req.file) doctor.image = await storeImage(req.file, 'doctor')

    await doctor.save()
    const out = doctor.toObject()
    delete out.password
    return ok(res, 'Doctor updated successfully', { doctor: out })
  } catch (error) {
    return fail(res, error.message)
  }
}

export const removeDoctor = async (req, res) => {
  try {
    const { doctorId } = req.body
    if (!doctorId) return fail(res, 'Doctor id is required')
    const deleted = await doctorModel.findByIdAndDelete(doctorId)
    if (!deleted) return fail(res, 'Doctor not found', 404)
    return ok(res, 'Doctor removed successfully')
  } catch (error) {
    return fail(res, error.message)
  }
}

/** Approve (or revoke) a self-registered doctor. */
export const verifyDoctor = async (req, res) => {
  try {
    const { doctorId, verified = true, note = '' } = req.body
    const doctor = await doctorModel.findById(doctorId)
    if (!doctor) return fail(res, 'Doctor not found', 404)

    doctor.verified = Boolean(verified)
    doctor.verificationNote = note
    // verifying makes them bookable; revoking hides them again
    doctor.available = Boolean(verified)
    await doctor.save()

    return ok(res, verified ? 'Doctor verified and published' : 'Doctor verification revoked', {
      doctor: { _id: doctor._id, name: doctor.name, verified: doctor.verified, available: doctor.available },
    })
  } catch (error) {
    return fail(res, error.message)
  }
}

export const changeDoctorAvailability = async (req, res) => {
  try {
    const { doctorId } = req.body
    const doctor = await doctorModel.findById(doctorId)
    if (!doctor) return fail(res, 'Doctor not found', 404)
    doctor.available = !doctor.available
    await doctor.save()
    return ok(res, 'Doctor availability changed')
  } catch (error) {
    return fail(res, error.message)
  }
}

// ----------------------------- APPOINTMENTS -----------------------------

export const allAppointments = async (req, res) => {
  try {
    const appointments = await appointmentModel.find().sort({ createdAt: -1 })
    return ok(res, 'Appointments fetched', { appointments })
  } catch (error) {
    return fail(res, error.message)
  }
}

export const cancelAppointment = async (req, res) => {
  try {
    const { appointmentId } = req.body
    const appointment = await appointmentModel.findById(appointmentId)
    if (!appointment) return fail(res, 'Appointment not found', 404)
    if (appointment.isCompleted) return fail(res, 'Completed appointments cannot be cancelled')
    if (appointment.cancelled) return fail(res, 'Appointment already cancelled')

    appointment.cancelled = true
    await appointment.save()

    const doctor = await doctorModel.findById(appointment.doctorId)
    if (doctor && doctor.slots_booked?.[appointment.slotDate]) {
      doctor.slots_booked[appointment.slotDate] = doctor.slots_booked[appointment.slotDate].filter(
        (t) => t !== appointment.slotTime,
      )
      doctor.markModified('slots_booked')
      await doctor.save()
    }
    notify('appointment-cancelled-by-admin', { appointmentId })
    return ok(res, 'Appointment cancelled by admin', { appointment })
  } catch (error) {
    return fail(res, error.message)
  }
}

// ----------------------------- MESSAGES -----------------------------

export const allMessages = async (req, res) => {
  try {
    const messages = await contactModel.find().sort({ createdAt: -1 })
    return ok(res, 'Messages fetched', { messages })
  } catch (error) {
    return fail(res, error.message)
  }
}

export const markMessageRead = async (req, res) => {
  try {
    const { messageId } = req.body
    const msg = await contactModel.findByIdAndUpdate(messageId, { read: true }, { new: true })
    if (!msg) return fail(res, 'Message not found', 404)
    return ok(res, 'Message marked as read')
  } catch (error) {
    return fail(res, error.message)
  }
}

export const deleteMessage = async (req, res) => {
  try {
    const { messageId } = req.body
    const msg = await contactModel.findByIdAndDelete(messageId)
    if (!msg) return fail(res, 'Message not found', 404)
    return ok(res, 'Message deleted')
  } catch (error) {
    return fail(res, error.message)
  }
}

// ----------------------------- REVIEWS -----------------------------

export const allReviews = async (req, res) => {
  try {
    const reviews = await reviewModel.find().sort({ createdAt: -1 }).limit(200)
    return ok(res, 'Reviews fetched', { reviews })
  } catch (error) {
    return fail(res, error.message)
  }
}
