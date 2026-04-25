import "dotenv/config"
import { defineConfig } from "prisma/config"

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: process.env["DATABASE_URL"]!,
    // Supabase 本番環境では DIRECT_URL（プールを経由しない直接接続）を使用
    // https://supabase.com/docs/guides/database/prisma
    ...(process.env["DIRECT_URL"] ? { shadowDatabaseUrl: process.env["DIRECT_URL"] } : {}),
  },
})
