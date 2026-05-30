"use client"

import { useState, useEffect, useRef } from "react"
import Button from "@/components/ui/Button"
import type { MenuItem, MenuItemType } from "@/types/menu"
import styles from "./CheckoutPanel.module.scss"

type DiscountType = "none" | "percent" | "yen"

type CartItem = {
  cartId: string
  menuItem: MenuItem
  discountType: DiscountType
  discountValue: number
}

type AddState =
  | { stage: "idle" }
  | { stage: "selectType" }
  | { stage: "selectMenu"; menuType: MenuItemType }

function effectivePrice(item: CartItem): number {
  if (item.discountType === "none" || item.discountValue <= 0) return item.menuItem.price
  if (item.discountType === "percent") {
    return Math.max(0, Math.round(item.menuItem.price * (1 - item.discountValue / 100)))
  }
  return Math.max(0, item.menuItem.price - item.discountValue)
}

const fmt = (n: number) => `¥${n.toLocaleString()}`

export function CheckoutPanel() {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([])
  const [loading, setLoading] = useState(true)
  const [fetchError, setFetchError] = useState("")
  const [cart, setCart] = useState<CartItem[]>([])
  const [addState, setAddState] = useState<AddState>({ stage: "idle" })
  const [view, setView] = useState<"staff" | "customer">("staff")
  const nextCartId = useRef(0)

  useEffect(() => {
    fetch("/api/menu")
      .then(res => (res.ok ? res.json() : Promise.reject(res.status)))
      .then((data: MenuItem[]) => { setMenuItems(data.filter(m => m.isActive)); setLoading(false) })
      .catch(() => { setFetchError("メニューデータを取得できませんでした"); setLoading(false) })
  }, [])

  function addToCart(menuItem: MenuItem) {
    const newItem: CartItem = {
      cartId: String(nextCartId.current++),
      menuItem,
      discountType: "none",
      discountValue: 0,
    }
    setCart(prev => {
      if (menuItem.menuType === "TREATMENT") {
        const lastTreatmentIdx = prev.reduce((max, item, idx) =>
          item.menuItem.menuType === "TREATMENT" ? idx : max, -1)
        const next = [...prev]
        next.splice(lastTreatmentIdx + 1, 0, newItem)
        return next
      }
      return [...prev, newItem]
    })
    setAddState({ stage: "idle" })
  }

  function removeFromCart(cartId: string) {
    setCart(prev => prev.filter(i => i.cartId !== cartId))
  }

  function setDiscount(cartId: string, discountType: DiscountType, discountValue: number) {
    setCart(prev => prev.map(i => i.cartId === cartId ? { ...i, discountType, discountValue } : i))
  }

  const treatmentItems = cart.filter(i => i.menuItem.menuType === "TREATMENT")
  const retailItems = cart.filter(i => i.menuItem.menuType === "RETAIL")
  const total = cart.reduce((s, i) => s + effectivePrice(i), 0)
  const originalTotal = cart.reduce((s, i) => s + i.menuItem.price, 0)
  const hasDiscounts = total !== originalTotal

  const treatmentMenus = menuItems.filter(m => m.menuType === "TREATMENT")
  const retailMenus = menuItems.filter(m => m.menuType === "RETAIL")

  function renderCartGroup(items: CartItem[], label: string) {
    if (items.length === 0) return null
    return (
      <div className={styles.cartSection}>
        <div className={styles.groupHeader}>{label}</div>
        {items.map(item => {
          const ep = effectivePrice(item)
          const discounted = item.discountType !== "none" && item.discountValue > 0
          return (
            <div key={item.cartId} className={styles.cartItem}>
              <span className={styles.colName}>{item.menuItem.name}</span>
              <span className={[styles.colOriginal, !discounted ? styles.colInvisible : ""].join(" ")}>
                {fmt(item.menuItem.price)}
              </span>
              <span className={[styles.colEffective, discounted ? styles.colEffectiveOn : ""].filter(Boolean).join(" ")}>
                {fmt(ep)}
              </span>
              <input
                type="number"
                className={styles.colInput}
                value={item.discountValue || ""}
                min={0}
                max={item.discountType === "percent" ? 100 : item.menuItem.price}
                placeholder=""
                disabled={item.discountType === "none"}
                onChange={e => setDiscount(item.cartId, item.discountType, Number(e.target.value))}
              />
              <select
                className={styles.colSelect}
                value={item.discountType}
                onChange={e => {
                  const t = e.target.value as DiscountType
                  setDiscount(item.cartId, t, t === "none" ? 0 : item.discountValue)
                }}
              >
                <option value="none">割引なし</option>
                <option value="percent">% OFF</option>
                <option value="yen">円 OFF</option>
              </select>
              <button
                className={styles.colRemove}
                onClick={() => removeFromCart(item.cartId)}
                aria-label="削除"
              >×</button>
            </div>
          )
        })}
      </div>
    )
  }

  // ─── お客様ビュー ────────────────────────────────────────────────────────
  if (view === "customer") {
    return (
      <div className={styles.customerView}>
        <div className={styles.customerTopBar}>
          <button className={styles.backBtn} onClick={() => setView("staff")}>
            ← スタッフ画面に戻る
          </button>
        </div>
        <div className={styles.customerLayout}>
          <div className={styles.customerLeft}>
            <p className={styles.customerTotalLabel}>合計</p>
            {hasDiscounts && (
              <p className={styles.customerOriginalTotal}>{fmt(originalTotal)}</p>
            )}
            <p className={styles.customerTotal}>{fmt(total)}</p>
          </div>
          <div className={styles.customerRight}>
            <p className={styles.customerRightTitle}>ご利用メニュー</p>
            <div className={styles.customerItemList}>
              {treatmentItems.length > 0 && (
                <>
                  <p className={styles.customerGroupHeader}>施術メニュー</p>
                  {treatmentItems.map(item => {
                    const ep = effectivePrice(item)
                    const discounted = ep !== item.menuItem.price
                    return (
                      <div key={item.cartId} className={styles.customerItem}>
                        <span className={styles.customerItemName}>{item.menuItem.name}</span>
                        <span className={styles.customerItemPrice}>
                          {discounted && <span className={styles.customerItemBefore}>{fmt(item.menuItem.price)}</span>}
                          <span className={discounted ? styles.customerItemAfterDiscount : styles.customerItemBasePrice}>{fmt(ep)}</span>
                        </span>
                      </div>
                    )
                  })}
                </>
              )}
              {retailItems.length > 0 && (
                <>
                  <p className={styles.customerGroupHeader}>物販メニュー</p>
                  {retailItems.map(item => {
                    const ep = effectivePrice(item)
                    const discounted = ep !== item.menuItem.price
                    return (
                      <div key={item.cartId} className={styles.customerItem}>
                        <span className={styles.customerItemName}>{item.menuItem.name}</span>
                        <span className={styles.customerItemPrice}>
                          {discounted && <span className={styles.customerItemBefore}>{fmt(item.menuItem.price)}</span>}
                          <span className={discounted ? styles.customerItemAfterDiscount : styles.customerItemBasePrice}>{fmt(ep)}</span>
                        </span>
                      </div>
                    )
                  })}
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    )
  }

  // ─── スタッフビュー ──────────────────────────────────────────────────────
  return (
    <div className={styles.staffView}>
      {cart.length > 0 && (
        <div className={styles.staffHeader}>
          <Button variant="ghost" size="sm" onClick={() => { setCart([]); setAddState({ stage: "idle" }) }}>
            リセット
          </Button>
        </div>
      )}

      {renderCartGroup(treatmentItems, "施術メニュー")}
      {renderCartGroup(retailItems, "物販メニュー")}

      {loading && <p className={styles.loadingText}>読み込み中...</p>}
      {fetchError && <p className={styles.fetchError}>{fetchError}</p>}

      {!loading && !fetchError && addState.stage === "idle" && (
        <button className={styles.addBtn} onClick={() => setAddState({ stage: "selectType" })}>
          <span className={styles.addBtnPlus}>＋</span> メニューを追加
        </button>
      )}

      {addState.stage === "selectType" && (
        <div className={styles.selectorPanel}>
          <div className={styles.selectorHeader}>
            <span className={styles.selectorTitle}>種類を選択</span>
            <button className={styles.cancelBtn} onClick={() => setAddState({ stage: "idle" })}>
              キャンセル
            </button>
          </div>
          <div className={styles.typeBtns}>
            <button
              className={styles.typeBtn}
              onClick={() => setAddState({ stage: "selectMenu", menuType: "TREATMENT" })}
            >
              <span className={styles.typeBtnIcon}>✂</span>
              <span>施術メニュー</span>
            </button>
            <button
              className={styles.typeBtn}
              onClick={() => setAddState({ stage: "selectMenu", menuType: "RETAIL" })}
            >
              <span className={styles.typeBtnIcon}>🛍</span>
              <span>物販メニュー</span>
            </button>
          </div>
        </div>
      )}

      {addState.stage === "selectMenu" && (
        <div className={styles.selectorPanel}>
          <div className={styles.selectorHeader}>
            <span className={styles.selectorTitle}>
              {addState.menuType === "TREATMENT" ? "施術メニュー" : "物販メニュー"}
            </span>
            <button className={styles.cancelBtn} onClick={() => setAddState({ stage: "selectType" })}>
              ← 戻る
            </button>
          </div>
          <div className={styles.menuList}>
            {(addState.menuType === "TREATMENT" ? treatmentMenus : retailMenus).length === 0 ? (
              <p className={styles.emptyMenuList}>メニューがありません</p>
            ) : (
              (addState.menuType === "TREATMENT" ? treatmentMenus : retailMenus).map(m => (
                <button key={m.id} className={styles.menuListItem} onClick={() => addToCart(m)}>
                  <span>{m.name}</span>
                  <span className={styles.menuListItemPrice}>{fmt(m.price)}</span>
                </button>
              ))
            )}
          </div>
        </div>
      )}

      {cart.length > 0 && (
        <div className={styles.footer}>
          <div className={styles.footerTotal}>
            <span className={styles.footerTotalLabel}>合計</span>
            <span className={styles.footerTotalAmount}>{fmt(total)}</span>
          </div>
          <Button onClick={() => setView("customer")}>確認</Button>
        </div>
      )}
    </div>
  )
}
