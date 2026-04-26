# Hidamari 美容院管理システム 仕様書

## システム概要

スタッフ専用の美容院管理システム。顧客管理・予約・在庫・売上・会計をひとつのブラウザアプリで完結させ、素早い操作を最優先に設計する。

- **対象ユーザー**: 店舗スタッフのみ（認証必須・外部公開なし）
- **動作環境**: PC / タブレット / スマホ対応
- **ローカル環境**: Prisma (PostgreSQL)
- **本番環境**: Supabase (PostgreSQL)

---

## カラーパレット

| 用途 | カラーコード |
|------|------------|
| メイン (水色) | `#5dc1cf` |
| アクセント (ベージュ) | `#ffdeaa` |
| 背景 | `#f0f0f0` |
| ブラウン | `#bf8e68` |

---

## デフォルトメニュー

| メニュー名 | 価格 | 所要時間 |
|-----------|------|---------|
| カット | ¥4,000 | 60分 |
| フロントカット | ¥2,000 | 30分 |
| カラー | ¥6,000 | 90分 |
| ブリーチ（1回） | ¥5,000 | 90分 |
| ハイライト | ¥4,000 | 60分 |
| インナーカラー | ¥3,000 | 60分 |
| パーマ | ¥6,000 | 90分 |
| デジタルパーマ | ¥5,000 | 90分 |
| トリートメント | ¥1,500 | 15分 |
| 縮毛矯正 | ¥8,000 | 210分 |

---

## 機能一覧

### 1. 顧客管理 (Customer Management)

- 顧客一覧・検索（名前・ふりがな・電話番号）
- カルテ詳細表示（顧客情報 + 過去の施術履歴）
- カルテ追加・編集・削除
- 会計完了時に施術履歴へ自動追加
- PDF 印刷（カルテ単票）

**顧客情報フィールド:**
- 氏名（漢字・ふりがな）
- 電話番号
- メールアドレス
- 生年月日
- アレルギー・特記事項
- 担当スタッフ

### 2. メニュー管理 (Menu Management)

- メニュー一覧表示
- 追加・編集・削除
- 有効/無効の切り替え（一時的に非表示にできる）

**メニュー項目フィールド:**
- メニュー名
- 価格（円）
- 所要時間（分）
- 有効フラグ

### 3. 予約管理 (Reservation Management)

- 月単位カレンダー表示（Google カレンダー風）
- 任意の日付をクリック → 当日の時間別予約一覧
- 予約の追加・編集・キャンセル
- 予約内容: 顧客・メニュー（複数）・開始時刻・終了時刻・備考
- ダブルブッキング検出（同時刻の重複を警告）
- PDF 印刷（日別予約表）

**予約ステータス:**
- 予約確定 / キャンセル / 完了

### 4. 在庫管理 (Inventory Management)

- カテゴリ別在庫一覧（カラー材・薬剤・その他）
- カテゴリの追加・編集・削除
- 在庫アイテムの追加・編集・削除
- 在庫数の更新（数値入力 or ± ボタン）
- 残量アラート（閾値以下で警告表示）
- PDF 印刷（在庫表）

**在庫アイテムフィールド:**
- カテゴリ
- アイテム名
- 在庫数
- 単位（g / mL / 本 / 袋 など）
- アラート閾値

### 5. 売上管理 (Sales Management)

- 年別 / 月別 / 日別の売上集計
- メニュー別売上内訳
- 確定申告用サマリー（年間売上・月別推移）
- PDF 印刷・エクスポート

**表示データ:**
- 期間内の総売上
- 施術件数
- メニュー別売上ランキング
- 月別グラフ（年次表示時）

### 6. 会計計算 (Checkout)

- 顧客を選択 → メニューを複数選択
- 合計金額を自動計算
- 割引・調整額の入力
- 会計確定 → 施術履歴へ自動登録・売上データへ反映
- レシート印刷（PDF）

---

## 技術スタック

