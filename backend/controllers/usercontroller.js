import validator from 'validator'
import bcrypt from 'bcryptjs'

import userModel from '../models/userModel.js'
import doctorModel from '../models/doctorModel.js'
import appointmentModel from '../models/appointmentModel.js'
import reviewModel from '../models/reviewModel.js'
import generateToken from '../utils/generateToken.js'
import { storeImage } from '../services/cloudinaryService.js'
import { createOrder, verifyPayment, listMethods, isMethodAvailable } from '../services/paymentService.js'
import { notify } from '../services/emailService.js'
import { ok, fail } from '../middleware/errorMiddleware.js'
import { toDateKey } from '../utils/slotUtils.js'

const publicUser = (u) => ({
  _id: u._id,
  name: u.name,
  email: u.email,
  image: u.image,
  phone: u.phone,
  address: u.address,
  gender: u.gender,
  dob: u.dob,
})

const publicDoctor = (d) => ({
  _id: d._id,
  name: d.name,
  email: d.email,
  image: d.image,
  speciality: d.speciality,
  degree: d.degree,
  experience: d.experience,
  about: d.about,
  fee: d.fee,
  address: d.address,
  available: d.available,
  slots_booked: d.slots_booked,
})

// ----------------------------- AUTH -----------------------------

export const registerUser = async (req, res) => {
  try {
    const { name, email, password } = req.body
    if (!name || !email || !password) return fail(res, 'Missing details')
    if (!validator.isEmail(email)) return fail(res, 'Please enter a valid email')
    if (password.length < 8) return fail(res, 'Password must be at least 8 characters')
    if (await userModel.findOne({ email: email.toLowerCase() }))
      return fail(res, 'A user already exists with this email')

    const salt = await bcrypt.genSalt(10)
    const user = await userModel.create({ name, email, password: await bcrypt.hash(password, salt) })
    return ok(res, 'Account created successfully', { token: generateToken(user._id, 'user'), user: publicUser(user) }, 201)
  } catch (error) {
    return fail(res, error.message)
  }
}

export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body
    if (!email || !password) return fail(res, 'Missing details')
    const user = await userModel.findOne({ email: email.toLowerCase() })
    if (!user) return fail(res, 'User does not exist')
    if (!(await bcrypt.compare(password, user.password))) return fail(res, 'Invalid credentials')
    return ok(res, 'Logged in successfully', { token: generateToken(user._id, 'user'), user: publicUser(user) })
  } catch (error) {
    return fail(res, error.message)
  }
}

export const logoutUser = async (req, res) => ok(res, 'Logged out successfully')

// ----------------------------- PROFILE -----------------------------

export const getProfile = async (req, res) => {
  try {
    const user = await userModel.findById(req.userId).select('-password')
    if (!user) return fail(res, 'User not found', 404)
    return ok(res, 'Profile fetched', { user })
  } catch (error) {
    return fail(res, error.message)
  }
}

export const updateProfile = async (req, res) => {
  try {
    const { name, phone, address, gender, dob } = req.body
    const update = {}
    if (name) update.name = name
    if (phone) update.phone = phone
    if (gender) update.gender = gender
    if (dob) update.dob = dob
    if (address) {
      try {
        update.address = typeof address === 'string' ? JSON.parse(address) : address
      } catch {
        return fail(res, 'Invalid address payload')
      }
    }
    if (req.file) update.image = await storeImage(req.file, 'user')
    const user = await userModel.findByIdAndUpdate(req.userId, update, { new: true }).select('-password')
    return ok(res, 'Profile updated successfully', { user })
  } catch (error) {
    return fail(res, error.message)
  }
}

// ----------------------------- APPOINTMENTS -----------------------------

