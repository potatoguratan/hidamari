import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/db/prisma"
import { getMonthRange, getYearRange, getDayRange } from "@/lib/utils/date"

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { searchParams } = req.nextUrl
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
