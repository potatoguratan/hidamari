"use client"

import { useState, useEffect } from "react"
import { Fragment } from "react"
import { HiDotsVertical } from "react-icons/hi"
import Button from "@/components/ui/Button"
import Modal from "@/components/ui/Modal"
import Input from "@/components/ui/Input"
import type { InventoryCategory, InventoryItem, InventoryItemFormData } from "@/types/inventory"
import styles from "./InventoryList.module.scss"

// ─── 追加モーダル ────────────────────────────────────────────────────────
function AddModal({
  categories,
  onClose,
  onSaved,
}: {
  categories: InventoryCategory[]
  onClose: () => void
  onSaved: () => void
}) {
  const [categoryId, setCategoryId] = useState(categories[0]?.id ?? "__new__")
  const [newCategoryName, setNewCategoryName] = useState("")
  const [form, setForm] = useState<Omit<InventoryItemFormData, "categoryId">>({
    name: "",
    quantity: 0,
    unit: "",
    alertThreshold: 0,
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setSaving(true); setError("")

    let resolvedCategoryId = categoryId
    if (categoryId === "__new__") {
      const trimmed = newCategoryName.trim()
      if (!trimmed) { setError("カテゴリ名を入力してください"); setSaving(false); return }
      const catRes = await fetch("/api/inventory/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: trimmed }),
      })
      if (!catRes.ok) { setError("カテゴリの作成に失敗しました"); setSaving(false); return }
      resolvedCategoryId = (await catRes.json()).id
    }

    const res = await fetch("/api/inventory", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, categoryId: resolvedCategoryId }),
    })
    setSaving(false)
    if (!res.ok) { setError("保存に失敗しました"); return }
    onSaved(); onClose()
  }

  return (
    <Modal open onClose={onClose} title="材料追加" size="sm">
      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.field}>
          <label className={styles.fieldLabel}>カテゴリ</label>
          <select
            className={styles.select}
            value={categoryId}
            onChange={e => setCategoryId(e.target.value)}
          >
            {categories.map(cat => (
              <option key={cat.id} value={cat.id}>{cat.name}</option>
            ))}
            <option value="__new__">＋ 新しいカテゴリ</option>
          </select>
        </div>
        {categoryId === "__new__" && (
          <Input
            label="カテゴリ名"
            value={newCategoryName}
            onChange={e => setNewCategoryName(e.target.value)}
            placeholder="例: カラー材"
          />
        )}
        <Input
          label="材料名"
          value={form.name}
          onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
          required
          placeholder="例: アルカリカラー"
        />
        <Input
          label="在庫数"
          type="number"
          value={form.quantity || ""}
          onChange={e => setForm(f => ({ ...f, quantity: Number(e.target.value) }))}
          required
          min={0}
          placeholder="例: 100"
        />
        <Input
          label="単位"
          value={form.unit}
          onChange={e => setForm(f => ({ ...f, unit: e.target.value }))}
          required
          placeholder="例: g"
        />
        <Input
          label="アラート個数"
          type="number"
          value={form.alertThreshold || ""}
          onChange={e => setForm(f => ({ ...f, alertThreshold: Number(e.target.value) }))}
          required
          min={0}
          placeholder="例: 20"
        />
        {error && <p className={styles.error}>{error}</p>}
        <div className={styles.formActions}>
          <Button type="button" variant="ghost" onClick={onClose}>キャンセル</Button>
          <Button type="submit" loading={saving}>追加</Button>
        </div>
      </form>
    </Modal>
  )
}

