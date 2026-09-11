'use client'

import 'leaflet/dist/leaflet.css'
import { MapContainer, CircleMarker, Tooltip, Popup, useMapEvents } from 'react-leaflet'
import './MapPinPopup.css'
import MapBaseLayers from '@/components/map/MapBaseLayers'
import L from 'leaflet'
import { useState } from 'react'
import Link from 'next/link'
import { MapPin, ArrowUpRight, X } from 'lucide-react'
import AppImage from '@/components/ui/AppImage'
import {
  MAP_MIN_ZOOM, MAP_MAX_ZOOM, MAP_DEFAULT_ZOOM,
  MAP_MAX_BOUNDS, GTA_CRS_CONFIG, CATEGORY_COLOR, CATEGORY_LABEL,
} from '@/lib/map/constants'

export type OrgMarker = {
  id: string
  name: string
  color: string | null
  category: string | null
  hq_x: number
  hq_y: number
  hq_label: string | null
  description: string | null
  logo_url: string | null
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
  useMapEvents({ click: onClose, keydown: (event) => { if (event.originalEvent.key === 'Escape') onClose() } })
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
  showOrgs,
  showLocations,
  activeLocationLabel,
  focusOrgId,
}: {
  orgs: OrgMarker[]
  locations: LocationMarker[]
  activeCategory: string | null
  showOrgs: boolean
  showLocations: boolean
  activeLocationLabel: string | null
  focusOrgId: string | null
}) {
  const focusedOrg = orgs.find((org) => org.id === focusOrgId)
  const [selected, setSelected] = useState<Selected | null>(
    focusedOrg ? { type: 'org', data: focusedOrg } : null
  )

  const visibleOrgs = activeCategory
    ? orgs.filter((o) => o.category === activeCategory)
    : orgs

  const visibleLocations = activeLocationLabel
    ? locations.filter((l) => l.label === activeLocationLabel)
    : locations

  return (
    <div className="relative h-full w-full">
      <MapContainer
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        crs={GTA_CRS as any}
        center={focusedOrg ? [focusedOrg.hq_y, focusedOrg.hq_x] : [0, 0]}
        zoom={focusedOrg ? 4 : MAP_DEFAULT_ZOOM}
        minZoom={MAP_MIN_ZOOM}
        maxZoom={MAP_MAX_ZOOM}
        maxBounds={MAP_MAX_BOUNDS}
        maxBoundsViscosity={1}
        style={{ height: '100%', width: '100%', background: '#0FA8D2' }}
      >
        <MapBaseLayers />
        <MapClickClose onClose={() => setSelected(null)} />

        {/* 조직 거점 마커 */}
        {showOrgs && visibleOrgs.map((org) => (
          <CircleMarker
            key={`org-${org.id}`}
            center={[org.hq_y, org.hq_x]}
            radius={selected?.type === 'org' && selected.data.id === org.id ? 13 : 10}
            bubblingMouseEvents={false}
            pathOptions={{ fillColor: getOrgColor(org), color: '#fff', fillOpacity: 0.9, weight: 2 }}
            eventHandlers={{
              click: (e) => {
                e.originalEvent.stopPropagation()
                setSelected((prev) =>
                  prev?.type === 'org' && prev.data.id === org.id ? null : { type: 'org', data: org }
                )
              },
            }}
          >
            {!(selected?.type === 'org' && selected.data.id === org.id) && <Tooltip direction="top" offset={[0, -12]}>{org.name}</Tooltip>}
          </CircleMarker>
        ))}

        {/* 작업 위치 마커 */}
        {showLocations && visibleLocations.map((loc) => (
          <CircleMarker
            key={`loc-${loc.id}`}
            center={[loc.y, loc.x]}
            radius={7}
            bubblingMouseEvents={false}
            pathOptions={{ fillColor: loc.color, color: '#fff', fillOpacity: 0.85, weight: 2, dashArray: '3 2' }}
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
      {/* 선택 카드 */}
      {selected && (selected.type === 'org' ? showOrgs && visibleOrgs.some((org) => org.id === selected.data.id) : showLocations && visibleLocations.some((l) => l.id === selected.data.id)) && (
        <Popup
          key={`${selected.type}-${selected.data.id}`}
          position={selected.type === 'org' ? [selected.data.hq_y, selected.data.hq_x] : [selected.data.y, selected.data.x]}
          offset={[0, -16]}
          className="map-pin-popup"
          closeButton={false}
          closeOnClick={false}
          closeOnEscapeKey={false}
          maxWidth={320}
          autoPanPadding={[20, 20]}
        >
        <div onKeyDown={(event) => { if (event.key === 'Escape') setSelected(null) }} className="relative w-72 max-w-[calc(100vw-5rem)] max-h-[50vh] overflow-y-auto rounded-2xl border border-zinc-700 bg-zinc-900/95 backdrop-blur-md p-5 shadow-2xl">
          <button onClick={() => setSelected(null)} aria-label="설명 카드 닫기"
            className="absolute right-3 top-3 rounded-lg p-1 text-zinc-500 hover:bg-zinc-800 hover:text-white cursor-pointer"><X size={16} /></button>

          {selected.type === 'org' && (() => {
            const org = selected.data
            return (
              <>
                <div className="flex items-center gap-3 pr-5">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-zinc-800 text-xl font-black" style={{ color: getOrgColor(org) }}>
                    {org.logo_url ? <AppImage src={org.logo_url} alt={org.name} className="h-full w-full object-cover" /> : org.name.charAt(0)}
                  </div>
                  <div className="min-w-0 space-y-1.5">
                    {org.category && <span className="inline-block rounded-full border border-zinc-700 bg-zinc-800 px-2 py-0.5 text-[10px] font-semibold" style={{ color: getOrgColor(org) }}>{CATEGORY_LABEL[org.category] ?? org.category}</span>}
                    <p className="text-base font-bold text-white break-words">{org.name}</p>
                  </div>
                </div>
                <div className="mt-4 flex items-center gap-2 rounded-lg bg-zinc-800/70 px-3 py-2 text-xs text-zinc-300"><MapPin size={14} className="shrink-0 text-amber-400" />{org.hq_label || '조직 거점'}</div>
                {org.description && <p className="mt-3 line-clamp-3 text-xs leading-relaxed text-zinc-400">{org.description}</p>}
                <Link href={`/organizations/${org.id}`}
                  className="mt-4 flex items-center justify-center gap-2 rounded-xl border border-amber-400/25 bg-amber-400/10 px-4 py-2.5 text-xs font-semibold text-amber-400 hover:bg-amber-400/20 transition-colors">
                  조직 상세 보기 <ArrowUpRight size={14} />
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
        </Popup>
      )}
      </MapContainer>
    </div>
  )
}
