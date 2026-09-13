export const revalidate = 86400

import { unstable_cache } from 'next/cache'
import { createAdminClient } from '@/lib/supabase/admin'
import { WIKI_CACHE_REVALIDATE, WIKI_CACHE_TAGS, WIKI_PUBLIC_TAG } from '@/lib/cache/wiki'
import MapView from './MapView'
import { Suspense } from 'react'
import type { Metadata } from 'next'
import type { OrgMarker, LocationMarker } from './LeafletMap'

export const metadata: Metadata = { title: '거점 지도' }

async function getOrgsWithHq(): Promise<OrgMarker[]> {
  const supabase = createAdminClient()

  const [{ data: orgs }, { data: linkedBizOrgs }] = await Promise.all([
    // 거점이 있는 모든 조직 (gang_id 있는 불법 org 제외 — 아래에서 부모 갱단의 biz로 표시)
    supabase
      .from('organizations')
      .select('id, name, color, category, hq_x, hq_y, hq_label, biz_x, biz_y, biz_label, description, logo_url')
      .eq('is_active', true)
      .eq('is_disbanded', false)
      .not('hq_x', 'is', null)
      .not('hq_y', 'is', null)
      .is('gang_id', null),

    // gang_id로 갱단과 연결된 불법 사업체 org (좌표 있는 것)
    supabase
      .from('organizations')
      .select('id, name, hq_x, hq_y, gang_id')
      .eq('is_active', true)
      .eq('is_disbanded', false)
      .not('gang_id', 'is', null)
      .not('hq_x', 'is', null)
      .not('hq_y', 'is', null),
  ])

  const bizByGang = new Map((linkedBizOrgs ?? []).map((b) => [b.gang_id, b]))

  return (orgs ?? []).map((org) => {
    // 수동 biz_x/biz_y가 있으면 우선 사용, 없으면 연결된 불법 org 좌표로 채움
    if (org.biz_x !== null) return org as OrgMarker
    const linked = bizByGang.get(org.id)
    if (linked) {
      return { ...org, biz_x: linked.hq_x, biz_y: linked.hq_y, biz_label: linked.name } as OrgMarker
    }
    return org as OrgMarker
  })
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

const getOrgsWithHqCached = unstable_cache(getOrgsWithHq, ['wiki-map-organizations'], {
  revalidate: WIKI_CACHE_REVALIDATE,
  tags: [WIKI_PUBLIC_TAG, WIKI_CACHE_TAGS.map, WIKI_CACHE_TAGS.organizations],
})
const getLocationsCached = unstable_cache(getLocations, ['wiki-map-locations'], {
  revalidate: WIKI_CACHE_REVALIDATE,
  tags: [WIKI_PUBLIC_TAG, WIKI_CACHE_TAGS.map],
})

export default async function MapPage() {
  const [orgs, locations] = await Promise.all([getOrgsWithHqCached(), getLocationsCached()])
  return <Suspense fallback={<div className="p-10 text-zinc-400">지도를 불러오는 중입니다.</div>}><MapView orgs={orgs} locations={locations} /></Suspense>
}
