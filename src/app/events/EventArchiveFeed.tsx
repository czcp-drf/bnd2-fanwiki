'use client'

import { useEffect, useRef } from 'react'
import { useInfiniteQuery } from '@tanstack/react-query'
import Link from 'next/link'
import { Loader2 } from 'lucide-react'
import type { Event } from '@/types/database'
import { formatKstDateTime } from '@/lib/date/kst'
import { typeLabel, typeColor } from '@/lib/events'
import AppImage from '@/components/ui/AppImage'

type Props = { initialEvents: Event[]; type: string; initialHasMore: boolean; total: number }
type EventPage = { events: Event[]; total: number; hasMore: boolean }

export const EVENT_SCROLL_STATE_PREFIX = 'events-scroll-state:'

function rememberEventScrollPosition() {
  sessionStorage.setItem(
    `${EVENT_SCROLL_STATE_PREFIX}${window.location.pathname}${window.location.search}`,
    JSON.stringify({ top: window.scrollY }),
  )
}

export default function EventArchiveFeed({ initialEvents, type, initialHasMore, total }: Props) {
  const sentinelRef = useRef<HTMLDivElement>(null)
  const restoreTargetRef = useRef<number | null>(null)
  const restoreAttemptsRef = useRef(0)

  const query = useInfiniteQuery({
    queryKey: ['events', type || null],
    queryFn: async ({ pageParam }) => {
      const params = new URLSearchParams({ offset: String(pageParam) })
      if (type) params.set('type', type)
      const response = await fetch(`/api/events?${params.toString()}`)
      if (!response.ok) throw new Error('사건 목록을 불러오지 못했습니다.')
      return await response.json() as EventPage
    },
    initialPageParam: 0,
    initialData: { pages: [{ events: initialEvents, total, hasMore: initialHasMore }], pageParams: [0] },
    getNextPageParam: (lastPage, allPages) => lastPage.hasMore ? allPages.reduce((count, page) => count + page.events.length, 0) : undefined,
    maxPages: 10,
  })
  const events = query.data.pages.flatMap((page) => page.events)
  const hasMore = Boolean(query.hasNextPage)

  useEffect(() => {
    const stateKey = `${EVENT_SCROLL_STATE_PREFIX}${window.location.pathname}${window.location.search}`
    const savedState = sessionStorage.getItem(stateKey)
    if (!savedState) return
    try {
      const top = Math.max(0, Number(JSON.parse(savedState).top) || 0)
      if (top > 0) restoreTargetRef.current = top
      else sessionStorage.removeItem(stateKey)
    } catch {
      sessionStorage.removeItem(stateKey)
    }
  }, [])

  useEffect(() => {
    const target = restoreTargetRef.current
    if (target === null) return
    const stateKey = `${EVENT_SCROLL_STATE_PREFIX}${window.location.pathname}${window.location.search}`
    const canReachTarget = document.documentElement.scrollHeight >= target + window.innerHeight
    if (canReachTarget || !hasMore || restoreAttemptsRef.current >= 180) {
      window.scrollTo({ top: Math.min(target, document.documentElement.scrollHeight), behavior: 'auto' })
      restoreTargetRef.current = null
      sessionStorage.removeItem(stateKey)
      return
    }
    if (query.isFetchingNextPage) return
    restoreAttemptsRef.current += 1
    const frame = requestAnimationFrame(() => { void query.fetchNextPage() })
    return () => cancelAnimationFrame(frame)
  }, [events.length, hasMore, query])

  useEffect(() => {
    if (!hasMore || query.isFetchingNextPage) return
    const sentinel = sentinelRef.current
    if (!sentinel) return
    const observer = new IntersectionObserver((entries) => {
      if (entries[0]?.isIntersecting) void query.fetchNextPage()
    }, { rootMargin: '480px' })
    observer.observe(sentinel)
    return () => observer.disconnect()
  }, [hasMore, query])

  const visibleEvents = type ? events : events.slice(1)
  return (
    <>
      {events.length === 0 ? (
        <div className="rounded-xl border border-zinc-800 bg-zinc-900 py-24 text-center text-zinc-500 text-sm">기록된 사건이 없습니다.</div>
      ) : (
        <div className="space-y-6">
          {!type && <FeaturedEvent event={events[0]} type={type} />}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {visibleEvents.map((event) => <EventCard key={event.id} event={event} type={type} />)}
          </div>
          <div ref={sentinelRef} className="flex min-h-10 items-center justify-center text-zinc-500" aria-live="polite">
            {query.isFetchingNextPage && <Loader2 size={18} className="animate-spin" aria-label="사건을 불러오는 중" />}
            {!hasMore && events.length > 0 && <span className="text-xs">모든 사건을 불러왔습니다.</span>}
          </div>
        </div>
      )}
      <span className="sr-only">총 {total}건</span>
    </>
  )
}

