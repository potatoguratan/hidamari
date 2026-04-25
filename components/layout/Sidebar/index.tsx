"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useUiStore } from "@/store"
import styles from "./Sidebar.module.scss"

const NAV_ITEMS = [
  { href: "/reservations", label: "予約管理",   icon: "📅" },
  { href: "/customers",    label: "顧客管理",   icon: "👤" },
  { href: "/sales",        label: "売上管理",   icon: "📊" },
  { href: "/menu",         label: "メニュー管理", icon: "✂️" },
  { href: "/inventory",    label: "在庫管理",   icon: "📦" },
  { href: "/checkout",     label: "会計",       icon: "💴" },
]

export default function Sidebar() {
  const pathname = usePathname()
  const { sidebarOpen, setSidebarOpen } = useUiStore()

  return (
    <>
      {sidebarOpen && (
        <div
          className={styles.overlay}
          onClick={() => setSidebarOpen(false)}
          aria-hidden
        />
      )}
      <aside className={[styles.sidebar, sidebarOpen ? styles.open : ""].filter(Boolean).join(" ")}>
        <div className={styles.logo}>
          <span className={styles.logoText}>Hidamari</span>
        </div>
        <nav className={styles.nav}>
          {NAV_ITEMS.map((item) => {
            const active = pathname.startsWith(item.href)
            return (
              <Link
                key={item.href}
                href={item.href}
                className={[styles.navItem, active ? styles.active : ""].filter(Boolean).join(" ")}
                onClick={() => setSidebarOpen(false)}
              >
                <span className={styles.icon} aria-hidden>{item.icon}</span>
                <span>{item.label}</span>
              </Link>
            )
          })}
        </nav>
      </aside>
    </>
  )
}
