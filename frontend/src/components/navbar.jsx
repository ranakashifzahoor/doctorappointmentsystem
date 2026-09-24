import { useState } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import Avatar from './Avatar'

const Navbar = () => {
  const { token, userData, logout } = useApp()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const [menu, setMenu] = useState(false)

  const linkCls = ({ isActive }) =>
    `text-sm transition-colors ${isActive ? 'text-primary font-medium' : 'text-gray-700 hover:text-primary'}`

  return (
    <header className="sticky top-0 z-40 bg-white/90 backdrop-blur border-b border-gray-100">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2" onClick={() => setOpen(false)}>
          <span className="w-9 h-9 rounded-xl bg-primary text-white grid place-items-center font-bold">P</span>
          <span className="text-xl font-semibold text-gray-800">Prescrip</span>
        </Link>

        <ul className="hidden md:flex items-center gap-8">
          <li><NavLink to="/" className={linkCls} end>HOME</NavLink></li>
          <li><NavLink to="/doctors" className={linkCls}>ALL DOCTORS</NavLink></li>
          <li><NavLink to="/about" className={linkCls}>ABOUT</NavLink></li>
          <li><NavLink to="/contact" className={linkCls}>CONTACT</NavLink></li>
        </ul>

        <div className="hidden md:flex items-center gap-3">
          {token && userData ? (
            <div className="relative">
              <button
                onClick={() => setMenu((m) => !m)}
                className="flex items-center gap-2 text-sm text-gray-700 hover:text-primary"
              >
                <Avatar src={userData.image} name={userData.name} className="w-9 h-9 text-sm" />
                <span className="max-w-[8rem] truncate">{userData.name}</span>
                <span className="text-xs">▾</span>
              </button>
              {menu && (
                <div
                  className="absolute right-0 mt-2 w-48 card p-2 text-sm"
                  onMouseLeave={() => setMenu(false)}
                >
                  <Link to="/my-profile" onClick={() => setMenu(false)} className="block px-3 py-2 rounded-lg hover:bg-gray-50">My Profile</Link>
                  <Link to="/my-appointments" onClick={() => setMenu(false)} className="block px-3 py-2 rounded-lg hover:bg-gray-50">My Appointments</Link>
                  <button onClick={() => { setMenu(false); logout(); navigate('/') }} className="block w-full text-left px-3 py-2 rounded-lg hover:bg-gray-50 text-red-500">Logout</button>
                </div>
              )}
            </div>
          ) : (
            <button onClick={() => navigate('/login')} className="btn-primary">Create account</button>
          )}
        </div>

        <button className="md:hidden text-2xl" onClick={() => setOpen((o) => !o)} aria-label="Menu">
          {open ? '✕' : '☰'}
        </button>
      </nav>

      {open && (
        <div className="md:hidden border-t border-gray-100 bg-white px-4 py-3 space-y-1">
          <Link to="/" onClick={() => setOpen(false)} className="block py-2 text-gray-700">HOME</Link>
          <Link to="/doctors" onClick={() => setOpen(false)} className="block py-2 text-gray-700">ALL DOCTORS</Link>
          <Link to="/about" onClick={() => setOpen(false)} className="block py-2 text-gray-700">ABOUT</Link>
          <Link to="/contact" onClick={() => setOpen(false)} className="block py-2 text-gray-700">CONTACT</Link>
          {token && userData ? (
            <>
              <Link to="/my-profile" onClick={() => setOpen(false)} className="block py-2 text-gray-700">My Profile</Link>
              <Link to="/my-appointments" onClick={() => setOpen(false)} className="block py-2 text-gray-700">My Appointments</Link>
              <button onClick={() => { setOpen(false); logout(); navigate('/') }} className="block py-2 text-red-500">Logout</button>
            </>
          ) : (
            <button onClick={() => { setOpen(false); navigate('/login') }} className="btn-primary w-full mt-2">Create account</button>
          )}
        </div>
      )}
    </header>
  )
}

export default Navbar
