import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'react-toastify'
import api, { errMsg } from '../services/api'
import { useApp } from '../context/AppContext'
import { allSlots, nextDays, prettyDate, prettyTime } from '../utils/slots'
import Avatar from '../components/Avatar'

const METHOD_LABEL = { card: 'Card / Wallet', easypaisa: 'Easypaisa', jazzcash: 'JazzCash', Online: 'Online' }

const MyAppointments = () => {
  const { token, money, paymentMethods } = useApp()
  const navigate = useNavigate()

  const [appointments, setAppointments] = useState([])
  const [loading, setLoading] = useState(true)
  const [busyId, setBusyId] = useState('')
  const [payFor, setPayFor] = useState(null)
  const [rescheduleFor, setRescheduleFor] = useState(null)
  const [reviewFor, setReviewFor] = useState(null)
  const [tab, setTab] = useState('upcoming')

  const load = async () => {
    setLoading(true)
    try {
      const { data } = await api.get('/api/user/appointments')
      if (data.success) setAppointments(data.data.appointments)
      else toast.error(data.message)
    } catch (error) {
      toast.error(errMsg(error))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!token) return navigate('/login')
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token])

  const cancel = async (id) => {
    if (!confirm('Cancel this appointment?')) return
    setBusyId(id)
    try {
      const { data } = await api.post('/api/user/cancel-appointment', { appointmentId: id })
      data.success ? toast.success(data.message) : toast.error(data.message)
      load()
    } catch (error) {
      toast.error(errMsg(error))
    } finally {
      setBusyId('')
    }
  }

  const filtered = useMemo(() => {
    if (tab === 'upcoming') return appointments.filter((a) => !a.cancelled && !a.isCompleted)
    if (tab === 'completed') return appointments.filter((a) => a.isCompleted)
    return appointments.filter((a) => a.cancelled)
  }, [appointments, tab])

  if (loading) {
    return <div className="max-w-5xl mx-auto px-4 py-16 text-center text-gray-500">Loading appointments…</div>
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <h1 className="text-2xl font-semibold text-gray-800">My Appointments</h1>
      <p className="text-sm text-gray-500 mt-1">Track, pay for, reschedule or cancel your visits.</p>

      <div className="flex gap-2 mt-5">
        {[
          ['upcoming', 'Upcoming'],
          ['completed', 'Completed'],
          ['cancelled', 'Cancelled'],
        ].map(([id, label]) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={`px-4 py-2 rounded-full text-sm border ${tab === id ? 'bg-primary text-white border-primary' : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}
          >
            {label}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="card p-12 text-center mt-8">
          <p className="text-gray-500">Nothing here yet.</p>
          <button onClick={() => navigate('/doctors')} className="btn-primary mt-5">Find a doctor</button>
        </div>
      ) : (
        <div className="mt-8 space-y-5">
          {filtered.map((a) => (
            <div key={a._id} className="card p-5 flex flex-col sm:flex-row gap-5">
              <div className="shrink-0">
                <div className="w-28 h-32 rounded-xl bg-indigo-50 grid place-items-center overflow-hidden">
                  {a.doctorData?.image ? (
                    <img src={a.doctorData.image} alt={a.doctorData.name} className="w-full h-full object-cover" />
                  ) : (
                    <Avatar name={a.doctorData?.name || 'Doctor'} className="w-16 h-16 text-xl" />
                  )}
                </div>
              </div>

              <div className="flex-1">
                <p className="font-medium text-gray-800">{a.doctorData?.name}</p>
                <p className="text-sm text-gray-500">{a.doctorData?.speciality}</p>
                <div className="text-sm text-gray-600 mt-2 space-y-1">
                  <p><span className="text-gray-400">Date &amp; time:</span> {prettyDate(a.slotDate)} · {prettyTime(a.slotTime)}</p>
                  <p><span className="text-gray-400">Fee:</span> {money(a.amount)}</p>
                  <p>
                    <span className="text-gray-400">Payment:</span>{' '}
                    {a.payment ? <span className="text-green-600">Paid</span> : <span className="text-orange-500">Pending</span>}
                    {' · '}{METHOD_LABEL[a.paymentMethod] || a.paymentMethod}
                  </p>
                </div>
              </div>

              <div className="sm:w-56 flex flex-col gap-2 justify-center">
                {a.cancelled ? (
                  <div className="text-center py-2 rounded-full bg-red-50 text-red-500 text-sm">Cancelled</div>
                ) : a.isCompleted ? (
                  <>
                    <div className="text-center py-2 rounded-full bg-green-50 text-green-600 text-sm">Completed</div>
                    {a.reviewed ? (
                      <p className="text-center text-xs text-gray-400">Review submitted</p>
                    ) : (
                      <button onClick={() => setReviewFor(a)} className="btn-outline !py-2.5">Rate doctor</button>
                    )}
                  </>
                ) : (
                  <>
                    {!a.payment && (
                      <button disabled={busyId === a._id} onClick={() => setPayFor(a)} className="btn-primary">
                        Pay Online
                      </button>
                    )}
                    <button onClick={() => setRescheduleFor(a)} className="btn-outline !py-2.5">Reschedule</button>
                    <button
                      disabled={busyId === a._id}
                      onClick={() => cancel(a._id)}
                      className="border border-gray-300 rounded-full py-3 text-sm text-gray-700 hover:bg-gray-50 transition"
                    >
                      Cancel Appointment
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {payFor && (
        <PayModal
          appointment={payFor}
          methods={paymentMethods}
          money={money}
          onClose={() => setPayFor(null)}
          onDone={() => { setPayFor(null); load() }}
        />
      )}

      {rescheduleFor && (
        <RescheduleModal
          appointment={rescheduleFor}
          onClose={() => setRescheduleFor(null)}
          onDone={() => { setRescheduleFor(null); load() }}
        />
      )}

      {reviewFor && (
        <ReviewModal
          appointment={reviewFor}
          onClose={() => setReviewFor(null)}
          onDone={() => { setReviewFor(null); load() }}
        />
      )}
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Payment modal — choose a method and complete the payment            */
/* ------------------------------------------------------------------ */
const PayModal = ({ appointment, methods, money, onClose, onDone }) => {
  const [method, setMethod] = useState(methods[0]?.id || 'card')
  const [busy, setBusy] = useState(false)

  const pay = async () => {
    setBusy(true)
    try {
      const { data } = await api.post('/api/user/payment', { appointmentId: appointment._id, method })
      if (!data.success) return toast.error(data.message)

      const { provider, order, keyId, demo } = data.data

      if (demo) {
        const verify = await api.post('/api/user/verify-payment', {
          appointmentId: appointment._id,
          method,
          paymentId: `demo_${method}_${Date.now()}`,
          orderId: order.id,
        })
        verify.data.success ? toast.success('Payment successful') : toast.error(verify.data.message)
        return onDone()
      }

      if (provider === 'razorpay') {
        await loadRazorpayScript()
        const rzp = new window.Razorpay({
          key: keyId || import.meta.env.VITE_PAYMENT_KEY_ID,
          amount: order.amount,
          currency: order.currency,
          name: 'Prescrip',
          description: `Appointment with ${appointment.doctorData?.name || 'doctor'}`,
          order_id: order.id,
          handler: async (response) => {
            try {
              const verify = await api.post('/api/user/verify-payment', {
                appointmentId: appointment._id,
                method: 'card',
                ...response,
              })
              verify.data.success ? toast.success('Payment successful') : toast.error(verify.data.message)
            } catch (e) {
              toast.error(errMsg(e))
            } finally {
              onDone()
            }
          },
          theme: { color: '#5f6FFF' },
        })
        rzp.open()
        return
      }

      // Easypaisa / JazzCash live redirect flow
      toast.info(`Redirecting to ${METHOD_LABEL[method]}…`)
      const form = document.createElement('form')
      form.method = 'POST'
      form.action = data.data.endpoint
      Object.entries(order).forEach(([k, v]) => {
        const input = document.createElement('input')
        input.type = 'hidden'
        input.name = k
        input.value = v
        form.appendChild(input)
      })
      document.body.appendChild(form)
      form.submit()
    } catch (error) {
      const required = error?.response?.data?.required
      if (required) {
        toast.error(error.response.data.message)
        alert(`Payment gateway not configured.\n\nService: ${required.service}\nWhere: ${required.where}\nEnv vars: ${required.env.join(', ')}`)
      } else toast.error(errMsg(error))
    } finally {
      setBusy(false)
    }
  }

  return (
    <Modal title="Complete payment" onClose={onClose}>
      <p className="text-sm text-gray-500">
        Amount due: <span className="font-medium text-gray-800">{money(appointment.amount)}</span>
      </p>

      <div className="mt-4 space-y-2">
        {methods.length === 0 && <p className="text-sm text-red-500">No payment methods available on the server.</p>}
        {methods.map((m) => (
          <label
            key={m.id}
            className={`flex items-center gap-3 border rounded-xl p-3 cursor-pointer ${method === m.id ? 'border-primary bg-indigo-50' : 'border-gray-200 hover:bg-gray-50'}`}
          >
            <input type="radio" name="method" value={m.id} checked={method === m.id} onChange={() => setMethod(m.id)} />
            <span className="text-sm text-gray-700">{m.label}</span>
          </label>
        ))}
      </div>

      <div className="flex gap-3 mt-6">
        <button onClick={pay} disabled={busy || methods.length === 0} className="btn-primary">
          {busy ? 'Processing…' : 'Pay now'}
        </button>
        <button onClick={onClose} className="btn-outline">Cancel</button>
      </div>
    </Modal>
  )
}

/* ------------------------------------------------------------------ */
/* Reschedule modal                                                    */
/* ------------------------------------------------------------------ */
const RescheduleModal = ({ appointment, onClose, onDone }) => {
  const [doctor, setDoctor] = useState(null)
  const [day, setDay] = useState('')
  const [time, setTime] = useState('')
  const [busy, setBusy] = useState(false)
  const days = useMemo(() => nextDays(7), [])

  useEffect(() => {
    api.get(`/api/doctor/${appointment.doctorId}`).then(({ data }) => {
      if (data.success) setDoctor(data.data.doctor)
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [appointment.doctorId])

  const freeSlots = useMemo(() => {
    if (!doctor || !day) return []
    const booked = doctor.slots_booked?.[day] || []
    return allSlots().filter((s) => !booked.includes(s))
  }, [doctor, day])

  const submit = async () => {
    if (!day || !time) return toast.info('Pick a new date and time')
    setBusy(true)
    try {
      const { data } = await api.post('/api/user/reschedule-appointment', {
        appointmentId: appointment._id,
        slotDate: day,
        slotTime: time,
      })
      data.success ? toast.success(data.message) : toast.error(data.message)
      if (data.success) onDone()
    } catch (error) {
      toast.error(errMsg(error))
    } finally {
      setBusy(false)
    }
  }

  return (
    <Modal title="Reschedule appointment" onClose={onClose}>
      <p className="text-sm text-gray-500">
        Current: {prettyDate(appointment.slotDate)} · {prettyTime(appointment.slotTime)}
      </p>

      <div className="mt-4 flex gap-2 overflow-x-auto no-scrollbar pb-2">
        {days.map((d) => (
          <button
            key={d.key}
            onClick={() => { setDay(d.key); setTime('') }}
            className={`shrink-0 w-16 py-3 rounded-xl border text-center ${day === d.key ? 'border-primary bg-indigo-50 text-primary' : 'border-gray-200 text-gray-600'}`}
          >
            <div className="text-xs">{d.weekday}</div>
            <div className="text-lg font-medium">{d.day}</div>
            <div className="text-[10px] text-gray-400">{d.month}</div>
          </button>
        ))}
      </div>

      {day && (
        <div className="mt-3 flex flex-wrap gap-2 max-h-40 overflow-y-auto">
          {freeSlots.length === 0 ? (
            <p className="text-sm text-gray-500">No slots free on this day.</p>
          ) : (
            freeSlots.map((t) => (
              <button
                key={t}
                onClick={() => setTime(t)}
                className={`px-3 py-1.5 rounded-full text-sm border ${time === t ? 'bg-primary text-white border-primary' : 'border-gray-200 text-gray-600'}`}
              >
                {prettyTime(t)}
              </button>
            ))
          )}
        </div>
      )}

      <div className="flex gap-3 mt-6">
        <button onClick={submit} disabled={busy || !time} className="btn-primary">{busy ? 'Saving…' : 'Confirm'}</button>
        <button onClick={onClose} className="btn-outline">Cancel</button>
      </div>
    </Modal>
  )
}

/* ------------------------------------------------------------------ */
/* Review modal                                                        */
/* ------------------------------------------------------------------ */
const ReviewModal = ({ appointment, onClose, onDone }) => {
  const [rating, setRating] = useState(5)
  const [comment, setComment] = useState('')
  const [busy, setBusy] = useState(false)

  const submit = async () => {
    setBusy(true)
    try {
      const { data } = await api.post('/api/user/review', {
        appointmentId: appointment._id,
        rating,
        comment,
      })
      data.success ? toast.success(data.message) : toast.error(data.message)
      if (data.success) onDone()
    } catch (error) {
      toast.error(errMsg(error))
    } finally {
      setBusy(false)
    }
  }

  return (
    <Modal title={`Rate ${appointment.doctorData?.name || 'your doctor'}`} onClose={onClose}>
      <div className="flex gap-1 mt-2">
        {[1, 2, 3, 4, 5].map((i) => (
          <button key={i} onClick={() => setRating(i)} className={`text-3xl ${i <= rating ? 'text-amber-400' : 'text-gray-300'}`}>
            ★
          </button>
        ))}
      </div>
      <textarea
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        rows={3}
        className="input mt-4"
        placeholder="Share how your visit went (optional)…"
      />
      <div className="flex gap-3 mt-6">
        <button onClick={submit} disabled={busy} className="btn-primary">{busy ? 'Sending…' : 'Submit review'}</button>
        <button onClick={onClose} className="btn-outline">Cancel</button>
      </div>
    </Modal>
  )
}

/* ------------------------------------------------------------------ */
const Modal = ({ title, children, onClose }) => (
  <div className="fixed inset-0 z-50 bg-black/40 grid place-items-center p-4" onClick={onClose}>
    <div className="bg-white rounded-2xl w-full max-w-md p-6" onClick={(e) => e.stopPropagation()}>
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-gray-800">{title}</h3>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">✕</button>
      </div>
      <div className="mt-4">{children}</div>
    </div>
  </div>
)

/** Load the Razorpay checkout script on demand. */
export const loadRazorpayScript = () =>
  new Promise((resolve, reject) => {
    if (window.Razorpay) return resolve(true)
    const s = document.createElement('script')
    s.src = 'https://checkout.razorpay.com/v1/checkout.js'
    s.onload = () => resolve(true)
    s.onerror = () => reject(new Error('Failed to load Razorpay checkout'))
    document.body.appendChild(s)
  })

export default MyAppointments
