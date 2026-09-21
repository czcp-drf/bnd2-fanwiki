export const revalidate = 86400

import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { unstable_cache } from 'next/cache'
import { createPublicClient } from '@/lib/supabase/public'
import { WIKI_CACHE_REVALIDATE, WIKI_CACHE_TAGS, WIKI_PUBLIC_TAG } from '@/lib/cache/wiki'
import { User, Building2, Skull, Swords, MapPin } from 'lucide-react'
import type { Metadata } from 'next'
import type { Organization } from '@/types/database'
import { StreamerReveal } from '@/components/ui/StreamerMask'
import { typeLabel as eventTypeLabel, typeColor as eventTypeColor } from '@/lib/events'
import AppImage from '@/components/ui/AppImage'
import { groupOrganizationMembers } from '@/lib/data/organization-members'
import BackButton from '@/components/ui/BackButton'
import OrgMiniMapWrapper from './OrgMiniMapWrapper'
import { formatKstDate } from '@/lib/date/kst'

type Props = { params: Promise<{ id: string }> }

type OrgDetail = Organization & {
  gang_id: string | null
  is_disbanded: boolean
  organization_members: Array<{
    role: string | null
    is_primary: boolean
    joined_at: string | null
    left_at: string | null
    sort_order: number
    characters: {
      id: string
      name: string
      alias: string[] | null
      job: string | null
      status: string
      streamers: { id: string; display_name: string } | null
      organization_members: Array<{
        is_primary: boolean
        left_at: string | null
        organizations: { id: string; name: string; color: string | null; emoji: string | null } | null
      }>
    } | null
  }>
}

type BusinessSummary = { id: string; name: string; name_confirmed: boolean; color: string | null; emoji: string | null; type: string | null; is_disbanded: boolean }

const typeLabel: Record<string, string> = {
  police:               '경찰',
  ems:                  'EMS',
  journalist:           '기자',
  traffic:              '교통정비',
  city_hall:            '시청',
  restaurant_chinese:   '중식당',
  restaurant_japanese:  '일식당',
  restaurant_western:   '양식당',
  restaurant_cafe:      '카페',
  tuning:               '튜닝소',
  farming:              '농업',
  fishing:              '어업',
  information_dealer:   '정보상',
  gunsmith:             '총기 제작',
  money_laundering:     '자금 세탁',
  smuggling:            '밀수',
  black_market:         '블랙마켓',
  illegal_medical:      '불법 의료',
  illegal_tuning:       '불법 튜닝',
  other:                '기타',
}

const categoryLabel: Record<string, string> = {
  city_hall:      '시청',
  public_service: '공무직',
  gang:           '갱단',
  business:       '사업체',
  illegal:        '불법 사업체',
}

const categoryColor: Record<string, string> = {
  city_hall:      'text-indigo-400 bg-indigo-400/10 border-indigo-400/20',
  public_service: 'text-blue-400 bg-blue-400/10 border-blue-400/20',
  gang:           'text-orange-400 bg-orange-400/10 border-orange-400/20',
  business:       'text-emerald-400 bg-emerald-400/10 border-emerald-400/20',
  illegal:        'text-red-400 bg-red-400/10 border-red-400/20',
}

const statusLabel: Record<string, string> = {
  active: '활동', dead: '사망', retired: '은퇴', hiatus: '휴식',
}
const statusColor: Record<string, string> = {
  active: 'text-green-400 bg-green-400/10',
  dead: 'text-red-400 bg-red-400/10',
  retired: 'text-zinc-400 bg-zinc-400/10',
  hiatus: 'text-yellow-400 bg-yellow-400/10',
}

async function getOrganization(id: string) {
  const supabase = createPublicClient()

  const { data } = await supabase
    .from('organizations')
    .select(`
      *, gang_id, is_disbanded,
      organization_members (
        role, is_primary, joined_at, left_at, sort_order,
        characters (
          id, name, alias, job, status,
          streamers ( id, display_name ),
          organization_members ( is_primary, left_at, organizations ( id, name, color, emoji ) )
        )
      )
    `)
    .eq('id', id)
    .single()

  if (!data) return null
  const org = data as unknown as OrgDetail

  // 갱단이면 → 운영 중인 사업체 목록 조회
  let businesses: BusinessSummary[] = []
  if (org.category === 'gang') {
    const { data: biz } = await supabase
      .from('organizations')
      .select('id, name, name_confirmed, color, emoji, type, is_disbanded')
      .eq('gang_id', id)
      .order('name')
    businesses = (biz ?? []) as BusinessSummary[]
  }

  return { org, businesses }
}

