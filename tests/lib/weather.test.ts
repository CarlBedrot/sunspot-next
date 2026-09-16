import { describe, it, expect, vi, afterEach } from 'vitest'
import { fetchWeather, isLightDiffuse } from '../../src/lib/weather'

describe('isLightDiffuse', () => {
  it('is false under 70% cloud cover', () => {
    expect(isLightDiffuse(40)).toBe(false)
  })

  it('is true at or above 70% cloud cover', () => {
    expect(isLightDiffuse(70)).toBe(true)
    expect(isLightDiffuse(95)).toBe(true)
  })
})

describe('fetchWeather', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('parses cloud cover and temperature from the Open-Meteo response', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        current: { cloud_cover: 85, temperature_2m: 14.2 },
      }),
    })
    vi.stubGlobal('fetch', mockFetch)

    const result = await fetchWeather({ lat: 55.6761, lng: 12.5683 })

    expect(result).toEqual({
      cloudCoverPercent: 85,
      temperatureCelsius: 14.2,
      lightIsDiffuse: true,
    })
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('api.open-meteo.com')
    )
  })

  it('throws when the response is not ok', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({ ok: false, status: 500, statusText: 'Server Error' })
    )
    await expect(fetchWeather({ lat: 55.6761, lng: 12.5683 })).rejects.toThrow()
  })
})
