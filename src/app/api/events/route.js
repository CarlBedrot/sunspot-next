import { createEventService } from "../../../../server/events.js";
const getEvents = createEventService();
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request) {
  const params = new URL(request.url).searchParams;
  const from = Date.parse(params.get("from")),
    to = Date.parse(params.get("to"));
  if (
    !Number.isFinite(from) ||
    !Number.isFinite(to) ||
    to <= from ||
    to - from > 8 * 86400_000
  ) {
    return Response.json(
      { error: "Välj ett intervall på högst åtta dagar." },
      { status: 400 },
    );
  }
  return Response.json(await getEvents(from, to), {
    headers: { "Cache-Control": "no-store" },
  });
}
