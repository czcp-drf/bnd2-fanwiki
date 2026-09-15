import Link from 'next/link'
import { unstable_cache } from 'next/cache'
import { createPublicClient } from '@/lib/supabase/public'
import { WIKI_CACHE_REVALIDATE, WIKI_CACHE_TAGS, WIKI_PUBLIC_TAG } from '@/lib/cache/wiki'
import { ExternalLink, Search } from 'lucide-react'
import type { Metadata } from 'next'
import { StreamerReveal } from '@/components/ui/StreamerMask'
import type { Organization, Streamer } from '@/types/database'
import { typeLabel as eventTypeLabel, typeColor as eventTypeColor } from '@/lib/events'
import AppImage from '@/components/ui/AppImage'
import { formatKstDate } from '@/lib/date/kst'

export const metadata: Metadata = { title: '검색' }

const statusColor: Record<string, string> = {
  active: 'text-green-400 bg-green-400/10',
  dead: 'text-red-400 bg-red-400/10',
  retired: 'text-zinc-400 bg-zinc-400/10',
  hiatus: 'text-yellow-400 bg-yellow-400/10',
}
const statusLabel: Record<string, string> = {
  active: '활동', dead: '사망', retired: '은퇴', hiatus: '휴식',
}

const orgAliases: { keywords: string[]; type: string }[] = [
  { keywords: ['ems', '응급', '응급실', '의사', '의료'], type: 'ems' },
  { keywords: ['보도국', '기자', '언론', '방송', '방송국', '뉴스', '리포터'], type: 'journalist' },
  { keywords: ['교정국', '교정공', '교통정비', '택시', '수리', '정비', '교통'], type: 'traffic' },
  { keywords: ['경찰', '경찰청', '경찰서', '형사', '순경'], type: 'police' },
  { keywords: ['시청', '시장', '운영진', '관리자'], type: 'city_hall' },
]

function getMatchedOrgTypes(q: string): string[] {
  const lower = q.toLowerCase()
  const types = new Set<string>()
  for (const { keywords, type } of orgAliases) {
    if (keywords.some((k) => k.includes(lower) || lower.includes(k))) types.add(type)
  }
  return [...types]
}

type OrgSnippet = { id: string; name: string; color: string | null }
type EventSnippet = { id: string; title: string; type: string | null }

type CharacterResult = {
  id: string
  name: string
  job: string | null
  status: string
  streamers: Pick<Streamer, 'id' | 'display_name'> | null
  primaryOrg: OrgSnippet | null
  recentEvents: EventSnippet[]
}

type StreamerResult = Pick<Streamer, 'id' | 'display_name' | 'profile_image_url' | 'chzzk_channel_id' | 'is_active'> & {
  activeCharacter: {
    id: string
    name: string
    job: string | null
    primaryOrg: OrgSnippet | null
    recentEvents: EventSnippet[]
  } | null
}

type EventResult = {
  id: string
  title: string
  type: string | null
  occurred_at: string | null
  summary: string | null
}

type EventParticipantSearchRow = {
  character_id: string
  events: {
    id: string
    title: string
    type: string | null
    is_published: boolean
    occurred_at: string | null
  } | null
}

type SearchMember = {
  is_primary: boolean
  organizations: OrgSnippet | null
}

type SearchCharacter = {
  id: string
  name: string
  is_name_pending: boolean
  job: string | null
  status: string
  streamers: Pick<Streamer, 'id' | 'display_name'> | null
  organization_members: SearchMember[]
}

type SearchStreamer = Pick<Streamer, 'id' | 'display_name' | 'profile_image_url' | 'chzzk_channel_id' | 'is_active'> & {
  characters: SearchCharacter[]
}

async function buildCharEventMap(
  charIds: string[],
  supabase: ReturnType<typeof createPublicClient>
): Promise<Record<string, EventSnippet[]>> {
  if (charIds.length === 0) return {}
  const { data } = await supabase
    .from('event_participants')
    .select('character_id, events!inner(id, title, type, is_published, occurred_at)')
    .in('character_id', charIds)
    .limit(charIds.length * 3)

  const map: Record<string, EventSnippet[]> = {}
  for (const row of (data ?? []) as unknown as EventParticipantSearchRow[]) {
    const e = row.events
    if (!e?.is_published) continue
    const cid = row.character_id
    if (!map[cid]) map[cid] = []
    if (map[cid].length < 2) map[cid].push({ id: e.id, title: e.title, type: e.type })
  }
  return map
}

