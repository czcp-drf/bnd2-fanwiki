'use client'

import 'leaflet/dist/leaflet.css'
import { MapContainer, Marker, Tooltip, Popup, useMap, useMapEvents } from 'react-leaflet'
import './MapPinPopup.css'
import MapBaseLayers from '@/components/map/MapBaseLayers'
import L from 'leaflet'
import { safeMapColor } from '@/lib/map/color'
import { useState, type ReactNode } from 'react'
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
  hq_x: number | null
  hq_y: number | null
  hq_label: string | null
  hq_wiki_path: string | null
  biz_x: number | null
  biz_y: number | null
  biz_label: string | null
  description: string | null
  logo_url: string | null
  linked_business: {
    id: string
    name: string
    description: string | null
    hq_label: string | null
    hq_wiki_path: string | null
    logo_url: string | null
  } | null
}

export type LocationMarker = {
  id: string
  name: string
  label: string | null
  description: string | null
  color: string
  x: number
  y: number
  wiki_path: string | null
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

function MapPinPopup({
  position,
  offset,
  children,
}: {
  position: [number, number]
  offset: [number, number]
  children: ReactNode
}) {
  const map = useMap()
  const showBelowPin = (() => {
    const point = map.latLngToContainerPoint(position)
    const topSpaceRequired = 420
    return point.y < topSpaceRequired
  })()
  const popupOffset: [number, number] = showBelowPin ? [offset[0], 0] : offset

  return (
    <Popup
      position={position}
      offset={popupOffset}
      className={`map-pin-popup${showBelowPin ? ' map-pin-popup-below' : ''}`}
      closeButton={false}
      closeOnClick={false}
      closeOnEscapeKey={false}
      maxWidth={320}
      autoPan={!showBelowPin}
      autoPanPadding={[20, 20]}
    >
      {children}
    </Popup>
  )
}

function getOrgColor(org: OrgMarker) {
  return safeMapColor(org.color, CATEGORY_COLOR[org.category ?? ''])
}

function createDropIcon(color: string, selected: boolean): L.DivIcon {
  color = safeMapColor(color)
  const w = selected ? 28 : 22
  const h = selected ? 38 : 30
  const cx = w / 2
  const r = cx - 1
  const cy = r + 1
  const tipY = h - 1
  const ctrlY = Math.round(cy + r * 0.65)
  const path = `M ${cx} ${tipY} C ${cx} ${tipY} 1 ${ctrlY} 1 ${cy} A ${r} ${r} 0 1 1 ${w - 1} ${cy} C ${w - 1} ${ctrlY} ${cx} ${tipY} ${cx} ${tipY} Z`
  const innerR = Math.round(r * 0.36)
  const innerCy = Math.round(cy * 0.88)
  const glow = `drop-shadow(0 0 ${selected ? 8 : 5}px ${color}cc) drop-shadow(0 2px 8px rgba(0,0,0,0.5))`
  const html = `<svg width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" xmlns="http://www.w3.org/2000/svg" style="overflow:visible;filter:${glow}"><path d="${path}" fill="${color}" stroke="white" stroke-width="2"/><circle cx="${cx}" cy="${innerCy}" r="${innerR}" fill="rgba(255,255,255,0.3)"/></svg>`
  return L.divIcon({ html, className: '', iconSize: [w, h], iconAnchor: [cx, h], tooltipAnchor: [0, -h] })
}

function createBizIcon(color: string, selected: boolean): L.DivIcon {
  color = safeMapColor(color)
  const size = selected ? 20 : 16
  const half = size / 2
  const path = `M ${half} 1 L ${size - 1} ${half} L ${half} ${size - 1} L 1 ${half} Z`
  const glow = `drop-shadow(0 0 ${selected ? 7 : 4}px ${color}cc) drop-shadow(0 2px 6px rgba(0,0,0,0.4))`
  const html = `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg" style="overflow:visible;filter:${glow}"><path d="${path}" fill="${color}" stroke="white" stroke-width="2"/></svg>`
  return L.divIcon({ html, className: '', iconSize: [size, size], iconAnchor: [half, half], tooltipAnchor: [0, -half - 4] })
}

function createLocationIcon(color: string, selected: boolean): L.DivIcon {
  color = safeMapColor(color)
  const r = selected ? 9 : 7
  const pad = 8
  const size = (r + pad) * 2
  const c = size / 2
  const glow = `drop-shadow(0 0 ${selected ? 8 : 5}px ${color}dd)`
  const html = `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg" style="overflow:visible;filter:${glow}"><circle cx="${c}" cy="${c}" r="${r + 4}" fill="${color}22" stroke="${color}66" stroke-width="1.5"/><circle cx="${c}" cy="${c}" r="${r}" fill="${color}" stroke="white" stroke-width="2"/></svg>`
  return L.divIcon({ html, className: '', iconSize: [size, size], iconAnchor: [c, c], tooltipAnchor: [0, -(r + pad)] })
}

type Selected =
  | { type: 'org'; data: OrgMarker }
  | { type: 'biz'; data: OrgMarker }
  | { type: 'location'; data: LocationMarker }

export default function LeafletMap({
  orgs,
  locations,
  activeCategory,
  showOrgs,
  showLocations,
  activeLocationLabel,
  focusOrgId,
  focusCoordinates,
}: {
  orgs: OrgMarker[]
  locations: LocationMarker[]
  activeCategory: string | null
  showOrgs: boolean
  showLocations: boolean
  activeLocationLabel: string | null
  focusOrgId: string | null
  focusCoordinates: { x: number; y: number } | null
}) {
  const focusedOrg = orgs.find((org) => org.id === focusOrgId)
  const focusedPosition = focusedOrg
    ? focusedOrg.hq_x !== null && focusedOrg.hq_y !== null
      ? [focusedOrg.hq_y, focusedOrg.hq_x] as [number, number]
      : focusedOrg.biz_x !== null && focusedOrg.biz_y !== null
        ? [focusedOrg.biz_y, focusedOrg.biz_x] as [number, number]
        : null
    : null
  const [selected, setSelected] = useState<Selected | null>(
    focusedOrg
      ? focusedOrg.hq_x !== null && focusedOrg.hq_y !== null
        ? { type: 'org', data: focusedOrg }
        : focusedOrg.biz_x !== null && focusedOrg.biz_y !== null
          ? { type: 'biz', data: focusedOrg }
          : null
      : null
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
        center={focusCoordinates ? [focusCoordinates.y, focusCoordinates.x] : focusedPosition ?? [0, 0]}
        zoom={focusCoordinates || focusedPosition ? 4 : MAP_DEFAULT_ZOOM}
        minZoom={MAP_MIN_ZOOM}
        maxZoom={MAP_MAX_ZOOM}
        maxBounds={MAP_MAX_BOUNDS}
        maxBoundsViscosity={1}
        style={{ height: '100%', width: '100%', background: '#0FA8D2' }}
      >
        <MapBaseLayers />
        <MapClickClose onClose={() => setSelected(null)} />

        {/* 사건 상세에서 전달된 위치 */}
        {focusCoordinates && (
          <Marker
            position={[focusCoordinates.y, focusCoordinates.x]}
            icon={createDropIcon('#fbbf24', true)}
            interactive={false}
            zIndexOffset={1000}
          >
            <Tooltip permanent direction="top" offset={[0, -2]}>
              사건 위치
            </Tooltip>
          </Marker>
        )}

        {/* 조직 거점 마커 */}
        {showOrgs && visibleOrgs.map((org) => {
          if (org.hq_x === null || org.hq_y === null) return null
          const isSelected = selected?.type === 'org' && selected.data.id === org.id
          return (
            <Marker
              key={`org-${org.id}`}
              position={[org.hq_y, org.hq_x]}
              icon={createDropIcon(getOrgColor(org), isSelected)}
              bubblingMouseEvents={false}
              eventHandlers={{
                click: (e) => {
                  e.originalEvent.stopPropagation()
                  setSelected((prev) =>
                    prev?.type === 'org' && prev.data.id === org.id ? null : { type: 'org', data: org }
                  )
                },
              }}
            >
              {!isSelected && <Tooltip direction="top">{org.name}</Tooltip>}
            </Marker>
          )
        })}

        {/* 사업체 마커 */}
        {showOrgs && visibleOrgs.filter((o) => o.biz_x !== null && o.biz_y !== null).map((org) => {
          const isSelected = selected?.type === 'biz' && selected.data.id === org.id
          return (
            <Marker
              key={`biz-${org.id}`}
              position={[org.biz_y!, org.biz_x!]}
              icon={org.linked_business ? createDropIcon(getOrgColor(org), isSelected) : createBizIcon(getOrgColor(org), isSelected)}
              bubblingMouseEvents={false}
              eventHandlers={{
                click: (e) => {
                  e.originalEvent.stopPropagation()
                  setSelected((prev) =>
                    prev?.type === 'biz' && prev.data.id === org.id ? null : { type: 'biz', data: org }
                  )
                },
              }}
            >
              {!isSelected && <Tooltip direction="top">{org.name}{org.linked_business ? ` — ${org.linked_business.name}` : ` — ${org.biz_label || '사업체'}`}</Tooltip>}
            </Marker>
          )
        })}

        {/* 주요 장소 마커 */}
        {showLocations && visibleLocations.map((loc) => {
          const isSelected = selected?.type === 'location' && selected.data.id === loc.id
          return (
            <Marker
              key={`loc-${loc.id}`}
              position={[loc.y, loc.x]}
              icon={createLocationIcon(loc.color, isSelected)}
              bubblingMouseEvents={false}
              eventHandlers={{
                click: (e) => {
                  e.originalEvent.stopPropagation()
                  setSelected((prev) =>
                    prev?.type === 'location' && prev.data.id === loc.id ? null : { type: 'location', data: loc }
                  )
                },
              }}
            >
              <Tooltip direction="top">
                {loc.name}{loc.label ? ` (${loc.label})` : ''}
              </Tooltip>
            </Marker>
          )
        })}
      {/* 선택 카드 */}
      {selected && (
        selected.type === 'org' ? showOrgs && visibleOrgs.some((o) => o.id === selected.data.id) :
          selected.type === 'biz' ? showOrgs && visibleOrgs.some((o) => o.id === selected.data.id && o.biz_x !== null && o.biz_y !== null) :
        showLocations && visibleLocations.some((l) => l.id === selected.data.id)
      ) && (
        <MapPinPopup
          key={`${selected.type}-${selected.data.id}`}
          position={
            selected.type === 'org' ? [selected.data.hq_y!, selected.data.hq_x!] :
            selected.type === 'biz' ? [selected.data.biz_y!, selected.data.biz_x!] :
            [selected.data.y, selected.data.x]
          }
          offset={selected.type === 'org' || (selected.type === 'biz' && selected.data.linked_business) ? [0, -40] : selected.type === 'biz' ? [0, -16] : [0, -20]}
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
                  className="map-org-detail-link mt-4 flex items-center justify-center gap-2 rounded-xl border border-sky-400/25 bg-sky-400/10 px-4 py-2.5 text-xs font-semibold text-sky-400 transition-colors hover:bg-sky-400/20">
                  조직 상세 보기 <ArrowUpRight size={14} />
                </Link>
                {org.hq_wiki_path && (
                  <Link
                    href={org.hq_wiki_path}
                    target="_blank"
                    rel="noreferrer"
                    className="map-wiki-link mt-2 flex items-center justify-center gap-2 rounded-xl border border-amber-400/25 bg-amber-400/10 px-4 py-2.5 text-xs font-semibold text-amber-400 transition-colors hover:bg-amber-400/20"
                  >
                    위키 바로가기 <ArrowUpRight size={14} />
                  </Link>
                )}
              </>
            )
          })()}

          {selected.type === 'biz' && (() => {
            const org = selected.data
            const business = org.linked_business
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
                <div className="mt-4 flex items-center gap-2 rounded-lg bg-zinc-800/70 px-3 py-2 text-xs text-zinc-300"><MapPin size={14} className="shrink-0 text-amber-400" />조직 거점</div>
                <div className="mt-3 rounded-lg border border-zinc-700/80 bg-zinc-800/50 px-3 py-2.5">
                  <p className="text-[10px] font-semibold text-purple-300">불법 사업체</p>
                  <p className="mt-1 text-sm font-semibold text-white break-words">{business?.name || org.biz_label || '불법 사업체'}</p>
                  {business?.hq_label && <p className="mt-1 text-xs text-zinc-400">{business.hq_label}</p>}
                  {business?.description && <p className="mt-2 line-clamp-4 text-xs leading-relaxed text-zinc-400">{business.description}</p>}
                </div>
                <Link href={`/organizations/${org.id}`}
                  className="mt-4 flex items-center justify-center gap-2 rounded-xl border border-amber-400/25 bg-amber-400/10 px-4 py-2.5 text-xs font-semibold text-amber-400 hover:bg-amber-400/20 transition-colors">
                  조직 상세 보기 <ArrowUpRight size={14} />
                </Link>
                {business?.hq_wiki_path && (
                  <Link
                    href={business.hq_wiki_path}
                    target="_blank"
                    rel="noreferrer"
                    className="map-wiki-link mt-2 flex items-center justify-center gap-2 rounded-xl border border-amber-400/25 bg-amber-400/10 px-4 py-2.5 text-xs font-semibold text-amber-400 hover:bg-amber-400/20 transition-colors"
                  >
                    위키 바로가기 <ArrowUpRight size={14} />
                  </Link>
                )}
              </>
            )
          })()}

          {selected.type === 'location' && (() => {
            const loc = selected.data
            return (
              <>
                <div className="flex items-center gap-2 mb-1">
                  <div className="h-3 w-3 rounded-full flex-shrink-0" style={{ backgroundColor: safeMapColor(loc.color) }} />
                  <p className="text-sm font-bold text-white pr-4">{loc.name}</p>
                </div>
                {loc.label && (
                  <span className="ml-5 inline-block rounded-full bg-zinc-800 px-2 py-0.5 text-[10px] text-zinc-400">
                    {loc.label}
                  </span>
                )}
                {loc.description && <p className="text-xs text-zinc-500 ml-5 mt-1">{loc.description}</p>}
                {loc.wiki_path && (
                  <Link
                    href={loc.wiki_path}
                    target="_blank"
                    rel="noreferrer"
                    className="map-wiki-link mt-4 flex items-center justify-center gap-2 rounded-xl border border-amber-400/25 bg-amber-400/10 px-4 py-2.5 text-xs font-semibold text-amber-400 transition-colors hover:bg-amber-400/20"
                  >
                    위키 바로가기 <ArrowUpRight size={14} />
                  </Link>
                )}
              </>
            )
          })()}
        </div>
        </MapPinPopup>
      )}
      </MapContainer>
    </div>
  )
}
