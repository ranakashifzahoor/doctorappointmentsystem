import { useEffect, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { toast } from 'react-toastify'
import api, { errMsg } from '../services/api'
import { useAdmin } from '../context/AdminContext'

const DoctorLogin = () => {
  const { setDToken } = useAdmin()
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const [form, setForm] = useState({ email: '', password: '' })
  const [busy, setBusy] = useState(false)

  // token hand-off from the unified portal (?token=***)
  useEffect(() => {
    const handedOff = params.get('token')
    if (handedOff) {
      setDToken(handedOff)
      toast.success('Signed in')
      navigate('/doctor/dashboard', { replace: true })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const submit = async (e) => {
    e.preventDefault()
    setBusy(true)
    try {
      const { data } = await api.post('/api/doctor/login', form)
      if (data.success) {
        setDToken(data.data.token)
        localStorage.setItem('doctorName', data.data.doctor?.name || 'Doctor')
        toast.success(data.message)
        navigate('/doctor/dashboard')
      } else toast.error(data.message)
    } catch (error) {
      toast.error(errMsg(error))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="min-h-screen grid place-items-center px-4 bg-gray-50">
      <div className="w-full max-w-md">
        <div className="flex items-center justify-center gap-2 mb-6">
          <span className="w-10 h-10 rounded-xl bg-primary text-white grid place-items-center font-bold">P</span>
          <span className="text-xl font-semibold text-gray-800">Prescrip</span>
        </div>

        <form onSubmit={submit} className="card p-8">
          <h1 className="text-xl font-semibold text-gray-800">Doctor Login</h1>
          <p className="text-sm text-gray-500 mt-1">Sign in to manage your appointments and profile.</p>

          <div className="mt-6 space-y-4">
            <div>
              <label className="label">Email</label>
              <input type="email" required className="input" value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="doctor@prescrip.com" />
            </div>
            <div>
              <label className="label">Password</label>
              <input type="password" required className="input" value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="••••••••" />
            </div>
          </div>

          <button type="submit" disabled={busy} className="btn-primary w-full mt-6">{busy ? 'Please wait…' : 'Login'}</button>

          <p className="text-sm text-gray-500 mt-4 text-center">
            Do not have an account?{' '}
            <Link to="/doctor/signup" className="text-primary underline">Sign up as doctor</Link>
          </p>

          <p className="text-sm text-gray-500 mt-2 text-center">
            Are you a patient? <a href="http://localhost:5173/login" className="text-primary underline">Patient login</a>
          </p>
        </form>
      </div>
    </div>
  )
}

export default DoctorLogin
