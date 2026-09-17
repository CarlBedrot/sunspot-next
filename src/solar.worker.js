import { createExposureModel, analyzePlaces } from "./exposure.js";
import { places } from "./places.js";
import { venueAreas } from "./venueAreas.js";
let model;
self.onmessage = ({ data }) => {
  try {
    if (data.type === "init") {
      model = createExposureModel(data.buildings);
      self.postMessage({ type: "ready" });
      return;
    }
    if (!model) throw Error("Model not ready");
    const results = analyzePlaces(
      model,
      places,
      venueAreas,
      data.instant,
      data.overrides,
      data.duration,
    );
    self.postMessage({ type: "results", id: data.id, results });
  } catch (error) {
    self.postMessage({ type: "error", id: data.id, message: error.message });
  }
};
