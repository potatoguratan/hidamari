import { Suspense } from "react"
import PageHeader from "@/components/ui/PageHeader"
import Button from "@/components/ui/Button"
import { CustomerList } from "@/components/features/customers/CustomerList"

export const metadata = { title: "顧客管理 | Hidamari" }

export default function CustomersPage() {
  return (
    <>
      <PageHeader
        title="顧客管理"
        description="顧客カルテの閲覧・管理"
        actions={<Button variant="ghost">新規顧客登録</Button>}
      />
      <Suspense fallback={<p>読み込み中...</p>}>
        <CustomerList />
      </Suspense>
    </>
  )
}
