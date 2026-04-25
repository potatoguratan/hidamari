import type { MenuItem } from "./menu"

export type TreatmentMenuItem = {
  id: string
  treatmentId: string
  menuItemId: string
  menuItem: MenuItem
  price: number
}

export type Treatment = {
  id: string
  customerId: string
  date: string
  totalAmount: number
  discount: number
  notes: string | null
  createdAt: string
  updatedAt: string
  menuItems: TreatmentMenuItem[]
}

export type TreatmentFormData = {
  customerId: string
  date: string
  menuItems: { menuItemId: string; price: number }[]
  discount?: number
  notes?: string
}
