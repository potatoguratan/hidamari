import type { IconType } from "react-icons"
import styles from "./PageHeader.module.scss"

type Props = {
  title: string
  description?: string
  actions?: React.ReactNode
  icon?: IconType
}

export default function PageHeader({ title, description, actions, icon: Icon }: Props) {
  return (
    <div className={styles.header}>
      <div className={styles.text}>
        <h1 className={styles.title}>
          {Icon && <Icon className={styles.titleIcon} aria-hidden />}
          <span className={styles.titleText}>{title}</span>
        </h1>
        {description && <p className={styles.description}>{description}</p>}
      </div>
      {actions && <div className={styles.actions}>{actions}</div>}
    </div>
  )
}
