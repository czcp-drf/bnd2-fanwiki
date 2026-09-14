'use client'

import { LayersControl, TileLayer, useMap } from 'react-leaflet'
import { MAP_MAX_BOUNDS, MAP_TILE_URLS } from '@/lib/map/constants'
import './MapBaseLayers.css'

export default function MapBaseLayers() {
  const map = useMap()

  return (
    <LayersControl position="topright" collapsed={false}>
      <LayersControl.BaseLayer checked name="Atlas">
        <TileLayer url={MAP_TILE_URLS.atlas} noWrap bounds={MAP_MAX_BOUNDS} eventHandlers={{
          add: () => { map.getContainer().style.background = '#0FA8D2' },
        }} />
      </LayersControl.BaseLayer>
      <LayersControl.BaseLayer name="위성">
        <TileLayer url={MAP_TILE_URLS.satellite} noWrap bounds={MAP_MAX_BOUNDS} eventHandlers={{
          add: () => { map.getContainer().style.background = '#153E6A' },
        }} />
      </LayersControl.BaseLayer>
    </LayersControl>
  )
}