function eventHref(id: string, type: string) {
  return `/events/${id}${type ? `?type=${encodeURIComponent(type)}` : ''}`
}

function FeaturedEvent({ event, type }: { event: Event; type: string }) {
  return (
    <Link href={eventHref(event.id, type)} onClick={rememberEventScrollPosition} className={`group relative flex min-h-[260px] flex-col justify-end overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900 transition-colors hover:border-amber-400/30 ${event.thumbnail_url ? 'events-featured-card' : ''}`}>
      {event.thumbnail_url ? <><AppImage src={event.thumbnail_url} alt={event.title} className="absolute inset-0 h-full w-full object-cover opacity-30 group-hover:opacity-40 transition-opacity" /><div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/60 to-transparent" /></> : <div className="events-thumbnail-fallback absolute inset-0 flex items-center justify-center bg-gradient-to-br from-amber-500/10 to-transparent"><span className="text-4xl font-black text-amber-400 opacity-50 drop-shadow-sm">{typeLabel[event.type ?? 'other'] ?? '기타'}</span></div>}
      <div className="relative z-10 space-y-3 p-6"><div className="flex items-center gap-2"><span className="rounded-full bg-amber-400 px-2.5 py-0.5 text-xs font-bold text-zinc-900">최신</span>{event.type && <span className={`rounded-full border px-2.5 py-0.5 text-xs font-medium ${typeColor[event.type]}`}>{typeLabel[event.type]}</span>}{event.occurred_at && <span className="text-xs text-zinc-500">{formatKstDateTime(event.occurred_at)}</span>}</div><h2 className="text-xl font-black text-white group-hover:text-amber-400 transition-colors leading-snug">{event.title}</h2>{event.summary && <p className="text-sm text-zinc-400 line-clamp-2">{event.summary}</p>}</div>
    </Link>
  )
}

function EventCard({ event, type }: { event: Event; type: string }) {
  return <Link href={eventHref(event.id, type)} onClick={rememberEventScrollPosition} className="group flex flex-col gap-3 rounded-xl border border-zinc-800 bg-zinc-900 overflow-hidden transition-colors hover:border-amber-400/30 hover:bg-zinc-800/50">{event.thumbnail_url ? <div className="relative h-40 overflow-hidden"><AppImage src={event.thumbnail_url} alt={event.title} className="h-full w-full object-cover opacity-80 group-hover:opacity-100 group-hover:scale-105 transition-all duration-300" /><div className="absolute inset-0 bg-gradient-to-t from-zinc-900/80 to-transparent" />{event.type && <span className={`absolute bottom-2 left-3 rounded-full border px-2 py-0.5 text-xs font-medium ${typeColor[event.type]}`}>{typeLabel[event.type]}</span>}</div> : <div className="events-thumbnail-fallback flex h-40 items-center justify-center bg-amber-400/5"><span className={`rounded-full border px-3 py-1 text-sm font-semibold ${typeColor[event.type ?? 'other'] ?? typeColor.other}`}>{typeLabel[event.type ?? 'other'] ?? '기타'}</span></div>}<div className="flex flex-col gap-2 px-4 pb-4">{event.occurred_at && <p className="text-xs text-zinc-500">{formatKstDateTime(event.occurred_at)}</p>}<h3 className="font-bold text-white group-hover:text-amber-400 transition-colors line-clamp-2 leading-snug">{event.title}</h3>{event.summary && <p className="text-xs text-zinc-500 line-clamp-3 leading-relaxed">{event.summary}</p>}</div></Link>
}
