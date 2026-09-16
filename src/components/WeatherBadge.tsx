'use client'

import type { WeatherSnapshot } from '@/lib/types'

export function WeatherBadge({ weather }: { weather: WeatherSnapshot | null }) {
  if (!weather) {
    return null
  }

  return (
    <div className="weather-badge">
      <span>{Math.round(weather.temperatureCelsius)}°C</span>
      <span>{Math.round(weather.cloudCoverPercent)}% cloud cover</span>
      {weather.lightIsDiffuse && (
        <span className="weather-badge__note">
          Overcast — sun/shadow difference is minimal right now.
        </span>
      )}
    </div>
  )
}
