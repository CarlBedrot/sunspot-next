import { readFile, writeFile, mkdir } from "node:fs/promises";
import { join } from "node:path";

export function weatherService(directory) {
  const file = join(directory, "weather-cache.json");
  let cache,
    pending,
    retryAfter = 0;
  const loaded = readFile(file, "utf8")
    .then((s) => {
      cache = JSON.parse(s);
    })
    .catch(() => {});
  async function refresh() {
    const headers = {
      "User-Agent": "SunSpot/0.1 github.com/CarlBedrot/sunspot",
      Accept: "application/json",
    };
    if (cache?.lastModified) headers["If-Modified-Since"] = cache.lastModified;
    try {
      const response = await fetch(
        "https://api.met.no/weatherapi/locationforecast/2.0/compact?lat=55.6800&lon=12.5800",
        { headers, signal: AbortSignal.timeout(12000) },
      );
      if (!response.ok && response.status !== 304)
        throw new Error(`MET returned ${response.status}`);
      const expires =
        Date.parse(response.headers.get("expires") || "") ||
        Date.now() + 30 * 60_000;
      if (response.status === 304 && cache) {
        cache = { ...cache, expires, checkedAt: new Date().toISOString() };
      } else {
        const body = await response.json();
        if (!Array.isArray(body.properties?.timeseries))
          throw new Error("Invalid MET response");
        cache = {
          expires,
          checkedAt: new Date().toISOString(),
          fetchedAt: new Date().toISOString(),
          lastModified: response.headers.get("last-modified"),
          updatedAt: body.properties.meta.updated_at,
          timeseries: body.properties.timeseries,
        };
      }
      await mkdir(directory, { recursive: true });
      await writeFile(file, JSON.stringify(cache));
    } catch {
      retryAfter = Date.now() + 60_000;
    }
  }
  return async function getWeather() {
    await loaded;
    if ((!cache || cache.expires <= Date.now()) && Date.now() >= retryAfter) {
      pending ??= refresh().finally(() => {
        pending = null;
      });
      await pending;
    }
    if (!cache)
      return {
        available: false,
        source: "MET Norway",
        message: "Väderprognosen kunde inte hämtas. Försök igen om en stund.",
      };
    return {
      available: true,
      source: "MET Norway",
      stale: cache.expires <= Date.now(),
      updatedAt: cache.updatedAt,
      fetchedAt: cache.fetchedAt,
      timeseries: cache.timeseries,
    };
  };
}
