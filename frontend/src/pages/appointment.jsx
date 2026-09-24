import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { toast } from 'react-toastify'
import api, { errMsg } from '../services/api'
import { useApp } from '../context/AppContext'
import { allSlots, nextDays, prettyTime } from '../utils/slots'
import RelatedDoctors from '../components/RelatedDoctors'
import Avatar from '../components/Avatar'
import Stars from '../components/Stars'

const Appointment = () => {
  const { doctorId } = useParams()
  const { token, money, doctors } = useApp()
  const navigate = useNavigate()

  const [doctor, setDoctor] = useState(null)
  const [reviews, setReviews] = useState([])
  const [rating, setRating] = useState({ average: 0, count: 0 })
  const [loading, setLoading] = useState(true)
  const [selectedDay, setSelectedDay] = useState('')
  const [selectedTime, setSelectedTime] = useState('')
  const [booking, setBooking] = useState(false)

  const days = useMemo(() => nextDays(7), [])

  const load = async () => {
    setLoading(true)
    try {
      const [docRes, reviewRes] = await Promise.all([
        api.get(`/api/doctor/${doctorId}`),
        api.get(`/api/doctor/${doctorId}/reviews`),
      ])
      if (docRes.data.success) setDoctor(docRes.data.data.doctor)
      if (reviewRes.data.success) {
        setReviews(reviewRes.data.data.reviews)
        setRating({ average: reviewRes.data.data.average, count: reviewRes.data.data.count })
      }
    } catch (error) {
      toast.error(errMsg(error))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
    setSelectedDay('')
    setSelectedTime('')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [doctorId])

  const freeSlots = useMemo(() => {
    if (!doctor || !selectedDay) return []
    const booked = doctor.slots_booked?.[selectedDay] || []
    return allSlots().filter((s) => !booked.includes(s))
  }, [doctor, selectedDay])

  const book = async () => {
    if (!token) {
      toast.info('Please login to book an appointment')
      return navigate('/login')
    }
    if (!selectedDay || !selectedTime) return toast.info('Please select a date and a time slot')

    setBooking(true)
    try {
      const { data } = await api.post('/api/user/book-appointment', {
        doctorId: doctor._id,
        slotDate: selectedDay,
        slotTime: selectedTime,
      })
      if (data.success) {
        toast.success(data.message)
        navigate('/my-appointments')
      } else {
        toast.error(data.message)
        load()
      }
    } catch (error) {
      toast.error(errMsg(error))
      load()
    } finally {
      setBooking(false)
    }
  }

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 grid md:grid-cols-[300px_1fr] gap-8 animate-pulse">
        <div className="h-72 bg-gray-100 rounded-2xl" />
        <div className="space-y-4">
          <div className="h-6 bg-gray-100 rounded w-1/2" />
          <div className="h-4 bg-gray-100 rounded w-2/3" />
          <div className="h-40 bg-gray-100 rounded" />
        </div>
      </div>
    )
  }

  if (!doctor) {
    return <div className="max-w-7xl mx-auto px-4 py-20 text-center text-gray-500">Doctor not found.</div>
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="grid md:grid-cols-[300px_1fr] gap-8">
        <aside className="card p-5 self-start">
          <div className="aspect-square rounded-2xl bg-indigo-50 grid place-items-center overflow-hidden">
            {doctor.image ? (
              <img src={doctor.image} alt={doctor.name} className="w-full h-full object-cover" />
            ) : (
              <Avatar name={doctor.name} className="w-28 h-28 text-4xl" />
            )}
          </div>
          <h2 className="text-lg font-semibold text-gray-800 mt-4">{doctor.name}</h2>
          <p className="text-sm text-gray-500">
            {doctor.degree} — {doctor.speciality}
          </p>
          <div className="mt-2 flex items-center gap-2">
            <Stars value={rating.average || doctor.rating || 0} />
            <span className="text-xs text-gray-500">
              {(rating.average || doctor.rating || 0).toFixed(1)} ({rating.count || doctor.reviewCount || 0})
            </span>
          </div>
          <span className={`inline-block mt-3 text-xs px-3 py-1 rounded-full ${doctor.available ? 'bg-green-50 text-green-600' : 'bg-gray-100 text-gray-500'}`}>
            {doctor.available ? 'Available' : 'Not available'}
          </span>
          <div className="mt-4 text-sm text-gray-600 space-y-1">
            <p><span className="text-gray-400">Experience:</span> {doctor.experience}</p>
            <p><span className="text-gray-400">Fee:</span> {money(doctor.fee)}</p>
            <p><span className="text-gray-400">Clinic:</span> {[doctor.address?.line1, doctor.address?.line2].filter(Boolean).join(', ') || '—'}</p>
          </div>
        </aside>

        <section>
          <div className="card p-6">
            <h1 className="text-xl font-semibold text-gray-800">About {doctor.name}</h1>
            <p className="text-sm text-gray-600 mt-3 leading-relaxed">{doctor.about}</p>

            <div className="mt-8">
              <h3 className="font-medium text-gray-800">Booking Slots</h3>

              {!doctor.available ? (
                <p className="mt-3 text-sm text-red-500">This doctor is currently not accepting appointments.</p>
              ) : (
                <>
                  <div className="mt-4 flex gap-3 overflow-x-auto no-scrollbar pb-2">
                    {days.map((d) => (
                      <button
                        key={d.key}
                        onClick={() => { setSelectedDay(d.key); setSelectedTime('') }}
                        className={`shrink-0 w-16 py-3 rounded-xl border text-center transition ${
                          selectedDay === d.key
                            ? 'border-primary bg-indigo-50 text-primary'
                            : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                        }`}
                      >
                        <div className="text-xs">{d.weekday}</div>
                        <div className="text-lg font-medium">{d.day}</div>
                        <div className="text-[10px] text-gray-400">{d.month}</div>
                      </button>
                    ))}
                  </div>

                  {selectedDay && (
                    <div className="mt-4">
                      {freeSlots.length === 0 ? (
                        <p className="text-sm text-gray-500">No slots available on this date. Please try another day.</p>
                      ) : (
                        <div className="flex flex-wrap gap-2">
                          {freeSlots.map((t) => (
                            <button
                              key={t}
                              onClick={() => setSelectedTime(t)}
                              className={`px-4 py-2 rounded-full text-sm border transition ${
                                selectedTime === t
                                  ? 'bg-primary text-white border-primary'
                                  : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                              }`}
                            >
                              {prettyTime(t)}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  <button onClick={book} disabled={booking || !selectedDay || !selectedTime} className="btn-primary mt-6">
                    {booking ? 'Booking…' : `Book Appointment — ${money(doctor.fee)}`}
                  </button>
                </>
              )}
            </div>
          </div>

          {/* reviews */}
          <div className="card p-6 mt-6">
            <div className="flex items-center justify-between">
              <h3 className="font-medium text-gray-800">Patient reviews</h3>
              <div className="flex items-center gap-2">
                <Stars value={rating.average} />
                <span className="text-xs text-gray-500">{rating.count} review(s)</span>
              </div>
            </div>

            {reviews.length === 0 ? (
              <p className="text-sm text-gray-500 mt-4">No reviews yet. Be the first to share your experience.</p>
            ) : (
              <ul className="mt-4 divide-y divide-gray-100">
                {reviews.map((r) => (
                  <li key={r._id} className="py-4 flex gap-3">
                    <Avatar src={r.userImage} name={r.userName} className="w-9 h-9 text-xs" />
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium text-gray-800">{r.userName}</p>
                        <Stars value={r.rating} size="text-xs" />
                      </div>
                      {r.comment && <p className="text-sm text-gray-600 mt-1">{r.comment}</p>}
                      <p className="text-[11px] text-gray-400 mt-1">
                        {new Date(r.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>
      </div>

      <RelatedDoctors speciality={doctor.speciality} docId={doctor._id} />
    </div>
  )
}

export default Appointment
