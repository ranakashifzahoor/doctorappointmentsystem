export const prettyTime = (t) => {
  if (!t) return ''
  const [h, m] = t.split(':').map(Number)
  const suffix = h >= 12 ? 'PM' : 'AM'
  const hh = h % 12 === 0 ? 12 : h % 12
  return `${String(hh).padStart(2, '0')}:${String(m).padStart(2, '0')} ${suffix}`
}

export const prettyDate = (key) => {
  if (!key) return ''
  const d = new Date(`${key}T00:00:00`)
  return d.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })
}

export const calculateAge = (dob) => {
  if (!dob || dob === 'Not Selected') return null
  const birth = new Date(dob)
  if (Number.isNaN(birth.getTime())) return null
  const diff = Date.now() - birth.getTime()
  return Math.abs(new Date(diff).getUTCFullYear() - 1970)
}
