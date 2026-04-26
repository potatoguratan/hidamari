import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/db/prisma"

export async function GET() {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  try {
    const items = await prisma.menuItem.findMany({
      orderBy: { sortOrder: "asc" },
    })
    return NextResponse.json(items)
  } catch (e) {
    console.error("[GET /api/menu]", e)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  try {
    const body = await req.json()
    const item = await prisma.menuItem.create({
      data: {
        name: body.name,
        price: Number(body.price),
        durationMin: Number(body.durationMin),
        isActive: body.isActive ?? true,
      },
    })
    return NextResponse.json(item, { status: 201 })
  } catch (e) {
    console.error("[POST /api/menu]", e)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
