"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { IoIosArrowForward } from "react-icons/io"
import Button from "@/components/ui/Button"
import Modal from "@/components/ui/Modal"
import Input from "@/components/ui/Input"
import Table from "@/components/ui/Table"
import type { Customer, CustomerFormData } from "@/types/customer"
import styles from "./CustomerList.module.scss"

const EMPTY_FORM: CustomerFormData = {
  name: "", nameKana: "", phone: "", birthday: "", allergies: "", notes: "",
}

// ─── 追加モーダル ────────────────────────────────────────────────────────
function AddModal({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const [form, setForm] = useState<CustomerFormData>(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true); setError("")
    const res = await fetch("/api/customers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    })
    setSaving(false)
    if (!res.ok) { setError("保存に失敗しました"); return }
    onSaved(); onClose()
  }

  return (
    <Modal open onClose={onClose} title="新規顧客登録" size="md">
      <form onSubmit={handleSubmit} className={styles.form}>
        <Input label="氏名" value={form.name}
          onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
          required placeholder="例: 田中 花子" />
        <Input label="ふりがな" value={form.nameKana}
          onChange={e => setForm(f => ({ ...f, nameKana: e.target.value }))}
          required placeholder="例: たなか はなこ" />
        <Input label="電話番号" value={form.phone ?? ""}
          onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
          placeholder="例: 090-1234-5678" />
        <Input label="生年月日" type="date" value={form.birthday ?? ""}
          onChange={e => setForm(f => ({ ...f, birthday: e.target.value }))} />
        <label className={styles.fieldLabel}>
          アレルギー・特記事項
          <textarea className={styles.textarea} value={form.allergies ?? ""}
            onChange={e => setForm(f => ({ ...f, allergies: e.target.value }))}
            placeholder="例: パーマ液アレルギーあり" />
        </label>
        <label className={styles.fieldLabel}>
          備考
          <textarea className={styles.textarea} value={form.notes ?? ""}
            onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
            placeholder="自由記入" />
        </label>
        {error && <p className={styles.error}>{error}</p>}
        <div className={styles.formActions}>
          <Button type="button" variant="ghost" onClick={onClose}>キャンセル</Button>
          <Button type="submit" loading={saving}>登録</Button>
        </div>
      </form>
    </Modal>
  )
}

// ─── メインコンポーネント ────────────────────────────────────────────────
type CustomerListProps = {
  addOpen: boolean
  onAddClose: () => void
}

export function CustomerList({ addOpen, onAddClose }: CustomerListProps) {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [search, setSearch] = useState("")
  const [loading, setLoading] = useState(true)
  const [fetchError, setFetchError] = useState("")
  const [refreshKey, setRefreshKey] = useState(0)

  const refresh = () => setRefreshKey(k => k + 1)

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/customers")
        if (!res.ok) { setFetchError(`データ取得に失敗しました (${res.status})`); return }
        setCustomers(await res.json())
        setFetchError("")
      } catch {
        setFetchError("サーバーに接続できません")
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [refreshKey])

  const filtered = customers.filter(c => {
    if (!search) return true
    const q = search.toLowerCase()
    return (
      c.name.toLowerCase().includes(q) ||
      c.nameKana.includes(q) ||
      (c.phone ?? "").includes(q)
    )
  })

  const columns = [
    { key: "name",     label: "氏名" },
    { key: "nameKana", label: "ふりがな" },
    { key: "phone",    label: "電話番号", width: "160px",
      render: (r: Customer) => r.phone ?? "—" },
    {
      key: "arrow", label: "", width: "56px",
      render: (r: Customer) => (
        <Link href={`/customers/${r.id}`} className={styles.arrowLink} aria-label="詳細を見る">
          <IoIosArrowForward />
        </Link>
      ),
    },
  ]

  return (
    <>
      <div className={styles.toolbar}>
        <div className={styles.searchWrap}>
          <Input
            placeholder="氏名・ふりがな・電話番号で検索"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
      </div>

      {loading ? (
        <p className={styles.loadingText}>読み込み中...</p>
      ) : fetchError ? (
        <p className={styles.fetchError}>{fetchError}</p>
      ) : (
        <Table columns={columns} data={filtered} emptyMessage="顧客が見つかりません" />
      )}

      {addOpen && <AddModal onClose={onAddClose} onSaved={refresh} />}
    </>
  )
}
