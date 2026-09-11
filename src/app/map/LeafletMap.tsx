'use client'

import 'leaflet/dist/leaflet.css'
import { MapContainer, TileLayer, CircleMarker, Tooltip, useMapEvents } from 'react-leaflet'
import L from 'leaflet'
import { useState } from 'react'
import Link from 'next/link'
import {
  TILE_CONFIGS, MAP_MIN_ZOOM, MAP_MAX_ZOOM, MAP_DEFAULT_ZOOM,
  MAP_MAX_BOUNDS, GTA_CRS_CONFIG, CATEGORY_COLOR, CATEGORY_LABEL,
  type MapStyle,
} from '@/lib/map/constants'

export type OrgMarker = {
  id: string
  name: string
  color: string | null
  category: string | null
  hq_x: number
  hq_y: number
  hq_label: string | null
}

export type LocationMarker = {
  id: string
  name: string
  label: string | null
  description: string | null
  color: string
  x: number
  y: number
}

function createGtaCRS() {
  const { centerX, centerY, scaleX, scaleY } = GTA_CRS_CONFIG
  return Object.assign({}, L.CRS.Simple, {
    projection: L.Projection.LonLat,
    transformation: new L.Transformation(scaleX, centerX, -scaleY, centerY),
    scale: (zoom: number) => Math.pow(2, zoom),
    zoom: (sc: number) => Math.log(sc) / Math.LN2,
    distance: (pos1: L.LatLng, pos2: L.LatLng) =>
      Math.hypot(pos2.lng - pos1.lng, pos2.lat - pos1.lat),
    infinite: true,
  })
}

const GTA_CRS = createGtaCRS()

function MapClickClose({ onClose }: { onClose: () => void }) {
  useMapEvents({ click: onClose })
  return null
}

function getOrgColor(org: OrgMarker) {
  return org.color ?? CATEGORY_COLOR[org.category ?? ''] ?? '#71717a'
}

type Selected =
  | { type: 'org'; data: OrgMarker }
  | { type: 'location'; data: LocationMarker }

export default function LeafletMap({
  orgs,
  locations,
  activeCategory,
  showLocations,
  mapStyle,
}: {
  orgs: OrgMarker[]
  locations: LocationMarker[]
  activeCategory: string | null
  showLocations: boolean
  mapStyle: MapStyle
}) {
  const [selected, setSelected] = useState<Selected | null>(null)

  const visibleOrgs = activeCategory
    ? orgs.filter((o) => o.category === activeCategory)
    : orgs

  const tile = TILE_CONFIGS[mapStyle]

  return (
    <div className="relative h-full w-full">
      <MapContainer
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        crs={GTA_CRS as any}
        center={[0, 0]}
        zoom={MAP_DEFAULT_ZOOM}
        minZoom={MAP_MIN_ZOOM}
        maxZoom={MAP_MAX_ZOOM}
        maxBounds={MAP_MAX_BOUNDS}
        maxBoundsViscosity={1}
        style={{ height: '100%', width: '100%', background: '#18181b' }}
      >
        <TileLayer key={mapStyle} url={tile.url} noWrap />
        <MapClickClose onClose={() => setSelected(null)} />

        {/* 조직 거점 마커 */}
        {visibleOrgs.map((org) => (
          <CircleMarker
            key={`org-${org.id}`}
            center={[org.hq_y, org.hq_x]}
            radius={10}
            pathOptions={{
              fillColor: getOrgColor(org),
              color: '#fff',
              fillOpacity: 0.9,
              weight: 2,
            }}
            eventHandlers={{
              click: (e) => {
                e.originalEvent.stopPropagation()
                setSelected((prev) =>
                  prev?.type === 'org' && prev.data.id === org.id ? null : { type: 'org', data: org }
                )
              },
            }}
          >
            <Tooltip direction="top" offset={[0, -12]}>{org.name}</Tooltip>
          </CircleMarker>
        ))}

        {/* 작업 위치 마커 */}
        {showLocations && locations.map((loc) => (
          <CircleMarker
            key={`loc-${loc.id}`}
            center={[loc.y, loc.x]}
            radius={7}
            pathOptions={{
              fillColor: loc.color,
              color: '#fff',
              fillOpacity: 0.85,
              weight: 2,
              dashArray: '3 2',
            }}
            eventHandlers={{
              click: (e) => {
                e.originalEvent.stopPropagation()
                setSelected((prev) =>
                  prev?.type === 'location' && prev.data.id === loc.id ? null : { type: 'location', data: loc }
                )
              },
            }}
          >
            <Tooltip direction="top" offset={[0, -9]}>
              {loc.name}{loc.label ? ` (${loc.label})` : ''}
            </Tooltip>
          </CircleMarker>
        ))}
      </MapContainer>

      {/* 선택 카드 */}
      {selected && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-[1000] w-72 rounded-xl border border-zinc-700 bg-zinc-900/95 backdrop-blur-sm p-4 shadow-xl">
          <button onClick={() => setSelected(null)}
            className="absolute right-3 top-3 text-zinc-600 hover:text-zinc-300 text-xs cursor-pointer leading-none">✕</button>

          {selected.type === 'org' && (() => {
            const org = selected.data
            return (
              <>
                <div className="flex items-center gap-2 mb-1">
                  <div className="h-3 w-3 rounded-full flex-shrink-0" style={{ backgroundColor: getOrgColor(org) }} />
                  <p className="text-sm font-bold text-white pr-4">{org.name}</p>
                </div>
                {org.category && (
                  <p className="text-xs text-zinc-500 ml-5">{CATEGORY_LABEL[org.category] ?? org.category}</p>
                )}
                {org.hq_label && <p className="text-xs text-zinc-400 ml-5 mt-0.5">{org.hq_label}</p>}
                <Link href={`/organizations/${org.id}`}
                  className="mt-3 block text-center text-xs text-amber-400 hover:text-amber-300 transition-colors">
                  조직 상세 보기 →
                </Link>
              </>
            )
          })()}

          {selected.type === 'location' && (() => {
            const loc = selected.data
            return (
              <>
                <div className="flex items-center gap-2 mb-1">
                  <div className="h-3 w-3 rounded-full flex-shrink-0" style={{ backgroundColor: loc.color }} />
                  <p className="text-sm font-bold text-white pr-4">{loc.name}</p>
                </div>
                {loc.label && (
                  <span className="ml-5 inline-block rounded-full bg-zinc-800 px-2 py-0.5 text-[10px] text-zinc-400">
                    {loc.label}
                  </span>
                )}
                {loc.description && <p className="text-xs text-zinc-500 ml-5 mt-1">{loc.description}</p>}
              </>
            )
          })()}
        </div>
      )}
    </div>
  )
}
