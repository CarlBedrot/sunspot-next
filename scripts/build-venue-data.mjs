import fs from "node:fs";
import { cityAreas, parkPoint } from "./park-data.mjs";
import { places as original } from "../src/places.js";
const raw = JSON.parse(fs.readFileSync("data/osm-venue-areas-source.json"));
const base = JSON.parse(fs.readFileSync("data/osm-places-source.json"));
const city = cityAreas(
  JSON.parse(fs.readFileSync("data/osm-city-parks-source.json")),
);
const all = original
  .filter((p) => !p.id.startsWith("osm-"))
  .map((p) => {
    const source = base.elements.find((e) => `${e.type}/${e.id}` === p.osm);
    const clean = { ...p };
    delete clean.demo;
    return {
      ...clean,
      greenSpace: source?.tags?.leisure === "park",
      openingHours: source?.tags?.opening_hours || null,
      outdoor: source?.tags?.outdoor_seating || "unknown",
    };
  });
for (const e of raw.elements.filter((e) => e.type === "node")) {
  const category = e.tags.amenity === "restaurant" ? "restaurant" : "bar";
  all.push({
    id: `osm-${e.id}`,
    name: e.tags.name,
    category,
    kind: category === "bar" ? "Bar" : "Restaurang",
    district: "Nørrebro",
    lat: e.lat,
    lng: e.lon,
    osm: `node/${e.id}`,
    emoji: category === "bar" ? "🍺" : "🍽️",
    description:
      "Uteservering registrerad i OpenStreetMap. Kontrollera sittplatsen på kartan.",
    meeting: "Möt upp vid entrén.",
    accent: category === "bar" ? "#eee0d0" : "#d7e4ee",
    openingHours: e.tags.opening_hours || null,
    outdoor: "yes",
  });
}
const parks = {};
for (const p of all.filter((p) => p.category === "park")) {
  const e = raw.elements.find((e) => `${e.type}/${e.id}` === p.osm);
  if (e?.geometry) parks[p.id] = [[e.geometry.map((v) => [v.lon, v.lat])]];
}
const skipped = [...city.skipped];
for (const park of city.parks) {
  const existing = all.find((p) => p.osm === park.osm);
  if (existing) {
    parks[existing.id] = park.polygons;
    existing.greenSpace = true;
    existing.openingHours = park.tags.opening_hours || null;
    continue;
  }
  const point = parkPoint(park.polygons, city.water);
  if (!point) {
    skipped.push({ id: park.osm, reason: "no-land-point" });
    continue;
  }
  const id = `osm-park-${park.osm.replace("/", "-")}`;
  all.push({
    id,
    name: park.tags.name,
    category: "park",
    kind: "Park",
    district:
      park.tags["addr:suburb"] ||
      park.tags["addr:city"] ||
      "Köpenhamn med omnejd",
    lat: point[1],
    lng: point[0],
    osm: park.osm,
    emoji: "🌳",
    description:
      "Park registrerad i OpenStreetMap. Utforska grönskan och välj en mötespunkt tillsammans.",
    meeting: "Bestäm en mötespunkt i parken tillsammans.",
    openingHours: park.tags.opening_hours || null,
    outdoor: "yes",
    greenSpace: true,
  });
  parks[id] = park.polygons;
}
fs.writeFileSync(
  "src/places.js",
  `// OpenStreetMap extracts in data/; editorial descriptions and unverified venue coordinates.\nexport const places = ${JSON.stringify(all, null, 2)};\nexport const activityFor = category => ({park:'walk',bar:'bar',restaurant:'restaurant'})[category];\nexport const activityNames = {walk:'Ta en promenad',bar:'Gå till en bar',restaurant:'Ät tillsammans'};\n`,
);
fs.writeFileSync(
  "src/venueAreas.js",
  `// OSM MultiPolygon park boundaries and Polygon water exclusions; see data/README.md.\nexport const venueAreas = ${JSON.stringify({ parks, water: city.water })};\n`,
);
console.log(
  JSON.stringify({
    places: all.length,
    greenParks: all.filter((p) => p.greenSpace).length,
    water: city.water.length,
    skipped,
  }),
);
