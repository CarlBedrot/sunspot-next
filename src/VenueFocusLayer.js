import L from "leaflet";
import FocusVeilLayer from "./FocusVeilLayer.js";
import { mapColors } from "./theme.js";

export function fitPlacesView(map, places) {
  if (!places.length) return;
  const mobile = map.getSize().x < 700;
  map.fitBounds(L.latLngBounds(places.map((p) => [p.lat, p.lng])), {
    paddingTopLeft: mobile ? [35, 150] : [55, 140],
    paddingBottomRight: mobile ? [85, 210] : [400, 210],
    maxZoom: 16,
    animate: false,
  });
}

// These windows reveal street context around a venue, not a terrace boundary
// or a claim of sunlight. The existing building shadows remain underneath.
export function venueFocusLayer(map, places, results) {
  const pane = map.getPane("venueFocus") || map.createPane("venueFocus");
  pane.style.zIndex = "380";
  pane.style.pointerEvents = "none";
  const polygons = places.map((place) => {
    const [lng, lat] = results[place.id]?.point || [place.lng, place.lat];
    const ring = Array.from({ length: 49 }, (_, i) => {
      const angle = ((i % 48) * Math.PI) / 24;
      return [
        lng +
          (Math.cos(angle) * 80) / (111320 * Math.cos((lat * Math.PI) / 180)),
        lat + (Math.sin(angle) * 80) / 111320,
      ];
    });
    return [ring];
  });
  return new FocusVeilLayer(polygons, mapColors().cream, {
    pane: "venueFocus",
    className: "venue-focus-veil",
    opacity: 0.65,
  });
}
