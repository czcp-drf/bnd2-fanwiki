import { createAdminClient } from '@/lib/supabase/admin'
import CharacterEditRow from './CharacterEditRow'
import Link from 'next/link'

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

async function getCharacters(filter: string, q: string, sort: string, org: string) {
  const supabase = createAdminClient()

  const { data } = await supabase
    .from('characters')
    .select(`
      id, name, job, status, created_at,
      streamers ( display_name ),
      organization_members ( role, is_primary, organization_id, organizations ( name ) )
    `)
    .order('name')

  type Row = {
    id: string
    created_at: string
    name: string
    job: string | null
    status: string
    streamers: { display_name: string } | null
    organization_members: {
      role: string | null
      is_primary: boolean
      organization_id: string
      organizations: { name: string } | null
    }[]
  }

  const rows = (data ?? []) as unknown as Row[]

  return rows
    .filter((r) => filter === 'unnamed' ? r.name === '미정' : true)
    .filter((r) => org ? r.organization_members.some((m) => m.organization_id === org) : true)
    .map((r) => {
      const primary = r.organization_members.find((m) => m.is_primary)
      return {
        id: r.id,
        created_at: r.created_at,
        name: r.name,
        job: r.job,
        status: r.status,
        streamer_display_name: r.streamers?.display_name ?? '—',
        org_id: primary?.organization_id ?? null,
        org_role: primary?.role ?? null,
        org_name: primary?.organizations?.name ?? null,
      }
    })
    .filter((r) => [r.name, r.streamer_display_name, r.org_name, r.job].some((value) => value?.toLocaleLowerCase().includes(q.trim().toLocaleLowerCase())))
    .sort((a, b) => {
      if (sort === 'latest' || sort === 'oldest') return a.created_at.localeCompare(b.created_at) * (sort === 'latest' ? -1 : 1)
      const field = columns.find((column) => column.key === sort.replace(/_desc$/, ''))?.field ?? 'name'
      const left = field === 'status' ? statusLabels[a.status] ?? a.status : a[field] ?? ''
      const right = field === 'status' ? statusLabels[b.status] ?? b.status : b[field] ?? ''
      return left.localeCompare(right, 'ko') * (sort.endsWith('_desc') ? -1 : 1) || a.id.localeCompare(b.id)
    })
}

const categoryLabel: Record<string, string> = {
  city_hall: '시청',
  public_service: '공무직',
  gang: '갱단',
  business: '사업체',
  illegal: '불법',
}

async function getOrganizations() {
  const supabase = createAdminClient()
  const { data } = await supabase
    .from('organizations')
    .select('id, name, category')
    .eq('is_active', true)
    .neq('category', 'illegal')
    .order('category')
    .order('name')
  return (data ?? []) as { id: string; name: string; category: string | null }[]
}

type Props = { searchParams: Promise<{ filter?: string; q?: string; sort?: string; org?: string }> }

export default async function AdminCharactersPage({ searchParams }: Props) {
  const { filter = '', q = '', sort = 'name', org = '' } = await searchParams
  const [characters, organizations] = await Promise.all([
    getCharacters(filter, q, sort, org),
    getOrganizations(),
  ])

  function listHref(nextSort: string, nextFilter = filter, nextOrg = org) {
    const params = new URLSearchParams({ sort: nextSort })
    if (q) params.set('q', q)
    if (nextFilter) params.set('filter', nextFilter)
    if (nextOrg) params.set('org', nextOrg)
    return `/admin/characters?${params}`
  }

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-black text-white">캐릭터 관리</h1>
          <p className="text-sm text-zinc-500 mt-0.5">총 {characters.length}명</p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href={listHref(sort, '')}
            className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${
              !filter
                ? 'border-amber-400/50 bg-amber-400/10 text-amber-400'
                : 'border-zinc-800 text-zinc-500 hover:border-zinc-700 hover:text-zinc-300'
            }`}
          >
            전체
          </Link>
          <Link
            href={listHref(sort, 'unnamed')}
            className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${
              filter === 'unnamed'
                ? 'border-amber-400/50 bg-amber-400/10 text-amber-400'
                : 'border-zinc-800 text-zinc-500 hover:border-zinc-700 hover:text-zinc-300'
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
      </div>

      <form action="/admin/characters" className="flex flex-wrap gap-3">
        <input type="hidden" name="filter" value={filter} />
        <input type="hidden" name="sort" value={sort} />
        <input name="q" defaultValue={q} aria-label="캐릭터 검색" placeholder="스트리머, RP명, 소속, 직업 검색" className="rounded border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm" />
        <select
          name="org"
          defaultValue={org}
          aria-label="조직 필터"
          className="rounded border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-300"
        >
          <option value="">조직 전체</option>
          {Object.entries(
            organizations.reduce<Record<string, typeof organizations>>((acc, o) => {
              const cat = o.category ?? 'other'
              ;(acc[cat] ??= []).push(o)
              return acc
            }, {})
          ).map(([cat, orgs]) => (
            <optgroup key={cat} label={categoryLabel[cat] ?? cat}>
              {orgs.map((o) => (
                <option key={o.id} value={o.id} style={{ color: 'white' }}>
                  {o.name}
                </option>
              ))}
            </optgroup>
          ))}
        </select>
        <button className="rounded bg-amber-400 px-4 py-2 text-sm text-zinc-900">검색</button>
      </form>
      <div className="rounded-xl border border-zinc-800 overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-zinc-900">
              {columns.map((column) => {
                const active = sort === column.key || sort === `${column.key}_desc`
                const descending = active && sort.endsWith('_desc')
                const nextSort = active && !descending ? `${column.key}_desc` : column.key
                return (
                  <th key={column.key} scope="col" aria-sort={active ? descending ? 'descending' : 'ascending' : 'none'} className="text-left text-xs font-medium">
                    <Link href={listHref(nextSort)} scroll={false}
                      aria-label={`${column.label} ${nextSort.endsWith('_desc') ? '내림차순' : '오름차순'} 정렬`}
                      className={`flex items-center gap-1 px-4 py-3 hover:text-amber-300 focus-visible:outline focus-visible:outline-amber-400 ${active ? 'text-amber-400' : 'text-zinc-500'}`}>
                      {column.label}<span aria-hidden="true">{active ? descending ? '↓' : '↑' : '↕'}</span>
                    </Link>
                  </th>
                )
              })}
              <th className="px-4 py-3 w-12" />
            </tr>
          </thead>
          <tbody>
            {characters.map((c) => (
              <CharacterEditRow
                key={c.id}
                character={c}
                organizations={organizations.map((o) => ({
                  id: o.id,
                  name: o.category ? `[${categoryLabel[o.category] ?? o.category}] ${o.name}` : o.name,
                }))}
              />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
