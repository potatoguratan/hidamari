export type InventoryCategory = {
  id: string
  name: string
  createdAt: string
  updatedAt: string
  items?: InventoryItem[]
}

export type InventoryItemType = "MATERIAL" | "RETAIL"

export type InventoryItem = {
  id: string
  categoryId: string
  category?: InventoryCategory
  itemType: InventoryItemType
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
  itemType: InventoryItemType
  name: string
  quantity: number
  unit: string
  alertThreshold: number
}
