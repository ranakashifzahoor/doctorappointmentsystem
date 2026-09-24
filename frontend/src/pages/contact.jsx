import { useState } from 'react'
import { toast } from 'react-toastify'
import api, { errMsg } from '../services/api'

const Contact = () => {
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' })
  const [busy, setBusy] = useState(false)

  const onChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }))

  const submit = async (e) => {
    e.preventDefault()
    setBusy(true)
    try {
      const { data } = await api.post('/api/contact', form)
      if (data.success) {
        toast.success(data.message)
        setForm({ name: '', email: '', subject: '', message: '' })
      } else toast.error(data.message)
    } catch (error) {
      toast.error(errMsg(error))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-3xl font-semibold text-gray-800">Contact us</h1>
      <p className="text-gray-600 mt-3">Questions, feedback or partnership ideas — we'd love to hear from you.</p>

      <div className="grid md:grid-cols-2 gap-8 mt-10">
        <div className="card p-6 space-y-4 text-sm text-gray-600">
          <div>
            <p className="text-gray-400 text-xs uppercase tracking-wide">Office</p>
            <p className="mt-1">Prescrip HQ, 21 Care Street, Lahore</p>
          </div>
          <div>
            <p className="text-gray-400 text-xs uppercase tracking-wide">Phone</p>
            <p className="mt-1">+92 300 1234567</p>
          </div>
          <div>
            <p className="text-gray-400 text-xs uppercase tracking-wide">Email</p>
            <p className="mt-1">support@prescrip.com</p>
          </div>
          <div>
            <p className="text-gray-400 text-xs uppercase tracking-wide">Hours</p>
            <p className="mt-1">Monday – Saturday, 9:00 – 21:00</p>
          </div>
        </div>

        <form onSubmit={submit} className="card p-6 space-y-4">
          <div>
            <label className="label">Name</label>
            <input name="name" value={form.name} onChange={onChange} required className="input" placeholder="Your name" />
          </div>
          <div>
            <label className="label">Email</label>
            <input type="email" name="email" value={form.email} onChange={onChange} required className="input" placeholder="you@example.com" />
          </div>
          <div>
            <label className="label">Subject</label>
            <input name="subject" value={form.subject} onChange={onChange} className="input" placeholder="How can we help?" />
          </div>
          <div>
            <label className="label">Message</label>
            <textarea name="message" value={form.message} onChange={onChange} rows={4} required className="input" placeholder="Write your message…" />
          </div>
          <button disabled={busy} className="btn-primary">{busy ? 'Sending…' : 'Send message'}</button>
        </form>
      </div>
    </div>
  )
}

export default Contact
