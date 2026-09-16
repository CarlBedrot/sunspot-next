'use client'

import { GeoJSON } from 'react-leaflet'
import type { Feature, FeatureCollection, Polygon } from 'geojson'
import type { ShadowFeature } from '@/lib/types'

export function ShadowLayer({ shadows }: { shadows: ShadowFeature[] }) {
  const collection: FeatureCollection<Polygon> = {
    type: 'FeatureCollection',
    features: shadows.map(
      (shadow): Feature<Polygon> => ({
        type: 'Feature',
        properties: { buildingId: shadow.buildingId },
        geometry: { type: 'Polygon', coordinates: [shadow.polygon] },
      })
    ),
  }

  return (
    <GeoJSON
      data={collection}
      style={{ color: '#2b2b2b', weight: 0, fillColor: '#2b2b2b', fillOpacity: 0.35 }}
    />
  )
}
