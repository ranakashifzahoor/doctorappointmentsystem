import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'react-toastify'
import api, { errMsg } from '../services/api'
import { useApp } from '../context/AppContext'
import Avatar from '../components/Avatar'

const MyProfile = () => {
  const { token, userData, setUserData, loadUserProfile } = useApp()
  const navigate = useNavigate()
  const fileRef = useRef(null)

  const [edit, setEdit] = useState(false)
  const [busy, setBusy] = useState(false)
  const [form, setForm] = useState({
    name: '', phone: '', line1: '', line2: '', gender: 'Not Selected', dob: 'Not Selected',
  })

  useEffect(() => {
    if (!token) return navigate('/login')
    loadUserProfile()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token])

  useEffect(() => {
    if (userData) {
      setForm({
        name: userData.name || '',
        phone: userData.phone || '',
        line1: userData.address?.line1 || '',
        line2: userData.address?.line2 || '',
        gender: userData.gender || 'Not Selected',
        dob: userData.dob || 'Not Selected',
      })
    }
  }, [userData])

  const onChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }))

  const save = async () => {
    setBusy(true)
    try {
      const fd = new FormData()
      fd.append('name', form.name)
      fd.append('phone', form.phone)
      fd.append('gender', form.gender)
      fd.append('dob', form.dob)
      fd.append('address', JSON.stringify({ line1: form.line1, line2: form.line2 }))

      const { data } = await api.post('/api/user/update-profile', fd)
      if (data.success) {
        setUserData(data.data.user)
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
    setBusy(true)
    try {
      const fd = new FormData()
      fd.append('image', file)
      const { data } = await api.post('/api/user/update-profile', fd)
      if (data.success) {
        setUserData(data.data.user)
        toast.success('Profile image updated')
      } else toast.error(data.message)
    } catch (error) {
      toast.error(errMsg(error))
    } finally {
      setBusy(false)
    }
  }

  if (!userData) {
    return <div className="max-w-4xl mx-auto px-4 py-16 text-center text-gray-500">Loading profile…</div>
  }

  const address = [userData.address?.line1, userData.address?.line2].filter(Boolean).join(', ')

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <h1 className="text-2xl font-semibold text-gray-800">My Profile</h1>

      <div className="card p-6 mt-6 flex flex-col sm:flex-row gap-6">
        <div className="relative w-32 h-32 shrink-0">
          <Avatar src={userData.image} name={userData.name} className="w-32 h-32 text-3xl" />
          {edit && (
            <>
              <button
                onClick={() => fileRef.current?.click()}
                className="absolute bottom-0 right-0 bg-primary text-white w-9 h-9 rounded-full grid place-items-center text-lg shadow"
                title="Upload photo"
              >
                +
              </button>
              <input ref={fileRef} type="file" accept="image/*" hidden onChange={uploadImage} />
            </>
          )}
        </div>

        <div className="flex-1">
          {edit ? (
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="label">Name</label>
                <input name="name" value={form.name} onChange={onChange} className="input" />
              </div>
              <div>
                <label className="label">Phone</label>
                <input name="phone" value={form.phone} onChange={onChange} className="input" />
              </div>
              <div>
                <label className="label">Gender</label>
                <select name="gender" value={form.gender} onChange={onChange} className="input">
                  <option>Not Selected</option>
                  <option>Male</option>
                  <option>Female</option>
                  <option>Other</option>
                </select>
              </div>
              <div>
                <label className="label">Date of Birth</label>
                <input type="date" name="dob" value={form.dob === 'Not Selected' ? '' : form.dob} onChange={onChange} className="input" />
              </div>
              <div>
                <label className="label">Address line 1</label>
                <input name="line1" value={form.line1} onChange={onChange} className="input" />
              </div>
              <div>
                <label className="label">Address line 2</label>
                <input name="line2" value={form.line2} onChange={onChange} className="input" />
              </div>
            </div>
          ) : (
            <div className="space-y-3 text-sm text-gray-600">
              <p className="text-lg font-medium text-gray-800">{userData.name}</p>
              <p><span className="text-gray-400">Email:</span> {userData.email}</p>
              <p><span className="text-gray-400">Phone:</span> {userData.phone || '—'}</p>
              <p><span className="text-gray-400">Address:</span> {address || '—'}</p>
              <p><span className="text-gray-400">Gender:</span> {userData.gender || '—'}</p>
              <p><span className="text-gray-400">Date of Birth:</span> {userData.dob || '—'}</p>
            </div>
          )}

          <div className="mt-6 flex gap-3">
            {edit ? (
              <>
                <button onClick={save} disabled={busy} className="btn-primary">{busy ? 'Saving…' : 'Save changes'}</button>
                <button onClick={() => setEdit(false)} className="btn-outline">Cancel</button>
              </>
            ) : (
              <button onClick={() => setEdit(true)} className="btn-outline">Edit profile</button>
            )}
          </div>
        </div>
      </div>

      <div className="card p-6 mt-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <p className="font-medium text-gray-800">Appointments</p>
          <p className="text-sm text-gray-500">View, pay for or cancel your booked appointments.</p>
        </div>
        <button onClick={() => navigate('/my-appointments')} className="btn-primary">My appointments</button>
      </div>
    </div>
  )
}

export default MyProfile
