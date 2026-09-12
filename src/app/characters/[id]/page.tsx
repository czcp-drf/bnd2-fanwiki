export const revalidate = 300

import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { ChevronLeft, ExternalLink, Users, Calendar, Swords, MapPin } from 'lucide-react'
import type { Metadata } from 'next'
import { StreamerReveal } from '@/components/ui/StreamerMask'
import { typeLabel, typeColor } from '@/lib/events'
import AppImage from '@/components/ui/AppImage'
import OrgMiniMapWrapper from '@/app/organizations/[id]/OrgMiniMapWrapper'

type Props = { params: Promise<{ id: string }> }

type CharacterDetail = {
  id: string
  name: string
  alias: string[] | null
  avatar_url: string | null
  job: string | null
  description: string | null
  status: string
  first_appeared: string | null
  streamers: {
    id: string
    display_name: string
    chzzk_channel_id: string
    profile_image_url: string | null
  } | null
  organization_members: Array<{
    role: string | null
    is_primary: boolean
    joined_at: string | null
    left_at: string | null
    organizations: {
      id: string
      name: string
      name_confirmed: boolean
      type: string | null
      category: string | null
      color: string | null
      description: string | null
      hq_x: number | null
      hq_y: number | null
      hq_label: string | null
      biz_x: number | null
      biz_y: number | null
      biz_label: string | null
    } | null
  }>
}

type RelationshipRow = {
  id: string
  type: string
  description: string | null
  character_a_id: string
  character_b_id: string
  character_a: { id: string; name: string; job: string | null; status: string } | null
  character_b: { id: string; name: string; job: string | null; status: string } | null
}

async function getCharacter(id: string): Promise<CharacterDetail | null> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('characters')
    .select(`
      *,
      streamers ( id, display_name, chzzk_channel_id, profile_image_url ),
      organization_members (
        role,
        is_primary,
        joined_at,
        left_at,
        organizations ( id, name, name_confirmed, type, category, color, description, hq_x, hq_y, hq_label, biz_x, biz_y, biz_label )
      )
    `)
    .eq('id', id)
    .single()

  return data as unknown as CharacterDetail | null
}

type CharacterEvent = {
  role: string | null
  events: {
    id: string
    title: string
    type: string | null
    occurred_at: string | null
    summary: string | null
    is_published: boolean
  } | null
}

async function getCharacterEvents(id: string): Promise<CharacterEvent[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('event_participants')
    .select(`role, events ( id, title, type, occurred_at, summary, is_published )`)
    .eq('character_id', id)
  return (data ?? []) as unknown as CharacterEvent[]
}

async function getRelationships(id: string): Promise<RelationshipRow[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('character_relationships')
    .select(`
      id,
      type,
      description,
      character_a_id,
      character_b_id,
      character_a:characters!character_a_id ( id, name, job, status ),
      character_b:characters!character_b_id ( id, name, job, status )
    `)
    .or(`character_a_id.eq.${id},character_b_id.eq.${id}`)

  return (data ?? []) as unknown as RelationshipRow[]
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  const character = await getCharacter(id)
  if (!character) return {}
  return {
    title: character.name,
    description: `${character.name} — ${character.job ?? '봉누도2 RP 캐릭터'}`,
    openGraph: {
      title: character.name,
      description: `${character.name} — ${character.job ?? '봉누도2 RP 캐릭터'}`,
      ...(character.avatar_url ? { images: [character.avatar_url] } : {}),
    },
  }
}

const statusLabel: Record<string, string> = {
  active: '활동',
  dead: '사망',
  retired: '은퇴',
  hiatus: '휴식',
}

const statusColor: Record<string, string> = {
  active: 'text-green-400 bg-green-400/10 border-green-400/20',
  dead: 'text-red-400 bg-red-400/10 border-red-400/20',
  retired: 'text-zinc-400 bg-zinc-400/10 border-zinc-400/20',
  hiatus: 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20',
}

const relationTypeLabel: Record<string, string> = {
  friend: '친구',
  enemy: '적',
  rival: '라이벌',
  family: '가족',
  romantic: '연인',
  ally: '동맹',
  mentor: '사제',
  neutral: '중립',
}

const relationTypeColor: Record<string, string> = {
  friend: 'text-blue-400 bg-blue-400/10',
  enemy: 'text-red-400 bg-red-400/10',
  rival: 'text-orange-400 bg-orange-400/10',
  family: 'text-purple-400 bg-purple-400/10',
  romantic: 'text-pink-400 bg-pink-400/10',
  ally: 'text-green-400 bg-green-400/10',
  mentor: 'text-yellow-400 bg-yellow-400/10',
  neutral: 'text-zinc-400 bg-zinc-400/10',
}

const orgTypeLabel: Record<string, string> = {
  police: '경찰',
  gang: '갱단',
  medical: '의료',
  legal: '법조',
  government: '정부',
  civilian: '민간',
  other: '기타',
}

