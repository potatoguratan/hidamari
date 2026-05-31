import type { MenuItemType } from "./menu"

export type SaleLine = {
  id: string
  saleId: string
  menuItemId: string | null
  inventoryItemId: string | null
  itemType: MenuItemType
  itemName: string
  unitPrice: number
  quantity: number
  originalAmount: number
  discountAmount: number
  finalAmount: number
  createdAt: string
}

export type Sale = {
  id: string
  customerId: string | null
  reservationId: string | null
  soldAt: string
  subtotalAmount: number
  discountAmount: number
  totalAmount: number
  notes: string | null
  createdAt: string
  lines: SaleLine[]
}
