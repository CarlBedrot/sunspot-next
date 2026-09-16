import { atHour } from "./lib.js";

// Demo fixtures, not listings of real events. Keep absolute instants so that
// visibility is unambiguous across dates, midnight and Copenhagen DST.
export function createDemoEvents(dates) {
  if (!dates.length) return [];
  const monday =
    dates.find((date) => new Date(`${date}T12:00:00Z`).getUTCDay() === 1) ||
    dates[0];
  const weekend =
    dates.find((date) => new Date(`${date}T12:00:00Z`).getUTCDay() === 6) ||
    dates.at(-1);
  const fixtures = [
    {
      date: monday,
      key: "picnic",
      name: "Måndagshäng · demo",
      emoji: "🧺",
      lat: 55.6855,
      lng: 12.5779,
      start: 15,
      end: 17,
    },
    {
      date: dates[1] || dates[0],
      key: "music",
      name: "Livemusik · demo",
      emoji: "🎵",
      lat: 55.6889,
      lng: 12.5594,
      start: 16,
      end: 19,
    },
    {
      date: weekend,
      key: "cinema",
      name: "Utomhusbio · demo",
      emoji: "🎬",
      lat: 55.6808,
      lng: 12.5938,
      start: 18,
      end: 21,
    },
  ];
  return fixtures.map(({ date, key, start, end, ...event }) => ({
    ...event,
    id: `demo-${key}-${date}`,
    category: "event",
    demo: true,
    startsAt: atHour(date, start).toISOString(),
    endsAt: atHour(date, end).toISOString(),
    description:
      "Ett påhittat event för att prova kartan och tidslinjen. Det här är inte ett bokningsbart evenemang.",
  }));
}

// Start inclusive, end exclusive: a Monday event is never shown on Tuesday
// unless its actual end time extends into Tuesday.
export function eventsAt(events, instant) {
  const now = Date.parse(instant);
  return events.filter((event) => {
    const start = Date.parse(event.startsAt),
      end = Date.parse(event.endsAt);
    return (
      Number.isFinite(start) &&
      Number.isFinite(end) &&
      start < end &&
      start <= now &&
      now < end
    );
  });
}
