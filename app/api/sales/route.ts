import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/db/prisma"
import { getMonthRange, getYearRange, getDayRange } from "@/lib/utils/date"
import type { MenuItemType, Prisma } from "@/app/generated/prisma/client"

const PAGE_SIZE = 30

function parseMonth(value: string | null, fallback: Date) {
  if (!value || !/^\d{4}-\d{2}$/.test(value)) return fallback
  const [year, month] = value.split("-").map(Number)
  if (month < 1 || month > 12) return fallback
  return new Date(year, month - 1, 1)
}

function monthKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`
}

function dayKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`
}

function startOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1)
}

function endOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999)
}

function addMonths(date: Date, amount: number) {
  return new Date(date.getFullYear(), date.getMonth() + amount, 1)
}

function startOfYear(date: Date) {
  return new Date(date.getFullYear(), 0, 1)
}

function endOfComparableMonth(date: Date, year: number) {
  return new Date(year, date.getMonth() + 1, 0, 23, 59, 59, 999)
}

function summarizeSales(sales: { totalAmount: number; discountAmount: number; lines: { itemType: MenuItemType; finalAmount: number }[] }[]) {
  return sales.reduce((summary, sale) => {
    summary.totalAmount += sale.totalAmount
    summary.discountAmount += sale.discountAmount
    for (const line of sale.lines) {
      summary[line.itemType === "TREATMENT" ? "treatmentAmount" : "retailAmount"] += line.finalAmount
    }
    return summary
  }, { totalAmount: 0, treatmentAmount: 0, retailAmount: 0, discountAmount: 0 })
}

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { searchParams } = req.nextUrl
  if (searchParams.get("view") === "dashboard") {
    const now = new Date()
    const defaultEnd = startOfMonth(now)
    const to = parseMonth(searchParams.get("to"), defaultEnd)
    const chartScale = searchParams.get("chartScale") === "month" ? "month" : "year"
    const rangeStart = chartScale === "month" ? startOfMonth(to) : addMonths(to, -11)
    const rangeEnd = endOfMonth(to)
    const itemType = searchParams.get("itemType")
    const customer = searchParams.get("customer")?.trim() ?? ""
    const page = Math.max(1, Number(searchParams.get("page")) || 1)
    const lineType: MenuItemType | undefined = itemType === "TREATMENT" || itemType === "RETAIL" ? itemType : undefined
    const listWhere: Prisma.SaleWhereInput = {
      ...(customer ? { customer: { name: { contains: customer } } } : {}),
      ...(lineType ? { lines: { some: { itemType: lineType } } } : {}),
    }

    const previousMonth = new Date(now.getFullYear() - 1, now.getMonth(), 1)
    const previousYear = new Date(now.getFullYear() - 1, 0, 1)
    const [chartSales, listSales, listCount, currentMonthSales, previousMonthSales, currentYearSales, previousYearSales] = await prisma.$transaction([
      prisma.sale.findMany({
        where: { soldAt: { gte: rangeStart, lte: rangeEnd } },
        include: { lines: true },
        orderBy: { soldAt: "asc" },
      }),
      prisma.sale.findMany({
        where: listWhere,
        include: { customer: true, lines: true },
        orderBy: { soldAt: "desc" },
        skip: (page - 1) * PAGE_SIZE,
        take: PAGE_SIZE,
      }),
      prisma.sale.count({ where: listWhere }),
      prisma.sale.findMany({
        where: { soldAt: { gte: startOfMonth(now), lte: endOfMonth(now) } },
        include: { lines: true },
      }),
      prisma.sale.findMany({
        where: { soldAt: { gte: previousMonth, lte: endOfMonth(previousMonth) } },
        include: { lines: true },
      }),
      prisma.sale.findMany({
        where: { soldAt: { gte: startOfYear(now), lte: endOfMonth(now) } },
        include: { lines: true },
      }),
      prisma.sale.findMany({
        where: { soldAt: { gte: previousYear, lte: endOfComparableMonth(now, now.getFullYear() - 1) } },
        include: { lines: true },
      }),
    ])

    const chart = []
    if (chartScale === "month") {
      for (let cursor = rangeStart; cursor <= rangeEnd; cursor = new Date(cursor.getFullYear(), cursor.getMonth(), cursor.getDate() + 1)) {
        chart.push({
          key: dayKey(cursor),
          label: String(cursor.getDate()),
          tooltipLabel: `${cursor.getMonth() + 1}月${cursor.getDate()}日`,
          treatment: 0,
          retail: 0,
        })
      }
    } else {
      for (let cursor = rangeStart; cursor <= rangeEnd; cursor = addMonths(cursor, 1)) {
        chart.push({
          key: monthKey(cursor),
          label: `${cursor.getMonth() + 1}月`,
          tooltipLabel: `${cursor.getFullYear()}年${cursor.getMonth() + 1}月`,
          treatment: 0,
          retail: 0,
        })
      }
    }
    const chartByKey = new Map(chart.map(value => [value.key, value]))
    const byMenu = new Map<string, { name: string; type: "TREATMENT" | "RETAIL"; count: number; total: number }>()
    for (const sale of chartSales) {
      const chartItem = chartByKey.get(chartScale === "month" ? dayKey(sale.soldAt) : monthKey(sale.soldAt))
      for (const line of sale.lines) {
        if (chartItem) {
          chartItem[line.itemType === "TREATMENT" ? "treatment" : "retail"] += line.finalAmount
        }
        const key = line.menuItemId ?? `${line.itemType}:${line.itemName}`
        const current = byMenu.get(key) ?? { name: line.itemName, type: line.itemType, count: 0, total: 0 }
        current.count += line.quantity
        current.total += line.finalAmount
        byMenu.set(key, current)
      }
    }

    const currentMonthSummary = summarizeSales(currentMonthSales)
    const previousMonthSummary = summarizeSales(previousMonthSales)
    const currentYearSummary = summarizeSales(currentYearSales)
    const previousYearSummary = summarizeSales(previousYearSales)

    return NextResponse.json({
      summary: {
        totalAmount: currentMonthSummary.totalAmount,
        saleCount: currentMonthSales.length,
        averageAmount: currentMonthSales.length === 0 ? 0 : Math.round(currentMonthSummary.totalAmount / currentMonthSales.length),
        discountAmount: currentMonthSummary.discountAmount,
        month: {
          ...currentMonthSummary,
          previousTotalAmount: previousMonthSummary.totalAmount,
          previousTreatmentAmount: previousMonthSummary.treatmentAmount,
          previousRetailAmount: previousMonthSummary.retailAmount,
        },
        year: {
          totalAmount: currentYearSummary.totalAmount,
          previousTotalAmount: previousYearSummary.totalAmount,
        },
      },
      chart,
      byMenu: [...byMenu.values()].sort((a, b) => b.total - a.total).slice(0, 6),
      sales: listSales,
      pagination: {
        page,
        pageSize: PAGE_SIZE,
        totalCount: listCount,
        totalPages: Math.max(1, Math.ceil(listCount / PAGE_SIZE)),
      },
    })
  }

  const period = (searchParams.get("period") ?? "monthly") as "daily" | "monthly" | "yearly"
  const year = Number(searchParams.get("year") ?? new Date().getFullYear())
  const month = Number(searchParams.get("month") ?? new Date().getMonth() + 1)
  const day = Number(searchParams.get("day") ?? new Date().getDate())

  let range: { start: Date; end: Date }
  if (period === "yearly") range = getYearRange(year)
  else if (period === "monthly") range = getMonthRange(year, month)
  else range = getDayRange(new Date(year, month - 1, day))

  const sales = await prisma.sale.findMany({
    where: {
      soldAt: { gte: range.start, lte: range.end },
    },
    include: { lines: true },
    orderBy: { soldAt: "asc" },
  })

  const totalAmount = sales.reduce((sum, sale) => sum + sale.subtotalAmount, 0)
  const discountTotal = sales.reduce((sum, sale) => sum + sale.discountAmount, 0)
  const netAmount = sales.reduce((sum, sale) => sum + sale.totalAmount, 0)

  const byMenu: Record<string, { name: string; count: number; total: number }> = {}
  for (const sale of sales) {
    for (const line of sale.lines) {
      const key = line.menuItemId ?? `snapshot:${line.itemName}`
      if (!byMenu[key]) {
        byMenu[key] = { name: line.itemName, count: 0, total: 0 }
      }
      byMenu[key].count += line.quantity
      byMenu[key].total += line.finalAmount
    }
  }

  return NextResponse.json({
    summary: {
      period: period,
      totalAmount,
      saleCount: sales.length,
      treatmentCount: sales.length,
      discountTotal,
      netAmount,
    },
    byMenu: Object.entries(byMenu).map(([menuItemId, v]) => ({
      menuItemId,
      menuItemName: v.name,
      count: v.count,
      totalAmount: v.total,
    })),
  })
}
