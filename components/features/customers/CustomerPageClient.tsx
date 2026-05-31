"use client"

import { useState } from "react"
import { CustomerList } from "./CustomerList"

export default function CustomerPageClient() {
  const [addOpen, setAddOpen] = useState(false)

  return (
    <CustomerList
      addOpen={addOpen}
      onAddOpen={() => setAddOpen(true)}
      onAddClose={() => setAddOpen(false)}
    />
  )
}
