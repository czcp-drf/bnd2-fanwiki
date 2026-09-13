import { Suspense } from 'react'
import { unstable_cache } from 'next/cache'
import { createPublicClient } from '@/lib/supabase/public'
import { WIKI_CACHE_REVALIDATE, WIKI_CACHE_TAGS, WIKI_PUBLIC_TAG } from '@/lib/cache/wiki'
import type { Metadata } from 'next'
import BackButton from '@/components/ui/BackButton'
import TimelineFilters from '@/components/events/TimelineFilters'
import TimelineView from '@/components/events/TimelineView'

export const metadata: Metadata = {
  title: '사건 연대표',
  description: '시간 순으로 보는 봉누도2 주요 사건 기록',
}

type Props = {
  searchParams: Promise<{ character?: string; org?: string }>
}

type TimelineEvent = {
  id: string
  title: string
  summary: string | null
  type: string | null
  occurred_at: string | null
  event_participants: Array<{
    characters: { id: string; name: string } | null
  }>
}

async function getFilterOptions() {
  const supabase = createPublicClient()
  const [{ data: characters }, { data: orgs }] = await Promise.all([
    supabase.from('characters').select('id, name, streamers(display_name)').order('name'),
    supabase.from('organizations').select('id, name, category').neq('category', 'illegal').order('name'),
  ])
  const chars = (characters ?? []).map((c: { id: string; name: string; streamers: { display_name: string } | null }) => ({
    id: c.id,
    name: c.name,
    streamerName: c.streamers?.display_name ?? null,
  }))
  return {
    characters: chars,
    orgs: (orgs ?? []) as unknown as Array<{ id: string; name: string; category: string | null }>,
  }
}

async function getEvents(characterId?: string, orgId?: string): Promise<TimelineEvent[]> {
  const supabase = createPublicClient()

  let eventIds: string[] | null = null

  if (characterId) {
    const { data } = await supabase
      .from('event_participants')
      .select('event_id')
      .eq('character_id', characterId)
    eventIds = [...new Set(((data ?? []) as unknown as { event_id: string }[]).map((r) => r.event_id))]
  } else if (orgId) {
    const { data: members } = await supabase
      .from('organization_members')
      .select('character_id')
      .eq('organization_id', orgId)
    const charIds = ((members ?? []) as unknown as { character_id: string }[]).map((m) => m.character_id)
    if (charIds.length) {
      const { data } = await supabase
        .from('event_participants')
        .select('event_id')
        .in('character_id', charIds)
      eventIds = [...new Set(((data ?? []) as unknown as { event_id: string }[]).map((r) => r.event_id))]
    } else {
      eventIds = []
    }
  }

  if (eventIds !== null && eventIds.length === 0) return []

  let query = supabase
    .from('events')
    .select(`id, title, summary, type, occurred_at, event_participants ( characters ( id, name ) )`)
    .eq('is_published', true)
    .order('occurred_at', { ascending: true })

  if (eventIds !== null) query = query.in('id', eventIds)

  const { data } = await query
  return (data ?? []) as unknown as TimelineEvent[]
}

const getFilterOptionsCached = unstable_cache(getFilterOptions, ['wiki-timeline-filter-options'], {
  revalidate: WIKI_CACHE_REVALIDATE,
  tags: [WIKI_PUBLIC_TAG, WIKI_CACHE_TAGS.events, WIKI_CACHE_TAGS.characters, WIKI_CACHE_TAGS.organizations],
})
const getEventsCached = unstable_cache(getEvents, ['wiki-timeline-events'], {
  revalidate: WIKI_CACHE_REVALIDATE,
  tags: [WIKI_PUBLIC_TAG, WIKI_CACHE_TAGS.events, WIKI_CACHE_TAGS.characters, WIKI_CACHE_TAGS.organizations],
})

export default async function TimelinePage({ searchParams }: Props) {
  const { character: characterId, org: orgId } = await searchParams
  const [events, { characters, orgs }] = await Promise.all([
    getEventsCached(characterId, orgId),
    getFilterOptionsCached(),
  ])

  const selectedChar = characters.find((c) => c.id === characterId)
  const selectedOrg = orgs.find((o) => o.id === orgId)
  const filterLabel = selectedChar
    ? `${selectedChar.name} 관련 사건`
    : selectedOrg
    ? `${selectedOrg.name} 관련 사건`
    : '전체 사건'

  return (
    <div className="wiki-theme min-h-[calc(100vh-3.5rem)] px-4 py-10">
      <div className="mx-auto max-w-3xl space-y-8">
      {/* 헤더 */}
      <div className="space-y-1">
        <BackButton />
        <h1 className="text-2xl font-black text-white">사건 연대표</h1>
        <p className="text-sm text-zinc-500">
          {filterLabel} · <span className="text-white font-bold">{events.length}</span>건
        </p>
      </div>

      {/* 필터 */}
      <Suspense>
        <TimelineFilters characters={characters} orgs={orgs} />
      </Suspense>

      {/* 타임라인 */}
      {events.length === 0 ? (
        <div className="rounded-xl border border-zinc-800 bg-zinc-900 py-24 text-center text-zinc-500 text-sm">
          해당 조건에 맞는 사건이 없습니다.
        </div>
      ) : (
        <TimelineView events={events} />
      )}
      </div>
    </div>
  )
}
