/**
 * End-to-end smoke test: `npm run smoke`
 * Requires the API running (npm run dev) and MongoDB available.
 * Covers: patient auth, doctor listing + ratings, booking, double-booking guard,
 * payment methods (card/easypaisa/jazzcash), reschedule, cancellation, reviews,
 * doctor auth, doctor actions, admin auth, add/edit/remove doctor, admin lists,
 * contact messages.
 */
const BASE = process.env.API_URL || 'http://127.0.0.1:4000'

let passed = 0
let failed = 0

const log = (okFlag, label, extra = '') => {
  if (okFlag) passed++
  else failed++
  console.log(`${okFlag ? 'PASS' : 'FAIL'}  ${label}${extra ? '  -> ' + extra : ''}`)
}

const call = async (method, path, { token, body } = {}) => {
  const headers = {}
  if (token) headers.Authorization = `Bearer ${token}`
  if (body) headers['Content-Type'] = 'application/json'
  const res = await fetch(BASE + path, { method, headers, body: body ? JSON.stringify(body) : undefined })
  let json = null
  try {
    json = await res.json()
  } catch {
    /* ignore */
  }
  return { status: res.status, json }
}

const dateKey = (offsetDays) => {
  const d = new Date()
  d.setDate(d.getDate() + offsetDays)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

const run = async () => {
  const stamp = Date.now()
  const patient = { name: 'Smoke Tester', email: `smoke_${stamp}@example.com`, password: 'secret1234' }
  // pick from business hours, offset by the run start so repeat runs never collide
  const SLOTS = (() => {
    const out = []
    for (let h = 10; h < 21; h++) for (const m of [0, 30]) out.push(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`)
    return out
  })()
  const offset = stamp % (SLOTS.length - 4)
  const slotTime = (i) => SLOTS[offset + i]

  // ---- health & methods ----
  const health = await call('GET', '/api/health')
  log(health.status === 200 && health.json?.success, 'GET /api/health')
  log((health.json?.data?.payment?.methods || []).length === 3, 'three payment methods registered')

  const methods = await call('GET', '/api/user/payment-methods')
  const ids = (methods.json?.data?.methods || []).map((m) => m.id)
  log(methods.status === 200 && ids.includes('easypaisa') && ids.includes('jazzcash') && ids.includes('card'), 'GET /api/user/payment-methods', ids.join(','))

  // ---- patient auth ----
  const reg = await call('POST', '/api/user/register', { body: patient })
  log(reg.status === 201 && reg.json?.data?.token, 'POST /api/user/register')
  const userToken = reg.json?.data?.token
  log((await call('POST', '/api/user/register', { body: patient })).status === 400, 'duplicate register rejected')
  log((await call('POST', '/api/user/login', { body: patient })).status === 200, 'POST /api/user/login')
  log((await call('GET', '/api/user/profile')).status === 401, 'protected route requires token')

  // ---- doctors ----
  const list = await call('GET', '/api/doctor/list')
  const doctors = list.json?.data?.doctors || []
  log(list.status === 200 && doctors.length > 0, 'GET /api/doctor/list', `${doctors.length} doctors`)
  log(doctors.some((d) => d.image && d.image.includes('/uploads/')), 'doctors have photos')
  const withRating = doctors.filter((d) => d.reviewCount > 0)
  log(withRating.length > 0, 'doctors expose rating/reviewCount', `${withRating.length} rated`)
  log((await call('GET', '/api/doctor/list?speciality=Cardiologist')).json?.data?.doctors?.every((d) => d.speciality === 'Cardiologist'), 'speciality filter')

  // pick a seeded doctor so the run is deterministic (real users may have signed up)
  const doctor =
    doctors.find((d) => d.email.endsWith('@prescrip.com') && d.available) ||
    doctors.find((d) => d.available) ||
    doctors[0]
  const reviews0 = await call('GET', `/api/doctor/${doctor._id}/reviews`)
  log(reviews0.status === 200 && typeof reviews0.json?.data?.average === 'number', 'GET /api/doctor/:id/reviews')

  // ---- booking ----
  const slotDate = dateKey(4)
  const book = await call('POST', '/api/user/book-appointment', { token: userToken, body: { doctorId: doctor._id, slotDate, slotTime: slotTime(0) } })
  log(book.status === 201, 'POST /api/user/book-appointment')
  const apptId = book.json?.data?.appointment?._id
  log((await call('POST', '/api/user/book-appointment', { token: userToken, body: { doctorId: doctor._id, slotDate, slotTime: slotTime(0) } })).status === 400, 'duplicate slot rejected')

  // ---- reschedule ----
  const res = await call('POST', '/api/user/reschedule-appointment', { token: userToken, body: { appointmentId: apptId, slotDate, slotTime: slotTime(1) } })
  log(res.status === 200 && res.json?.data?.appointment?.slotTime === slotTime(1), 'POST /api/user/reschedule-appointment')
  const afterRes = await call('GET', `/api/doctor/${doctor._id}`)
  const booked = afterRes.json?.data?.doctor?.slots_booked?.[slotDate] || []
  log(booked.includes(slotTime(1)) && !booked.includes(slotTime(0)), 'reschedule frees old slot and reserves new')
  log((await call('POST', '/api/user/reschedule-appointment', { token: userToken, body: { appointmentId: apptId, slotDate, slotTime: slotTime(1) } })).status === 400, 'reschedule to the same slot rejected')

  // ---- payment (easypaisa, demo mode) ----
  const pay = await call('POST', '/api/user/payment', { token: userToken, body: { appointmentId: apptId, method: 'easypaisa' } })
  if (pay.status === 200 && pay.json?.data?.order?.id) {
    log(true, 'POST /api/user/payment (easypaisa order)', pay.json.data.demo ? 'demo' : 'live')
    const verify = await call('POST', '/api/user/verify-payment', { token: userToken, body: { appointmentId: apptId, method: 'easypaisa', paymentId: `demo_ep_${stamp}` } })
    log(verify.status === 200 && verify.json?.data?.appointment?.payment === true, 'verify-payment marks paid')
    log(verify.json?.data?.appointment?.paymentMethod === 'easypaisa', 'payment method recorded', verify.json?.data?.appointment?.paymentMethod)
  } else {
    log(pay.status === 503, 'payment reports missing credentials when not configured', pay.json?.message)
  }

  // ---- review flow (needs a completed appointment) ----
  const book2 = await call('POST', '/api/user/book-appointment', { token: userToken, body: { doctorId: doctor._id, slotDate, slotTime: slotTime(2) } })
  const appt2 = book2.json?.data?.appointment?._id
  log((await call('POST', '/api/user/reschedule-appointment', { token: userToken, body: { appointmentId: apptId, slotDate, slotTime: slotTime(2) } })).status === 400, 'reschedule into another booking\'s slot rejected')
  const dLogin = await call('POST', '/api/doctor/login', { body: { email: doctor.email, password: 'doctor1234' } })
  log(dLogin.status === 200 && dLogin.json?.data?.token, 'POST /api/doctor/login')
  const dToken = dLogin.json?.data?.token
  log((await call('POST', '/api/doctor/complete-appointment', { token: dToken, body: { appointmentId: appt2 } })).status === 200, 'POST /api/doctor/complete-appointment')
  log((await call('POST', '/api/user/review', { token: userToken, body: { appointmentId: appt2, rating: 5, comment: 'Excellent visit' } })).status === 201, 'POST /api/user/review')
  log((await call('POST', '/api/user/review', { token: userToken, body: { appointmentId: appt2, rating: 4 } })).status === 400, 'duplicate review rejected')
  const reviews1 = await call('GET', `/api/doctor/${doctor._id}/reviews`)
  log(reviews1.json?.data?.count >= 1 && reviews1.json?.data?.reviews?.[0]?.comment === 'Excellent visit', 'review appears on doctor profile')
  log((await call('GET', '/api/doctor/appointments', { token: dToken })).status === 200, 'GET /api/doctor/appointments')
  const dProfile = await call('GET', '/api/doctor/profile', { token: dToken })
  log(dProfile.status === 200 && dProfile.json?.data?.doctor?.password === undefined, 'doctor profile hides password')

  // ---- cancel ----
  log((await call('POST', '/api/user/cancel-appointment', { token: userToken, body: { appointmentId: apptId } })).status === 200, 'POST /api/user/cancel-appointment')
  log((await call('POST', '/api/user/cancel-appointment', { token: userToken, body: { appointmentId: apptId } })).status === 400, 'cannot cancel twice')
  log((await call('POST', '/api/user/review', { token: userToken, body: { appointmentId: apptId, rating: 5 } })).status === 400, 'cannot review a cancelled appointment')

  // ---- contact message ----
  const contact = await call('POST', '/api/contact', { body: { name: 'Web Visitor', email: `visitor_${stamp}@example.com`, subject: 'Feedback', message: 'Love the new Rs. pricing!' } })
  log(contact.status === 201, 'POST /api/contact')

  // ---- admin ----
  const adminLogin = await call('POST', '/api/admin/login', { body: { email: process.env.ADMIN_EMAIL || 'admin@prescrip.com', password: process.env.ADMIN_PASSWORD || 'Admin@123' } })
  log(adminLogin.status === 200 && adminLogin.json?.data?.token, 'POST /api/admin/login')
  const aToken = adminLogin.json?.data?.token
  log((await call('GET', '/api/admin/dashboard')).status === 401, 'admin dashboard protected')

  if (aToken) {
    const dash = await call('GET', '/api/admin/dashboard', { token: aToken })
    const dd = dash.json?.data?.dashboard || {}
    log(dash.status === 200 && typeof dd.doctors === 'number' && typeof dd.reviews === 'number', 'GET /api/admin/dashboard', `reviews=${dd.reviews} unread=${dd.unreadMessages}`)

    const addDoc = await call('POST', '/api/admin/add-doctor', {
      token: aToken,
      body: { name: 'Dr. Smoke Added', email: `smoke_doc_${stamp}@prescrip.com`, password: 'doctor1234', speciality: 'Dentist', degree: 'BDS', experience: '3 Years', about: 'Added by the smoke test.', fee: 450 },
    })
    log(addDoc.status === 201, 'POST /api/admin/add-doctor')
    const newDocId = addDoc.json?.data?.doctor?._id

    const upd = await call('POST', '/api/admin/update-doctor', { token: aToken, body: { doctorId: newDocId, fee: 999, about: 'Updated by smoke test.' } })
    log(upd.status === 200 && upd.json?.data?.doctor?.fee === 999, 'POST /api/admin/update-doctor')

    const adminDocs = await call('GET', '/api/admin/doctors', { token: aToken })
    log(adminDocs.status === 200 && adminDocs.json?.data?.doctors?.every((d) => d.password === undefined), 'GET /api/admin/doctors (no passwords)')

    log((await call('GET', '/api/admin/appointments', { token: aToken })).status === 200, 'GET /api/admin/appointments')

    const msgs = await call('GET', '/api/admin/messages', { token: aToken })
    log(msgs.status === 200 && msgs.json?.data?.messages.length >= 1, 'GET /api/admin/messages')
    const msgId = msgs.json?.data?.messages?.[0]?._id
    log((await call('POST', '/api/admin/message-read', { token: aToken, body: { messageId: msgId } })).status === 200, 'POST /api/admin/message-read')

    const revs = await call('GET', '/api/admin/reviews', { token: aToken })
    log(revs.status === 200 && revs.json?.data?.reviews.length >= 1, 'GET /api/admin/reviews')

    log((await call('POST', '/api/admin/remove-doctor', { token: aToken, body: { doctorId: newDocId } })).status === 200, 'POST /api/admin/remove-doctor')

    // ---- doctor self-signup + verification ----
    const dReg = await call('POST', '/api/doctor/register', {
      body: {
        name: 'Dr. Self Signup',
        email: `selfdoc_${stamp}@prescrip.com`,
        password: 'doctor1234',
        speciality: 'Gynecologist',
        degree: 'MBBS',
        experience: '2 Years',
        about: 'Registered through the public doctor sign-up form.',
        fee: 800,
      },
    })
    log(dReg.status === 201 && dReg.json?.data?.doctor?.verified === true, 'POST /api/doctor/register (ready to book)')
    const selfDocId = dReg.json?.data?.doctor?._id

    const dRegLogin = await call('POST', '/api/doctor/login', { body: { email: `selfdoc_${stamp}@prescrip.com`, password: 'doctor1234' } })
    log(dRegLogin.status === 200, 'self-registered doctor can log in')

    const pubAfter = await call('GET', '/api/doctor/list')
    log((pubAfter.json?.data?.doctors || []).some((d) => d._id === selfDocId), 'self-registered doctor is publicly listed')

    const verifiedBook = await call('POST', '/api/user/book-appointment', {
      token: userToken,
      body: { doctorId: selfDocId, slotDate, slotTime: slotTime(3) },
    })
    log(verifiedBook.status === 201, 'self-registered doctor is bookable')
    if (verifiedBook.status === 201) {
      await call('POST', '/api/user/cancel-appointment', { token: userToken, body: { appointmentId: verifiedBook.json.data.appointment._id } })
    }

    const suspend = await call('POST', '/api/admin/verify-doctor', { token: aToken, body: { doctorId: selfDocId, verified: false } })
    log(suspend.status === 200 && suspend.json?.data?.doctor?.verified === false, 'doctor can be suspended via API')
    const hiddenList = await call('GET', '/api/doctor/list')
    log(!(hiddenList.json?.data?.doctors || []).some((d) => d._id === selfDocId), 'suspended doctor hidden from public list')

    const dash2 = await call('GET', '/api/admin/dashboard', { token: aToken })
    log(typeof dash2.json?.data?.dashboard?.pendingDoctors === 'number', 'dashboard exposes pendingDoctors', String(dash2.json?.data?.dashboard?.pendingDoctors))

    await call('POST', '/api/admin/remove-doctor', { token: aToken, body: { doctorId: selfDocId } })
  }

  console.log(`\n${passed} passed, ${failed} failed`)
  process.exit(failed ? 1 : 0)
}

run().catch((e) => {
  console.error('Smoke test crashed:', e)
  process.exit(1)
})
