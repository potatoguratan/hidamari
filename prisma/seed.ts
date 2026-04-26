import "dotenv/config"
import path from "path"
import { PrismaLibSql } from "@prisma/adapter-libsql"
import { PrismaClient } from "../app/generated/prisma/client"

const dbPath = path.join(process.cwd(), "prisma", "dev.db").replace(/\\/g, "/")
const adapter = new PrismaLibSql({ url: `file:${dbPath}` })
const prisma = new PrismaClient({ adapter })

const MENU_ITEMS = [
  { name: "カット",         price: 4000, durationMin: 60,  sortOrder: 0  },
  { name: "フロントカット",  price: 2000, durationMin: 30,  sortOrder: 1  },
  { name: "カラー",         price: 6000, durationMin: 90,  sortOrder: 2  },
  { name: "ブリーチ（1回）", price: 5000, durationMin: 90,  sortOrder: 3  },
  { name: "ハイライト",     price: 4000, durationMin: 60,  sortOrder: 4  },
  { name: "インナーカラー",  price: 3000, durationMin: 60,  sortOrder: 5  },
  { name: "パーマ",         price: 6000, durationMin: 90,  sortOrder: 6  },
  { name: "デジタルパーマ",  price: 5000, durationMin: 90,  sortOrder: 7  },
  { name: "トリートメント",  price: 1500, durationMin: 15,  sortOrder: 8  },
  { name: "縮毛矯正",       price: 8000, durationMin: 210, sortOrder: 9  },
]

async function main() {
  const existing = await prisma.menuItem.count()

  if (existing === 0) {
    const result = await prisma.menuItem.createMany({ data: MENU_ITEMS })
    console.log(`Seeded ${result.count} menu items.`)
    return
  }

  // 既存データの sortOrder がすべて 0 なら順番を付け直す
  const zeroCount = await prisma.menuItem.count({ where: { sortOrder: 0 } })
  if (zeroCount === existing) {
    const items = await prisma.menuItem.findMany({ orderBy: { name: "asc" } })
    for (let i = 0; i < items.length; i++) {
      await prisma.menuItem.update({ where: { id: items[i].id }, data: { sortOrder: i } })
    }
    console.log(`Updated sortOrder for ${items.length} existing items.`)
  } else {
    console.log(`Skipped: ${existing} menu items already exist with sortOrder set.`)
  }
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
