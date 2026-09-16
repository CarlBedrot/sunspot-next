# SunSpot

SunSpot helps you find possible direct sunlight at parks, bars and restaurants in Copenhagen, choose a time and invite friends. This branch brings the map-first SunSpot experience into the existing **Next.js App Router** project.

## Run locally

Use Node 24 (`nvm use`; `.nvmrc` is included):

```bash
npm ci
npm run dev
```

Open [localhost:3000](http://localhost:3000). For a side-by-side comparison with the earlier Vite app:

```bash
npm run dev -- --hostname 127.0.0.1 --port 4174
```

No API keys are required for the local pilot. Invitations and the MET Norway weather cache are stored in `.data/`, excluded from Git. An existing database is not copied automatically.

## What is integrated

- Full-screen map, mobile controls and a continuous seven-day time slider.
- Touchgrass, bar, restaurant and event filters; partial shade does not exclude an entire park.
- 163 places, 139 OSM park areas and a building-shadow model with 19,523 buildings. The solar analysis runs in a Web Worker and follows the selected time.
- Real events from Københavns Biblioteker, plus a curated Luma example, with a weekly discovery list and rich event details. Markers follow event start/end times; fictional demo events are optional and off by default.
- MET Norway forecasts for the selected time, invitations, guest RSVPs and host cancellation.
- Editable seating points and in-app solar warnings. System notifications require user activation and a running app; this is not background push.

The original Next.js map, including its bench layer and Open-Meteo weather, is preserved at **[/lab](http://localhost:3000/lab)** for comparison. Bench data is not yet part of the main map's filters or unified solar analysis. The main map uses MET Norway; DMI is not connected. Existing TypeScript modules remain, while the migrated experience and solar engine retain JavaScript for this first integration.

## Verification

```bash
npm test                 # existing Vitest tests + imported and API migration tests
npm run lint
npm run build
npm run test:browser     # requires a running app on port 3000
npm run test:solar
npm run test:events      # event feed, mobile details and timeline behaviour
```

For browser tests, install Chromium with `npx playwright install chromium`, or set `SUNSPOT_BROWSER_PATH` to an existing Chrome executable. Override the app URL with `SUNSPOT_URL=http://localhost:4174`. Tests create and cancel their own local invitations.

## Private mobile test deployment

[Open SunSpot](https://sunspot-private.vercel.app/) and log in with an authorized Vercel account. Project `sunspot-private` uses Vercel Authentication for **all deployments**, including its production alias. This is a private test deployment; the computer running the local app can be turned off.

Map, solar analysis, weather and events are available. Invitations return 503 until shared durable storage is connected. The existing local invitation database is not uploaded. `.vercelignore` excludes local state, credentials and screenshots. Vercel project linking and authentication are local and ignored by Git; this deployment is not connected to automatic Git publishing.

For an authorized maintainer with the existing project linked, `vercel deploy` creates a preview and `vercel deploy --prod` updates the stable alias. Keep deployment protection enabled. [Deployment notes](docs/16-private-deployment.md).

## Runtime and deployment

Use `npm run build && npm start` on a Node server with writable **persistent storage**. `SUNSPOT_DATA_DIR` can select an absolute path on that disk. Set `SUNSPOT_PUBLIC_ORIGIN` to the public origin when running behind a reverse proxy so mutation-origin checks use the correct host and scheme. The local SQLite pilot targets one server and has a shared API request budget of 100 requests/minute per process.

**Invitations are not ready for Vercel deployment.** The Vercel runtime explicitly returns a useful 503 response for invitation APIs rather than storing them in a temporary filesystem. Map, solar analysis, events and forecasts do not require invitation storage. A shared database and distributed rate limiter are the next deployment work; the private Vercel test deployment does not provision a shared database.

## Accuracy and sources

Building heights are often estimated, and trees, terrain and detailed roof shapes are absent. Sunny means possible direct building-unobstructed sunlight, not a cloud-free weather guarantee. Outside the building extract, or at very low sun angles, the model reports unknown. OSM hours and seating areas are approximate snapshots, not verified business availability.

- [OpenStreetMap contributors](https://www.openstreetmap.org/copyright): buildings, parks, places and benches, under ODbL. [Data provenance](data/README.md).
- [MET Norway Locationforecast](https://api.met.no/weatherapi/locationforecast/2.0/documentation): forecasts in the main map.
- [Københavns Biblioteker](https://bibliotek.kk.dk/api/v1/events): live public event feed; [event sources and limitations](docs/15-eventkallor.md).
- [Open-Meteo](https://open-meteo.com/): weather in the original `/lab` prototype.

[Integration notes](docs/14-nextjs-integration.md) describe the migration and remaining work. Product and prototype documentation under `docs/01`–`docs/13` came from the earlier app; their Vite/Express references describe that version. The original Next.js plans remain under `docs/superpowers/`.

Code license: [MIT](LICENSE). Geographic data retains its own attribution and license.
