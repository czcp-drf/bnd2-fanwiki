export const revalidate = 300

import Link from 'next/link'
import { Suspense } from 'react'
import { createClient } from '@/lib/supabase/server'
import { Users } from 'lucide-react'
import type { Metadata } from 'next'
import CharacterFilters from '@/components/characters/CharacterFilters'
import type { Character, Streamer, Organization } from '@/types/database'
import { getOrganizationFilterOptions } from '@/lib/data/organizations'
import { StreamerReveal } from '@/components/ui/StreamerMask'
import AppImage from '@/components/ui/AppImage'

export const metadata: Metadata = {
  title: '캐릭터 위키',
  description: '봉누도2 서버의 모든 RP 캐릭터 정보',
}

type CharacterWithRelations = Character & {
  streamers: Pick<Streamer, 'id' | 'display_name' | 'chzzk_channel_id'> | null
  organization_members: Array<{
    is_primary: boolean
    role: string | null
    organizations: Pick<Organization, 'id' | 'name' | 'color'> | null
  }>
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

async function getCharacters(status: string, orgId: string, sort: string) {
  const supabase = await createClient()

  let query = supabase
    .from('characters')
    .select(`
      *,
      streamers ( id, display_name, chzzk_channel_id ),
      organization_members (
        is_primary,
        role,
        organizations ( id, name, color )
      )
    `)
    .order(
      sort === 'latest' || sort === 'oldest' ? 'created_at' : 'name',
      { ascending: sort === 'name' || sort === 'oldest' }
    )

  if (status) query = query.eq('status', status)

  const { data } = await query
  let characters = (data ?? []) as unknown as CharacterWithRelations[]

  // 조직 필터
  if (orgId === '__none__') {
    characters = characters.filter((c) => c.organization_members.length === 0)
  } else if (orgId) {
    characters = characters.filter((c) =>
      c.organization_members.some((m) => m.organizations?.id === orgId)
    )
  }

  return characters
}

type Props = {
  searchParams: Promise<{ status?: string; org?: string; sort?: string }>
}

export default async function CharactersPage({ searchParams }: Props) {
  const { status = '', org = '', sort = 'name' } = await searchParams
  const [organizations, characters] = await Promise.all([
    getOrganizationFilterOptions(),
    getCharacters(status, org, sort),
  ])

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 space-y-8">
      {/* 헤더 */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-black text-white">캐릭터 위키</h1>
          <p className="text-sm text-zinc-500">
            봉누도2 서버에 등장하는 RP 캐릭터 정보입니다.
          </p>
        </div>
        <span className="text-sm text-zinc-500">
          총 <span className="text-white font-bold">{characters.length}</span>명
        </span>
      </div>

      {/* 필터 */}
      <Suspense>
        <CharacterFilters organizations={organizations} />
      </Suspense>

      {/* 캐릭터 그리드 */}
      {characters.length === 0 ? (
        <div className="rounded-xl border border-zinc-800 bg-zinc-900 py-20 text-center text-zinc-500 text-sm">
          조건에 맞는 캐릭터가 없습니다.
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {characters.map((c) => {
            const primaryMember = c.organization_members.find((m) => m.is_primary)
            const primaryOrg = primaryMember?.organizations
            const allOrgs = c.organization_members
              .map((m) => m.organizations)
              .filter(Boolean)

            return (
              <Link
                key={c.id}
                href={`/characters/${c.id}`}
                className="group flex flex-col gap-3 rounded-xl border border-zinc-800 bg-zinc-900 p-5 transition-colors hover:border-amber-400/40 hover:bg-zinc-800/50"
              >
                {/* 상단: 이름 + 상태 */}
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 space-y-0.5">
                    <div className="flex flex-wrap items-baseline gap-1.5">
                      {c.avatar_url ? (
                        <AppImage
                          src={c.avatar_url}
                          alt={c.name}
                          className="h-8 w-8 rounded-full object-cover shrink-0"
                        />
                      ) : (
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-zinc-700 text-xs font-bold text-zinc-400">
                          {c.name.charAt(0)}
                        </div>
                      )}
                      <p className="font-bold text-white group-hover:text-amber-400 transition-colors truncate">
                        {c.name}
                      </p>
                    </div>
                    {c.alias && c.alias.length > 0 && (
                      <p className="text-xs text-zinc-500 truncate pl-9">
                        {c.alias.join(' · ')}
                      </p>
                    )}
                  </div>
                  <span className={`shrink-0 rounded-full border px-2 py-0.5 text-xs font-medium ${statusColor[c.status]}`}>
                    {statusLabel[c.status]}
                  </span>
                </div>

                {/* 직업 / 직급 */}
                {(primaryMember?.role || c.job) && (
                  <p className="text-sm text-zinc-400">
                    {primaryMember?.role ?? c.job}
                  </p>
                )}

                {/* 설명 */}
                {c.description && (
                  <p className="text-xs text-zinc-500 line-clamp-2">{c.description}</p>
                )}

                {/* 조직 */}
                {allOrgs.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {allOrgs.map((org, i) =>
                      org ? (
                        <span
                          key={i}
                          className="rounded-full border border-zinc-700 px-2 py-0.5 text-xs text-zinc-400"
                          style={org.color ? { borderColor: `${org.color}50`, color: org.color } : {}}
                        >
                          {org.name}
                        </span>
                      ) : null
                    )}
                  </div>
                )}

                {/* 스트리머 */}
                {c.streamers && (
                  <StreamerReveal>
                    <div className="mt-auto flex items-center gap-1.5 border-t border-zinc-800 pt-3">
                      <Users size={11} className="text-zinc-600" />
                      <span className="text-xs text-zinc-500">{c.streamers.display_name}</span>
                    </div>
                  </StreamerReveal>
                )}
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
