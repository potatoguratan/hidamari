"use client"

import { useState } from "react"
import { signIn } from "next-auth/react"
import { useRouter } from "next/navigation"
import Button from "@/components/ui/Button"
import Input from "@/components/ui/Input"
import styles from "./login.module.scss"

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError("")
    setLoading(true)

    const res = await signIn("credentials", {
      email,
      password,
      redirect: false,
    })

    setLoading(false)

    if (res?.error) {
      setError("メールアドレスまたはパスワードが正しくありません")
    } else {
      router.push("/customers")
    }
  }

  return (
    <div className={styles.card}>
      <h1 className={styles.title}>Hidamari</h1>
      <p className={styles.subtitle}>スタッフログイン</p>

      <form onSubmit={handleSubmit} className={styles.form}>
        <Input
          label="メールアドレス"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          autoComplete="email"
          autoFocus
        />
        <Input
          label="パスワード"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          autoComplete="current-password"
        />
        {error && <p className={styles.error}>{error}</p>}
        <Button type="submit" fullWidth loading={loading}>
          ログイン
        </Button>
      </form>
    </div>
  )
}
