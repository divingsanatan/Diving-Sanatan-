import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/utils/supabaseServer";

const PROFILE_SELECT = `
  id,
  name,
  email,
  phone,
  gender,
  dob,
  category,
  created_at,
  report_sent,
  report_content,
  chakra_scores,
  password,
  user_answers (
    id,
    question_id,
    question_text,
    answer_text,
    created_at
  )
`;

function stripPassword<T extends { password?: string | null }>(profile: T) {
  const { password: _, ...safe } = profile;
  return {
    ...safe,
    has_auth: Boolean(profile.password),
  };
}

/**
 * GET Handler - Retrieves all user profiles (leads + registered users)
 */
export async function GET(req: NextRequest) {
  try {
    const { data: profiles, error: profileError } = await supabaseServer
      .from("user_profiles")
      .select(PROFILE_SELECT)
      .order("created_at", { ascending: false });

    if (profileError) {
      return NextResponse.json({ success: false, error: profileError.message }, { status: 500 });
    }

    const safeProfiles = (profiles || []).map(stripPassword);
    return NextResponse.json({ success: true, data: safeProfiles });
  } catch (error) {
    return NextResponse.json({ success: false, error: "Failed to read user profiles" }, { status: 500 });
  }
}

/**
 * POST Handler - Creates or updates a user profile (no duplicate emails)
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, email, phone, gender, dob, category, answers } = body;

    if (!name || !email || !phone || !gender || !dob || !category) {
      return NextResponse.json({ success: false, error: "Missing required profile details" }, { status: 400 });
    }

    const emailLower = email.toLowerCase().trim();

    const { data: existingProfile, error: fetchError } = await supabaseServer
      .from("user_profiles")
      .select("id, password")
      .eq("email", emailLower)
      .maybeSingle();

    if (fetchError) {
      return NextResponse.json({ success: false, error: fetchError.message }, { status: 500 });
    }

    let profileId: string;
    let isUpdate = false;

    if (existingProfile) {
      profileId = existingProfile.id;
      isUpdate = true;

      const { error: updateError } = await supabaseServer
        .from("user_profiles")
        .update({
          name: name.trim(),
          phone: phone.trim(),
          gender,
          dob,
          category,
        })
        .eq("id", profileId);

      if (updateError) {
        return NextResponse.json({ success: false, error: updateError.message }, { status: 500 });
      }
    } else {
      profileId = `lead-${Math.random().toString(36).substring(2, 9)}`;
      const newProfile = {
        id: profileId,
        name: name.trim(),
        email: emailLower,
        phone: phone.trim(),
        gender,
        dob,
        category,
      };

      const { error: profileError } = await supabaseServer
        .from("user_profiles")
        .insert([newProfile]);

      if (profileError) {
        return NextResponse.json({ success: false, error: profileError.message }, { status: 500 });
      }
    }

    if (answers && Array.isArray(answers) && answers.length > 0) {
      const answersData = answers.map((ans: { question_id?: string; question_text: string; answer_text: string }) => ({
        id: `ans-${Math.random().toString(36).substring(2, 9)}`,
        profile_id: profileId,
        question_id: ans.question_id || null,
        question_text: ans.question_text,
        answer_text: ans.answer_text,
      }));

      const { error: answersError } = await supabaseServer
        .from("user_answers")
        .insert(answersData);

      if (answersError) {
        console.error("Failed to insert user answers:", answersError.message);
        return NextResponse.json({
          success: true,
          data: { id: profileId, email: emailLower },
          updated: isUpdate,
          warning: "Profile saved, but answers failed to save.",
        }, { status: isUpdate ? 200 : 201 });
      }
    }

    return NextResponse.json({
      success: true,
      data: { id: profileId, email: emailLower },
      updated: isUpdate,
      message: isUpdate
        ? "Existing profile updated — no duplicate created."
        : "New profile created successfully.",
    }, { status: isUpdate ? 200 : 201 });
  } catch (error) {
    return NextResponse.json({ success: false, error: "Failed to save user profile" }, { status: 500 });
  }
}

/**
 * DELETE Handler - Remove a user profile and cascade answers
 */
export async function DELETE(req: NextRequest) {
  try {
    const id = req.nextUrl.searchParams.get("id");
    if (!id) {
      return NextResponse.json({ success: false, error: "Profile id is required" }, { status: 400 });
    }

    const { error } = await supabaseServer
      .from("user_profiles")
      .delete()
      .eq("id", id);

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: "User profile deleted." });
  } catch (error) {
    return NextResponse.json({ success: false, error: "Failed to delete user profile" }, { status: 500 });
  }
}
