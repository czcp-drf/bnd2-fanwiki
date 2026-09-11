import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-6 px-4 text-center">
      <div className="space-y-2">
        <p className="text-6xl font-black text-zinc-700">404</p>
        <h2 className="text-xl font-bold text-white">페이지를 찾을 수 없습니다</h2>
        <p className="text-sm text-zinc-500">요청하신 페이지가 존재하지 않거나 삭제됐습니다.</p>
      </div>
      <div className="flex flex-wrap justify-center gap-3">
        <Link
          href="/"
          className="rounded-lg bg-amber-400 px-5 py-2 text-sm font-bold text-zinc-900 hover:bg-amber-300 transition-colors"
        >
          홈으로
        </Link>
        <Link
          href="/characters"
          className="rounded-lg border border-zinc-700 bg-zinc-800 px-5 py-2 text-sm font-medium text-zinc-300 hover:border-zinc-600 hover:text-white transition-colors"
        >
          캐릭터 위키
        </Link>
      </div>
    </div>
  )
}
