import test from "node:test";
import assert from "node:assert/strict";
import { createDemoEvents, eventsAt } from "../src/events.js";
import { atHour } from "../src/lib.js";

const events = createDemoEvents(["2026-09-21", "2026-09-22", "2026-09-23"]);
test("events enter at their start, leave at their end and do not leak to another day", () => {
  const picnic = events.find((e) => e.id.startsWith("demo-picnic"));
  const visible = (date, hour) =>
    eventsAt([picnic], atHour(date, hour).toISOString()).length;
  assert.equal(visible("2026-09-21", 14 + 55 / 60), 0);
  assert.equal(visible("2026-09-21", 15), 1);
  assert.equal(visible("2026-09-21", 16 + 55 / 60), 1);
  assert.equal(visible("2026-09-21", 17), 0);
  assert.equal(visible("2026-09-22", 16), 0);
  assert.ok(events.every((e) => e.demo && e.name.includes("demo")));
});
test("event intervals support midnight, Copenhagen DST and invalid input", () => {
  const overnight = {
    startsAt: "2026-09-21T21:00:00Z",
    endsAt: "2026-09-22T00:00:00Z",
  };
  assert.equal(
    eventsAt([overnight], atHour("2026-09-22", 1).toISOString()).length,
    1,
  );
  assert.equal(
    eventsAt([overnight], atHour("2026-09-22", 2).toISOString()).length,
    0,
  );
  const dst = {
    startsAt: "2026-10-25T00:30:00Z",
    endsAt: "2026-10-25T01:30:00Z",
  };
  assert.equal(eventsAt([dst], "2026-10-25T01:00:00Z").length, 1);
  assert.equal(eventsAt([dst], "2026-10-25T01:30:00Z").length, 0);
  assert.deepEqual(
    eventsAt(
      [
        { startsAt: "invalid", endsAt: "invalid" },
        { startsAt: overnight.endsAt, endsAt: overnight.startsAt },
      ],
      overnight.startsAt,
    ),
    [],
  );
  assert.deepEqual(eventsAt(events, "invalid"), []);
});
