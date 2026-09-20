"use client";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import {
  ArrowUpRight,
  Check,
  Clock3,
  MapPin,
  Share2,
  Sun,
  Users,
} from "lucide-react";
import { LanguageProvider, LanguageSelect, useLanguage } from "./Language.jsx";
import {
  hangActivities,
  readHangLocal,
  writeHangLocal,
  newHangToken,
  hangRequest,
  rememberHang,
  hangTime,
  hangDate,
} from "./hangs.js";
import { readProfile, rememberProfileName } from "./profile.js";
import ProfileLink from "./ProfileLink.jsx";
import Avatar from "./Avatar.jsx";
import { placeMapsUrl } from "./placeShare.js";

function Hang({ id, canExplore }) {
  const { t, locale } = useLanguage();
  const [h, setH] = useState(null),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false),
    [fatal, setFatal] = useState(false);
  const [profile] = useState(readProfile);
  const [name, setName] = useState(() => profile.name),
    [joining, setJoining] = useState(false),
    [feedback, setFeedback] = useState(""),
    [manual, setManual] = useState("");
  const [clock, setClock] = useState(() => Date.now());
  const offset = useRef(0);
  const alive = useRef(true);
  const generation = useRef(0);
  const [credential] = useState(
    () =>
      readHangLocal(`host:${id}`) ||
      readHangLocal(`guest:${id}`) ||
      newHangToken(),
  );
  function accept(data) {
    offset.current = data.serverNow - Date.now();
    setClock(data.serverNow);
    setH(data);
    setFatal(false);
  }
  useEffect(() => {
    alive.current = true;
    let loading = false;
    const controller = new AbortController();
    async function refresh() {
      if (document.hidden || loading) return;
      loading = true;
      const version = generation.current;
      try {
        const data = await hangRequest(`/${id}`, {
          token: credential,
          signal: controller.signal,
        });
        if (alive.current && version === generation.current) {
          accept(data);
          setError("");
        }
      } catch (err) {
        if (
          alive.current &&
          err.name !== "AbortError" &&
          version === generation.current
        ) {
          setError(err.message);
          setFatal(err.status === 404);
        }
      } finally {
        loading = false;
      }
    }
    refresh();
    const poll = setInterval(refresh, 30000);
    const tick = setInterval(() => setClock(Date.now() + offset.current), 1000);
    document.addEventListener("visibilitychange", refresh);
    window.addEventListener("online", refresh);
    return () => {
      alive.current = false;
      controller.abort();
      clearInterval(poll);
      clearInterval(tick);
      document.removeEventListener("visibilitychange", refresh);
      window.removeEventListener("online", refresh);
    };
  }, [id, credential]);
  async function mutate(action, body) {
    setBusy(true);
    setError("");
    generation.current++;
    try {
      if (action === "rsvp" && !writeHangLocal(`guest:${id}`, credential))
        throw Error(
          "Tillåt lokal lagring i webbläsaren för att spara ditt svar.",
        );
      const data = await hangRequest(`/${id}/${action}`, {
        token: credential,
        body:
          action === "rsvp" && body.coming
            ? { ...body, photo: profile.photo }
            : body,
      });
      accept(data);
      if (data.isHost) rememberHang(data, credential);
      if (action === "rsvp") {
        rememberProfileName(name.trim());
        setJoining(false);
      }
      return true;
    } catch (err) {
      setError(err.message);
      return false;
    } finally {
      generation.current++;
      setBusy(false);
    }
  }
  const ended = h && (h.status === "ended" || clock >= h.endsAt);
  const scheduled = h && clock < h.startsAt;
  const activity = hangActivities.find((a) => a.id === h?.activity);
  const title = h
    ? t("{0} {1} på {2}", [h.host, t(activity.verb), h.place.name])
    : "";
  async function share() {
    const data = {
      title: "SunSpot",
      text: `${title}. ${hangDate(h.startsAt, locale)} · ${t("Här till {0}", [hangTime(h.endsAt, locale)])}. ${t("Kom förbi!")}`,
      url: h.url,
    };
    setFeedback("");
    setManual("");
    try {
      if (navigator.share) await navigator.share(data);
      else {
        await navigator.clipboard.writeText(`${data.text}\n${data.url}`);
        setFeedback("Kopierat! Klistra in i chatten.");
      }
    } catch (err) {
      if (err.name !== "AbortError") {
        setManual(`${data.text}\n${data.url}`);
        setFeedback("Markera och kopiera meddelandet nedan.");
      }
    }
  }
  return (
    <main className="hang-page">
      <header className="hang-header">
        <Link className="hang-brand" href="/" aria-label="SunSpot">
          <Sun size={24} />
          SunSpot
        </Link>
        <div className="hang-header-actions">
          <LanguageSelect />
          <ProfileLink returnTo={`/hang/${id}`} />
        </div>
      </header>
      {!h || fatal ? (
        <section className="hang-card hang-empty">
          <span className="hang-art">👋</span>
          <h1>{t(error || "Hämtar hänget…")}</h1>
          {error && (
            <button className="secondary" onClick={() => location.reload()}>
              {t("Försök igen")}
            </button>
          )}
        </section>
      ) : (
        <>
          <section className={`hang-card ${ended ? "is-ended" : ""}`}>
            <div className="hang-card-top">
              <span className="hang-status">
                <i />
                {t(
                  ended
                    ? "Hänget är avslutat"
                    : scheduled
                      ? "Vi ses snart"
                      : "Kom förbi",
                )}
              </span>
              <span className="hang-city">{t("Köpenhamn")}</span>
            </div>
            <div className="hang-art" aria-hidden="true">
              {ended ? "👋" : activity.emoji}
              <span className="hang-spark">✳</span>
            </div>
            <p className="hang-eyebrow">
              {t(
                ended ? "{0} bjöd in till ett häng" : "{0} {1}",
                ended ? [h.host] : [h.host, t(activity.verb)],
              )}
            </p>
            <h1>
              {h.place.name}
              <span className="hang-title-dot">.</span>
            </h1>
            <p className="hang-location">
              <MapPin size={15} />
              {h.place.district}
            </p>
            <p className="hang-time">
              <Clock3 size={17} />
              {ended
                ? t("Tack för hänget.")
                : scheduled
                  ? `${hangDate(h.startsAt, locale)} · ${hangTime(h.startsAt, locale)}–${hangTime(h.endsAt, locale)}`
                  : t("Här till {0}", [hangTime(h.endsAt, locale)])}
            </p>
            {ended ? (
              <p className="hang-muted">
                {t("Ingen väntar på svar här längre. Vi ses nästa gång!")}
              </p>
            ) : (
              <>
                <div className="hang-guests" aria-live="polite">
                  <div className="hang-avatars">
                    <Avatar name={h.host} photo={h.hostPhoto} />
                    {h.guests.slice(0, 4).map((g) => (
                      <Avatar key={g.id} name={g.name} photo={g.photo} />
                    ))}
                  </div>
                  <p>
                    {h.guests.length
                      ? t("{0} kommer", [
                          h.guests.map((g) => g.name).join(", "),
                        ])
                      : h.isHost
                        ? t("Vem kommer förbi? Dela länken.")
                        : t("Bli först att säga ”jag kommer”.")}
                  </p>
                </div>
                {h.isHost ? (
                  <button
                    className="primary wide hang-main-action"
                    onClick={share}
                  >
                    <Share2 size={19} />
                    {t("Dela med vänner")}
                  </button>
                ) : h.joined ? (
                  <div className="hang-joined">
                    <p>
                      <Check size={19} />
                      {t("Du kommer. Vi ses där!")}
                    </p>
                    <button
                      className="text-button"
                      disabled={busy}
                      onClick={() => mutate("rsvp", { coming: false })}
                    >
                      {t("Jag kan inte längre")}
                    </button>
                  </div>
                ) : joining ? (
                  <form
                    className="hang-join-form"
                    onSubmit={(e) => {
                      e.preventDefault();
                      mutate("rsvp", { coming: true, name });
                    }}
                  >
                    <label>
                      {t("Ditt förnamn")}
                      <input
                        autoFocus
                        autoComplete="given-name"
                        required
                        maxLength={32}
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        disabled={busy}
                      />
                    </label>
                    <button className="primary wide" disabled={busy}>
                      {t(busy ? "Sparar…" : "Jag kommer")}
                      <ArrowUpRight size={19} />
                    </button>
                  </form>
                ) : (
                  <button
                    className="primary wide hang-main-action"
                    disabled={busy}
                    onClick={() => setJoining(true)}
                  >
                    {t("Jag kommer")}
                    <ArrowUpRight size={19} />
                  </button>
                )}
                <a
                  className="hang-directions secondary wide"
                  href={placeMapsUrl(h.place)}
                  target="_blank"
                  rel="noreferrer"
                >
                  <MapPin size={18} />
                  {t("Visa vägen")}
                </a>
                {!scheduled && h.sunUntil > clock && (
                  <p className="hang-sun">
                    <Sun size={17} />
                    {t("Ca {0} minuter möjlig sol kvar.", [
                      Math.max(1, Math.ceil((h.sunUntil - clock) / 60000)),
                    ])}
                    <small>
                      {t(
                        "Uppskattning vid inbjudan. Byggnadsskuggor; moln kan skymma solen.",
                      )}
                    </small>
                  </p>
                )}
              </>
            )}
            {error && (
              <p role="alert" className="hang-error">
                {t(error)} {t("Senaste uppgifterna kan vara inaktuella.")}
              </p>
            )}
            {feedback && (
              <p role="status" className="share-feedback">
                {t(feedback)}
              </p>
            )}
            {manual && (
              <textarea
                className="hang-manual"
                aria-label={t("Meddelande att dela")}
                readOnly
                value={manual}
                onFocus={(e) => e.target.select()}
                rows={5}
              />
            )}
            {h.isHost && !ended && (
              <details className="hang-host-controls">
                <summary>
                  {t("Ditt häng")}
                  <Users size={15} />
                </summary>
                <p>{t("Du hanterar hänget i den här webbläsaren.")}</p>
                <button
                  className="secondary wide"
                  disabled={busy || h.endsAt >= h.startsAt + 6 * 3600000}
                  onClick={() =>
                    mutate("extend", {
                      endsAt: Math.min(
                        h.endsAt + 30 * 60000,
                        h.startsAt + 6 * 3600000,
                      ),
                    })
                  }
                >
                  {t("Vi stannar 30 min till")}
                </button>
                <button
                  className="text-button"
                  disabled={busy}
                  onClick={() => mutate("close", {})}
                >
                  {t("Avsluta hänget")}
                </button>
              </details>
            )}
          </section>
          <footer className="hang-footer">
            <p>{t("Mer tillsammans. Mindre planerande.")}</p>
            <small>
              {t(
                "Inget konto behövs. Alla med länken kan se namn, bilder och svar. Uppgifterna tas bort ett dygn efter sluttiden.",
              )}
            </small>
            {canExplore && (
              <Link href="/">
                {t("Till kartan")}
                <ArrowUpRight size={15} />
              </Link>
            )}
          </footer>
        </>
      )}
    </main>
  );
}
export default function HangPage(props) {
  return (
    <LanguageProvider>
      <Hang {...props} />
    </LanguageProvider>
  );
}
