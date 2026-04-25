import { Suspense } from "react"
import PageHeader from "@/components/ui/PageHeader"
import Button from "@/components/ui/Button"
import { MenuList } from "@/components/features/menu/MenuList"

export const metadata = { title: "メニュー管理 | Hidamari" }

export default function MenuPage() {
  return (
    <>
      <PageHeader
        title="メニュー管理"
        description="施術メニューの価格・時間を管理"
        actions={<Button variant="ghost">メニュー追加</Button>}
      />
      <Suspense fallback={<p>読み込み中...</p>}>
        <MenuList />
      </Suspense>
    </>
  )
}
