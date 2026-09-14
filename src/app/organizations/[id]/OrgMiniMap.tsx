'use client'

import 'leaflet/dist/leaflet.css'
import { MapContainer, TileLayer, Marker, Tooltip } from 'react-leaflet'
import L from 'leaflet'
import Link from 'next/link'
import { ArrowUpRight } from 'lucide-react'
import { MAP_TILE_URLS, MAP_MAX_BOUNDS, GTA_CRS_CONFIG, CATEGORY_COLOR } from '@/lib/map/constants'

export type OrgMapData = {
  id: string
  name: string
  color: string | null
  category: string | null
  hq_x: number
  hq_y: number
  hq_label: string | null
  biz_x: number | null
  biz_y: number | null
  biz_label: string | null
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

function getColor(org: OrgMapData) {
  return org.color ?? CATEGORY_COLOR[org.category ?? ''] ?? '#71717a'
}

function createDropIcon(color: string): L.DivIcon {
  const w = 22, h = 30
  const cx = w / 2
  const r = cx - 1
  const cy = r + 1
  const tipY = h - 1
  const ctrlY = Math.round(cy + r * 0.65)
  const path = `M ${cx} ${tipY} C ${cx} ${tipY} 1 ${ctrlY} 1 ${cy} A ${r} ${r} 0 1 1 ${w - 1} ${cy} C ${w - 1} ${ctrlY} ${cx} ${tipY} ${cx} ${tipY} Z`
  const innerR = Math.round(r * 0.36)
  const innerCy = Math.round(cy * 0.88)
  const glow = `drop-shadow(0 0 5px ${color}cc) drop-shadow(0 2px 8px rgba(0,0,0,0.5))`
  const html = `<svg width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" xmlns="http://www.w3.org/2000/svg" style="overflow:visible;filter:${glow}"><path d="${path}" fill="${color}" stroke="white" stroke-width="2"/><circle cx="${cx}" cy="${innerCy}" r="${innerR}" fill="rgba(255,255,255,0.3)"/></svg>`
  return L.divIcon({ html, className: '', iconSize: [w, h], iconAnchor: [cx, h], tooltipAnchor: [0, -h] })
}

function createBizIcon(color: string): L.DivIcon {
  const size = 16, half = size / 2
  const path = `M ${half} 1 L ${size - 1} ${half} L ${half} ${size - 1} L 1 ${half} Z`
  const glow = `drop-shadow(0 0 4px ${color}cc) drop-shadow(0 2px 6px rgba(0,0,0,0.4))`
  const html = `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg" style="overflow:visible;filter:${glow}"><path d="${path}" fill="${color}" stroke="white" stroke-width="2"/></svg>`
  return L.divIcon({ html, className: '', iconSize: [size, size], iconAnchor: [half, half], tooltipAnchor: [0, -(half + 4)] })
}

export default function OrgMiniMap({ org }: { org: OrgMapData }) {
  const color = getColor(org)
  const hasBiz = org.biz_x !== null && org.biz_y !== null

  return (
    <div className="relative isolate z-0 overflow-hidden rounded-xl border border-zinc-800" style={{ height: 260 }}>
      <MapContainer
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        crs={GTA_CRS as any}
        center={[org.hq_y, org.hq_x]}
        zoom={4}
        minZoom={1}
        maxZoom={5}
        maxBounds={MAP_MAX_BOUNDS}
        maxBoundsViscosity={1}
        scrollWheelZoom={false}
        dragging={false}
        doubleClickZoom={false}
        touchZoom={false}
        boxZoom={false}
        keyboard={false}
        style={{ height: '100%', width: '100%', background: '#0FA8D2' }}
        zoomControl={false}
        attributionControl={false}
      >
        <TileLayer url={MAP_TILE_URLS.atlas} noWrap />

        <Marker position={[org.hq_y, org.hq_x]} icon={createDropIcon(color)}>
          <Tooltip permanent direction="top" offset={[0, -2]}>
            {org.hq_label || '거점'}
          </Tooltip>
        </Marker>

        {hasBiz && (
          <Marker position={[org.biz_y!, org.biz_x!]} icon={createBizIcon(color)}>
            <Tooltip permanent direction="top" offset={[0, -8]}>
              {org.biz_label || '사업체'}
            </Tooltip>
          </Marker>
        )}
      </MapContainer>

      <div className="absolute bottom-3 right-3 z-[1000]">
        <Link
          href={`/map?org=${org.id}`}
          className="flex items-center gap-1.5 rounded-lg border border-zinc-700 bg-zinc-900/90 px-3 py-2 text-xs font-medium text-amber-400 backdrop-blur hover:bg-zinc-800 transition-colors"
        >
          전체 지도에서 보기
          <ArrowUpRight size={12} />
        </Link>
      </div>
    </div>
  )
}
