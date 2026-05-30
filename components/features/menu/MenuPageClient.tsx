"use client"

import { PiBookOpenText } from "react-icons/pi"
import PageHeader from "@/components/ui/PageHeader"
import { MenuList } from "./MenuList"

export default function MenuPageClient() {
  return (
    <>
      <PageHeader
        title="メニュー管理"
        description="施術メニューの価格・時間を管理"
        icon={PiBookOpenText}
      />
      <MenuList />
    </>
  )
}
