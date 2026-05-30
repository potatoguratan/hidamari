"use client"

import { useState, useEffect } from "react"
import {
  DndContext, closestCenter,
  PointerSensor, TouchSensor,
  useSensor, useSensors,
  type DragEndEvent,
} from "@dnd-kit/core"
import {
  SortableContext, verticalListSortingStrategy,
  useSortable, arrayMove,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { MdDragIndicator } from "react-icons/md"
import { HiDotsVertical } from "react-icons/hi"
import Button from "@/components/ui/Button"
import Modal from "@/components/ui/Modal"
import Input from "@/components/ui/Input"
import Badge from "@/components/ui/Badge"
import type { MenuItem, MenuItemFormData, MenuItemType } from "@/types/menu"
import styles from "./MenuList.module.scss"

const EMPTY_FORM: MenuItemFormData = { name: "", price: 0, durationMin: 0, menuType: "TREATMENT", isActive: true }

// ─── 追加モーダル ────────────────────────────────────────────────────────
function AddModal({
  defaultType,
  onClose,
  onSaved,
}: { defaultType: MenuItemType; onClose: () => void; onSaved: () => void }) {
  const [form, setForm] = useState<MenuItemFormData>({ ...EMPTY_FORM, menuType: defaultType })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")

  async function handleSubmit(e: React.SyntheticEvent<HTMLFormElement>) {
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
    <Modal open onClose={onClose} title="メニュー追加" size="sm">
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
        {form.menuType === "TREATMENT" && (
          <Input
            label="所要時間（分）"
            type="number"
            value={form.durationMin || ""}
            onChange={e => setForm(f => ({ ...f, durationMin: Number(e.target.value) }))}
            required
            min={1}
            placeholder="例: 60"
          />
        )}
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

// ─── アクションモーダル ──────────────────────────────────────────────────
function ItemActionModal({
  onClose, onSaved, item,
}: { onClose: () => void; onSaved: () => void; item: MenuItem }) {
  const [mode, setMode] = useState<"edit" | "deleteConfirm">("edit")
  const [form, setForm] = useState<MenuItemFormData>({
    name: item.name, price: item.price,
    durationMin: item.durationMin, menuType: item.menuType, isActive: item.isActive,
  })
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState("")

  async function handleUpdate(e: React.SyntheticEvent<HTMLFormElement>) {
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

  async function handleDelete() {
    setDeleting(true); setError("")
    const res = await fetch(`/api/menu/${item.id}`, { method: "DELETE" })
    setDeleting(false)
    if (!res.ok && res.status !== 204) { setError("削除に失敗しました"); return }
    onSaved(); onClose()
  }

  if (mode === "deleteConfirm") {
    return (
      <Modal open onClose={onClose} title="メニューの削除" size="sm">
        <div className={styles.deleteContent}>
          <dl className={styles.dl}>
            <div className={styles.dlRow}><dt>メニュー名</dt><dd>{item.name}</dd></div>
            <div className={styles.dlRow}><dt>価格</dt><dd>¥{item.price.toLocaleString()}</dd></div>
            <div className={styles.dlRow}><dt>所要時間</dt><dd>{item.durationMin}分</dd></div>
            <div className={styles.dlRow}>
              <dt>状態</dt>
              <dd><Badge variant={item.isActive ? "success" : "default"}>{item.isActive ? "有効" : "無効"}</Badge></dd>
            </div>
          </dl>
          <p className={styles.deleteWarning}>このメニューを削除しますか？この操作は取り消せません。</p>
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
    <Modal open onClose={onClose} title="メニュー編集" size="sm">
      <form onSubmit={handleUpdate} className={styles.form}>
        <div className={styles.field}>
          <label className={styles.fieldLabel}>種類</label>
          <select
            className={styles.select}
            value={form.menuType}
            onChange={e => setForm(f => ({ ...f, menuType: e.target.value as MenuItemType }))}
          >
            <option value="TREATMENT">施術メニュー</option>
            <option value="RETAIL">物販メニュー</option>
          </select>
        </div>
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
        {form.menuType === "TREATMENT" && (
          <Input
            label="所要時間（分）"
            type="number"
            value={form.durationMin}
            onChange={e => setForm(f => ({ ...f, durationMin: Number(e.target.value) }))}
            required
            min={1}
          />
        )}
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

// ─── ドラッグ可能な行 ────────────────────────────────────────────────────
function SortableRow({ item, onAction }: { item: MenuItem; onAction: (item: MenuItem) => void }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: item.id })

  return (
    <tr
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={isDragging ? styles.dragging : undefined}
    >
      <td style={{ width: "44px" }}>
        <span className={styles.dragHandle} {...attributes} {...listeners}>
          <MdDragIndicator />
        </span>
      </td>
      <td>{item.name}</td>
      <td>¥{item.price.toLocaleString()}</td>
      <td>{item.durationMin > 0 ? `${item.durationMin}分` : "—"}</td>
      <td>
        <Badge variant={item.isActive ? "success" : "default"}>
          {item.isActive ? "有効" : "無効"}
        </Badge>
      </td>
      <td style={{ width: "56px" }}>
        <Button
          size="sm" variant="ghost"
          className={styles.dotBtn}
          onClick={e => { e.stopPropagation(); onAction(item) }}
          aria-label="操作メニュー"
        >
          <HiDotsVertical />
        </Button>
      </td>
    </tr>
  )
}

// ─── メインコンポーネント ────────────────────────────────────────────────
export function MenuList() {
  const [items, setItems] = useState<MenuItem[]>([])
  const [activeTab, setActiveTab] = useState<MenuItemType>("TREATMENT")
  const [loading, setLoading] = useState(true)
  const [fetchError, setFetchError] = useState("")
  const [refreshKey, setRefreshKey] = useState(0)
  const [addOpen, setAddOpen] = useState(false)
  const [actionTarget, setActionTarget] = useState<MenuItem | null>(null)

  const refresh = () => setRefreshKey(k => k + 1)

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 8 } }),
  )

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over || active.id === over.id) return

    const visible = items.filter(i => i.menuType === activeTab)
    const oldIndex = visible.findIndex(i => i.id === active.id)
    const newIndex = visible.findIndex(i => i.id === over.id)
    const reordered = arrayMove(visible, oldIndex, newIndex)
    const others = items.filter(i => i.menuType !== activeTab)

    setItems([...others, ...reordered])
    fetch("/api/menu/reorder", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ items: reordered.map((item, idx) => ({ id: item.id, sortOrder: idx })) }),
    }).catch(console.error)
  }

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/menu")
        if (!res.ok) { setFetchError(`データ取得に失敗しました (${res.status})`); return }
        setItems(await res.json())
        setFetchError("")
      } catch {
        setFetchError("サーバーに接続できません")
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [refreshKey])

  const visibleItems = items.filter(i => i.menuType === activeTab)

  return (
    <>
      <div className={styles.tabRow}>
        <div className={styles.tabBar}>
          {(["TREATMENT", "RETAIL"] as MenuItemType[]).map(type => (
            <button
              key={type}
              className={[styles.tab, activeTab === type ? styles.tabActive : ""].join(" ")}
              onClick={() => setActiveTab(type)}
            >
              {type === "TREATMENT" ? "施術メニュー" : "物販メニュー"}
            </button>
          ))}
        </div>
        <Button variant="ghost" onClick={() => setAddOpen(true)}>メニュー追加</Button>
      </div>

      {loading ? (
        <p className={styles.loadingText}>読み込み中...</p>
      ) : fetchError ? (
        <p className={styles.fetchError}>{fetchError}</p>
      ) : (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <div className={styles.dndWrapper}>
            <table className={styles.dndTable}>
              <thead>
                <tr>
                  <th style={{ width: "44px" }} />
                  <th>メニュー名</th>
                  <th style={{ width: "110px" }}>価格</th>
                  <th style={{ width: "100px" }}>所要時間</th>
                  <th style={{ width: "80px" }}>状態</th>
                  <th style={{ width: "56px" }} />
                </tr>
              </thead>
              <tbody>
                <SortableContext items={visibleItems.map(i => i.id)} strategy={verticalListSortingStrategy}>
                  {visibleItems.length === 0 ? (
                    <tr><td colSpan={6} className={styles.emptyCell}>メニューがありません</td></tr>
                  ) : (
                    visibleItems.map(item => (
                      <SortableRow key={item.id} item={item} onAction={setActionTarget} />
                    ))
                  )}
                </SortableContext>
              </tbody>
            </table>
          </div>
        </DndContext>
      )}

      {addOpen && (
        <AddModal
          defaultType={activeTab}
          onClose={() => setAddOpen(false)}
          onSaved={refresh}
        />
      )}
      {actionTarget && (
        <ItemActionModal
          onClose={() => setActionTarget(null)}
          onSaved={refresh}
          item={actionTarget}
        />
      )}
    </>
  )
}
