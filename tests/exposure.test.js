import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import {
  createExposureModel,
  project,
  unproject,
  rayHitsPolygon,
  sampleState,
  analyzePlaces,
  recommendNext,
} from "../src/exposure.js";
import { parseWeeklyHours, openingAt } from "../src/openingHours.js";
import { atHour } from "../src/lib.js";
import { places } from "../src/places.js";
import { venueAreas } from "../src/venueAreas.js";
const center = project([12.581, 55.6865]);
const ll = (x, y) => unproject([center[0] + x, center[1] + y]);
const square = (x, y, s) => [
  [x, y],
  [x + s, y],
  [x + s, y + s],
  [x, y + s],
  [x, y],
];
test("ray casting preserves courtyards and casts away from sun", () => {
  const courtyard = [square(0, 0, 20), square(5, 5, 10)];
  assert.equal(rayHitsPolygon([8, 8], [12, 8], courtyard), false);
  assert.equal(rayHitsPolygon([8, 8], [22, 8], courtyard), true);
  const model = createExposureModel({
    bounds: [12.53, 55.662, 12.632, 55.711],
    maxHeight: 10,
    buildings: [
      { height: 10, polygons: [[square(0, 0, 10).map((p) => ll(...p))]] },
    ],
  });
  const frame = {
    position: { altitude: 45, azimuth: 180 },
    coverage: [12.53, 55.662, 12.632, 55.711],
  };
  assert.equal(model.state(ll(5, 15), frame), "shade");
  assert.equal(model.state(ll(5, 25), frame), "sun");
  assert.equal(model.state(ll(5, -5), frame), "sun");
  assert.equal(model.state([12.4, 55.68], frame), "unknown");
  assert.equal(
    model.state(ll(5, 25), {
      position: { altitude: 2, azimuth: 180 },
      coverage: null,
    }),
    "unknown",
  );
});
test("partially shaded parks stay sunny; incomplete coverage stays unknown", () => {
  const model = { state: (p) => p };
  assert.deepEqual(sampleState(model, ["sun", "shade", "shade"], {}), {
    state: "sun",
    fraction: 1 / 3,
  });
  assert.equal(sampleState(model, ["shade", "shade"], {}).state, "shade");
  assert.equal(sampleState(model, ["sun", "unknown"], {}).state, "unknown");
});
test("weekly hours use Copenhagen time and handle midnight without guessing complex syntax", () => {
  assert.equal(
    openingAt("Fr 16:00-02:00", atHour("2026-09-19", 1)).state,
    "open",
  );
  assert.equal(
    openingAt("Fr 16:00-02:00", atHour("2026-09-19", 2)).state,
    "closed",
  );
  assert.equal(
    openingAt("Mo-Su 16:00-22:00", atHour("2026-12-17", 16)).state,
    "open",
  );
  assert.equal(
    openingAt("Mo-Su 16:00-22:00", atHour("2026-09-17", 15)).state,
    "closed",
  );
  assert.equal(
    openingAt("Mo-Su 16:00-22:00", atHour("2026-09-17", 21.75), 30).remaining,
    15,
  );
  assert.equal(
    openingAt("24/7", atHour("2026-09-17", 23), 120).remaining,
    Infinity,
  );
  assert.ok(parseWeeklyHours("Fr, Sa 12:00-24:00"));
  assert.ok(
    parseWeeklyHours("Mo-We 08:00-01:00,Th-Sa 08:00-01:00,Su 11:00-23:00"),
  );
  for (const value of [
    null,
    "Jun-Aug",
    "Mo-Sa 17:30+",
    "PH off",
    '17:30-24:00 "last order 21:30"',
    "Mo 09:99-24:00",
  ])
    assert.equal(parseWeeklyHours(value), null);
  assert.equal(
    atHour("2026-09-17", 16 + 25 / 60).toISOString(),
    "2026-09-17T14:25:00.000Z",
  );
});
test("recommendations require sun after arrival and throughout the visit, skip closed and distant places", () => {
  const venues = [
    { id: "here", category: "bar" },
    { id: "good", category: "bar", openingHours: "24/7" },
    { id: "late-shade", category: "bar", openingHours: "24/7" },
    { id: "closed", category: "bar", openingHours: "Mo-Su 23:00-24:00" },
    { id: "far", category: "bar", openingHours: "24/7" },
    { id: "unknown", category: "bar" },
  ];
  const timeline = Array.from({ length: 181 }, (_, minute) => ({
    minute,
    state: "sun",
  }));
  const results = Object.fromEntries(
    venues.map((p) => [
      p.id,
      {
        point: ll(p.id === "far" ? 3000 : p.id === "here" ? 0 : 300, 0),
        eligible: true,
        timeline,
        pointSource: "chosen",
      },
    ]),
  );
  results["late-shade"].timeline = timeline.map((t) => ({
    ...t,
    state: t.minute === 20 ? "shade" : "sun",
  }));
  assert.deepEqual(
    recommendNext(venues, results, "here", atHour("2026-09-17", 16), 30).map(
      (r) => r.place.id,
    ),
    ["good", "unknown"],
  );
});
test("real Copenhagen extract replaces demo: bar disappears into shade and park retains partial sun", () => {
  const data = JSON.parse(
    fs.readFileSync(
      new URL("../public/data/copenhagen-buildings.json", import.meta.url),
    ),
  );
  const model = createExposureModel(data),
    subset = places.filter((p) => ["kayak-bar", "kongens-have"].includes(p.id));
  const before = analyzePlaces(
    model,
    subset,
    venueAreas,
    atHour("2026-09-17", 16),
    {},
    60,
  );
  const after = analyzePlaces(
    model,
    subset,
    venueAreas,
    atHour("2026-09-17", 17),
    {},
    60,
  );
  assert.equal(before["kayak-bar"].state, "sun");
  assert.equal(after["kayak-bar"].state, "shade");
  assert.ok(before["kayak-bar"].until > 0 && before["kayak-bar"].until < 60);
  assert.equal(after["kongens-have"].state, "sun");
  assert.ok(
    after["kongens-have"].fraction > 0 && after["kongens-have"].fraction < 1,
  );
  const invalid = analyzePlaces(
    model,
    subset,
    venueAreas,
    atHour("2026-09-17", 16),
    { "kayak-bar": [12.4, 55.68] },
    60,
  );
  assert.equal(invalid["kayak-bar"].state, "unknown");
});
