import { useState } from "react";
import { Share2, Copy, MapPin } from "lucide-react";
import { useLanguage } from "./Language.jsx";
import { placeShareData, placeMapsUrl } from "./placeShare.js";

export default function PlaceShare({ place, result, instant, live, pending }) {
  const { locale, t } = useLanguage();
  const [status, setStatus] = useState("");
  const [manual, setManual] = useState("");
  const [busy, setBusy] = useState(false);
  async function copy(data) {
    const text = `${data.text}\n${data.url}`;
    try {
      await navigator.clipboard.writeText(text);
      setManual("");
      setStatus("Kopierat! Klistra in i chatten.");
    } catch {
      setManual(text);
      setStatus("Markera och kopiera meddelandet nedan.");
    }
  }
  async function share() {
    const data = placeShareData({
      place,
      result,
      instant,
      live,
      pending,
      locale,
      t,
    });
    setStatus("");
    setManual("");
    setBusy(true);
    try {
      if (navigator.share) {
        // Invoke immediately from the tap, preserving iOS user activation.
        await navigator.share(data);
      } else await copy(data);
    } catch (error) {
      // Cancel means cancel: do not silently copy or claim a message was sent.
      if (error.name !== "AbortError") {
        setManual(`${data.text}\n${data.url}`);
        setStatus(
          "Delningsmenyn kunde inte öppnas. Kopiera meddelandet i stället.",
        );
      }
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="place-share">
      <button
        className="primary wide share-place-action"
        onClick={share}
        disabled={busy}
      >
        {live ? t("Jag sitter här – kom!") : t("Ses här – dela platsen")}
        <Share2 size={19} />
      </button>
      <div className="place-share-meta">
        <span>{t("Dela plats + soltid")}</span>
        <a href={placeMapsUrl(place)} target="_blank" rel="noreferrer">
          <MapPin size={13} />
          {t("Öppna i Maps")}
        </a>
      </div>
      {status && (
        <p role="status" className="share-feedback">
          {t(status)}
        </p>
      )}
      {manual && (
        <div className="share-manual">
          <textarea
            aria-label={t("Meddelande att dela")}
            readOnly
            value={manual}
            onFocus={(e) => e.target.select()}
            rows={5}
          />
          <button
            className="text-button"
            onClick={() =>
              copy(
                placeShareData({
                  place,
                  result,
                  instant,
                  live,
                  pending,
                  locale,
                  t,
                }),
              )
            }
          >
            <Copy size={14} /> {t("Kopiera meddelandet")}
          </button>
        </div>
      )}
    </div>
  );
}
