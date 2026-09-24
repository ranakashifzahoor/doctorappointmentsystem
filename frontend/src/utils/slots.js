export const SLOT_START_HOUR = 10
export const SLOT_END_HOUR = 21
export const SLOT_STEP_MINUTES = 30

export const allSlots = () => {
  const slots = []
  for (let h = SLOT_START_HOUR; h < SLOT_END_HOUR; h++) {
    for (let m = 0; m < 60; m += SLOT_STEP_MINUTES) {
      slots.push(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`)
    }
  }
  return slots
}

export const toKey = (d) => {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

/** Next `n` days as { key, day, dateLabel, weekday }. */
export const nextDays = (n = 7) => {
  const out = []
  const base = new Date()
  base.setHours(0, 0, 0, 0)
  const weekday = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT']
  for (let i = 0; i < n; i++) {
    const d = new Date(base)
    d.setDate(base.getDate() + i)
    out.push({
      key: toKey(d),
      day: d.getDate(),
      weekday: weekday[d.getDay()],
      month: d.toLocaleString('en-US', { month: 'short' }),
    })
  }
  return out
}

/** Human label: 13:30 -> 01:30 PM */
export const prettyTime = (t) => {
  const [h, m] = t.split(':').map(Number)
  const suffix = h >= 12 ? 'PM' : 'AM'
  const hh = h % 12 === 0 ? 12 : h % 12
  return `${String(hh).padStart(2, '0')}:${String(m).padStart(2, '0')} ${suffix}`
}

/** Pretty date: 2026-09-27 -> Sun, 27 Sep 2026 */
export const prettyDate = (key) => {
  if (!key) return ''
  const d = new Date(`${key}T00:00:00`)
  return d.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })
}
