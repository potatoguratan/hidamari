import "dotenv/config"
import path from "path"
import { PrismaLibSql } from "@prisma/adapter-libsql"
import { PrismaClient } from "../app/generated/prisma/client"

const dbPath = path.join(process.cwd(), "prisma", "dev.db").replace(/\\/g, "/")
const adapter = new PrismaLibSql({ url: `file:${dbPath}` })
const prisma = new PrismaClient({ adapter })

const MENU_ITEMS = [
  { name: "カット",         price: 4000, durationMin: 60  },
  { name: "フロントカット",  price: 2000, durationMin: 30  },
  { name: "カラー",         price: 6000, durationMin: 90  },
  { name: "ブリーチ（1回）", price: 5000, durationMin: 90  },
  { name: "ハイライト",     price: 4000, durationMin: 60  },
  { name: "インナーカラー",  price: 3000, durationMin: 60  },
  { name: "パーマ",         price: 6000, durationMin: 90  },
  { name: "デジタルパーマ",  price: 5000, durationMin: 90  },
  { name: "トリートメント",  price: 1500, durationMin: 15  },
  { name: "縮毛矯正",       price: 8000, durationMin: 210 },
]

async function main() {
  const existing = await prisma.menuItem.count()
  if (existing > 0) {
    console.log(`Skipped: ${existing} menu items already exist.`)
    return
  }
  const result = await prisma.menuItem.createMany({ data: MENU_ITEMS })
  console.log(`Seeded ${result.count} menu items.`)
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