type OrgEvent = {
  id: string
  title: string
  type: string | null
  occurred_at: string | null
  summary: string | null
}

async function getOrgEvents(orgId: string): Promise<OrgEvent[]> {
  const supabase = createPublicClient()

  const [{ data: members }, { data: organizationEvents }] = await Promise.all([
    supabase
      .from('organization_members')
      .select('character_id')
      .eq('organization_id', orgId),
    supabase
      .from('event_organizations')
      .select('events ( id, title, type, occurred_at, summary, is_published )')
      .eq('organization_id', orgId),
  ])

  const charIds = (members ?? []).map((m: { character_id: string }) => m.character_id)

  // 조직 멤버 캐릭터들이 참여한 공개 사건
  const { data: participantEvents } = charIds.length
    ? await supabase
      .from('event_participants')
      .select('events ( id, title, type, occurred_at, summary, is_published )')
      .in('character_id', charIds)
    : { data: [] }

  const seen = new Set<string>()
  const events: OrgEvent[] = []
  const addEvent = (value: unknown) => {
    const e = value as (OrgEvent & { is_published: boolean }) | null
    if (!e || !e.is_published || seen.has(e.id)) return
    seen.add(e.id)
    events.push(e)
  }

  for (const row of organizationEvents ?? []) {
    addEvent((row as { events: OrgEvent & { is_published: boolean } | null }).events)
  }
  for (const row of participantEvents ?? []) {
    const e = (row as { events: OrgEvent & { is_published: boolean } | null }).events
    addEvent(e)
  }

  return events.sort((a, b) => {
    const da = a.occurred_at ? new Date(a.occurred_at).getTime() : 0
    const db = b.occurred_at ? new Date(b.occurred_at).getTime() : 0
    return db - da
  })
}

const getOrganizationCached = unstable_cache(getOrganization, ['wiki-organization-detail'], {
  revalidate: WIKI_CACHE_REVALIDATE,
  tags: [WIKI_PUBLIC_TAG, WIKI_CACHE_TAGS.organizations, WIKI_CACHE_TAGS.characters],
})
const getOrgEventsCached = unstable_cache(getOrgEvents, ['wiki-organization-events'], {
  revalidate: WIKI_CACHE_REVALIDATE,
  tags: [WIKI_PUBLIC_TAG, WIKI_CACHE_TAGS.organizations, WIKI_CACHE_TAGS.events, WIKI_CACHE_TAGS.characters],
})

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  const result = await getOrganizationCached(id)
  if (!result) return {}
  const { org } = result
  const name = org.name_confirmed ? org.name : typeLabel[org.type ?? ''] ?? '미정'
  const desc = `봉누도2 ${categoryLabel[org.category ?? '']} — ${name}`
  return {
    title: name,
    description: desc,
    openGraph: { title: name, description: desc },
  }
}

