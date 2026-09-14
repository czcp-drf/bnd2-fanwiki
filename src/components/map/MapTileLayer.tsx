'use client'

import { createElementObject, createTileLayerComponent, updateGridLayer, withPane } from '@react-leaflet/core'
import { TileLayer as LeafletTileLayer, type Coords } from 'leaflet'
import type { TileLayerProps } from 'react-leaflet'

class MapTileLayerClass extends LeafletTileLayer {
  _isValidTile(coords: Coords) {
    const minZoom = this.options.minZoom ?? 0
    const maxZoom = this.options.maxZoom ?? Infinity
    const tileCount = 2 ** coords.z

    return (
      coords.z >= minZoom &&
      coords.z <= maxZoom &&
      coords.x >= 0 &&
      coords.y >= 0 &&
      coords.x < tileCount &&
      coords.y < tileCount
    )
  }
}

export const MapTileLayer = createTileLayerComponent<MapTileLayerClass, TileLayerProps>(
  ({ url, ...options }, context) => {
    const layer = new MapTileLayerClass(url, withPane(options, context))
    return createElementObject(layer, context)
  },
  (layer, props, prevProps) => {
    updateGridLayer(layer, props, prevProps)
    if (props.url !== prevProps.url) layer.setUrl(props.url)
  },
)
