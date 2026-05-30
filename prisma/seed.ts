import "dotenv/config"
import path from "path"
import bcrypt from "bcryptjs"
import { PrismaLibSql } from "@prisma/adapter-libsql"
import { PrismaClient } from "../app/generated/prisma/client"

const dbPath = path.join(process.cwd(), "prisma", "dev.db").replace(/\\/g, "/")
const adapter = new PrismaLibSql({ url: `file:${dbPath}` })
const prisma = new PrismaClient({ adapter })

// ── Staff ────────────────────────────────────────────────────────────────
const STAFF_SEED = [
  {
    name:     "管理者",
    email:    "developer@hidamari.com",
    password: "hidamari2026",
    role:     "ADMIN" as const,
  },
]

// ── Customer ─────────────────────────────────────────────────────────────
const CUSTOMERS = [
  { name: "田中 花子",   nameKana: "たなか はなこ",   phone: "090-1234-5678", email: "hanako@example.com",  birthday: new Date("1988-03-15"), allergies: null,               notes: "ロングヘア、毎月来店" },
  { name: "佐藤 美咲",   nameKana: "さとう みさき",   phone: "080-9876-5432", email: null,                  birthday: new Date("1995-07-22"), allergies: "パーマ液アレルギー", notes: null },
  { name: "鈴木 由美",   nameKana: "すずき ゆみ",     phone: "070-1111-2222", email: "yumi@example.com",    birthday: new Date("1979-11-08"), allergies: null,               notes: null },
  { name: "山田 彩花",   nameKana: "やまだ あやか",   phone: "090-3333-4444", email: null,                  birthday: new Date("2001-05-30"), allergies: null,               notes: "前回カラー：ベージュ" },
  { name: "伊藤 明日香", nameKana: "いとう あすか",   phone: "080-5555-6666", email: "asuka@example.com",   birthday: new Date("1992-01-18"), allergies: null,               notes: null },
  { name: "渡辺 千春",   nameKana: "わたなべ ちはる", phone: null,             email: "chiharu@example.com", birthday: new Date("1985-09-03"), allergies: "金属アレルギー",   notes: "カラーは植物性のみ希望" },
  { name: "中村 優子",   nameKana: "なかむら ゆうこ", phone: "090-7777-8888", email: null,                  birthday: new Date("1998-12-25"), allergies: null,               notes: null },
  { name: "小林 真理子", nameKana: "こばやし まりこ", phone: "070-2222-3333", email: "mariko@example.com",  birthday: new Date("1975-06-14"), allergies: null,               notes: "敏感肌" },
]

async function seedCustomers() {
  const existing = await prisma.customer.count()
  if (existing > 0) {
    console.log(`Skipped customers: ${existing} records already exist.`)
    return
  }
  const result = await prisma.customer.createMany({ data: CUSTOMERS })
  console.log(`Seeded ${result.count} customers.`)
}

// ── MenuItem ─────────────────────────────────────────────────────────────
const TREATMENT_ITEMS = [
  { name: "カット",         price: 4000, durationMin: 60,  menuType: "TREATMENT" as const, sortOrder: 0 },
  { name: "フロントカット",  price: 2000, durationMin: 30,  menuType: "TREATMENT" as const, sortOrder: 1 },
  { name: "カラー",         price: 6000, durationMin: 90,  menuType: "TREATMENT" as const, sortOrder: 2 },
  { name: "ブリーチ（1回）", price: 5000, durationMin: 90,  menuType: "TREATMENT" as const, sortOrder: 3 },
  { name: "ハイライト",     price: 4000, durationMin: 60,  menuType: "TREATMENT" as const, sortOrder: 4 },
  { name: "インナーカラー",  price: 3000, durationMin: 60,  menuType: "TREATMENT" as const, sortOrder: 5 },
  { name: "パーマ",         price: 6000, durationMin: 90,  menuType: "TREATMENT" as const, sortOrder: 6 },
  { name: "デジタルパーマ",  price: 5000, durationMin: 90,  menuType: "TREATMENT" as const, sortOrder: 7 },
  { name: "トリートメント",  price: 1500, durationMin: 15,  menuType: "TREATMENT" as const, sortOrder: 8 },
  { name: "縮毛矯正",       price: 8000, durationMin: 210, menuType: "TREATMENT" as const, sortOrder: 9 },
]

