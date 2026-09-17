import L from "leaflet";
import { mapColors } from "./theme.js";
import { ShadowRenderer } from "./shadowRenderer.js";

// Geometry/raster work stays off the UI thread. Only the latest view may paint.
export default class BuildingShadowLayer extends L.Layer {
  constructor(data, instant) {
    super();
    this.data = data;
    this.instant = instant;
    this.sequence = 0;
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
    this.startWorker();
    this.schedule = () => {
      this.sequence++;
      this.canvas.dataset.pending = "true";
      cancelAnimationFrame(this.frame);
      this.frame = requestAnimationFrame(() => this.requestDraw());
    };
    this.hide = () => {
      this.sequence++;
      this.canvas.style.visibility = "hidden";
    };
    map.on("moveend zoomend resize viewreset", this.schedule);
    map.on("movestart zoomstart", this.hide);
    this.schedule();
  }
  startWorker() {
    if (typeof OffscreenCanvas === "undefined" || typeof Worker === "undefined")
      return;
    try {
      this.worker = new Worker(
        new URL("./shadow-render.worker.js", import.meta.url),
        { type: "module" },
      );
      this.worker.onmessage = ({ data }) => {
        this.busy = false;
        if (!this.map) {
          data.bitmap?.close();
          return;
        }
        if (data.error) {
          this.useFallback();
          return;
        }
        if (data.id === this.sequence)
          this.paint(data.bitmap, data.metadata, this.inFlight);
        data.bitmap.close();
        this.pump();
      };
      this.worker.onerror = () => this.useFallback();
      this.worker.postMessage({ type: "init", buildings: this.data });
    } catch {
      this.useFallback();
    }
  }
  useFallback() {
    this.worker?.terminate();
    this.worker = null;
    this.busy = false;
    if (this.map) this.requestDraw();
  }
  onRemove(map) {
    cancelAnimationFrame(this.frame);
    clearTimeout(this.fallbackTimer);
    map.off("moveend zoomend resize viewreset", this.schedule);
    map.off("movestart zoomstart", this.hide);
    this.worker?.terminate();
    this.worker = null;
    this.queued = null;
    this.canvas.remove();
    this.map = null;
  }
  setInstant(instant) {
    if (this.instant.getTime() === instant.getTime()) return;
    this.instant = instant;
    this.schedule?.();
  }
  requestDraw() {
    if (!this.map) return;
    const topLeft = this.map.containerPointToLatLng([0, 0]);
    const view = {
      size: this.map.getSize(),
      zoom: this.map.getZoom(),
      ratio: Math.min(devicePixelRatio || 1, 2),
      topLeft: [topLeft.lat, topLeft.lng],
      instant: this.instant.toISOString(),
      colors: this.colors,
      position: this.map.containerPointToLayerPoint([0, 0]),
    };
    this.queued = { type: "draw", id: this.sequence, view };
    if (this.worker) this.pump();
    else {
      clearTimeout(this.fallbackTimer);
      this.fallbackTimer = setTimeout(() => {
        if (!this.map) return;
        this.renderer ??= new ShadowRenderer(this.data);
        const { view, id } = this.queued;
        const buffer = document.createElement("canvas");
        const metadata = this.renderer.draw(buffer, view);
        if (id === this.sequence) this.paint(buffer, metadata, view);
      }, 90);
    }
  }
  pump() {
    if (this.busy || !this.queued || !this.worker) return;
    const request = this.queued;
    this.queued = null;
    this.busy = true;
    this.inFlight = request.view;
    this.worker.postMessage(request);
  }
  paint(bitmap, metadata, view) {
    const canvas = this.canvas;
    canvas.width = bitmap.width;
    canvas.height = bitmap.height;
    canvas.style.width = `${view.size.x}px`;
    canvas.style.height = `${view.size.y}px`;
    L.DomUtil.setPosition(canvas, view.position);
    canvas.getContext("2d").drawImage(bitmap, 0, 0);
    Object.assign(canvas.dataset, metadata, {
      pending: "false",
      zoom: String(view.zoom),
      renderer: this.worker ? "worker" : "main",
    });
    canvas.style.visibility = "";
  }
}
