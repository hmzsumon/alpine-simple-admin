/* ────────── imports ────────── */
import { NextRequest, NextResponse } from "next/server";
import { canAccessPath, landingPath } from "@/config/access";
import type { AuthUser } from "@/types/auth";
import { apiOrigin } from "@/lib/api-origin";

/* ────────── verify the live session on every protected route request ────────── */
export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;
  const token = request.cookies.get("alpine_simple_session")?.value;
  if (!token) {
    if (path === "/login") return NextResponse.next();
    return NextResponse.redirect(new URL("/login", request.url));
  }
  let user: AuthUser | null = null;
  try {
    const response = await fetch(
      apiOrigin() + "/api/auth/me",
      { headers: { Authorization: "Bearer " + token }, cache: "no-store" }
    );
    if (response.ok) user = (await response.json()).user;
  } catch {}
  if (!user) {
    if (path === "/login") return NextResponse.next();
    return NextResponse.redirect(new URL("/login", request.url));
  }
  if (path === "/login" || !canAccessPath(user, path))
    return NextResponse.redirect(new URL(landingPath(user), request.url));
  const response = NextResponse.next();
  response.headers.set("Cache-Control", "private, no-store");
  // Only authenticated bill documents may load inside our own print iframe.
  const billDocument=path.startsWith("/bill/");
  response.headers.set("X-Frame-Options", billDocument?"SAMEORIGIN":"DENY");
  if(billDocument)response.headers.set("Content-Security-Policy", "frame-ancestors 'self'");
  response.headers.set("X-Content-Type-Options", "nosniff");
  return response;
}
export const config = {
  matcher: [
    "/login",
    "/cash-counters/:path*","/daily-print/:path*","/cash/:path*","/cash-print/:path*","/reports/:path*","/payment-methods/:path*",
    "/developer/:path*",
    "/dashboard/:path*",
    "/orders/:path*",
    "/bill/:path*",
    "/menu/:path*",
    "/inventory/:path*",
    "/procurement/:path*",
    "/procurement-print/:path*",
    "/tables/:path*",
    "/kitchen/:path*",
    "/expenses/:path*",
    "/printers/:path*",
    "/users/:path*",
    "/profile/:path*",
    "/guide/:path*",
  ],
};