const RETAIL_ITEMS = [
  { name: "シャンプー",           price: 1500, durationMin: 0, menuType: "RETAIL" as const, sortOrder: 0 },
  { name: "コンディショナー",      price: 1500, durationMin: 0, menuType: "RETAIL" as const, sortOrder: 1 },
  { name: "トリートメントマスク",   price: 2500, durationMin: 0, menuType: "RETAIL" as const, sortOrder: 2 },
  { name: "ヘアオイル",           price: 2200, durationMin: 0, menuType: "RETAIL" as const, sortOrder: 3 },
  { name: "ヘアワックス",          price: 1200, durationMin: 0, menuType: "RETAIL" as const, sortOrder: 4 },
  { name: "スタイリングスプレー",   price: 1000, durationMin: 0, menuType: "RETAIL" as const, sortOrder: 5 },
  { name: "ヘアセラム",           price: 2800, durationMin: 0, menuType: "RETAIL" as const, sortOrder: 6 },
]

async function seedStaff() {
  for (const s of STAFF_SEED) {
    const exists = await prisma.staff.findUnique({ where: { email: s.email } })
    if (exists) {
      console.log(`Staff already exists: ${s.email}`)
      continue
    }
    const hashed = await bcrypt.hash(s.password, 12)
    await prisma.staff.create({
      data: { name: s.name, email: s.email, password: hashed, role: s.role },
    })
    console.log(`Created staff: ${s.email}`)
  }
}

async function seedMenu() {
  const treatmentCount = await prisma.menuItem.count({ where: { menuType: "TREATMENT" } })
  if (treatmentCount === 0) {
    const result = await prisma.menuItem.createMany({ data: TREATMENT_ITEMS })
    console.log(`Seeded ${result.count} treatment menu items.`)
  } else {
    console.log(`Skipped treatment menus: ${treatmentCount} already exist.`)
  }

  const retailCount = await prisma.menuItem.count({ where: { menuType: "RETAIL" } })
  if (retailCount === 0) {
    const result = await prisma.menuItem.createMany({ data: RETAIL_ITEMS })
    console.log(`Seeded ${result.count} retail menu items.`)
  } else {
    console.log(`Skipped retail menus: ${retailCount} already exist.`)
  }
}

// ── Inventory ─────────────────────────────────────────────────────────────
const INVENTORY_SEED: {
  category: string
  items: { name: string; quantity: number; unit: string; alertThreshold: number }[]
}[] = [
  {
    category: "カラー材",
    items: [
      { name: "アルカリカラー",  quantity: 80,  unit: "g",  alertThreshold: 20 },
      { name: "オキサイド 3%",   quantity: 200, unit: "mL", alertThreshold: 50 },
      { name: "オキサイド 6%",   quantity: 150, unit: "mL", alertThreshold: 50 },
      { name: "ブリーチ剤",      quantity: 30,  unit: "g",  alertThreshold: 10 },
    ],
  },
  {
    category: "パーマ液",
    items: [
      { name: "パーマ液 1液", quantity: 8,  unit: "本", alertThreshold: 3 },
      { name: "パーマ液 2液", quantity: 10, unit: "本", alertThreshold: 3 },
    ],
  },
  {
    category: "トリートメント",
    items: [
      { name: "トリートメント剤",   quantity: 600, unit: "g",  alertThreshold: 100 },
      { name: "スカルプエッセンス", quantity: 180, unit: "mL", alertThreshold:  50 },
    ],
  },
  {
    category: "消耗品",
    items: [
      { name: "タオル",       quantity: 45, unit: "枚", alertThreshold: 10 },
      { name: "カットクロス", quantity: 28, unit: "枚", alertThreshold:  5 },
      { name: "アルミホイル", quantity:  3, unit: "本", alertThreshold:  1 },
    ],
  },
]

async function seedInventory() {
  const existing = await prisma.inventoryCategory.count()
  if (existing > 0) {
    console.log(`Skipped inventory: ${existing} categories already exist.`)
    return
  }
  let total = 0
  for (const { category, items } of INVENTORY_SEED) {
    const cat = await prisma.inventoryCategory.create({ data: { name: category } })
    await prisma.inventoryItem.createMany({
      data: items.map(item => ({ ...item, categoryId: cat.id })),
    })
    total += items.length
  }
  console.log(`Seeded ${INVENTORY_SEED.length} categories, ${total} inventory items.`)
}

async function main() {
  await seedStaff()
  await seedMenu()
  await seedCustomers()
  await seedInventory()
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
