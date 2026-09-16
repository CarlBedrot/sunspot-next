import { formatInTimeZone } from "date-fns-tz";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ArrowUpRight,
  SlidersHorizontal,
  List,
  Sparkles,
  CalendarDays,
  ChevronRight,
  Clock3,
  Cloud,
  CloudRain,
  CloudSun,
  Sprout,
  Info,
  MapPin,
  Search,
  Sun,
  Users,
  Utensils,
  Wine,
  Wind,
  X,
} from "lucide-react";
import MapView from "./MapView.jsx";
import EventDetails from "./EventDetails.jsx";
import Invite from "./Invite.jsx";
import * as SunCalc from "suncalc";
import { createDemoEvents, eventsAt } from "./events.js";
import { distanceMeters } from "./exposure.js";
import { useSolarModel } from "./useSolarModel.js";
import SolarWatch, { solarLabel } from "./SolarWatch.jsx";
import { activityFor, activityNames, places } from "./places.js";
import {
  api,
  normalizeSearch,
  atHour,
  clock,
  dayOptions,
  localDate,
  durationLabel,
  saved,
  save,
  weatherAt,
  weatherText,
} from "./lib.js";

const categories = [
  { id: "all", label: "Alla", icon: Sun },
  { id: "park", label: "Touchgrass", icon: Sprout },
  { id: "bar", label: "Bar", icon: Wine },
  { id: "restaurant", label: "Mat", icon: Utensils },
  { id: "event", label: "Event", icon: Sparkles },
];
function WeatherIcon({ symbol = "", ...props }) {
  const Icon = symbol.includes("rain")
    ? CloudRain
    : symbol.includes("clearsky")
      ? Sun
      : symbol.includes("fair") || symbol.includes("partlycloudy")
        ? CloudSun
        : Cloud;
  return <Icon {...props} />;
}
function Modal({ title, children, onClose, className = "" }) {
  const ref = useRef(null);
  useEffect(() => {
    const d = ref.current;
    d.showModal();
    return () => d.close();
  }, []);
  return (
    <dialog
      ref={ref}
      onCancel={onClose}
      className={`modal ${className}`}
      aria-label={title}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="modal-top">
        <h2>{title}</h2>
        <button className="icon-button" aria-label="Stäng" onClick={onClose}>
          <X size={21} />
        </button>
      </div>
      {children}
    </dialog>
  );
}
function PlaceCard({ place, selected, result, onSelect }) {
  return (
    <button
      className={`place-card ${selected ? "selected" : ""}`}
      onClick={() => onSelect(place)}
      aria-pressed={selected}
    >
      <div className="place-art" data-category={place.category}>
        <span>{place.emoji}</span>
        <small>
          {place.category === "park"
            ? "UTE"
            : place.category === "bar"
              ? "BAR"
              : "MAT"}
        </small>
      </div>
      <div className="place-copy">
        <div className="place-name">
          <h3>{place.name}</h3>
          <ArrowUpRight size={17} />
        </div>
        <p>
          {place.kind} <span>·</span> {place.district}
        </p>
        <div className={`sun-status ${result?.state === "sun" ? "" : "muted"}`}>
          <Sun size={14} />
          {solarLabel(result)}
        </div>
        <small className="opening-status">
          {result?.opening.label || "Öppettider kontrolleras…"}
        </small>
      </div>
    </button>
  );
}
function CreateForm({ place, date, hour, duration, onClose }) {
  const router = useRouter();
  const [host, setHost] = useState(""),
    [message, setMessage] = useState(""),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const created = await api("/gatherings", {
        method: "POST",
        body: JSON.stringify({
          placeId: place.id,
          activity: activityFor(place.category),
          startsAt: atHour(date, hour).toISOString(),
          duration,
          host,
          message,
        }),
      });
      const stored = save(`host:${created.id}`, created.hostToken);
      save("gatherings", [
        { id: created.id, name: place.name },
        ...saved("gatherings", []),
      ]);
      if (!stored) {
        setError(
          "Träffen skapades men webbläsaren blockerar lagring. Tillåt lokal lagring för att kunna hantera träffen.",
        );
        setBusy(false);
        return;
      }
      router.push(`/invite/${created.id}`);
    } catch (e) {
      setError(e.message);
      setBusy(false);
    }
  }
  return (
    <Modal title="Samla dina vänner" onClose={onClose}>
      <form className="create-form" onSubmit={submit}>
        <div className="plan-summary">
          <span className="plan-emoji">{place.emoji}</span>
          <div>
            <strong>{place.name}</strong>
            <p>{activityNames[activityFor(place.category)]}</p>
          </div>
        </div>
        <div className="plan-time">
          <CalendarDays size={17} />
          {date}
          <span>·</span>
          {clock(atHour(date, hour))}
          <span>·</span>
          {durationLabel(duration)}
        </div>
        <label htmlFor="host">Ditt namn</label>
        <input
          id="host"
          required
          autoFocus
          autoComplete="given-name"
          maxLength={50}
          placeholder="Till exempel Carl"
          value={host}
          onChange={(e) => setHost(e.target.value)}
        />
        <label htmlFor="message">
          Ett meddelande <span className="optional">(valfritt)</span>
        </label>
        <textarea
          id="message"
          rows={3}
          maxLength={300}
          placeholder="Ska vi ses här och fånga lite sol?"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
        />
        <p className="fineprint">
          Du får en länk med plats, tid och möjlighet att svara. Solläget är en
          uppskattning; ingen bordsbokning görs.
        </p>
        {error && (
          <p className="error" role="alert">
            {error}
          </p>
        )}
        <button className="primary wide" disabled={busy}>
          {busy ? "Skapar…" : "Skapa inbjudan"}
          <ArrowUpRight size={19} />
        </button>
      </form>
    </Modal>
  );
}

