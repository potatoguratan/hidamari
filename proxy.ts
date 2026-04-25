import NextAuth from "next-auth"
import authConfig from "./auth.config"
import { NextResponse } from "next/server"

const { auth } = NextAuth(authConfig)

export default auth((req) => {
  const { nextUrl } = req
  const isLoggedIn = !!req.auth

  const isLoginPage = nextUrl.pathname === "/login"
  const isApiAuth = nextUrl.pathname.startsWith("/api/auth")
  const isDebug = nextUrl.pathname.startsWith("/api/debug-")

  if (isApiAuth || isDebug) return NextResponse.next()

  if (isLoginPage) {
    if (isLoggedIn) return NextResponse.redirect(new URL("/customers", nextUrl))
    return NextResponse.next()
  }

  if (!isLoggedIn) {
    // API ルートは 401 を返す（ブラウザリダイレクトしない）
    if (nextUrl.pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    return NextResponse.redirect(new URL("/login", nextUrl))
  }

  return NextResponse.next()
})

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|public/).*)"],
}
