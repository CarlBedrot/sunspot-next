import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { places } from "../src/places.js";
import { venueAreas } from "../src/venueAreas.js";
import {
  createExposureModel,
  inPolygon,
  sampleState,
} from "../src/exposure.js";
import { normalizeSearch, atHour } from "../src/lib.js";
import { cityAreas } from "../scripts/park-data.mjs";

const buildings = JSON.parse(
  fs.readFileSync(
    new URL("../public/data/copenhagen-buildings.json", import.meta.url),
  ),
);
test("city import includes missing parks once, preserves multipart areas and keeps old IDs", () => {
  const raw = JSON.parse(
    fs.readFileSync(
      new URL("../data/osm-city-parks-source.json", import.meta.url),
    ),
  );
  const imported = cityAreas(raw);
  for (const name of [
    "Fælledparken",
    "Nørrebroparken",
    "Østre Anlæg",
    "Frederiksberg Have",
    "Superkilen",
  ]) {
    const matches = places.filter((p) => p.name === name && p.greenSpace);
    assert.equal(matches.length, 1, name);
    const p = matches[0];
    const source = imported.parks.find((s) => s.osm === p.osm);
    assert.deepEqual(venueAreas.parks[p.id], source.polygons);
    assert.ok(source.polygons.some((poly) => inPolygon([p.lng, p.lat], poly)));
  }
  const superkilen = places.find((p) => p.name === "Superkilen");
  assert.equal(venueAreas.parks[superkilen.id].length, 2);
  assert.equal(
    places.find((p) => p.name === "Kongens Have").id,
    "kongens-have",
  );
  assert.equal(places.find((p) => p.id === "ofelia").greenSpace, false);
  assert.equal(new Set(places.map((p) => p.osm)).size, places.length);
  assert.ok(imported.skipped.every((p) => !places.some((v) => v.osm === p.id)));
});

test("park samples respect separate components, holes and lakes; missing shadow coverage stays unknown", () => {
  const model = createExposureModel(buildings);
  for (const name of ["Fælledparken", "Superkilen", "Frederiksberg Have"]) {
    const park = places.find((p) => p.name === name),
      polygons = venueAreas.parks[park.id];
    const samples = model.parkSamples(polygons, venueAreas.water);
    assert.ok(samples.length > 0, name);
    for (const point of samples) {
      assert.ok(
        polygons.some((polygon) => inPolygon(point, polygon)),
        name,
      );
      assert.ok(
        !venueAreas.water.some((polygon) => inPolygon(point, polygon)),
        name,
      );
      assert.ok(!model.indoor(point), name);
    }
    if (name === "Superkilen")
      for (const polygon of polygons)
        assert.ok(samples.some((point) => inPolygon(point, polygon)));
    const state = sampleState(
      model,
      samples,
      model.frame(atHour("2026-09-17", 16)),
    );
    assert.equal(
      state.state,
      name === "Frederiksberg Have" ? "unknown" : "sun",
      name,
    );
    if (name === "Fælledparken")
      assert.ok(state.fraction > 0 && state.fraction < 1);
  }
});

test("park search accepts Danish, Swedish and keyboard-friendly spellings", () => {
  for (const input of [
    "Fælledparken",
    "faelledparken",
    "faelledsparken",
    "Fälledparken",
  ])
    assert.equal(normalizeSearch(input), normalizeSearch("Fælledparken"));
  assert.equal(normalizeSearch("Nörrebro"), normalizeSearch("Nørrebro"));
  assert.equal(
    normalizeSearch("Ørstedsparken"),
    normalizeSearch("orstedsparken"),
  );
});

test("parks without usable grid samples are unknown by day but never sunny at night", () => {
  assert.deepEqual(sampleState({}, [], { position: { altitude: 20 } }), {
    state: "unknown",
    fraction: null,
  });
  assert.deepEqual(sampleState({}, [], { position: { altitude: -10 } }), {
    state: "shade",
    fraction: 0,
  });
});
