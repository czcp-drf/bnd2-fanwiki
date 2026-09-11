'use client'

import { useState, useMemo } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Search, X } from 'lucide-react'
import CharacterEditRow from './CharacterEditRow'

const columns = [
  { key: 'streamer', field: 'streamer_display_name', label: '스트리머' },
  { key: 'name', field: 'name', label: 'RP명' },
  { key: 'job', field: 'job', label: '직업' },
  { key: 'status', field: 'status', label: '상태' },
  { key: 'org', field: 'org_name', label: '소속' },
] as const

const statusLabels: Record<string, string> = {
  active: '활동', dead: '사망', retired: '은퇴', hiatus: '휴식',
}

const categoryLabel: Record<string, string> = {
  city_hall: '시청', public_service: '공무직', gang: '갱단', business: '사업체', illegal: '불법',
}

type Character = {
  id: string
  created_at: string
  name: string
  job: string | null
  status: string
  streamer_display_name: string
  org_id: string | null
  org_role: string | null
  org_name: string | null
}

type OrgOption = { id: string; name: string; category: string | null }

export default function AdminCharactersClient({
  characters,
  organizations,
  filter,
  sort,
  org,
}: {
  characters: Character[]
  organizations: OrgOption[]
  filter: string
  sort: string
  org: string
}) {
  const [search, setSearch] = useState('')
  const router = useRouter()
  const searchParams = useSearchParams()

  function listHref(nextSort: string, nextFilter = filter, nextOrg = org) {
    const params = new URLSearchParams({ sort: nextSort })
    if (nextFilter) params.set('filter', nextFilter)
    if (nextOrg) params.set('org', nextOrg)
    return `/admin/characters?${params}`
  }

  function updateOrg(value: string) {
    const params = new URLSearchParams(searchParams.toString())
    if (value) params.set('org', value)
    else params.delete('org')
    router.push(`/admin/characters?${params}`, { scroll: false })
  }

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return characters
    return characters.filter((r) =>
      [r.name, r.streamer_display_name, r.org_name, r.job].some(
        (v) => v?.toLowerCase().includes(q)
      )
    )
  }, [characters, search])

  const orgOptions = organizations.reduce<Record<string, OrgOption[]>>((acc, o) => {
    const cat = o.category ?? 'other'
    ;(acc[cat] ??= []).push(o)
    return acc
  }, {})

  return (
    <div className="space-y-6">
      {/* 툴바 */}
      <div className="flex flex-wrap items-center gap-3">
        {/* 실시간 검색 */}
        <div className="relative">
          <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="스트리머, RP명, 소속, 직업 검색"
            className="rounded border border-zinc-700 bg-zinc-900 py-2 pl-7 pr-7 text-sm text-zinc-200 placeholder:text-zinc-600 focus:border-amber-400/50 focus:outline-none w-64"
          />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300">
              <X size={12} />
            </button>
          )}
        </div>

        {/* 조직 필터 */}
        <select
          value={org}
          onChange={(e) => updateOrg(e.target.value)}
          className="rounded border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-300"
        >
          <option value="">조직 전체</option>
          {Object.entries(orgOptions).map(([cat, orgs]) => (
            <optgroup key={cat} label={categoryLabel[cat] ?? cat}>
              {orgs.map((o) => (
                <option key={o.id} value={o.id}>{o.name}</option>
              ))}
            </optgroup>
          ))}
        </select>

        {/* 필터 버튼 */}
        <div className="flex items-center gap-2">
          <Link
            href={listHref(sort, '')}
            className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${
              !filter ? 'border-amber-400/50 bg-amber-400/10 text-amber-400' : 'border-zinc-800 text-zinc-500 hover:border-zinc-700 hover:text-zinc-300'
            }`}
          >
            전체
          </Link>
          <Link
            href={listHref(sort, 'unnamed')}
            className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${
              filter === 'unnamed' ? 'border-amber-400/50 bg-amber-400/10 text-amber-400' : 'border-zinc-800 text-zinc-500 hover:border-zinc-700 hover:text-zinc-300'
            }`}
          >
            미정만 보기
          </Link>
          {org && (
            <Link
              href={listHref(sort, filter, '')}
              className="rounded-lg border border-zinc-800 px-3 py-1.5 text-xs font-medium text-zinc-500 hover:border-zinc-700 hover:text-zinc-300 transition-colors"
            >
              조직 필터 해제 ×
            </Link>
          )}
        </div>

        <span className="ml-auto text-xs text-zinc-600">
          {search ? `${filtered.length} / ${characters.length}명` : `${characters.length}명`}
        </span>
      </div>

      {/* 테이블 */}
      <div className="rounded-xl border border-zinc-800 overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-zinc-900">
              {columns.map((column) => {
                const active = sort === column.key || sort === `${column.key}_desc`
                const descending = active && sort.endsWith('_desc')
                const nextSort = active && !descending ? `${column.key}_desc` : column.key
                return (
                  <th key={column.key} scope="col" className="text-left text-xs font-medium">
                    <Link
                      href={listHref(nextSort)}
                      scroll={false}
                      className={`flex items-center gap-1 px-4 py-3 hover:text-amber-300 ${active ? 'text-amber-400' : 'text-zinc-500'}`}
                    >
                      {column.label}
                      <span aria-hidden="true">{active ? (descending ? '↓' : '↑') : '↕'}</span>
                    </Link>
                  </th>
                )
              })}
              <th className="px-4 py-3 w-12" />
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-12 text-center text-sm text-zinc-600">
                  {search ? '검색 결과가 없습니다.' : '등록된 캐릭터가 없습니다.'}
                </td>
              </tr>
            ) : (
              filtered.map((c) => (
                <CharacterEditRow
                  key={c.id}
                  character={c}
                  organizations={organizations.map((o) => ({
                    id: o.id,
                    name: o.category ? `[${categoryLabel[o.category] ?? o.category}] ${o.name}` : o.name,
                  }))}
                />
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