export default async function CharacterDetailPage({ params }: Props) {
  const { id } = await params
  const [character, relationships, participations] = await Promise.all([
    getCharacter(id),
    getRelationships(id),
    getCharacterEvents(id),
  ])

  if (!character) notFound()

  const activeOrgs = character.organization_members.filter((m) => !m.left_at)
  const pastOrgs = character.organization_members.filter((m) => m.left_at)

  // 미니맵용: 주소속 우선, 없으면 첫 번째 활성 소속 중 거점 좌표 있는 곳
  const mapOrg = (
    activeOrgs.find((m) => m.is_primary && m.organizations?.hq_x !== null) ??
    activeOrgs.find((m) => m.organizations?.hq_x !== null)
  )?.organizations ?? null

  const events = participations
    .filter(p => p.events?.is_published)
    .sort((a, b) => {
      const da = a.events?.occurred_at ? new Date(a.events.occurred_at).getTime() : 0
      const db = b.events?.occurred_at ? new Date(b.events.occurred_at).getTime() : 0
      return db - da
    })

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 space-y-8">
      {/* 뒤로가기 */}
      <Link
        href="/characters"
        className="inline-flex items-center gap-1 text-sm text-zinc-500 hover:text-zinc-300 transition-colors"
      >
        <ChevronLeft size={16} />
        캐릭터 위키
      </Link>

      {/* 프로필 헤더 */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-900 overflow-hidden">
        <div className="bg-gradient-to-r from-zinc-800 to-zinc-900 px-6 py-8 flex flex-col gap-4 sm:flex-row sm:items-center">
          {character.avatar_url ? (
            <AppImage
              src={character.avatar_url}
              alt={character.name}
              className="h-24 w-24 shrink-0 rounded-full object-cover ring-2 ring-zinc-700"
            />
          ) : (
            <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-full bg-zinc-700 text-3xl font-black text-zinc-400 ring-2 ring-zinc-700">
              {character.name.charAt(0)}
            </div>
          )}

          <div className="flex-1 space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-black text-white">{character.name}</h1>
              <span className={`rounded-full border px-2.5 py-0.5 text-xs font-medium ${statusColor[character.status]}`}>
                {statusLabel[character.status]}
              </span>
            </div>

            {character.alias && character.alias.length > 0 && (
              <p className="text-sm text-zinc-400">
                별명: {character.alias.join(', ')}
              </p>
            )}

            {character.job && (
              <p className="text-sm text-zinc-300 font-medium">{character.job}</p>
            )}

            <div className="flex flex-wrap items-center gap-3 pt-1 text-xs text-zinc-500">
              {character.first_appeared && (
                <span className="flex items-center gap-1">
                  <Calendar size={11} />
                  {new Date(character.first_appeared).toLocaleDateString('ko-KR')} 첫 등장
                </span>
              )}
              {character.streamers && (
                <StreamerReveal>
                  <span className="flex items-center gap-1">
                    <Users size={11} />
                    {character.streamers.display_name}
                  </span>
                </StreamerReveal>
              )}
            </div>
          </div>

          {/* 스트리머 링크 */}
          {character.streamers && (
            <StreamerReveal>
            <div className="flex flex-col gap-2 shrink-0">
              <Link
                href={`/streamers/${character.streamers.id}`}
                className="flex items-center gap-2 rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-xs font-medium text-zinc-300 hover:border-zinc-600 hover:text-white transition-colors"
              >
                {character.streamers.profile_image_url ? (
                  <AppImage
                    src={character.streamers.profile_image_url}
                    alt={character.streamers.display_name}
                    className="h-5 w-5 rounded-full"
                  />
                ) : (
                  <div className="h-5 w-5 rounded-full bg-zinc-600 flex items-center justify-center text-[10px] font-bold">
                    {character.streamers.display_name.charAt(0)}
                  </div>
                )}
                {character.streamers.display_name}
              </Link>
              <a
                href={`https://chzzk.naver.com/${character.streamers.chzzk_channel_id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-1.5 rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-xs font-medium text-zinc-400 hover:border-amber-400/40 hover:text-amber-400 transition-colors"
              >
                <ExternalLink size={11} />
                치지직
              </a>
            </div>
            </StreamerReveal>
          )}
        </div>

        {/* 소개 */}
        {character.description && (
          <div className="border-t border-zinc-800 px-6 py-4">
            <p className="text-sm text-zinc-400 leading-relaxed whitespace-pre-line">
              {character.description}
            </p>
          </div>
        )}
      </div>

      {/* 거점 미니맵 */}
      {mapOrg && mapOrg.hq_x !== null && mapOrg.hq_y !== null && (
        <section className="space-y-3">
          <h2 className="flex items-center gap-2 text-base font-bold text-white">
            <MapPin size={15} className="text-zinc-500" />
            위치
          </h2>
          <OrgMiniMapWrapper org={{
            id: mapOrg.id,
            name: mapOrg.name_confirmed ? mapOrg.name : (mapOrg.name ?? ''),
            color: mapOrg.color,
            category: mapOrg.category,
            hq_x: mapOrg.hq_x,
            hq_y: mapOrg.hq_y,
            hq_label: mapOrg.hq_label,
            biz_x: mapOrg.biz_x,
            biz_y: mapOrg.biz_y,
            biz_label: mapOrg.biz_label,
          }} />
        </section>
      )}

      <div className="grid gap-8 lg:grid-cols-2">
        {/* 소속 조직 */}
        <section className="space-y-4">
          <h2 className="text-base font-bold text-white">소속 조직</h2>

          {activeOrgs.length === 0 ? (
            <p className="text-sm text-zinc-600">소속 없음</p>
          ) : (
            <div className="space-y-2">
              {activeOrgs.map((m, i) => (
                <div
                  key={i}
                  className="flex items-center gap-3 rounded-xl border border-zinc-800 bg-zinc-900 p-4"
                  style={m.organizations?.color ? { borderColor: `${m.organizations.color}30` } : {}}
                >
                  <div
                    className="h-8 w-1 shrink-0 rounded-full"
                    style={{ backgroundColor: m.organizations?.color ?? '#52525b' }}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Link
                        href={`/organizations/${m.organizations?.id}`}
                        className="font-semibold text-white hover:text-amber-400 transition-colors text-sm"
                      >
                        {m.organizations?.name}
                      </Link>
                      {m.organizations?.type && (
                        <span className="text-xs text-zinc-500">
                          {orgTypeLabel[m.organizations.type]}
                        </span>
                      )}
                    </div>
                    {m.role && (
                      <p className="text-xs text-zinc-500 mt-0.5">{m.role}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {pastOrgs.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs text-zinc-600 font-medium">과거 소속</p>
              {pastOrgs.map((m, i) => (
                <div key={i} className="flex items-center gap-3 rounded-xl border border-zinc-800/50 bg-zinc-900/50 p-3 opacity-60">
                  <div className="h-6 w-1 shrink-0 rounded-full bg-zinc-700" />
                  <div>
                    <p className="text-sm text-zinc-400">{m.organizations?.name}</p>
                    {m.role && <p className="text-xs text-zinc-600">{m.role}</p>}
                  </div>
                  {m.left_at && (
                    <p className="ml-auto text-xs text-zinc-600">
                      ~{new Date(m.left_at).toLocaleDateString('ko-KR')}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>

        {/* 관계도 */}
        <section className="space-y-4">
          <h2 className="text-base font-bold text-white">인물 관계</h2>

          {relationships.length === 0 ? (
            <p className="text-sm text-zinc-600">등록된 관계 없음</p>
          ) : (
            <div className="space-y-2">
              {relationships.map((r) => {
                const other = r.character_a_id === id ? r.character_b : r.character_a

                return (
                  <div key={r.id} className="flex items-center gap-3 rounded-xl border border-zinc-800 bg-zinc-900 p-3">
                    <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium ${relationTypeColor[r.type]}`}>
                      {relationTypeLabel[r.type]}
                    </span>
                    <div className="flex-1 min-w-0">
                      {other ? (
                        <Link
                          href={`/characters/${other.id}`}
                          className="text-sm font-medium text-zinc-200 hover:text-amber-400 transition-colors"
                        >
                          {other.name}
                          {other.job && (
                            <span className="ml-1.5 text-xs text-zinc-500 font-normal">{other.job}</span>
                          )}
                        </Link>
                      ) : (
                        <span className="text-sm text-zinc-500">알 수 없음</span>
                      )}
                      {r.description && (
                        <p className="mt-0.5 text-xs text-zinc-600 line-clamp-1">{r.description}</p>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </section>
      </div>

      {/* 참여 사건 */}
      <section className="space-y-4">
        <h2 className="flex items-center gap-2 text-base font-bold text-white">
          <Swords size={15} className="text-zinc-500" />
          참여 사건
          <span className="text-sm font-normal text-zinc-500">({events.length}건)</span>
        </h2>

        {events.length === 0 ? (
          <p className="text-sm text-zinc-600">참여한 사건이 없습니다.</p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {events.map(({ role, events: e }) => {
              if (!e) return null
              return (
                <Link
                  key={e.id}
                  href={`/events/${e.id}`}
                  className="group flex flex-col gap-2 rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-3 transition-colors hover:border-amber-400/30 hover:bg-zinc-800/50"
                >
                  <div className="flex flex-wrap items-center gap-2">
                    {e.type && (
                      <span className={`rounded-full border px-2 py-0.5 text-xs font-medium ${typeColor[e.type]}`}>
                        {typeLabel[e.type]}
                      </span>
                    )}
                    {role && (
                      <span className="rounded-full bg-zinc-800 px-2 py-0.5 text-xs text-zinc-400">
                        {role}
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
              )
            })}
          </div>
        )}
      </section>
    </div>
  )
}
