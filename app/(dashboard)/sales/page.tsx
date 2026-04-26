import { Suspense } from "react"
import PageHeader from "@/components/ui/PageHeader"
import { FaRegChartBar } from "react-icons/fa"
import { SalesDashboard } from "@/components/features/sales/SalesDashboard"

export const metadata = { title: "売上管理 | Hidamari" }

export default function SalesPage() {
  return (
    <>
      <PageHeader
        title="売上管理"
        description="売上の集計・確認"
        icon={FaRegChartBar}
      />
      <Suspense fallback={<p>読み込み中...</p>}>
        <SalesDashboard />
      </Suspense>
    </>
  )
}
