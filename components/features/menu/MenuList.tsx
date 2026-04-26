"use client"

import { useState, useEffect, useCallback } from "react"
import Button from "@/components/ui/Button"
import Modal from "@/components/ui/Modal"
import Input from "@/components/ui/Input"
import Badge from "@/components/ui/Badge"
import Table from "@/components/ui/Table"
import type { MenuItem, MenuItemFormData } from "@/types/menu"
import styles from "./MenuList.module.scss"

const EMPTY_FORM: MenuItemFormData = { name: "", price: 0, durationMin: 0, isActive: true }

// ─── 追加モーダル ────────────────────────────────────────────────────────
function AddModal({
  open, onClose, onSaved,
}: { open: boolean; onClose: () => void; onSaved: () => void }) {
  const [form, setForm] = useState<MenuItemFormData>(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    if (open) { setForm(EMPTY_FORM); setError("") }
  }, [open])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true); setError("")
    const res = await fetch("/api/menu", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    })
    setSaving(false)
    if (!res.ok) { setError("保存に失敗しました"); return }
    onSaved(); onClose()
  }

  return (
    <Modal open={open} onClose={onClose} title="メニュー追加" size="sm">
      <form onSubmit={handleSubmit} className={styles.form}>
        <Input
          label="メニュー名"
          value={form.name}
          onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
          required
          placeholder="例: カット"
        />
        <Input
          label="価格（円）"
          type="number"
          value={form.price || ""}
          onChange={e => setForm(f => ({ ...f, price: Number(e.target.value) }))}
          required
          min={0}
          placeholder="例: 4000"
        />
        <Input
          label="所要時間（分）"
          type="number"
          value={form.durationMin || ""}
          onChange={e => setForm(f => ({ ...f, durationMin: Number(e.target.value) }))}
          required
          min={1}
          placeholder="例: 60"
        />
        <label className={styles.checkLabel}>
          <input
            type="checkbox"
            className={styles.checkbox}
            checked={form.isActive ?? true}
            onChange={e => setForm(f => ({ ...f, isActive: e.target.checked }))}
          />
          有効
        </label>
        {error && <p className={styles.error}>{error}</p>}
        <div className={styles.formActions}>
          <Button type="button" variant="ghost" onClick={onClose}>キャンセル</Button>
          <Button type="submit" loading={saving}>保存</Button>
        </div>
      </form>
    </Modal>
  )
}

