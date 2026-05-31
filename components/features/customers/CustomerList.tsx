"use client"

import { useEffect, useRef, useState } from "react"
import Button from "@/components/ui/Button"
import Input from "@/components/ui/Input"
import Modal from "@/components/ui/Modal"
import type { Customer, CustomerFormData } from "@/types/customer"
import { CustomerDetail } from "./CustomerDetail"
import styles from "./CustomerList.module.scss"

const EMPTY_FORM: CustomerFormData = {
  name: "", nameKana: "", phone: "", birthday: "", allergies: "", notes: "",
}

function AddModal({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const [form, setForm] = useState<CustomerFormData>(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    setSaving(true)
    setError("")
    const response = await fetch("/api/customers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    })
    setSaving(false)
    if (!response.ok) {
      setError("保存に失敗しました")
      return
    }
    onSaved()
    onClose()
  }

  return (
    <Modal open onClose={onClose} title="新規顧客登録" size="md">
      <form onSubmit={handleSubmit} className={styles.form}>
        <Input label="氏名" value={form.name}
          onChange={event => setForm(current => ({ ...current, name: event.target.value }))}
          required placeholder="例: 田中 花子" />
        <Input label="ふりがな" value={form.nameKana}
          onChange={event => setForm(current => ({ ...current, nameKana: event.target.value }))}
          required placeholder="例: たなか はなこ" />
        <Input label="電話番号" value={form.phone ?? ""}
          onChange={event => setForm(current => ({ ...current, phone: event.target.value }))}
          placeholder="例: 090-1234-5678" />
        <Input label="生年月日" type="date" value={form.birthday ?? ""}
          onChange={event => setForm(current => ({ ...current, birthday: event.target.value }))} />
        <label className={styles.fieldLabel}>
          アレルギー・特記事項
          <textarea className={styles.textarea} value={form.allergies ?? ""}
            onChange={event => setForm(current => ({ ...current, allergies: event.target.value }))}
            placeholder="例: パーマ液アレルギーあり" />
        </label>
        <label className={styles.fieldLabel}>
          メモ
          <textarea className={styles.textarea} value={form.notes ?? ""}
            onChange={event => setForm(current => ({ ...current, notes: event.target.value }))}
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

type CustomerListProps = {
  addOpen: boolean
  onAddOpen: () => void
  onAddClose: () => void
}

export function CustomerList({ addOpen, onAddOpen, onAddClose }: CustomerListProps) {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [search, setSearch] = useState("")
  const [selectedId, setSelectedId] = useState("")
  const [detailId, setDetailId] = useState("")
  const [detailExiting, setDetailExiting] = useState(false)
  const [loading, setLoading] = useState(true)
  const [fetchError, setFetchError] = useState("")
  const [refreshKey, setRefreshKey] = useState(0)
  const detailTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const refresh = () => setRefreshKey(key => key + 1)

  useEffect(() => {
    async function load() {
      setLoading(true)
      try {
        const response = await fetch("/api/customers")
        if (!response.ok) {
          setFetchError(`データ取得に失敗しました (${response.status})`)
          return
        }
        const data: Customer[] = await response.json()
        setCustomers(data)
        setSelectedId(current => {
          const nextId = data.some(customer => customer.id === current) ? current : (data[0]?.id ?? "")
          setDetailId(detail => data.some(customer => customer.id === detail) ? detail : nextId)
          return nextId
        })
        setFetchError("")
      } catch {
        setFetchError("サーバーに接続できません")
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [refreshKey])

  useEffect(() => () => {
    if (detailTimer.current) clearTimeout(detailTimer.current)
  }, [])

  function selectCustomer(id: string) {
    if (id === selectedId) return
    setSelectedId(id)
    setDetailExiting(true)
    if (detailTimer.current) clearTimeout(detailTimer.current)
    detailTimer.current = setTimeout(() => {
      setDetailId(id)
      setDetailExiting(false)
    }, 150)
  }

  const filtered = customers.filter(customer => {
    if (!search) return true
    const query = search.toLocaleLowerCase()
    return (
      customer.name.toLocaleLowerCase().includes(query) ||
      customer.nameKana.toLocaleLowerCase().includes(query) ||
      (customer.phone ?? "").includes(query)
    )
  })

  return (
    <>
      <div className={styles.toolbar}>
        <div className={styles.searchWrap}>
          <Input
            placeholder="氏名・ふりがな・電話番号で検索"
            value={search}
            onChange={event => setSearch(event.target.value)}
          />
        </div>
        <Button onClick={onAddOpen}>新規顧客登録</Button>
      </div>

      <div className={styles.workspace}>
        <section className={styles.listPanel}>
          <div className={styles.listHeader}>
            <span>顧客一覧</span>
            <small>{filtered.length}件</small>
          </div>
          {loading ? (
            <p className={styles.loadingText}>読み込み中...</p>
          ) : fetchError ? (
            <p className={styles.fetchError}>{fetchError}</p>
          ) : filtered.length === 0 ? (
            <p className={styles.empty}>顧客が見つかりません</p>
          ) : (
            <div className={styles.customerRows}>
              {filtered.map(customer => (
                <button
                  key={customer.id}
                  type="button"
                  className={[styles.customerRow, selectedId === customer.id ? styles.selected : ""].filter(Boolean).join(" ")}
                  onClick={() => selectCustomer(customer.id)}
                >
                  <strong>{customer.name}</strong>
                  <span>{customer.nameKana}</span>
                  <small>{customer.phone ?? "—"}</small>
                </button>
              ))}
            </div>
          )}
        </section>

        <section className={styles.detailPanel}>
          {detailId ? (
            <div
              key={detailId}
              className={[styles.detailTransition, detailExiting ? styles.detailExit : styles.detailEnter].join(" ")}
            >
              <CustomerDetail
                id={detailId}
                embedded
                onUpdated={refresh}
                onDeleted={() => {
                  setSelectedId("")
                  setDetailId("")
                  refresh()
                }}
              />
            </div>
          ) : (
            <p className={styles.emptyDetail}>左の一覧から顧客を選択してください</p>
          )}
        </section>
      </div>

      {addOpen && <AddModal onClose={onAddClose} onSaved={refresh} />}
    </>
  )
}
