"use client"

import { useState } from "react"
import { FaRegAddressBook } from "react-icons/fa"
import PageHeader from "@/components/ui/PageHeader"
import Button from "@/components/ui/Button"
import { CustomerList } from "./CustomerList"

export default function CustomerPageClient() {
  const [addOpen, setAddOpen] = useState(false)

  return (
    <>
      <PageHeader
        title="顧客管理"
        description="顧客カルテの閲覧・管理"
        icon={FaRegAddressBook}
        actions={
          <Button variant="ghost" onClick={() => setAddOpen(true)}>
            新規顧客登録
          </Button>
        }
      />
      <CustomerList addOpen={addOpen} onAddClose={() => setAddOpen(false)} />
    </>
  )
}
