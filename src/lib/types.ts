// src/lib/types.ts

export interface LatLng {
  lat: number
  lng: number
}

/** OSM building footprint with resolved height, ready for shadow projection. */
export interface Building {
  id: string
  /** Footprint ring, closed (first point === last point), [lng, lat] pairs. */
  footprint: [number, number][]
  /** Resolved height in meters (from height tag, levels*3, or 6m default). */
  heightMeters: number
  heightSource: 'tag' | 'levels' | 'default'
}

/** A single building's projected shadow, as GeoJSON-ready geometry. */
export interface ShadowFeature {
  buildingId: string
  /** Polygon ring, closed, [lng, lat] pairs. */
  polygon: [number, number][]
}

export interface Bench {
  id: string
  location: LatLng
}

export interface GreenArea {
  id: string
  /** Polygon ring, closed, [lng, lat] pairs. */
  polygon: [number, number][]
}

export interface WeatherSnapshot {
  cloudCoverPercent: number
  temperatureCelsius: number
  /** True when cloud cover is high enough that sun/shadow distinction is not meaningful. */
  lightIsDiffuse: boolean
}

export interface SunPosition {
  /** Radians, compass bearing from north, clockwise (0 = N, PI/2 = E, PI = S, 3*PI/2 = W). */
  azimuth: number
  /** Radians above horizon; <= 0 means sun is below horizon. */
  altitude: number
}
