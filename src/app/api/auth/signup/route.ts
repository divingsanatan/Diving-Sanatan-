import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/utils/supabaseServer";
import { hashPassword } from "@/utils/auth";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, email, phone, gender, dob, password } = body;

    // Validate inputs
    if (!name || !email || !phone || !gender || !dob || !password) {
      return NextResponse.json(
        { success: false, error: "All profile details and a password are required" },
        { status: 400 }
      );
    }

    const emailLower = email.toLowerCase().trim();
    const hashedPassword = hashPassword(password);

    // 1. Check if a profile with this email already exists
    const { data: existingProfile, error: fetchError } = await supabaseServer
      .from("user_profiles")
      .select("*")
      .eq("email", emailLower)
      .maybeSingle();

    if (fetchError) {
      return NextResponse.json(
        { success: false, error: "Database error during check: " + fetchError.message },
        { status: 500 }
      );
    }

    if (existingProfile) {
      // If profile exists and already has a password, they should use Login
      if (existingProfile.password) {
        return NextResponse.json(
          { success: false, error: "An account with this email already exists. Please log in instead." },
          { status: 400 }
        );
      }

      // If profile exists as a lead but doesn't have a password, SYNC it!
      const { data: updatedProfile, error: updateError } = await supabaseServer
        .from("user_profiles")
        .update({
          name: name.trim(),
          phone: phone.trim(),
          gender,
          dob,
          password: hashedPassword
        })
        .eq("id", existingProfile.id)
        .select()
        .single();

      if (updateError) {
        return NextResponse.json(
          { success: false, error: "Failed to sync profile: " + updateError.message },
          { status: 500 }
        );
      }

      // Remove password before returning
      const { password: _, ...safeProfile } = updatedProfile;

      return NextResponse.json({
        success: true,
        message: "Existing wellness profile successfully claimed and synced!",
        data: safeProfile,
        synced: true
      });
    }

    // 2. Profile does not exist, create a new one
    const newProfileId = `lead-${Math.random().toString(36).substring(2, 9)}`;
    const newProfile = {
      id: newProfileId,
      name: name.trim(),
      email: emailLower,
      phone: phone.trim(),
      gender,
      dob,
      password: hashedPassword,
      category: "General" // Default category for self-registered users
    };

    const { data: insertedProfile, error: insertError } = await supabaseServer
      .from("user_profiles")
      .insert([newProfile])
      .select()
      .single();

    if (insertError) {
      return NextResponse.json(
        { success: false, error: "Failed to create user profile: " + insertError.message },
        { status: 500 }
      );
    }

    // Remove password before returning
    const { password: _, ...safeProfile } = insertedProfile;

    return NextResponse.json({
      success: true,
      message: "Registration completed successfully!",
      data: safeProfile,
      synced: false
    }, { status: 201 });

  } catch (error: any) {
    console.error("Signup error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error: " + (error.message || error) },
      { status: 500 }
    );
  }
}
