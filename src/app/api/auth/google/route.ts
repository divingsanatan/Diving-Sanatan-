import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/utils/supabaseServer";
import { attachSession } from "@/utils/authSession";
import { googleDevBypass, verifyGoogleAccessToken } from "@/utils/googleVerify";
import { allow, clientIp } from "@/utils/rateLimit";

// Responds, and signs the person in with a server-verified session cookie when a profile is returned.
function reply(payload: any, status = 200) {
  const res = NextResponse.json(payload, { status });
  const d = payload?.data;
  if (d?.id) attachSession(res, { id: String(d.id), role: String(d.role || "user"), email: String(d.email || ""), name: d.name });
  return res;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { phone, gender, dob, action, accessToken } = body;
    let { name } = body;

    if (!allow(`google:${clientIp(req)}`, 30, 15 * 60 * 1000)) {
      return NextResponse.json({ success: false, error: "Too many attempts. Please wait a few minutes." }, { status: 429 });
    }

    // The email comes from GOOGLE, never from the request body.
    let emailLower = "";
    if (googleDevBypass()) {
      if (!body.email) return NextResponse.json({ success: false, error: "Email is required" }, { status: 400 });
      emailLower = String(body.email).toLowerCase().trim();
    } else {
      const verified = await verifyGoogleAccessToken(String(accessToken || ""));
      if (!verified.ok) return NextResponse.json({ success: false, error: verified.error }, { status: 401 });
      emailLower = verified.email;
      if (!name) name = verified.name;
    }

    // 1. Check if user profile exists in user_profiles under this email
    const { data: profile, error: fetchError } = await supabaseServer
      .from("user_profiles")
      .select("*")
      .eq("email", emailLower)
      .maybeSingle();

    if (fetchError) {
      return NextResponse.json(
        { success: false, error: "Database error: " + fetchError.message },
        { status: 500 }
      );
    }

    // 2. Google Login Action
    if (action === "login") {
      if (profile) {
        // Remove password from response if it exists
        const { password: _, ...safeProfile } = profile;
        return reply({
          success: true,
          exists: true,
          data: safeProfile
        });
      } else {
        // Profile does not exist, tell frontend to prompt for details (Step 2)
        return NextResponse.json({
          success: true,
          exists: false,
          message: "No profile found for this email. Redirecting to complete registration."
        });
      }
    }

    // 3. Google Sign Up / Sync Action
    if (action === "signup") {
      if (profile) {
        // If a profile exists, sync any missing details that are provided
        const updateData: any = {};
        if (phone) updateData.phone = phone.trim();
        if (gender) updateData.gender = gender;
        if (dob) updateData.dob = dob;
        if (name && !profile.name) updateData.name = name.trim();

        if (Object.keys(updateData).length > 0) {
          const { data: updatedProfile, error: updateError } = await supabaseServer
            .from("user_profiles")
            .update(updateData)
            .eq("id", profile.id)
            .select()
            .single();

          if (updateError) {
            return NextResponse.json(
              { success: false, error: "Failed to sync profile: " + updateError.message },
              { status: 500 }
            );
          }

          const { password: _, ...safeProfile } = updatedProfile;
          return reply({
            success: true,
            exists: true,
            message: "Wellness profile successfully claimed and synced!",
            data: safeProfile
          });
        }

        const { password: _, ...safeProfile } = profile;
        return reply({
          success: true,
          exists: true,
          message: "Profile already exists and is fully synced.",
          data: safeProfile
        });
      }

      // Profile does not exist, register a new one. All details are required.
      if (!name || !phone || !gender || !dob) {
        return NextResponse.json(
          { success: false, error: "All profile details (Name, Phone, Gender, DOB) are required to complete signup." },
          { status: 400 }
        );
      }

      const newProfileId = `lead-${Math.random().toString(36).substring(2, 9)}`;
      const newProfile = {
        id: newProfileId,
        name: name.trim(),
        email: emailLower,
        phone: phone.trim(),
        gender,
        dob,
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

      return reply({
        success: true,
        exists: true,
        message: "Registration completed successfully!",
        data: insertedProfile
      }, 201);
    }

    return NextResponse.json(
      { success: false, error: "Invalid action parameter." },
      { status: 400 }
    );

  } catch (error: any) {
    console.error("Google Auth Route Error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error: " + (error.message || error) },
      { status: 500 }
    );
  }
}
