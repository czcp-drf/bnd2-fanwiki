'use client'

import { LayersControl, TileLayer } from 'react-leaflet'
import { MAP_TILE_URLS } from '@/lib/map/constants'
import './MapBaseLayers.css'

export default function MapBaseLayers() {
  return (
    <LayersControl position="topright" collapsed={false}>
      <LayersControl.BaseLayer checked name="Atlas">
        <TileLayer url={MAP_TILE_URLS.atlas} noWrap />
      </LayersControl.BaseLayer>
      <LayersControl.BaseLayer name="위성">
        <TileLayer url={MAP_TILE_URLS.satellite} noWrap />
      </LayersControl.BaseLayer>
    </LayersControl>
  )
}
