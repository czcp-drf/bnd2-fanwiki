'use client'

import { useState, useMemo, useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Search, X, ExternalLink } from 'lucide-react'
import { cn } from '@/lib/utils'
import Select, { type SelectOption } from '@/components/ui/Select'
import AppImage from '@/components/ui/AppImage'
import { useRedPill } from '@/lib/context/RedPillContext'
import type { Character, Streamer, Organization } from '@/types/database'
import type { OrganizationFilterOption } from '@/lib/data/organizations'

type CharacterWithRelations = Character & {
  streamers: Pick<Streamer, 'id' | 'display_name' | 'chzzk_channel_id' | 'profile_image_url'> | null
  organization_members: Array<{
    is_primary: boolean
    role: string | null
    organizations: Pick<Organization, 'id' | 'name' | 'color'> | null
  }>
}

type OrgOption = OrganizationFilterOption

const sortOptions: SelectOption[] = [
  { value: 'name', label: '이름순' },
  { value: 'name_desc', label: '이름 역순' },
  { value: 'latest', label: '최신 등록순' },
  { value: 'oldest', label: '오래된 순' },
]

const categoryLabel: Record<string, string> = {
  city_hall: '시청',
  public_service: '공무직',
  gang: '갱단',
  business: '사업체',
}
const categoryOrder = ['city_hall', 'public_service', 'gang', 'business']

function buildOrgOptions(organizations: OrgOption[]): SelectOption[] {
  const grouped: Record<string, OrgOption[]> = {}
  for (const o of organizations) {
    const cat = o.category ?? 'other'
    if (!grouped[cat]) grouped[cat] = []
    grouped[cat].push(o)
  }

  const opts: SelectOption[] = [
    { value: '', label: '전체 조직' },
    { value: '__none__', label: '무소속' },
  ]

  for (const cat of categoryOrder) {
    const list = grouped[cat]
    if (!list?.length) continue
    opts.push({ separator: true, label: categoryLabel[cat] ?? cat })
    for (const o of list) opts.push({ value: o.id, label: o.name })
  }
  for (const cat of Object.keys(grouped)) {
    if (categoryOrder.includes(cat)) continue
    const list = grouped[cat]
    if (!list?.length) continue
    opts.push({ separator: true, label: cat })
    for (const o of list) opts.push({ value: o.id, label: o.name })
  }

  return opts
}

