import { useEffect, useRef, useState } from "react";
import { MapPin, Sun, ArrowUpRight } from "lucide-react";
import {
  nearbyAreas,
  nearbyRecommendations,
  validNearbyLocation,
} from "./nearby.js";
import { clock, localDate, weatherText } from "./lib.js";
import { terraceLabel } from "./venueEvidence.js";

export default function NearbyPlaces({
  places,
  results,
  instant,
  pending,
  error,
  forecast,
  onlyOpen,
  onNow,
  onSelect,
}) {
  const [origin, setOrigin] = useState(null);
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);
  const [duration, setDuration] = useState(30);
  const request = useRef(0);
  useEffect(
    () => () => {
      request.current++;
    },
    [],
  );
  function locate() {
    const id = ++request.current;
    setOrigin(null);
    if (!navigator.geolocation) {
      setStatus(
        "Platsdelning saknas i den här webbläsaren. Välj ett område nedan.",
      );
      return;
    }
    setBusy(true);
    setStatus("");
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        if (id !== request.current) return;
        setBusy(false);
        const point = [coords.longitude, coords.latitude];
        if (!validNearbyLocation(point, coords.accuracy)) {
          setStatus(
            "Positionen är för osäker eller utanför vårt kartområde. Välj ett område nedan.",
          );
          return;
        }
        onNow();
        setOrigin({ point, name: "din position" });
      },
      (failure) => {
        if (id !== request.current) return;
        setBusy(false);
        setStatus(
          failure.code === 1
            ? "Platsdelning är avstängd. Välj ett område eller tillåt plats i webbläsarens inställningar."
            : "Positionen kunde inte hämtas. Försök igen eller välj ett område.",
        );
      },
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 60000 },
    );
  }
  function chooseArea(area) {
    request.current++;
    setBusy(false);
    setStatus("");
    setOrigin({ ...area, name: `${area.name}s områdesmitt` });
  }
  const recommendations =
    origin && !pending && !error
      ? nearbyRecommendations(
          places,
          results,
          origin.point,
          instant,
          duration,
          onlyOpen,
        )
      : [];
  return (
    <div className="nearby-content">
      <p className="nearby-intro">Hitta en solig paus på gångavstånd.</p>
      <button className="primary wide" onClick={locate} disabled={busy}>
        <MapPin size={18} />
        {busy ? "Hämtar position…" : "Använd min position & tid nu"}
      </button>
      <p className="fineprint">
        Din position används bara här i webbläsaren och sparas inte.
      </p>
      {status && (
        <p role="status" className="point-note">
          {status}
        </p>
      )}
      <div className="nearby-areas" aria-label="Välj område utan platsdelning">
        {nearbyAreas.map((area) => (
          <button
            key={area.name}
            onClick={() => chooseArea(area)}
            aria-pressed={origin?.name === `${area.name}s områdesmitt`}
          >
            {area.name}
          </button>
        ))}
      </div>
      <div className="nearby-options">
        <label htmlFor="nearby-duration">Tid att stanna</label>
        <select
          id="nearby-duration"
          value={duration}
          onChange={(e) => setDuration(Number(e.target.value))}
        >
          <option value={30}>30 min</option>
          <option value={60}>1 timme</option>
          <option value={90}>1,5 timmar</option>
        </select>
      </div>
      <p className="nearby-context">
        {localDate(new Date(instant))} · Avfärd {clock(new Date(instant))}
        {origin ? ` · Från ${origin.name}` : ""}
      </p>
      <p className="nearby-weather">
        Prognos:{" "}
        {forecast
          ? `${Math.round(forecast.temperature)}° · ${weatherText(forecast.symbol)}`
          : "saknas för vald tid"}
        . Byggnadssol beräknas separat från moln.
      </p>
      {origin && (
        <div className="nearby-results" aria-live="polite" aria-busy={pending}>
          {error ? (
            <p>
              Skuggdata kunde inte laddas. Stäng och försök igen via kartan.
            </p>
          ) : pending ? (
            <p>Beräknar sol vid ankomst…</p>
          ) : recommendations.length ? (
            recommendations.map((item) => (
              <button
                className="nearby-result"
                key={item.place.id}
                onClick={() => onSelect(item.place)}
              >
                <span className="nearby-result-top">
                  <strong>
                    {item.place.emoji} {item.place.name}
                  </strong>
                  <ArrowUpRight size={18} />
                </span>
                <span>
                  Ca {item.walk} min promenad · {item.opening.label}
                </span>
                <span className="nearby-sun">
                  <Sun size={15} />
                  {item.horizon ? "Minst ca" : "Ca"} {item.sunMinutes} min
                  byggnadssol efter ankomst
                </span>
                <small>
                  {item.place.category === "park"
                    ? "Delvis sol i parken · trädskuggor saknas"
                    : `${terraceLabel(item.place)} · ${item.pointSource === "chosen" ? "din valda punkt" : "uppskattad sittpunkt"}`}
                </small>
              </button>
            ))
          ) : (
            <p>
              Inga matchande platser med {duration} min beräknad byggnadssol
              efter ankomst inom 1,5 km. Prova en annan tid, kortare besök eller
              andra filter.
            </p>
          )}
        </div>
      )}
      <p className="fineprint">
        Dina kategori-, sök- och öppetfilter gäller. Gångtiden uppskattas från
        avståndet, inte en kontrollerad gångväg. Öppettider och solläge kan
        avvika på plats.
      </p>
    </div>
  );
}
