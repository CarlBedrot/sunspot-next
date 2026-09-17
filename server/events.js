import locationData from "../data/event-locations.json" with { type: "json" };
import { curatedEvents } from "../src/curatedEvents.js";

export const EVENT_SOURCE = "https://bibliotek.kk.dk/api/v1/events";
export function safeUrl(value, hosts) {
  try {
    const url = new URL(value);
    return url.protocol === "https:" &&
      !url.username &&
      !url.password &&
      (!hosts || hosts.includes(url.hostname))
      ? url.href
      : null;
  } catch {
    return null;
  }
}
export function plainText(value) {
  const entities = {
    amp: "&",
    lt: "<",
    gt: ">",
    quot: '"',
    apos: "'",
    nbsp: " ",
  };
  return String(value || "")
    .replace(/<(script|style)\b[^>]*>[\s\S]*?<\/\1>/gi, "")
    .replace(/<\/(?:p|div|h[1-6]|li)>|<br\s*\/?\s*>/gi, "\n")
    .replace(/<[^>]*>/g, "")
    .replace(
      /&(#x[0-9a-f]+|#\d+|amp|lt|gt|quot|apos|nbsp);/gi,
      (all, entity) => {
        if (entity[0] !== "#") return entities[entity.toLowerCase()] || all;
        const n =
          entity[1].toLowerCase() === "x"
            ? parseInt(entity.slice(2), 16)
            : Number(entity.slice(1));
        return n > 0 && n <= 0x10ffff ? String.fromCodePoint(n) : "";
      },
    )
    .replace(/[ \t]+/g, " ")
    .replace(/\n\s*\n/g, "\n\n")
    .trim()
    .slice(0, 12000);
}

export function normalizeLibraryEvents(
  rows,
  locations = locationData.locations,
  checkedAt = new Date().toISOString(),
) {
  const events = new Map();
  for (const row of rows) {
    if (!row?.uuid || /cancel|aflyst|occurred/i.test(row.state || "")) continue;
    const start = Date.parse(row.date_time?.start),
      end = Date.parse(row.date_time?.end);
    const sourceUrl = safeUrl(row.url, ["bibliotek.kk.dk"]);
    const point = locations[`${row.address?.street}|${row.address?.zip_code}`];
    // An address is required for a map marker. Unknown locations are never guessed.
    if (
      !sourceUrl ||
      !point ||
      !Number.isFinite(start) ||
      !Number.isFinite(end) ||
      end <= start ||
      row.address?.locationType !== "physical"
    )
      continue;
    const tags = [
      ...new Set(
        [...(row.categories || []), ...(row.tags || [])].map(plainText),
      ),
    ]
      .filter(Boolean)
      .slice(0, 5);
    const prices = (row.ticket_categories || [])
      .map((t) => t.price)
      .filter(
        (p) =>
          p?.currency === "DKK" && typeof p.value === "number" && p.value >= 0,
      );
    const minPrice = prices.length
      ? Math.min(...prices.map((p) => p.value))
      : null;
    const priceLabel =
      minPrice === null
        ? "Se pris hos arrangören"
        : prices.every((p) => p.value === 0)
          ? "Gratis enligt källan"
          : `Från ${minPrice} DKK`;
    const name = plainText(row.title);
    if (!name) continue;
    events.set(row.uuid, {
      id: `kk-${row.uuid}`,
      category: "event",
      demo: false,
      name,
      emoji: /musik|koncert/i.test(tags.join(" "))
        ? "🎵"
        : /film/i.test(tags.join(" "))
          ? "🎬"
          : "✨",
      allDay: row.all_day === true,
      startsAt: new Date(start).toISOString(),
      endsAt: new Date(end).toISOString(),
      lat: point.lat,
      lng: point.lng,
      venue:
        (row.branches || []).map(plainText).join(" · ") ||
        "Københavns Biblioteker",
      address: `${plainText(row.address.street)}, ${row.address.zip_code} ${plainText(row.address.city)}`,
      organizer: "Københavns Biblioteker",
      organizerUrl: "https://bibliotek.kk.dk/arrangementer",
      description: plainText(row.body || row.description),
      tags,
      priceLabel,
      imageUrl: safeUrl(row.image?.url, ["bibliotek.kk.dk"]),
      source: "Københavns Biblioteker",
      sourceUrl,
      registrationUrl: sourceUrl,
      soldOut: /sold.?out|udsolgt/i.test(row.state || ""),
      registrationNotOpen: row.state === "TicketSaleNotOpen",
      checkedAt,
      sourceUpdatedAt: row.updated_at || null,
    });
  }
  return [...events.values()];
}

export function createEventService({ fetcher = fetch, now = Date.now } = {}) {
  let cached,
    pending,
    retryAfter = 0;
  async function refresh() {
    try {
      const response = await fetcher(EVENT_SOURCE, {
        signal: AbortSignal.timeout(15000),
        headers: { Accept: "application/json" },
        cache: "no-store",
      });
      if (!response.ok) throw new Error(`Event source: ${response.status}`);
      const rows = await response.json();
      if (!Array.isArray(rows)) throw new Error("Invalid event feed");
      const checkedAt = new Date(now()).toISOString();
      cached = {
        events: normalizeLibraryEvents(rows, undefined, checkedAt),
        time: now(),
        checkedAt,
      };
      retryAfter = 0;
    } catch {
      retryAfter = now() + 60_000;
    }
  }
  return async function getEvents(from, to) {
    if (
      (!cached || now() - cached.time >= 15 * 60_000) &&
      now() >= retryAfter
    ) {
      pending ??= refresh().finally(() => {
        pending = null;
      });
      await pending;
    }
    const available = Boolean(cached && now() - cached.time <= 6 * 3600_000);
    const stale = available && now() - cached.time >= 15 * 60_000;
    const events = [...(available ? cached.events : []), ...curatedEvents]
      .filter((e) => Date.parse(e.startsAt) < to && Date.parse(e.endsAt) > from)
      .sort((a, b) => Date.parse(a.startsAt) - Date.parse(b.startsAt));
    return {
      events,
      available,
      stale,
      checkedAt: cached?.checkedAt || null,
      source: "Københavns Biblioteker",
      sourceUrl: EVENT_SOURCE,
      message: !available
        ? "Eventkällan kunde inte hämtas. Endast event som lagts in manuellt kan visas."
        : stale
          ? "Eventkällan svarar inte. Senast hämtade uppgifter visas; kontrollera arrangörens sida."
          : null,
    };
  };
}
