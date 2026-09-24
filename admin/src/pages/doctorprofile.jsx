import { useEffect, useRef, useState } from 'react'
import { toast } from 'react-toastify'
import api, { errMsg } from '../services/api'
import { useAdmin } from '../context/AdminContext'
import Avatar from '../components/Avatar'

const DoctorProfile = () => {
  const { dToken, money } = useAdmin()
  const fileRef = useRef(null)
  const [doctor, setDoctor] = useState(null)
  const [edit, setEdit] = useState(false)
  const [busy, setBusy] = useState(false)
  const [form, setForm] = useState({ fee: '', about: '', experience: '', line1: '', line2: '' })

  const load = async () => {
    try {
      const { data } = await api.get('/api/doctor/profile')
      if (data.success) {
        setDoctor(data.data.doctor)
        setForm({
          fee: data.data.doctor.fee ?? '',
          about: data.data.doctor.about || '',
          experience: data.data.doctor.experience || '',
          line1: data.data.doctor.address?.line1 || '',
          line2: data.data.doctor.address?.line2 || '',
        })
      }
    } catch (error) {
      toast.error(errMsg(error))
    }
  }

  useEffect(() => {
    if (dToken) load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dToken])

  const onChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }))

  const save = async () => {
    setBusy(true)
    try {
      const fd = new FormData()
      fd.append('fee', form.fee)
      fd.append('about', form.about)
      fd.append('experience', form.experience)
      fd.append('address', JSON.stringify({ line1: form.line1, line2: form.line2 }))
      const { data } = await api.post('/api/doctor/update-profile', fd)
      if (data.success) {
        setDoctor(data.data.doctor)
        toast.success(data.message)
        setEdit(false)
      } else toast.error(data.message)
    } catch (error) {
      toast.error(errMsg(error))
    } finally {
      setBusy(false)
    }
  }

  const uploadImage = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      const fd = new FormData()
      fd.append('image', file)
      const { data } = await api.post('/api/doctor/update-profile', fd)
      if (data.success) {
        setDoctor(data.data.doctor)
        toast.success('Photo updated')
      } else toast.error(data.message)
    } catch (error) {
      toast.error(errMsg(error))
    }
  }

  const toggleAvailability = async () => {
    try {
      const { data } = await api.post('/api/doctor/change-availability')
      if (data.success) {
        toast.success(data.message)
        setDoctor(data.data.doctor)
      }
    } catch (error) {
      toast.error(errMsg(error))
    }
  }

  if (!doctor) return <p className="text-sm text-gray-500">Loading profile…</p>

  const address = [doctor.address?.line1, doctor.address?.line2].filter(Boolean).join(', ')

  return (
    <div className="max-w-3xl">
      <h1 className="text-xl font-semibold text-gray-800">Doctor Profile</h1>

      <div className="card p-6 mt-6 flex flex-col sm:flex-row gap-6">
        <div className="shrink-0">
          <Avatar src={doctor.image} name={doctor.name} className="w-28 h-28 text-3xl" />
          <button onClick={() => fileRef.current?.click()} className="btn-ghost !py-2 mt-3 w-28 text-xs">
            Change photo
          </button>
          <input ref={fileRef} type="file" accept="image/*" hidden onChange={uploadImage} />
        </div>

        <div className="flex-1">
          {edit ? (
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="label">Fee (Rs.)</label>
                <input type="number" name="fee" value={form.fee} onChange={onChange} className="input" />
              </div>
              <div>
                <label className="label">Experience</label>
                <input name="experience" value={form.experience} onChange={onChange} className="input" />
              </div>
              <div>
                <label className="label">Address line 1</label>
                <input name="line1" value={form.line1} onChange={onChange} className="input" />
              </div>
              <div>
                <label className="label">Address line 2</label>
                <input name="line2" value={form.line2} onChange={onChange} className="input" />
              </div>
              <div className="sm:col-span-2">
                <label className="label">About</label>
                <textarea rows={4} name="about" value={form.about} onChange={onChange} className="input" />
              </div>
            </div>
          ) : (
            <div className="space-y-2 text-sm text-gray-600">
              <p className="text-lg font-medium text-gray-800">{doctor.name}</p>
              <p><span className="text-gray-400">Email:</span> {doctor.email}</p>
              <p><span className="text-gray-400">Speciality:</span> {doctor.speciality}</p>
              <p><span className="text-gray-400">Degree:</span> {doctor.degree}</p>
              <p><span className="text-gray-400">Experience:</span> {doctor.experience}</p>
              <p><span className="text-gray-400">Fee:</span> {money(doctor.fee)}</p>
              <p><span className="text-gray-400">Address:</span> {address || '—'}</p>
              <p className="mt-2"><span className="text-gray-400">About:</span> {doctor.about}</p>
            </div>
          )}

          <div className="mt-6 flex flex-wrap gap-3">
            {edit ? (
              <>
                <button onClick={save} disabled={busy} className="btn-primary">{busy ? 'Saving…' : 'Save changes'}</button>
                <button onClick={() => setEdit(false)} className="btn-ghost">Cancel</button>
              </>
            ) : (
              <>
                <button onClick={() => setEdit(true)} className="btn-primary">Edit profile</button>
                <button onClick={toggleAvailability} className="btn-ghost">
                  {doctor.available ? 'Set unavailable' : 'Set available'}
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default DoctorProfile
