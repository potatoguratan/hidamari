"use client"

import Link from "next/link"
import Image from "next/image"
import { usePathname } from "next/navigation"
import { useEffect, useMemo, useRef, useState } from "react"
import type { CSSProperties, MouseEvent } from "react"
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

type SelectionTransition = {
  from: number
  to: number
  key: number
}

export default function Sidebar() {
  const pathname = usePathname()
  const { sidebarOpen, setSidebarOpen } = useUiStore()
  const activeIndex = useMemo(
    () => NAV_ITEMS.findIndex((item) => pathname.startsWith(item.href)),
    [pathname],
  )
  const [transition, setTransition] = useState<SelectionTransition | null>(null)
  const animationKey = useRef(0)

  useEffect(() => {
    if (!transition) return
    const timer = window.setTimeout(() => setTransition(null), 260)

    return () => window.clearTimeout(timer)
  }, [transition])

  const handleNavClick = (event: MouseEvent<HTMLAnchorElement>, index: number) => {
    if (transition) {
      event.preventDefault()
      return
    }

    if (activeIndex >= 0 && index !== activeIndex) {
      animationKey.current += 1
      setTransition({
        from: activeIndex,
        to: index,
        key: animationKey.current,
      })
    }
    setSidebarOpen(false)
  }

  return (
    <>
      <aside className={[styles.sidebar, sidebarOpen ? styles.open : ""].filter(Boolean).join(" ")}>
        <div className={styles.logo}>
          <Image
            src="/logo.jpg"
            alt="Hidamari"
            width={48}
            height={48}
            className={styles.logoImage}
            priority
          />
        </div>
        <nav className={styles.nav}>
          {transition && (
            <span
              key={transition.key}
              className={styles.movingIndicator}
              style={{
                "--from-index": transition.from,
                "--to-index": transition.to,
              } as CSSProperties}
              aria-hidden
            />
          )}
          {NAV_ITEMS.map((item, index) => {
            const active = pathname.startsWith(item.href)
            return (
              <Link
                key={item.href}
                href={item.href}
                className={[
                  styles.navItem,
                  active ? styles.active : "",
                  active && !transition ? styles.connected : "",
                ].filter(Boolean).join(" ")}
                onClick={(event) => handleNavClick(event, index)}
              >
                <span className={styles.activePlate} aria-hidden />
                <span className={styles.activeConnector} aria-hidden />
                <item.Icon className={styles.icon} aria-hidden />
                <span className={styles.label}>{item.label}</span>
              </Link>
            )
          })}
        </nav>
      </aside>
    </>
  )
}
