import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import Avatar from './Avatar'
import Stars from './Stars'

/** Shows other doctors sharing the same speciality. */
const RelatedDoctors = ({ speciality, docId, limit = 5 }) => {
  const { doctors } = useApp()
  const [related, setRelated] = useState([])
  const navigate = useNavigate()

  useEffect(() => {
    if (doctors.length && speciality) {
      setRelated(
        doctors
          .filter((d) => d.speciality === speciality && d._id !== docId)
          .slice(0, limit),
      )
    }
  }, [doctors, speciality, docId, limit])

  if (!related.length) return null

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-20">
      <div className="text-center">
        <h2 className="section-title">Related Doctors</h2>
        <p className="text-sm text-gray-500 mt-2">More specialists in {speciality}.</p>
      </div>

      <div className="mt-8 flex gap-4 overflow-x-auto no-scrollbar pb-4 sm:justify-center">
        {related.map((d) => (
          <button
            key={d._id}
            onClick={() => { navigate(`/appointment/${d._id}`); window.scrollTo(0, 0) }}
            className="card p-4 w-44 shrink-0 text-left transition hover:-translate-y-1 hover:shadow-md"
          >
            <div className="h-32 rounded-xl bg-indigo-50 grid place-items-center overflow-hidden">
              {d.image ? (
                <img src={d.image} alt={d.name} className="w-full h-full object-cover" />
              ) : (
                <Avatar name={d.name} className="w-16 h-16 text-xl" />
              )}
            </div>
            <p className={`text-xs mt-3 font-medium ${d.available ? 'text-green-600' : 'text-gray-400'}`}>
              {d.available ? '• Available' : '• Not available'}
            </p>
            <p className="text-sm font-medium text-gray-800 truncate mt-1">{d.name}</p>
            <p className="text-xs text-gray-500 truncate">{d.speciality}</p>
            <div className="flex items-center gap-1 mt-1">
              <Stars value={d.rating || 0} size="text-[10px]" />
            </div>
          </button>
        ))}
      </div>
    </section>
  )
}

export default RelatedDoctors
