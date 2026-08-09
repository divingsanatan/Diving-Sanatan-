import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/utils/supabaseServer";
import { hashPassword } from "@/utils/auth";

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

    const emailLower = email.toLowerCase().trim();
    const hashedPassword = hashPassword(password);

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
    if (profile.password !== hashedPassword) {
      return NextResponse.json(
        { success: false, error: "Invalid email or password." },
        { status: 400 }
      );
    }

    // Remove password before returning profile
    const { password: _, ...safeProfile } = profile;

    return NextResponse.json({
      success: true,
      message: "Login successful!",
      data: safeProfile
    });

  } catch (error: any) {
    console.error("Login error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error: " + (error.message || error) },
      { status: 500 }
    );
  }
}
