import type { InputHTMLAttributes } from "react"
import styles from "./Input.module.scss"

type Props = InputHTMLAttributes<HTMLInputElement> & {
  label?: string
  error?: string
  hint?: string
}

export default function Input({
  label,
  error,
  hint,
  id,
  className = "",
  ...props
}: Props) {
  const inputId = id ?? label?.replace(/\s+/g, "-").toLowerCase()

  return (
    <div className={[styles.wrapper, className].filter(Boolean).join(" ")}>
      {label && (
        <label htmlFor={inputId} className={styles.label}>
          {label}
          {props.required && <span className={styles.required}>*</span>}
        </label>
      )}
      <input
        id={inputId}
        className={[styles.input, error ? styles.hasError : ""].filter(Boolean).join(" ")}
        {...props}
      />
      {error && <p className={styles.error}>{error}</p>}
      {hint && !error && <p className={styles.hint}>{hint}</p>}
    </div>
  )
}
