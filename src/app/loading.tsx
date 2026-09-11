export default function GlobalLoading() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-10 space-y-8 animate-pulse">
      {/* 헤더 스켈레톤 */}
      <div className="space-y-3">
        <div className="h-8 w-48 rounded-lg bg-zinc-800" />
        <div className="h-4 w-72 rounded bg-zinc-800/70" />
      </div>

      {/* 카드 그리드 스켈레톤 */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="rounded-xl border border-zinc-800 bg-zinc-900 p-4 space-y-3">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-zinc-800 shrink-0" />
              <div className="space-y-1.5 flex-1">
                <div className="h-4 w-24 rounded bg-zinc-800" />
                <div className="h-3 w-16 rounded bg-zinc-800/70" />
              </div>
            </div>
            <div className="h-3 w-full rounded bg-zinc-800/60" />
            <div className="h-3 w-4/5 rounded bg-zinc-800/60" />
          </div>
        ))}
      </div>
    </div>
  )
}
