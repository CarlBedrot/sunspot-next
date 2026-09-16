import * as SunCalc from 'suncalc'
import { convex } from '@turf/turf'
import type { Building, LatLng, ShadowFeature, SunPosition } from './types'

export function resolveHeight(
  tags: Record<string, string | undefined>
): { heightMeters: number; heightSource: 'tag' | 'levels' | 'default' } {
  const heightTag = tags.height ? Number.parseFloat(tags.height) : NaN
  if (Number.isFinite(heightTag) && heightTag > 0) {
    return { heightMeters: heightTag, heightSource: 'tag' }
  }

  const levelsTag = tags['building:levels'] ? Number.parseFloat(tags['building:levels']) : NaN
  if (Number.isFinite(levelsTag) && levelsTag > 0) {
    return { heightMeters: levelsTag * 3, heightSource: 'levels' }
  }

  return { heightMeters: 6, heightSource: 'default' }
}

export function getSunPosition(date: Date, location: LatLng): SunPosition {
  const pos = SunCalc.getPosition(date, location.lat, location.lng)
  return {
    azimuth: (pos.azimuth * Math.PI) / 180,
    altitude: (pos.altitude * Math.PI) / 180,
  }
}

const EARTH_RADIUS_METERS = 6378137

/** Offsets a [lng, lat] point by (dx, dy) meters using an equirectangular approximation — fine at building scale. */
function offsetPoint(point: [number, number], dxMeters: number, dyMeters: number): [number, number] {
  const [lng, lat] = point
  const latRad = (lat * Math.PI) / 180
  const dLat = (dyMeters / EARTH_RADIUS_METERS) * (180 / Math.PI)
  const dLng = (dxMeters / (EARTH_RADIUS_METERS * Math.cos(latRad))) * (180 / Math.PI)
  return [lng + dLng, lat + dLat]
}

export function projectShadow(building: Building, sun: SunPosition): ShadowFeature | null {
  if (sun.altitude <= 0) {
    return null
  }

  const shadowLength = building.heightMeters / Math.tan(sun.altitude)

  // sun.azimuth is a compass bearing from north, clockwise; the shadow points opposite the sun.
  const shadowBearing = sun.azimuth + Math.PI

  const dxMeters = shadowLength * Math.sin(shadowBearing)
  const dyMeters = shadowLength * Math.cos(shadowBearing)

  const offsetRing = building.footprint.map((pt) => offsetPoint(pt, dxMeters, dyMeters))

  const points = [...building.footprint, ...offsetRing].map((pt) => [pt[0], pt[1]] as [number, number])
  const hull = convex({
    type: 'FeatureCollection',
    features: points.map((pt) => ({
      type: 'Feature',
      properties: {},
      geometry: { type: 'Point', coordinates: pt },
    })),
  })

  if (!hull || hull.geometry.type !== 'Polygon') {
    return null
  }

  return {
    buildingId: building.id,
    polygon: hull.geometry.coordinates[0] as [number, number][],
  }
}
