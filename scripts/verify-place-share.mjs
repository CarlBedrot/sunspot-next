import { chromium, expect } from "@playwright/test";
import assert from "node:assert/strict";
import { mkdir } from "node:fs/promises";
const browser = await chromium.launch({
  executablePath: process.env.SUNSPOT_BROWSER_PATH || undefined,
});
const context = await browser.newContext({
  viewport: { width: 390, height: 844 },
  locale: "sv-SE",
  storageState: process.env.SUNSPOT_STORAGE_STATE || undefined,
});
const page = await context.newPage();
const errors = [];
page.on("pageerror", (e) => errors.push(e.message));
try {
  await page.clock.setSystemTime(new Date("2026-09-20T14:00:00Z"));
  await page.addInitScript(() => {
    localStorage.setItem("sunspot:language", "sv");
    window.shared = [];
    window.copied = [];
    Object.defineProperty(navigator, "share", {
      configurable: true,
      value: async (data) => {
        window.shared.push({
          ...data,
          activation: navigator.userActivation.isActive,
        });
        if (window.shareFailure)
          throw new DOMException("Test failure", window.shareFailure);
      },
    });
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: {
        writeText: async (text) => {
          if (window.copyDenied)
            throw new DOMException("Test denial", "NotAllowedError");
          window.copied.push(text);
        },
      },
    });
  });
  await page.route("**/api/events?**", (r) =>
    r.fulfill({ json: { events: [], available: true, stale: false } }),
  );
  await page.goto(process.env.SUNSPOT_URL || "http://localhost:4175", {
    waitUntil: "domcontentloaded",
  });
  const ready = () =>
    page.locator('.map-workspace[data-solar-pending="false"]').waitFor();
  await ready();
  await page.getByRole("button", { name: "Alla", exact: true }).click();
  await page.getByLabel("Sök plats eller område").fill("Kayak");
  await page
    .getByRole("button", { name: "Visa Kayak Bar", exact: true })
    .click();
  const card = page.locator(".detail-card");
  await expect(card.locator("details")).not.toHaveAttribute("open", "");
  await expect(card.locator(".place-confidence")).toBeHidden();
  const cta = page.getByRole("button", {
    name: "Jag sitter här – kom!",
    exact: true,
  });
  await expect(cta).toBeVisible();
  await mkdir("artifacts", { recursive: true });
  await page.screenshot({ path: "artifacts/compact-place-share-mobile.png" });
  const bounds = await card.boundingBox();
  assert.ok(bounds.height < 310, `collapsed card height ${bounds.height}`);
  await cta.click();
  let shares = await page.evaluate(() => window.shared);
  assert.equal(shares.length, 1);
  assert.equal(shares[0].activation, true);
  assert.match(shares[0].text, /Kayak Bar/);
  assert.match(shares[0].text, /20 september 16:00/);
  assert.equal(new URL(shares[0].url).hostname, "www.google.com");
  assert.doesNotMatch(JSON.stringify(shares[0]), /_vercel_share/);
  await page.evaluate(() => (window.shareFailure = "AbortError"));
  await cta.click();
  assert.deepEqual(await page.evaluate(() => window.copied), []);
  await expect(card.locator("textarea")).toHaveCount(0);
  await page.evaluate(() => (window.shareFailure = "NotAllowedError"));
  await cta.click();
  await expect(page.getByLabel("Meddelande att dela")).toBeVisible();
  await page
    .getByRole("button", { name: "Kopiera meddelandet", exact: true })
    .click();
  assert.equal((await page.evaluate(() => window.copied)).length, 1);
  await page.getByText("Mer info", { exact: true }).click();
  await expect(card.locator(".place-confidence")).toBeVisible();
  await page.getByText("Mer info", { exact: true }).click();
  await page.getByRole("slider").fill("1020");
  await ready();
  const planned = page.getByRole("button", {
    name: "Ses här – dela platsen",
    exact: true,
  });
  await expect(planned).toBeVisible();
  await page.evaluate(() =>
    Object.defineProperty(navigator, "share", {
      configurable: true,
      value: undefined,
    }),
  );
  await planned.click();
  let copied = await page.evaluate(() => window.copied.at(-1));
  assert.match(copied, /Ska vi ses/);
  assert.match(copied, /17:00/);
  assert.doesNotMatch(copied, /Jag sitter/);
  await page.evaluate(() => (window.copyDenied = true));
  await planned.click();
  await expect(page.getByLabel("Meddelande att dela")).toBeVisible();
  await page.getByRole("button", { name: "Stäng plats", exact: true }).click();
  await page
    .getByRole("button", { name: "Visa Kayak Bar", exact: true })
    .click();
  await expect(card.locator("textarea")).toHaveCount(0);
  await page.setViewportSize({ width: 390, height: 667 });
  await expect(planned).toBeInViewport();
  assert.ok(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  );
  const b = await card.boundingBox(),
    dock = await page.locator(".time-dock").boundingBox();
  assert.ok(b.y + b.height <= dock.y);
  for (const [locale, label] of [
    ["da", "Mød mig her – del stedet"],
    ["en", "Meet here – share the spot"],
  ]) {
    await page.evaluate(
      (value) => localStorage.setItem("sunspot:language", value),
      locale,
    );
    // Select through the UI so the card and timeline stay mounted.
    await page
      .getByRole("button", {
        name: locale === "da" ? "Öppna filter" : "Åbn filtre",
        exact: true,
      })
      .click();
    await page.locator(".language-select select").selectOption(locale);
    await page.keyboard.press("Escape");
    await expect(
      page.getByRole("button", { name: label, exact: true }),
    ).toBeVisible();
  }
  assert.deepEqual(errors, []);
  console.log(
    JSON.stringify({
      passed: true,
      cardHeight: bounds.height,
      checks: [
        "compact marker card",
        "native share activation and payload",
        "cancel without copying",
        "share failure fallback",
        "clipboard fallback and denial",
        "planning time",
        "disclosure and reset",
        "small mobile",
        "Danish and English",
      ],
      errors,
    }),
  );
} finally {
  await browser.close();
}