export const bookAppointment = async (req, res) => {
  try {
    const { doctorId, slotDate, slotTime, paymentMethod = 'card' } = req.body
    if (!doctorId || !slotDate || !slotTime) return fail(res, 'Missing appointment details')
    if (slotDate < toDateKey(new Date())) return fail(res, 'Cannot book an appointment in the past')

    const doctor = await doctorModel.findById(doctorId)
    if (!doctor) return fail(res, 'Doctor not found', 404)
    if (doctor.verified === false) return fail(res, 'Doctor is not verified yet')
    if (!doctor.available) return fail(res, 'Doctor is not available for appointments')

    const user = await userModel.findById(req.userId)
    if (!user) return fail(res, 'User not found', 404)

    const booked = (doctor.slots_booked && doctor.slots_booked[slotDate]) || []
    if (booked.includes(slotTime)) return fail(res, 'Appointment slot is not available')

    const appointment = await appointmentModel.create({
      userId: user._id.toString(),
      doctorId: doctor._id.toString(),
      userData: publicUser(user),
      doctorData: publicDoctor(doctor),
      amount: doctor.fee,
      slotDate,
      slotTime,
      paymentMethod,
      payment: false,
      date: Date.now(),
      createdAt: Date.now(),
    })

    doctor.slots_booked = doctor.slots_booked || {}
    doctor.slots_booked[slotDate] = [...booked, slotTime]
    doctor.markModified('slots_booked')
    await doctor.save()

    notify('appointment-booked', { appointmentId: appointment._id, doctor: doctor.name })
    return ok(res, 'Appointment booked successfully', { appointment }, 201)
  } catch (error) {
    return fail(res, error.message)
  }
}

/** Move an appointment to a different (free) slot. */
export const rescheduleAppointment = async (req, res) => {
  try {
    const { appointmentId, slotDate, slotTime } = req.body
    if (!appointmentId || !slotDate || !slotTime) return fail(res, 'Missing reschedule details')
    if (slotDate < toDateKey(new Date())) return fail(res, 'Cannot reschedule to a past date')

    const appointment = await appointmentModel.findById(appointmentId)
    if (!appointment) return fail(res, 'Appointment not found', 404)
    if (appointment.userId !== req.userId) return fail(res, 'Unauthorized action', 403)
    if (appointment.cancelled) return fail(res, 'Cancelled appointments cannot be rescheduled')
    if (appointment.isCompleted) return fail(res, 'Completed appointments cannot be rescheduled')

    const doctor = await doctorModel.findById(appointment.doctorId)
    if (!doctor) return fail(res, 'Doctor not found', 404)
    if (appointment.slotDate === slotDate && appointment.slotTime === slotTime)
      return fail(res, 'Appointment is already scheduled for this slot')

    doctor.slots_booked = doctor.slots_booked || {}
    const oldDate = appointment.slotDate
    const oldTime = appointment.slotTime

    // release the old slot first (handles same-day moves correctly)
    if (doctor.slots_booked[oldDate]) {
      doctor.slots_booked[oldDate] = doctor.slots_booked[oldDate].filter((t) => t !== oldTime)
    }

    // then check + reserve the target slot against the freshly-updated list
    const target = doctor.slots_booked[slotDate] || []
    if (target.includes(slotTime)) return fail(res, 'That slot is not available')
    doctor.slots_booked[slotDate] = [...target, slotTime]

    doctor.markModified('slots_booked')
    await doctor.save()

    appointment.slotDate = slotDate
    appointment.slotTime = slotTime
    await appointment.save()

    notify('appointment-rescheduled', { appointmentId, from: `${oldDate} ${oldTime}`, to: `${slotDate} ${slotTime}` })
    return ok(res, 'Appointment rescheduled successfully', { appointment })
  } catch (error) {
    return fail(res, error.message)
  }
}

export const listAppointments = async (req, res) => {
  try {
    const appointments = await appointmentModel.find({ userId: req.userId }).sort({ createdAt: -1 })
    const reviews = await reviewModel.find({ userId: req.userId })
    const reviewed = new Set(reviews.map((r) => r.appointmentId))
    return ok(res, 'Appointments fetched', {
      appointments: appointments.map((a) => ({ ...a.toObject(), reviewed: reviewed.has(a._id.toString()) })),
    })
  } catch (error) {
    return fail(res, error.message)
  }
}

