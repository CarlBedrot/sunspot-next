import L from "leaflet";
import { mapColors } from "./theme.js";
import * as SunCalc from "suncalc";
import {
  coverageBounds,
  shadowOffset,
  wallQuads,
  MIN_SUN_ALTITUDE,
} from "./shadows.js";

// Opaque shapes on one translucent canvas: overlapping shadows keep the same shade.
export default class BuildingShadowLayer extends L.Layer {
  constructor(data, instant) {
    super();
    this.data = data;
    this.instant = instant;
  }
  onAdd(map) {
    this.map = map;
    this.colors = mapColors();
    const pane =
      map.getPane("buildingShadows") || map.createPane("buildingShadows");
    pane.style.zIndex = "350";
    pane.style.pointerEvents = "none";
    this.canvas = L.DomUtil.create("canvas", "building-shadows", pane);
    this.canvas.setAttribute("aria-hidden", "true");
    this.schedule = () => {
      cancelAnimationFrame(this.frame);
      this.frame = requestAnimationFrame(() => this.draw());
    };
    this.hide = () => {
      this.canvas.style.visibility = "hidden";
    };
    map.on("moveend zoomend resize viewreset", this.schedule);
    map.on("zoomstart", this.hide);
    this.schedule();
  }
  onRemove(map) {
    cancelAnimationFrame(this.frame);
    map.off("moveend zoomend resize viewreset", this.schedule);
    map.off("zoomstart", this.hide);
    this.canvas.remove();
    this.map = null;
  }
  setInstant(instant) {
    this.instant = instant;
    this.schedule?.();
  }
  draw() {
    if (!this.map) return;
    const map = this.map,
      canvas = this.canvas,
      size = map.getSize(),
      zoom = map.getZoom();
    const ratio = Math.min(devicePixelRatio || 1, 2);
    canvas.width = size.x * ratio;
    canvas.height = size.y * ratio;
    canvas.style.width = `${size.x}px`;
    canvas.style.height = `${size.y}px`;
    canvas.style.visibility = "";
    L.DomUtil.setPosition(canvas, map.containerPointToLayerPoint([0, 0]));
    const ctx = canvas.getContext("2d");
    ctx.scale(ratio, ratio);
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
    canvas.dataset.mode = mode;
    canvas.dataset.instant = this.instant.toISOString();
    canvas.dataset.buildings = "0";
    if (mode === "night") {
      ctx.fillStyle = this.colors.ink;
      ctx.fillRect(0, 0, size.x, size.y);
      return;
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
    if (!rect) return;
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
    const origin = map.project(map.containerPointToLatLng([0, 0]), zoom);
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
    canvas.dataset.buildings = String(count);
  }
}
