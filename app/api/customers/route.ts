import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/db/prisma"

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  try {
    const q = req.nextUrl.searchParams.get("q") ?? ""
    const customers = await prisma.customer.findMany({
      where: q ? {
        OR: [
          { name: { contains: q } },
          { nameKana: { contains: q } },
          { phone: { contains: q } },
        ],
      } : undefined,
      orderBy: { createdAt: "desc" },
    })
    return NextResponse.json(customers)
  } catch (e) {
    console.error("[GET /api/customers]", e)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  try {
    const body = await req.json()
    const customer = await prisma.customer.create({
      data: {
        name:      body.name,
        nameKana:  body.nameKana,
        phone:     body.phone    || null,
        email:     body.email    || null,
        birthday:  body.birthday ? new Date(body.birthday) : null,
        allergies: body.allergies || null,
        notes:     body.notes    || null,
      },
    })
    return NextResponse.json(customer, { status: 201 })
  } catch (e) {
    console.error("[POST /api/customers]", e)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