| 項目 | 技術 |
|------|------|
| フレームワーク | Next.js 16 (App Router) |
| 言語 | TypeScript |
| UI | React 19 |
| スタイル | Tailwind CSS v4 + SCSS Modules |
| 状態管理 | Zustand |
| ORM | Prisma |
| ローカル DB | PostgreSQL (Prisma) |
| 本番 DB | Supabase (PostgreSQL) |
| 認証 | NextAuth v5 (Auth.js) |
| PDF | react-to-print |
| 日付処理 | date-fns |

---

## ディレクトリ構造

```
hidamari/
├── app/
│   ├── (auth)/                      # 認証不要ルート
│   │   ├── login/
│   │   │   └── page.tsx
│   │   └── layout.tsx
│   ├── (dashboard)/                 # 認証必須ルート
│   │   ├── layout.tsx               # サイドバー + ヘッダー共通レイアウト
│   │   ├── page.tsx                 # / → /customers へリダイレクト
│   │   ├── customers/
│   │   │   ├── page.tsx             # 顧客一覧
│   │   │   └── [id]/
│   │   │       └── page.tsx         # 顧客カルテ詳細
│   │   ├── menu/
│   │   │   └── page.tsx             # メニュー管理
│   │   ├── reservations/
│   │   │   └── page.tsx             # 予約管理（カレンダー）
│   │   ├── inventory/
│   │   │   └── page.tsx             # 在庫管理
│   │   ├── sales/
│   │   │   └── page.tsx             # 売上管理
│   │   └── checkout/
│   │       └── page.tsx             # 会計計算
│   ├── api/
│   │   ├── auth/
│   │   │   └── [...nextauth]/
│   │   │       └── route.ts
│   │   ├── customers/
│   │   │   ├── route.ts             # GET (一覧), POST (追加)
│   │   │   └── [id]/
│   │   │       └── route.ts         # GET, PATCH, DELETE
│   │   ├── menu/
│   │   │   ├── route.ts
│   │   │   └── [id]/
│   │   │       └── route.ts
│   │   ├── reservations/
│   │   │   ├── route.ts
│   │   │   └── [id]/
│   │   │       └── route.ts
│   │   ├── inventory/
│   │   │   ├── route.ts
│   │   │   ├── [id]/
│   │   │   │   └── route.ts
│   │   │   └── categories/
│   │   │       ├── route.ts
│   │   │       └── [id]/
│   │   │           └── route.ts
│   │   ├── sales/
│   │   │   └── route.ts
│   │   └── checkout/
│   │       └── route.ts             # POST: 会計確定
│   ├── globals.css
│   ├── layout.tsx
│   └── not-found.tsx
│
├── components/
│   ├── ui/                          # 汎用UIコンポーネント
│   │   ├── Button/
│   │   ├── Input/
│   │   ├── Select/
│   │   ├── Modal/
│   │   ├── Table/
│   │   ├── Badge/
│   │   ├── Alert/
│   │   └── PageHeader/
│   ├── features/                    # 機能別コンポーネント
│   │   ├── customers/
│   │   ├── menu/
│   │   ├── reservations/
│   │   ├── inventory/
│   │   ├── sales/
│   │   └── checkout/
│   └── layout/                      # レイアウトコンポーネント
│       ├── Sidebar/
│       ├── Header/
│       └── PageWrapper/
│
├── lib/
│   ├── db/
│   │   ├── client.ts                # 環境に応じて DB クライアントを切り替え
│   │   ├── prisma.ts                # Prisma クライアント（ローカル）
│   │   └── supabase.ts              # Supabase クライアント（本番）
│   ├── auth/
│   │   └── config.ts                # NextAuth v5 設定
│   ├── pdf/
│   │   └── index.ts                 # PDF 印刷ユーティリティ
│   └── utils/
│       ├── date.ts                  # 日付フォーマット
│       ├── format.ts                # 数値フォーマット（通貨など）
│       └── validation.ts            # バリデーション
│
├── hooks/                           # カスタム React Hooks
│   ├── useCustomers.ts
│   ├── useMenu.ts
│   ├── useReservations.ts
│   ├── useInventory.ts
│   └── useSales.ts
│
├── store/                           # Zustand ストア
│   ├── checkoutStore.ts             # 会計カート状態
│   ├── uiStore.ts                   # UI状態（モーダル開閉など）
│   └── index.ts
│
├── types/                           # TypeScript 型定義
│   ├── customer.ts
│   ├── menu.ts
│   ├── reservation.ts
│   ├── inventory.ts
│   ├── sales.ts
│   └── index.ts                     # re-export
│
├── styles/                          # グローバル SCSS
│   ├── _variables.scss              # カラー・スペーシング変数
│   ├── _breakpoints.scss            # ブレークポイント
│   ├── _mixins.scss                 # レスポンシブ mixin など
│   └── _typography.scss             # フォント定義
│
├── prisma/
│   └── schema.prisma                # DB スキーマ定義
│
├── middleware.ts                    # ルート保護（認証チェック）
├── .env.example                     # 環境変数テンプレート
└── .env.local                       # ローカル環境変数（git 管理外）
```

