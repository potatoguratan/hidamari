import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"
import bcrypt from "bcryptjs"
import authConfig from "./auth.config"

export const { auth, handlers, signIn, signOut } = NextAuth({
  ...authConfig,
  session: { strategy: "jwt" },
  providers: [
    Credentials({
      credentials: {
        email: { label: "メールアドレス", type: "email" },
        password: { label: "パスワード", type: "password" },
      },
      async authorize(credentials) {
        const email = credentials?.email as string | undefined
        const password = credentials?.password as string | undefined
        if (!email || !password) return null

        // DB が接続されている場合は DB 認証
        try {
          const { prisma } = await import("@/lib/db/prisma")
          const staff = await prisma.staff.findUnique({ where: { email } })
          if (staff && staff.isActive) {
            const isValid = await bcrypt.compare(password, staff.password)
            if (isValid) {
              return { id: staff.id, name: staff.name, email: staff.email, role: staff.role }
            }
          }
          return null
        } catch {
          // DB 未接続時は env のフォールバック管理者アカウントで認証（ローカル開発専用）
          const adminEmail = process.env.ADMIN_EMAIL
          const adminPassword = process.env.ADMIN_PASSWORD
          if (adminEmail && adminPassword && email === adminEmail && password === adminPassword) {
            return { id: "admin", name: "管理者", email: adminEmail, role: "ADMIN" }
          }
          return null
        }
      },
    }),
  ],
})
