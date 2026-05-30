export type MenuItemType = "TREATMENT" | "RETAIL"

export type MenuItem = {
  id: string
  name: string
  price: number
  durationMin: number
  menuType: MenuItemType
  isActive: boolean
  sortOrder: number
  createdAt: string
  updatedAt: string
}

export type MenuItemFormData = {
  name: string
  price: number
  durationMin: number
  menuType: MenuItemType
  isActive?: boolean
}
