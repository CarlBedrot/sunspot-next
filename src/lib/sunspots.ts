import { booleanPointInPolygon, centroid, point, polygon } from '@turf/turf'
import type { Bench, GreenArea, ShadowFeature } from './types'

function isPointInAnyShadow(pt: [number, number], shadows: ShadowFeature[]): boolean {
  const turfPoint = point(pt)
  return shadows.some((shadow) => booleanPointInPolygon(turfPoint, polygon([shadow.polygon])))
}

export function isBenchSunny(bench: Bench, shadows: ShadowFeature[]): boolean {
  const pt: [number, number] = [bench.location.lng, bench.location.lat]
  return !isPointInAnyShadow(pt, shadows)
}

export function classifyGreenArea(
  area: GreenArea,
  shadows: ShadowFeature[]
): { area: GreenArea; sunny: boolean } {
  const areaCentroid = centroid(polygon([area.polygon]))
  const pt = areaCentroid.geometry.coordinates as [number, number]
  return { area, sunny: !isPointInAnyShadow(pt, shadows) }
}
