import bcrypt from 'bcryptjs'
import validator from 'validator'

import doctorModel from '../models/doctorModel.js'
import appointmentModel from '../models/appointmentModel.js'
import reviewModel from '../models/reviewModel.js'
import generateToken from '../utils/generateToken.js'
import { storeImage } from '../services/cloudinaryService.js'
import { notify } from '../services/emailService.js'
import { ok, fail } from '../middleware/errorMiddleware.js'

const omitPassword = (d) => {
  const obj = d.toObject ? d.toObject() : { ...d }
  delete obj.password
  return obj
}

export const SPECIALITIES = [
  'General Physician',
  'Gynecologist',
  'Dermatologist',
  'Pediatrician',
  'Neurologist',
  'Gastroenterologist',
  'Cardiologist',
  'Dentist',
]

/** Attach average rating + review count to a list of doctors. */
const withRatings = async (doctors) => {
  const stats = await reviewModel.aggregate([
    { $group: { _id: '$doctorId', avg: { $avg: '$rating' }, count: { $sum: 1 } } },
  ])
  const map = new Map(stats.map((s) => [s._id, s]))
  return doctors.map((d) => {
    const obj = d.toObject ? d.toObject() : { ...d }
    delete obj.password
    const s = map.get(obj._id.toString())
    obj.rating = s ? Math.round(s.avg * 10) / 10 : 0
    obj.reviewCount = s ? s.count : 0
    return obj
  })
}

// ----------------------------- PUBLIC -----------------------------

export const listDoctors = async (req, res) => {
  try {
    const { speciality = '', search = '' } = req.query
    // only admin-verified doctors are publicly listed (legacy docs without the
    // field are treated as verified)
    const query = { verified: { $ne: false } }
    if (speciality) query.speciality = speciality
    if (search) query.name = { $regex: search, $options: 'i' }

    const doctors = await doctorModel.find(query).sort({ createdAt: -1 })
    return ok(res, 'Doctors fetched', { doctors: await withRatings(doctors), specialities: SPECIALITIES })
  } catch (error) {
    return fail(res, error.message)
  }
}

export const getDoctorById = async (req, res) => {
  try {
    const doctor = await doctorModel.findById(req.params.id)
    if (!doctor) return fail(res, 'Doctor not found', 404)
    const [withRating] = await withRatings([doctor])
    return ok(res, 'Doctor fetched', { doctor: withRating })
  } catch (error) {
    return fail(res, error.message)
  }
}

export const getDoctorReviews = async (req, res) => {
  try {
    const reviews = await reviewModel.find({ doctorId: req.params.id }).sort({ createdAt: -1 }).limit(50)
    const count = reviews.length
    const average = count ? Math.round((reviews.reduce((s, r) => s + r.rating, 0) / count) * 10) / 10 : 0
    return ok(res, 'Reviews fetched', { reviews, average, count })
  } catch (error) {
    return fail(res, error.message)
  }
}

// ----------------------------- AUTH -----------------------------

/** Public doctor self-registration. Doctors are created ready to take bookings. */
export const registerDoctor = async (req, res) => {
  try {
    const { name, email, password, speciality, degree, experience, about, fee, address } = req.body
    if (!name || !email || !password || !speciality || !degree || !experience || !about || !fee)
      return fail(res, 'Please fill in all required fields')
    if (!validator.isEmail(email)) return fail(res, 'Please enter a valid email')
    if (password.length < 8) return fail(res, 'Password must be at least 8 characters')
    if (!SPECIALITIES.includes(speciality)) return fail(res, 'Please choose a valid speciality')
    if (Number(fee) < 0) return fail(res, 'Fee must be a positive number')
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
      verified: true,
      slots_booked: {},
      date: Date.now(),
    })

    notify('doctor-registered', { doctor: doctor.email })
    return ok(
      res,
      'Account created successfully.',
      { token: generateToken(doctor._id, 'doctor'), doctor: omitPassword(doctor) },
      201,
    )
  } catch (error) {
    return fail(res, error.message)
  }
}

export const loginDoctor = async (req, res) => {
  try {
    const { email, password } = req.body
    if (!email || !password) return fail(res, 'Missing details')
    const doctor = await doctorModel.findOne({ email: email.toLowerCase() })
    if (!doctor) return fail(res, 'Doctor does not exist')
    if (!(await bcrypt.compare(password, doctor.password))) return fail(res, 'Invalid credentials')
    return ok(res, 'Logged in successfully', { token: generateToken(doctor._id, 'doctor'), doctor: omitPassword(doctor) })
  } catch (error) {
    return fail(res, error.message)
  }
}

// ----------------------------- PROFILE -----------------------------

export const getDoctorProfile = async (req, res) => {
  try {
    const doctor = await doctorModel.findById(req.doctorId).select('-password')
    if (!doctor) return fail(res, 'Doctor not found', 404)
    return ok(res, 'Profile fetched', { doctor })
  } catch (error) {
    return fail(res, error.message)
  }
}

