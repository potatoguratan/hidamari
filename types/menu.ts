export type MenuItem = {
  id: string
  name: string
  price: number
  durationMin: number
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export type MenuItemFormData = {
  name: string
  price: number
  durationMin: number
  isActive?: boolean
}
