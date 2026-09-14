export const revalidate = 86400

import Link from 'next/link'
import { Suspense } from 'react'
import { unstable_cache } from 'next/cache'
import { createPublicClient } from '@/lib/supabase/public'
import { WIKI_CACHE_REVALIDATE, WIKI_CACHE_TAGS, WIKI_PUBLIC_TAG } from '@/lib/cache/wiki'
import type { Metadata } from 'next'
import { formatKstDateTime } from '@/lib/date/kst'
import type { Event } from '@/types/database'
import EventTypeFilter from '@/components/events/EventTypeFilter'
import { GitCommitVertical } from 'lucide-react'
import { typeLabel, typeColor } from '@/lib/events'
import AppImage from '@/components/ui/AppImage'

export const metadata: Metadata = {
  title: '사건 아카이브',
  description: '봉누도2 서버에서 일어난 주요 사건 기록',
}

export { typeLabel, typeColor } from '@/lib/events'

type Props = {
  searchParams: Promise<{ type?: string }>
}

async function getEvents(type: string) {
  const supabase = createPublicClient()
  let query = supabase
    .from('events')
    .select('*')
    .eq('is_published', true)
    .order('occurred_at', { ascending: false })

  if (type) query = query.eq('type', type)

  const { data } = await query
  return (data ?? []) as Event[]
}

const getEventsCached = unstable_cache(getEvents, ['wiki-events-list'], {
  revalidate: WIKI_CACHE_REVALIDATE,
  tags: [WIKI_PUBLIC_TAG, WIKI_CACHE_TAGS.events],
})

export default async function EventsPage({ searchParams }: Props) {
  const { type = '' } = await searchParams
  const events = await getEventsCached(type)

  const featured = events[0]
  const rest = events.slice(1)

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
            총 <span className="text-white font-bold">{events.length}</span>건
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

      {events.length === 0 ? (
        <div className="rounded-xl border border-zinc-800 bg-zinc-900 py-24 text-center text-zinc-500 text-sm">
          기록된 사건이 없습니다.
        </div>
      ) : (
        <div className="space-y-6">
          {/* 최신 사건 피처드 카드 */}
          {featured && !type && (
            <Link
              href={`/events/${featured.id}`}
              className={`group relative flex min-h-[260px] flex-col justify-end overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900 transition-colors hover:border-amber-400/30 ${featured.thumbnail_url ? 'events-featured-card' : ''}`}
            >
              {featured.thumbnail_url && (
                <>
                  <AppImage
                    src={featured.thumbnail_url}
                    alt={featured.title}
                    className="absolute inset-0 h-full w-full object-cover opacity-30 group-hover:opacity-40 transition-opacity"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/60 to-transparent" />
                </>
              )}
              {!featured.thumbnail_url && (
                <div className="events-thumbnail-fallback absolute inset-0 flex items-center justify-center bg-gradient-to-br from-amber-500/10 to-transparent">
                  <span className="text-4xl font-black text-amber-400 opacity-50 drop-shadow-sm">
                    {typeLabel[featured.type ?? 'other'] ?? '기타'}
                  </span>
                </div>
              )}

              <div className="relative z-10 space-y-3 p-6">
                <div className="flex items-center gap-2">
                  <span className="rounded-full bg-amber-400 px-2.5 py-0.5 text-xs font-bold text-zinc-900">
                    최신
                  </span>
                  {featured.type && (
                    <span className={`rounded-full border px-2.5 py-0.5 text-xs font-medium ${typeColor[featured.type]}`}>
                      {typeLabel[featured.type]}
                    </span>
                  )}
                  {featured.occurred_at && (
                    <span className="text-xs text-zinc-500">
                      {formatKstDateTime(featured.occurred_at)}
                    </span>
                  )}
                </div>
                <h2 className="text-xl font-black text-white group-hover:text-amber-400 transition-colors leading-snug">
                  {featured.title}
                </h2>
                {featured.summary && (
                  <p className="text-sm text-zinc-400 line-clamp-2">{featured.summary}</p>
                )}
              </div>
            </Link>
          )}

          {/* 나머지 사건 그리드 */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {(type ? events : rest).map((e) => (
              <EventCard key={e.id} event={e} />
            ))}
          </div>
        </div>
      )}
      </div>
    </div>
  )
}

function EventCard({ event: e }: { event: Event }) {
  return (
    <Link
      href={`/events/${e.id}`}
      className="group flex flex-col gap-3 rounded-xl border border-zinc-800 bg-zinc-900 overflow-hidden transition-colors hover:border-amber-400/30 hover:bg-zinc-800/50"
    >
      {e.thumbnail_url ? (
        <div className="relative h-40 overflow-hidden">
          <AppImage
            src={e.thumbnail_url}
            alt={e.title}
            className="h-full w-full object-cover opacity-80 group-hover:opacity-100 group-hover:scale-105 transition-all duration-300"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-zinc-900/80 to-transparent" />
          {e.type && (
            <span className={`absolute bottom-2 left-3 rounded-full border px-2 py-0.5 text-xs font-medium ${typeColor[e.type]}`}>
              {typeLabel[e.type]}
            </span>
          )}
        </div>
      ) : (
        <div className="events-thumbnail-fallback flex h-40 items-center justify-center bg-amber-400/5">
          <span className={`rounded-full border px-3 py-1 text-sm font-semibold ${typeColor[e.type ?? 'other'] ?? typeColor.other}`}>
            {typeLabel[e.type ?? 'other'] ?? '기타'}
          </span>
        </div>
      )}

      <div className="flex flex-col gap-2 px-4 pb-4">
        {e.occurred_at && (
          <p className="text-xs text-zinc-500">
            {formatKstDateTime(e.occurred_at)}
          </p>
        )}
        <h3 className="font-bold text-white group-hover:text-amber-400 transition-colors line-clamp-2 leading-snug">
          {e.title}
        </h3>
        {e.summary && (
          <p className="text-xs text-zinc-500 line-clamp-3 leading-relaxed">{e.summary}</p>
        )}
      </div>
    </Link>
  )
}
