# Next.js integration

## Starting points

- Target: `lveggers/sunspot`, main at `7762b84`.
- Migrated prototype: `CarlBedrot/sunspot`, main at `a99c78f`.
- Branch: `codex/integrate-map-experience`.

This is a staged code migration onto the existing Next.js history. Both original histories remain intact; the old Vite repository is not overwritten. No existing invitation database, personal browser storage or environment files are included.

## Architecture

`src/app/page.tsx` and `src/app/invite/[id]/page.tsx` load `components/Explore.tsx`. The client wrapper dynamically imports the experience with SSR disabled: Leaflet, localStorage and Web Workers require a browser. Its pathname key resets page state when navigating between map and invitations. Internal links and invitation creation use Next navigation.

The imported geometry, exposure, event and opening-hours modules remain JavaScript in this first integration. Next page boundaries and the original modules remain TypeScript. Both test suites run. The main map retains the larger OSM extract, courtyard-aware shadows and multiple park samples, avoiding a change to a single centroid classification.

`src/app/api/[...path]/route.ts` delegates to `server/api.js`, which uses native Request/Response rather than Express. Validation, opaque invitation IDs, hashed host/guest credentials, private host responses, cancellation, expiry and no-store responses are retained. JSON bodies are capped at 8 KiB even without Content-Length. An explicit deployment origin can be configured without trusting arbitrary forwarding headers.

The SQLite connection is created lazily at runtime and survives development reloads via a process-global reference. Database files and replaceable forecast cache are stored in `.data/` or `SUNSPOT_DATA_DIR`. Data is not read or written during static page generation. Use one persistent Node server for this pilot; invitation APIs return 503 on Vercel until shared storage is added.

`/api/weather` independently serves the MET Norway cache, including conditional requests, expiry and retry backoff. Vercel may use a temporary directory for this replaceable cache; it never uses temporary storage for invitations.

The original Next map is kept at `/lab`, with scoped map styles. Original bench discovery and Open-Meteo modules are preserved there. They are not silently mixed into the main map or presented as using the main solar model. A future bench integration should feed points into that same model and respect unknown coverage.

## Scope and remaining work

The main map includes categories, complete filter reset, Touchgrass, time-bound real and optional demo events, forecasts, invitation/RSVP flows, seating-point editing and solar warnings. Data attribution and the supplied palette are retained.

Before deployment with invitations on Vercel: replace SQLite with shared durable storage, carry over schema/authorization semantics, and use a distributed request limiter. No database provisioning, production deployment or merge is part of this branch. The separate `/api/events` route now reads the public library feed and curated examples; see [event integration](15-eventkallor.md). Google Places, background push, accounts and real booking remain outside the prototype.

## Verification

The combined automated suite covers the original Next geometry/weather functions and the imported model, park coverage, opening hours and event intervals. Additional Request/Response tests cover persistence across database reopen, host/guest separation, origin validation, malformed/oversized JSON, unsupported methods, private errors and throttling.

Browser tests exercise the Next routes on desktop and mobile, the weekly timeline, events appearing/disappearing, filters, direct invitation links, guest answer persistence, cancellation, data retry, seating edits and notification deduplication. Production-bundle verification is separate from development to check the worker and server APIs after bundling.

Verified locally on Node 24.19.0: all 43 tests pass (18 original Vitest cases and 25 imported/migration/source cases), lint passes, and Next.js production build completes without warnings. Both browser suites pass against development and production servers. Desktop/mobile screenshots were inspected. Browser readiness waits for the document and completed solar analysis, rather than every external resource's load event.
