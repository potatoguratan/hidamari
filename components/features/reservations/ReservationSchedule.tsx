"use client"

import { useEffect, useMemo, useState } from "react"
import {
  addDays,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  isToday,
  startOfMonth,
  startOfWeek,
} from "date-fns"
import { IoIosArrowBack, IoIosArrowForward } from "react-icons/io"
import { FiPlus } from "react-icons/fi"
import Button from "@/components/ui/Button"
import type { Reservation } from "@/types/reservation"
import { AddReservationModal } from "./ReservationCalendar"
import styles from "./ReservationSchedule.module.scss"

const WEEKDAYS = ["日", "月", "火", "水", "木", "金", "土"]
const START_HOUR = 8
const END_HOUR = 20
const HOUR_HEIGHT = 68

function addMonths(date: Date, amount: number) {
  return new Date(date.getFullYear(), date.getMonth() + amount, 1)
}

function dateKey(date: Date) {
  return format(date, "yyyy-MM-dd")
}

function timeLabel(value: string) {
  return format(new Date(value), "HH:mm")
}

export function ReservationSchedule() {
  const today = useMemo(() => new Date(), [])
  const [currentMonth, setCurrentMonth] = useState(() => new Date(today.getFullYear(), today.getMonth(), 1))
  const [selectedDay, setSelectedDay] = useState(today)
  const [viewMode, setViewMode] = useState<"day" | "week">("week")
  const [reservations, setReservations] = useState<Reservation[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshKey, setRefreshKey] = useState(0)
  const [addOpen, setAddOpen] = useState(false)

  const calendarDays = useMemo(() => {
    const start = startOfWeek(startOfMonth(currentMonth), { weekStartsOn: 0 })
    const end = endOfWeek(endOfMonth(currentMonth), { weekStartsOn: 0 })
    return eachDayOfInterval({ start, end })
  }, [currentMonth])

  useEffect(() => {
    const from = calendarDays[0].toISOString()
    const to = calendarDays[calendarDays.length - 1].toISOString()
    let cancelled = false

    fetch(`/api/reservations?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`)
      .then((response) => response.ok ? response.json() : [])
      .then((data: Reservation[]) => {
        if (!cancelled) setReservations(Array.isArray(data) ? data : [])
      })
      .catch(() => {
        if (!cancelled) setReservations([])
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => { cancelled = true }
  }, [calendarDays, refreshKey])

  const reservationsByDay = useMemo(() => {
    const result = new Map<string, Reservation[]>()
    reservations.forEach((reservation) => {
      const key = dateKey(new Date(reservation.startTime))
      result.set(key, [...(result.get(key) ?? []), reservation])
    })
    return result
  }, [reservations])

  const scheduleDays = useMemo(() => {
    if (viewMode === "day") return [selectedDay]
    const start = startOfWeek(selectedDay, { weekStartsOn: 0 })
    return Array.from({ length: 7 }, (_, index) => addDays(start, index))
  }, [selectedDay, viewMode])
  const selectedWeek = useMemo(() => {
    const start = startOfWeek(selectedDay, { weekStartsOn: 0 })
    return new Set(Array.from({ length: 7 }, (_, index) => dateKey(addDays(start, index))))
  }, [selectedDay])

  const hours = Array.from({ length: END_HOUR - START_HOUR + 1 }, (_, index) => START_HOUR + index)

  function blockStyle(reservation: Reservation) {
    const start = new Date(reservation.startTime)
    const end = new Date(reservation.endTime)
    const startMinutes = (start.getHours() - START_HOUR) * 60 + start.getMinutes()
    const duration = Math.max((end.getTime() - start.getTime()) / 60000, 30)
    return {
      top: `${Math.max(startMinutes, 0) / 60 * HOUR_HEIGHT}px`,
      height: `${duration / 60 * HOUR_HEIGHT}px`,
    }
  }

  return (
    <div className={styles.layout}>
      <aside className={styles.calendarPanel}>
        <div className={styles.calendarHeader}>
          <button onClick={() => setCurrentMonth((month) => addMonths(month, -1))} aria-label="前月"><IoIosArrowBack /></button>
          <strong>{format(currentMonth, "yyyy年 M月")}</strong>
          <button onClick={() => setCurrentMonth((month) => addMonths(month, 1))} aria-label="翌月"><IoIosArrowForward /></button>
        </div>
        <div className={styles.weekdays}>
          {WEEKDAYS.map((weekday, index) => (
            <span
              key={weekday}
              className={index === 0 ? styles.sundayLabel : index === 6 ? styles.saturdayLabel : ""}
            >
              {weekday}
            </span>
          ))}
        </div>
        <div className={styles.calendarGrid}>
          {calendarDays.map((day) => (
            <button
              key={day.toISOString()}
              className={[
                styles.calendarDay,
                !isSameMonth(day, currentMonth) ? styles.outsideMonth : "",
                isToday(day) ? styles.today : "",
                viewMode === "week" && selectedWeek.has(dateKey(day)) ? styles.selectedWeek : "",
                viewMode === "week" && selectedWeek.has(dateKey(day)) && day.getDay() === 0 ? styles.selectedWeekStart : "",
                viewMode === "week" && selectedWeek.has(dateKey(day)) && day.getDay() === 6 ? styles.selectedWeekEnd : "",
                isSameDay(day, selectedDay) ? styles.selected : "",
                (reservationsByDay.get(dateKey(day))?.length ?? 0) > 0 ? styles.hasReservation : "",
              ].filter(Boolean).join(" ")}
              onClick={() => setSelectedDay(day)}
            >
              {day.getDate()}
            </button>
          ))}
        </div>
      </aside>

      <section className={styles.schedulePanel}>
        <header className={styles.toolbar}>
          <div>
            <h2>{viewMode === "day" ? format(selectedDay, "yyyy/MM/dd") : `${format(scheduleDays[0], "MM/dd")} - ${format(scheduleDays[6], "MM/dd")}`}</h2>
          </div>
          <div className={styles.toolbarActions}>
            <div className={styles.toggle}>
              <button className={viewMode === "day" ? styles.toggleActive : ""} onClick={() => setViewMode("day")}>日</button>
              <button className={viewMode === "week" ? styles.toggleActive : ""} onClick={() => setViewMode("week")}>週</button>
            </div>
            <Button size="sm" onClick={() => setAddOpen(true)}><FiPlus /> 予約追加</Button>
          </div>
        </header>

        <div className={styles.timelineScroll}>
          <div className={styles.timelineHeader} style={{ gridTemplateColumns: `44px repeat(${scheduleDays.length}, minmax(0, 1fr))` }}>
            <span />
            {scheduleDays.map((day) => (
              <div
                key={day.toISOString()}
                className={[
                  day.getDay() === 0 ? styles.sundayLabel : "",
                  day.getDay() === 6 ? styles.saturdayLabel : "",
                  isSameDay(day, selectedDay) ? styles.activeDayHeader : "",
                ].filter(Boolean).join(" ")}
              >
                <strong>{day.getDate()}</strong>
                <span>{WEEKDAYS[day.getDay()]}</span>
              </div>
            ))}
          </div>
          <div className={styles.timelineBody} style={{ gridTemplateColumns: `44px repeat(${scheduleDays.length}, minmax(0, 1fr))`, height: `${hours.length * HOUR_HEIGHT}px` }}>
            <div className={styles.hours}>
              {hours.map((hour) => <span key={hour} style={{ height: `${HOUR_HEIGHT}px` }}>{String(hour).padStart(2, "0")}:00</span>)}
            </div>
            {scheduleDays.map((day) => (
              <div
                key={day.toISOString()}
                className={styles.dayColumn}
                style={{ backgroundSize: `100% ${HOUR_HEIGHT}px` }}
              >
                {(reservationsByDay.get(dateKey(day)) ?? []).map((reservation) => (
                  <article key={reservation.id} className={styles.reservation} style={blockStyle(reservation)}>
                    <strong>{reservation.customer.name}</strong>
                    <span>{timeLabel(reservation.startTime)} - {timeLabel(reservation.endTime)}</span>
                    <small>{reservation.menuItems.map((item) => item.menuItem.name).join(" / ")}</small>
                  </article>
                ))}
              </div>
            ))}
          </div>
        </div>
        {loading && <p className={styles.loading}>読み込み中...</p>}
      </section>

      {addOpen && (
        <AddReservationModal
          date={selectedDay}
          onClose={() => setAddOpen(false)}
          onSaved={() => setRefreshKey((key) => key + 1)}
        />
      )}
    </div>
  )
}
