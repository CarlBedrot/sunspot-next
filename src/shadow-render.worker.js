import { ShadowRenderer } from "./shadowRenderer.js";
let renderer;
self.onmessage = ({ data }) => {
  try {
    if (data.type === "init") {
      renderer = new ShadowRenderer(data.buildings);
      return;
    }
    const canvas = new OffscreenCanvas(1, 1);
    const metadata = renderer.draw(canvas, data.view);
    const bitmap = canvas.transferToImageBitmap();
    self.postMessage({ id: data.id, metadata, bitmap }, [bitmap]);
  } catch {
    self.postMessage({ id: data.id, error: true });
  }
};
