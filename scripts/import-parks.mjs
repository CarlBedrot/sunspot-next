import { writeFile } from "node:fs/promises";

// Municipal boundaries also cover Copenhagen's outlying neighbourhoods.
const query = `[out:json][timeout:90];
area["boundary"="administrative"]["admin_level"="7"]["name"~"^(Københavns Kommune|Frederiksberg Kommune)$"]->.city;
(nwr["leisure"="park"]["name"](area.city);way["natural"="water"](area.city);relation["natural"="water"]["type"="multipolygon"](area.city););
out body geom;`;
const endpoint = "https://overpass-api.de/api/interpreter";
const response = await fetch(
  `${endpoint}?${new URLSearchParams({ data: query })}`,
  {
    headers: { "User-Agent": "SunSpot/0.3 github.com/CarlBedrot/sunspot" },
    signal: AbortSignal.timeout(110_000),
  },
);
if (!response.ok) throw new Error(`Overpass ${response.status}`);
const raw = await response.json();
if (raw.remark) throw new Error(`Incomplete park extract: ${raw.remark}`);
if (!raw.elements?.some((e) => e.tags?.name === "Fælledparken"))
  throw new Error("Fælledparken missing; refusing to overwrite park data");
raw.sunspot = {
  fetchedAt: new Date().toISOString(),
  endpoint,
  query,
  scope: "Københavns Kommune and Frederiksberg Kommune",
  license: "ODbL-1.0",
  sourceUrl: "https://www.openstreetmap.org/copyright",
};
await writeFile("data/osm-city-parks-source.json", JSON.stringify(raw));
console.log(`${raw.elements.length} OSM park/water objects downloaded`);
