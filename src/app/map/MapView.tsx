'use client'

import dynamic from 'next/dynamic'
import { useState } from 'react'
import { CATEGORY_COLOR, CATEGORY_LABEL, TILE_CONFIGS, type MapStyle } from '@/lib/map/constants'
import type { OrgMarker, LocationMarker } from './LeafletMap'

const LeafletMap = dynamic(() => import('./LeafletMap'), {
  ssr: false,
  loading: () => <div className="h-full w-full animate-pulse rounded-xl bg-zinc-900" />,
})

const CATEGORIES = ['city_hall', 'public_service', 'gang', 'business', 'illegal'] as const

export default function MapView({ orgs, locations }: { orgs: OrgMarker[]; locations: LocationMarker[] }) {
  const [activeCategory, setActiveCategory] = useState<string | null>(null)
  const [mapStyle, setMapStyle] = useState<MapStyle>('satellite')
  const [showLocations, setShowLocations] = useState(true)

  const counts = CATEGORIES.reduce((acc, cat) => {
    acc[cat] = orgs.filter((o) => o.category === cat).length
    return acc
  }, {} as Record<string, number>)

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 flex flex-col gap-4" style={{ height: 'calc(100vh - 5rem)' }}>
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-black text-white">거점 지도</h1>
          <p className="text-xs text-zinc-500 mt-0.5">마커를 클릭하면 상세 정보를 볼 수 있습니다</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* 맵 스타일 */}
          <div className="flex rounded-lg border border-zinc-800 overflow-hidden">
            {(Object.keys(TILE_CONFIGS) as MapStyle[]).map((style) => (
              <button key={style} onClick={() => setMapStyle(style)}
                className={`px-3 py-1.5 text-xs font-medium transition-colors cursor-pointer ${
                  mapStyle === style ? 'bg-zinc-700 text-zinc-100' : 'bg-zinc-900 text-zinc-500 hover:text-zinc-300'
                }`}>
                {TILE_CONFIGS[style].label}
              </button>
            ))}
          </div>

          {/* 작업 위치 토글 */}
          {locations.length > 0 && (
            <button onClick={() => setShowLocations((v) => !v)}
              className={`rounded-full px-3 py-1 text-xs font-medium transition-colors cursor-pointer border ${
                showLocations
                  ? 'border-yellow-500/40 bg-yellow-500/10 text-yellow-400'
                  : 'border-zinc-700 bg-zinc-900 text-zinc-500 hover:text-zinc-300'
              }`}>
              작업 위치 {showLocations ? '표시 중' : '숨김'}
            </button>
          )}

          {/* 카테고리 필터 */}
          <div className="flex flex-wrap gap-1.5">
            <button onClick={() => setActiveCategory(null)}
              className={`rounded-full px-3 py-1 text-xs font-medium transition-colors cursor-pointer ${
                activeCategory === null ? 'bg-zinc-200 text-zinc-900' : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
              }`}>
              전체 ({orgs.length})
            </button>
            {CATEGORIES.filter((c) => counts[c] > 0).map((cat) => (
              <button key={cat} onClick={() => setActiveCategory(activeCategory === cat ? null : cat)}
                className={`rounded-full px-3 py-1 text-xs font-medium transition-colors cursor-pointer ${
                  activeCategory === cat ? 'text-zinc-900' : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
                }`}
                style={activeCategory === cat ? { backgroundColor: CATEGORY_COLOR[cat] } : {}}>
                {CATEGORY_LABEL[cat]} ({counts[cat]})
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-hidden rounded-xl border border-zinc-800">
        <LeafletMap
          orgs={orgs}
          locations={locations}
          activeCategory={activeCategory}
          showLocations={showLocations}
          mapStyle={mapStyle}
        />
      </div>
    </div>
  )
}
