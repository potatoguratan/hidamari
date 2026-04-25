import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/db/prisma"
import { getMonthRange, getYearRange, getDayRange } from "@/lib/utils/date"
import type { Treatment } from "@/app/generated/prisma/client"

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

  const treatments = await prisma.treatment.findMany({
    where: {
      date: { gte: range.start, lte: range.end },
    },
    include: { menuItems: { include: { menuItem: true } } },
    orderBy: { date: "asc" },
  })

  const totalAmount = treatments.reduce((s: number, t: Treatment) => s + t.totalAmount, 0)
  const discountTotal = treatments.reduce((s: number, t: Treatment) => s + t.discount, 0)

  const byMenu: Record<string, { name: string; count: number; total: number }> = {}
  for (const t of treatments) {
    for (const m of t.menuItems) {
      if (!byMenu[m.menuItemId]) {
        byMenu[m.menuItemId] = { name: m.menuItem.name, count: 0, total: 0 }
      }
      byMenu[m.menuItemId].count += 1
      byMenu[m.menuItemId].total += m.price
    }
  }

  return NextResponse.json({
    summary: {
      period: period,
      totalAmount,
      treatmentCount: treatments.length,
      discountTotal,
      netAmount: totalAmount - discountTotal,
    },
    byMenu: Object.entries(byMenu).map(([menuItemId, v]) => ({
      menuItemId,
      menuItemName: v.name,
      count: v.count,
      totalAmount: v.total,
    })),
  })
}
