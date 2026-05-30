import PageHeader from "@/components/ui/PageHeader"
import { FaRegCalendarAlt } from "react-icons/fa"
import { ReservationSchedule } from "@/components/features/reservations/ReservationSchedule"

export const metadata = { title: "予約管理 | Hidamari" }

export default function ReservationsPage() {
  return (
    <>
      <PageHeader
        title="予約管理"
        icon={FaRegCalendarAlt}
      />
      <ReservationSchedule />
    </>
  )
}
