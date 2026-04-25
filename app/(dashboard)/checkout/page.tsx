import PageHeader from "@/components/ui/PageHeader"
import { CheckoutPanel } from "@/components/features/checkout/CheckoutPanel"

export const metadata = { title: "会計 | Hidamari" }

export default function CheckoutPage() {
  return (
    <>
      <PageHeader title="会計" description="メニューを選んで会計金額を計算" />
      <CheckoutPanel />
    </>
  )
}
