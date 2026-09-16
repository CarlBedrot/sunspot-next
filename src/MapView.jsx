import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import { mapColors } from "./theme.js";
import { Plus, Minus, LocateFixed, Layers, Info } from "lucide-react";
import { atHour } from "./lib.js";

import * as SunCalc from "suncalc";
import BuildingShadowLayer from "./BuildingShadowLayer.js";
import { parkFocusLayer, fitParkView } from "./ParkFocusLayer.js";
import { venueFocusLayer, fitPlacesView } from "./VenueFocusLayer.js";
import { places as allPlaces } from "./places.js";

export default function MapView({
  category = "all",
  viewReset = 0,
  places,
  events = [],
  selected,
  onSelect,
  date,
  hour,
  results,
  buildings,
  dataError,
  onRetry,
  point,
  onPointChange,
  editing,
  onCancelEdit,
  seatError,
  children,
}) {
  const touchgrass = category === "park";
  const venueFocus = category === "bar" || category === "restaurant";
  const container = useRef(null),
    map = useRef(null),
    layer = useRef(null);
  const shadowLayer = useRef(null);
  const seatLayer = useRef(null);
  const [zoom, setZoom] = useState(14);
  const [legendOpen, setLegendOpen] = useState(false);
  const [zones, setZones] = useState(true),
    [tileError, setTileError] = useState(false);
  useEffect(() => {
    const m = L.map(container.current, {
      zoomControl: false,
      scrollWheelZoom: true,
      minZoom: 11,
      maxZoom: 18,
    }).setView([55.683, 12.581], 14);
    map.current = m;
    m.on("zoomend", () => setZoom(m.getZoom()));
    L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 19,
    })
      .on("tileerror", () => setTileError(true))
      .addTo(m);
    layer.current = L.layerGroup().addTo(m);
    seatLayer.current = L.layerGroup().addTo(m);
    const observer = new ResizeObserver(() => m.invalidateSize());
    observer.observe(container.current);
    return () => {
      observer.disconnect();
      m.remove();
      map.current = null;
    };
  }, []);
  useEffect(() => {
    if (!map.current) return;
    layer.current.clearLayers();
    if (editing) return;
    [...places, ...events].forEach((p) => {
      const result = results[p.id];
      const compact =
        p.category !== "event" &&
        zoom < (touchgrass ? 15 : 16) &&
        selected?.id !== p.id;
      const button = document.createElement("button");
      button.className = `place-pin ${p.category === "event" ? "event-pin" : ""} ${selected?.id === p.id ? "active" : ""} ${result?.state === "sun" ? "sunny" : ""} ${compact ? "compact" : ""}`;
      button.setAttribute("aria-label", `Visa ${p.name}`);
      button.title = p.name;
      button.dataset.id = p.id;
      const emoji = document.createElement("span"),
        name = document.createElement("b");
      emoji.textContent = p.emoji;
      name.textContent = p.name;
      button.append(emoji, name);
      const icon = L.divIcon({
        className: "place-pin-wrap",
        html: button,
        iconSize: [compact ? 42 : 140, 42],
        iconAnchor: [24, 42],
      });
      L.marker(
        result?.point ? [result.point[1], result.point[0]] : [p.lat, p.lng],
        {
          icon,
          keyboard: false,
          zIndexOffset:
            selected?.id === p.id ? 1000 : p.category === "event" ? 800 : 0,
        },
      )
        .on("click", () => onSelect(p))
        .addTo(layer.current);
    });
  }, [places, events, selected, results, onSelect, zoom, editing, touchgrass]);
  useEffect(() => {
    if (selected?.greenSpace && touchgrass && map.current) {
      fitParkView(map.current, selected.id);
      return;
    }
    if (
      selected &&
      map.current &&
      !map.current.getBounds().pad(-0.1).contains([selected.lat, selected.lng])
    )
      map.current.panTo([selected.lat, selected.lng]);
  }, [selected, touchgrass]);
  useEffect(() => {
    if (!map.current) return;
    seatLayer.current.clearLayers();
    if (point && !touchgrass) {
      const colors = mapColors();
      L.circleMarker([point[1], point[0]], {
        radius: 7,
        color: colors.surface,
        weight: 3,
        fillColor: colors.blue,
        fillOpacity: 1,
      })
        .bindTooltip("Beräkningspunkt / din sittplats")
        .addTo(seatLayer.current);
    }
    if (!editing) return;
    const m = map.current;
    container.current.scrollIntoView({ block: "center", behavior: "smooth" });
    m.setView(point ? [point[1], point[0]] : [selected.lat, selected.lng], 18);
    const choose = (e) => onPointChange([e.latlng.lng, e.latlng.lat]);
    m.on("click", choose);
    m.getContainer().style.cursor = "crosshair";
    return () => {
      m.off("click", choose);
      m.getContainer().style.cursor = "";
    };
  }, [point, editing, selected, onPointChange, touchgrass]);
  useEffect(() => {
    if (!buildings || !zones || !map.current) return;
    const shadows = new BuildingShadowLayer(
      buildings,
      atHour(date, hour),
    ).addTo(map.current);
    shadowLayer.current = shadows;
    return () => {
      shadows.remove();
      shadowLayer.current = null;
    };
    // Time changes update the existing layer, preserving its projection cache.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [buildings, zones]);
  useEffect(() => {
    shadowLayer.current?.setInstant(atHour(date, hour));
  }, [date, hour]);
  useEffect(() => {
    if (!touchgrass || !map.current) return;
    const focus = parkFocusLayer(map.current, selected?.id, onSelect).addTo(
      map.current,
    );
    return () => focus.remove();
  }, [touchgrass, selected?.id, onSelect]);
  useEffect(() => {
    if (!touchgrass || !map.current) return;
    const m = map.current;
    const fit = () => fitParkView(m);
    const frame = requestAnimationFrame(() => {
      m.invalidateSize();
      fit();
    });
    m.on("resize", fit);
    return () => {
      cancelAnimationFrame(frame);
      m.off("resize", fit);
    };
  }, [touchgrass]);
  useEffect(() => {
    if (!venueFocus || editing || !map.current) return;
    const focus = venueFocusLayer(map.current, places, results).addTo(
      map.current,
    );
    return () => focus.remove();
  }, [venueFocus, editing, places, results]);
  useEffect(() => {
    if (!venueFocus || !map.current) return;
    const m = map.current;
    const fit = () =>
      fitPlacesView(
        m,
        allPlaces.filter((p) => p.category === category),
      );
    const frame = requestAnimationFrame(() => {
      m.invalidateSize();
      fit();
    });
    m.on("resize", fit);
    return () => {
      cancelAnimationFrame(frame);
      m.off("resize", fit);
    };
  }, [category, venueFocus]);
  useEffect(() => {
    if (viewReset && map.current) fitPlacesView(map.current, allPlaces);
  }, [viewReset]);
  const altitude = SunCalc.getPosition(
    atHour(date, hour),
    55.6865,
    12.581,
  ).altitude;
  return (
    <section
      className={`map-shell ${editing ? "editing" : ""} ${touchgrass ? "touchgrass" : ""} ${venueFocus ? `venue-focus ${category}` : ""}`}
      data-category={category}
      aria-label="Karta över platser i Köpenhamn"
    >
      <div ref={container} className="map" />
      <div className="map-controls">
        <button onClick={() => map.current?.zoomIn()} aria-label="Zooma in">
          <Plus size={19} />
        </button>
        <button onClick={() => map.current?.zoomOut()} aria-label="Zooma ut">
          <Minus size={19} />
        </button>
        <button
          onClick={() =>
            touchgrass
              ? map.current && fitParkView(map.current)
              : map.current &&
                fitPlacesView(
                  map.current,
                  allPlaces.filter(
                    (p) => category === "all" || p.category === category,
                  ),
                )
          }
          aria-label="Visa hela området"
        >
          <LocateFixed size={19} />
        </button>
      </div>
      <div className="map-layer-controls">
        <button
          className={zones ? "on" : ""}
          onClick={() => setZones(!zones)}
          aria-label="Byggnadsskuggor"
          aria-pressed={zones}
        >
          <Layers size={17} /> Skuggor
        </button>
        <button
          aria-label="Om kartan"
          aria-expanded={legendOpen}
          onClick={() => setLegendOpen((open) => !open)}
        >
          <Info size={17} />
        </button>
      </div>
      {zones && (legendOpen || dataError) && (
        <div className="zone-note shadow-legend" role="status">
          {dataError ? (
            <>
              <strong>Skuggdata kunde inte laddas.</strong>
              <button onClick={onRetry}>Försök igen</button>
            </>
          ) : !buildings ? (
            <strong>Laddar byggnader…</strong>
          ) : (
            <>
              <strong>
                <i className="shadow-swatch" />
                {altitude <= 0
                  ? "Solen är under horisonten"
                  : altitude < 5
                    ? "Solen är för låg för skuggmodellen"
                    : "Mörkt = beräknad byggnadsskugga"}
              </strong>
              {touchgrass && (
                <span>
                  <i className="park-swatch" />
                  Grönt = markerad parkyta
                </span>
              )}
              <span>Höjder delvis uppskattade · träd ingår inte</span>
              {altitude > 0 && (
                <span>
                  <i className="coverage-swatch" />
                  Streckat = utanför modellens täckning
                </span>
              )}
              <span>Ändra dag och tid för att följa skuggorna.</span>
            </>
          )}
        </div>
      )}
      {editing && (
        <div className="seat-prompt" role="status">
          Tryck på din sittplats utomhus, nära stället. Blå punkt används i
          beräkningen.
          {seatError && <p>{seatError}</p>}
          <div>
            <button
              onClick={() => {
                const p = map.current.getCenter();
                onPointChange([p.lng, p.lat]);
              }}
            >
              Använd kartans mittpunkt
            </button>
            <button onClick={onCancelEdit}>Avbryt punktval</button>
          </div>
        </div>
      )}
      {tileError && (
        <div className="map-error" role="status">
          Kartbilder kunde inte laddas. Platserna finns i listan.
        </div>
      )}
      {children}
    </section>
  );
}
