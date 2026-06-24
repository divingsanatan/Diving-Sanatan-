import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/utils/supabaseServer";
import { hashPassword } from "@/utils/auth";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { profile_id, name, phone, gender, dob, password } = body;

    if (!profile_id) {
      return NextResponse.json(
        { success: false, error: "Profile ID is required" },
        { status: 400 }
      );
    }

    const updates: any = {};
    if (name !== undefined) updates.name = name.trim();
    if (phone !== undefined) updates.phone = phone.trim();
    if (gender !== undefined) updates.gender = gender;
    if (dob !== undefined) updates.dob = dob;
    
    if (password) {
      updates.password = hashPassword(password);
    }

    const { data: updatedProfile, error: updateError } = await supabaseServer
      .from("user_profiles")
      .update(updates)
      .eq("id", profile_id)
      .select()
      .single();

    if (updateError) {
      return NextResponse.json(
        { success: false, error: "Failed to update profile: " + updateError.message },
        { status: 500 }
      );
    }

    // Exclude password hash
    const { password: _, ...safeProfile } = updatedProfile;

    return NextResponse.json({
      success: true,
      message: "Profile updated successfully!",
      data: safeProfile
    });

  } catch (error: any) {
    console.error("Profile update error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error: " + (error.message || error) },
      { status: 500 }
    );
  }
}
