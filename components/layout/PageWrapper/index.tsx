import styles from "./PageWrapper.module.scss"

type Props = {
  children: React.ReactNode
}

export default function PageWrapper({ children }: Props) {
  return <main className={styles.main}>{children}</main>
}
