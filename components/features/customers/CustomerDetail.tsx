// TODO: 顧客カルテ詳細コンポーネント
// - 顧客基本情報（編集ボタン付き）
// - 施術履歴一覧（日付・メニュー・金額）
// - PDF印刷ボタン

type Props = { id: string }

export async function CustomerDetail({ id }: Props) {
  return (
    <div className="text-gray-400 text-sm">
      顧客カルテ（ID: {id}）（実装予定）
    </div>
  )
}