---

## データモデル

### Customer（顧客）
```
id, name, nameKana, phone, email, birthday, allergies, notes,
createdAt, updatedAt
→ treatments[], reservations[]
```

### Treatment（施術履歴）
```
id, customerId, date, totalAmount, discount, notes,
createdAt, updatedAt
→ menuItems[] (TreatmentMenuItem)
```

### MenuItem（メニュー）
```
id, name, price, durationMin, isActive,
createdAt, updatedAt
```

### Reservation（予約）
```
id, customerId, startTime, endTime, status, notes,
createdAt, updatedAt
→ menuItems[] (ReservationMenuItem)
```

### InventoryCategory（在庫カテゴリ）
```
id, name, createdAt, updatedAt
→ items[] (InventoryItem)
```

### InventoryItem（在庫アイテム）
```
id, categoryId, name, quantity, unit, alertThreshold,
createdAt, updatedAt
```

### Staff（スタッフ）
```
id, name, email, password(hashed), role(ADMIN|STAFF), isActive,
createdAt, updatedAt
```

---

## 認証・認可

- NextAuth v5 + Credentials Provider（メール + パスワード）
- パスワードは bcrypt でハッシュ化
- `middleware.ts` で `/login` 以外すべてのルートを保護
- セッションは JWT（ステートレス、高速）

---

## ローカル / 本番環境の切り替え

環境変数 `DATABASE_URL` の値によって自動的に切り替わる。

```bash
# ローカル (.env.local)
DATABASE_URL="postgresql://user:pass@localhost:5432/hidamari"
DB_PROVIDER="prisma"

# 本番 (Supabase)
DATABASE_URL="postgresql://..."  # Supabase の接続文字列
DIRECT_URL="postgresql://..."    # Supabase の Direct URL (Prisma 用)
DB_PROVIDER="supabase"
```

  今後の Vercel + Supabase デプロイ時は以下を変更するだけです：
  - prisma/schema.prisma → provider = "postgresql"
  - lib/db/prisma.ts → PrismaPg アダプターに戻す
  - Vercel の環境変数に DATABASE_URL（Supabase 接続文字列）を設定
---

## レスポンシブブレークポイント

| 名前 | 幅 |
|------|---|
| mobile | ～ 767px |
| tablet-portrait | 768px ～ 1023px |
| tablet-landscape | 1024px ～ 1279px |
| desktop | 1280px ～ |

---

## パフォーマンス方針

- データ取得は React Server Components で SSR（初回表示を高速化）
- ミューテーション後は `router.refresh()` で最小限の再取得
- Zustand は UI ローカル状態（会計カート・モーダル開閉）のみに使用
- 一覧ページは `Suspense` + `loading.tsx` でスケルトン表示
