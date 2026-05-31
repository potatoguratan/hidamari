"use client"

import { useState, useEffect, useRef } from "react"
import Button from "@/components/ui/Button"
import Input from "@/components/ui/Input"
import type { Customer } from "@/types/customer"
import type { MenuItem, MenuItemType } from "@/types/menu"
import type { Reservation } from "@/types/reservation"
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
const formatReservation = (reservation: Reservation) => {
  const date = new Date(reservation.startTime)
  return `${date.toLocaleTimeString("ja-JP", { hour: "2-digit", minute: "2-digit" })} / ${reservation.customer.name}`
}
const todayKey = () => {
  const today = new Date()
  return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`
}
const dateKey = (value: string) => {
  const date = new Date(value)
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`
}

export function CheckoutPanel({ initialReservationId }: { initialReservationId?: string }) {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([])
  const [customers, setCustomers] = useState<Customer[]>([])
  const [reservations, setReservations] = useState<Reservation[]>([])
  const [loading, setLoading] = useState(true)
  const [fetchError, setFetchError] = useState("")
  const [cart, setCart] = useState<CartItem[]>([])
  const [addState, setAddState] = useState<AddState>({ stage: "idle" })
  const [view, setView] = useState<"staff" | "customer">("staff")
  const [checkoutMode, setCheckoutMode] = useState<"reservation" | "other">("reservation")
  const [reservationDate, setReservationDate] = useState(todayKey)
  const [reservationId, setReservationId] = useState("")
  const [customerId, setCustomerId] = useState("")
  const [customerSearch, setCustomerSearch] = useState("")
  const [saving, setSaving] = useState(false)
  const [checkoutError, setCheckoutError] = useState("")
  const [completed, setCompleted] = useState(false)
  const nextCartId = useRef(0)

  useEffect(() => {
    Promise.all([
      fetch("/api/menu").then(res => res.ok ? res.json() : Promise.reject(res.status)),
      fetch("/api/customers").then(res => res.ok ? res.json() : Promise.reject(res.status)),
      fetch("/api/reservations").then(res => res.ok ? res.json() : Promise.reject(res.status)),
    ])
      .then(([menus, customerData, reservationData]: [MenuItem[], Customer[], Reservation[]]) => {
        setMenuItems(menus.filter(menu => menu.isActive))
        setCustomers(customerData)
        setReservations(reservationData)
        const initialReservation = reservationData.find(reservation => reservation.id === initialReservationId)
        if (initialReservation) {
          setReservationDate(dateKey(initialReservation.startTime))
          setReservationId(initialReservation.id)
          setCustomerId(initialReservation.customerId)
          setCart(initialReservation.menuItems.map(item => createCartItem(item.menuItem)))
        }
        setLoading(false)
      })
      .catch(() => { setFetchError("メニューデータを取得できませんでした"); setLoading(false) })
  }, [initialReservationId])

  function createCartItem(menuItem: MenuItem): CartItem {
    return {
      cartId: String(nextCartId.current++),
      menuItem,
      discountType: "none",
      discountValue: 0,
    }
  }

  function addToCart(menuItem: MenuItem) {
    const newItem = createCartItem(menuItem)
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

  function selectReservation(id: string) {
    setReservationId(id)
    const reservation = reservations.find(item => item.id === id)
    if (!reservation) {
      setCustomerId("")
      setCart([])
      return
    }
    setCustomerId(reservation.customerId)
    setCart(reservation.menuItems.map(item => createCartItem(item.menuItem)))
    setAddState({ stage: "idle" })
    setCheckoutError("")
  }

  function changeReservationDate(value: string) {
    setReservationDate(value)
    setReservationId("")
    setCustomerId("")
    setCart([])
    setAddState({ stage: "idle" })
    setCheckoutError("")
  }

  function changeMode(mode: "reservation" | "other") {
    setCheckoutMode(mode)
    setReservationId("")
    setCustomerId("")
    setCart([])
    setAddState({ stage: "idle" })
    setCheckoutError("")
  }

  function startAddingMenu() {
    if (checkoutMode === "reservation" && !reservationId) {
      setCheckoutError("予約を選択してください")
      return
    }
    setCheckoutError("")
    setAddState({ stage: "selectType" })
  }

  function showCustomerView() {
    if (cart.length === 0) {
      setCheckoutError("メニューを追加してください")
      return
    }
    setCheckoutError("")
    setView("customer")
  }

  async function completeCheckout() {
    if (cart.length === 0) {
      setCheckoutError("メニューを追加してください")
      return
    }
    if (checkoutMode === "reservation" && !customerId) {
      setCheckoutError("顧客を選択してください")
      return
    }
    setSaving(true)
    setCheckoutError("")
    try {
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerId: customerId || null,
          reservationId: checkoutMode === "reservation" ? reservationId : null,
          menuItems: cart.map(item => ({ menuItemId: item.menuItem.id, price: effectivePrice(item) })),
        }),
      })
      if (!response.ok) {
        setCheckoutError("会計の保存に失敗しました")
        return
      }
      setCompleted(true)
    } catch {
      setCheckoutError("会計の保存に失敗しました")
    } finally {
      setSaving(false)
    }
  }

  const treatmentItems = cart.filter(i => i.menuItem.menuType === "TREATMENT")
  const retailItems = cart.filter(i => i.menuItem.menuType === "RETAIL")
  const total = cart.reduce((s, i) => s + effectivePrice(i), 0)
  const originalTotal = cart.reduce((s, i) => s + i.menuItem.price, 0)
  const hasDiscounts = total !== originalTotal

  const treatmentMenus = menuItems.filter(m => m.menuType === "TREATMENT")
  const retailMenus = menuItems.filter(m => m.menuType === "RETAIL")
  const filteredReservations = reservations
    .filter(reservation => dateKey(reservation.startTime) === reservationDate)
    .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())
  const filteredCustomers = customers.filter(customer => {
    const query = customerSearch.trim().toLocaleLowerCase()
    if (!query) return true
    return [customer.name, customer.nameKana, customer.phone, customer.email]
      .some(value => value?.toLocaleLowerCase().includes(query))
  })
  const selectedCustomer = customers.find(customer => customer.id === customerId)

  function resetCheckout() {
    setCart([])
    setReservationId("")
    setReservationDate(todayKey())
    setCustomerId("")
    setCustomerSearch("")
    setAddState({ stage: "idle" })
    setCheckoutError("")
    setCompleted(false)
    setView("staff")
  }

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
    if (completed) {
      return (
        <div className={styles.customerView}>
          <div className={styles.completedView}>
            <p>会計を保存しました</p>
            <strong>{fmt(total)}</strong>
            <Button onClick={resetCheckout}>次の会計へ</Button>
          </div>
        </div>
      )
    }

    return (
      <div className={styles.customerView}>
        <div className={styles.customerTopBar}>
          <button className={styles.backBtn} onClick={() => setView("staff")}>
            ← スタッフ画面に戻る
          </button>
          <div className={styles.customerTopActions}>
            {checkoutError && <span className={styles.checkoutError}>{checkoutError}</span>}
            <Button loading={saving} onClick={completeCheckout}>会計を確定</Button>
          </div>
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
      <section className={styles.checkoutSource}>
        <div className={styles.modeToggle}>
          <button
            type="button"
            className={checkoutMode === "reservation" ? styles.modeActive : ""}
            onClick={() => changeMode("reservation")}
          >
            予約会計
          </button>
          <button
            type="button"
            className={checkoutMode === "other" ? styles.modeActive : ""}
            onClick={() => changeMode("other")}
          >
            通常会計
          </button>
        </div>

        {checkoutMode === "reservation" ? (
          <div className={styles.reservationSelector}>
            <Input
              label="予約日"
              type="date"
              value={reservationDate}
              onChange={event => changeReservationDate(event.target.value)}
            />
            <label className={styles.sourceField}>
              <span>予約を選択</span>
              <select value={reservationId} onChange={event => selectReservation(event.target.value)}>
                <option value="">{filteredReservations.length === 0 ? "この日の予約はありません" : "選択してください"}</option>
                {filteredReservations.map(reservation => (
                  <option key={reservation.id} value={reservation.id}>
                    {formatReservation(reservation)}
                  </option>
                ))}
              </select>
            </label>
          </div>
        ) : (
          <div className={styles.customerSelector}>
            <Input
              label="顧客検索"
              type="search"
              value={customerSearch}
              placeholder="氏名・ふりがな・電話番号・メールアドレス"
              onChange={event => setCustomerSearch(event.target.value)}
            />
            <label className={styles.sourceField}>
              <span>顧客を選択</span>
              <select value={customerId} onChange={event => setCustomerId(event.target.value)}>
                <option value="">選択してください</option>
                {filteredCustomers.map(customer => (
                  <option key={customer.id} value={customer.id}>
                    {customer.name}（{customer.nameKana}）
                  </option>
                ))}
                {filteredCustomers.length === 0 && <option disabled>該当する顧客が見つかりません</option>}
              </select>
            </label>
          </div>
        )}

        {selectedCustomer && <p className={styles.selectedCustomer}>顧客: {selectedCustomer.name}</p>}
      </section>

      {cart.length > 0 && (
        <div className={styles.staffHeader}>
          <Button variant="ghost" size="sm" onClick={resetCheckout}>
            リセット
          </Button>
        </div>
      )}

      {renderCartGroup(treatmentItems, "施術メニュー")}
      {renderCartGroup(retailItems, "物販メニュー")}

      {loading && <p className={styles.loadingText}>読み込み中...</p>}
      {fetchError && <p className={styles.fetchError}>{fetchError}</p>}
      {checkoutError && <p className={styles.checkoutError}>{checkoutError}</p>}

      {!loading && !fetchError && addState.stage === "idle" && (
        <button className={styles.addBtn} onClick={startAddingMenu}>
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

      {!loading && !fetchError && (
        <div className={styles.footer}>
          <div className={styles.footerTotal}>
            <span className={styles.footerTotalLabel}>合計</span>
            <span className={styles.footerTotalAmount}>{fmt(total)}</span>
          </div>
          <Button onClick={showCustomerView}>確認</Button>
        </div>
      )}
    </div>
  )
}
