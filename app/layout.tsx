import type { Metadata } from "next"
import "./globals.css"

export const metadata: Metadata = {
  title: "Hidamari - 美容院管理システム",
  description: "スタッフ専用の美容院管理システム",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja">
      <body>{children}</body>
    </html>
  )
}
