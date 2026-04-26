import { DaySchedule } from "@/components/features/reservations/DaySchedule"

type Props = { params: Promise<{ date: string }> }

export default async function DaySchedulePage({ params }: Props) {
  const { date } = await params
  return <DaySchedule date={date} />
}
