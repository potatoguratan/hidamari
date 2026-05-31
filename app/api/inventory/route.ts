import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/db/prisma"

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await req.json()
  const itemType = body.itemType ?? "MATERIAL"
  let categoryId = body.categoryId

  if (itemType === "RETAIL") {
    const retailCategory = await prisma.inventoryCategory.findFirst({ where: { name: "物販" } })
      ?? await prisma.inventoryCategory.create({ data: { name: "物販" } })
    categoryId = retailCategory.id
  }

  const item = await prisma.inventoryItem.create({
    data: {
      categoryId,
      itemType,
      name: body.name,
      quantity: Number(body.quantity),
      unit: itemType === "RETAIL" ? "個" : body.unit,
      alertThreshold: Number(body.alertThreshold),
    },
  })
  return NextResponse.json(item, { status: 201 })
}
