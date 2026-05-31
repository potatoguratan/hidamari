import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/db/prisma"

type Params = { params: Promise<{ id: string }> }

export async function PATCH(req: NextRequest, { params }: Params) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await params
  const body = await req.json()

  const item = await prisma.inventoryItem.update({
    where: { id },
    data: {
      name: body.name,
      quantity: body.quantity !== undefined ? Number(body.quantity) : undefined,
      unit: body.itemType === "RETAIL" ? "個" : body.unit,
      itemType: body.itemType,
      alertThreshold: body.alertThreshold !== undefined ? Number(body.alertThreshold) : undefined,
      categoryId: body.categoryId,
    },
  })
  return NextResponse.json(item)
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await params
  await prisma.inventoryItem.delete({ where: { id } })
  return new NextResponse(null, { status: 204 })
}
