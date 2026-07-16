import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/utils/supabaseServer";

/**
 * POST Handler - Increments the view count of a blog post
 */
export async function POST(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ success: false, error: "Blog ID is required" }, { status: 400 });
    }

    // 1. Get the current views count
    const { data: blog, error: fetchError } = await supabaseServer
      .from("blogs")
      .select("views")
      .eq("id", id)
      .single();

    if (fetchError || !blog) {
      return NextResponse.json({ success: false, error: "Blog post not found" }, { status: 404 });
    }

    // 2. Increment and update the views column
    const currentViews = blog.views || 0;
    const newViews = currentViews + 1;

    const { error: updateError } = await supabaseServer
      .from("blogs")
      .update({ views: newViews })
      .eq("id", id);

    if (updateError) {
      return NextResponse.json({ success: false, error: updateError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, views: newViews });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to update blog views" },
      { status: 500 }
    );
  }
}
