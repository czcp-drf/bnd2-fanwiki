'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useSearchParams } from 'next/navigation'
import { getBbsArticleNeighborsAction } from '../actions'
import { BBS_DAYS, type BbsDayKey } from '@/lib/bbs/days'
import type { BbsSortOrder } from '@/lib/bbs/data'

type Neighbor = { id: string; title: string }
type Neighbors = { previous: Neighbor | null; next: Neighbor | null }

export default function BbsArticleNeighbors({ articleId }: { articleId: string }) {
  const searchParams = useSearchParams()
  const [neighbors, setNeighbors] = useState<Neighbors>({ previous: null, next: null })
  const category = searchParams.get('category') || undefined
  const reporter = searchParams.get('reporter') || ''
  const dayValue = searchParams.get('day') || ''
  const day = BBS_DAYS.some((item) => item.key === dayValue) ? dayValue as BbsDayKey : undefined
  const order: BbsSortOrder = searchParams.get('order') === 'oldest' ? 'oldest' : 'latest'
  const query = searchParams.toString()

  useEffect(() => {
    let active = true
    void getBbsArticleNeighborsAction(articleId, category, reporter.split(',').map((value) => value.trim()).filter(Boolean), day, order).then((result) => {
      if (active) setNeighbors(result)
    })
    return () => { active = false }
  }, [articleId, category, day, order, reporter])

  const href = (id: string) => `/bbs/article/${id}${query ? `?${query}` : ''}`
  return (
    <nav aria-label="기사 이동" className="mx-auto mt-4 grid max-w-3xl grid-cols-2 gap-3">
      {neighbors.previous ? <Link href={href(neighbors.previous.id)} className="group min-w-0 rounded-xl border border-[var(--bbs-border)] bg-[var(--bbs-surface)] px-4 py-3 transition-colors hover:border-[#d7432d]/40 hover:bg-[#d7432d]/5"><span className="flex items-center gap-1 text-[11px] text-[var(--bbs-subtle-text)]"><ChevronLeft size={15} />이전 기사</span><span className="mt-1 block truncate text-sm font-semibold text-[var(--bbs-text)] group-hover:text-[#d7432d]">{neighbors.previous.title}</span></Link> : <span className="rounded-xl border border-[var(--bbs-border)] bg-[var(--bbs-surface)] px-4 py-3 opacity-40"><span className="flex items-center gap-1 text-[11px] text-[var(--bbs-subtle-text)]"><ChevronLeft size={15} />이전 기사</span><span className="mt-1 block text-sm text-[var(--bbs-subtle-text)]">없음</span></span>}
      {neighbors.next ? <Link href={href(neighbors.next.id)} className="group min-w-0 rounded-xl border border-[var(--bbs-border)] bg-[var(--bbs-surface)] px-4 py-3 text-right transition-colors hover:border-[#d7432d]/40 hover:bg-[#d7432d]/5"><span className="flex items-center justify-end gap-1 text-[11px] text-[var(--bbs-subtle-text)] text-right">다음 기사<ChevronRight size={15} /></span><span className="mt-1 block truncate text-sm font-semibold text-[var(--bbs-text)] group-hover:text-[#d7432d]">{neighbors.next.title}</span></Link> : <span className="rounded-xl border border-[var(--bbs-border)] bg-[var(--bbs-surface)] px-4 py-3 text-right opacity-40"><span className="flex items-center justify-end gap-1 text-[11px] text-[var(--bbs-subtle-text)]">다음 기사<ChevronRight size={15} /></span><span className="mt-1 block text-sm text-[var(--bbs-subtle-text)]">없음</span></span>}
    </nav>
  )
}
