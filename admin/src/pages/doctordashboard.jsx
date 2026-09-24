import { useEffect, useMemo, useState } from 'react'
import { toast } from 'react-toastify'
import api, { errMsg } from '../services/api'
import { useAdmin } from '../context/AdminContext'
import StatCard from '../components/StatCard'
import Avatar from '../components/Avatar'
import { prettyDate, prettyTime } from '../utils/format'
import { Link } from 'react-router-dom'

const DoctorDashboard = () => {
  const { dToken, getDoctorAppointments, money } = useAdmin()
  const [appointments, setAppointments] = useState([])
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  const load = async () => {
    setLoading(true)
    const list = await getDoctorAppointments()
    setAppointments(list || [])
    setLoading(false)
  }

  useEffect(() => {
    if (dToken) {
      load()
      api.get('/api/doctor/profile').then(({ data }) => data.success && setProfile(data.data.doctor)).catch(() => {})
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dToken])

  const stats = useMemo(() => {
    const active = appointments.filter((a) => !a.cancelled)
    const earnings = active.filter((a) => a.isCompleted).reduce((sum, a) => sum + (a.amount || 0), 0)
    const patients = new Set(active.map((a) => a.userId))
    return { earnings, count: active.length, patients: patients.size }
  }, [appointments])

  const action = async (endpoint, id, msg) => {
    try {
      const { data } = await api.post(endpoint, { appointmentId: id })
      data.success ? toast.success(msg) : toast.error(data.message)
      load()
    } catch (error) {
      toast.error(errMsg(error))
    }
  }

  return (
    <div>
      <h1 className="text-xl font-semibold text-gray-800">Doctor Dashboard</h1>
      <p className="text-sm text-gray-500 mt-1">Your practice at a glance.</p>

      {profile && profile.verified === false && (
        <div className="mt-5 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          <strong>Pending verification.</strong> Your profile is not yet visible to patients and you
          cannot receive bookings until an admin verifies your account. You can still complete your
          profile in the meantime.
        </div>
      )}

      <div className="grid sm:grid-cols-3 gap-4 mt-6">
        <StatCard label="Earnings (completed)" value={money(stats.earnings)} icon="💰" tone="text-primary" />
        <StatCard label="Appointments" value={stats.count} icon="🗓" />
        <StatCard label="Patients" value={stats.patients} icon="🧑" />
      </div>

      <div className="card mt-8">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h2 className="font-medium text-gray-800">Latest Appointments</h2>
          <Link to="/doctor/appointments" className="text-sm text-primary">View all</Link>
        </div>

        {loading ? (
          <p className="p-8 text-center text-sm text-gray-500">Loading…</p>
        ) : appointments.length === 0 ? (
          <p className="p-8 text-center text-sm text-gray-500">No appointments yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px]">
              <thead className="bg-gray-50">
                <tr>
                  <th className="th">Patient</th>
                  <th className="th">Date</th>
                  <th className="th">Time</th>
                  <th className="th">Payment</th>
                  <th className="th">Status</th>
                  <th className="th">Actions</th>
                </tr>
              </thead>
              <tbody>
                {appointments.slice(0, 5).map((a) => (
                  <tr key={a._id} className="border-t border-gray-100">
                    <td className="td">
                      <div className="flex items-center gap-3">
                        <Avatar src={a.userData?.image} name={a.userData?.name || 'P'} className="w-9 h-9 text-xs" />
                        <span>{a.userData?.name}</span>
                      </div>
                    </td>
                    <td className="td">{prettyDate(a.slotDate)}</td>
                    <td className="td">{prettyTime(a.slotTime)}</td>
                    <td className="td">
                      {a.payment ? <span className="text-green-600">Paid</span> : <span className="text-orange-500">Pending</span>}
                      <span className="text-gray-400"> · {{ card: 'Card', easypaisa: 'Easypaisa', jazzcash: 'JazzCash' }[a.paymentMethod] || a.paymentMethod}</span>
                    </td>
                    <td className="td">
                      {a.cancelled ? <span className="text-red-500">Cancelled</span>
                        : a.isCompleted ? <span className="text-green-600">Completed</span>
                        : <span className="text-orange-500">Pending</span>}
                    </td>
                    <td className="td">
                      {!a.cancelled && !a.isCompleted ? (
                        <div className="flex gap-2">
                          <button
                            onClick={() => action('/api/doctor/complete-appointment', a._id, 'Appointment completed')}
                            className="text-xs border border-green-200 text-green-600 rounded-full px-3 py-1.5 hover:bg-green-50"
                          >
                            Complete
                          </button>
                          <button
                            onClick={() => action('/api/doctor/cancel-appointment', a._id, 'Appointment cancelled')}
                            className="text-xs border border-gray-300 rounded-full px-3 py-1.5 hover:bg-gray-50"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <span className="text-xs text-gray-400">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

export default DoctorDashboard
