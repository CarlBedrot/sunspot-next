'use client'

import { useEffect, useState } from 'react'
import { MapContainer, TileLayer } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'

import type { Bench, Building, GreenArea, ShadowFeature, WeatherSnapshot } from '@/lib/types'
import { fetchBenches, fetchBuildings, fetchGreenAreas } from '@/lib/overpass'
import { getSunPosition, projectShadow } from '@/lib/shadow'
import { fetchWeather } from '@/lib/weather'
import { ShadowLayer } from './ShadowLayer'
import { SunSpotLayer } from './SunSpotLayer'
import { WeatherBadge } from './WeatherBadge'
import { AttributionFooter } from './AttributionFooter'

const COPENHAGEN_CENTER: [number, number] = [55.6761, 12.5683]
// [south, west, north, east] — a ~1.5km box around central Copenhagen.
const COPENHAGEN_BBOX: [number, number, number, number] = [55.668, 12.555, 55.684, 12.582]

export function SunspotMap() {
  const [shadows, setShadows] = useState<ShadowFeature[]>([])
  const [benches, setBenches] = useState<Bench[]>([])
  const [greenAreas, setGreenAreas] = useState<GreenArea[]>([])
  const [weather, setWeather] = useState<WeatherSnapshot | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    async function load() {
      try {
        const now = new Date()
        const center = { lat: COPENHAGEN_CENTER[0], lng: COPENHAGEN_CENTER[1] }
        const sun = getSunPosition(now, center)

        const [buildingsResult, benchesResult, greenAreasResult, weatherResult] = await Promise.allSettled([
          fetchBuildings(COPENHAGEN_BBOX),
          fetchBenches(COPENHAGEN_BBOX),
          fetchGreenAreas(COPENHAGEN_BBOX),
          fetchWeather(center),
        ])

        if (cancelled) return

        const failures: string[] = []

        if (buildingsResult.status === 'fulfilled') {
          const projectedShadows: ShadowFeature[] = []
          for (const building of buildingsResult.value as Building[]) {
            const shadow = projectShadow(building, sun)
            if (shadow) projectedShadows.push(shadow)
          }
          setShadows(projectedShadows)
        } else {
          failures.push(`buildings: ${buildingsResult.reason instanceof Error ? buildingsResult.reason.message : 'Failed to load'}`)
        }

        if (benchesResult.status === 'fulfilled') {
          setBenches(benchesResult.value)
        } else {
          failures.push(`benches: ${benchesResult.reason instanceof Error ? benchesResult.reason.message : 'Failed to load'}`)
        }

        if (greenAreasResult.status === 'fulfilled') {
          setGreenAreas(greenAreasResult.value)
        } else {
          failures.push(`green areas: ${greenAreasResult.reason instanceof Error ? greenAreasResult.reason.message : 'Failed to load'}`)
        }

        if (weatherResult.status === 'fulfilled') {
          setWeather(weatherResult.value)
        } else {
          failures.push(`weather: ${weatherResult.reason instanceof Error ? weatherResult.reason.message : 'Failed to load'}`)
        }

        setError(failures.length > 0 ? failures.join('; ') : null)
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load map data')
        }
      }
    }

    load()
    return () => {
      cancelled = true
    }
  }, [])

  return (
    <div className="sunspot-map">
      {error && <div className="sunspot-map__error">Couldn&apos;t load data: {error}</div>}
      <WeatherBadge weather={weather} />
      <MapContainer center={COPENHAGEN_CENTER} zoom={15} className="sunspot-map__container">
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <ShadowLayer shadows={shadows} />
        <SunSpotLayer benches={benches} greenAreas={greenAreas} shadows={shadows} />
      </MapContainer>
      <AttributionFooter />
    </div>
  )
}
