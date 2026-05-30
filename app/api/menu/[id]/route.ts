import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/db/prisma"

type Params = { params: Promise<{ id: string }> }

export async function PATCH(req: NextRequest, { params }: Params) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  try {
    const { id } = await params
    const body = await req.json()
    const item = await prisma.menuItem.update({
      where: { id },
      data: {
        name: body.name,
        price: Number(body.price),
        durationMin: Number(body.durationMin),
        menuType: body.menuType,
        isActive: body.isActive,
      },
    })
    return NextResponse.json(item)
  } catch (e) {
    console.error("[PATCH /api/menu/:id]", e)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  try {
    const { id } = await params
    await prisma.menuItem.delete({ where: { id } })
    return new NextResponse(null, { status: 204 })
  } catch (e) {
    console.error("[DELETE /api/menu/:id]", e)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
