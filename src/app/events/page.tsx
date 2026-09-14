export const revalidate = 86400

import Link from 'next/link'
import { Suspense } from 'react'
import { unstable_cache } from 'next/cache'
import { createPublicClient } from '@/lib/supabase/public'
import { WIKI_CACHE_REVALIDATE, WIKI_CACHE_TAGS, WIKI_PUBLIC_TAG } from '@/lib/cache/wiki'
import type { Metadata } from 'next'
import type { Event } from '@/types/database'
import EventTypeFilter from '@/components/events/EventTypeFilter'
import { GitCommitVertical } from 'lucide-react'
import EventArchiveFeed from './EventArchiveFeed'

export const metadata: Metadata = {
  title: '사건 아카이브',
  description: '봉누도2 서버에서 일어난 주요 사건 기록',
}

export { typeLabel, typeColor } from '@/lib/events'

type Props = {
  searchParams: Promise<{ type?: string }>
}

const PAGE_SIZE = 12

async function getEvents(type: string) {
  const supabase = createPublicClient()
  let query = supabase
    .from('events')
    .select('*', { count: 'exact' })
    .eq('is_published', true)
    .order('occurred_at', { ascending: false })

  if (type) query = query.eq('type', type)

  const { data, count } = await query.range(0, PAGE_SIZE - 1)
  return { events: (data ?? []) as Event[], total: count ?? 0 }
}

const getEventsCached = unstable_cache(getEvents, ['wiki-events-list'], {
  revalidate: WIKI_CACHE_REVALIDATE,
  tags: [WIKI_PUBLIC_TAG, WIKI_CACHE_TAGS.events],
})

export default async function EventsPage({ searchParams }: Props) {
  const { type = '' } = await searchParams
  const { events, total } = await getEventsCached(type)
  const hasMore = events.length < total

  return (
    <div className="wiki-theme min-h-[calc(100vh-3.5rem)] px-4 py-10">
      <div className="mx-auto max-w-6xl space-y-8">
      {/* 헤더 */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-black text-white">사건 아카이브</h1>
          <p className="text-sm text-zinc-500">봉누도2 서버에서 일어난 주요 사건의 기록입니다.</p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <span className="text-sm text-zinc-500">
            총 <span className="text-white font-bold">{total}</span>건
          </span>
          <Link
            href="/events/timeline"
            className="flex items-center gap-1.5 rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-1.5 text-xs text-zinc-400 hover:border-amber-400/40 hover:text-amber-400 transition-colors"
          >
            <GitCommitVertical size={13} />
            연대표
          </Link>
        </div>
      </div>

      {/* 타입 필터 */}
      <Suspense>
        <EventTypeFilter />
      </Suspense>

      <EventArchiveFeed initialEvents={events} type={type} initialHasMore={hasMore} total={total} />
      </div>
    </div>
  )
}
