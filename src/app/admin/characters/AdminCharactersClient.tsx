'use client'

import { useState, useMemo, useTransition } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Search, X, UserPlus, ChevronDown, ChevronUp, Check } from 'lucide-react'
import CharacterEditRow from './CharacterEditRow'
import { createCharacter } from './actions'
import Select from '@/components/ui/Select'

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
  is_name_pending: boolean
}

type OrgOption = { id: string; name: string; category: string | null }
type StreamerOption = { id: string; display_name: string }

const statusOptions = [
  { value: 'active', label: '활동' },
  { value: 'dead', label: '사망' },
  { value: 'retired', label: '은퇴' },
  { value: 'hiatus', label: '휴식' },
]

export default function AdminCharactersClient({
  characters,
  organizations,
  streamers,
  filter,
  sort,
  org,
  total,
  totalPages,
  currentPage,
  pageSize: initialPageSize,
}: {
  characters: Character[]
  organizations: OrgOption[]
  streamers: StreamerOption[]
  filter: string
  sort: string
  org: string
  total: number
  totalPages: number
  currentPage: number
  pageSize: number
}) {
  const [search, setSearch] = useState('')
  const router = useRouter()
  const searchParams = useSearchParams()
  const [pageSize, setPageSize] = useState(String(initialPageSize))

  // 캐릭터 추가 폼
  const [showAddForm, setShowAddForm] = useState(false)
  const [addName, setAddName] = useState('')
  const [addStreamerId, setAddStreamerId] = useState('')
  const [addJob, setAddJob] = useState('')
  const [addStatus, setAddStatus] = useState('active')
  const [addOrgId, setAddOrgId] = useState('')
  const [addOrgRole, setAddOrgRole] = useState('')
  const [addError, setAddError] = useState<string | null>(null)
  const [addMsg, setAddMsg] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const streamerOptions = [
    { value: '', label: '스트리머 없음' },
    ...streamers.map((s) => ({ value: s.id, label: s.display_name })),
  ]
  const addOrgOptions = [
    { value: '', label: '무소속' },
    ...organizations.map((o) => ({ value: o.id, label: o.name })),
  ]

  function resetAddForm() {
    setAddName(''); setAddStreamerId(''); setAddJob('')
    setAddStatus('active'); setAddOrgId(''); setAddOrgRole('')
    setAddError(null)
  }

  function handleAdd() {
    setAddError(null); setAddMsg(null)
    startTransition(async () => {
      const res = await createCharacter({
        name: addName,
        streamerId: addStreamerId || null,
        job: addJob || null,
        status: addStatus,
        orgId: addOrgId || null,
        orgRole: addOrgRole || null,
      })
      if (res.error) { setAddError(res.error); return }
      setAddMsg('캐릭터가 추가되었습니다.')
      resetAddForm()
      router.refresh()
    })
  }

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

  function movePage(page: number) { const params = new URLSearchParams(searchParams.toString()); params.set('page', String(page)); router.push(`/admin/characters?${params}`, { scroll: false }) }
  function changePageSize(value: string) { setPageSize(value); const params = new URLSearchParams(searchParams.toString()); params.set('pageSize', value); params.delete('page'); router.push(`/admin/characters?${params}`, { scroll: false }) }

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
      {/* 캐릭터 추가 */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-900">
        <button
          onClick={() => { setShowAddForm((v) => !v); setAddError(null); setAddMsg(null) }}
          className="flex w-full cursor-pointer items-center gap-2 px-4 py-3 text-xs font-semibold text-zinc-400 hover:text-zinc-200 transition-colors"
        >
          <UserPlus size={13} />
          캐릭터 추가
          {showAddForm ? <ChevronUp size={13} className="ml-auto" /> : <ChevronDown size={13} className="ml-auto" />}
        </button>

        {showAddForm && (
          <div className="border-t border-zinc-800 px-4 pb-4 pt-3 space-y-3">
            <div className="flex flex-wrap gap-2">
              <input
                value={addName}
                onChange={(e) => setAddName(e.target.value)}
                placeholder="RP명 (공백이면 미정 상태)"
                className="w-40 rounded border border-zinc-700 bg-zinc-950 px-3 py-1.5 text-xs text-zinc-200 placeholder:text-zinc-600 focus:border-amber-400/50 focus:outline-none"
              />
              <div className="w-40">
                <Select value={addStreamerId} onChange={setAddStreamerId} options={streamerOptions} searchable searchPlaceholder="스트리머 검색" fullWidth />
              </div>
              <input
                value={addJob}
                onChange={(e) => setAddJob(e.target.value)}
                placeholder="직업 (선택)"
                className="w-32 rounded border border-zinc-700 bg-zinc-950 px-3 py-1.5 text-xs text-zinc-200 placeholder:text-zinc-600 focus:border-amber-400/50 focus:outline-none"
              />
              <div className="w-24">
                <Select value={addStatus} onChange={setAddStatus} options={statusOptions} fullWidth />
              </div>
              <div className="w-36">
                <Select value={addOrgId} onChange={(v) => { setAddOrgId(v); if (!v) setAddOrgRole('') }} options={addOrgOptions} fullWidth />
              </div>
              {addOrgId && (
                <input
                  value={addOrgRole}
                  onChange={(e) => setAddOrgRole(e.target.value)}
                  placeholder="직급 (선택)"
                  className="w-28 rounded border border-zinc-700 bg-zinc-950 px-3 py-1.5 text-xs text-zinc-200 placeholder:text-zinc-600 focus:border-amber-400/50 focus:outline-none"
                />
              )}
              <button
                onClick={handleAdd}
                disabled={isPending}
                className="flex cursor-pointer items-center gap-1.5 rounded bg-amber-400 px-3 py-1.5 text-xs font-bold text-zinc-900 hover:bg-amber-300 disabled:opacity-50 transition-colors"
              >
                <Check size={12} />
                추가
              </button>
            </div>
            {addError && <p className="text-xs text-red-400">{addError}</p>}
            {addMsg && <p className="text-xs text-green-400">{addMsg}</p>}
          </div>
        )}
      </div>

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
          {filtered.length} / {total}명
          <select value={pageSize} onChange={(e) => changePageSize(e.target.value)} className="rounded border border-zinc-700 bg-zinc-900 px-2 py-1.5 text-xs text-zinc-300"><option value="10">10개씩</option><option value="20">20개씩</option><option value="30">30개씩</option><option value="40">40개씩</option><option value="50">50개씩</option></select>
        </span>
      </div>

      {totalPages > 1 && <nav className="flex items-center justify-center gap-2" aria-label="캐릭터 페이지 이동"><button type="button" onClick={() => movePage(currentPage - 1)} disabled={currentPage <= 1} className="rounded border border-zinc-700 px-3 py-1.5 text-xs text-zinc-400 disabled:opacity-40">이전</button><span className="text-xs text-zinc-500">{currentPage} / {totalPages}</span><button type="button" onClick={() => movePage(currentPage + 1)} disabled={currentPage >= totalPages} className="rounded border border-zinc-700 px-3 py-1.5 text-xs text-zinc-400 disabled:opacity-40">다음</button></nav>}

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
