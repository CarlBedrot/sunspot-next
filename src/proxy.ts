import { NextRequest, NextResponse } from "next/server";
export function proxy(request: NextRequest) {
  const path = request.nextUrl.pathname;
  if (
    process.env.SUNSPOT_RECIPIENT_ONLY === "1" &&
    path !== "/" &&
    path !== "/favicon.svg" &&
    !path.startsWith("/hang/") &&
    !path.startsWith("/api/hangs/") &&
    path !== "/api/hangs" &&
    !path.startsWith("/_next/")
  ) {
    return new NextResponse("Not found", { status: 404 });
  }
  return NextResponse.next();
}