export const updateDoctorProfile = async (req, res) => {
  try {
    const { fee, about, address, available, experience, name, degree } = req.body
    const update = {}
    if (fee !== undefined) update.fee = Number(fee)
    if (about) update.about = about
    if (experience) update.experience = experience
    if (name) update.name = name
    if (degree) update.degree = degree
    if (available !== undefined) update.available = available === 'true' || available === true
    if (address) {
      try {
        update.address = typeof address === 'string' ? JSON.parse(address) : address
      } catch {
        return fail(res, 'Invalid address payload')
      }
    }
    if (req.file) update.image = await storeImage(req.file, 'doctor')

    const doctor = await doctorModel.findByIdAndUpdate(req.doctorId, update, { new: true }).select('-password')
    return ok(res, 'Profile updated successfully', { doctor })
  } catch (error) {
    return fail(res, error.message)
  }
}

export const changeAvailability = async (req, res) => {
  try {
    const doctor = await doctorModel.findById(req.doctorId).select('-password')
    if (!doctor) return fail(res, 'Doctor not found', 404)
    doctor.available = !doctor.available
    await doctor.save()
    return ok(res, `Availability changed to ${doctor.available ? 'available' : 'unavailable'}`, {
      doctor: omitPassword(doctor),
    })
  } catch (error) {
    return fail(res, error.message)
  }
}

// ----------------------------- APPOINTMENTS -----------------------------

export const doctorAppointments = async (req, res) => {
  try {
    const appointments = await appointmentModel.find({ doctorId: req.doctorId }).sort({ createdAt: -1 })
    const reviews = await reviewModel.find({ doctorId: req.doctorId })
    const reviewed = new Set(reviews.map((r) => r.appointmentId))
    return ok(res, 'Appointments fetched', {
      appointments: appointments.map((a) => ({ ...a.toObject(), reviewed: reviewed.has(a._id.toString()) })),
    })
  } catch (error) {
    return fail(res, error.message)
  }
}

export const completeAppointment = async (req, res) => {
  try {
    const { appointmentId } = req.body
    const appointment = await appointmentModel.findById(appointmentId)
    if (!appointment) return fail(res, 'Appointment not found', 404)
    if (appointment.doctorId !== req.doctorId) return fail(res, 'Unauthorized action', 403)
    if (appointment.cancelled) return fail(res, 'Appointment is already cancelled')

    appointment.isCompleted = true
    await appointment.save()
    notify('appointment-completed', { appointmentId })
    return ok(res, 'Appointment completed', { appointment })
  } catch (error) {
    return fail(res, error.message)
  }
}

export const cancelAppointmentByDoctor = async (req, res) => {
  try {
    const { appointmentId } = req.body
    const appointment = await appointmentModel.findById(appointmentId)
    if (!appointment) return fail(res, 'Appointment not found', 404)
    if (appointment.doctorId !== req.doctorId) return fail(res, 'Unauthorized action', 403)
    if (appointment.cancelled) return fail(res, 'Appointment already cancelled')
    if (appointment.isCompleted) return fail(res, 'Completed appointments cannot be cancelled')

    appointment.cancelled = true
    await appointment.save()

    const doctor = await doctorModel.findById(req.doctorId)
    if (doctor && doctor.slots_booked?.[appointment.slotDate]) {
      doctor.slots_booked[appointment.slotDate] = doctor.slots_booked[appointment.slotDate].filter(
        (t) => t !== appointment.slotTime,
      )
      doctor.markModified('slots_booked')
      await doctor.save()
    }
    notify('appointment-cancelled-by-doctor', { appointmentId })
    return ok(res, 'Appointment cancelled', { appointment })
  } catch (error) {
    return fail(res, error.message)
  }
}

export const buildDoctorPayload = async (req) => {
  const { name, email, password, speciality, degree, experience, about, fee, address } = req.body
  if (!name || !email || !password || !speciality || !degree || !experience || !about || !fee) {
    throw Object.assign(new Error('Missing doctor details'), { statusCode: 400 })
  }
  if (!validator.isEmail(email)) throw Object.assign(new Error('Invalid email'), { statusCode: 400 })
  if (password.length < 8) throw Object.assign(new Error('Password must be at least 8 characters'), { statusCode: 400 })

  const salt = await bcrypt.genSalt(10)
  const payload = {
    name,
    email: email.toLowerCase(),
    password: await bcrypt.hash(password, salt),
    speciality,
    degree,
    experience,
    about,
    fee: Number(fee),
    available: true,
    slots_booked: {},
    date: Date.now(),
    address: { line1: '', line2: '' },
  }
  if (address) {
    try {
      payload.address = typeof address === 'string' ? JSON.parse(address) : address
    } catch {
      /* keep default */
    }
  }
  if (req.file) payload.image = await storeImage(req.file, 'doctor')
  return payload
}
