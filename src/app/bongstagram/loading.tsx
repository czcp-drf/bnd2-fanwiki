import BongstagramBottomNav from './BongstagramBottomNav'

function StorySkeleton() {
  return <div className="h-[4.5rem] w-[4.5rem] shrink-0 rounded-full bg-[var(--site-card-raised)]" />
}

function PostSkeleton() {
  return (
    <article className="border-b border-[var(--site-border)]" aria-hidden="true">
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-full bg-[var(--site-card-raised)]" />
          <div className="h-3 w-24 rounded bg-[var(--site-card-raised)]" />
        </div>
        <div className="h-7 w-14 rounded-lg bg-[var(--site-card-raised)]" />
      </div>
      <div className="aspect-[4/5] w-full bg-[var(--site-card)]" />
      <div className="space-y-3 px-4 py-4">
        <div className="h-4 w-28 rounded bg-[var(--site-card-raised)]" />
        <div className="h-3 w-4/5 rounded bg-[var(--site-card-raised)]" />
        <div className="h-3 w-1/3 rounded bg-[var(--site-card-raised)]" />
      </div>
    </article>
  )
}

export default function BongstagramLoading() {
  return (
    <div className="bongstagram-theme" aria-busy="true" aria-label="Bongstagram 불러오는 중">
      <div className="bongstagram-font min-h-[calc(100dvh-3.5rem)] bg-[var(--site-page)]">
        <div className="mx-auto min-h-[calc(100dvh-3.5rem)] w-full max-w-[540px] border-x border-[var(--site-border)] bg-[var(--site-page)] pb-20">
          <header className="flex h-16 items-center justify-between border-b border-[var(--site-border)] px-5">
            <div className="h-6 w-36 animate-pulse rounded bg-[var(--site-card-raised)]" />
            <div className="h-6 w-16 animate-pulse rounded bg-[var(--site-card-raised)]" />
          </header>
          <section className="flex gap-3 overflow-hidden border-b border-[var(--site-border)] px-4 py-4" aria-hidden="true">
            {Array.from({ length: 5 }).map((_, index) => <StorySkeleton key={index} />)}
          </section>
          <div className="animate-pulse">
            <PostSkeleton />
            <PostSkeleton />
          </div>
        </div>
      </div>
      <BongstagramBottomNav />
    </div>
  )
}
