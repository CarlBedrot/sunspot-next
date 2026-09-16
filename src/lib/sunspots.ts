import { booleanPointInPolygon, centroid, point, polygon } from '@turf/turf'
import type { Feature, Polygon } from 'geojson'
import type { Bench, GreenArea, ShadowFeature } from './types'

/** Builds a turf polygon feature for each shadow once, for reuse across many point-in-polygon tests. */
export function buildShadowPolygons(shadows: ShadowFeature[]): Feature<Polygon>[] {
  return shadows.map((shadow) => polygon([shadow.polygon]))
}

function isPointInAnyShadow(pt: [number, number], shadowPolygons: Feature<Polygon>[]): boolean {
  const turfPoint = point(pt)
  return shadowPolygons.some((shadowPolygon) => booleanPointInPolygon(turfPoint, shadowPolygon))
}

export function isBenchSunny(bench: Bench, shadowPolygons: Feature<Polygon>[]): boolean {
  const pt: [number, number] = [bench.location.lng, bench.location.lat]
  return !isPointInAnyShadow(pt, shadowPolygons)
}

export function classifyGreenArea(
  area: GreenArea,
  shadowPolygons: Feature<Polygon>[]
): { area: GreenArea; sunny: boolean } {
  const areaCentroid = centroid(polygon([area.polygon]))
  const pt = areaCentroid.geometry.coordinates as [number, number]
  return { area, sunny: !isPointInAnyShadow(pt, shadowPolygons) }
}
