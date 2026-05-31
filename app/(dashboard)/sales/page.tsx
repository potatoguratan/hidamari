import { Suspense } from "react"
import { SalesDashboard } from "@/components/features/sales/SalesDashboard"

export const metadata = { title: "売上管理 | Hidamari" }

export default function SalesPage() {
  return (
    <Suspense fallback={<p>読み込み中...</p>}>
      <SalesDashboard />
    </Suspense>
  )
}
