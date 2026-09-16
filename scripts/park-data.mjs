import osmtogeojson from "osmtogeojson";
import { inPolygon } from "../src/exposure.js";

export function areaPolygons(feature) {
  if (feature.properties?.tainted) return null;
  const geometry = feature.geometry;
  const polygons =
    geometry?.type === "Polygon"
      ? [geometry.coordinates]
      : geometry?.type === "MultiPolygon"
        ? geometry.coordinates
        : null;
  if (
    !polygons?.length ||
    polygons.some(
      (p) =>
        !p.length ||
        p.some(
          (r) =>
            r.length < 4 ||
            r.some((v) => !v.every(Number.isFinite)) ||
            r[0][0] !== r.at(-1)[0] ||
            r[0][1] !== r.at(-1)[1],
        ),
    )
  )
    return null;
  return polygons;
}

export function cityAreas(raw) {
  const features = osmtogeojson(raw, { flatProperties: false }).features;
  const parks = [],
    water = [],
    skipped = [];
  for (const feature of features) {
    const tags = feature.properties.tags || {};
    const polygons = areaPolygons(feature);
    if (tags.natural === "water" && polygons) water.push(...polygons);
    if (tags.leisure !== "park" || !tags.name) continue;
    if (["no", "private", "customers", "members"].includes(tags.access)) {
      skipped.push({ id: feature.id, reason: "restricted-access" });
      continue;
    }
    if (!polygons) {
      skipped.push({ id: feature.id, reason: "no-complete-area" });
      continue;
    }
    parks.push({ osm: feature.id, tags, polygons });
  }
  parks.sort((a, b) => a.osm.localeCompare(b.osm, "en"));
  return { parks, water, skipped };
}

// Use a point inside the largest component, not a bounding-box midpoint that
// may fall in a lake, a courtyard, or between two separate parts of a park.
export function parkPoint(polygons, water) {
  const area = (ring) =>
    Math.abs(
      ring
        .slice(1)
        .reduce((sum, p, i) => sum + ring[i][0] * p[1] - p[0] * ring[i][1], 0),
    );
  for (const polygon of [...polygons].sort((a, b) => area(b[0]) - area(a[0]))) {
    const xs = polygon[0].map((p) => p[0]),
      ys = polygon[0].map((p) => p[1]);
    const west = Math.min(...xs),
      east = Math.max(...xs);
    const south = Math.min(...ys),
      north = Math.max(...ys);
    const candidates = [];
    for (let x = 0; x < 21; x++)
      for (let y = 0; y < 21; y++) {
        const point = [
          west + ((x + 0.5) / 21) * (east - west),
          south + ((y + 0.5) / 21) * (north - south),
        ];
        if (
          inPolygon(point, polygon) &&
          !water.some((p) => inPolygon(point, p))
        )
          candidates.push({ point, distance: (x - 10) ** 2 + (y - 10) ** 2 });
      }
    candidates.sort((a, b) => a.distance - b.distance);
    if (candidates.length) return candidates[0].point;
  }
  return null;
}
