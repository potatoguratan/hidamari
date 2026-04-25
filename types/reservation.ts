import type { Customer } from "./customer"
import type { MenuItem } from "./menu"

export type ReservationStatus = "CONFIRMED" | "CANCELLED" | "COMPLETED"

export type ReservationMenuItem = {
  id: string
  reservationId: string
  menuItemId: string
  menuItem: MenuItem
}

export type Reservation = {
  id: string
  customerId: string
  customer: Customer
  startTime: string
  endTime: string
  status: ReservationStatus
  notes: string | null
  createdAt: string
  updatedAt: string
  menuItems: ReservationMenuItem[]
}

export type ReservationFormData = {
  customerId: string
  menuItemIds: string[]
  startTime: string
  endTime: string
  notes?: string
}
