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
    // 조직 거점 또는 연결된 불법 사업체 위치가 있는 부모 조직
    supabase
      .from('organizations')
      .select('id, name, color, category, hq_x, hq_y, hq_label, hq_wiki_path, biz_x, biz_y, biz_label, description, logo_url')
      .eq('is_active', true)
      .eq('is_disbanded', false)
      .is('gang_id', null),

    // 갱단과 연결된 불법 사업체 정보. 지도에서는 부모 갱단의 조직 거점으로 표시한다.
    supabase
      .from('organizations')
      .select('id, name, description, hq_x, hq_y, hq_label, hq_wiki_path, logo_url, gang_id')
      .eq('is_active', true)
      .eq('is_disbanded', false)
      .eq('category', 'illegal')
      .not('gang_id', 'is', null),
  ])

  const bizByGang = new Map((linkedBizOrgs ?? []).map((b) => [b.gang_id, b]))

  return (orgs ?? []).map((org) => {
    const linked = bizByGang.get(org.id)
    // 연결된 불법 사업체는 부모 갱단의 조직 거점 핀으로 표시한다.
    return {
      ...org,
      biz_x: org.biz_x ?? linked?.hq_x ?? null,
      biz_y: org.biz_y ?? linked?.hq_y ?? null,
      biz_label: org.biz_label ?? linked?.name ?? null,
      linked_business: linked ? {
        id: linked.id,
        name: linked.name,
        description: linked.description,
        hq_label: linked.hq_label,
        hq_wiki_path: linked.hq_wiki_path,
        logo_url: linked.logo_url,
      } : null,
    } as OrgMarker
  }).filter((org) => (
    (org.hq_x !== null && org.hq_y !== null) ||
    (org.biz_x !== null && org.biz_y !== null)
  ))
}

async function getLocations(): Promise<LocationMarker[]> {
  const supabase = createAdminClient()
  const { data } = await supabase
    .from('map_locations')
    .select('id, name, label, description, color, x, y, wiki_path')
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
  return (
    <div className="wiki-theme min-h-[calc(100vh-3.5rem)]">
      <Suspense fallback={<div className="p-10 text-zinc-400">지도를 불러오는 중입니다.</div>}>
        <MapView orgs={orgs} locations={locations} />
      </Suspense>
    </div>
  )
}
