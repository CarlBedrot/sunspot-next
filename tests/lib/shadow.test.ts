import { describe, it, expect } from 'vitest'
import { resolveHeight, getSunPosition, projectShadow } from '../../src/lib/shadow'
import type { Building, LatLng, SunPosition } from '../../src/lib/types'

describe('resolveHeight', () => {
  it('uses the height tag when present', () => {
    expect(resolveHeight({ height: '12.5' })).toEqual({
      heightMeters: 12.5,
      heightSource: 'tag',
    })
  })

  it('falls back to building:levels * 3 when height is absent', () => {
    expect(resolveHeight({ 'building:levels': '4' })).toEqual({
      heightMeters: 12,
      heightSource: 'levels',
    })
  })

  it('defaults to 6 meters when neither tag is present', () => {
    expect(resolveHeight({})).toEqual({
      heightMeters: 6,
      heightSource: 'default',
    })
  })

  it('ignores an unparsable height tag and falls back', () => {
    expect(resolveHeight({ height: 'not-a-number', 'building:levels': '2' })).toEqual({
      heightMeters: 6,
      heightSource: 'levels',
    })
  })
})

describe('getSunPosition', () => {
  it('reports the sun below the horizon at solar midnight', () => {
    // Copenhagen, Jan 1 2026, 00:00 UTC — deep night year-round at this latitude.
    const midnight = new Date('2026-01-01T00:00:00Z')
    const copenhagen: LatLng = { lat: 55.6761, lng: 12.5683 }
    const sun = getSunPosition(midnight, copenhagen)
    expect(sun.altitude).toBeLessThanOrEqual(0)
  })

  it('reports the sun above the horizon at solar noon in summer', () => {
    // Copenhagen, Jun 21 2026, 11:00 UTC ~= local solar noon.
    const noon = new Date('2026-06-21T11:00:00Z')
    const copenhagen: LatLng = { lat: 55.6761, lng: 12.5683 }
    const sun = getSunPosition(noon, copenhagen)
    expect(sun.altitude).toBeGreaterThan(0)
  })
})

describe('projectShadow', () => {
  const squareBuilding: Building = {
    id: 'b1',
    // Closed square ring, [lng, lat], ~roughly 10m x 10m near Copenhagen.
    footprint: [
      [12.5683, 55.6761],
      [12.5684, 55.6761],
      [12.5684, 55.6762],
      [12.5683, 55.6762],
      [12.5683, 55.6761],
    ],
    heightMeters: 20,
    heightSource: 'tag',
  }

  it('returns null when the sun is below the horizon', () => {
    const sun: SunPosition = { azimuth: 0, altitude: -0.1 }
    expect(projectShadow(squareBuilding, sun)).toBeNull()
  })

  it('projects a shadow polygon that encloses the original footprint', () => {
    // Sun due south (suncalc azimuth 0 = south), 45 degrees up -> shadow length == height, pointing north.
    const sun: SunPosition = { azimuth: 0, altitude: Math.PI / 4 }
    const shadow = projectShadow(squareBuilding, sun)
    expect(shadow).not.toBeNull()
    expect(shadow!.buildingId).toBe('b1')
    // Shadow polygon should have more than 3 points (hull of 4 original + 4 offset corners)
    expect(shadow!.polygon.length).toBeGreaterThanOrEqual(4)
    // First and last point of a closed ring must match.
    const first = shadow!.polygon[0]
    const last = shadow!.polygon[shadow!.polygon.length - 1]
    expect(first[0]).toBeCloseTo(last[0], 6)
    expect(first[1]).toBeCloseTo(last[1], 6)
  })
})
