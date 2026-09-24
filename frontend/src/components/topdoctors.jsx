import { useNavigate } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import { toast } from 'react-toastify'
import Avatar from './Avatar'
import Stars from './Stars'

const TopDoctors = () => {
  const { doctors, loadingDoctors } = useApp()
  const navigate = useNavigate()

  const open = (doctor) => {
    if (doctor.available) navigate(`/appointment/${doctor._id}`)
    else toast.info(`${doctor.name} is not available right now`)
  }

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-20">
      <div className="text-center">
        <h2 className="section-title">Top Doctors to Book</h2>
        <p className="text-sm text-gray-500 mt-2 max-w-xl mx-auto">
          Simply browse through our extensive list of trusted doctors.
        </p>
      </div>

      {loadingDoctors ? (
        <div className="mt-8 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="card p-4 animate-pulse">
              <div className="h-40 bg-gray-100 rounded-xl" />
              <div className="h-3 bg-gray-100 rounded mt-4 w-3/4" />
              <div className="h-3 bg-gray-100 rounded mt-2 w-1/2" />
            </div>
          ))}
        </div>
      ) : doctors.length === 0 ? (
        <p className="text-center text-gray-500 mt-8">No doctors available yet.</p>
      ) : (
        <div className="mt-8 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          {doctors.slice(0, 10).map((d) => (
            <button
              key={d._id}
              onClick={() => open(d)}
              className="card p-4 text-left transition hover:-translate-y-1 hover:shadow-md"
            >
              <div className="h-40 rounded-xl bg-indigo-50 grid place-items-center overflow-hidden">
                {d.image ? (
                  <img src={d.image} alt={d.name} className="w-full h-full object-cover" />
                ) : (
                  <Avatar name={d.name} className="w-20 h-20 text-2xl" />
                )}
              </div>
              <p className={`text-xs mt-3 font-medium ${d.available ? 'text-green-600' : 'text-gray-400'}`}>
                {d.available ? '• Available' : '• Not available'}
              </p>
              <p className="text-sm font-medium text-gray-800 truncate mt-1">{d.name}</p>
              <p className="text-xs text-gray-500 truncate">{d.speciality}</p>
              <div className="flex items-center gap-1 mt-1">
                <Stars value={d.rating || 0} size="text-xs" />
                <span className="text-[10px] text-gray-400">{d.rating ? d.rating : 'New'}</span>
              </div>
            </button>
          ))}
        </div>
      )}

      <div className="text-center mt-10">
        <button onClick={() => navigate('/doctors')} className="btn-outline">View all doctors</button>
      </div>
    </section>
  )
}

export default TopDoctors
