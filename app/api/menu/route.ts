import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/db/prisma"

export async function GET() {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const items = await prisma.menuItem.findMany({
    orderBy: [{ isActive: "desc" }, { name: "asc" }],
  })
  return NextResponse.json(items)
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

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
}
