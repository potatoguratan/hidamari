"use client"

import { useEffect, useMemo, useState } from "react"
import {
  FiChevronLeft,
  FiChevronRight,
  FiCalendar,
  FiCreditCard,
  FiPercent,
  FiSearch,
  FiShoppingBag,
  FiTrendingUp,
  FiUsers,
} from "react-icons/fi"
import styles from "./SalesDashboard.module.scss"

type ItemType = "ALL" | "TREATMENT" | "RETAIL"
type ChartScale = "month" | "year"

type SaleLine = {
  id: string
  itemType: Exclude<ItemType, "ALL">
  itemName: string
  quantity: number
  finalAmount: number
}

type Sale = {
  id: string
  soldAt: string
  totalAmount: number
  discountAmount: number
  customer: { id: string; name: string } | null
  lines: SaleLine[]
}

type DashboardData = {
  summary: {
    totalAmount: number
    saleCount: number
    averageAmount: number
    discountAmount: number
    month: {
      totalAmount: number
      treatmentAmount: number
      retailAmount: number
      previousTotalAmount: number
      previousTreatmentAmount: number
      previousRetailAmount: number
    }
    year: {
      totalAmount: number
      previousTotalAmount: number
    }
  }
  chart: { key: string; label: string; tooltipLabel: string; treatment: number; retail: number }[]
  byMenu: { name: string; type: Exclude<ItemType, "ALL">; count: number; total: number }[]
  sales: Sale[]
  pagination: {
    page: number
    pageSize: number
    totalCount: number
    totalPages: number
  }
}

