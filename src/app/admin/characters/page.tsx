import { createAdminClient } from '@/lib/supabase/admin'
import AdminCharactersClient from './AdminCharactersClient'
import CacheRefreshButton from '@/components/admin/CacheRefreshButton'

const statusLabels: Record<string, string> = {
  active: '활동', dead: '사망', retired: '은퇴', hiatus: '휴식',
}

const columns = [
  { key: 'streamer', field: 'streamer_display_name' },
  { key: 'name', field: 'name' },
  { key: 'job', field: 'job' },
  { key: 'status', field: 'status' },
  { key: 'org', field: 'org_name' },
] as const

async function getCharacters(filter: string, sort: string, org: string) {
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
    .sort((a, b) => {
      if (sort === 'latest' || sort === 'oldest') return a.created_at.localeCompare(b.created_at) * (sort === 'latest' ? -1 : 1)
      const col = columns.find((c) => c.key === sort.replace(/_desc$/, ''))
      const field = col?.field ?? 'name'
      const left = field === 'status' ? statusLabels[a.status] ?? a.status : (a as Record<string, unknown>)[field] as string ?? ''
      const right = field === 'status' ? statusLabels[b.status] ?? b.status : (b as Record<string, unknown>)[field] as string ?? ''
      return left.localeCompare(right, 'ko') * (sort.endsWith('_desc') ? -1 : 1) || a.id.localeCompare(b.id)
    })
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

type Props = { searchParams: Promise<{ filter?: string; sort?: string; org?: string }> }

export default async function AdminCharactersPage({ searchParams }: Props) {
  const { filter = '', sort = 'name', org = '' } = await searchParams
  const [characters, organizations, streamers] = await Promise.all([
    getCharacters(filter, sort, org),
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
        characters={characters}
        organizations={organizations}
        streamers={streamers}
        filter={filter}
        sort={sort}
        org={org}
      />
    </div>
  )
}
