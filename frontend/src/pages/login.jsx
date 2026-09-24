import { useEffect, useState } from 'react'
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import { toast } from 'react-toastify'
import api, { errMsg } from '../services/api'
import { useApp } from '../context/AppContext'

const Login = () => {
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const { setToken } = useApp()

  const [state, setState] = useState(pathname === '/signup' ? 'Sign Up' : 'Login')
  const [form, setForm] = useState({ name: '', email: '', password: '' })
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    setState(pathname === '/signup' ? 'Sign Up' : 'Login')
  }, [pathname])

  // token hand-off from the unified portal (?token=***)
  useEffect(() => {
    const handedOff = params.get('token')
    if (handedOff) {
      setToken(handedOff)
      toast.success('Signed in')
      navigate('/', { replace: true })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const onChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }))

  const submit = async (e) => {
    e.preventDefault()
    setBusy(true)
    try {
      const url = state === 'Sign Up' ? '/api/user/register' : '/api/user/login'
      const payload = state === 'Sign Up' ? form : { email: form.email, password: form.password }
      const { data } = await api.post(url, payload)
      if (data.success) {
        setToken(data.data.token)
        toast.success(data.message)
        navigate('/')
      } else toast.error(data.message)
    } catch (error) {
      toast.error(errMsg(error))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <form onSubmit={submit} className="card w-full max-w-md p-8">
        <h2 className="text-2xl font-semibold text-gray-800">{state}</h2>
        <p className="text-sm text-gray-500 mt-1">
          {state === 'Sign Up' ? 'Create your account to book appointments.' : 'Login to manage your appointments.'}
        </p>

        <div className="mt-6 space-y-4">
          {state === 'Sign Up' && (
            <div>
              <label className="label">Full Name</label>
              <input name="name" value={form.name} onChange={onChange} required className="input" placeholder="John Doe" />
            </div>
          )}
          <div>
            <label className="label">Email</label>
            <input type="email" name="email" value={form.email} onChange={onChange} required className="input" placeholder="you@example.com" />
          </div>
          <div>
            <label className="label">Password</label>
            <input type="password" name="password" value={form.password} onChange={onChange} required minLength={8} className="input" placeholder="At least 8 characters" />
          </div>
        </div>

        <button type="submit" disabled={busy} className="btn-primary w-full mt-6">
          {busy ? 'Please wait…' : state === 'Sign Up' ? 'Create account' : 'Login'}
        </button>

        <p className="text-sm text-gray-500 mt-4">
          {state === 'Sign Up' ? 'Already have an account? ' : "Don't have an account? "}
          <button
            type="button"
            onClick={() => { setForm({ name: '', email: '', password: '' }); setState(state === 'Sign Up' ? 'Login' : 'Sign Up') }}
            className="text-primary underline"
          >
            {state === 'Sign Up' ? 'Login' : 'Sign up'}
          </button>
        </p>

        <div className="mt-6 pt-4 border-t border-gray-100 text-xs text-gray-500">
          Are you a doctor?{' '}
          <a href="http://localhost:5174/doctor/login" className="text-primary underline">Doctor login</a>
          {' · '}
          <a href="http://localhost:5174/doctor/signup" className="text-primary underline">Sign up as doctor</a>
        </div>
      </form>
    </div>
  )
}

export default Login