export default function CharactersClientSection({
  allCharacters,
  organizations,
}: {
  allCharacters: CharacterWithRelations[]
  organizations: OrgOption[]
}) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [search, setSearch] = useState('')
  const { isRedPill } = useRedPill()

  const org = searchParams.get('org') ?? ''
  const sort = searchParams.get('sort') ?? 'name'

  const updateParam = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString())
      if (value) params.set(key, value)
      else params.delete(key)
      const query = params.toString()
      router.push(`/characters${query ? `?${query}` : ''}`, { scroll: false })
    },
    [router, searchParams]
  )

  const filtered = useMemo(() => {
    let result = allCharacters

    // org filter
    if (org === '__none__') {
      result = result.filter((c) => c.organization_members.length === 0)
    } else if (org) {
      result = result.filter((c) =>
        c.organization_members.some((m) => m.organizations?.id === org)
      )
    }

    // search filter
    const q = search.trim().toLowerCase()
    if (q) {
      result = result.filter((c) => {
        if (c.name.toLowerCase().includes(q)) return true
        if (c.alias?.some((a) => a.toLowerCase().includes(q))) return true
        if (isRedPill && c.streamers?.display_name.toLowerCase().includes(q)) return true
        return false
      })
    }

    // sort
    const sorted = [...result]
    if (sort === 'latest') sorted.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    else if (sort === 'oldest') sorted.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
    else if (sort === 'name_desc') sorted.sort((a, b) => b.name.localeCompare(a.name, 'ko'))
    else sorted.sort((a, b) => a.name.localeCompare(b.name, 'ko'))

    return sorted
  }, [allCharacters, org, sort, search, isRedPill])

  const orgOptions = useMemo(() => buildOrgOptions(organizations), [organizations])

  return (
    <div className="space-y-6">
      {/* 검색 + 필터 */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:flex-wrap">
        {/* 검색창 */}
        <div className="relative flex-1 min-w-48">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={isRedPill ? '이름, 별명 또는 스트리머 검색...' : '이름 또는 별명 검색...'}
            className="w-full rounded-lg border border-zinc-800 bg-zinc-900 py-2 pl-8 pr-8 text-sm text-white placeholder:text-zinc-600 focus:border-amber-400/50 focus:outline-none"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300"
            >
              <X size={13} />
            </button>
          )}
        </div>

        {/* 조직 필터 */}
        {organizations.length > 0 && (
          <Select
            value={org}
            onChange={(v) => updateParam('org', v)}
            options={orgOptions}
          />
        )}

        {/* 정렬 */}
        <Select
          value={sort}
          onChange={(v) => updateParam('sort', v)}
          options={sortOptions}
        />
      </div>

      {/* 결과 수 */}
      <p className="text-sm text-zinc-500">
        총 <span className="text-white font-bold">{filtered.length}</span>명
        {search.trim() && (
          <span className="ml-1 text-zinc-600">
            (전체 {allCharacters.length}명 중)
          </span>
        )}
      </p>

      {/* 캐릭터 그리드 */}
      {filtered.length === 0 ? (
        <div className="rounded-xl border border-zinc-800 bg-zinc-900 py-20 text-center text-zinc-500 text-sm">
          조건에 맞는 캐릭터가 없습니다.
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((c) => {
            const primaryMember = c.organization_members.find((m) => m.is_primary)
            const allOrgs = c.organization_members.map((m) => m.organizations).filter(Boolean)

            return (
              <div
                key={c.id}
                className={`group relative flex flex-col gap-3 rounded-xl border border-zinc-800 bg-zinc-900 p-5 transition-colors hover:border-amber-400/40 hover:bg-zinc-800/50${c.streamers ? ' min-h-[7rem]' : ''}`}
              >
                {/* 카드 전체 링크 (캐릭터 상세) */}
                <Link href={`/characters/${c.id}`} className="absolute inset-0 rounded-xl" aria-label={c.name} />

                {/* 스트리머 — 우측 상단 절대 위치 (레이아웃 흐름 비영향) */}
                {c.streamers && (
                  <div className={`absolute top-5 right-5 flex flex-col items-end gap-1.5 ${isRedPill ? '' : 'invisible'}`}>
                    <Link
                      href={`/streamers/${c.streamers.id}`}
                      className="relative z-10 flex items-center gap-2 rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-xs font-medium text-zinc-300 hover:border-zinc-600 hover:text-white transition-colors"
                    >
                      {c.streamers.profile_image_url ? (
                        <AppImage
                          src={c.streamers.profile_image_url}
                          alt={c.streamers.display_name}
                          className="h-5 w-5 rounded-full object-cover shrink-0"
                        />
                      ) : (
                        <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-zinc-600 text-[10px] font-bold">
                          {c.streamers.display_name.charAt(0)}
                        </div>
                      )}
                      {c.streamers.display_name}
                    </Link>
                    <a
                      href={`https://chzzk.naver.com/${c.streamers.chzzk_channel_id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="relative z-10 flex items-center justify-center gap-1.5 rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-xs font-medium text-zinc-400 hover:border-amber-400/40 hover:text-amber-400 transition-colors"
                    >
                      <ExternalLink size={11} />
                      치지직
                    </a>
                  </div>
                )}

                {/* 이름 — 스트리머 있으면 우측 여백 확보 */}
                <div className={`min-w-0 space-y-0.5 ${c.streamers ? 'pr-28' : ''}`}>
                  <div className="flex items-center gap-1.5">
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
                    {c.job === '가이드' && (
                      <span className="shrink-0 rounded-full border border-teal-400/30 bg-teal-400/10 px-1.5 py-0.5 text-[10px] font-medium text-teal-400">
                        가이드
                      </span>
                    )}
                  </div>
                  {c.alias && c.alias.length > 0 && (
                    <p className="text-xs text-zinc-500 truncate pl-9">
                      {c.alias.join(' · ')}
                    </p>
                  )}
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
                    {allOrgs.map((o, i) =>
                      o ? (
                        <span
                          key={i}
                          className="rounded-full border border-zinc-700 px-2 py-0.5 text-xs text-zinc-400"
                          style={o.color ? { borderColor: `${o.color}50`, color: o.color } : {}}
                        >
                          {o.name}
                        </span>
                      ) : null
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
