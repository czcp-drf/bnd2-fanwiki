export const revalidate = 300

import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { ChevronLeft, User, Building2, Skull, Swords, MapPin } from 'lucide-react'
import type { Metadata } from 'next'
import type { Organization } from '@/types/database'
import { StreamerReveal } from '@/components/ui/StreamerMask'
import { typeLabel as eventTypeLabel, typeColor as eventTypeColor } from '@/lib/events'
import AppImage from '@/components/ui/AppImage'
import OrgMiniMapWrapper from './OrgMiniMapWrapper'

type Props = { params: Promise<{ id: string }> }

type OrgDetail = Organization & {
  gang_id: string | null
  is_disbanded: boolean
  organization_members: Array<{
    role: string | null
    is_primary: boolean
    joined_at: string | null
    sort_order: number
    characters: {
      id: string
      name: string
      alias: string[] | null
      job: string | null
      status: string
      streamers: { id: string; display_name: string } | null
    } | null
  }>
}

type BusinessSummary = { id: string; name: string; name_confirmed: boolean; color: string | null; type: string | null; is_disbanded: boolean }

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
  const supabase = await createClient()

  const { data } = await supabase
    .from('organizations')
    .select(`
      *, gang_id, is_disbanded,
      organization_members (
        role, is_primary, joined_at, sort_order,
        characters (
          id, name, alias, job, status,
          streamers ( id, display_name )
        )
      )
    `)
    .eq('id', id)
    .single()

  if (!data) return null
  const org = data as unknown as OrgDetail

  // 불법 사업체는 별도 상세 페이지 없음 → 갱단 페이지 또는 목록으로
  if (org.category === 'illegal') {
    redirect(org.gang_id ? `/organizations/${org.gang_id}` : '/organizations')
  }

  // 갱단이면 → 운영 중인 사업체 목록 조회
  let businesses: BusinessSummary[] = []
  if (org.category === 'gang') {
    const { data: biz } = await supabase
      .from('organizations')
      .select('id, name, name_confirmed, color, type, is_disbanded')
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
  const supabase = await createClient()

  // 조직 멤버 캐릭터 ID 목록
  const { data: members } = await supabase
    .from('organization_members')
    .select('character_id')
    .eq('organization_id', orgId)

  const charIds = (members ?? []).map((m: { character_id: string }) => m.character_id)
  if (charIds.length === 0) return []

  // 해당 캐릭터들이 참여한 공개 사건
  const { data } = await supabase
    .from('event_participants')
    .select('events ( id, title, type, occurred_at, summary, is_published )')
    .in('character_id', charIds)

  const seen = new Set<string>()
  const events: OrgEvent[] = []
  for (const row of data ?? []) {
    const e = (row as { events: OrgEvent & { is_published: boolean } | null }).events
    if (!e || !e.is_published || seen.has(e.id)) continue
    seen.add(e.id)
    events.push(e)
  }

  return events.sort((a, b) => {
    const da = a.occurred_at ? new Date(a.occurred_at).getTime() : 0
    const db = b.occurred_at ? new Date(b.occurred_at).getTime() : 0
    return db - da
  })
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  const result = await getOrganization(id)
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
    getOrganization(id),
    getOrgEvents(id),
  ])
  if (!result) notFound()

  const { org, businesses } = result
  const orgName = org.name_confirmed ? org.name : (typeLabel[org.type ?? ''] ?? '미정')
  const activeMembers = org.organization_members
    .filter((m) => m.characters?.status === 'active')
    .sort((a, b) => a.sort_order - b.sort_order)
  const inactiveMembers = org.organization_members
    .filter((m) => m.characters && m.characters.status !== 'active')
    .sort((a, b) => a.sort_order - b.sort_order)

  const activeBiz = businesses.filter((b) => !b.is_disbanded)
  const disbandedBiz = businesses.filter((b) => b.is_disbanded)

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 space-y-8">
      <Link
        href="/organizations"
        className="inline-flex items-center gap-1 text-sm text-zinc-500 hover:text-zinc-300 transition-colors"
      >
        <ChevronLeft size={16} />
        조직 목록
      </Link>

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
            {org.logo_url ? (
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
            멤버 <span className="text-white font-bold">{activeMembers.length}</span>명
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
                  className="h-6 w-6 shrink-0 rounded-full"
                  style={{ backgroundColor: `${b.color ?? '#52525b'}40` }}
                />
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
                <div className="h-6 w-6 shrink-0 rounded-full bg-zinc-800" />
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
            등록된 멤버가 없습니다.
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
                      {new Date(e.occurred_at).toLocaleDateString('ko-KR', {
                        year: 'numeric', month: 'long', day: 'numeric',
                      })}
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
          {c.alias && c.alias.length > 0 && (
            <span className="text-xs text-zinc-500">{c.alias.join(', ')}</span>
          )}
        </div>
        <div className="flex items-center gap-2 mt-0.5">
          {c.job && <span className="text-xs text-zinc-500">{c.job}</span>}
          {member.role && (
            <>
              {c.job && <span className="text-zinc-700">·</span>}
              <span className="text-xs text-zinc-400">{member.role}</span>
            </>
          )}
        </div>
      </div>

      <div className="flex flex-col items-end gap-1.5">
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
