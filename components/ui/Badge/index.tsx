import styles from "./Badge.module.scss"

type Variant = "default" | "success" | "warning" | "danger" | "info"

type Props = {
  children: React.ReactNode
  variant?: Variant
}

export default function Badge({ children, variant = "default" }: Props) {
  return (
    <span className={[styles.badge, styles[variant]].join(" ")}>
      {children}
    </span>
  )
}
