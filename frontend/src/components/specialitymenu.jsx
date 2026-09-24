import { useNavigate } from 'react-router-dom'
import { useApp } from '../context/AppContext'

const ICONS = {
  'General Physician': '🩺',
  Gynecologist: '🌸',
  Dermatologist: '✨',
  Pediatrician: '🧒',
  Neurologist: '🧠',
  Gastroenterologist: '🫃',
  Cardiologist: '❤️',
  Dentist: '🦷',
}

const SpecialityMenu = () => {
  const { specialities } = useApp()
  const navigate = useNavigate()

  if (!specialities?.length) return null

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-20">
      <div className="text-center">
        <h2 className="section-title">Find by Speciality</h2>
        <p className="text-sm text-gray-500 mt-2 max-w-xl mx-auto">
          Simply browse through our extensive list of trusted doctors, schedule your appointment hassle-free.
        </p>
      </div>

      <div className="mt-8 flex gap-4 overflow-x-auto no-scrollbar pb-4 sm:justify-center sm:flex-wrap">
        {specialities.map((s) => (
          <button
            key={s}
            onClick={() => navigate(`/doctors/${s}`)}
            className="shrink-0 w-28 flex flex-col items-center gap-3 py-4 rounded-2xl hover:bg-gray-50 transition"
          >
            <span className="w-16 h-16 rounded-full bg-indigo-50 grid place-items-center text-2xl">{ICONS[s] || '🏥'}</span>
            <span className="text-xs text-gray-600 text-center leading-tight">{s}</span>
          </button>
        ))}
      </div>
    </section>
  )
}

export default SpecialityMenu
