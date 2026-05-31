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
  sales?: Sale[]
}

export type CustomerFormData = {
  name: string
  nameKana: string
  phone?: string
  birthday?: string
  allergies?: string
  notes?: string
}

import type { Treatment } from "./treatment"
import type { Reservation } from "./reservation"
import type { Sale } from "./sale"
