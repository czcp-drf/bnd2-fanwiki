import { createAdminClient } from '@/lib/supabase/admin'
import AdminMapView from './AdminMapView'
import type { Metadata } from 'next'
import type { AdminOrg, AdminLocation } from './AdminLeafletMap'

export const metadata: Metadata = { title: '거점 지도 관리' }

async function getAllOrgs(): Promise<AdminOrg[]> {
  const supabase = createAdminClient()
  const { data } = await supabase
    .from('organizations')
    .select('id, name, color, category, hq_x, hq_y, hq_label')
    .eq('is_active', true)
    .eq('is_disbanded', false)
    .order('category').order('name')
  return (data ?? []) as AdminOrg[]
}

async function getAllLocations(): Promise<AdminLocation[]> {
  const supabase = createAdminClient()
  const { data } = await supabase
    .from('map_locations')
    .select('id, name, label, color, x, y')
    .order('name')
  return (data ?? []) as AdminLocation[]
}

export default async function AdminMapPage() {
  const [orgs, locations] = await Promise.all([getAllOrgs(), getAllLocations()])

  return (
    <div className="flex flex-col" style={{ height: '90vh' }}>
      <div className="shrink-0 border-b border-zinc-800 px-6 py-4">
        <h1 className="text-xl font-black text-white">거점 지도 관리</h1>
        <p className="text-xs text-zinc-500 mt-0.5">조직을 선택하거나 주요 장소를 추가한 뒤 지도를 클릭해 핀을 설정하세요</p>
      </div>
      <div className="flex-1 overflow-hidden">
        <AdminMapView orgs={orgs} locations={locations} />
      </div>
    </div>
  )
}
