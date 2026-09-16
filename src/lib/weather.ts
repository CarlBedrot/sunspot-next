import type { LatLng, WeatherSnapshot } from './types'

const OPEN_METEO_ENDPOINT = 'https://api.open-meteo.com/v1/forecast'
const DIFFUSE_LIGHT_CLOUD_COVER_THRESHOLD = 70

export function isLightDiffuse(cloudCoverPercent: number): boolean {
  return cloudCoverPercent >= DIFFUSE_LIGHT_CLOUD_COVER_THRESHOLD
}

interface OpenMeteoResponse {
  current: {
    cloud_cover: number
    temperature_2m: number
  }
}

export async function fetchWeather(location: LatLng): Promise<WeatherSnapshot> {
  const url = `${OPEN_METEO_ENDPOINT}?latitude=${location.lat}&longitude=${location.lng}&current=cloud_cover,temperature_2m`
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`Open-Meteo request failed: ${response.status} ${response.statusText}`)
  }
  const data = (await response.json()) as OpenMeteoResponse
  const cloudCoverPercent = data.current.cloud_cover
  return {
    cloudCoverPercent,
    temperatureCelsius: data.current.temperature_2m,
    lightIsDiffuse: isLightDiffuse(cloudCoverPercent),
  }
}
