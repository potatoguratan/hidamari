import Link from "next/link"

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-dvh gap-4">
      <h1 className="text-4xl font-bold text-gray-800">404</h1>
      <p className="text-gray-500">ページが見つかりません</p>
      <Link href="/" className="text-[#6cb1c9] hover:underline">
        トップへ戻る
      </Link>
    </div>
  )
}
