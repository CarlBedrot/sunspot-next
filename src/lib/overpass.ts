// src/lib/overpass.ts
import type { Bench, Building, GreenArea } from './types'
import { resolveHeight } from './shadow'

const OVERPASS_ENDPOINT = 'https://overpass-api.de/api/interpreter'

type Bbox = [south: number, west: number, north: number, east: number]

interface OverpassElement {
  type: 'node' | 'way' | 'relation'
  id: number
  lat?: number
  lon?: number
  tags?: Record<string, string>
  geometry?: { lat: number; lon: number }[]
}

interface OverpassResponse {
  elements: OverpassElement[]
}

async function runOverpassQuery(query: string): Promise<OverpassElement[]> {
  const response = await fetch(OVERPASS_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain' },
    body: query,
  })
  if (!response.ok) {
    throw new Error(`Overpass query failed: ${response.status} ${response.statusText}`)
  }
  const data = (await response.json()) as OverpassResponse
  return data.elements
}

function bboxToOverpass(bbox: Bbox): string {
  return bbox.join(',')
}

function wayToRing(el: OverpassElement): [number, number][] | null {
  if (!el.geometry || el.geometry.length < 3) return null
  return el.geometry.map((pt) => [pt.lon, pt.lat] as [number, number])
}

export async function fetchBuildings(bbox: Bbox): Promise<Building[]> {
  const query = `
    [out:json][timeout:25];
    way["building"](${bboxToOverpass(bbox)});
    out geom tags;
  `
  const elements = await runOverpassQuery(query)
  const buildings: Building[] = []
  for (const el of elements) {
    const ring = wayToRing(el)
    if (!ring) continue
    const { heightMeters, heightSource } = resolveHeight(el.tags ?? {})
    buildings.push({
      id: `way/${el.id}`,
      footprint: ring,
      heightMeters,
      heightSource,
    })
  }
  return buildings
}

export async function fetchBenches(bbox: Bbox): Promise<Bench[]> {
  const query = `
    [out:json][timeout:25];
    node["amenity"="bench"](${bboxToOverpass(bbox)});
    out;
  `
  const elements = await runOverpassQuery(query)
  return elements
    .filter((el) => typeof el.lat === 'number' && typeof el.lon === 'number')
    .map((el) => ({
      id: `node/${el.id}`,
      location: { lat: el.lat as number, lng: el.lon as number },
    }))
}

export async function fetchGreenAreas(bbox: Bbox): Promise<GreenArea[]> {
  const query = `
    [out:json][timeout:25];
    (
      way["leisure"="park"](${bboxToOverpass(bbox)});
      way["landuse"="grass"](${bboxToOverpass(bbox)});
    );
    out geom;
  `
  const elements = await runOverpassQuery(query)
  const areas: GreenArea[] = []
  for (const el of elements) {
    const ring = wayToRing(el)
    if (!ring) continue
    areas.push({ id: `way/${el.id}`, polygon: ring })
  }
  return areas
}
