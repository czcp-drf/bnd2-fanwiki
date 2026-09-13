export default function GlobalLoading() {
  return (
    <div className="min-h-[calc(100vh-3.5rem)] w-full bg-[var(--site-page)] px-4 py-10 animate-pulse">
      <div className="mx-auto max-w-6xl space-y-8">
      {/* 헤더 스켈레톤 */}
      <div className="space-y-3">
        <div className="h-8 w-48 rounded-lg bg-[var(--site-card-raised)]" />
        <div className="h-4 w-72 rounded bg-[var(--site-card-raised)] opacity-70" />
      </div>

      {/* 카드 그리드 스켈레톤 */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="space-y-3 rounded-xl border border-[var(--site-border)] bg-[var(--site-card)] p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 shrink-0 rounded-full bg-[var(--site-card-raised)]" />
              <div className="space-y-1.5 flex-1">
                <div className="h-4 w-24 rounded bg-[var(--site-card-raised)]" />
                <div className="h-3 w-16 rounded bg-[var(--site-card-raised)] opacity-70" />
              </div>
            </div>
            <div className="h-3 w-full rounded bg-[var(--site-card-raised)] opacity-60" />
            <div className="h-3 w-4/5 rounded bg-[var(--site-card-raised)] opacity-60" />
          </div>
        ))}
      </div>
      </div>
    </div>
  )
}
