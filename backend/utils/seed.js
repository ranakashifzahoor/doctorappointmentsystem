/**
 * Seed script: `npm run seed`
 * Creates demo doctors (with photos), a demo patient, sample completed
 * appointments and reviews. Safe to re-run — existing e-mails are skipped.
 *
 * `npm run db:reset`  drops the demo collections first, then seeds.
 */
import 'dotenv/config'
import mongoose from 'mongoose'
import bcrypt from 'bcryptjs'

import connectDB from '../config/mongodb.js'
import doctorModel from '../models/doctorModel.js'
import userModel from '../models/userModel.js'
import appointmentModel from '../models/appointmentModel.js'
import reviewModel from '../models/reviewModel.js'

const base = process.env.BACKEND_URL || 'http://localhost:4000'
const img = (name) => `${base}/uploads/${name}.jpg`

const doctors = [
  {
    name: 'Dr. Emily Carter',
    email: 'emily.carter@prescrip.com',
    password: 'doctor1234',
    speciality: 'General Physician',
    degree: 'MBBS, MD',
    experience: '4 Years',
    about:
      'Dr. Emily Carter is a dedicated general physician with a patient-first approach, focusing on preventive care and chronic disease management.',
    fee: 1500,
    image: img('doctor_emily'),
    address: { line1: '12 Wellness Street', line2: 'Gulberg, Lahore' },
  },
  {
    name: 'Dr. Rajesh Kumar',
    email: 'rajesh.kumar@prescrip.com',
    password: 'doctor1234',
    speciality: 'Cardiologist',
    degree: 'MBBS, DM (Cardiology)',
    experience: '12 Years',
    about:
      'Interventional cardiologist with over a decade of experience in angioplasty, heart-failure management and preventive cardiology.',
    fee: 3500,
    image: img('doctor_rajesh'),
    address: { line1: 'Heart Care Centre', line2: 'Blue Area, Islamabad' },
  },
  {
    name: 'Dr. Ayesha Khan',
    email: 'ayesha.khan@prescrip.com',
    password: 'doctor1234',
    speciality: 'Dermatologist',
    degree: 'MBBS, MD (Dermatology)',
    experience: '7 Years',
    about:
      'Clinical and cosmetic dermatologist treating acne, pigmentation and hair loss with evidence-based, minimal-intervention plans.',
    fee: 2000,
    image: img('doctor_ayesha'),
    address: { line1: 'Skin & Glow Clinic', line2: 'DHA Phase 5, Karachi' },
  },
  {
    name: 'Dr. Michael Lee',
    email: 'michael.lee@prescrip.com',
    password: 'doctor1234',
    speciality: 'Pediatrician',
    degree: 'MBBS, DCH',
    experience: '9 Years',
    about:
      'Pediatrician passionate about newborn care, vaccination schedules and guiding parents through every stage of early childhood.',
    fee: 1800,
    image: img('doctor_michael'),
    address: { line1: 'Little Steps Child Care', line2: 'Satellite Town, Rawalpindi' },
  },
  {
    name: 'Dr. Sofia Martinez',
    email: 'sofia.martinez@prescrip.com',
    password: 'doctor1234',
    speciality: 'Neurologist',
    degree: 'MBBS, DM (Neurology)',
    experience: '10 Years',
    about:
      'Neurologist specialising in headache disorders, epilepsy and stroke rehabilitation with a holistic recovery focus.',
    fee: 3000,
    image: img('doctor_sofia'),
    address: { line1: 'Neuro Care Institute', line2: 'F-8 Markaz, Islamabad' },
  },
  {
    name: 'Dr. Daniel Osei',
    email: 'daniel.osei@prescrip.com',
    password: 'doctor1234',
    speciality: 'Dentist',
    degree: 'BDS, MDS',
    experience: '6 Years',
    about:
      'Dentist offering preventive, restorative and cosmetic dentistry with a calm, pain-conscious approach for anxious patients.',
    fee: 1200,
    image: img('doctor_daniel'),
    address: { line1: 'Bright Smile Dental', line2: 'Model Town, Lahore' },
  },
]

const sampleReviews = [
  { rating: 5, comment: 'Very thorough and explained everything clearly.' },
  { rating: 4, comment: 'Great consultation, minimal waiting time.' },
  { rating: 5, comment: 'Highly professional and genuinely caring.' },
]

const run = async () => {
  await connectDB()

  if (process.argv.includes('--reset')) {
    await Promise.all([
      doctorModel.deleteMany({}),
      userModel.deleteMany({}),
      appointmentModel.deleteMany({}),
      reviewModel.deleteMany({}),
    ])
    console.log('Existing demo collections cleared.')
  }

  const salt = await bcrypt.genSalt(10)
  let createdDoctors = 0
  const doctorIds = []

  for (const d of doctors) {
    let doc = await doctorModel.findOne({ email: d.email })
    if (!doc) {
      doc = await doctorModel.create({
        ...d,
        password: await bcrypt.hash(d.password, salt),
        available: true,
        verified: true,
        slots_booked: {},
        date: Date.now(),
      })
      createdDoctors++
    } else {
      let changed = false
      if (!doc.image) { doc.image = d.image; changed = true }
      if (!doc.verified) { doc.verified = true; changed = true }
      if (changed) await doc.save()
    }
    doctorIds.push(doc)
  }

  const patientEmail = 'patient@example.com'
  let patient = await userModel.findOne({ email: patientEmail })
  if (!patient) {
    patient = await userModel.create({
      name: 'John Patient',
      email: patientEmail,
      password: await bcrypt.hash('patient1234', salt),
      phone: '03001234567',
      address: { line1: '22 Example Road', line2: 'Lahore' },
      gender: 'Male',
      dob: '1995-04-12',
    })
  }

  // a couple of completed appointments + reviews so ratings are populated
  let createdReviews = 0
  for (let i = 0; i < sampleReviews.length; i++) {
    const doc = doctorIds[i]
    const appointmentId = `seed_appt_${doc._id}_${i}`
    if (await reviewModel.findOne({ appointmentId })) continue

    const day = new Date()
    day.setDate(day.getDate() - (i + 3))
    const slotDate = day.toISOString().slice(0, 10)

    await appointmentModel.create({
      userId: patient._id.toString(),
      doctorId: doc._id.toString(),
      userData: { _id: patient._id, name: patient.name, image: patient.image, email: patient.email },
      doctorData: { _id: doc._id, name: doc.name, image: doc.image, speciality: doc.speciality },
      amount: doc.fee,
      slotDate,
      slotTime: '11:00',
      payment: true,
      paymentMethod: 'card',
      isCompleted: true,
      cancelled: false,
      date: Date.now(),
      createdAt: Date.now() - i * 1000,
    })

    await reviewModel.create({
      doctorId: doc._id.toString(),
      userId: patient._id.toString(),
      appointmentId,
      userName: patient.name,
      userImage: patient.image,
      rating: sampleReviews[i].rating,
      comment: sampleReviews[i].comment,
    })
    createdReviews++
  }

  console.log(
    `Seed complete. Doctors created: ${createdDoctors}. Patient: ${patient ? 'ok' : 'none'}. Reviews created: ${createdReviews}`,
  )
  await mongoose.connection.close()
  process.exit(0)
}

run().catch((e) => {
  console.error('Seed failed:', e)
  process.exit(1)
})