async function searchAll(q: string) {
  const supabase = createPublicClient()
  const term = `%${q}%`

  const [streamersRes, charactersRes, orgsRes, eventsRes] = await Promise.all([
  supabase
      .from('streamers')
      .select(`
        id, display_name, profile_image_url, chzzk_channel_id, is_active,
        characters(id, name, is_name_pending, job, status,
          organization_members(is_primary, organizations(id, name, color))
        )
      `)
      .ilike('display_name', term)
      .order('display_name')
      .limit(10),
    supabase
      .from('characters')
      .select(`
        id, name, is_name_pending, job, status,
        streamers(id, display_name),
        organization_members(is_primary, organizations(id, name, color))
      `)
      .ilike('name', term)
      .eq('is_name_pending', false)
      .order('name')
      .limit(10),
    (() => {
      const matchedTypes = getMatchedOrgTypes(q)
      const base = supabase
        .from('organizations')
        .select('id, name, type, category, color, description')
        .eq('is_active', true)
        .order('name')
        .limit(20)
      return matchedTypes.length > 0
        ? base.or(`name.ilike.%${q}%,type.in.(${matchedTypes.join(',')})`)
        : base.ilike('name', term)
    })(),
    supabase
      .from('events')
      .select('id, title, type, occurred_at, summary')
      .eq('is_published', true)
      .or(`title.ilike.${term},summary.ilike.${term}`)
      .order('occurred_at', { ascending: false })
      .limit(10),
  ])

  const rawChars = (charactersRes.data ?? []) as unknown as SearchCharacter[]
  const rawStreamers = (streamersRes.data ?? []) as unknown as SearchStreamer[]

  // 캐릭터 ID 수집 (검색된 캐릭터 + 스트리머의 활동 캐릭터)
  const charIds = [
    ...rawChars.map((c) => c.id),
    ...rawStreamers.flatMap((s) =>
      (s.characters ?? []).filter((c) => c.status === 'active' && !c.is_name_pending).map((c) => c.id)
    ),
  ]
  const charEventMap = await buildCharEventMap([...new Set(charIds)], supabase)

  // 캐릭터 결과 변환
  const characters: CharacterResult[] = rawChars.map((c) => {
    const members = c.organization_members ?? []
    const primaryMember = members.find((m) => m.is_primary) ?? members[0] ?? null
    const org = primaryMember?.organizations ?? null
    return {
      id: c.id,
      name: c.name,
      job: c.job,
      status: c.status,
      streamers: c.streamers ?? null,
      primaryOrg: org ? { id: org.id, name: org.name, color: org.color } : null,
      recentEvents: charEventMap[c.id] ?? [],
    }
  })

  // 스트리머 결과 변환
  const streamers: StreamerResult[] = rawStreamers.map((s) => {
    const activeChar = (s.characters ?? []).find((c) => c.status === 'active' && !c.is_name_pending) ?? null
    let charData = null
    if (activeChar) {
      const members = activeChar.organization_members ?? []
      const primaryMember = members.find((m) => m.is_primary) ?? members[0] ?? null
      const org = primaryMember?.organizations ?? null
      charData = {
        id: activeChar.id,
        name: activeChar.name,
        job: activeChar.job,
        primaryOrg: org ? { id: org.id, name: org.name, color: org.color } : null,
        recentEvents: charEventMap[activeChar.id] ?? [],
      }
    }
    return {
      id: s.id,
      display_name: s.display_name,
      profile_image_url: s.profile_image_url,
      chzzk_channel_id: s.chzzk_channel_id,
      is_active: s.is_active,
      activeCharacter: charData,
    }
  })

  return {
    streamers,
    characters,
    orgs: (orgsRes.data ?? []) as Pick<Organization, 'id' | 'name' | 'type' | 'category' | 'color' | 'description'>[],
    events: (eventsRes.data ?? []) as EventResult[],
  }
}

const searchAllCached = unstable_cache(searchAll, ['wiki-search'], {
  revalidate: WIKI_CACHE_REVALIDATE,
  tags: [WIKI_PUBLIC_TAG, WIKI_CACHE_TAGS.characters, WIKI_CACHE_TAGS.streamers, WIKI_CACHE_TAGS.organizations, WIKI_CACHE_TAGS.events],
})

