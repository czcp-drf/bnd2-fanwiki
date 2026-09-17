'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { getEventNeighborsAction } from './actions'
import { BBS_DAYS, type BbsDayKey } from '@/lib/bbs/days'

type Neighbor = { id: string; title: string }
type Neighbors = { previous: Neighbor | null; next: Neighbor | null }

export default function EventNeighbors({ eventId }: { eventId: string }) {
  const searchParams = useSearchParams()
  const [neighbors, setNeighbors] = useState<Neighbors>({ previous: null, next: null })
  const type = searchParams.get('type') || undefined
  const dayValue = searchParams.get('day') || ''
  const day = BBS_DAYS.some((item) => item.key === dayValue) ? dayValue as BbsDayKey : undefined
  const query = searchParams.toString()

  useEffect(() => {
    let active = true
    void getEventNeighborsAction(eventId, type, day).then((result) => {
      if (active) setNeighbors(result)
    })
    return () => { active = false }
  }, [eventId, type, day])

  const href = (id: string) => `/events/${id}${query ? `?${query}` : ''}`
  return (
    <nav aria-label="사건 이동" className="mx-auto grid max-w-4xl grid-cols-2 gap-3">
      {neighbors.previous ? (
        <Link href={href(neighbors.previous.id)} className="group min-w-0 rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-3 transition-colors hover:border-amber-400/40 hover:bg-zinc-800/50">
          <span className="flex items-center gap-1 text-[11px] text-zinc-500"><ChevronLeft size={15} />이전 사건</span>
          <span className="mt-1 block truncate text-sm font-semibold text-white group-hover:text-amber-400">{neighbors.previous.title}</span>
        </Link>
      ) : (
        <span className="rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-3 opacity-40">
          <span className="flex items-center gap-1 text-[11px] text-zinc-500"><ChevronLeft size={15} />이전 사건</span>
          <span className="mt-1 block text-sm text-zinc-500">없음</span>
        </span>
      )}
      {neighbors.next ? (
        <Link href={href(neighbors.next.id)} className="group min-w-0 rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-3 text-right transition-colors hover:border-amber-400/40 hover:bg-zinc-800/50">
          <span className="flex items-center justify-end gap-1 text-[11px] text-zinc-500">다음 사건<ChevronRight size={15} /></span>
          <span className="mt-1 block truncate text-sm font-semibold text-white group-hover:text-amber-400">{neighbors.next.title}</span>
        </Link>
      ) : (
        <span className="rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-3 text-right opacity-40">
          <span className="flex items-center justify-end gap-1 text-[11px] text-zinc-500">다음 사건<ChevronRight size={15} /></span>
          <span className="mt-1 block text-sm text-zinc-500">없음</span>
        </span>
      )}
    </nav>
  )
}
