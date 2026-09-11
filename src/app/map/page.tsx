export const revalidate = 300

import { createAdminClient } from '@/lib/supabase/admin'
import MapView from './MapView'
import type { Metadata } from 'next'
import type { OrgMarker, LocationMarker } from './LeafletMap'

export const metadata: Metadata = { title: '거점 지도' }

async function getOrgsWithHq(): Promise<OrgMarker[]> {
  const supabase = createAdminClient()
  const { data } = await supabase
    .from('organizations')
    .select('id, name, color, category, hq_x, hq_y, hq_label')
    .eq('is_active', true)
    .eq('is_disbanded', false)
    .not('hq_x', 'is', null)
    .not('hq_y', 'is', null)
  return (data ?? []) as OrgMarker[]
}

async function getLocations(): Promise<LocationMarker[]> {
  const supabase = createAdminClient()
  const { data } = await supabase
    .from('map_locations')
    .select('id, name, label, description, color, x, y')
    .not('x', 'is', null)
    .not('y', 'is', null)
    .order('name')
  return (data ?? []) as LocationMarker[]
}

export default async function MapPage() {
  const [orgs, locations] = await Promise.all([getOrgsWithHq(), getLocations()])
  return <MapView orgs={orgs} locations={locations} />
}
