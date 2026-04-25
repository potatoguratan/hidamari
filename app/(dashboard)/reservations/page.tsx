import { Suspense } from "react"
import PageHeader from "@/components/ui/PageHeader"
import Button from "@/components/ui/Button"
import { ReservationCalendar } from "@/components/features/reservations/ReservationCalendar"

export const metadata = { title: "予約管理 | Hidamari" }

export default function ReservationsPage() {
  return (
    <>
      <PageHeader
        title="予約管理"
        description="月別カレンダーで予約を管理"
        actions={<Button>予約追加</Button>}
      />
      <Suspense fallback={<p>読み込み中...</p>}>
        <ReservationCalendar />
      </Suspense>
    </>
  )
}
