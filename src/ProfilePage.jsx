"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Camera, Check, ChevronRight, Sun } from "lucide-react";
import { LanguageProvider, LanguageSelect, useLanguage } from "./Language.jsx";
import { hangActivities, readHangLocal, hangDate, hangTime } from "./hangs.js";
import { readProfile, saveProfile, prepareProfilePhoto } from "./profile.js";
import Avatar from "./Avatar.jsx";
function Profile({ returnTo, canExplore }) {
  const { t, locale } = useLanguage();
  const [profile, setProfile] = useState(readProfile);
  const [error, setError] = useState(""),
    [saved, setSaved] = useState(false),
    [loading, setLoading] = useState(false);
  const [mine] = useState(() => readHangLocal("mine", []));
  const fileInput = useRef(null),
    generation = useRef(0);
  useEffect(
    () => () => {
      generation.current++;
    },
    [],
  );
  const back = returnTo !== "/" || canExplore ? returnTo : "/";
  function change(value) {
    setProfile((p) => ({ ...p, ...value }));
    setSaved(false);
    setError("");
  }
  async function upload(e) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    const version = ++generation.current;
    setLoading(true);
    setError("");
    setSaved(false);
    try {
      const photo = await prepareProfilePhoto(file);
      if (version === generation.current) change({ photo });
    } catch (err) {
      if (version === generation.current) setError(err.message);
    } finally {
      if (version === generation.current) setLoading(false);
    }
  }
  function submit(e) {
    e.preventDefault();
    try {
      setProfile(saveProfile(profile));
      setSaved(true);
      setError("");
    } catch (err) {
      setError(err.message);
    }
  }
  return (
    <main className="profile-page hang-page">
      <header className="profile-header">
        <Link href={back} className="icon-button" aria-label={t("Tillbaka")}>
          <ArrowLeft size={22} />
        </Link>
        <span className="hang-brand">
          <Sun size={22} />
          SunSpot
        </span>
        <span className="profile-header-spacer" />
      </header>
      <section className="profile-card">
        <p className="hang-eyebrow">{t("Lite mer du.")}</p>
        <h1>
          {t("Min profil")}
          <span>.</span>
        </h1>
        <form onSubmit={submit}>
          <div className="profile-photo-editor">
            <button
              type="button"
              className="profile-photo-button"
              aria-label={t("Välj profilbild")}
              onClick={() => fileInput.current.click()}
              disabled={loading}
            >
              <Avatar name={profile.name} photo={profile.photo} />
              <span className="profile-camera">
                <Camera size={18} />
              </span>
            </button>
            <input
              ref={fileInput}
              className="sr-only"
              type="file"
              accept="image/jpeg,image/png,image/webp"
              aria-label={t("Ladda upp profilbild")}
              onChange={upload}
              tabIndex={-1}
            />
            <div>
              <button
                type="button"
                className="text-button"
                onClick={() => fileInput.current.click()}
                disabled={loading}
              >
                {t(
                  loading
                    ? "Förbereder bild…"
                    : profile.photo
                      ? "Byt bild"
                      : "Lägg till en bild",
                )}
              </button>
              <p>{t("JPG, PNG eller WebP · max 10 MB")}</p>
              {profile.photo && (
                <button
                  type="button"
                  className="text-button profile-remove"
                  disabled={loading}
                  onClick={() => change({ photo: null })}
                >
                  {t("Ta bort bild")}
                </button>
              )}
            </div>
          </div>
          <label>
            {t("Ditt förnamn")}
            <input
              autoComplete="given-name"
              maxLength={32}
              required
              value={profile.name}
              onChange={(e) => change({ name: e.target.value })}
            />
          </label>
          <fieldset>
            <legend>{t("Helst ses jag över…")}</legend>
            <div className="hang-activities">
              {hangActivities.map((a) => (
                <button
                  key={a.id}
                  type="button"
                  aria-pressed={profile.activity === a.id}
                  onClick={() =>
                    change({ activity: profile.activity === a.id ? "" : a.id })
                  }
                >
                  <span aria-hidden="true">{a.emoji}</span>
                  {t(a.label)}
                </button>
              ))}
            </div>
            <p className="profile-hint">
              {t("Förvalt nästa gång du bjuder in. Du kan alltid ändra.")}
            </p>
          </fieldset>
          <p className="profile-privacy">
            {t(
              "Din profil sparas i den här webbläsaren. Namn och bild visas för alla med länken när du skapar ett häng eller svarar. Ändringar gäller nästa inbjudan eller svar.",
            )}
          </p>
          {error && (
            <p role="alert" className="hang-error">
              {t(error)}
            </p>
          )}
          <button className="primary wide" disabled={loading}>
            {saved ? <Check size={18} /> : null}
            {t(saved ? "Profil sparad" : "Spara profil")}
          </button>
          {saved && (
            <p role="status" className="profile-saved">
              {t("Klart! Din profil är redo för nästa häng.")}{" "}
              <Link href={back}>{t("Tillbaka")} →</Link>
            </p>
          )}
        </form>
      </section>
      <section className="profile-settings">
        <LanguageSelect />
        <p className="profile-hint">{t("Språkvalet sparas direkt.")}</p>
      </section>
      {canExplore && (
        <section className="profile-meetups">
          <h2>{t("Mina häng")}</h2>
          {mine.length ? (
            mine.map((h) => (
              <Link href={`/hang/${h.id}`} key={h.id}>
                <div>
                  <strong>{h.name}</strong>
                  <small>
                    {hangDate(h.endsAt, locale)} · {hangTime(h.endsAt, locale)}
                  </small>
                </div>
                <ChevronRight size={18} />
              </Link>
            ))
          ) : (
            <p>{t("Ditt nästa häng börjar med en plats på kartan.")}</p>
          )}
          <Link href="/" className="text-button">
            {t("Till kartan")} →
          </Link>
        </section>
      )}
      <p className="profile-local-note">
        {t(
          "Ingen inloggning behövs. Profilen följer inte automatiskt med till andra webbläsare eller enheter.",
        )}
      </p>
    </main>
  );
}
export default function ProfilePage(props) {
  return (
    <LanguageProvider>
      <Profile {...props} />
    </LanguageProvider>
  );
}
