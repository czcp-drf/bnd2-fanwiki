'use client'

import dynamic from 'next/dynamic'
import { useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { CATEGORY_COLOR, CATEGORY_LABEL } from '@/lib/map/constants'
import type { OrgMarker, LocationMarker } from './LeafletMap'

const LeafletMap = dynamic(() => import('./LeafletMap'), {
  ssr: false,
  loading: () => <div className="h-full w-full animate-pulse rounded-xl bg-zinc-900" />,
})

const CATEGORIES = ['city_hall', 'public_service', 'gang', 'business', 'illegal'] as const

export default function MapView({ orgs, locations }: { orgs: OrgMarker[]; locations: LocationMarker[] }) {
  const searchParams = useSearchParams()
  const focusOrgId = searchParams.get('org')
  const focusX = Number(searchParams.get('focus_x'))
  const focusY = Number(searchParams.get('focus_y'))
  const focusCoordinates = Number.isFinite(focusX) && Number.isFinite(focusY)
    ? { x: focusX, y: focusY }
    : null
  const [activeCategory, setActiveCategory] = useState<string | null>(null)
  const [showOrgs, setShowOrgs] = useState(true)
  const [showLocations, setShowLocations] = useState(true)
  const [activeLocationLabel, setActiveLocationLabel] = useState<string | null>(null)

  const counts = CATEGORIES.reduce((acc, cat) => {
    acc[cat] = orgs.filter((o) => o.category === cat).length
    return acc
  }, {} as Record<string, number>)

  const locationLabels = [...new Set(locations.map((l) => l.label).filter(Boolean))] as string[]

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 flex flex-col gap-4" style={{ height: 'calc(100vh - 5rem)' }}>
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-black text-white">거점 지도</h1>
          <p className="text-xs text-zinc-500 mt-0.5">마커를 클릭하면 상세 정보를 볼 수 있습니다</p>
        </div>

        <div className="flex flex-wrap items-start gap-4">
          {/* 조직 거점 그룹 */}
          <div className="flex flex-col gap-1.5">
            <button
              onClick={() => {
                setShowOrgs((v) => !v)
                if (showOrgs) setActiveCategory(null)
              }}
              className={`rounded-full px-3 py-1 text-xs font-medium transition-colors cursor-pointer border ${
                showOrgs
                  ? 'border-zinc-600 bg-zinc-800 text-zinc-300'
                  : 'border-zinc-700 bg-zinc-900 text-zinc-500 hover:text-zinc-300'
              }`}
            >
              조직 거점 {showOrgs ? '표시 중' : '숨김'}
            </button>
            <div className={`flex flex-wrap gap-1.5 pl-0.5 transition-opacity ${showOrgs ? '' : 'invisible'}`}>
              <button
                onClick={() => setActiveCategory(null)}
                className={`rounded-full px-2.5 py-1 text-xs font-medium transition-colors cursor-pointer ${
                  activeCategory === null ? 'bg-zinc-200 text-zinc-900' : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
                }`}
              >
                전체 ({orgs.length})
              </button>
              {CATEGORIES.filter((c) => counts[c] > 0).map((cat) => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(activeCategory === cat ? null : cat)}
                  className={`rounded-full px-2.5 py-1 text-xs font-medium transition-colors cursor-pointer ${
                    activeCategory === cat ? 'text-zinc-900' : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
                  }`}
                  style={activeCategory === cat ? { backgroundColor: CATEGORY_COLOR[cat] } : {}}
                >
                  {CATEGORY_LABEL[cat]} ({counts[cat]})
                </button>
              ))}
            </div>
          </div>

          {/* 주요 장소 그룹 */}
          {locations.length > 0 && (
            <div className="flex flex-col gap-1.5">
              <button
                onClick={() => {
                  setShowLocations((v) => !v)
                  setActiveLocationLabel(null)
                }}
                className={`rounded-full px-3 py-1 text-xs font-medium transition-colors cursor-pointer border ${
                  showLocations
                    ? 'border-yellow-500/40 bg-yellow-500/10 text-yellow-400'
                    : 'border-zinc-700 bg-zinc-900 text-zinc-500 hover:text-zinc-300'
                }`}
              >
                주요 장소 {showLocations ? '표시 중' : '숨김'}
              </button>
              {locationLabels.length > 0 && (
                <div className={`flex flex-wrap gap-1.5 pl-0.5 transition-opacity ${showLocations ? '' : 'invisible'}`}>
                  <button
                    onClick={() => setActiveLocationLabel(null)}
                    className={`rounded-full px-2.5 py-1 text-xs font-medium transition-colors cursor-pointer ${
                      activeLocationLabel === null
                        ? 'bg-yellow-500/20 text-yellow-300'
                        : 'text-zinc-500 hover:text-zinc-300'
                    }`}
                  >
                    전체
                  </button>
                  {locationLabels.map((label) => (
                    <button
                      key={label}
                      onClick={() => setActiveLocationLabel(activeLocationLabel === label ? null : label)}
                      className={`rounded-full px-2.5 py-1 text-xs font-medium transition-colors cursor-pointer ${
                        activeLocationLabel === label
                          ? 'bg-yellow-500/20 text-yellow-300'
                          : 'text-zinc-500 hover:text-zinc-300'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-hidden rounded-xl border border-zinc-800">
        <LeafletMap
          key={`${focusOrgId ?? 'all'}:${focusCoordinates ? `${focusCoordinates.x},${focusCoordinates.y}` : 'none'}`}
          focusOrgId={focusOrgId}
          focusCoordinates={focusCoordinates}
          orgs={orgs}
          locations={locations}
          activeCategory={activeCategory}
          showOrgs={showOrgs}
          showLocations={showLocations}
          activeLocationLabel={activeLocationLabel}
        />
      </div>
    </div>
  )
}
