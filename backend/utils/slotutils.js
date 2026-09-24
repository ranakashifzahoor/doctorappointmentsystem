/** Business hours used to generate appointment slots (30-minute steps). */
export const SLOT_START_HOUR = 10 // 10:00
export const SLOT_END_HOUR = 21 // last slot starts at 20:30
export const SLOT_STEP_MINUTES = 30

/** All possible slots for a single day -> ["10:00", "10:30", ...] */
export const allSlots = () => {
  const slots = []
  for (let h = SLOT_START_HOUR; h < SLOT_END_HOUR; h++) {
    for (let m = 0; m < 60; m += SLOT_STEP_MINUTES) {
      slots.push(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`)
    }
  }
  return slots
}

/** Today's date (local) as YYYY-MM-DD. */
export const today = () => toDateKey(new Date())

export const toDateKey = (date) => {
  const d = new Date(date)
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

/** Next `days` date keys starting from today (inclusive). */
export const nextDateKeys = (days) => {
  const out = []
  const base = new Date()
  base.setHours(0, 0, 0, 0)
  for (let i = 0; i < days; i++) {
    const d = new Date(base)
    d.setDate(base.getDate() + i)
    out.push(toDateKey(d))
  }
  return out
}

/** Slots for `dateKey` that are still free for a doctor. */
export const freeSlots = (doctor, dateKey) => {
  const booked = (doctor?.slots_booked && doctor.slots_booked[dateKey]) || []
  return allSlots().filter((slot) => !booked.includes(slot))
}
