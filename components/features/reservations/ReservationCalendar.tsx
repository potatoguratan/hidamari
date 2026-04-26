"use client"

import { useState, useEffect, useMemo } from "react"
import {
  startOfMonth, endOfMonth,
  startOfWeek, endOfWeek,
  eachDayOfInterval,
  isSameMonth, isSameDay, isToday,
  format,
} from "date-fns"
import Link from "next/link"
import { IoIosArrowBack, IoIosArrowForward } from "react-icons/io"
import Modal from "@/components/ui/Modal"
import Input  from "@/components/ui/Input"
import Button from "@/components/ui/Button"
import type { Reservation } from "@/types/reservation"
import type { Customer } from "@/types/customer"
import type { MenuItem }  from "@/types/menu"
import styles from "./ReservationCalendar.module.scss"

// ── 定数 ────────────────────────────────────────────────────────────────
const DOW = ["日", "月", "火", "水", "木", "金", "土"] as const

// ── ユーティリティ ────────────────────────────────────────────────────────
function addMonths(d: Date, n: number) {
  return new Date(d.getFullYear(), d.getMonth() + n, 1)
}
function toDateKey(d: Date) {
  return format(d, "yyyy-MM-dd")
}
function formatDayLabel(d: Date) {
  return `${d.getMonth() + 1}月${d.getDate()}日（${DOW[d.getDay()]}）`
}
function formatTime(iso: string) {
  const d = new Date(iso)
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`
}
function buildDatetime(date: Date, timeStr: string): string {
  const [h, m] = timeStr.split(":").map(Number)
  const d = new Date(date)
  d.setHours(h, m, 0, 0)
  return d.toISOString()
}

// ── 予約追加モーダル ──────────────────────────────────────────────────────
function AddReservationModal({
  date, onClose, onSaved,
}: { date: Date; onClose: () => void; onSaved: () => void }) {
  const [mode, setMode] = useState<"existing" | "new">("existing")

  // 既存顧客
  const [customerId, setCustomerId] = useState("")
  // 新規顧客
  const [newName,  setNewName]  = useState("")
  const [newPhone, setNewPhone] = useState("")

  // 共通
  const [startTime,      setStartTime]      = useState("10:00")
  const [endTime,        setEndTime]        = useState("11:00")
  const [selectedMenuIds, setSelectedMenuIds] = useState<string[]>([])
  const [notes, setNotes] = useState("")

  // マスタデータ
  const [customers,  setCustomers]  = useState<Customer[]>([])
  const [menuItems,  setMenuItems]  = useState<MenuItem[]>([])
  const [loadingData, setLoadingData] = useState(true)

  // 送信状態
  const [saving, setSaving] = useState(false)
  const [error,  setError]  = useState("")

  useEffect(() => {
    Promise.all([
      fetch("/api/customers").then(r => r.json()),
      fetch("/api/menu").then(r => r.json()),
    ]).then(([c, m]) => {
      setCustomers(Array.isArray(c) ? c : [])
      setMenuItems(Array.isArray(m) ? m.filter((mi: MenuItem) => mi.isActive) : [])
    }).catch(console.error)
      .finally(() => setLoadingData(false))
  }, [])

  function toggleMenu(id: string) {
    setSelectedMenuIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    )
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true); setError("")

    let cId = customerId

    // 新規顧客の場合まず作成
    if (mode === "new") {
      const res = await fetch("/api/customers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newName, nameKana: newName, phone: newPhone }),
      })
      if (!res.ok) { setError("顧客の登録に失敗しました"); setSaving(false); return }
      const created: Customer = await res.json()
      cId = created.id
    }

    const res = await fetch("/api/reservations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        customerId:  cId,
        menuItemIds: selectedMenuIds,
        startTime:   buildDatetime(date, startTime),
        endTime:     buildDatetime(date, endTime),
        notes:       notes || null,
      }),
    })
    setSaving(false)

    if (res.status === 409) { setError("ダブルブッキングが検出されました"); return }
    if (!res.ok) { setError("予約の登録に失敗しました"); return }

    onSaved(); onClose()
  }

  return (
    <Modal open onClose={onClose} title={`予約追加 — ${formatDayLabel(date)}`} size="md">
      <form onSubmit={handleSubmit} className={styles.form}>

        {/* モード切り替えタブ */}
        <div className={styles.modeToggle}>
          <button type="button"
            className={[styles.modeBtn, mode === "existing" ? styles.modeBtnActive : ""].filter(Boolean).join(" ")}
            onClick={() => setMode("existing")}>
            既存顧客
          </button>
          <button type="button"
            className={[styles.modeBtn, mode === "new" ? styles.modeBtnActive : ""].filter(Boolean).join(" ")}
            onClick={() => setMode("new")}>
            新規顧客
          </button>
        </div>

        {/* 顧客情報 */}
        {mode === "existing" ? (
          <label className={styles.fieldLabel}>
            <span>顧客 <span className={styles.required}>*</span></span>
            <select
              className={styles.select}
              value={customerId}
              onChange={e => setCustomerId(e.target.value)}
              required
              disabled={loadingData}
            >
              <option value="">{loadingData ? "読み込み中..." : "選択してください"}</option>
              {customers.map(c => (
                <option key={c.id} value={c.id}>
                  {c.name}（{c.nameKana}）
                </option>
              ))}
            </select>
          </label>
        ) : (
          <div className={styles.fieldGroup}>
            <Input label="名前" value={newName} required placeholder="例: 田中 花子"
              onChange={e => setNewName(e.target.value)} />
            <Input label="電話番号" value={newPhone} placeholder="例: 090-1234-5678"
              onChange={e => setNewPhone(e.target.value)} />
          </div>
        )}

        {/* 時間 */}
        <div className={styles.timeRow}>
          <Input label="開始時間" type="time" value={startTime} required
            onChange={e => setStartTime(e.target.value)} />
          <Input label="終了時間" type="time" value={endTime} required
            onChange={e => setEndTime(e.target.value)} />
        </div>

        {/* メニュー */}
        <div>
          <span className={styles.fieldLabel}>メニュー</span>
          <div className={styles.menuCheckList}>
            {loadingData ? (
              <span className={styles.loadingText}>読み込み中...</span>
            ) : menuItems.length === 0 ? (
              <span className={styles.loadingText}>メニューがありません</span>
            ) : menuItems.map(m => (
              <label key={m.id} className={styles.checkItem}>
                <input type="checkbox"
                  checked={selectedMenuIds.includes(m.id)}
                  onChange={() => toggleMenu(m.id)} />
                {m.name}
                <span className={styles.menuMeta}>¥{m.price.toLocaleString()} / {m.durationMin}分</span>
              </label>
            ))}
          </div>
        </div>

        {/* 備考 */}
        <label className={styles.fieldLabel}>
          備考
          <textarea className={styles.textarea} value={notes}
            onChange={e => setNotes(e.target.value)} placeholder="自由記入" />
        </label>

        {error && <p className={styles.formError}>{error}</p>}

        <div className={styles.formActions}>
          <Button type="button" variant="ghost" onClick={onClose}>キャンセル</Button>
          <Button type="submit" loading={saving}>予約する</Button>
        </div>
      </form>
    </Modal>
  )
}

// ── メインコンポーネント ──────────────────────────────────────────────────
export function ReservationCalendar() {
  const [currentMonth, setCurrentMonth] = useState(() => {
    const n = new Date()
    return new Date(n.getFullYear(), n.getMonth(), 1)
  })
  const [reservations, setReservations] = useState<Reservation[]>([])
  const [loading,      setLoading]      = useState(false)
  const [refreshKey,   setRefreshKey]   = useState(0)
  const [selectedDay,  setSelectedDay]  = useState<Date | null>(null)
  const [addOpen,      setAddOpen]      = useState(false)

  const refresh = () => setRefreshKey(k => k + 1)

  useEffect(() => {
    let cancelled = false

    async function load() {
      setLoading(true)
      setSelectedDay(null)

      const from = startOfMonth(currentMonth).toISOString()
      const to   = endOfMonth(currentMonth).toISOString()

      try {
        const res = await fetch(
          `/api/reservations?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`
        )
        if (cancelled) return
        setReservations(res.ok ? await res.json() : [])
      } catch {
        if (!cancelled) setReservations([])
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()
    return () => { cancelled = true }
  }, [currentMonth.getFullYear(), currentMonth.getMonth(), refreshKey])  // eslint-disable-line react-hooks/exhaustive-deps

  const calendarDays = useMemo(() => {
    const start = startOfWeek(startOfMonth(currentMonth), { weekStartsOn: 0 })
    const end   = endOfWeek(endOfMonth(currentMonth),    { weekStartsOn: 0 })
    return eachDayOfInterval({ start, end })
  }, [currentMonth])

  const byDay = useMemo(() => {
    const map = new Map<string, Reservation[]>()
    for (const r of reservations) {
      const key = toDateKey(new Date(r.startTime))
      if (!map.has(key)) map.set(key, [])
      map.get(key)!.push(r)
    }
    return map
  }, [reservations])

  const selectedReservations = useMemo(() => {
    if (!selectedDay) return []
    return (byDay.get(toDateKey(selectedDay)) ?? []).sort(
      (a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
    )
  }, [selectedDay, byDay])

  const monthLabel = `${currentMonth.getFullYear()}年 ${currentMonth.getMonth() + 1}月`

  return (
    <div className={styles.wrapper}>
      {/* 月ナビゲーション */}
      <div className={styles.calHeader}>
        <button className={styles.navBtn} onClick={() => setCurrentMonth(m => addMonths(m, -1))} aria-label="前月">
          <IoIosArrowBack />
        </button>
        <span className={styles.monthTitle}>
          {monthLabel}
          {loading && <span className={styles.loadingDot}>…</span>}
        </span>
        <button className={styles.navBtn} onClick={() => setCurrentMonth(m => addMonths(m, 1))} aria-label="翌月">
          <IoIosArrowForward />
        </button>
      </div>

      {/* カレンダーグリッド */}
      <div className={styles.calendar}>
        <div className={styles.dayHeaders}>
          {DOW.map((d, i) => (
            <div key={d} className={[styles.dayHeader, i === 0 ? styles.sun : i === 6 ? styles.sat : ""].filter(Boolean).join(" ")}>
              {d}
            </div>
          ))}
        </div>
        <div className={styles.grid}>
          {calendarDays.map(day => {
            const inMonth    = isSameMonth(day, currentMonth)
            const isToday_   = isToday(day)
            const isSelected = selectedDay ? isSameDay(day, selectedDay) : false
            const dow        = day.getDay()
            const dayItems   = byDay.get(toDateKey(day)) ?? []
            const visible    = dayItems.slice(0, 3)
            const overflow   = dayItems.length - 3

            const cellCls = [
              styles.cell,
              !inMonth   ? styles.otherMonth : "",
              isToday_   ? styles.today      : "",
              isSelected ? styles.selected   : "",
              dow === 0  ? styles.sun        : "",
              dow === 6  ? styles.sat        : "",
            ].filter(Boolean).join(" ")

            return (
              <div key={day.toISOString()} className={cellCls}
                onClick={() => setSelectedDay(prev => prev && isSameDay(prev, day) ? null : day)}>
                <span className={styles.dayNum}>{day.getDate()}</span>
                {dayItems.length > 0 && (
                  <div className={styles.dots}>
                    {visible.map(r => (
                      <span key={r.id} className={[
                        styles.dot,
                        r.status === "CANCELLED" ? styles.cancelled : "",
                        r.status === "COMPLETED" ? styles.completed : "",
                      ].filter(Boolean).join(" ")} />
                    ))}
                    {overflow > 0 && <span className={styles.overflow}>+{overflow}</span>}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* 選択日 詳細パネル */}
      {selectedDay && (
        <div className={styles.detailPanel}>
          <div className={styles.detailHeader}>
            <span className={styles.detailDate}>{formatDayLabel(selectedDay)}</span>
            <div className={styles.detailHeaderRight}>
              <span className={styles.detailCount}>{selectedReservations.length} 件</span>
              <Button size="sm" variant="secondary" onClick={() => setAddOpen(true)}>
                予約追加
              </Button>
              <Link
                href={`/reservations/${toDateKey(selectedDay)}`}
                className={styles.dayViewBtn}
                aria-label="日別予約表"
              >
                <IoIosArrowForward />
              </Link>
            </div>
          </div>
          <div className={styles.detailBody}>
            {selectedReservations.length === 0 ? (
              <p className={styles.emptyDay}>この日の予約はありません</p>
            ) : (
              selectedReservations.map(r => (
                <div key={r.id} className={styles.reservationItem}>
                  <span className={styles.timeRange}>
                    {formatTime(r.startTime)} – {formatTime(r.endTime)}
                  </span>
                  <div className={styles.reservationInfo}>
                    <span className={styles.customerName}>{r.customer.name}</span>
                    <span className={styles.menuNames}>
                      {r.menuItems.map(m => m.menuItem.name).join("・") || "—"}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* 予約追加モーダル */}
      {addOpen && selectedDay && (
        <AddReservationModal
          date={selectedDay}
          onClose={() => setAddOpen(false)}
          onSaved={() => { setAddOpen(false); refresh() }}
        />
      )}
    </div>
  )
}
