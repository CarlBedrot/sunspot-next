import { writeFile } from "node:fs/promises";
const query = `[out:json][timeout:60];(way(id:3098756,118353598,529519844);nwr["amenity"~"^(bar|pub|restaurant)$"]["name"]["outdoor_seating"="yes"](55.684,12.543,55.703,12.566););out body geom;`;
const response = await fetch("https://overpass-api.de/api/interpreter", {
  method: "POST",
  headers: { "User-Agent": "SunSpot/0.3 github.com/CarlBedrot/sunspot" },
  body: new URLSearchParams({ data: query }),
  signal: AbortSignal.timeout(90_000),
});
if (!response.ok) throw new Error(`Overpass ${response.status}`);
const raw = await response.json();
if (raw.remark) throw new Error(raw.remark);
await writeFile(
  "data/osm-venue-areas-source.json",
  JSON.stringify(raw, null, 2),
);
console.log(
  raw.elements.map((e) => ({
    id: e.id,
    type: e.type,
    name: e.tags?.name,
    opening: e.tags?.opening_hours,
    lat: e.lat,
    lon: e.lon,
    points: e.geometry?.length,
  })),
);
