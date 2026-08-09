import { NextRequest, NextResponse } from "next/server";

/**
 * Next.js Edge Middleware — runs on every request before routing.
 *
 * Responsibilities:
 *  1. Redirect lookup: check the `redirects` table for 301/302 entries.
 *  2. 404 logging: if a route returns 404, log it to `redirects` as a
 *     potential broken-link candidate (target_url = null, status = 404).
 *
 * Note: Edge middleware cannot use the full Supabase JS SDK (Node-only).
 *       We use fetch() against our own API endpoints to keep this edge-compatible.
 */

export async function middleware(req: NextRequest) {
  const pathname = req.nextUrl.pathname;

  // ─── Skip static assets, API routes, and Next.js internals ───
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname.startsWith("/admin") ||
    pathname.match(/\.(ico|png|jpg|jpeg|gif|svg|webp|css|js|woff2?|ttf|otf|map)$/)
  ) {
    return NextResponse.next();
  }

  // ─── Redirect lookup via internal API ───
  try {
    const redirectApiUrl = new URL("/api/seo/redirect-lookup", req.url);
    redirectApiUrl.searchParams.set("path", pathname);

    const res = await fetch(redirectApiUrl.toString(), {
      headers: { "x-middleware-key": process.env.MIDDLEWARE_SECRET || "internal" },
    });

    if (res.ok) {
      const data = await res.json();
      if (data.redirect) {
        return NextResponse.redirect(
          new URL(data.redirect.target_url, req.url),
          data.redirect.status_code || 301
        );
      }
    }
  } catch (e) {
    // Redirect lookup failure is non-fatal — continue normal routing
  }

  // ─── Let the request through; 404 logging happens via the API route ───
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - /_next (static files)
     * - /api (API routes)
     * - /favicon.ico, /robots.txt, /sitemap.xml
     */
    "/((?!_next|api|favicon\\.ico|robots\\.txt|sitemap\\.xml).*)",
  ],
};
