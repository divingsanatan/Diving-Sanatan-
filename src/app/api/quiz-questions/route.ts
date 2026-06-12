import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/utils/supabaseServer";

/**
 * GET Handler - Retrieves all quiz questions, optionally filtered by category
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const category = searchParams.get("category");

    let query = supabaseServer.from("quiz_questions").select("*");

    if (category && category !== "all") {
      query = query.eq("category", category);
    }

    const { data, error } = await query.order("created_at", { ascending: true });

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, data });
  } catch (error) {
    return NextResponse.json({ success: false, error: "Failed to read quiz questions" }, { status: 500 });
  }
}

/**
 * POST Handler - Creates a new quiz question
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { category, question_text, question_type, options } = body;

    if (!category || !question_text || !question_type) {
      return NextResponse.json({ success: false, error: "Missing required question details" }, { status: 400 });
    }

    const id = `q-${Math.random().toString(36).substring(2, 9)}`;
    const newQuestion = {
      id,
      category,
      question_text,
      question_type,
      options: options || []
    };

    const { error } = await supabaseServer.from("quiz_questions").insert([newQuestion]);

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, data: newQuestion }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ success: false, error: "Failed to create quiz question" }, { status: 500 });
  }
}

/**
 * PUT Handler - Updates an existing quiz question
 */
export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, category, question_text, question_type, options } = body;

    if (!id) {
      return NextResponse.json({ success: false, error: "Question ID is required for update" }, { status: 400 });
    }

    const updates: any = {};
    if (category) updates.category = category;
    if (question_text) updates.question_text = question_text;
    if (question_type) updates.question_type = question_type;
    if (options) updates.options = options;

    const { error } = await supabaseServer.from("quiz_questions").update(updates).eq("id", id);

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: "Question updated successfully" });
  } catch (error) {
    return NextResponse.json({ success: false, error: "Failed to update quiz question" }, { status: 500 });
  }
}

/**
 * DELETE Handler - Deletes a quiz question
 */
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ success: false, error: "Question ID is required for deletion" }, { status: 400 });
    }

    const { error } = await supabaseServer.from("quiz_questions").delete().eq("id", id);

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: "Question deleted successfully" });
  } catch (error) {
    return NextResponse.json({ success: false, error: "Failed to delete quiz question" }, { status: 500 });
  }
}
