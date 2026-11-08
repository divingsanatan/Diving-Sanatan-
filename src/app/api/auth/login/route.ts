import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/utils/supabaseServer";
import { hashPassword, needsRehash, verifyPassword } from "@/utils/auth";
import { attachSession } from "@/utils/authSession";
import { allow, clientIp } from "@/utils/rateLimit";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, password } = body;

    // Validate inputs
    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: "Email and password are required" },
        { status: 400 }
      );
    }

    const emailLower = String(email).toLowerCase().trim();

    // Slow down password guessing: 10 attempts per 15 minutes per address + visitor
    if (!allow(`login:${emailLower}:${clientIp(req)}`, 10, 15 * 60 * 1000)) {
      return NextResponse.json(
        { success: false, error: "Too many attempts. Please wait a few minutes and try again." },
        { status: 429 }
      );
    }

    let profile: any = null;

    try {
      const { getDb } = require("@/utils/db");
      const db = getDb();
      if (db.user_profiles) {
        profile = db.user_profiles.find((u: any) => u.email.toLowerCase() === emailLower);
      }
    } catch (dbErr) {
      console.error("Local db fetch error during login:", dbErr);
    }

    if (!profile) {
      try {
        const { data } = await supabaseServer
          .from("user_profiles")
          .select("*")
          .eq("email", emailLower)
          .maybeSingle();
        if (data) profile = data;
      } catch (e) {
        console.warn("Supabase user_profiles login fetch warning:", e);
      }
    }

    if (!profile) {
      return NextResponse.json(
        { success: false, error: "Invalid email or password." },
        { status: 400 }
      );
    }

    // Check if the user exists but hasn't activated password login yet
    if (!profile.password) {
      return NextResponse.json({
        success: false,
        error: "This email has not been activated for login yet. Please sign up to sync your profile and set a password."
      }, { status: 400 });
    }

    // Validate password hash
    if (!verifyPassword(String(password), profile.password)) {
      return NextResponse.json(
        { success: false, error: "Invalid email or password." },
        { status: 400 }
      );
    }

    // Remove password before returning profile
    const { password: _, ...safeProfile } = profile;

    // Quietly upgrade old unsalted hashes to a modern salted one
    if (needsRehash(profile.password)) {
      try {
        await supabaseServer.from("user_profiles").update({ password: hashPassword(String(password)) }).eq("id", profile.id);
      } catch (e) {
        console.warn("Password hash upgrade skipped:", e);
      }
    }

    const res = NextResponse.json({
      success: true,
      message: "Login successful!",
      data: safeProfile
    });
    attachSession(res, { id: String(profile.id), role: String(profile.role || "user"), email: emailLower, name: profile.name });
    return res;
  } catch (error: any) {
    console.error("Login error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error: " + (error.message || error) },
      { status: 500 }
    );
  }
}
