import { createAdminClient } from '@/lib/supabase/admin'
import AdminCharactersClient from './AdminCharactersClient'
import CacheRefreshButton from '@/components/admin/CacheRefreshButton'

const statusLabels: Record<string, string> = {
  active: '활동', dead: '사망', retired: '활동 종료', hiatus: '휴식',
}

const columns = [
  { key: 'streamer', field: 'streamer_display_name' },
  { key: 'name', field: 'name' },
  { key: 'job', field: 'job' },
  { key: 'status', field: 'status' },
  { key: 'org', field: 'org_name' },
] as const

async function getCharacters(filter: string, sort: string, org: string, page: number, pageSize: number) {
  const supabase = createAdminClient()
  const safePageSize = [10, 20, 30, 40, 50].includes(pageSize) ? pageSize : 50
  const select = org ? `id, name, is_name_pending, job, status, created_at, streamers ( display_name ), organization_members!inner ( role, is_primary, organization_id, organizations ( name ) )` : `id, name, is_name_pending, job, status, created_at, streamers ( display_name ), organization_members ( role, is_primary, organization_id, organizations ( name ) )`
  let query = supabase.from('characters').select(select, { count: 'exact' }).order('name')
  if (filter === 'unnamed') query = query.eq('is_name_pending', true)
  if (org) query = query.eq('organization_members.organization_id', org)
  const { data, count } = await query.range((Math.max(1, page) - 1) * safePageSize, Math.max(1, page) * safePageSize - 1)

  type Row = {
    id: string
    created_at: string
    name: string
    is_name_pending: boolean
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

  const characters = rows
    .map((r) => {
      const primary = r.organization_members.find((m) => m.is_primary)
      return {
        id: r.id,
        created_at: r.created_at,
        name: r.name,
        is_name_pending: r.is_name_pending,
        job: r.job,
        status: r.status,
        streamer_display_name: r.streamers?.display_name ?? '—',
        org_id: primary?.organization_id ?? null,
        org_role: primary?.role ?? null,
        org_name: primary?.organizations?.name ?? null,
      }
    })
    .sort((a, b) => {
      if (sort === 'latest' || sort === 'oldest') return a.created_at.localeCompare(b.created_at) * (sort === 'latest' ? -1 : 1)
      const col = columns.find((c) => c.key === sort.replace(/_desc$/, ''))
      const field = col?.field ?? 'name'
      const left = field === 'status' ? statusLabels[a.status] ?? a.status : (a as Record<string, unknown>)[field] as string ?? ''
      const right = field === 'status' ? statusLabels[b.status] ?? b.status : (b as Record<string, unknown>)[field] as string ?? ''
      return left.localeCompare(right, 'ko') * (sort.endsWith('_desc') ? -1 : 1) || a.id.localeCompare(b.id)
    })
  return { characters, total: count ?? 0, totalPages: Math.max(1, Math.ceil((count ?? 0) / safePageSize)), pageSize: safePageSize }
}

async function getOrganizations() {
  const supabase = createAdminClient()
  const { data } = await supabase
    .from('organizations')
    .select('id, name, category')
    .eq('is_active', true)
    .order('category')
    .order('name')
  return (data ?? []) as { id: string; name: string; category: string | null }[]
}

async function getStreamers() {
  const supabase = createAdminClient()
  const { data } = await supabase.from('streamers').select('id, display_name').order('display_name')
  return (data ?? []) as { id: string; display_name: string }[]
}

type Props = { searchParams: Promise<{ filter?: string; sort?: string; org?: string; page?: string; pageSize?: string }> }

export default async function AdminCharactersPage({ searchParams }: Props) {
  const { filter = '', sort = 'name', org = '', page: pageValue = '', pageSize: pageSizeValue = '' } = await searchParams
  const page = Number.parseInt(pageValue, 10) || 1
  const pageSize = Number.parseInt(pageSizeValue, 10) || 50
  const [characterData, organizations, streamers] = await Promise.all([
    getCharacters(filter, sort, org, page, pageSize),
    getOrganizations(),
    getStreamers(),
  ])

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-black text-white">캐릭터 관리</h1>
        </div>
        <CacheRefreshButton scope="characters" />
      </div>
      <AdminCharactersClient
        characters={characterData.characters}
        organizations={organizations}
        streamers={streamers}
        filter={filter}
        sort={sort}
        org={org}
        total={characterData.total}
        totalPages={characterData.totalPages}
        currentPage={Math.min(page, characterData.totalPages)}
        pageSize={characterData.pageSize}
      />
    </div>
  )
}
