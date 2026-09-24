import { useNavigate } from 'react-router-dom'
import { toast } from 'react-toastify'
import Avatar from './Avatar'
import Stars from './Stars'

const DoctorCard = ({ doctor }) => {
  const navigate = useNavigate()

  const open = () => {
    if (doctor.available) navigate(`/appointment/${doctor._id}`)
    else toast.info(`${doctor.name} is not available right now`)
  }

  return (
    <button
      onClick={open}
      className="card p-4 text-left transition hover:-translate-y-1 hover:shadow-md"
    >
      <div className="aspect-[4/3] rounded-xl bg-indigo-50 grid place-items-center overflow-hidden">
        {doctor.image ? (
          <img src={doctor.image} alt={doctor.name} className="w-full h-full object-cover" />
        ) : (
          <Avatar name={doctor.name} className="w-20 h-20 text-2xl" />
        )}
      </div>
      <p className={`text-xs mt-3 font-medium ${doctor.available ? 'text-green-600' : 'text-gray-400'}`}>
        {doctor.available ? '• Available' : '• Not available'}
      </p>
      <p className="text-sm font-medium text-gray-800 truncate mt-1">{doctor.name}</p>
      <p className="text-xs text-gray-500 truncate">{doctor.speciality}</p>
      <div className="flex items-center gap-1 mt-1">
        <Stars value={doctor.rating || 0} size="text-xs" />
        <span className="text-[10px] text-gray-400">
          {doctor.rating ? `${doctor.rating} (${doctor.reviewCount})` : 'New'}
        </span>
      </div>
      <p className="text-xs text-gray-400 mt-1 truncate">{doctor.experience} experience</p>
    </button>
  )
}

export default DoctorCard
