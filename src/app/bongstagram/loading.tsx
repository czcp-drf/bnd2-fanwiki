import BongstagramBottomNav from './BongstagramBottomNav'

function StorySkeleton() {
  return <div className="h-[4.5rem] w-[4.5rem] shrink-0 rounded-full bg-zinc-800" />
}

function PostSkeleton() {
  return (
    <article className="border-b border-zinc-800" aria-hidden="true">
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-full bg-zinc-800" />
          <div className="h-3 w-24 rounded bg-zinc-800" />
        </div>
        <div className="h-7 w-14 rounded-lg bg-zinc-800" />
      </div>
      <div className="aspect-[4/5] w-full bg-zinc-900" />
      <div className="space-y-3 px-4 py-4">
        <div className="h-4 w-28 rounded bg-zinc-800" />
        <div className="h-3 w-4/5 rounded bg-zinc-800" />
        <div className="h-3 w-1/3 rounded bg-zinc-800" />
      </div>
    </article>
  )
}

export default function BongstagramLoading() {
  return (
    <div className="bongstagram-theme" aria-busy="true" aria-label="Bongstagram 불러오는 중">
      <div className="bongstagram-font min-h-[calc(100dvh-3.5rem)] bg-zinc-950">
        <div className="mx-auto min-h-[calc(100dvh-3.5rem)] w-full max-w-[540px] border-x border-zinc-900 bg-zinc-950 pb-20">
          <header className="flex h-16 items-center justify-between border-b border-zinc-800 px-5">
            <div className="h-6 w-36 animate-pulse rounded bg-zinc-800" />
            <div className="h-6 w-16 animate-pulse rounded bg-zinc-800" />
          </header>
          <section className="flex gap-3 overflow-hidden border-b border-zinc-800 px-4 py-4" aria-hidden="true">
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
