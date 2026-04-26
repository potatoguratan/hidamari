"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { IoIosArrowBack } from "react-icons/io"
import Button from "@/components/ui/Button"
import Modal from "@/components/ui/Modal"
import Input from "@/components/ui/Input"
import PageHeader from "@/components/ui/PageHeader"
import { FaRegAddressBook } from "react-icons/fa"
import type { Customer, CustomerFormData } from "@/types/customer"
import styles from "./CustomerDetail.module.scss"

// ─── 編集モーダル ────────────────────────────────────────────────────────
function EditModal({ customer, onClose, onSaved }: {
  customer: Customer; onClose: () => void; onSaved: () => void
}) {
  const [form, setForm] = useState<CustomerFormData>({
    name:      customer.name,
    nameKana:  customer.nameKana,
    phone:     customer.phone     ?? "",
    birthday:  customer.birthday  ? customer.birthday.slice(0, 10) : "",
    allergies: customer.allergies ?? "",
    notes:     customer.notes     ?? "",
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true); setError("")
    const res = await fetch(`/api/customers/${customer.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    })
    setSaving(false)
    if (!res.ok) { setError("更新に失敗しました"); return }
    onSaved(); onClose()
  }

  return (
    <Modal open onClose={onClose} title="顧客情報編集" size="md">
      <form onSubmit={handleSubmit} className={styles.form}>
        <Input label="氏名" value={form.name}
          onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required />
        <Input label="ふりがな" value={form.nameKana}
          onChange={e => setForm(f => ({ ...f, nameKana: e.target.value }))} required />
        <Input label="電話番号" value={form.phone ?? ""}
          onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} />
        <Input label="生年月日" type="date" value={form.birthday ?? ""}
          onChange={e => setForm(f => ({ ...f, birthday: e.target.value }))} />
        <label className={styles.fieldLabel}>
          アレルギー・特記事項
          <textarea className={styles.textarea} value={form.allergies ?? ""}
            onChange={e => setForm(f => ({ ...f, allergies: e.target.value }))} />
        </label>
        <label className={styles.fieldLabel}>
          備考
          <textarea className={styles.textarea} value={form.notes ?? ""}
            onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
        </label>
        {error && <p className={styles.error}>{error}</p>}
        <div className={styles.formActions}>
          <Button type="button" variant="ghost" onClick={onClose}>キャンセル</Button>
          <Button type="submit" loading={saving}>更新</Button>
        </div>
      </form>
    </Modal>
  )
}

// ─── 削除確認モーダル ────────────────────────────────────────────────────
function DeleteModal({ customer, onClose, onDeleted }: {
  customer: Customer; onClose: () => void; onDeleted: () => void
}) {
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState("")

  async function handleDelete() {
    setDeleting(true); setError("")
    const res = await fetch(`/api/customers/${customer.id}`, { method: "DELETE" })
    setDeleting(false)
    if (!res.ok && res.status !== 204) { setError("削除に失敗しました"); return }
    onDeleted()
  }

  return (
    <Modal open onClose={onClose} title="顧客の削除" size="sm">
      <div className={styles.deleteContent}>
        <p className={styles.deleteWarning}>
          「{customer.name}」を削除しますか？施術履歴も含めてすべて削除されます。この操作は取り消せません。
        </p>
        {error && <p className={styles.error}>{error}</p>}
        <div className={styles.formActions}>
          <Button type="button" variant="ghost" onClick={onClose}>キャンセル</Button>
          <Button type="button" variant="danger" loading={deleting} onClick={handleDelete}>
            削除する
          </Button>
        </div>
      </div>
    </Modal>
  )
}

// ─── 情報行 ──────────────────────────────────────────────────────────────
function InfoRow({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div className={styles.infoRow}>
      <span className={styles.infoLabel}>{label}</span>
      {value
        ? <span className={styles.infoValue}>{value}</span>
        : <span className={styles.infoValueEmpty}>—</span>
      }
    </div>
  )
}

function formatBirthday(iso: string | null): string | null {
  if (!iso) return null
  const d = new Date(iso)
  return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日`
}

// ─── メインコンポーネント ────────────────────────────────────────────────
type Props = { id: string }

export function CustomerDetail({ id }: Props) {
  const router = useRouter()
  const [customer, setCustomer] = useState<Customer | null>(null)
  const [loading, setLoading] = useState(true)
  const [fetchError, setFetchError] = useState("")
  const [editOpen, setEditOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/customers/${id}`)
        if (!res.ok) { setFetchError("顧客情報の取得に失敗しました"); return }
        setCustomer(await res.json())
      } catch {
        setFetchError("サーバーに接続できません")
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [id])

  if (loading) return <p className={styles.loadingText}>読み込み中...</p>
  if (fetchError) return <p className={styles.fetchError}>{fetchError}</p>
  if (!customer)  return <p className={styles.fetchError}>顧客が見つかりません</p>

  return (
    <>
      <Link href="/customers" className={styles.backLink}>
        <IoIosArrowBack /> 顧客一覧に戻る
      </Link>

      <PageHeader
        title={customer.name}
        description={customer.nameKana}
        icon={FaRegAddressBook}
        actions={
          <>
            <Button variant="ghost" onClick={() => setEditOpen(true)}>編集</Button>
            <Button variant="danger" onClick={() => setDeleteOpen(true)}>削除</Button>
          </>
        }
      />

      {/* 顧客情報カード */}
      <div className={styles.infoCard}>
        <div className={styles.infoGrid}>
          <InfoRow label="電話番号"       value={customer.phone} />
          <InfoRow label="生年月日"       value={formatBirthday(customer.birthday)} />
          <InfoRow label="アレルギー・特記事項" value={customer.allergies} />
          <InfoRow label="備考"           value={customer.notes} />
        </div>
      </div>

      {/* 施術履歴 */}
      <div className={styles.section}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>施術履歴</h2>
        </div>
        <div className={styles.placeholder}>
          施術履歴は今後実装予定です
        </div>
      </div>

      {editOpen && (
        <EditModal
          customer={customer}
          onClose={() => setEditOpen(false)}
          onSaved={() => {
            setEditOpen(false)
            // 最新情報を再取得
            fetch(`/api/customers/${id}`)
              .then(r => r.json())
              .then(setCustomer)
              .catch(() => {})
          }}
        />
      )}
      {deleteOpen && (
        <DeleteModal
          customer={customer}
          onClose={() => setDeleteOpen(false)}
          onDeleted={() => router.push("/customers")}
        />
      )}
    </>
  )
}
