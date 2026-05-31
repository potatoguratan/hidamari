import PageHeader from "@/components/ui/PageHeader"
import { AiOutlinePayCircle } from "react-icons/ai"
import { CheckoutPanel } from "@/components/features/checkout/CheckoutPanel"

export const metadata = { title: "会計 | Hidamari" }

type Props = { searchParams: Promise<{ reservationId?: string }> }

export default async function CheckoutPage({ searchParams }: Props) {
  const { reservationId } = await searchParams

  return (
    <>
      <PageHeader title="会計" description="メニューを選んで会計金額を計算" icon={AiOutlinePayCircle} />
      <CheckoutPanel initialReservationId={reservationId} />
    </>
  )
}
