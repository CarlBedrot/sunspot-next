'use client'

import { useMemo } from 'react'
import { CircleMarker, Polygon as LeafletPolygon } from 'react-leaflet'
import type { Bench, GreenArea, ShadowFeature } from '@/lib/types'
import { buildShadowPolygons, classifyGreenArea, isBenchSunny } from '@/lib/sunspots'

export function SunSpotLayer({
  benches,
  greenAreas,
  shadows,
  daylight,
}: {
  benches: Bench[]
  greenAreas: GreenArea[]
  shadows: ShadowFeature[]
  daylight: boolean
}) {
  const shadowPolygons = useMemo(() => buildShadowPolygons(shadows), [shadows])

  const classifiedAreas = greenAreas.map((area) => ({
    area,
    sunny: daylight && classifyGreenArea(area, shadowPolygons).sunny,
  }))

  return (
    <>
      {benches.map((bench) => {
        const sunny = daylight && isBenchSunny(bench, shadowPolygons)
        return (
          <CircleMarker
            key={bench.id}
            center={[bench.location.lat, bench.location.lng]}
            radius={sunny ? 6 : 3}
            pathOptions={{
              color: sunny ? '#f5a623' : '#7a7a7a',
              fillColor: sunny ? '#f5a623' : '#7a7a7a',
              fillOpacity: sunny ? 0.9 : 0.4,
            }}
          />
        )
      })}
      {classifiedAreas.map(({ area, sunny }) => {
        const positions = area.polygon.map(([lng, lat]) => [lat, lng] as [number, number])
        return (
          <LeafletPolygon
            key={area.id}
            positions={positions}
            pathOptions={{
              color: sunny ? '#7ed957' : '#4a5d43',
              weight: 1,
              fillColor: sunny ? '#7ed957' : '#4a5d43',
              fillOpacity: sunny ? 0.5 : 0.2,
            }}
          />
        )
      })}
    </>
  )
}
