import { Suspense } from "react"
import PageHeader from "@/components/ui/PageHeader"
import Button from "@/components/ui/Button"
import { InventoryList } from "@/components/features/inventory/InventoryList"

export const metadata = { title: "在庫管理 | Hidamari" }

export default function InventoryPage() {
  return (
    <>
      <PageHeader
        title="在庫管理"
        description="カラー材・薬剤の在庫を管理"
        actions={<Button variant="ghost">アイテム追加</Button>}
      />
      <Suspense fallback={<p>読み込み中...</p>}>
        <InventoryList />
      </Suspense>
    </>
  )
}
