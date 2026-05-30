export function isEmailValid(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

export function isPhoneValid(phone: string): boolean {
  return /^[0-9\-+() ]{7,15}$/.test(phone)
}
