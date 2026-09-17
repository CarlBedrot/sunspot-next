import * as SunCalc from "suncalc";
import {
  coverageBounds,
  shadowOffset,
  wallQuads,
  MIN_SUN_ALTITUDE,
} from "./shadows.js";

// Leaflet's EPSG:3857 world coordinates, also usable without DOM in a worker.
export function projectPoint(lat, lng, zoom) {
  const sin = Math.sin(
    (Math.max(-85.0511287798, Math.min(85.0511287798, lat)) * Math.PI) / 180,
  );
  const scale = 256 * 2 ** zoom;
  return {
    x: (lng / 360 + 0.5) * scale,
    y: (0.5 - Math.log((1 + sin) / (1 - sin)) / (4 * Math.PI)) * scale,
  };
}

export class ShadowRenderer {
  constructor(data) {
    this.data = data;
  }
  draw(canvas, view) {
    const { size, zoom, ratio } = view;
    this.instant = new Date(view.instant);
    this.colors = view.colors;
    const originPoint = projectPoint(...view.topLeft, zoom);
    const map = {
      project: ([lat, lng], z) => projectPoint(lat, lng, z),
      latLngToContainerPoint: ([lat, lng]) => {
        const p = projectPoint(lat, lng, zoom);
        return {
          x: Math.round(p.x) - originPoint.x,
          y: Math.round(p.y) - originPoint.y,
        };
      },
    };
    canvas.width = Math.round(size.x * ratio);
    canvas.height = Math.round(size.y * ratio);
    const ctx = canvas.getContext("2d");
    ctx.scale(ratio, ratio);
    const metadata = {};
    const [west, south, east, north] = this.data.bounds;
    const latitude = (south + north) / 2;
    const position = SunCalc.getPosition(
      this.instant,
      latitude,
      (west + east) / 2,
    );
    const mode =
      position.altitude <= 0
        ? "night"
        : position.altitude < MIN_SUN_ALTITUDE
          ? "low-sun"
          : "day";
    metadata.mode = mode;
    metadata.instant = this.instant.toISOString();
    metadata.buildings = "0";
    if (mode === "night") {
      ctx.fillStyle = this.colors.ink;
      ctx.fillRect(0, 0, size.x, size.y);
      return metadata;
    }
    const coverage = coverageBounds(
      this.data.bounds,
      this.data.maxHeight,
      position,
    );
    let rect;
    if (coverage) {
      const a = map.latLngToContainerPoint([coverage[3], coverage[0]]);
      const b = map.latLngToContainerPoint([coverage[1], coverage[2]]);
      rect = [a.x, a.y, b.x - a.x, b.y - a.y];
    }
    // Stripe outside coverage; empty map there must not suggest sunlight.
    ctx.save();
    ctx.beginPath();
    ctx.rect(0, 0, size.x, size.y);
    if (rect) ctx.rect(...rect);
    ctx.clip("evenodd");
    ctx.strokeStyle = this.colors.blue;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    for (let x = -size.y; x < size.x; x += 16) {
      ctx.moveTo(x, 0);
      ctx.lineTo(x + size.y, size.y);
    }
    ctx.stroke();
    ctx.restore();
    if (!rect) return metadata;
    ctx.save();
    ctx.beginPath();
    ctx.rect(...rect);
    ctx.clip();
    if (this.projectedZoom !== zoom) {
      this.projected = this.data.buildings.map((building) => {
        let minX = Infinity,
          minY = Infinity,
          maxX = -Infinity,
          maxY = -Infinity;
        const polygons = building.polygons.map((p) =>
          p.map((r) =>
            r.map(([lon, lat]) => {
              const v = map.project([lat, lon], zoom);
              minX = Math.min(minX, v.x);
              maxX = Math.max(maxX, v.x);
              minY = Math.min(minY, v.y);
              maxY = Math.max(maxY, v.y);
              return [v.x, v.y];
            }),
          ),
        );
        return {
          height: building.height,
          polygons,
          bounds: [minX, minY, maxX, maxY],
        };
      });
      this.projectedZoom = zoom;
    }
    const origin = map.project(view.topLeft, zoom);
    const metersPerPixel =
      (40075016.68557849 * Math.cos((latitude * Math.PI) / 180)) /
      (256 * 2 ** zoom);
    const trace = (rings, dx = 0, dy = 0) => {
      ctx.beginPath();
      for (const ring of rings) {
        ring.forEach(([x, y], i) =>
          ctx[i ? "lineTo" : "moveTo"](x - origin.x + dx, y - origin.y + dy),
        );
        ctx.closePath();
      }
      ctx.fill("evenodd");
    };
    let count = 0;
    ctx.fillStyle = this.colors.blue;
    for (const building of this.projected) {
      const offset = shadowOffset(building.height, position);
      const dx = offset.east / metersPerPixel,
        dy = -offset.north / metersPerPixel;
      const [x1, y1, x2, y2] = building.bounds;
      if (
        x2 + Math.max(0, dx) < origin.x ||
        x1 + Math.min(0, dx) > origin.x + size.x ||
        y2 + Math.max(0, dy) < origin.y ||
        y1 + Math.min(0, dy) > origin.y + size.y
      )
        continue;
      count++;
      for (const polygon of building.polygons) {
        trace(polygon);
        trace(polygon, dx, dy);
        for (const quad of wallQuads(polygon, dx, dy)) trace([quad]);
      }
    }
    ctx.restore();
    metadata.buildings = String(count);
    return metadata;
  }
}
