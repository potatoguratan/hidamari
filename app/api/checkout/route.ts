import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/db/prisma"

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await req.json()
  const { customerId, menuItems, discount = 0, notes } = body

  const totalAmount = menuItems.reduce((s: number, m: { price: number }) => s + m.price, 0)

  const treatment = await prisma.treatment.create({
    data: {
      customerId,
      date: new Date(),
      totalAmount,
      discount,
      notes: notes ?? null,
      menuItems: {
        create: menuItems.map((m: { menuItemId: string; price: number }) => ({
          menuItemId: m.menuItemId,
          price: m.price,
        })),
      },
    },
    include: {
      customer: true,
      menuItems: { include: { menuItem: true } },
    },
  })

  return NextResponse.json(treatment, { status: 201 })
}
