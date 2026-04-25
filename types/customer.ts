export type Customer = {
  id: string
  name: string
  nameKana: string
  phone: string | null
  email: string | null
  birthday: string | null
  allergies: string | null
  notes: string | null
  createdAt: string
  updatedAt: string
  treatments?: Treatment[]
  reservations?: Reservation[]
}

export type CustomerFormData = {
  name: string
  nameKana: string
  phone?: string
  email?: string
  birthday?: string
  allergies?: string
  notes?: string
}

import type { Treatment } from "./treatment"
import type { Reservation } from "./reservation"
