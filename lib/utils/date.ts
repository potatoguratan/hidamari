import {
  format,
  parseISO,
  startOfMonth,
  endOfMonth,
  startOfYear,
  endOfYear,
  startOfDay,
  endOfDay,
  eachDayOfInterval,
  isSameDay,
  addMinutes,
} from "date-fns"
import { ja } from "date-fns/locale"

export function formatDate(date: string | Date, pattern = "yyyy/MM/dd"): string {
  const d = typeof date === "string" ? parseISO(date) : date
  return format(d, pattern, { locale: ja })
}

export function formatDateTime(date: string | Date): string {
  return formatDate(date, "yyyy/MM/dd HH:mm")
}

export function formatTime(date: string | Date): string {
  return formatDate(date, "HH:mm")
}

export function formatYearMonth(date: string | Date): string {
  return formatDate(date, "yyyy年M月")
}

export function getMonthRange(year: number, month: number) {
  const d = new Date(year, month - 1)
  return { start: startOfMonth(d), end: endOfMonth(d) }
}

export function getYearRange(year: number) {
  const d = new Date(year, 0)
  return { start: startOfYear(d), end: endOfYear(d) }
}

export function getDayRange(date: Date) {
  return { start: startOfDay(date), end: endOfDay(date) }
}

export function getDaysInMonth(year: number, month: number): Date[] {
  const { start, end } = getMonthRange(year, month)
  return eachDayOfInterval({ start, end })
}

export function isSameDayAs(a: Date | string, b: Date | string): boolean {
  const da = typeof a === "string" ? parseISO(a) : a
  const db = typeof b === "string" ? parseISO(b) : b
  return isSameDay(da, db)
}

export function addMinutesToDate(date: Date, minutes: number): Date {
  return addMinutes(date, minutes)
}

export function durationLabel(minutes: number): string {
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  if (h === 0) return `${m}分`
  if (m === 0) return `${h}時間`
  return `${h}時間${m}分`
}
