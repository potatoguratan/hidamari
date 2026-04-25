"use client"

import { create } from "zustand"
import type { MenuItem, Customer } from "@/types"

type CartItem = {
  menuItem: MenuItem
  price: number
}

type CheckoutStore = {
  customer: Customer | null
  cartItems: CartItem[]
  discount: number
  setCustomer: (customer: Customer | null) => void
  addItem: (menuItem: MenuItem) => void
  removeItem: (menuItemId: string) => void
  setDiscount: (amount: number) => void
  reset: () => void
  totalBeforeDiscount: () => number
  total: () => number
  totalDurationMin: () => number
}

export const useCheckoutStore = create<CheckoutStore>((set, get) => ({
  customer: null,
  cartItems: [],
  discount: 0,

  setCustomer: (customer) => set({ customer }),
  addItem: (menuItem) =>
    set((s) => ({
      cartItems: [...s.cartItems, { menuItem, price: menuItem.price }],
    })),
  removeItem: (menuItemId) =>
    set((s) => {
      const idx = s.cartItems.findLastIndex((i) => i.menuItem.id === menuItemId)
      if (idx === -1) return s
      const next = [...s.cartItems]
      next.splice(idx, 1)
      return { cartItems: next }
    }),
  setDiscount: (discount) => set({ discount }),
  reset: () => set({ customer: null, cartItems: [], discount: 0 }),

  totalBeforeDiscount: () => get().cartItems.reduce((s, i) => s + i.price, 0),
  total: () => Math.max(0, get().totalBeforeDiscount() - get().discount),
  totalDurationMin: () =>
    get().cartItems.reduce((s, i) => s + i.menuItem.durationMin, 0),
}))
