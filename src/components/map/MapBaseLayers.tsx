'use client'

import { LayersControl, TileLayer } from 'react-leaflet'
import { MAP_TILE_URLS } from '@/lib/map/constants'

export default function MapBaseLayers() {
  return (
    <LayersControl position="topright" collapsed={false}>
      <LayersControl.BaseLayer checked name="Atlas (일반 지도)">
        <TileLayer url={MAP_TILE_URLS.atlas} noWrap />
      </LayersControl.BaseLayer>
      <LayersControl.BaseLayer name="Satellite (위성 지도)">
        <TileLayer url={MAP_TILE_URLS.satellite} noWrap />
      </LayersControl.BaseLayer>
    </LayersControl>
  )
}
