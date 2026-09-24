import { useEffect } from 'react'
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useAdmin } from '../context/AdminContext'
import Navbar from './Navbar'

const DoctorLayout = () => {
  const { dToken } = useAdmin()
  const navigate = useNavigate()
  const { pathname } = useLocation()

  useEffect(() => {
    if (!dToken) navigate('/doctor/login')
  }, [dToken, navigate])

  if (!dToken) return null

  const link = (to, label) => (
    <Link
      to={to}
      className={`px-4 py-2 rounded-lg text-sm ${pathname === to ? 'bg-primary text-white' : 'text-gray-600 hover:bg-gray-100'}`}
    >
      {label}
    </Link>
  )

  return (
    <div>
      <Navbar />
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
        <div className="flex gap-2 mb-6 flex-wrap">
          {link('/doctor/dashboard', 'Dashboard')}
          {link('/doctor/appointments', 'Appointments')}
          {link('/doctor/profile', 'Profile')}
        </div>
        <Outlet />
      </div>
    </div>
  )
}

export default DoctorLayout
