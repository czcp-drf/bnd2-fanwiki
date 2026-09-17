'use server'

import { unstable_cache } from 'next/cache'
import { createPublicClient } from '@/lib/supabase/public'
import { WIKI_CACHE_TAGS, WIKI_DETAIL_CACHE_REVALIDATE } from '@/lib/cache/wiki'
import { BBS_DAYS, type BbsDayKey } from '@/lib/bbs/days'

type EventNeighbor = { id: string; title: string }
type EventNeighbors = { previous: EventNeighbor | null; next: EventNeighbor | null }

const getCachedEventNeighbors = unstable_cache(
  async (eventId: string, type: string, dayKey?: BbsDayKey): Promise<EventNeighbors> => {
    const supabase = createPublicClient()
    let query = supabase
      .from('events')
      .select('id, title, occurred_at')
      .eq('is_published', true)

    if (type) query = query.eq('type', type)
    if (dayKey) {
      const day = BBS_DAYS.find((item) => item.key === dayKey)
      if (day) query = query.gte('occurred_at', day.start).lte('occurred_at', day.end)
    }

    const { data, error } = await query
      .order('occurred_at', { ascending: false, nullsFirst: false })
      .order('id', { ascending: false })

    if (error) {
      console.error('Event neighbor load failed:', error.message)
      return { previous: null, next: null }
    }

    const rows = (data ?? []) as Array<{ id: string; title: string }>
    const currentIndex = rows.findIndex((row) => row.id === eventId)
    return {
      previous: currentIndex >= 0 && currentIndex < rows.length - 1 ? rows[currentIndex + 1] : null,
      next: currentIndex > 0 ? rows[currentIndex - 1] : null,
    }
  },
  ['event-neighbors'],
  { revalidate: WIKI_DETAIL_CACHE_REVALIDATE, tags: [WIKI_CACHE_TAGS.events] },
)

export async function getEventNeighborsAction(eventId: string, type?: string, day?: string) {
  const dayKey = BBS_DAYS.some((item) => item.key === day) ? day as BbsDayKey : undefined
  return getCachedEventNeighbors(eventId.trim(), type?.trim() ?? '', dayKey)
}
