'use client'

import { LayersControl, useMap } from 'react-leaflet'
import { MAP_MAX_ZOOM, MAP_MIN_ZOOM, MAP_TILE_BOUNDS, MAP_TILE_URLS } from '@/lib/map/constants'
import { MapTileLayer } from './MapTileLayer'
import './MapBaseLayers.css'

export default function MapBaseLayers() {
  const map = useMap()

  return (
    <LayersControl position="topright" collapsed={false}>
      <LayersControl.BaseLayer checked name="Atlas">
        <MapTileLayer url={MAP_TILE_URLS.atlas} noWrap bounds={MAP_TILE_BOUNDS} minZoom={MAP_MIN_ZOOM} maxZoom={MAP_MAX_ZOOM} eventHandlers={{
          add: () => { map.getContainer().style.background = '#0FA8D2' },
        }} />
      </LayersControl.BaseLayer>
      <LayersControl.BaseLayer name="위성">
        <MapTileLayer url={MAP_TILE_URLS.satellite} noWrap bounds={MAP_TILE_BOUNDS} minZoom={MAP_MIN_ZOOM} maxZoom={MAP_MAX_ZOOM} eventHandlers={{
          add: () => { map.getContainer().style.background = '#153E6A' },
        }} />
      </LayersControl.BaseLayer>
    </LayersControl>
  )
}
