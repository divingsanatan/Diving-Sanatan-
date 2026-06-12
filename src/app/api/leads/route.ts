import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/utils/supabaseServer";

/**
 * GET Handler - Retrieves all lead user profiles, along with their quiz answers
 */
export async function GET(req: NextRequest) {
  try {
    const { data: profiles, error: profileError } = await supabaseServer
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
      .order("created_at", { ascending: false });

    if (profileError) {
      return NextResponse.json({ success: false, error: profileError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, data: profiles });
  } catch (error) {
    return NextResponse.json({ success: false, error: "Failed to read leads profiles" }, { status: 500 });
  }
}

/**
 * POST Handler - Creates a new user profile and saves their quiz responses
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, email, phone, gender, dob, category, answers } = body;

    if (!name || !email || !phone || !gender || !dob || !category) {
      return NextResponse.json({ success: false, error: "Missing required profile details" }, { status: 400 });
    }

    const profileId = `lead-${Math.random().toString(36).substring(2, 9)}`;
    const newProfile = {
      id: profileId,
      name,
      email,
      phone,
      gender,
      dob,
      category
    };

    // 1. Insert user profile
    const { error: profileError } = await supabaseServer
      .from("user_profiles")
      .insert([newProfile]);

    if (profileError) {
      return NextResponse.json({ success: false, error: profileError.message }, { status: 500 });
    }

    // 2. Insert user answers
    if (answers && Array.isArray(answers) && answers.length > 0) {
      const answersData = answers.map((ans: any) => ({
        id: `ans-${Math.random().toString(36).substring(2, 9)}`,
        profile_id: profileId,
        question_id: ans.question_id || null,
        question_text: ans.question_text,
        answer_text: ans.answer_text
      }));

      const { error: answersError } = await supabaseServer
        .from("user_answers")
        .insert(answersData);

      if (answersError) {
        console.error("Failed to insert user answers:", answersError.message);
        // We still return success as profile was created, but warn about answers
        return NextResponse.json({ 
          success: true, 
          data: newProfile,
          warning: "Profile created, but answers failed to save." 
        }, { status: 201 });
      }
    }

    return NextResponse.json({ success: true, data: newProfile }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ success: false, error: "Failed to create user profile" }, { status: 500 });
  }
}
