"use client"

import { Fragment, useEffect, useState } from "react"
import { HiDotsVertical } from "react-icons/hi"
import Button from "@/components/ui/Button"
import Input from "@/components/ui/Input"
import Modal from "@/components/ui/Modal"
import type { InventoryCategory, InventoryItem, InventoryItemType } from "@/types/inventory"
import styles from "./InventoryList.module.scss"

function AddModal({
  itemType,
  categories,
  onClose,
  onSaved,
}: {
  itemType: InventoryItemType
  categories: InventoryCategory[]
  onClose: () => void
  onSaved: () => void
}) {
  const materialCategories = categories.filter(category => category.name !== "物販")
  const [categoryId, setCategoryId] = useState(materialCategories[0]?.id ?? "__new__")
  const [newCategoryName, setNewCategoryName] = useState("")
  const [name, setName] = useState("")
  const [quantity, setQuantity] = useState(0)
  const [unit, setUnit] = useState("")
  const [alertThreshold, setAlertThreshold] = useState(0)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  const isMaterial = itemType === "MATERIAL"

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSaving(true)
    setError("")

    let resolvedCategoryId = categoryId
    if (isMaterial && categoryId === "__new__") {
      const trimmed = newCategoryName.trim()
      if (!trimmed) {
        setError("カテゴリ名を入力してください")
        setSaving(false)
        return
      }
      const response = await fetch("/api/inventory/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: trimmed }),
      })
      if (!response.ok) {
        setError("カテゴリの作成に失敗しました")
        setSaving(false)
        return
      }
      resolvedCategoryId = (await response.json()).id
    }

    const response = await fetch("/api/inventory", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        itemType,
        categoryId: isMaterial ? resolvedCategoryId : undefined,
        name,
        quantity,
        unit: isMaterial ? unit : "個",
        alertThreshold: isMaterial ? alertThreshold : 0,
      }),
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
    <Modal open onClose={onClose} title={isMaterial ? "材料追加" : "物販追加"} size="sm">
      <form onSubmit={handleSubmit} className={styles.form}>
        {isMaterial && (
          <>
            <div className={styles.field}>
              <label className={styles.fieldLabel}>カテゴリ</label>
              <select className={styles.select} value={categoryId} onChange={event => setCategoryId(event.target.value)}>
                {materialCategories.map(category => <option key={category.id} value={category.id}>{category.name}</option>)}
                <option value="__new__">＋新しいカテゴリ</option>
              </select>
            </div>
            {categoryId === "__new__" && (
              <Input label="カテゴリ名" value={newCategoryName}
                onChange={event => setNewCategoryName(event.target.value)} placeholder="例: カラー剤" />
            )}
          </>
        )}
        <Input label={isMaterial ? "材料名" : "商品名"} value={name}
          onChange={event => setName(event.target.value)} required />
        <Input label="在庫数" type="number" value={quantity || ""}
          onChange={event => setQuantity(Number(event.target.value))} required min={0} />
        {isMaterial && (
          <>
            <Input label="単位" value={unit}
              onChange={event => setUnit(event.target.value)} required placeholder="例: g" />
            <Input label="アラート閾値" type="number" value={alertThreshold || ""}
              onChange={event => setAlertThreshold(Number(event.target.value))} required min={0} />
          </>
        )}
        {error && <p className={styles.error}>{error}</p>}
        <div className={styles.formActions}>
          <Button type="button" variant="ghost" onClick={onClose}>キャンセル</Button>
          <Button type="submit" loading={saving}>追加</Button>
        </div>
      </form>
    </Modal>
  )
}

