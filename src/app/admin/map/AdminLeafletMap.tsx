'use client'

import 'leaflet/dist/leaflet.css'
import { MapContainer, CircleMarker, Tooltip, useMapEvents } from 'react-leaflet'
import MapBaseLayers from '@/components/map/MapBaseLayers'
import L from 'leaflet'
import { safeMapColor } from '@/lib/map/color'
import {
  MAP_MIN_ZOOM, MAP_MAX_ZOOM, MAP_DEFAULT_ZOOM,
  MAP_MAX_BOUNDS, GTA_CRS_CONFIG, CATEGORY_COLOR,
} from '@/lib/map/constants'

export type AdminOrg = {
  id: string
  name: string
  color: string | null
  pin_border_color: string | null
  category: string | null
  hq_x: number | null
  hq_y: number | null
  hq_label: string | null
  hq_wiki_path: string | null
  biz_x: number | null
  biz_y: number | null
  biz_label: string | null
}

export type AdminLocation = {
  id: string
  name: string
  label: string | null
  color: string
  pin_border_color: string | null
  x: number | null
  y: number | null
  wiki_path: string | null
}

type PendingCoords = { lat: number; lng: number }

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

function MapClickHandler({ active, onMapClick }: { active: boolean; onMapClick: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      if (active) onMapClick(e.latlng.lat, e.latlng.lng)
    },
  })
  return null
}

function getOrgColor(org: AdminOrg) {
  return safeMapColor(org.color, CATEGORY_COLOR[org.category ?? ''])
}

function getOrgBorderColor(org: AdminOrg) {
  return safeMapColor(org.pin_border_color, '#ffffff')
}

function getLocationBorderColor(location: AdminLocation) {
  const color = safeMapColor(location.color, '#facc15')
  const hex = color.slice(1)
  const red = Number.parseInt(hex.slice(0, 2), 16)
  const green = Number.parseInt(hex.slice(2, 4), 16)
  const blue = Number.parseInt(hex.slice(4, 6), 16)
  const brightness = (red * 299 + green * 587 + blue * 114) / 1000
  const automatic = brightness >= 190 ? '#27272a' : '#ffffff'
  return safeMapColor(location.pin_border_color, automatic)
}

