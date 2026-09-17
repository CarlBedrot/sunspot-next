import { writeFile, mkdir } from "node:fs/promises";

const endpoint = "https://bibliotek.kk.dk/api/v1/events";
const response = await fetch(endpoint, { signal: AbortSignal.timeout(20000) });
if (!response.ok) throw new Error(`Events: ${response.status}`);
const events = await response.json();
const addresses = new Map(
  events
    .filter((e) => e.address?.locationType === "physical")
    .map((e) => [`${e.address.street}|${e.address.zip_code}`, e.address]),
);
const locations = {};
for (const [key, address] of addresses) {
  const match = /^(.+?)\s+(\d+[a-zA-Z]?)/.exec(address.street);
  if (!match) continue;
  const query = new URLSearchParams({
    vejnavn: match[1],
    husnr: match[2],
    postnr: String(address.zip_code),
    struktur: "mini",
  });
  const url = `https://api.dataforsyningen.dk/adresser?${query}`;
  const r = await fetch(url, { signal: AbortSignal.timeout(10000) });
  if (!r.ok) throw new Error(`Address lookup: ${r.status}`);
  const rows = await r.json();
  const coordinates = new Set(
    rows
      .filter(
        (r) => r.status === 1 && Number.isFinite(r.x) && Number.isFinite(r.y),
      )
      .map((r) => `${r.x},${r.y}`),
  );
  // Different apartments may share a doorway; never guess between locations.
  if (coordinates.size !== 1) {
    console.log(`Skipped ambiguous address: ${key}`);
    continue;
  }
  const [lng, lat] = [...coordinates][0].split(",").map(Number);
  if (lat < 55.6 || lat > 55.77 || lng < 12.4 || lng > 12.7) continue;
  locations[key] = { lat, lng, sourceUrl: url };
}
await mkdir("data", { recursive: true });
await writeFile(
  "data/event-locations.json",
  JSON.stringify(
    {
      source: "Danish address register via Dataforsyningen",
      checkedAt: new Date().toISOString(),
      locations,
    },
    null,
    2,
  ) + "\n",
);
console.log(`Saved ${Object.keys(locations).length} verified address points.`);
