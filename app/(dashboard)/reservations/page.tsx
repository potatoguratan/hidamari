import PageHeader from "@/components/ui/PageHeader"
import { FaRegCalendarAlt } from "react-icons/fa"
import { ReservationCalendar } from "@/components/features/reservations/ReservationCalendar"

export const metadata = { title: "予約管理 | Hidamari" }

export default function ReservationsPage() {
  return (
    <>
      <PageHeader
        title="予約管理"
        description="月別カレンダーで予約を管理"
        icon={FaRegCalendarAlt}
      />
      <ReservationCalendar />
    </>
  )
}