// ─── アイテムアクションモーダル ────────────────────────────────────────────
function ItemActionModal({
  item,
  onClose,
  onSaved,
}: {
  item: InventoryItem
  onClose: () => void
  onSaved: () => void
}) {
  const [mode, setMode] = useState<"edit" | "deleteConfirm">("edit")
  const [form, setForm] = useState({
    name: item.name,
    quantity: item.quantity,
    alertThreshold: item.alertThreshold,
  })
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState("")

  async function handleUpdate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setSaving(true); setError("")
    const res = await fetch(`/api/inventory/${item.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    })
    setSaving(false)
    if (!res.ok) { setError("更新に失敗しました"); return }
    onSaved(); onClose()
  }

  async function handleDelete() {
    setDeleting(true); setError("")
    const res = await fetch(`/api/inventory/${item.id}`, { method: "DELETE" })
    setDeleting(false)
    if (!res.ok && res.status !== 204) { setError("削除に失敗しました"); return }
    onSaved(); onClose()
  }

  if (mode === "deleteConfirm") {
    return (
      <Modal open onClose={onClose} title="材料の削除" size="sm">
        <div className={styles.deleteContent}>
          <dl className={styles.dl}>
            <div className={styles.dlRow}><dt>材料名</dt><dd>{item.name}</dd></div>
            <div className={styles.dlRow}><dt>在庫数</dt><dd>{item.quantity} {item.unit}</dd></div>
            <div className={styles.dlRow}><dt>アラート個数</dt><dd>{item.alertThreshold} {item.unit}</dd></div>
          </dl>
          <p className={styles.deleteWarning}>この材料を削除しますか？この操作は取り消せません。</p>
          {error && <p className={styles.error}>{error}</p>}
          <div className={styles.formActions}>
            <Button type="button" variant="ghost" onClick={() => { setMode("edit"); setError("") }}>
              戻る
            </Button>
            <Button type="button" variant="danger" loading={deleting} onClick={handleDelete}>
              削除する
            </Button>
          </div>
        </div>
      </Modal>
    )
  }

  return (
    <Modal open onClose={onClose} title={item.name} size="sm">
      <form onSubmit={handleUpdate} className={styles.form}>
        <Input
          label="材料名"
          value={form.name}
          onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
          required
        />
        <Input
          label="在庫数"
          type="number"
          value={form.quantity}
          onChange={e => setForm(f => ({ ...f, quantity: Number(e.target.value) }))}
          required
          min={0}
        />
        <Input
          label="アラート個数"
          type="number"
          value={form.alertThreshold}
          onChange={e => setForm(f => ({ ...f, alertThreshold: Number(e.target.value) }))}
          required
          min={0}
        />
        {error && <p className={styles.error}>{error}</p>}
        <div className={styles.formActionsSpread}>
          <Button type="button" variant="danger" onClick={() => { setMode("deleteConfirm"); setError("") }}>
            削除
          </Button>
          <div className={styles.formActionsRight}>
            <Button type="button" variant="ghost" onClick={onClose}>キャンセル</Button>
            <Button type="submit" loading={saving}>更新</Button>
          </div>
        </div>
      </form>
    </Modal>
  )
}

// ─── メインコンポーネント ────────────────────────────────────────────────
type InventoryListProps = {
  addOpen: boolean
  onAddClose: () => void
}

export function InventoryList({ addOpen, onAddClose }: InventoryListProps) {
  const [categories, setCategories] = useState<InventoryCategory[]>([])
  const [loading, setLoading] = useState(true)
  const [fetchError, setFetchError] = useState("")
  const [refreshKey, setRefreshKey] = useState(0)
  const [actionTarget, setActionTarget] = useState<InventoryItem | null>(null)

  const refresh = () => setRefreshKey(k => k + 1)

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/inventory/categories")
        if (!res.ok) { setFetchError(`データ取得に失敗しました (${res.status})`); return }
        setCategories(await res.json())
        setFetchError("")
      } catch {
        setFetchError("サーバーに接続できません")
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [refreshKey])

  return (
    <>
      {loading ? (
        <p className={styles.loadingText}>読み込み中...</p>
      ) : fetchError ? (
        <p className={styles.fetchError}>{fetchError}</p>
      ) : (
        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>材料名</th>
                <th style={{ width: "130px" }}>在庫数</th>
                <th style={{ width: "56px" }} />
              </tr>
            </thead>
            <tbody>
              {categories.length === 0 ? (
                <tr>
                  <td colSpan={3} className={styles.emptyCell}>材料がありません</td>
                </tr>
              ) : (
                categories.map(cat => (
                  <Fragment key={cat.id}>
                    <tr className={styles.categoryRow}>
                      <td colSpan={3}>{cat.name}</td>
                    </tr>
                    {(cat.items ?? []).length === 0 ? (
                      <tr>
                        <td colSpan={3} className={styles.emptyCatCell}>材料なし</td>
                      </tr>
                    ) : (
                      (cat.items ?? []).map(item => (
                        <tr key={item.id}>
                          <td>{item.name}</td>
                          <td>{item.quantity} {item.unit}</td>
                          <td>
                            <Button
                              size="sm"
                              variant="ghost"
                              className={styles.dotBtn}
                              onClick={e => { e.stopPropagation(); setActionTarget(item) }}
                              aria-label="操作メニュー"
                            >
                              <HiDotsVertical />
                            </Button>
                          </td>
                        </tr>
                      ))
                    )}
                  </Fragment>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {addOpen && (
        <AddModal
          categories={categories}
          onClose={onAddClose}
          onSaved={refresh}
        />
      )}
      {actionTarget && (
        <ItemActionModal
          item={actionTarget}
          onClose={() => setActionTarget(null)}
          onSaved={refresh}
        />
      )}
    </>
  )
}
