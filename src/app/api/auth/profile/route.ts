import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/utils/supabaseServer";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { success: false, error: "Profile ID is required" },
        { status: 400 }
      );
    }

    const { data: profile, error: profileError } = await supabaseServer
      .from("user_profiles")
      .select(`
        *,
        user_answers (
          id,
          question_id,
          question_text,
          answer_text,
          created_at
        )
      `)
      .eq("id", id)
      .maybeSingle();

    if (profileError) {
      return NextResponse.json(
        { success: false, error: "Database error: " + profileError.message },
        { status: 500 }
      );
    }

    if (!profile) {
      return NextResponse.json(
        { success: false, error: "Profile not found" },
        { status: 404 }
      );
    }

    // Exclude password hash
    const { password, ...safeProfile } = profile;

    return NextResponse.json({
      success: true,
      data: safeProfile
    });

  } catch (error: any) {
    console.error("Profile fetch error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error: " + (error.message || error) },
      { status: 500 }
    );
  }
}
