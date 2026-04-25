import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/db/prisma"

type Params = { params: Promise<{ id: string }> }

export async function GET(_req: NextRequest, { params }: Params) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await params

  const customer = await prisma.customer.findUnique({
    where: { id },
    include: {
      treatments: {
        include: { menuItems: { include: { menuItem: true } } },
        orderBy: { date: "desc" },
      },
    },
  })

  if (!customer) return NextResponse.json({ error: "Not found" }, { status: 404 })
  return NextResponse.json(customer)
}

export async function PATCH(req: NextRequest, { params }: Params) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await params
  const body = await req.json()

  const customer = await prisma.customer.update({
    where: { id },
    data: {
      name: body.name,
      nameKana: body.nameKana,
      phone: body.phone ?? null,
      email: body.email ?? null,
      birthday: body.birthday ? new Date(body.birthday) : null,
      allergies: body.allergies ?? null,
      notes: body.notes ?? null,
    },
  })

  return NextResponse.json(customer)
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await params
  await prisma.customer.delete({ where: { id } })
  return new NextResponse(null, { status: 204 })
}