function ItemActionModal({ item, onClose, onSaved }: {
  item: InventoryItem
  onClose: () => void
  onSaved: () => void
}) {
  const [mode, setMode] = useState<"edit" | "deleteConfirm">("edit")
  const [name, setName] = useState(item.name)
  const [quantity, setQuantity] = useState(item.quantity)
  const [alertThreshold, setAlertThreshold] = useState(item.alertThreshold)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState("")
  const isMaterial = item.itemType === "MATERIAL"

  async function handleUpdate(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSaving(true)
    setError("")
    const response = await fetch(`/api/inventory/${item.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, quantity, alertThreshold, itemType: item.itemType }),
    })
    setSaving(false)
    if (!response.ok) {
      setError("更新に失敗しました")
      return
    }
    onSaved()
    onClose()
  }

  async function handleDelete() {
    setDeleting(true)
    setError("")
    const response = await fetch(`/api/inventory/${item.id}`, { method: "DELETE" })
    setDeleting(false)
    if (!response.ok && response.status !== 204) {
      setError("削除に失敗しました")
      return
    }
    onSaved()
    onClose()
  }

  if (mode === "deleteConfirm") {
    return (
      <Modal open onClose={onClose} title={`${isMaterial ? "材料" : "物販"}の削除`} size="sm">
        <div className={styles.deleteContent}>
          <p className={styles.deleteWarning}>「{item.name}」を削除しますか？この操作は取り消せません。</p>
          {error && <p className={styles.error}>{error}</p>}
          <div className={styles.formActions}>
            <Button type="button" variant="ghost" onClick={() => { setMode("edit"); setError("") }}>戻る</Button>
            <Button type="button" variant="danger" loading={deleting} onClick={handleDelete}>削除する</Button>
          </div>
        </div>
      </Modal>
    )
  }

  return (
    <Modal open onClose={onClose} title={item.name} size="sm">
      <form onSubmit={handleUpdate} className={styles.form}>
        <Input label={isMaterial ? "材料名" : "商品名"} value={name}
          onChange={event => setName(event.target.value)} required />
        <Input label="在庫数" type="number" value={quantity}
          onChange={event => setQuantity(Number(event.target.value))} required min={0} />
        {isMaterial && (
          <Input label="アラート閾値" type="number" value={alertThreshold}
            onChange={event => setAlertThreshold(Number(event.target.value))} required min={0} />
        )}
        {error && <p className={styles.error}>{error}</p>}
        <div className={styles.formActionsSpread}>
          <Button type="button" variant="danger" onClick={() => { setMode("deleteConfirm"); setError("") }}>削除</Button>
          <div className={styles.formActionsRight}>
            <Button type="button" variant="ghost" onClick={onClose}>キャンセル</Button>
            <Button type="submit" loading={saving}>更新</Button>
          </div>
        </div>
      </form>
    </Modal>
  )
}

export function InventoryList() {
  const [viewType, setViewType] = useState<InventoryItemType>("MATERIAL")
  const [categories, setCategories] = useState<InventoryCategory[]>([])
  const [loading, setLoading] = useState(true)
  const [fetchError, setFetchError] = useState("")
  const [refreshKey, setRefreshKey] = useState(0)
  const [addOpen, setAddOpen] = useState(false)
  const [actionTarget, setActionTarget] = useState<InventoryItem | null>(null)
  const refresh = () => setRefreshKey(key => key + 1)

  useEffect(() => {
    async function load() {
      setLoading(true)
      try {
        const response = await fetch("/api/inventory/categories")
        if (!response.ok) {
          setFetchError(`データ取得に失敗しました (${response.status})`)
          return
        }
        setCategories(await response.json())
        setFetchError("")
      } catch {
        setFetchError("サーバーに接続できません")
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [refreshKey])

  const materialCategories = categories
    .map(category => ({ ...category, items: (category.items ?? []).filter(item => item.itemType === "MATERIAL") }))
    .filter(category => category.name !== "物販" && (category.items?.length ?? 0) > 0)
  const retailItems = categories.flatMap(category => category.items ?? []).filter(item => item.itemType === "RETAIL")

  function actionButton(item: InventoryItem) {
    return (
      <Button size="sm" variant="ghost" className={styles.dotBtn}
        onClick={() => setActionTarget(item)} aria-label="操作メニュー">
        <HiDotsVertical />
      </Button>
    )
  }

  return (
    <>
      <div className={styles.toolbar}>
        <div className={styles.toggle}>
          <button className={viewType === "MATERIAL" ? styles.active : ""} onClick={() => setViewType("MATERIAL")}>材料</button>
          <button className={viewType === "RETAIL" ? styles.active : ""} onClick={() => setViewType("RETAIL")}>物販</button>
        </div>
        <Button onClick={() => setAddOpen(true)}>＋追加</Button>
      </div>

      {loading ? <p className={styles.loadingText}>読み込み中...</p> : fetchError ? (
        <p className={styles.fetchError}>{fetchError}</p>
      ) : (
        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr><th>{viewType === "MATERIAL" ? "材料名" : "商品名"}</th><th style={{ width: "130px" }}>在庫数</th><th style={{ width: "56px" }} /></tr>
            </thead>
            <tbody>
              {viewType === "MATERIAL" ? (
                materialCategories.length === 0 ? <tr><td colSpan={3} className={styles.emptyCell}>材料がありません</td></tr> :
                  materialCategories.map(category => (
                    <Fragment key={category.id}>
                      <tr className={styles.categoryRow}><td colSpan={3}>{category.name}</td></tr>
                      {(category.items ?? []).map(item => <tr key={item.id}><td>{item.name}</td><td>{item.quantity} {item.unit}</td><td>{actionButton(item)}</td></tr>)}
                    </Fragment>
                  ))
              ) : (
                retailItems.length === 0 ? <tr><td colSpan={3} className={styles.emptyCell}>物販がありません</td></tr> :
                  retailItems.map(item => <tr key={item.id}><td>{item.name}</td><td>{item.quantity} 個</td><td>{actionButton(item)}</td></tr>)
              )}
            </tbody>
          </table>
        </div>
      )}

      {addOpen && <AddModal itemType={viewType} categories={categories} onClose={() => setAddOpen(false)} onSaved={refresh} />}
      {actionTarget && <ItemActionModal item={actionTarget} onClose={() => setActionTarget(null)} onSaved={refresh} />}
    </>
  )
}
