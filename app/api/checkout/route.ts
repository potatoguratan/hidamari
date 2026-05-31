import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/db/prisma"

type RequestedCheckoutItem = {
  menuItemId: string
  price: number
  quantity?: number
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await req.json()
  const requestedItemValues: unknown[] = Array.isArray(body.menuItems) ? body.menuItems : []
  const requestedItems: RequestedCheckoutItem[] = requestedItemValues
    .filter((item: unknown): item is RequestedCheckoutItem => (
        typeof item === "object" &&
        item !== null &&
        typeof (item as RequestedCheckoutItem).menuItemId === "string"
      ))
  if (requestedItems.length === 0 || requestedItems.length !== requestedItemValues.length) {
    return NextResponse.json({ error: "Menu items are required" }, { status: 400 })
  }

  const menuItemIds = [...new Set(requestedItems.map(item => item.menuItemId))]
  const menuItems = await prisma.menuItem.findMany({
    where: { id: { in: menuItemIds } },
  })
  if (menuItems.length !== menuItemIds.length) {
    return NextResponse.json({ error: "Menu item not found" }, { status: 400 })
  }

  const menuById = new Map(menuItems.map(item => [item.id, item]))
  const lines = requestedItems.map(requestedItem => {
    const menuItem = menuById.get(requestedItem.menuItemId)!
    const requestedQuantity = Number(requestedItem.quantity)
    const quantity = Number.isFinite(requestedQuantity)
      ? Math.max(1, Math.floor(requestedQuantity))
      : 1
    const unitPrice = menuItem.price
    const requestedPrice = Number(requestedItem.price)
    const finalUnitPrice = Number.isFinite(requestedPrice)
      ? Math.max(0, Math.min(unitPrice, Math.round(requestedPrice)))
      : unitPrice
    const originalAmount = unitPrice * quantity
    const finalAmount = finalUnitPrice * quantity

    return {
      menuItemId: menuItem.id,
      inventoryItemId: menuItem.inventoryItemId,
      itemType: menuItem.menuType,
      itemName: menuItem.name,
      unitPrice,
      quantity,
      originalAmount,
      discountAmount: originalAmount - finalAmount,
      finalAmount,
    }
  })
  const subtotalAmount = lines.reduce((sum, line) => sum + line.originalAmount, 0)
  const discountAmount = lines.reduce((sum, line) => sum + line.discountAmount, 0)
  const totalAmount = lines.reduce((sum, line) => sum + line.finalAmount, 0)

  const sale = await prisma.sale.create({
    data: {
      customerId: body.customerId || null,
      reservationId: body.reservationId || null,
      subtotalAmount,
      discountAmount,
      totalAmount,
      notes: body.notes ?? null,
      lines: {
        create: lines,
      },
    },
    include: {
      customer: true,
      reservation: true,
      lines: true,
    },
  })

  return NextResponse.json(sale, { status: 201 })
}
