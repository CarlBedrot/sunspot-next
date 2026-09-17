import test from "node:test";
import assert from "node:assert/strict";
import {
  normalizeLibraryEvents,
  plainText,
  createEventService,
} from "../server/events.js";
import { eventsAt } from "../src/events.js";

const row = (overrides = {}) => ({
  uuid: "public-workshop",
  title: "Workshop &amp; samtal",
  state: "Active",
  url: "https://bibliotek.kk.dk/workshop",
  image: { url: "https://bibliotek.kk.dk/cover.jpg" },
  date_time: {
    start: "2026-10-01T14:00:00+02:00",
    end: "2026-10-01T16:00:00+02:00",
  },
  address: {
    street: "Krystalgade 15",
    zip_code: 1172,
    city: "København",
    locationType: "physical",
  },
  branches: ["Hovedbiblioteket"],
  categories: ["Workshop"],
  body: "<p>Ett samtal.</p><script>alert('x')</script><p>Välkommen &amp; tack.</p>",
  ticket_categories: [{ price: { value: 0, currency: "DKK" } }],
  ...overrides,
});

test("public event normalization preserves explicit times, safe links, details and verified address points", () => {
  const [event] = normalizeLibraryEvents([row()]);
  assert.equal(event.name, "Workshop & samtal");
  assert.equal(event.startsAt, "2026-10-01T12:00:00.000Z");
  assert.equal(event.priceLabel, "Gratis enligt källan");
  assert.equal(event.lat, 55.68087607);
  assert.equal(event.demo, false);
  assert.equal(event.registrationUrl, row().url);
  assert.ok(!event.description.includes("alert"));
  assert.equal(eventsAt([event], event.endsAt).length, 0);
  assert.equal(eventsAt([event], "2026-10-02T12:00:00Z").length, 0);
  assert.equal(plainText("<p>&#x1f33f; &#38;</p>"), "🌿 &");
});
test("cancelled, online, invalid, unlocated and unsafe listings never become map markers", () => {
  for (const patch of [
    { state: "Cancelled" },
    { state: "Occurred" },
    { address: { ...row().address, locationType: "online" } },
    { address: { ...row().address, street: "Unknown 1" } },
    { date_time: { start: "invalid", end: "invalid" } },
    { date_time: { start: row().date_time.end, end: row().date_time.start } },
    { url: "javascript:alert(1)" },
    { url: "https://unrelated.example/event" },
  ])
    assert.equal(normalizeLibraryEvents([row(patch)]).length, 0);
  assert.equal(normalizeLibraryEvents([row(), row()]).length, 1);
  const [withoutImage] = normalizeLibraryEvents([
    row({
      image: { url: "https://unrelated.example/image" },
      ticket_categories: [],
    }),
  ]);
  assert.equal(withoutImage.imageUrl, null);
  assert.equal(withoutImage.priceLabel, "Se pris hos arrangören");
});
test("event feed deduplicates fetches, backs off on failure and expires stale data", async () => {
  let now = Date.parse("2026-10-01T08:00:00Z"),
    calls = 0,
    fails = false;
  const get = createEventService({
    now: () => now,
    fetcher: async () => {
      calls++;
      if (fails) throw new Error("offline");
      return Response.json([row()]);
    },
  });
  const from = Date.parse("2026-10-01"),
    to = Date.parse("2026-10-08");
  const [a, b] = await Promise.all([get(from, to), get(from, to)]);
  assert.equal(calls, 1);
  assert.equal(a.events.length, 1);
  assert.deepEqual(a, b);
  now += 16 * 60_000;
  fails = true;
  const stale = await get(from, to);
  assert.equal(stale.stale, true);
  assert.equal(stale.checkedAt, a.checkedAt);
  await get(from, to);
  assert.equal(calls, 2);
  now += 7 * 3600_000;
  const expired = await get(from, to);
  assert.equal(expired.available, false);
  assert.deepEqual(expired.events, []);
});
test("a successful empty feed removes previous events, without inventing a fallback", async () => {
  let now = Date.parse("2026-10-01"),
    rows = [row()];
  const get = createEventService({
    now: () => now,
    fetcher: async () => Response.json(rows),
  });
  const from = now,
    to = now + 7 * 86400_000;
  assert.equal((await get(from, to)).events.length, 1);
  rows = [];
  now += 16 * 60_000;
  const empty = await get(from, to);
  assert.equal(empty.available, true);
  assert.deepEqual(empty.events, []);
});