// ─── 編集モーダル ────────────────────────────────────────────────────────
function EditModal({
  open, onClose, onSaved, item,
}: { open: boolean; onClose: () => void; onSaved: () => void; item: MenuItem }) {
  const [form, setForm] = useState<MenuItemFormData>({
    name: item.name, price: item.price,
    durationMin: item.durationMin, isActive: item.isActive,
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    setForm({ name: item.name, price: item.price, durationMin: item.durationMin, isActive: item.isActive })
    setError("")
  }, [item])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true); setError("")
    const res = await fetch(`/api/menu/${item.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    })
    setSaving(false)
    if (!res.ok) { setError("更新に失敗しました"); return }
    onSaved(); onClose()
  }

  return (
    <Modal open={open} onClose={onClose} title="メニュー編集" size="sm">
      <form onSubmit={handleSubmit} className={styles.form}>
        <Input
          label="メニュー名"
          value={form.name}
          onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
          required
        />
        <Input
          label="価格（円）"
          type="number"
          value={form.price}
          onChange={e => setForm(f => ({ ...f, price: Number(e.target.value) }))}
          required
          min={0}
        />
        <Input
          label="所要時間（分）"
          type="number"
          value={form.durationMin}
          onChange={e => setForm(f => ({ ...f, durationMin: Number(e.target.value) }))}
          required
          min={1}
        />
        <label className={styles.checkLabel}>
          <input
            type="checkbox"
            className={styles.checkbox}
            checked={form.isActive ?? true}
            onChange={e => setForm(f => ({ ...f, isActive: e.target.checked }))}
          />
          有効
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
function DeleteModal({
  open, onClose, onDeleted, item,
}: { open: boolean; onClose: () => void; onDeleted: () => void; item: MenuItem }) {
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState("")

  async function handleDelete() {
    setDeleting(true); setError("")
    const res = await fetch(`/api/menu/${item.id}`, { method: "DELETE" })
    setDeleting(false)
    if (!res.ok && res.status !== 204) { setError("削除に失敗しました"); return }
    onDeleted(); onClose()
  }

  return (
    <Modal open={open} onClose={onClose} title="メニューの削除" size="sm">
      <div className={styles.deleteContent}>
        <dl className={styles.dl}>
          <div className={styles.dlRow}><dt>メニュー名</dt><dd>{item.name}</dd></div>
          <div className={styles.dlRow}><dt>価格</dt><dd>¥{item.price.toLocaleString()}</dd></div>
          <div className={styles.dlRow}><dt>所要時間</dt><dd>{item.durationMin}分</dd></div>
          <div className={styles.dlRow}>
            <dt>状態</dt>
            <dd>
              <Badge variant={item.isActive ? "success" : "default"}>
                {item.isActive ? "有効" : "無効"}
              </Badge>
            </dd>
          </div>
        </dl>
        <p className={styles.deleteWarning}>
          このメニューを削除しますか？この操作は取り消せません。
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

// ─── メインコンポーネント ────────────────────────────────────────────────
export function MenuList() {
  const [items, setItems] = useState<MenuItem[]>([])
  const [loading, setLoading] = useState(true)
  const [fetchError, setFetchError] = useState("")
  const [addOpen, setAddOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<MenuItem | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<MenuItem | null>(null)

  const fetchItems = useCallback(async () => {
    try {
      const res = await fetch("/api/menu")
      if (!res.ok) {
        setFetchError(`データ取得に失敗しました (${res.status})`)
        return
      }
      setItems(await res.json())
      setFetchError("")
    } catch {
      setFetchError("サーバーに接続できません")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchItems() }, [fetchItems])

  const columns = [
    { key: "name", label: "メニュー名" },
    {
      key: "price", label: "価格", width: "110px",
      render: (row: MenuItem) => `¥${row.price.toLocaleString()}`,
    },
    {
      key: "durationMin", label: "所要時間", width: "100px",
      render: (row: MenuItem) => `${row.durationMin}分`,
    },
    {
      key: "isActive", label: "状態", width: "80px",
      render: (row: MenuItem) => (
        <Badge variant={row.isActive ? "success" : "default"}>
          {row.isActive ? "有効" : "無効"}
        </Badge>
      ),
    },
    {
      key: "actions", label: "", width: "128px",
      render: (row: MenuItem) => (
        <div className={styles.rowActions}>
          <Button
            size="sm" variant="ghost"
            onClick={e => { e.stopPropagation(); setEditTarget(row) }}
          >
            編集
          </Button>
          <Button
            size="sm" variant="ghost"
            onClick={e => { e.stopPropagation(); setDeleteTarget(row) }}
          >
            削除
          </Button>
        </div>
      ),
    },
  ]

  return (
    <>
      <div className={styles.toolbar}>
        <Button onClick={() => setAddOpen(true)}>メニュー追加</Button>
      </div>

      {loading ? (
        <p className={styles.loadingText}>読み込み中...</p>
      ) : fetchError ? (
        <p className={styles.fetchError}>{fetchError}</p>
      ) : (
        <Table columns={columns} data={items} emptyMessage="メニューがありません" />
      )}

      <AddModal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        onSaved={fetchItems}
      />
      {editTarget && (
        <EditModal
          open
          onClose={() => setEditTarget(null)}
          onSaved={fetchItems}
          item={editTarget}
        />
      )}
      {deleteTarget && (
        <DeleteModal
          open
          onClose={() => setDeleteTarget(null)}
          onDeleted={fetchItems}
          item={deleteTarget}
        />
      )}
    </>
  )
}
