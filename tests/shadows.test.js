import test from "node:test";
import assert from "node:assert/strict";
import {
  parseMeters,
  buildingHeight,
  shadowOffset,
  coverageBounds,
  wallQuads,
} from "../src/shadows.js";
const near = (actual, expected) =>
  assert.ok(Math.abs(actual - expected) < 1e-8);
test("shadow points away from sun, with length height / tan(altitude)", () => {
  const south = shadowOffset(12, { altitude: 45, azimuth: 180 });
  near(south.east, 0);
  near(south.north, 12);
  near(south.length, 12);
  const east = shadowOffset(20, { altitude: 45, azimuth: 90 });
  near(east.east, -20);
  near(east.north, 0);
  const west = shadowOffset(20, { altitude: 30, azimuth: 270 });
  near(west.east, 20 * Math.sqrt(3));
  for (const altitude of [-10, 0, 4.99, NaN])
    assert.equal(shadowOffset(12, { altitude, azimuth: 90 }), null);
  assert.equal(shadowOffset(NaN, { altitude: 40, azimuth: 90 }), null);
});
test("height units, precedence and explicit estimate source", () => {
  assert.equal(parseMeters("18 m"), 18);
  near(parseMeters(`10'6"`), 3.2004);
  for (const v of ["-2", "10;20", "unknown", 0, Infinity, "350"])
    assert.equal(parseMeters(v), null);
  assert.deepEqual(buildingHeight({ height: "18", "building:levels": "8" }), {
    height: 18,
    heightSource: "osm-height",
  });
  assert.deepEqual(
    buildingHeight({ "building:levels": "4", "roof:height": "2" }),
    { height: 14, heightSource: "levels-estimate" },
  );
  assert.deepEqual(buildingHeight({}), {
    height: 12,
    heightSource: "default-12m",
  });
});
test("safe coverage shrinks with long shadows and disappears at low sun", () => {
  const bounds = [12.53, 55.662, 12.632, 55.711];
  const high = coverageBounds(bounds, 151, { altitude: 45, azimuth: 180 });
  const low = coverageBounds(bounds, 151, { altitude: 10, azimuth: 180 });
  assert.ok(low[0] > high[0] && low[2] < high[2]);
  assert.equal(
    coverageBounds(bounds, 151, { altitude: 0, azimuth: 180 }),
    null,
  );
  assert.equal(
    coverageBounds([0, 0, 0.001, 0.001], 151, { altitude: 5, azimuth: 180 }),
    null,
  );
});
test("wall projections include inner courtyard walls without convex hull", () => {
  const outer = [
    [0, 0],
    [10, 0],
    [10, 10],
    [0, 10],
    [0, 0],
  ];
  const hole = [
    [3, 3],
    [3, 7],
    [7, 7],
    [7, 3],
    [3, 3],
  ];
  const quads = wallQuads([outer, hole], 1, 0);
  assert.equal(quads.length, 8);
  assert.deepEqual(quads[4], [
    [3, 3],
    [3, 7],
    [4, 7],
    [4, 3],
  ]);
  assert.deepEqual(hole[0], [3, 3]);
});