export default function AdminLeafletMap({
  orgs,
  locations,
  mode,
  orgMode = 'hq',
  selectedOrgId,
  selectedLocationId,
  pendingCoords,
  onMapClick,
  addingNew = false,
}: {
  orgs: AdminOrg[]
  locations: AdminLocation[]
  mode: 'org' | 'location'
  orgMode?: 'hq' | 'biz'
  selectedOrgId: string | null
  selectedLocationId: string | null
  pendingCoords: PendingCoords | null
  onMapClick: (lat: number, lng: number) => void
  addingNew?: boolean
}) {
  const isPlacing = addingNew || (mode === 'org' ? !!selectedOrgId : !!selectedLocationId)
  const selectedOrg = orgs.find((o) => o.id === selectedOrgId)
  const selectedLocation = locations.find((l) => l.id === selectedLocationId)

  return (
    <MapContainer
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      crs={GTA_CRS as any}
      center={[0, 0]}
      zoom={MAP_DEFAULT_ZOOM}
      minZoom={MAP_MIN_ZOOM}
      maxZoom={MAP_MAX_ZOOM}
      maxBounds={MAP_MAX_BOUNDS}
      maxBoundsViscosity={1}
      style={{ height: '100%', width: '100%', background: '#0FA8D2', cursor: isPlacing ? 'crosshair' : 'grab' }}
    >
      <MapBaseLayers />
      <MapClickHandler active={isPlacing} onMapClick={onMapClick} />

      {/* 조직 거점 마커 */}
      {orgs
        .filter((o) => o.hq_x !== null && o.hq_y !== null && o.id !== selectedOrgId)
        .map((org) => (
          <CircleMarker
            key={`org-${org.id}`}
            center={[org.hq_y!, org.hq_x!]}
            radius={8}
            pathOptions={{ fillColor: getOrgColor(org), color: getOrgBorderColor(org), fillOpacity: 0.8, weight: 2 }}
          >
            <Tooltip direction="top" offset={[0, -10]}>
              {org.name}{org.hq_label ? ` — ${org.hq_label}` : ''}
            </Tooltip>
          </CircleMarker>
        ))}

      {/* 조직 사업체 마커 (다이아몬드) */}
      {orgs
        .filter((o) => o.biz_x !== null && o.biz_y !== null && o.id !== (orgMode === 'biz' ? selectedOrgId : null))
        .map((org) => (
          <CircleMarker
            key={`biz-${org.id}`}
            center={[org.biz_y!, org.biz_x!]}
            radius={6}
            pathOptions={{ fillColor: getOrgColor(org), color: getOrgBorderColor(org), fillOpacity: 0.8, weight: 2, dashArray: '2 2' }}
          >
            <Tooltip direction="top" offset={[0, -8]}>
              {org.name} — {org.biz_label || '사업체'}
            </Tooltip>
          </CircleMarker>
        ))}

      {/* 선택된 조직 기존 위치 (점선) */}
      {selectedOrg && orgMode === 'hq' && selectedOrg.hq_x !== null && selectedOrg.hq_y !== null && !pendingCoords && (
        <CircleMarker
          center={[selectedOrg.hq_y, selectedOrg.hq_x]}
          radius={10}
          pathOptions={{ fillColor: getOrgColor(selectedOrg), color: '#fbbf24', fillOpacity: 0.35, weight: 2, dashArray: '5 4' }}
        >
          <Tooltip direction="top" offset={[0, -12]} permanent>현재 거점</Tooltip>
        </CircleMarker>
      )}
      {selectedOrg && orgMode === 'biz' && selectedOrg.biz_x !== null && selectedOrg.biz_y !== null && !pendingCoords && (
        <CircleMarker
          center={[selectedOrg.biz_y, selectedOrg.biz_x]}
          radius={8}
          pathOptions={{ fillColor: getOrgColor(selectedOrg), color: '#fbbf24', fillOpacity: 0.35, weight: 2, dashArray: '5 4' }}
        >
          <Tooltip direction="top" offset={[0, -10]} permanent>현재 사업체</Tooltip>
        </CircleMarker>
      )}

      {/* 작업 위치 마커 */}
      {locations
        .filter((l) => l.x !== null && l.y !== null && l.id !== selectedLocationId)
        .map((loc) => (
          <CircleMarker
            key={`loc-${loc.id}`}
            center={[loc.y!, loc.x!]}
            radius={7}
            pathOptions={{ fillColor: safeMapColor(loc.color), color: getLocationBorderColor(loc), fillOpacity: 0.85, weight: 2, dashArray: '3 2' }}
          >
            <Tooltip direction="top" offset={[0, -9]}>
              {loc.name}{loc.label ? ` (${loc.label})` : ''}
            </Tooltip>
          </CircleMarker>
        ))}

      {/* 선택된 작업 위치 기존 마커 (점선) */}
      {selectedLocation && selectedLocation.x !== null && selectedLocation.y !== null && !pendingCoords && (
        <CircleMarker
          center={[selectedLocation.y, selectedLocation.x]}
          radius={9}
          pathOptions={{ fillColor: safeMapColor(selectedLocation.color), color: '#fbbf24', fillOpacity: 0.35, weight: 2, dashArray: '5 4' }}
        >
          <Tooltip direction="top" offset={[0, -11]} permanent>현재 위치</Tooltip>
        </CircleMarker>
      )}

      {/* 임시 마커 (공통) */}
      {pendingCoords && mode === 'org' && selectedOrg && (
        <CircleMarker
          center={[pendingCoords.lat, pendingCoords.lng]}
          radius={orgMode === 'biz' ? 9 : 12}
          pathOptions={{
            fillColor: getOrgColor(selectedOrg), color: '#fbbf24', fillOpacity: 1, weight: 3,
            ...(orgMode === 'biz' ? { dashArray: '3 2' } : {}),
          }}
        >
          <Tooltip direction="top" offset={[0, -14]} permanent>
            {selectedOrg.name} {orgMode === 'biz' ? '— 사업체' : '— 거점'}
          </Tooltip>
        </CircleMarker>
      )}
      {pendingCoords && mode === 'location' && (
        <CircleMarker
          center={[pendingCoords.lat, pendingCoords.lng]}
          radius={10}
          pathOptions={{ fillColor: safeMapColor(selectedLocation?.color, '#facc15'), color: '#fbbf24', fillOpacity: 1, weight: 3, dashArray: '3 2' }}
        >
          <Tooltip direction="top" offset={[0, -12]} permanent>{selectedLocation?.name ?? '새 위치'}</Tooltip>
        </CircleMarker>
      )}
    </MapContainer>
  )
}
