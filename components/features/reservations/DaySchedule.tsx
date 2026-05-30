"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { IoIosArrowBack } from "react-icons/io"
import { FaRegCalendarAlt } from "react-icons/fa"
import PageHeader from "@/components/ui/PageHeader"
import type { Reservation } from "@/types/reservation"
import styles from "./DaySchedule.module.scss"

// ── ガントチャート定数 ────────────────────────────────────────────────────
const HOUR_HEIGHT = 80  // px / 1時間
const START_HOUR  = 8   // 表示開始時刻
const END_HOUR    = 21  // 表示終了時刻
const HOURS       = END_HOUR - START_HOUR

const DOW = ["日", "月", "火", "水", "木", "金", "土"] as const

// ── ユーティリティ ────────────────────────────────────────────────────────
function parseDateLabel(dateStr: string) {
  const [y, m, d] = dateStr.split("-").map(Number)
  const date = new Date(y, m - 1, d)
  return `${m}月${d}日（${DOW[date.getDay()]}）`
}

function formatTime(iso: string) {
  const d = new Date(iso)
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`
}

function getBlockStyle(startIso: string, endIso: string) {
  const start = new Date(startIso)
  const end   = new Date(endIso)
  const startMin   = (start.getHours() - START_HOUR) * 60 + start.getMinutes()
  const durationMin = Math.max((end.getTime() - start.getTime()) / 60000, 15)
  const px = HOUR_HEIGHT / 60
  return {
    top:    `${Math.max(startMin * px, 0)}px`,
    height: `${durationMin * px}px`,
  }
}

// ── メインコンポーネント ──────────────────────────────────────────────────
type Props = { date: string }  // "YYYY-MM-DD"

export function DaySchedule({ date }: Props) {
  const [reservations, setReservations] = useState<Reservation[]>([])
  const [loading,      setLoading]      = useState(true)
  const [error,        setError]        = useState("")

  useEffect(() => {
    const [y, m, d] = date.split("-").map(Number)
    const from = new Date(y, m - 1, d, 0,  0,  0).toISOString()
    const to   = new Date(y, m - 1, d, 23, 59, 59).toISOString()

    fetch(`/api/reservations?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`)
      .then(r => r.ok ? r.json() : Promise.reject(r.status))
      .then((data: Reservation[]) =>
        setReservations(data.sort((a, b) =>
          new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
        ))
      )
      .catch(() => setError("予約データの取得に失敗しました"))
      .finally(() => setLoading(false))
  }, [date])

  if (loading) return <p className={styles.loadingText}>読み込み中...</p>
  if (error)   return <p className={styles.fetchError}>{error}</p>

  const totalHeight = HOURS * HOUR_HEIGHT

  return (
    <>
      <Link href="/reservations" className={styles.backLink}>
        <IoIosArrowBack /> カレンダーに戻る
      </Link>

      <PageHeader
        title={parseDateLabel(date)}
        description={`${reservations.length} 件の予約`}
        icon={FaRegCalendarAlt}
      />

      <div className={styles.ganttWrapper}>
        {reservations.length === 0 ? (
          <p className={styles.empty}>この日の予約はありません</p>
        ) : (
          <div className={styles.gantt}>
            {/* 時刻軸 */}
            <div className={styles.timeAxis}>
              {Array.from({ length: HOURS }, (_, i) => (
                <div key={i} className={styles.hourRow}>
                  <span className={styles.hourLabel}>
                    {String(START_HOUR + i).padStart(2, "0")}:00
                  </span>
                </div>
              ))}
            </div>

            {/* 予約ブロック */}
            <div className={styles.blocksArea} style={{ height: totalHeight }}>
              {reservations.map(r => (
                <div
                  key={r.id}
                  className={styles.block}
                  style={getBlockStyle(r.startTime, r.endTime)}
                >
                  <span className={styles.blockTime}>
                    {formatTime(r.startTime)} – {formatTime(r.endTime)}
                  </span>
                  <span className={styles.blockCustomer}>{r.customer.name}</span>
                  {r.menuItems.length > 0 && (
                    <span className={styles.blockMenus}>
                      {r.menuItems.map(m => m.menuItem.name).join("・")}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </>
  )
}
