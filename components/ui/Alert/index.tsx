import styles from "./Alert.module.scss"

type Variant = "info" | "success" | "warning" | "danger"

type Props = {
  variant?: Variant
  title?: string
  children: React.ReactNode
}

export default function Alert({ variant = "info", title, children }: Props) {
  return (
    <div className={[styles.alert, styles[variant]].join(" ")} role="alert">
      {title && <p className={styles.title}>{title}</p>}
      <div className={styles.body}>{children}</div>
    </div>
  )
}
