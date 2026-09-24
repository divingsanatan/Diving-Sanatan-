import { NextRequest, NextResponse } from "next/server";

/**
 * Next.js Proxy — runs on requests before routing.
 *
 * Responsibilities:
 *  1. Redirect lookup: check the `redirects` table for 301/302 entries.
 *  Directly queries Supabase REST endpoint to avoid internal HTTP loopback deadlocks in dev mode.
 */

export async function proxy(req: NextRequest) {
  const pathname = req.nextUrl.pathname;

  // ─── Skip static assets, API routes, admin, and common file extensions ───
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname.startsWith("/admin") ||
    pathname.match(/\.(ico|png|jpg|jpeg|gif|svg|webp|css|js|woff2?|ttf|otf|map)$/)
  ) {
    return NextResponse.next();
  }

  // ─── Direct Supabase REST Redirect Lookup (Edge & Node compatible) ───
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey =
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (supabaseUrl && supabaseKey && !supabaseUrl.includes("placeholder")) {
      const cleanPath = pathname.endsWith("/") && pathname.length > 1 ? pathname.slice(0, -1) : pathname;
      const endpoint = `${supabaseUrl}/rest/v1/redirects?select=target_path,status_code&or=(source_path.eq.${encodeURIComponent(cleanPath)},source_path.eq.${encodeURIComponent(cleanPath + "/")})&limit=1`;

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 1000);

      const res = await fetch(endpoint, {
        headers: {
          apikey: supabaseKey,
          Authorization: `Bearer ${supabaseKey}`,
        },
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0 && data[0]?.target_path) {
          return NextResponse.redirect(
            new URL(data[0].target_path, req.url),
            data[0].status_code || 301
          );
        }
      }
    }
  } catch (e) {
    // Non-fatal fallback — continue normal routing
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next|api|favicon\\.ico|robots\\.txt|sitemap\\.xml).*)",
  ],
};
