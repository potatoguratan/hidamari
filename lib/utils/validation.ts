import type { ReservationFormData } from "@/types"

export function isEmailValid(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

export function isPhoneValid(phone: string): boolean {
  return /^[0-9\-+() ]{7,15}$/.test(phone)
}

export function hasDoubleBooking(
  existing: { startTime: string; endTime: string; id?: string }[],
  incoming: ReservationFormData,
  excludeId?: string,
): boolean {
  const start = new Date(incoming.startTime).getTime()
  const end = new Date(incoming.endTime).getTime()

  return existing.some((r) => {
    if (excludeId && r.id === excludeId) return false
    const rStart = new Date(r.startTime).getTime()
    const rEnd = new Date(r.endTime).getTime()
    return start < rEnd && end > rStart
  })
}