export default function App() {
  const [days] = useState(dayOptions);
  const [demoEvents] = useState(() =>
    createDemoEvents(days.map((day) => day.value)),
  );
  const [showDemoEvents, setShowDemoEvents] = useState(() =>
    saved("demo-events", false),
  );
  const [eventFeed, setEventFeed] = useState({
    events: [],
    loading: true,
    message: null,
  });
  const events = [...eventFeed.events, ...(showDemoEvents ? demoEvents : [])];
  const eventFrom = atHour(days[0].value, 0).toISOString();
  const eventTo = atHour(
    localDate(new Date(atHour(days.at(-1).value, 12).getTime() + 86400_000)),
    0,
  ).toISOString();
  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedEventId, setSelectedEventId] = useState(null);
  const [watchOpen, setWatchOpen] = useState(false);
  const [date, setDate] = useState(days[1].value),
    [hour, setHour] = useState(16),
    [duration, setDuration] = useState(90);
  const [category, setCategory] = useState("all"),
    [query, setQuery] = useState(""),
    [selected, setSelected] = useState(places[0]);
  const [weather, setWeather] = useState(null),
    [weatherLoading, setWeatherLoading] = useState(true),
    [modal, setModal] = useState(null);
  const inviteId = window.location.pathname.startsWith("/invite/")
    ? window.location.pathname.split("/")[2]
    : null;
  useEffect(() => {
    if (inviteId) return;
    const controller = new AbortController();
    api("/weather", { signal: controller.signal })
      .then(setWeather)
      .catch((e) => {
        if (e.name !== "AbortError") setWeather({ available: false });
      })
      .finally(() => {
        if (!controller.signal.aborted) setWeatherLoading(false);
      });
    return () => controller.abort();
  }, [inviteId]);
  useEffect(() => {
    if (inviteId) return;
    const controller = new AbortController();
    const loadEvents = () =>
      api(
        `/events?from=${encodeURIComponent(eventFrom)}&to=${encodeURIComponent(eventTo)}`,
        { signal: controller.signal },
      )
        .then((data) => {
          if (!controller.signal.aborted)
            setEventFeed({ ...data, loading: false });
        })
        .catch((error) => {
          if (error.name !== "AbortError")
            setEventFeed({
              events: [],
              loading: false,
              message: "Event kunde inte hämtas. Försök igen om en stund.",
            });
        });
    loadEvents();
    const timer = setInterval(loadEvents, 15 * 60_000);
    return () => {
      controller.abort();
      clearInterval(timer);
    };
  }, [inviteId, eventFrom, eventTo]);
  const [onlySun, setOnlySun] = useState(true),
    [onlyOpen, setOnlyOpen] = useState(false);
  const [seatError, setSeatError] = useState("");
  const [viewReset, setViewReset] = useState(0);
  const activeFilters =
    Number(category !== "all") +
    Number(Boolean(query.trim())) +
    Number(onlySun) +
    Number(onlyOpen);
  const [editing, setEditing] = useState(false),
    [watchId, setWatchId] = useState(null),
    [live, setLive] = useState(false);
  const [overrides, setOverrides] = useState(() => {
    const value = saved("seats:v1") || {};
    return Object.fromEntries(
      Object.entries(value).filter(
        ([id, p]) =>
          places.some((v) => v.id === id) &&
          Array.isArray(p) &&
          p.length === 2 &&
          p.every(Number.isFinite) &&
          p[0] >= 12.53 &&
          p[0] <= 12.632 &&
          p[1] >= 55.662 &&
          p[1] <= 55.711,
      ),
    );
  });
  useEffect(() => {
    if (!live) return;
    const tick = () => {
      const now = new Date();
      setDate(localDate(now));
      setHour(
        Number(formatInTimeZone(now, "Europe/Copenhagen", "H")) +
          Number(formatInTimeZone(now, "Europe/Copenhagen", "m")) / 60,
      );
    };
    tick();
    const timer = setInterval(tick, 15000);
    const visible = () => {
      if (document.visibilityState === "visible") tick();
    };
    document.addEventListener("visibilitychange", visible);
    return () => {
      clearInterval(timer);
      document.removeEventListener("visibilitychange", visible);
    };
  }, [live]);
  const timelineMinute =
    Math.max(
      0,
      days.findIndex((day) => day.value === date),
    ) *
      1440 +
    Math.round(hour * 60);
  const timelineMax = days.length * 1440 - 5;
  const instant = atHour(date, hour).toISOString();
  const solar = useSolarModel(instant, overrides, duration, !inviteId);
  const results = solar.results;
  const matchingEvents = events.filter((event) =>
    normalizeSearch(
      [event.name, event.venue, ...(event.tags || [])].join(" "),
    ).includes(normalizeSearch(query)),
  );
  const visibleEvents =
    category === "all" || category === "event"
      ? eventsAt(matchingEvents, instant)
      : [];
  const activeEvent = visibleEvents.find(
    (event) => event.id === selectedEventId,
  );
  const result = results[selected.id];
  const sunset = SunCalc.getTimes(atHour(date, 12), 55.6865, 12.581).sunset;
  const forecast = weatherAt(weather, atHour(date, hour));
  const matching = places.filter(
    (p) =>
      (category === "all" ||
        (p.category === category && (category !== "park" || p.greenSpace))) &&
      normalizeSearch(`${p.name} ${p.district}`).includes(
        normalizeSearch(query),
      ),
  );
  const filtered = matching
    .filter((p) => {
      const r = results[p.id];
      if (
        onlySun &&
        (!r ||
          !r.eligible ||
          r.state === "shade" ||
          r.opening.state === "closed")
      )
        return false;
      if (onlyOpen && r?.opening.state !== "open") return false;
      return true;
    })
    .sort((a, b) => (results[b.id]?.until || 0) - (results[a.id]?.until || 0));
  const choosePoint = useCallback(
    (point) => {
      if (
        point[0] < 12.53 ||
        point[0] > 12.632 ||
        point[1] < 55.662 ||
        point[1] > 55.711 ||
        distanceMeters(point, [selected.lng, selected.lat]) > 100
      ) {
        setSeatError("Välj en sittplats inom 100 meter från stället.");
        return;
      }
      setSeatError("");
      setOverrides((previous) => {
        const next = { ...previous, [selected.id]: point };
        save("seats:v1", next);
        return next;
      });
      setEditing(false);
    },
    [selected],
  );
  const selectPlace = useCallback(
    (place) => {
      setSelected(place);
      setDetailOpen(true);
      setSelectedEventId(null);
      setModal(null);
      setWatchOpen(false);
      setEditing(false);
    },
    [setModal],
  );
  const selectMarker = useCallback(
    (item) => {
      if (item.category === "event") {
        setSelectedEventId(item.id);
        setDetailOpen(false);
        setEditing(false);
        setModal(null);
      } else selectPlace(item);
    },
    [selectPlace, setModal],
  );
  const closeEvent = useCallback(() => setSelectedEventId(null), []);
  function jumpToEvent(event) {
    const chosen = new Date(
      Math.max(Date.parse(event.startsAt), Date.parse(eventFrom)),
    );
    setDate(localDate(chosen));
    const [h, m] = clock(chosen).split(":").map(Number);
    setHour(h + m / 60);
    setLive(false);
    setCategory("event");
    selectMarker(event);
  }
  function clearFilters() {
    setCategory("all");
    setDetailOpen(false);
    setSelectedEventId(null);
    setQuery("");
    setOnlySun(false);
    setOnlyOpen(false);
    setEditing(false);
    setSeatError("");
    setViewReset((value) => value + 1);
  }
  function changeCategory(value) {
    if (value === "all") {
      clearFilters();
      return;
    }
    setCategory(value);
    setEditing(false);
    setDetailOpen(false);
    setSelectedEventId(null);
  }
  return (
    <>
      <header className={`header ${!inviteId ? "map-header" : ""}`}>
        <Link className="brand" href="/" aria-label="SunSpot startsida">
          <span className="brand-icon">
            <Sun size={27} strokeWidth={2.1} />
          </span>
          SunSpot<span className="beta">preview</span>
        </Link>
        <nav aria-label="Huvudmeny">
          <Link href="/" className={!inviteId ? "nav-active" : ""}>
            Utforska
          </Link>
          <button onClick={() => setModal("gatherings")}>
            <Users size={16} /> Mina träffar
          </button>
        </nav>
        <div className="header-city">
          <MapPin size={15} /> Köpenhamn<span className="city-flag">🇩🇰</span>
        </div>
      </header>
      {inviteId ? (
        <Invite id={inviteId} />
      ) : (
        <>
          <main className="map-workspace" data-solar-pending={solar.pending}>
            <div className="map-toolbar">
              <div className="map-search-row">
                <div className="search-box">
                  <Search size={18} />
                  <input
                    aria-label="Sök plats eller område"
                    placeholder="Sök en plats eller ett område"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                  />
                  {query && (
                    <button
                      onClick={() => setQuery("")}
                      aria-label="Rensa sökning"
                    >
                      <X size={15} />
                    </button>
                  )}
                </div>
                <button
                  className="toolbar-button"
                  aria-label="Öppna filter"
                  onClick={() => setModal("filters")}
                >
                  <SlidersHorizontal size={19} />
                  {activeFilters > 0 && (
                    <span className="filter-count">{activeFilters}</span>
                  )}
                </button>
                <button
                  className="toolbar-button"
                  aria-label="Visa platslista"
                  onClick={() => setModal("list")}
                >
                  <List size={19} />
                </button>
              </div>
              <div className="activity-tabs">
                {categories.map(({ id, label, icon: Icon }) => (
                  <button
                    key={id}
                    className={category === id ? "active" : ""}
                    data-category={id}
                    aria-pressed={category === id}
                    onClick={() => changeCategory(id)}
                  >
                    <Icon size={17} />
                    {label}
                  </button>
                ))}
              </div>
            </div>
            <MapView
              category={category}
              viewReset={viewReset}
              places={filtered}
              events={visibleEvents}
              selected={activeEvent || (detailOpen ? selected : null)}
              onSelect={selectMarker}
              date={date}
              hour={hour}
              results={results}
              buildings={solar.buildings}
              dataError={solar.error}
              onRetry={solar.retry}
              point={
                detailOpen ? result?.point || overrides[selected.id] : null
              }
              editing={editing}
              seatError={seatError}
              onCancelEdit={() => setEditing(false)}
              onPointChange={choosePoint}
            >
              {detailOpen && !activeEvent && (
                <article className="detail-card" aria-label="Vald plats">
                  <button
                    className="detail-close icon-button"
                    aria-label="Stäng plats"
                    onClick={() => {
                      setDetailOpen(false);
                      setEditing(false);
                    }}
                  >
                    <X size={18} />
                  </button>
                  <div className="detail-top">
                    <span className="detail-category">
                      {selected.kind} <span>·</span> {selected.district}
                    </span>
                    <span className="demo-badge">BERÄKNAT · OSÄKERT</span>
                  </div>
                  <h2>
                    {selected.name}
                    <span>{selected.emoji}</span>
                  </h2>
                  <div className="sun-window">
                    <div>
                      <Sun size={22} />
                      <span>
                        {selected.category === "park"
                          ? "Parkens provpunkter"
                          : "Vald utomhuspunkt"}
                        <strong>
                          {solar.pending
                            ? "Beräknar solläge…"
                            : solarLabel(result)}
                        </strong>
                      </span>
                    </div>
                  </div>
                  <details className="place-more">
                    <summary>Mer om platsen</summary>
                    <p className="detail-description">{selected.description}</p>
                    <p className="point-note">
                      {selected.category === "park"
                        ? result?.state === "unknown"
                          ? "Solläget är okänt när skuggdata saknas eller solen står för lågt. Trädskuggor ingår inte."
                          : "Delvis soliga parker finns kvar i urvalet. Trädskuggor ingår inte."
                        : result?.pointSource === "chosen"
                          ? "Din valda punkt visas i blått. Höjder är delvis uppskattade."
                          : "Blå punkt är en uppskattad utomhuspunkt, inte en verifierad uteservering."}
                    </p>
                    {result && !filtered.some((p) => p.id === selected.id) && (
                      <p className="point-note">
                        Platsen döljs av ditt filter. Det valda kortet finns
                        kvar så att du kan följa förändringen.
                      </p>
                    )}
                    {selected.category !== "park" && (
                      <div className="seat-actions">
                        <button
                          onClick={() => {
                            setSeatError("");
                            setEditing((v) => !v);
                          }}
                        >
                          {editing
                            ? "Avbryt punktval"
                            : "Välj min sittplats på kartan"}
                        </button>
                        <button
                          disabled={
                            !result?.eligible ||
                            result?.state === "unknown" ||
                            solar.pending
                          }
                          onClick={() => {
                            setWatchId(selected.id);
                            setWatchOpen(true);
                          }}
                        >
                          Bevaka solen här
                        </button>
                      </div>
                    )}
                    <div className="detail-foot">
                      <a
                        href={`https://www.openstreetmap.org/${selected.osm}`}
                        target="_blank"
                        rel="noreferrer"
                      >
                        <MapPin size={14} /> Visa platskälla
                      </a>
                      <span title={selected.openingHours || undefined}>
                        {result?.opening.label || "Öppettider okända"}
                      </span>
                    </div>
                  </details>
                  <button
                    className="primary wide"
                    onClick={() => setModal("create")}
                  >
                    Ses här med vänner
                    <ArrowUpRight size={20} />
                  </button>
                </article>
              )}
              {watchId && (
                <button
                  className="watch-peek"
                  onClick={() => setWatchOpen((value) => !value)}
                >
                  {solarLabel(results[watchId])} · Visa solbevakning
                </button>
              )}
            </MapView>
            {activeEvent && (
              <EventDetails
                key={activeEvent.id}
                event={activeEvent}
                weather={weather}
                stale={eventFeed.stale}
                onClose={closeEvent}
              />
            )}

            <section className="time-dock controls" aria-label="Dag och tid">
              <div className="days">
                {days.map((d) => (
                  <button
                    className={date === d.value ? "active" : ""}
                    key={d.value}
                    aria-pressed={date === d.value}
                    onClick={() => {
                      setLive(false);
                      setDate(d.value);
                    }}
                  >
                    <span>{d.label}</span>
                    <strong>{d.day.split(" ")[0]}</strong>
                  </button>
                ))}
              </div>
              <div className="time-label">
                <label htmlFor="time">Dra genom veckan</label>
                <input
                  className="exact-time"
                  type="time"
                  aria-label="Exakt klockslag"
                  step="300"
                  value={clock(atHour(date, hour))}
                  onChange={(event) => {
                    if (!/^\d{2}:\d{2}$/.test(event.target.value)) return;
                    const [h, m] = event.target.value.split(":").map(Number);
                    setLive(false);
                    setHour(h + m / 60);
                  }}
                />
              </div>
              <input
                id="time"
                type="range"
                min="0"
                max={timelineMax}
                step="5"
                value={timelineMinute}
                aria-label="Dag och tid"
                aria-valuetext={`${days.find((day) => day.value === date)?.day} ${clock(atHour(date, hour))}`}
                onChange={(e) => {
                  setLive(false);
                  const minute = Number(e.target.value);
                  setDate(days[Math.floor(minute / 1440)].value);
                  setHour((minute % 1440) / 60);
                }}
                style={{
                  "--progress": `${(timelineMinute / timelineMax) * 100}%`,
                }}
              />
              <div className="range-labels">
                <span>{days[0].label} 00:00</span>
                <span>7 dagar</span>
                <span>{days.at(-1).day} 23:55</span>
              </div>
              <div className="timeline-status">
                <button
                  aria-label="Visa veckans event"
                  onClick={() => {
                    setCategory("event");
                    setModal("list");
                  }}
                >
                  {category === "all" || category === "event" ? (
                    <>
                      {eventFeed.loading
                        ? "Hämtar event…"
                        : eventFeed.message
                          ? "Eventkälla saknas / äldre data"
                          : `${visibleEvents.length} event nu · se veckan`}{" "}
                      {showDemoEvents && (
                        <span className="demo-label">inkl. demo</span>
                      )}
                    </>
                  ) : (
                    `${filtered.length} platser`
                  )}
                </button>
                <button
                  onClick={() => setModal("weather")}
                  aria-label="Visa väderprognos"
                >
                  {forecast
                    ? `${Math.round(forecast.temperature)}° · ${weatherText(forecast.symbol)}`
                    : "Väder saknas"}{" "}
                  <CloudSun size={14} />
                </button>
              </div>
            </section>
          </main>
          {watchId && (
            <div className="watch-panel" hidden={!watchOpen}>
              <button
                className="watch-minimize"
                onClick={() => setWatchOpen(false)}
              >
                Tillbaka till kartan <X size={14} />
              </button>
              <SolarWatch
                id={watchId}
                results={results}
                instant={instant}
                duration={duration}
                live={live}
                pending={solar.pending}
                onStop={() => setWatchId(null)}
                onSelect={selectPlace}
                onLive={() => setLive(true)}
              />
            </div>
          )}
          {modal === "filters" && (
            <Modal title="Filter" onClose={() => setModal(null)}>
              <div className="filter-panel controls">
                <div className="solar-filters">
                  <label>
                    <input
                      type="checkbox"
                      checked={onlySun}
                      onChange={(e) => setOnlySun(e.target.checked)}
                    />
                    Dölj skugga och stängda platser
                  </label>
                  <label>
                    <input
                      type="checkbox"
                      checked={onlyOpen}
                      onChange={(e) => setOnlyOpen(e.target.checked)}
                    />
                    Bara bekräftat öppet enligt OSM
                  </label>
                  <label>
                    <input
                      type="checkbox"
                      checked={showDemoEvents}
                      onChange={(e) => {
                        setShowDemoEvents(e.target.checked);
                        save("demo-events", e.target.checked);
                      }}
                    />
                    Visa demo-event
                  </label>
                  <button
                    className="text-button"
                    aria-pressed={live}
                    onClick={() => setLive((v) => !v)}
                  >
                    {live ? "● Följer klockan · pausa" : "Följ klockan nu"}
                  </button>
                </div>
                <p className="fineprint">
                  Sol och öppettider filtrerar platser. Event visas under sin
                  start- och sluttid.
                </p>
                <div className="duration-row">
                  <label htmlFor="duration">
                    <Clock3 size={15} /> Tid tillsammans
                  </label>
                  <select
                    id="duration"
                    value={duration}
                    onChange={(e) => setDuration(Number(e.target.value))}
                  >
                    {[30, 60, 90, 120].map((n) => (
                      <option key={n} value={n}>
                        {durationLabel(n)}
                      </option>
                    ))}
                  </select>
                </div>
                <button
                  className="text-button"
                  onClick={() => {
                    clearFilters();
                    setModal(null);
                  }}
                >
                  Visa allt — ta bort alla filter
                </button>
                <button className="primary wide" onClick={() => setModal(null)}>
                  Visa kartan <ChevronRight size={18} />
                </button>
                <button
                  className="text-button"
                  onClick={() => setModal("about")}
                >
                  Om förhandsvisningen
                </button>
              </div>
            </Modal>
          )}
          {modal === "list" && (
            <Modal
              title={
                category === "event" ? "Event denna vecka" : "Platser just nu"
              }
              onClose={() => setModal(null)}
            >
              {category !== "event" && (
                <section className="results">
                  <div className="results-heading">
                    <h2>
                      {solar.pending
                        ? "Beräknar solläge…"
                        : `${filtered.length} platser att upptäcka`}
                    </h2>
                    <span>Byggnadsskuggor</span>
                  </div>
                  <div className="place-list">
                    {filtered.map((p) => (
                      <PlaceCard
                        key={p.id}
                        place={p}
                        selected={selected.id === p.id}
                        result={results[p.id]}
                        onSelect={selectPlace}
                      />
                    ))}
                    {!filtered.length &&
                      !visibleEvents.length &&
                      !solar.pending && (
                        <div className="empty-state">
                          <Search size={26} />
                          <h3>Ingen plats hittades</h3>
                          <p>
                            {solar.error
                              ? "Skuggdata kunde inte laddas. Försök igen på kartan."
                              : "Prova en annan tid eller visa även skugga och stängda platser."}
                          </p>
                          <button
                            className="text-button"
                            onClick={clearFilters}
                          >
                            Återställ sökningen
                          </button>
                        </div>
                      )}
                  </div>
                  <p className="list-note">
                    <Info size={13} /> Beräknad byggnadssol. Barers
                    utomhuspunkter är uppskattade tills du väljer sittplats.
                    Parkers provpunkter tar hänsyn till byggnader och
                    registrerat vatten, inte träd. Okända sollägen och
                    öppettider är märkta.
                  </p>
                </section>
              )}
              {(category === "all" || category === "event") && (
                <>
                  <div className="event-list-heading">
                    <h3>Event denna vecka</h3>
                    <span>{matchingEvents.length}</span>
                  </div>
                  {eventFeed.loading && (
                    <p role="status">Hämtar event från Köpenhamn…</p>
                  )}
                  {eventFeed.message && (
                    <p className="fineprint" role="status">
                      {eventFeed.message}
                    </p>
                  )}
                  <div className="event-list">
                    {matchingEvents
                      .sort(
                        (a, b) =>
                          Date.parse(a.startsAt) - Date.parse(b.startsAt),
                      )
                      .map((event) => (
                        <button
                          key={event.id}
                          className="event-list-item"
                          onClick={() => jumpToEvent(event)}
                        >
                          <span>{event.emoji}</span>
                          <strong>{event.name}</strong>
                          <small>
                            {clock(new Date(event.startsAt))}–
                            {clock(new Date(event.endsAt))} ·{" "}
                            {localDate(new Date(event.startsAt))}
                            {event.demo ? " · demo" : ""}
                          </small>
                        </button>
                      ))}
                  </div>
                </>
              )}
              {category === "event" &&
                !matchingEvents.length &&
                !eventFeed.loading && (
                  <p className="fineprint">
                    Inga event hittades för den här veckan och sökningen.
                  </p>
                )}
            </Modal>
          )}
          {modal === "weather" && (
            <Modal title="Väder för vald tid" onClose={() => setModal(null)}>
              <div className="weather-card">
                <div className="weather-top">
                  <div className="weather-icon">
                    {forecast ? (
                      <WeatherIcon symbol={forecast.symbol} size={28} />
                    ) : (
                      <Cloud size={28} />
                    )}
                  </div>
                  <div>
                    <strong>
                      {weatherLoading
                        ? "Hämtar väder…"
                        : forecast
                          ? `${Math.round(forecast.temperature)}° · ${weatherText(forecast.symbol)}`
                          : "Väderprognos saknas"}
                    </strong>
                    <p>
                      {forecast ? (
                        <>
                          <Wind size={12} />
                          {Math.round(forecast.wind)} m/s <span>·</span>{" "}
                          {forecast.rain ?? "—"} mm / {forecast.hours} h
                        </>
                      ) : weather?.available ? (
                        "Utanför prognosens tidsintervall"
                      ) : (
                        "För vald tid i Köpenhamn"
                      )}
                    </p>
                  </div>
                </div>
                <div className="weather-source">
                  <a
                    href="https://www.met.no/"
                    target="_blank"
                    rel="noreferrer"
                  >
                    Väder: MET Norway
                  </a>
                  <span>
                    {weather?.stale
                      ? "Äldre prognos"
                      : weather?.available
                        ? `Uppd. ${clock(new Date(weather.updatedAt))}`
                        : "Yr / MET-spåret"}
                  </span>
                </div>
              </div>
              <p className="fineprint">
                Solnedgång {clock(sunset)} · Köpenhamn
              </p>
            </Modal>
          )}
        </>
      )}
      {modal === "create" && (
        <CreateForm
          place={selected}
          date={date}
          hour={hour}
          duration={duration}
          onClose={() => setModal(null)}
        />
      )}
      {modal === "about" && (
        <Modal title="En första titt på SunSpot" onClose={() => setModal(null)}>
          <div className="about-content">
            <p>
              Utforska Köpenhamn, välj aktivitet och tid och skapa en träff med
              dina vänner.
            </p>
            <h3>Det här är riktig data</h3>
            <p>
              Platsnamn och kartpositioner kommer från OpenStreetMap. Väder
              hämtas från MET Norway. Soluppgång och solnedgång beräknas med
              SunCalc.
            </p>
            <h3>Beräknade byggnadsskuggor</h3>
            <p>
              Kartans mörka lager följer vald dag och tid. Det beräknas från
              OpenStreetMaps byggnadskonturer och solens position. Där angiven
              höjd saknas används våningsantal × 3 meter, annars 12 meter. Träd,
              terräng och detaljerade takformer ingår inte. Streckade ytor
              ligger utanför modellens täckning. Moln visas bara i
              väderprognosen.
            </p>
            <h3>Urvalet följer solen</h3>
            <p>
              Kort och karta använder samma byggnadsmodell. Barer bedöms vid en
              uppskattad eller självvald utomhuspunkt. Parker provtas över ytan
              och behålls vid delvis sol. Öppettider kommer från OSM; okända
              eller ej tolkbara tider anges som okända. Modellen är inte
              fältverifierad.
            </p>
            <h3>Träffar fungerar lokalt</h3>
            <p>
              Inbjudningar och gästsvar sparas. Länkar fungerar på den här
              datorn; publik delning och verifierade soltider per plats är nästa
              steg.
            </p>
            <button className="primary wide" onClick={() => setModal(null)}>
              Utforska SunSpot
              <ChevronRight size={18} />
            </button>
          </div>
        </Modal>
      )}
      {modal === "gatherings" && (
        <Modal title="Mina träffar" onClose={() => setModal(null)}>
          <div className="my-gatherings">
            {saved("gatherings", []).length ? (
              saved("gatherings", []).map((g) => (
                <Link href={`/invite/${g.id}`} key={g.id}>
                  <Users size={20} />
                  <span>{g.name}</span>
                  <ChevronRight size={18} />
                </Link>
              ))
            ) : (
              <div className="empty-state">
                <Users size={30} />
                <h3>Det börjar med en plats.</h3>
                <p>
                  Välj ett ställe på kartan och bjud in till din första träff.
                </p>
              </div>
            )}
            <p className="fineprint">
              Här visas träffar som du skapat i den här webbläsaren.
            </p>
          </div>
        </Modal>
      )}
    </>
  );
}