export const cancelAppointment = async (req, res) => {
  try {
    const { appointmentId } = req.body
    const appointment = await appointmentModel.findById(appointmentId)
    if (!appointment) return fail(res, 'Appointment not found', 404)
    if (appointment.userId !== req.userId) return fail(res, 'Unauthorized action', 403)
    if (appointment.cancelled) return fail(res, 'Appointment already cancelled')
    if (appointment.isCompleted) return fail(res, 'Completed appointments cannot be cancelled')

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
    notify('appointment-cancelled-by-patient', { appointmentId })
    return ok(res, 'Appointment cancelled successfully')
  } catch (error) {
    return fail(res, error.message)
  }
}

// ----------------------------- REVIEWS -----------------------------

/** Patients can rate a doctor once, after the appointment is completed. */
export const reviewDoctor = async (req, res) => {
  try {
    const { appointmentId, rating, comment = '' } = req.body
    const stars = Number(rating)
    if (!appointmentId) return fail(res, 'Appointment is required')
    if (!stars || stars < 1 || stars > 5) return fail(res, 'Rating must be between 1 and 5')

    const appointment = await appointmentModel.findById(appointmentId)
    if (!appointment) return fail(res, 'Appointment not found', 404)
    if (appointment.userId !== req.userId) return fail(res, 'Unauthorized action', 403)
    if (!appointment.isCompleted) return fail(res, 'You can only review a completed appointment')

    const existing = await reviewModel.findOne({ appointmentId })
    if (existing) return fail(res, 'You have already reviewed this appointment')

    const user = await userModel.findById(req.userId).select('-password')
    const review = await reviewModel.create({
      doctorId: appointment.doctorId,
      userId: req.userId,
      appointmentId,
      userName: user?.name || 'Patient',
      userImage: user?.image || '',
      rating: stars,
      comment,
    })
    return ok(res, 'Thanks for your feedback', { review }, 201)
  } catch (error) {
    return fail(res, error.message)
  }
}

// ----------------------------- PAYMENT -----------------------------

export const getPaymentMethods = async (req, res) => ok(res, 'Payment methods', { methods: listMethods() })

export const createPayment = async (req, res) => {
  try {
    const { appointmentId, method = 'card' } = req.body
    const appointment = await appointmentModel.findById(appointmentId)
    if (!appointment) return fail(res, 'Appointment not found', 404)
    if (appointment.userId !== req.userId) return fail(res, 'Unauthorized action', 403)
    if (appointment.cancelled) return fail(res, 'Cancelled appointments cannot be paid')
    if (appointment.payment) return fail(res, 'Appointment is already paid')

    if (!isMethodAvailable(method)) {
      const spec = listMethods().find((m) => m.id === method)
      return res.status(503).json({
        success: false,
        message: `${spec?.label || method} is not configured on the server.`,
        required: { service: spec?.label || method, env: spec?.requires || [], where: 'backend/.env' },
      })
    }

    const order = await createOrder(appointment.amount, appointment._id.toString(), method)
    return ok(res, 'Payment initiated', order)
  } catch (error) {
    return fail(res, error.message, error.statusCode || 400)
  }
}

export const confirmPayment = async (req, res) => {
  try {
    const { appointmentId, method = 'card', ...rest } = req.body

    const appointment = await appointmentModel.findById(appointmentId)
    if (!appointment) return fail(res, 'Appointment not found', 404)
    if (appointment.userId !== req.userId) return fail(res, 'Unauthorized action', 403)
    if (appointment.cancelled) return fail(res, 'Cancelled appointments cannot be paid')

    const valid = await verifyPayment({ method, ...rest })
    if (!valid) return fail(res, 'Payment verification failed', 400)

    appointment.payment = true
    appointment.paymentMethod = method
    appointment.paymentRef = rest.razorpay_payment_id || rest.paymentId || rest.orderId || ''
    await appointment.save()

    notify('payment-verified', { appointmentId, method })
    return ok(res, 'Payment verified and appointment marked as paid', { appointment })
  } catch (error) {
    return fail(res, error.message)
  }
}
