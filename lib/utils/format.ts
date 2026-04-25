export function formatCurrency(amount: number): string {
  return `¥${amount.toLocaleString("ja-JP")}`
}

export function formatPhoneNumber(phone: string): string {
  return phone.replace(/(\d{3})(\d{4})(\d{4})/, "$1-$2-$3")
}

export function fullName(name: string, nameKana: string): string {
  return `${name}（${nameKana}）`
}
