import osmtogeojson from "osmtogeojson";
import { mkdir, writeFile } from "node:fs/promises";
import { buildingHeight } from "../src/shadows.js";

const bounds = [12.53, 55.662, 12.632, 55.711];
const [west, south, east, north] = bounds;
const bbox = `${south},${west},${north},${east}`;
const query = `[out:json][timeout:90];(way["building"]["building"!="no"](${bbox});relation["building"]["building"!="no"]["type"="multipolygon"](${bbox}););out body geom;`;
const response = await fetch("https://overpass-api.de/api/interpreter", {
  method: "POST",
  headers: {
    "User-Agent": "SunSpot/0.2 github.com/CarlBedrot/sunspot",
    "Content-Type": "application/x-www-form-urlencoded",
  },
  body: new URLSearchParams({ data: query }),
  signal: AbortSignal.timeout(110_000),
});
if (!response.ok) throw new Error(`Overpass returned ${response.status}`);
const raw = await response.json();
if (raw.remark) throw new Error(`Incomplete Overpass response: ${raw.remark}`);
const geo = osmtogeojson(raw, { flatProperties: false });
const stats = {
  taggedHeight: 0,
  estimatedFromLevels: 0,
  assumedHeight: 0,
  skipped: 0,
};
const buildings = [];
for (const feature of geo.features) {
  const tags = feature.properties.tags || {};
  if (
    !tags.building ||
    tags.building === "no" ||
    tags.building === "construction" ||
    tags.building === "roof" ||
    tags.location === "underground" ||
    tags["building:part"] ||
    Number(tags.min_height || 0) > 0 ||
    Number(tags["building:min_level"] || 0) > 0 ||
    feature.properties.tainted
  ) {
    stats.skipped++;
    continue;
  }
  const type = feature.geometry?.type;
  if (type !== "Polygon" && type !== "MultiPolygon") {
    stats.skipped++;
    continue;
  }
  const polygons =
    type === "Polygon"
      ? [feature.geometry.coordinates]
      : feature.geometry.coordinates;
  if (
    polygons.some((p) =>
      p.some(
        (r) =>
          r.length < 4 || r[0][0] !== r.at(-1)[0] || r[0][1] !== r.at(-1)[1],
      ),
    )
  ) {
    stats.skipped++;
    continue;
  }
  const height = buildingHeight(tags);
  stats[
    height.heightSource === "osm-height"
      ? "taggedHeight"
      : height.heightSource === "levels-estimate"
        ? "estimatedFromLevels"
        : "assumedHeight"
  ]++;
  buildings.push({
    id: feature.id,
    ...height,
    polygons: polygons.map((p) =>
      p.map((r) =>
        r.map(([lon, lat]) => [Number(lon.toFixed(7)), Number(lat.toFixed(7))]),
      ),
    ),
  });
}
if (buildings.length < 100)
  throw new Error("Unexpectedly small extract; refusing to overwrite data");
const result = {
  schemaVersion: 1,
  source: "OpenStreetMap contributors",
  license: "ODbL-1.0",
  sourceUrl: "https://www.openstreetmap.org/copyright",
  fetchedAt: new Date().toISOString(),
  osmTimestamp: raw.osm3s?.timestamp_osm_base,
  bounds,
  maxHeight: Math.max(...buildings.map((b) => b.height)),
  stats,
  buildings,
};
await mkdir("public/data", { recursive: true });
await writeFile(
  "public/data/copenhagen-buildings.json",
  JSON.stringify(result),
);
console.log(
  JSON.stringify({
    count: buildings.length,
    ...stats,
    maxHeight: result.maxHeight,
    bytes: JSON.stringify(result).length,
  }),
);
