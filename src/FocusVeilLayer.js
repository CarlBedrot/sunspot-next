import L from "leaflet";

// Erase each focus area independently. Overlapping areas must stay
// clear; a single even-odd polygon would shade their overlap a second time.
export default class FocusVeilLayer extends L.Layer {
  constructor(
    polygons,
    color,
    { pane = "parkVeil", className = "park-focus-veil", opacity = 0.78 } = {},
  ) {
    super();
    this.polygons = polygons;
    this.color = color;
    this.options = { pane, className, opacity };
  }
  onAdd(map) {
    this.map = map;
    this.canvas = L.DomUtil.create(
      "canvas",
      this.options.className,
      map.getPane(this.options.pane),
    );
    this.canvas.style.cssText = `position:absolute;pointer-events:none;opacity:${this.options.opacity}`;
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
  draw() {
    if (!this.map) return;
    const map = this.map,
      size = map.getSize(),
      ratio = Math.min(devicePixelRatio || 1, 2);
    this.canvas.width = size.x * ratio;
    this.canvas.height = size.y * ratio;
    this.canvas.style.width = `${size.x}px`;
    this.canvas.style.height = `${size.y}px`;
    this.canvas.style.visibility = "";
    L.DomUtil.setPosition(this.canvas, map.containerPointToLayerPoint([0, 0]));
    const ctx = this.canvas.getContext("2d");
    ctx.scale(ratio, ratio);
    ctx.fillStyle = this.color;
    ctx.fillRect(0, 0, size.x, size.y);
    ctx.globalCompositeOperation = "destination-out";
    for (const polygon of this.polygons) {
      ctx.beginPath();
      for (const ring of polygon) {
        ring.forEach(([lng, lat], i) => {
          const p = map.latLngToContainerPoint([lat, lng]);
          ctx[i ? "lineTo" : "moveTo"](p.x, p.y);
        });
        ctx.closePath();
      }
      ctx.fill("evenodd");
    }
  }
}
