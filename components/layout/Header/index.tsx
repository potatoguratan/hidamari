"use client"

import { useUiStore } from "@/store"
import { signOut } from "next-auth/react"
import styles from "./Header.module.scss"

type Props = {
  userName?: string
}

export default function Header({ userName }: Props) {
  const toggleSidebar = useUiStore((s) => s.toggleSidebar)

  return (
    <header className={styles.header}>
      <button
        className={styles.menuBtn}
        onClick={toggleSidebar}
        aria-label="メニューを開く"
      >
        <span className={styles.menuIcon} />
        <span className={styles.menuIcon} />
        <span className={styles.menuIcon} />
      </button>

      <div className={styles.right}>
        {userName && <span className={styles.userName}>{userName}</span>}
        <button
          className={styles.logoutBtn}
          onClick={() => signOut({ callbackUrl: "/login" })}
        >
          ログアウト
        </button>
      </div>
    </header>
  )
}
