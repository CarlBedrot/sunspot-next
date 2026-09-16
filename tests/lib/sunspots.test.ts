import { describe, it, expect } from 'vitest'
import { isBenchSunny, classifyGreenArea } from '../../src/lib/sunspots'
import type { Bench, GreenArea, ShadowFeature } from '../../src/lib/types'

const shadowOverBench: ShadowFeature = {
  buildingId: 'b1',
  polygon: [
    [12.5680, 55.6760],
    [12.5690, 55.6760],
    [12.5690, 55.6765],
    [12.5680, 55.6765],
    [12.5680, 55.6760],
  ],
}

describe('isBenchSunny', () => {
  it('is false when the bench sits inside a shadow polygon', () => {
    const bench: Bench = { id: 'n1', location: { lat: 55.6762, lng: 12.5685 } }
    expect(isBenchSunny(bench, [shadowOverBench])).toBe(false)
  })

  it('is true when the bench sits outside every shadow polygon', () => {
    const bench: Bench = { id: 'n2', location: { lat: 55.7000, lng: 12.6000 } }
    expect(isBenchSunny(bench, [shadowOverBench])).toBe(true)
  })

  it('is true when there are no shadows at all', () => {
    const bench: Bench = { id: 'n3', location: { lat: 55.6762, lng: 12.5685 } }
    expect(isBenchSunny(bench, [])).toBe(true)
  })
})

describe('classifyGreenArea', () => {
  it('marks an area shaded when its centroid falls inside a shadow polygon', () => {
    const area: GreenArea = {
      id: 'w1',
      polygon: [
        [12.5683, 55.6761],
        [12.5686, 55.6761],
        [12.5686, 55.6763],
        [12.5683, 55.6763],
        [12.5683, 55.6761],
      ],
    }
    const result = classifyGreenArea(area, [shadowOverBench])
    expect(result.sunny).toBe(false)
    expect(result.area).toBe(area)
  })

  it('marks an area sunny when its centroid falls outside every shadow polygon', () => {
    const area: GreenArea = {
      id: 'w2',
      polygon: [
        [12.6000, 55.7000],
        [12.6003, 55.7000],
        [12.6003, 55.7002],
        [12.6000, 55.7002],
        [12.6000, 55.7000],
      ],
    }
    const result = classifyGreenArea(area, [shadowOverBench])
    expect(result.sunny).toBe(true)
  })
})
