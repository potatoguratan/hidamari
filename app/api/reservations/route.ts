import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/db/prisma"

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  try {
    const { searchParams } = req.nextUrl
    const from = searchParams.get("from")
    const to = searchParams.get("to")

    const reservations = await prisma.reservation.findMany({
      where: {
        startTime: {
          gte: from ? new Date(from) : undefined,
          lte: to ? new Date(to) : undefined,
        },
      },
      include: {
        customer: true,
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

    const reservation = await prisma.reservation.create({
      data: {
        customerId: body.customerId,
        startTime: new Date(body.startTime),
        endTime: new Date(body.endTime),
        notes: body.notes ?? null,
        menuItems: { create: body.menuItemIds.map((id: string) => ({ menuItemId: id })) },
      },
      include: {
        customer: true,
        menuItems: { include: { menuItem: true } },
      },
    })
    return NextResponse.json(reservation, { status: 201 })
  } catch (e) {
    console.error("[POST /api/reservations]", e)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
