import test from "node:test";
import assert from "node:assert/strict";
import { createApi } from "../server/api.js";
import { atHour, weatherAt } from "../src/lib.js";
import { places } from "../src/places.js";

test("invitation persists, guest updates only their answer, and only host can cancel", async () => {
  const { handle, db } = createApi();
  const url = "http://localhost:3000";
  async function request(path, method = "GET", body, headers = {}) {
    const response = await handle(
      new Request(`${url}/api${path}`, {
        method,
        headers: { "Content-Type": "application/json", ...headers },
        body: body === undefined ? undefined : JSON.stringify(body),
      }),
    );
    return { status: response.status, data: await response.json() };
  }
  try {
    const input = {
      placeId: places[0].id,
      activity: "walk",
      startsAt: new Date(Date.now() + 86400_000).toISOString(),
      duration: 90,
      host: "Carl",
      message: "Vi ses i parken!",
    };
    assert.equal(
      (
        await request("/gatherings", "POST", {
          ...input,
          startsAt: new Date(0).toISOString(),
        })
      ).status,
      400,
    );
    assert.equal(
      (await request("/gatherings", "POST", { ...input, activity: "bar" }))
        .status,
      400,
    );
    assert.equal(
      (
        await request("/gatherings", "POST", input, {
          Origin: "https://elsewhere.example",
        })
      ).status,
      403,
    );
    const created = await request("/gatherings", "POST", input);
    assert.equal(created.status, 201);
    const { id, hostToken } = created.data;
    const path = `/gatherings/${id}`;
    const publicView = (await request(path)).data;
    assert.equal(publicView.host, "Carl");
    assert.equal(publicView.isHost, false);
    assert.equal(publicView.answers, undefined);
    assert.equal(publicView.host_hash, undefined);
    const yes = await request(`${path}/rsvp`, "POST", {
      name: "Anna",
      answer: "yes",
    });
    assert.equal(yes.status, 201);
    const edit = await request(`${path}/rsvp`, "POST", {
      name: "Anna",
      answer: "maybe",
      editToken: yes.data.editToken,
    });
    assert.equal(edit.status, 200);
    assert.deepEqual((await request(path)).data.counts, {
      yes: 0,
      maybe: 1,
      no: 0,
    });
    assert.equal(
      (
        await request(`${path}/rsvp`, "POST", {
          name: "Imposter",
          answer: "no",
          editToken: "bad",
        })
      ).status,
      403,
    );
    assert.equal(
      (await request(path, "PATCH", { cancelled: true })).status,
      403,
    );
    const hostView = (
      await request(path, "GET", undefined, { "x-host-token": hostToken })
    ).data;
    assert.deepEqual(hostView.answers, [{ name: "Anna", answer: "maybe" }]);
    assert.equal(
      (
        await request(
          path,
          "PATCH",
          { cancelled: true },
          { "x-host-token": hostToken },
        )
      ).status,
      200,
    );
    assert.equal(
      (await request(`${path}/rsvp`, "POST", { name: "Nils", answer: "yes" }))
        .status,
      409,
    );
    assert.equal((await request("/gatherings/not-found")).status, 404);
  } finally {
    db.close();
  }
});

test("weather preserves forecast intervals and never extends beyond coverage", () => {
  const weather = {
    available: true,
    timeseries: [
      {
        time: "2026-09-17T12:00:00Z",
        data: {
          instant: { details: { air_temperature: 17, wind_speed: 3 } },
          next_6_hours: {
            summary: { symbol_code: "cloudy" },
            details: { precipitation_amount: 2 },
          },
        },
      },
    ],
  };
  assert.equal(weatherAt(weather, "2026-09-17T11:59:00Z"), null);
  assert.equal(weatherAt(weather, "2026-09-17T17:59:00Z").hours, 6);
  assert.equal(weatherAt(weather, "2026-09-17T18:00:00Z"), null);
  assert.equal(weatherAt({ available: false }, new Date()), null);
});

test("Copenhagen timezone handles summer and winter", () => {
  assert.equal(
    atHour("2026-09-17", 16.5).toISOString(),
    "2026-09-17T14:30:00.000Z",
  );
  assert.equal(
    atHour("2026-12-17", 16).toISOString(),
    "2026-12-17T15:00:00.000Z",
  );
});
