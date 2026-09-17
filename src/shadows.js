// Simplified vertical-building model on flat ground. SunCalc 2 uses degrees,
// azimuth clockwise from north. Building and rooftop shapes are not surveyed.
export const MIN_SUN_ALTITUDE = 5;
export const METERS_PER_DEGREE = 111320;

export function parseMeters(value) {
  if (typeof value === "number")
    return value > 0 && value <= 300 ? value : null;
  if (typeof value !== "string") return null;
  const meters = value.trim().match(/^(\d+(?:\.\d+)?)\s*(?:m)?$/i);
  const feet = value
    .trim()
    .match(/^(\d+(?:\.\d+)?)\s*(?:ft|')(?:(\d+(?:\.\d+)?)")?$/i);
  const result = meters
    ? Number(meters[1])
    : feet
      ? Number(feet[1]) * 0.3048 + Number(feet[2] || 0) * 0.0254
      : NaN;
  return result > 0 && result <= 300 ? result : null;
}

export function buildingHeight(tags) {
  const height = parseMeters(tags.height);
  if (height) return { height, heightSource: "osm-height" };
  const levels = /^\d+(?:\.\d+)?$/.test(tags["building:levels"] || "")
    ? Number(tags["building:levels"])
    : 0;
  if (levels > 0 && levels <= 80) {
    const roof = parseMeters(tags["roof:height"]) || 0;
    return {
      height: Math.min(300, levels * 3 + roof),
      heightSource: "levels-estimate",
    };
  }
  return { height: 12, heightSource: "default-12m" };
}

export function shadowOffset(height, position) {
  if (
    !Number.isFinite(height) ||
    height <= 0 ||
    !Number.isFinite(position.altitude) ||
    !Number.isFinite(position.azimuth) ||
    position.altitude < MIN_SUN_ALTITUDE ||
    position.altitude > 90
  )
    return null;
  const length = height / Math.tan((position.altitude * Math.PI) / 180);
  const azimuth = (position.azimuth * Math.PI) / 180;
  return {
    east: -length * Math.sin(azimuth),
    north: -length * Math.cos(azimuth),
    length,
  };
}

// Safe interior: exclude a boundary band as wide as the longest modelled shadow.
// It only guards against the extract boundary, not objects missing from OSM.
export function coverageBounds(bounds, maxHeight, position) {
  const offset = shadowOffset(maxHeight, position);
  if (!offset) return null;
  const [west, south, east, north] = bounds;
  const dy = offset.length / METERS_PER_DEGREE;
  const dx =
    dy / Math.cos((Math.max(Math.abs(south), Math.abs(north)) * Math.PI) / 180);
  const result = [west + dx, south + dy, east - dx, north - dy];
  return result[0] < result[2] && result[1] < result[3] ? result : null;
}

// A prism's ground projection consists of its roof projection and wall quads.
// Preserve polygon holes; do not use a convex hull that fills entire courtyards.
export function wallQuads(rings, dx, dy) {
  const quads = [];
  for (const ring of rings) {
    for (let i = 1; i < ring.length; i++) {
      const a = ring[i - 1],
        b = ring[i];
      quads.push([a, b, [b[0] + dx, b[1] + dy], [a[0] + dx, a[1] + dy]]);
    }
  }
  return quads;
}
