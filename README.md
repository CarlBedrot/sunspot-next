# Sunspot

Sunspot shows where the sun currently reaches in Copenhagen: building shadows, weather, and
sun-exposed benches and parks, computed from OpenStreetMap, Open-Meteo, and DMI data.

## Running locally

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Tests

```bash
npm test
```

## A note on accuracy

Shadow calculation here is an approximation, not a precision physics model. Building height
data from OpenStreetMap is often incomplete, so shadow shapes and sun/shade classifications
should be treated as indicative rather than exact.

## Data sources

- **[OpenStreetMap](https://www.openstreetmap.org/copyright)** (building footprints, benches,
  parks) — © OpenStreetMap contributors, [ODbL](https://opendatacommons.org/licenses/odbl/).
- **[Open-Meteo](https://open-meteo.com/)** (weather) — [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/).
- **[DMI](https://www.dmi.dk/)** (weather) — [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/).

Attribution for all three sources is included in the app's footer.

## License

MIT — see [LICENSE](./LICENSE).
