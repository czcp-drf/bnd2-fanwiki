export const dynamic = 'force-dynamic'

import { createAdminClient } from '@/lib/supabase/admin'
import AdminMapView from './AdminMapView'
import type { Metadata } from 'next'
import type { AdminOrg, AdminLocation } from './AdminLeafletMap'
import CacheRefreshButton from '@/components/admin/CacheRefreshButton'

export const metadata: Metadata = { title: '거점 지도 관리' }

async function getAllOrgs(): Promise<AdminOrg[]> {
  const supabase = createAdminClient()

  const [{ data: orgs }, { data: linkedBizOrgs }] = await Promise.all([
    supabase
      .from('organizations')
    .select('id, name, color, category, hq_x, hq_y, hq_label, hq_wiki_path, biz_x, biz_y, biz_label')
      .eq('is_active', true)
      .eq('is_disbanded', false)
      .is('gang_id', null)
      .order('category').order('name'),

    supabase
      .from('organizations')
      .select('id, name, hq_x, hq_y, gang_id')
      .eq('is_active', true)
      .eq('is_disbanded', false)
      .not('gang_id', 'is', null),
  ])

  const bizByGang = new Map((linkedBizOrgs ?? []).map((b) => [b.gang_id, b]))

  return (orgs ?? []).map((org) => {
    if (org.biz_x !== null) return org as AdminOrg
    const linked = bizByGang.get(org.id)
    if (linked) {
      return { ...org, biz_x: linked.hq_x ?? null, biz_y: linked.hq_y ?? null, biz_label: linked.name } as AdminOrg
    }
    return org as AdminOrg
  })
}

async function getAllLocations(): Promise<AdminLocation[]> {
  const supabase = createAdminClient()
  const { data } = await supabase
    .from('map_locations')
    .select('id, name, label, color, x, y, wiki_path')
    .order('name')
  return (data ?? []) as AdminLocation[]
}

export default async function AdminMapPage() {
  const [orgs, locations] = await Promise.all([getAllOrgs(), getAllLocations()])

  return (
    <div className="flex flex-col" style={{ height: '90vh' }}>
      <div className="shrink-0 border-b border-zinc-800 px-6 py-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-xl font-black text-white">거점 지도 관리</h1>
            <p className="text-xs text-zinc-500 mt-0.5">조직을 선택하거나 주요 장소를 추가한 뒤 지도를 클릭해 핀을 설정하세요</p>
          </div>
          <CacheRefreshButton scope="map" />
        </div>
      </div>
      <div className="flex-1 overflow-hidden">
        <AdminMapView orgs={orgs} locations={locations} />
      </div>
    </div>
  )
}