export default async function OrganizationDetailPage({ params }: Props) {
  const { id } = await params
  const [result, orgEvents] = await Promise.all([
    getOrganizationCached(id),
    getOrgEventsCached(id),
  ])
  if (!result) notFound()

  const { org, businesses } = result
  if (org.category === 'illegal') {
    redirect(org.gang_id ? `/organizations/${org.gang_id}` : '/organizations')
  }
  const orgName = org.name_confirmed ? org.name : (typeLabel[org.type ?? ''] ?? '미정')
  const { active: activeMembers, inactive: inactiveMembers, former: formerMembers } =
    groupOrganizationMembers(org.organization_members)

  const activeBiz = businesses.filter((b) => !b.is_disbanded)
  const disbandedBiz = businesses.filter((b) => b.is_disbanded)

  return (
    <div className="wiki-theme min-h-[calc(100vh-3.5rem)] px-4 py-10">
      <div className="mx-auto max-w-4xl space-y-8">
        <BackButton />

      {/* 헤더 */}
      <div
        className="rounded-xl border border-zinc-800 bg-zinc-900 p-6 space-y-4"
        style={org.color ? { borderColor: `${org.color}30` } : {}}
      >
        <div className="flex items-start gap-4">
          <div
            className="h-16 w-16 shrink-0 rounded-xl flex items-center justify-center text-2xl font-black"
            style={{ backgroundColor: `${org.color ?? '#52525b'}20`, color: org.color ?? '#a1a1aa' }}
          >
            {org.emoji ? (
              <span aria-label={`${orgName} 대표 이모지`} className="text-3xl leading-none">{org.emoji}</span>
            ) : org.logo_url ? (
              <AppImage src={org.logo_url} alt={orgName} className="h-16 w-16 rounded-xl object-cover" />
            ) : (
              orgName.charAt(0)
            )}
          </div>

          <div className="flex-1 space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-black text-white">{orgName}</h1>
              {!org.name_confirmed && (
                <span className="rounded-full border border-zinc-700 bg-zinc-800 px-2 py-0.5 text-xs text-zinc-500">
                  미정
                </span>
              )}
              {org.is_disbanded && (
                <span className="rounded-full border border-red-900 bg-red-950 px-2 py-0.5 text-xs text-red-500 flex items-center gap-1">
                  <Skull size={10} />
                  해체
                </span>
              )}
            </div>

            <div className="flex flex-wrap gap-2">
              {org.category && (
                <span className={`rounded-full border px-2.5 py-0.5 text-xs font-medium ${categoryColor[org.category]}`}>
                  {categoryLabel[org.category]}
                </span>
              )}
              {org.type && (
                <span className="rounded-full border border-zinc-700 bg-zinc-800 px-2.5 py-0.5 text-xs text-zinc-400">
                  {typeLabel[org.type]}
                </span>
              )}
            </div>

          </div>

          <div className="text-right text-sm text-zinc-500 shrink-0">
            멤버 <span className="text-white font-bold">{activeMembers.length + inactiveMembers.length}</span>명
          </div>
        </div>

        {org.description && (
          <p className="text-sm text-zinc-400 leading-relaxed border-t border-zinc-800 pt-4">
            {org.description}
          </p>
        )}
      </div>

      {/* 거점 미니맵 */}
      {org.hq_x !== null && org.hq_y !== null && (
        <section className="space-y-3">
          <h2 className="flex items-center gap-2 text-base font-bold text-white">
            <MapPin size={15} className="text-zinc-500" />
            위치
          </h2>
          <OrgMiniMapWrapper org={{
            id: org.id,
            name: orgName,
            color: org.color ?? null,
            category: org.category ?? null,
            hq_x: org.hq_x,
            hq_y: org.hq_y,
            hq_label: org.hq_label ?? null,
            biz_x: org.biz_x ?? null,
            biz_y: org.biz_y ?? null,
            biz_label: org.biz_label ?? null,
          }} />
        </section>
      )}

      {/* 갱단 → 운영 사업체 섹션 */}
      {org.category === 'gang' && (activeBiz.length > 0 || disbandedBiz.length > 0) && (
        <section className="space-y-3">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Building2 size={16} className="text-zinc-500" />
            운영 사업체
          </h2>
          <div className="grid gap-2 sm:grid-cols-2">
            {activeBiz.map((b) => (
              <Link
                key={b.id}
                href={`/organizations/${b.id}`}
                className="flex items-center gap-3 rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-3 hover:border-zinc-700 hover:bg-zinc-800/50 transition-colors group"
              >
                <div
                  className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-sm leading-none"
                  style={{ backgroundColor: `${b.color ?? '#52525b'}40` }}
                >
                  {b.emoji ?? ''}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white group-hover:text-amber-400 transition-colors truncate">
                    {b.name_confirmed ? b.name : <span className="text-zinc-500">미정</span>}
                  </p>
                  {b.type && (
                    <p className="text-xs text-zinc-600">{typeLabel[b.type] ?? '기타'}</p>
                  )}
                </div>
                <span className="text-xs text-red-400/60 bg-red-400/10 rounded-full px-2 py-0.5 shrink-0">불법</span>
              </Link>
            ))}
            {disbandedBiz.map((b) => (
              <Link
                key={b.id}
                href={`/organizations/${b.id}`}
                className="flex items-center gap-3 rounded-xl border border-zinc-800 bg-zinc-900/50 px-4 py-3 hover:border-zinc-700 transition-colors opacity-50 group"
              >
                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-zinc-800 text-sm leading-none">
                  {b.emoji ?? ''}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-zinc-500 line-through truncate">
                    {b.name_confirmed ? b.name : '미정'}
                  </p>
                </div>
                <span className="text-xs text-zinc-600 bg-zinc-800 rounded-full px-2 py-0.5 shrink-0">해체</span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* 멤버 목록 */}
      <section className="space-y-4">
        <h2 className="text-base font-bold text-white">소속 멤버</h2>

        {activeMembers.length === 0 && inactiveMembers.length === 0 ? (
          <div className="rounded-xl border border-zinc-800 bg-zinc-900 py-12 text-center text-sm text-zinc-600">
              현재 소속된 멤버가 없습니다.
          </div>
        ) : (
          <div className="space-y-2">
            {activeMembers.map((m, i) => (
              <MemberRow key={i} member={m} />
            ))}
            {inactiveMembers.length > 0 && (
              <>
                <p className="pt-2 text-xs font-medium text-zinc-600">비활동 멤버</p>
                {inactiveMembers.map((m, i) => (
                  <MemberRow key={i} member={m} dim />
                ))}
              </>
            )}
          </div>
        )}
      </section>

        {formerMembers.length > 0 && (
          <section className="space-y-3">
            <h2 className="text-base font-bold text-zinc-400">이전 멤버 <span className="text-sm font-normal text-zinc-500">{formerMembers.length}명</span></h2>
            <div className="space-y-2">
              {formerMembers.map((member) => <MemberRow key={member.characters!.id} member={member} dim />)}
            </div>
          </section>
        )}

        {/* 관련 사건 */}
      <section className="space-y-4">
        <h2 className="flex items-center gap-2 text-base font-bold text-white">
          <Swords size={15} className="text-zinc-500" />
          관련 사건
          <span className="text-sm font-normal text-zinc-500">({orgEvents.length}건)</span>
        </h2>

        {orgEvents.length === 0 ? (
          <p className="text-sm text-zinc-600">관련된 사건이 없습니다.</p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {orgEvents.map((e) => (
              <Link
                key={e.id}
                href={`/events/${e.id}`}
                className="group flex flex-col gap-2 rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-3 transition-colors hover:border-amber-400/30 hover:bg-zinc-800/50"
              >
                <div className="flex flex-wrap items-center gap-2">
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
                  <p className="text-xs text-zinc-500 line-clamp-2 leading-relaxed">{e.summary}</p>
                )}
              </Link>
            ))}
          </div>
        )}
      </section>
      </div>
    </div>
  )
}

function MemberRow({
  member,
  dim = false,
}: {
  member: OrgDetail['organization_members'][number]
  dim?: boolean
}) {
  const c = member.characters
  if (!c) return null

  const primaryOrg = c.organization_members?.find(m => m.is_primary && !m.left_at)?.organizations
    ?? c.organization_members?.find(m => !m.left_at)?.organizations
    ?? null

  return (
    <Link
      href={`/characters/${c.id}`}
      className={`group flex items-center gap-3 rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-3 transition-colors hover:border-zinc-700 hover:bg-zinc-800/50 ${dim ? 'opacity-50' : ''}`}
    >
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-zinc-700 text-xs font-bold text-zinc-400">
        {c.name.charAt(0)}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex flex-wrap items-baseline gap-1.5">
          <span className="text-sm font-semibold text-white group-hover:text-amber-400 transition-colors">
            {c.name}
          </span>
          {c.job === '가이드' && (
            <span className="rounded-full border border-teal-400/30 bg-teal-400/10 px-1.5 py-0.5 text-[10px] font-medium text-teal-400">
              가이드
            </span>
          )}
          {c.alias && c.alias.length > 0 && (
            <span className="text-xs text-zinc-500">{c.alias.join(', ')}</span>
          )}
        </div>
        <div className="flex items-center gap-2 mt-0.5">
          {primaryOrg && <span className="flex items-center gap-1 text-xs text-zinc-500"><span>{primaryOrg.emoji ?? ''}</span>{primaryOrg.name}</span>}
          {member.role && (
            <>
              {primaryOrg && <span className="text-zinc-700">·</span>}
              <span className="text-xs text-zinc-400">{member.role}</span>
            </>
          )}
        </div>
      </div>

      <div className="flex flex-col items-end gap-1.5">
        {member.left_at !== null && <span className="rounded-full border border-zinc-700 px-2 py-0.5 text-xs text-zinc-400">탈퇴</span>}
        <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusColor[c.status]}`}>
          {statusLabel[c.status]}
        </span>
        {c.streamers && (
          <StreamerReveal>
            <span className="flex items-center gap-1 text-[11px] text-zinc-600">
              <User size={10} />
              {c.streamers.display_name}
            </span>
          </StreamerReveal>
        )}
      </div>
    </Link>
  )
}
