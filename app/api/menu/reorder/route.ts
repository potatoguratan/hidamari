import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/db/prisma"

export async function PATCH(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  try {
    const { items }: { items: { id: string; sortOrder: number }[] } = await req.json()

    await prisma.$transaction(
      items.map(({ id, sortOrder }) =>
        prisma.menuItem.update({ where: { id }, data: { sortOrder } })
      )
    )

    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error("[PATCH /api/menu/reorder]", e)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
