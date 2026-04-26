import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/db/prisma"
import { hasDoubleBooking } from "@/lib/utils/validation"

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  try {
    const { searchParams } = req.nextUrl
    const from = searchParams.get("from")
    const to   = searchParams.get("to")

    const reservations = await prisma.reservation.findMany({
      where: {
        startTime: {
          gte: from ? new Date(from) : undefined,
          lte: to   ? new Date(to)   : undefined,
        },
      },
      include: {
        customer:  true,
        menuItems: { include: { menuItem: true } },
      },
      orderBy: { startTime: "asc" },
    })
    return NextResponse.json(reservations)
  } catch (e) {
    console.error("[GET /api/reservations]", e)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  try {
    const body = await req.json()

    const existing = await prisma.reservation.findMany({
      where: {
        status:    "CONFIRMED",
        startTime: { lt: new Date(body.endTime) },
        endTime:   { gt: new Date(body.startTime) },
      },
      select: { id: true, startTime: true, endTime: true },
    })

    if (hasDoubleBooking(
      existing.map((r: { id: string; startTime: Date; endTime: Date }) => ({
        id: r.id,
        startTime: r.startTime.toISOString(),
        endTime:   r.endTime.toISOString(),
      })),
      body,
    )) {
      return NextResponse.json({ error: "ダブルブッキングが検出されました" }, { status: 409 })
    }

    const reservation = await prisma.reservation.create({
      data: {
        customerId: body.customerId,
        startTime:  new Date(body.startTime),
        endTime:    new Date(body.endTime),
        notes:      body.notes ?? null,
        menuItems:  { create: body.menuItemIds.map((id: string) => ({ menuItemId: id })) },
      },
      include: {
        customer:  true,
        menuItems: { include: { menuItem: true } },
      },
    })
    return NextResponse.json(reservation, { status: 201 })
  } catch (e) {
    console.error("[POST /api/reservations]", e)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
