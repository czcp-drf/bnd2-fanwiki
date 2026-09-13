import { createAdminClient } from '@/lib/supabase/admin'
import RelationshipEditor from './RelationshipEditor'
import CacheRefreshButton from '@/components/admin/CacheRefreshButton'

async function getRelationships() {
  const supabase = createAdminClient()
  const { data } = await supabase
    .from('character_relationships')
    .select(`
      id, type, description,
      character_a:characters!character_a_id(id, name),
      character_b:characters!character_b_id(id, name)
    `)
    .order('created_at', { ascending: false })
  return data ?? []
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

export default async function AdminRelationshipsPage() {
  const [relationships, characters] = await Promise.all([
    getRelationships(),
    getCharacters(),
  ])

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-black text-white">관계 관리</h1>
          <p className="text-sm text-zinc-500 mt-0.5">총 {relationships.length}건</p>
        </div>
        <CacheRefreshButton scope="relationships" />
      </div>

      <RelationshipEditor
        relationships={relationships as unknown as Parameters<typeof RelationshipEditor>[0]['relationships']}
        characters={characters}
      />
    </div>
  )
}
