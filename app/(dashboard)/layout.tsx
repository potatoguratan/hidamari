import { auth } from "@/auth"
import { redirect } from "next/navigation"
import Sidebar from "@/components/layout/Sidebar"
import Header from "@/components/layout/Header"
import PageWrapper from "@/components/layout/PageWrapper"
import styles from "./dashboard.module.scss"

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()
  if (!session) redirect("/login")

  return (
    <div className={styles.layout}>
      <Sidebar />
      <div className={styles.content}>
        <Header userName={session.user?.name ?? undefined} />
        <PageWrapper>{children}</PageWrapper>
      </div>
    </div>
  )
}
