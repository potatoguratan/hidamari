"use client"

import { useState } from "react"
import { MdOutlineInventory } from "react-icons/md"
import PageHeader from "@/components/ui/PageHeader"
import Button from "@/components/ui/Button"
import { InventoryList } from "./InventoryList"

export default function InventoryPageClient() {
  const [addOpen, setAddOpen] = useState(false)

  return (
    <>
      <PageHeader
        title="在庫管理"
        description="カラー材・薬剤の在庫を管理"
        icon={MdOutlineInventory}
        actions={
          <Button variant="ghost" onClick={() => setAddOpen(true)}>
            材料追加
          </Button>
        }
      />
      <InventoryList addOpen={addOpen} onAddClose={() => setAddOpen(false)} />
    </>
  )
}
