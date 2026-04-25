"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useUiStore } from "@/store"
import { FaRegCalendarAlt, FaRegAddressBook, FaRegChartBar } from "react-icons/fa"
import { PiBookOpenText } from "react-icons/pi"
import { MdOutlineInventory } from "react-icons/md"
import { AiOutlinePayCircle } from "react-icons/ai"
import type { IconType } from "react-icons"
import styles from "./Sidebar.module.scss"

const NAV_ITEMS: { href: string; label: string; Icon: IconType }[] = [
  { href: "/reservations", label: "予約管理",    Icon: FaRegCalendarAlt },
  { href: "/customers",    label: "顧客管理",    Icon: FaRegAddressBook },
  { href: "/sales",        label: "売上管理",    Icon: FaRegChartBar },
  { href: "/menu",         label: "メニュー管理", Icon: PiBookOpenText },
  { href: "/inventory",    label: "在庫管理",    Icon: MdOutlineInventory },
  { href: "/checkout",     label: "会計",        Icon: AiOutlinePayCircle },
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
                <item.Icon className={styles.icon} aria-hidden />
                <span>{item.label}</span>
              </Link>
            )
          })}
        </nav>
      </aside>
    </>
  )
}
