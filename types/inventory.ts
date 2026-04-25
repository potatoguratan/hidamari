export type InventoryCategory = {
  id: string
  name: string
  createdAt: string
  updatedAt: string
  items?: InventoryItem[]
}

export type InventoryItem = {
  id: string
  categoryId: string
  category?: InventoryCategory
  name: string
  quantity: number
  unit: string
  alertThreshold: number
  createdAt: string
  updatedAt: string
  isLow?: boolean
}

export type InventoryCategoryFormData = {
  name: string
}

export type InventoryItemFormData = {
  categoryId: string
  name: string
  quantity: number
  unit: string
  alertThreshold: number
}