type Props = { searchParams: Promise<{ q?: string }> }

export default async function SearchPage({ searchParams }: Props) {
  const { q = '' } = await searchParams
  const query = q.trim()

  const { streamers, characters, orgs, events } = query
    ? await searchAllCached(query)
    : { streamers: [], characters: [], orgs: [], events: [] }

  const total = streamers.length + characters.length + orgs.length + events.length

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 space-y-8">
      <div className="space-y-1">
        <h1 className="text-2xl font-black text-white">검색</h1>
        {query ? (
          <p className="text-sm text-zinc-500">
            <span className="text-zinc-300 font-medium">&quot;{query}&quot;</span> 검색 결과{' '}
            <span className="text-white font-bold">{total}</span>건
          </p>
        ) : (
          <p className="text-sm text-zinc-500">캐릭터, 스트리머, 조직, 사건 이름으로 검색하세요.</p>
        )}
      </div>

      {query && total === 0 && (
        <div className="rounded-xl border border-zinc-800 bg-zinc-900 py-20 text-center space-y-2">
          <Search size={32} className="mx-auto text-zinc-700" />
          <p className="text-zinc-500 text-sm">검색 결과가 없습니다.</p>
        </div>
      )}

      {/* 스트리머 */}
      {streamers.length > 0 && (
        <section className="space-y-3">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-bold text-zinc-300">스트리머</h2>
            <span className="rounded-full bg-zinc-800 px-2 py-0.5 text-xs text-zinc-500">{streamers.length}</span>
          </div>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {streamers.map((s) => (
              <div key={s.id} className="flex flex-col rounded-xl border border-zinc-800 bg-zinc-900 overflow-hidden hover:border-zinc-700 transition-colors">
                <div className="flex items-center gap-3 p-3">
                  {s.profile_image_url ? (
                    <AppImage src={s.profile_image_url} alt={s.display_name} className="h-9 w-9 shrink-0 rounded-full object-cover" />
                  ) : (
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-zinc-700 text-xs font-bold text-zinc-400">
                      {s.display_name.charAt(0)}
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <Link href={`/streamers/${s.id}`} className="block truncate text-sm font-medium text-white hover:text-amber-400 transition-colors">
                      {s.display_name}
                    </Link>
                    {!s.is_active && <span className="text-xs text-zinc-600">비활동</span>}
                  </div>
                  <a
                    href={`https://chzzk.naver.com/${s.chzzk_channel_id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="shrink-0 text-zinc-600 hover:text-amber-400 transition-colors"
                  >
                    <ExternalLink size={13} />
                  </a>
                </div>

                {/* 캐릭터 정보 — RedPill 게이트 */}
                <StreamerReveal>
                  {s.activeCharacter && (
                    <div className="border-t border-zinc-800 px-3 py-2.5 space-y-1.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Link href={`/characters/${s.activeCharacter.id}`} className="text-xs font-medium text-zinc-300 hover:text-amber-400 transition-colors">
                          {s.activeCharacter.name}
                        </Link>
                        {s.activeCharacter.job && (
                          <span className="text-xs text-zinc-600">· {s.activeCharacter.job}</span>
                        )}
                        {s.activeCharacter.primaryOrg && (
                          <span
                            className="rounded-full px-2 py-0.5 text-[10px] font-medium"
                            style={{
                              backgroundColor: `${s.activeCharacter.primaryOrg.color ?? '#52525b'}20`,
                              color: s.activeCharacter.primaryOrg.color ?? '#a1a1aa',
                            }}
                          >
                            {s.activeCharacter.primaryOrg.name}
                          </span>
                        )}
                      </div>
                      {s.activeCharacter.recentEvents.length > 0 && (
                        <div className="space-y-0.5">
                          {s.activeCharacter.recentEvents.map((e) => (
                            <Link key={e.id} href={`/events/${e.id}`} className="flex items-center gap-1.5 text-[11px] text-zinc-500 hover:text-zinc-300 transition-colors truncate">
                              {e.type && (
                                <span className={`shrink-0 rounded-full px-1.5 py-0.5 text-[10px] font-medium ${eventTypeColor[e.type]}`}>
                                  {eventTypeLabel[e.type]}
                                </span>
                              )}
                              <span className="truncate">{e.title}</span>
                            </Link>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </StreamerReveal>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* 캐릭터 */}
      {characters.length > 0 && (
        <section className="space-y-3">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-bold text-zinc-300">캐릭터</h2>
            <span className="rounded-full bg-zinc-800 px-2 py-0.5 text-xs text-zinc-500">{characters.length}</span>
          </div>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {characters.map((c) => (
              <Link
                key={c.id}
                href={`/characters/${c.id}`}
                className="flex flex-col rounded-xl border border-zinc-800 bg-zinc-900 overflow-hidden hover:border-amber-400/30 hover:bg-zinc-800/50 transition-colors"
              >
                <div className="flex items-center gap-3 p-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-zinc-700 text-xs font-bold text-zinc-400">
                    {c.name.charAt(0)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-white">{c.name}</p>
                    <div className="flex items-center gap-1.5 flex-wrap mt-0.5">
                      {c.job && <span className="text-xs text-zinc-500">{c.job}</span>}
                      {c.primaryOrg && (
                        <span
                          className="rounded-full px-1.5 py-0.5 text-[10px] font-medium"
                          style={{
                            backgroundColor: `${c.primaryOrg.color ?? '#52525b'}20`,
                            color: c.primaryOrg.color ?? '#a1a1aa',
                          }}
                        >
                          {c.primaryOrg.name}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-1">
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${statusColor[c.status]}`}>
                      {statusLabel[c.status]}
                    </span>
                    {c.streamers && (
                      <StreamerReveal>
                        <span className="text-[10px] text-zinc-600">{c.streamers.display_name}</span>
                      </StreamerReveal>
                    )}
                  </div>
                </div>

                {c.recentEvents.length > 0 && (
                  <div className="border-t border-zinc-800 px-3 py-2 space-y-0.5">
                    {c.recentEvents.map((e) => (
                      <div key={e.id} className="flex items-center gap-1.5 text-[11px] text-zinc-500 truncate">
                        {e.type && (
                          <span className={`shrink-0 rounded-full px-1.5 py-0.5 text-[10px] font-medium ${eventTypeColor[e.type]}`}>
                            {eventTypeLabel[e.type]}
                          </span>
                        )}
                        <span className="truncate">{e.title}</span>
                      </div>
                    ))}
                  </div>
                )}
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* 사건 */}
      {events.length > 0 && (
        <section className="space-y-3">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-bold text-zinc-300">사건</h2>
            <span className="rounded-full bg-zinc-800 px-2 py-0.5 text-xs text-zinc-500">{events.length}</span>
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            {events.map((e) => (
              <Link
                key={e.id}
                href={`/events/${e.id}`}
                className="group flex flex-col gap-2 rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-3 transition-colors hover:border-amber-400/30 hover:bg-zinc-800/50"
              >
                <div className="flex items-center gap-2">
                  {e.type && (
                    <span className={`rounded-full border px-2 py-0.5 text-xs font-medium ${eventTypeColor[e.type]}`}>
                      {eventTypeLabel[e.type]}
                    </span>
                  )}
                  {e.occurred_at && (
                    <span className="ml-auto text-xs text-zinc-600 whitespace-nowrap">
                      {formatKstDate(e.occurred_at)}
                    </span>
                  )}
                </div>
                <p className="text-sm font-semibold text-white group-hover:text-amber-400 transition-colors leading-snug line-clamp-2">
                  {e.title}
                </p>
                {e.summary && (
                  <p className="text-xs text-zinc-500 line-clamp-1 leading-relaxed">{e.summary}</p>
                )}
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* 조직 */}
      {orgs.length > 0 && (
        <section className="space-y-3">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-bold text-zinc-300">조직</h2>
            <span className="rounded-full bg-zinc-800 px-2 py-0.5 text-xs text-zinc-500">{orgs.length}</span>
          </div>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {orgs.map((o) => (
              <Link
                key={o.id}
                href={`/organizations/${o.id}`}
                className="flex items-center gap-3 rounded-xl border border-zinc-800 bg-zinc-900 p-3 hover:border-zinc-700 hover:bg-zinc-800/50 transition-colors"
                style={o.color ? { borderColor: `${o.color}25` } : {}}
              >
                <div
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-sm font-black"
                  style={{ backgroundColor: `${o.color ?? '#52525b'}25`, color: o.color ?? '#a1a1aa' }}
                >
                  {o.name.charAt(0)}
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-white">{o.name}</p>
                  {o.description && (
                    <p className="truncate text-xs text-zinc-500">{o.description}</p>
                  )}
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