const yen = (amount: number) => `¥${amount.toLocaleString("ja-JP")}`
const yearOverYear = (current: number, previous: number) => {
  if (previous === 0) return current === 0 ? "前年比 -" : "前年比 新規"
  const value = Math.round(current / previous * 100)
  return `前年比 ${value}%`
}
const currentMonthKey = () => {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`
}
const dateTimeLabel = (value: string) => new Date(value).toLocaleString("ja-JP", {
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
})

export function SalesDashboard() {
  const defaultTo = currentMonthKey()
  const [to, setTo] = useState(defaultTo)
  const [chartScale, setChartScale] = useState<ChartScale>("year")
  const [itemType, setItemType] = useState<ItemType>("ALL")
  const [customerSearch, setCustomerSearch] = useState("")
  const [searchQuery, setSearchQuery] = useState("")
  const [page, setPage] = useState(1)
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    const controller = new AbortController()
    const params = new URLSearchParams({
      view: "dashboard",
      to,
      chartScale,
      itemType,
      customer: searchQuery,
      page: String(page),
    })
    fetch(`/api/sales?${params}`, { signal: controller.signal })
      .then(response => {
        if (!response.ok) throw new Error("sales dashboard fetch failed")
        return response.json()
      })
      .then(value => {
        setData(value)
        setError("")
      })
      .catch(fetchError => {
        if (fetchError.name !== "AbortError") setError("売上データを取得できませんでした")
      })
      .finally(() => setLoading(false))

    return () => controller.abort()
  }, [chartScale, itemType, page, searchQuery, to])

  const maxMonthly = useMemo(() => Math.max(
    1,
    ...(data?.chart.map(item => item.treatment + item.retail) ?? []),
  ), [data])

  function submitSearch(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setPage(1)
    setSearchQuery(customerSearch.trim())
  }

  function changeType(value: ItemType) {
    setItemType(value)
    setPage(1)
  }

  const summaryCards = [
    {
      label: "今年の売上",
      value: yen(data?.summary.year.totalAmount ?? 0),
      note: yearOverYear(data?.summary.year.totalAmount ?? 0, data?.summary.year.previousTotalAmount ?? 0),
      Icon: FiCalendar,
      tone: "main",
    },
    { label: "会計件数", value: `${data?.summary.saleCount ?? 0} 件`, Icon: FiCreditCard, tone: "purple" },
    { label: "平均会計額", value: yen(data?.summary.averageAmount ?? 0), Icon: FiUsers, tone: "coral" },
    { label: "値引き合計", value: yen(data?.summary.discountAmount ?? 0), Icon: FiPercent, tone: "accent" },
  ]

  return (
    <div className={styles.dashboard}>
      <section className={styles.monthSummary} aria-label="今月の売上">
        <div className={`${styles.summaryIcon} ${styles.main}`}><FiTrendingUp /></div>
        <div className={styles.monthSummaryTitle}>
          <p>今月の売上</p>
          <strong>{yen(data?.summary.month.totalAmount ?? 0)}</strong>
          <span>{yearOverYear(data?.summary.month.totalAmount ?? 0, data?.summary.month.previousTotalAmount ?? 0)}</span>
        </div>
        <div className={styles.monthBreakdown}>
          <div>
            <p><i className={styles.treatmentDot} />施術</p>
            <strong>{yen(data?.summary.month.treatmentAmount ?? 0)}</strong>
            <span>{yearOverYear(data?.summary.month.treatmentAmount ?? 0, data?.summary.month.previousTreatmentAmount ?? 0)}</span>
          </div>
          <div>
            <p><i className={styles.retailDot} />物販</p>
            <strong>{yen(data?.summary.month.retailAmount ?? 0)}</strong>
            <span>{yearOverYear(data?.summary.month.retailAmount ?? 0, data?.summary.month.previousRetailAmount ?? 0)}</span>
          </div>
        </div>
      </section>

      <section className={styles.summaryGrid} aria-label="今月の売上概要">
        {summaryCards.map(({ label, value, note, Icon, tone }) => (
          <article key={label} className={styles.summaryCard}>
            <div className={`${styles.summaryIcon} ${styles[tone]}`}><Icon /></div>
            <div>
              <p>{label}</p>
              <strong>{value}</strong>
              {note && <span>{note}</span>}
            </div>
          </article>
        ))}
      </section>

      <section className={styles.topGrid}>
        <article className={styles.panel}>
          <header className={styles.panelHeader}>
            <div>
              <h2>月別売上推移</h2>
              <p>施術と物販の構成を月単位で確認できます</p>
            </div>
            <div className={styles.chartControls}>
              <div className={styles.chartScale}>
                <button className={chartScale === "month" ? styles.activeScale : ""} onClick={() => setChartScale("month")}>月</button>
                <button className={chartScale === "year" ? styles.activeScale : ""} onClick={() => setChartScale("year")}>年</button>
              </div>
              <div className={styles.rangeInputs}>
                <input aria-label="グラフの基準月" type="month" value={to} onChange={event => setTo(event.target.value)} />
              </div>
            </div>
          </header>
          <div className={styles.legend}>
            <span><i className={styles.treatmentDot} />施術</span>
            <span><i className={styles.retailDot} />物販</span>
          </div>
          <div className={styles.chart} style={{ gridTemplateColumns: `repeat(${data?.chart.length ?? 12}, minmax(0, 1fr))` }}>
            {data?.chart.map(item => {
              const treatmentHeight = item.treatment / maxMonthly * 100
              const retailHeight = item.retail / maxMonthly * 100
              return (
                <div key={item.key} className={styles.barColumn}>
                  <div className={`${styles.barTrack} ${chartScale === "month" ? styles.dayBarTrack : styles.yearBarTrack}`}>
                    <div className={styles.retailBar} style={{ height: `${retailHeight}%` }} title={`物販 ${yen(item.retail)}`} />
                    <div className={styles.treatmentBar} style={{ height: `${treatmentHeight}%` }} title={`施術 ${yen(item.treatment)}`} />
                  </div>
                  <span>{item.label}</span>
                  <div className={styles.chartTooltip}>
                    <strong>{item.tooltipLabel}</strong>
                    <span>合計 <b>{yen(item.treatment + item.retail)}</b></span>
                    <span>施術 <b>{yen(item.treatment)}</b></span>
                    <span>物販 <b>{yen(item.retail)}</b></span>
                  </div>
                </div>
              )
            })}
          </div>
        </article>

        <article className={styles.panel}>
          <header className={styles.panelHeader}>
            <div>
              <h2>売上上位メニュー</h2>
              <p>選択期間内の販売額順</p>
            </div>
          </header>
          <div className={styles.ranking}>
            {data?.byMenu.length ? data.byMenu.map((menu, index) => (
              <div key={`${menu.type}:${menu.name}`} className={styles.rankingRow}>
                <span className={styles.rank}>{index + 1}</span>
                <div className={styles.rankInfo}>
                  <strong>{menu.name}</strong>
                  <span>{menu.type === "TREATMENT" ? "施術" : "物販"} · {menu.count} 件</span>
                </div>
                <b>{yen(menu.total)}</b>
              </div>
            )) : <p className={styles.empty}>対象期間の売上はありません</p>}
          </div>
        </article>
      </section>

      <section className={styles.panel}>
        <header className={styles.listHeader}>
          <div className={styles.listTitle}>
            <h2>会計履歴</h2>
            <p>{data?.pagination.totalCount ?? 0} 件</p>
          </div>
          <div className={styles.listTools}>
            <div className={styles.typeTabs}>
              {([
                ["ALL", "すべて"],
                ["TREATMENT", "施術"],
                ["RETAIL", "物販"],
              ] as const).map(([value, label]) => (
                <button key={value} className={itemType === value ? styles.activeTab : ""} onClick={() => changeType(value)}>
                  {label}
                </button>
              ))}
            </div>
            <form className={styles.search} onSubmit={submitSearch}>
              <FiSearch />
              <input value={customerSearch} onChange={event => setCustomerSearch(event.target.value)} placeholder="顧客名で検索" />
              <button type="submit">検索</button>
            </form>
          </div>
        </header>

        {error && <p className={styles.error}>{error}</p>}
        {loading ? (
          <p className={styles.empty}>読み込み中...</p>
        ) : data?.sales.length ? (
          <div className={styles.tableWrap}>
            <table>
              <thead>
                <tr><th>日時</th><th>顧客</th><th>内容</th><th>値引き</th><th>合計</th></tr>
              </thead>
              <tbody>
                {data.sales.map(sale => (
                  <tr key={sale.id}>
                    <td>{dateTimeLabel(sale.soldAt)}</td>
                    <td>{sale.customer?.name ?? "顧客未選択"}</td>
                    <td>
                      <div className={styles.lineSummary}>
                        {sale.lines.map(line => (
                          <span key={line.id}>
                            {line.itemType === "RETAIL" && <FiShoppingBag />}
                            {line.itemName}{line.quantity > 1 ? ` × ${line.quantity}` : ""}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className={styles.discount}>{sale.discountAmount > 0 ? `-${yen(sale.discountAmount)}` : "-"}</td>
                    <td className={styles.amount}>{yen(sale.totalAmount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : <p className={styles.empty}>条件に一致する会計履歴はありません</p>}

        <footer className={styles.pagination}>
          <span>{data?.pagination.page ?? 1} / {data?.pagination.totalPages ?? 1} ページ</span>
          <div>
            <button aria-label="前のページ" disabled={!data || data.pagination.page <= 1} onClick={() => setPage(value => value - 1)}><FiChevronLeft /></button>
            <button aria-label="次のページ" disabled={!data || data.pagination.page >= data.pagination.totalPages} onClick={() => setPage(value => value + 1)}><FiChevronRight /></button>
          </div>
        </footer>
      </section>
    </div>
  )
}
