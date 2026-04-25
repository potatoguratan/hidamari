import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/db/prisma"

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await req.json()

  const item = await prisma.inventoryItem.create({
    data: {
      categoryId: body.categoryId,
      name: body.name,
      quantity: Number(body.quantity),
      unit: body.unit,
      alertThreshold: Number(body.alertThreshold),
    },
  })
  return NextResponse.json(item, { status: 201 })
}
