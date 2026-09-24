import { useEffect, useState } from 'react'
import { toast } from 'react-toastify'
import api, { errMsg } from '../services/api'
import { useAdmin } from '../context/AdminContext'
import Avatar from '../components/Avatar'
import { calculateAge, prettyDate, prettyTime } from '../utils/format'

const DoctorAppointments = () => {
  const { dToken, getDoctorAppointments, money } = useAdmin()
  const [appointments, setAppointments] = useState([])
  const [loading, setLoading] = useState(true)
  const [busyId, setBusyId] = useState('')

  const load = async () => {
    setLoading(true)
    const list = await getDoctorAppointments()
    setAppointments(list || [])
    setLoading(false)
  }

  useEffect(() => {
    if (dToken) load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dToken])

  const action = async (endpoint, id, msg) => {
    setBusyId(id)
    try {
      const { data } = await api.post(endpoint, { appointmentId: id })
      data.success ? toast.success(msg) : toast.error(data.message)
      load()
    } catch (error) {
      toast.error(errMsg(error))
    } finally {
      setBusyId('')
    }
  }

  return (
    <div>
      <h1 className="text-xl font-semibold text-gray-800">My Appointments</h1>
      <p className="text-sm text-gray-500 mt-1">Complete or cancel visits with your patients.</p>

      {loading ? (
        <p className="card p-8 text-center text-sm text-gray-500 mt-6">Loading…</p>
      ) : appointments.length === 0 ? (
        <p className="card p-8 text-center text-sm text-gray-500 mt-6">No appointments yet.</p>
      ) : (
        <div className="mt-6 space-y-4">
          {appointments.map((a) => {
            const age = calculateAge(a.userData?.dob)
            return (
              <div key={a._id} className="card p-5 flex flex-col lg:flex-row gap-5">
                <div className="flex items-center gap-4 lg:w-64">
                  <Avatar src={a.userData?.image} name={a.userData?.name || 'P'} className="w-14 h-14 text-base" />
                  <div>
                    <p className="font-medium text-gray-800">{a.userData?.name}</p>
                    <p className="text-xs text-gray-500">
                      {age ? `${age} years` : '—'} · {a.userData?.gender || '—'}
                    </p>
                  </div>
                </div>

                <div className="flex-1 grid sm:grid-cols-2 gap-2 text-sm text-gray-600">
                  <p><span className="text-gray-400">Date &amp; time:</span> {prettyDate(a.slotDate)} · {prettyTime(a.slotTime)}</p>
                  <p><span className="text-gray-400">Fee:</span> {money(a.amount)}</p>
                  <p>
                    <span className="text-gray-400">Payment:</span>{' '}
                    {a.payment ? <span className="text-green-600">Paid</span> : <span className="text-orange-500">Pending</span>}
                    {' · '}{{ card: 'Card', easypaisa: 'Easypaisa', jazzcash: 'JazzCash' }[a.paymentMethod] || a.paymentMethod}
                  </p>
                  <p><span className="text-gray-400">Phone:</span> {a.userData?.phone || '—'}</p>
                </div>

                <div className="lg:w-56 flex flex-col justify-center gap-2">
                  {a.cancelled ? (
                    <div className="text-center py-2 rounded-lg bg-red-50 text-red-500 text-sm">Cancelled</div>
                  ) : a.isCompleted ? (
                    <div className="text-center py-2 rounded-lg bg-green-50 text-green-600 text-sm">Completed</div>
                  ) : (
                    <>
                      <button
                        disabled={busyId === a._id}
                        onClick={() => action('/api/doctor/complete-appointment', a._id, 'Appointment completed')}
                        className="border border-green-200 text-green-600 rounded-lg py-2.5 text-sm hover:bg-green-50 transition"
                      >
                        Complete Appointment
                      </button>
                      <button
                        disabled={busyId === a._id}
                        onClick={() => action('/api/doctor/cancel-appointment', a._id, 'Appointment cancelled')}
                        className="border border-gray-300 rounded-lg py-2.5 text-sm hover:bg-gray-50 transition"
                      >
                        Cancel Appointment
                      </button>
                    </>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default DoctorAppointments
