import type { IconType } from "react-icons"
import styles from "./PageHeader.module.scss"

type Props = {
  title: string
  description?: string
  actions?: React.ReactNode
  icon?: IconType
}

export default function PageHeader({ actions }: Props) {
  if (!actions) return null

  return (
    <div className={styles.header}>
      <div className={styles.actions}>{actions}</div>
    </div>
  )
}
