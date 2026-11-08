import { NextRequest, NextResponse } from "next/server";
import { buildQuote } from "@/lib/shopCommerce";
import { allow, clientIp } from "@/utils/rateLimit";

export const dynamic = "force-dynamic";

/** Authoritative prices and totals for a cart. Used by the cart and checkout pages. */
export async function POST(req: NextRequest) {
  if (!allow(`shop-quote:${clientIp(req)}`, 120, 10 * 60 * 1000)) {
    return NextResponse.json({ success: false, error: "Too many requests. Please slow down." }, { status: 429 });
  }
  const body = await req.json().catch(() => ({}));
  const result = await buildQuote(body.items);
  if (!result.ok) return NextResponse.json({ success: false, error: result.error }, { status: 400 });
  return NextResponse.json({ success: true, quote: result.quote });
}
