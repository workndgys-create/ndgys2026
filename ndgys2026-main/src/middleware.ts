import { NextRequest, NextResponse } from "next/server";
import { verifySessionToken, sessionCookieName } from "@/lib/auth";
import { verifyDelegateSession, delegateCookieName } from "@/lib/delegateAuth";

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // ── Admin area ──────────────────────────────────────────────
  if (pathname.startsWith("/admin") || pathname.startsWith("/api/admin")) {
    if (pathname === "/admin/login" || pathname.startsWith("/api/admin/login")) return NextResponse.next();
    const token = req.cookies.get(sessionCookieName)?.value;
    const session = token ? await verifySessionToken(token) : null;
    if (!session) {
      if (pathname.startsWith("/api/")) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      const url = req.nextUrl.clone(); url.pathname = "/admin/login"; url.searchParams.set("next", pathname);
      return NextResponse.redirect(url);
    }
    return NextResponse.next();
  }

  // ── Delegate dashboard ──────────────────────────────────────
  if (pathname.startsWith("/dashboard") || pathname.startsWith("/api/delegate")) {
    if (pathname === "/dashboard/login" || pathname.startsWith("/api/delegate/auth")) return NextResponse.next();
    const token = req.cookies.get(delegateCookieName)?.value;
    const session = token ? await verifyDelegateSession(token) : null;
    if (!session) {
      if (pathname.startsWith("/api/")) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      const url = req.nextUrl.clone(); url.pathname = "/dashboard/login"; url.searchParams.set("next", pathname);
      return NextResponse.redirect(url);
    }
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/api/admin/:path*", "/dashboard/:path*", "/api/delegate/:path*"]
};
