import { useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { toast } from 'react-toastify'
import api, { errMsg } from '../services/api'
import { SPECIALITIES } from '../utils/specialities'
import { useAdmin } from '../context/AdminContext'
import Avatar from '../components/Avatar'

const initial = {
  name: '', email: '', password: '', speciality: 'General Physician', degree: '',
  experience: '', about: '', fee: '', line1: '', line2: '',
}

const DoctorSignup = () => {
  const navigate = useNavigate()
  const { setDToken } = useAdmin()
  const fileRef = useRef(null)
  const [form, setForm] = useState(initial)
  const [image, setImage] = useState(null)
  const [preview, setPreview] = useState('')
  const [busy, setBusy] = useState(false)

  const onChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }))
  const pickImage = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setImage(file)
    setPreview(URL.createObjectURL(file))
  }

  const submit = async (e) => {
    e.preventDefault()
    setBusy(true)
    try {
      const fd = new FormData()
      Object.entries(form).forEach(([k, v]) => fd.append(k, v))
      fd.append('address', JSON.stringify({ line1: form.line1, line2: form.line2 }))
      if (image) fd.append('image', image)

      const { data } = await api.post('/api/doctor/register', fd)
      if (data.success) {
        toast.success(data.message)
        if (data.data?.token) {
          setDToken(data.data.token)
          localStorage.setItem('doctorName', data.data.doctor?.name || 'Doctor')
          navigate('/doctor/dashboard')
        } else {
          navigate('/doctor/login')
        }
      } else toast.error(data.message)
    } catch (error) {
      toast.error(errMsg(error))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center justify-center gap-2 mb-6">
          <span className="w-10 h-10 rounded-xl bg-primary text-white grid place-items-center font-bold">P</span>
          <span className="text-xl font-semibold text-gray-800">Prescrip</span>
        </div>

        <form onSubmit={submit} className="card p-6">
          <h1 className="text-xl font-semibold text-gray-800">Sign up as a doctor</h1>
          <p className="text-sm text-gray-500 mt-1">
            Create your profile. An admin verifies new doctors before they appear in the public list —
            you can log in and complete your profile right away.
          </p>

          <div className="grid gap-6 lg:grid-cols-[200px_1fr] mt-6">
            <div>
              <label className="label">Profile photo</label>
              <div className="relative w-40 h-40 rounded-xl bg-indigo-50 grid place-items-center overflow-hidden border border-dashed border-gray-300">
                {preview ? (
                  <img src={preview} alt="preview" className="w-full h-full object-cover" />
                ) : (
                  <Avatar name={form.name || 'Dr'} className="w-20 h-20 text-2xl" />
                )}
              </div>
              <button type="button" onClick={() => fileRef.current?.click()} className="btn-ghost mt-3 !py-2 w-40">
                Upload photo
              </button>
              <input ref={fileRef} type="file" accept="image/*" hidden onChange={pickImage} />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="label">Full name *</label>
                <input name="name" value={form.name} onChange={onChange} required className="input" placeholder="Dr. Jane Doe" />
              </div>
              <div>
                <label className="label">Speciality *</label>
                <select name="speciality" value={form.speciality} onChange={onChange} className="input">
                  {SPECIALITIES.map((s) => <option key={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className="label">Email *</label>
                <input type="email" name="email" value={form.email} onChange={onChange} required className="input" placeholder="doctor@prescrip.com" />
              </div>
              <div>
                <label className="label">Password *</label>
                <input type="password" name="password" value={form.password} onChange={onChange} required minLength={8} className="input" placeholder="At least 8 characters" />
              </div>
              <div>
                <label className="label">Degree *</label>
                <input name="degree" value={form.degree} onChange={onChange} required className="input" placeholder="MBBS, MD" />
              </div>
              <div>
                <label className="label">Experience *</label>
                <input name="experience" value={form.experience} onChange={onChange} required className="input" placeholder="5 Years" />
              </div>
              <div>
                <label className="label">Consultation fee (Rs.) *</label>
                <input type="number" min="0" name="fee" value={form.fee} onChange={onChange} required className="input" placeholder="1500" />
              </div>
              <div>
                <label className="label">Clinic / address line 1</label>
                <input name="line1" value={form.line1} onChange={onChange} className="input" placeholder="Clinic name" />
              </div>
              <div>
                <label className="label">Address line 2</label>
                <input name="line2" value={form.line2} onChange={onChange} className="input" placeholder="Area, City" />
              </div>
              <div className="sm:col-span-2">
                <label className="label">About you *</label>
                <textarea name="about" value={form.about} onChange={onChange} required rows={4} className="input" placeholder="Short professional bio…" />
              </div>
            </div>
          </div>

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <button type="submit" disabled={busy} className="btn-primary">{busy ? 'Creating account…' : 'Create doctor account'}</button>
            <span className="text-sm text-gray-500">
              Already registered? <Link to="/doctor/login" className="text-primary underline">Doctor login</Link>
            </span>
          </div>
        </form>
      </div>
    </div>
  )
}

export default DoctorSignup
