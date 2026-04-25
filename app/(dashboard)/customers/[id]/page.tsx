import { Suspense } from "react"
import { CustomerDetail } from "@/components/features/customers/CustomerDetail"

type Props = { params: Promise<{ id: string }> }

export default async function CustomerDetailPage({ params }: Props) {
  const { id } = await params
  return (
    <Suspense fallback={<p>読み込み中...</p>}>
      <CustomerDetail id={id} />
    </Suspense>
  )
}
