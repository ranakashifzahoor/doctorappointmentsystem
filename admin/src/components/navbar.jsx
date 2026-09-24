import { Link, useLocation } from 'react-router-dom'
import { useAdmin } from '../context/AdminContext'

const Navbar = () => {
  const { aToken, dToken, adminLogout, doctorLogout } = useAdmin()
  const { pathname } = useLocation()
  const isDoctorArea = pathname.startsWith('/doctor')
  const doctorName = localStorage.getItem('doctorName') || 'Doctor'

  return (
    <header className="sticky top-0 z-30 bg-white border-b border-gray-200">
      <div className="h-16 px-4 sm:px-6 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <span className="w-9 h-9 rounded-xl bg-primary text-white grid place-items-center font-bold">P</span>
          <span className="font-semibold text-gray-800">Prescrip</span>
          <span className="hidden sm:inline text-xs text-gray-400 border border-gray-200 rounded px-2 py-0.5 ml-1">
            {isDoctorArea ? 'Doctor Panel' : 'Admin Panel'}
          </span>
        </Link>

        <div className="flex items-center gap-4 text-sm">
          {isDoctorArea && dToken && (
            <>
              <span className="text-gray-600 hidden sm:inline">{doctorName}</span>
              <button onClick={doctorLogout} className="btn-ghost !py-2">Logout</button>
            </>
          )}
          {!isDoctorArea && aToken && (
            <>
              <span className="text-gray-600 hidden sm:inline">Admin</span>
              <button onClick={adminLogout} className="btn-ghost !py-2">Logout</button>
            </>
          )}
        </div>
      </div>
    </header>
  )
}

export default Navbar
