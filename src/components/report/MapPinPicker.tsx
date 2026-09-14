'use client'

import 'leaflet/dist/leaflet.css'
import { MapContainer, TileLayer, CircleMarker, useMapEvents } from 'react-leaflet'
import L from 'leaflet'
import {
  MAP_TILE_URLS, MAP_MIN_ZOOM, MAP_MAX_ZOOM, MAP_DEFAULT_ZOOM,
  MAP_MAX_BOUNDS, MAP_TILE_BOUNDS, GTA_CRS_CONFIG,
} from '@/lib/map/constants'

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

function ClickHandler({ onPick }: { onPick: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) { onPick(e.latlng.lat, e.latlng.lng) },
  })
  return null
}

type Props = {
  coords: { lat: number; lng: number } | null
  onPick?: (lat: number, lng: number) => void
  readOnly?: boolean
}

export default function MapPinPicker({ coords, onPick, readOnly = false }: Props) {
  return (
    <MapContainer
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      crs={GTA_CRS as any}
      center={coords ? [coords.lat, coords.lng] : [0, 0]}
      zoom={MAP_DEFAULT_ZOOM}
      minZoom={MAP_MIN_ZOOM}
      maxZoom={MAP_MAX_ZOOM}
      maxBounds={MAP_MAX_BOUNDS}
      maxBoundsViscosity={1}
      scrollWheelZoom={!readOnly}
      dragging={!readOnly}
      doubleClickZoom={!readOnly}
      touchZoom={!readOnly}
      zoomControl={!readOnly}
      style={{ height: '100%', width: '100%', background: '#0FA8D2', cursor: readOnly ? 'default' : 'crosshair' }}
    >
      <TileLayer url={MAP_TILE_URLS.atlas} noWrap bounds={MAP_TILE_BOUNDS} minZoom={MAP_MIN_ZOOM} maxZoom={MAP_MAX_ZOOM} />
      {!readOnly && onPick && <ClickHandler onPick={onPick} />}
      {coords && (
        <CircleMarker
          center={[coords.lat, coords.lng]}
          radius={10}
          pathOptions={{ fillColor: '#fbbf24', color: '#fff', fillOpacity: 1, weight: 2 }}
        />
      )}
    </MapContainer>
  )
}
