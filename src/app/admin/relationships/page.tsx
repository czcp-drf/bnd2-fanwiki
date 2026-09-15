import { createAdminClient } from '@/lib/supabase/admin'
import RelationshipEditor from './RelationshipEditor'
import CacheRefreshButton from '@/components/admin/CacheRefreshButton'

async function getRelationships(page: number, pageSize: number) {
  const supabase = createAdminClient()
  const safePageSize = [10, 20, 30, 40, 50].includes(pageSize) ? pageSize : 50
  const { data, count } = await supabase
    .from('character_relationships')
    .select(`
      id, type, description,
      character_a:characters!character_a_id(id, name),
      character_b:characters!character_b_id(id, name)
    `, { count: 'exact' })
    .order('created_at', { ascending: false })
    .range((Math.max(1, page) - 1) * safePageSize, Math.max(1, page) * safePageSize - 1)
  return { relationships: data ?? [], total: count ?? 0, pageSize: safePageSize, totalPages: Math.max(1, Math.ceil((count ?? 0) / safePageSize)) }
}

async function getCharacters() {
  const supabase = createAdminClient()
  const { data } = await supabase
    .from('characters')
    .select('id, name, streamers(display_name)')
    .order('name')
  return (data ?? []).map(c => ({
    id: c.id,
    name: c.name,
    streamerName: (c.streamers as unknown as { display_name: string } | null)?.display_name ?? null,
  }))
}

export default async function AdminRelationshipsPage({ searchParams }: { searchParams: Promise<{ page?: string; pageSize?: string }> }) {
  const params = await searchParams
  const page = Number.parseInt(params.page ?? '', 10) || 1
  const pageSize = Number.parseInt(params.pageSize ?? '', 10) || 50
  const [relationshipData, characters] = await Promise.all([
    getRelationships(page, pageSize),
    getCharacters(),
  ])

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-black text-white">관계 관리</h1>
          <p className="text-sm text-zinc-500 mt-0.5">총 {relationshipData.total}건 · {page}/{relationshipData.totalPages}페이지</p>
        </div>
        <CacheRefreshButton scope="relationships" />
      </div>

      <RelationshipEditor
        relationships={relationshipData.relationships as unknown as Parameters<typeof RelationshipEditor>[0]['relationships']}
        characters={characters}
        total={relationshipData.total}
        totalPages={relationshipData.totalPages}
        currentPage={Math.min(page, relationshipData.totalPages)}
        pageSize={relationshipData.pageSize}
      />
    </div>
  )
}
