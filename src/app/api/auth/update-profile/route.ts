import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/utils/supabaseServer";
import { hashPassword } from "@/utils/auth";
import { STAFF_ROLES, requireUser } from "@/utils/authSession";

export async function POST(req: NextRequest) {
  // Must be signed in, and may only change YOUR OWN profile (staff may change any).
  const auth = requireUser(req);
  if (!auth.ok) return auth.response;

  try {
    const body = await req.json();
    const { profile_id, name, phone, gender, dob, password } = body;

    if (!profile_id) {
      return NextResponse.json(
        { success: false, error: "Profile ID is required" },
        { status: 400 }
      );
    }
    if (String(profile_id) !== auth.user.id && !STAFF_ROLES.includes(auth.user.role)) {
      return NextResponse.json({ success: false, error: "You can only update your own profile." }, { status: 403 });
    }
    if (password && String(password).length < 8) {
      return NextResponse.json({ success: false, error: "Password must be at least 8 characters." }, { status: 400 });
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
