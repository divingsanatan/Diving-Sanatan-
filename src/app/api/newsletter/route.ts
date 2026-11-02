import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/utils/supabaseServer";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/**
 * POST /api/newsletter  { email: string, website?: string }
 * `website` is a honeypot field: real visitors never fill it.
 * Duplicates are treated as success so the endpoint cannot be used
 * to check whether an address is already subscribed.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    const honeypot = typeof body.website === "string" ? body.website.trim() : "";

    // Bots fill the hidden field. Pretend it worked, store nothing.
    if (honeypot) {
      return NextResponse.json({ success: true });
    }

    if (!email || email.length > 254 || !EMAIL_PATTERN.test(email)) {
      return NextResponse.json(
        { success: false, error: "Please enter a valid email address." },
        { status: 400 }
      );
    }

    const { error } = await supabaseServer
      .from("newsletter_subscribers")
      .insert({ email, source: "footer" });

    // 23505 = unique violation: already subscribed. Report success either way.
    if (error && error.code !== "23505") {
      console.error("Newsletter subscribe failed:", error.message);
      return NextResponse.json(
        { success: false, error: "We couldn't save your subscription. Please try again." },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Newsletter route error:", err);
    return NextResponse.json(
      { success: false, error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}
