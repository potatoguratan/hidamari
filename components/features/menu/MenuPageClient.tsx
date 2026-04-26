"use client"

import { useState } from "react"
import { PiBookOpenText } from "react-icons/pi"
import PageHeader from "@/components/ui/PageHeader"
import Button from "@/components/ui/Button"
import { MenuList } from "./MenuList"

export default function MenuPageClient() {
  const [addOpen, setAddOpen] = useState(false)

  return (
    <>
      <PageHeader
        title="メニュー管理"
        description="施術メニューの価格・時間を管理"
        icon={PiBookOpenText}
        actions={
          <Button variant="ghost" onClick={() => setAddOpen(true)}>
            メニュー追加
          </Button>
        }
      />
      <MenuList addOpen={addOpen} onAddClose={() => setAddOpen(false)} />
    </>
  )
}
