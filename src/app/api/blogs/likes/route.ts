import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/utils/supabaseServer";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const blogId = searchParams.get("blogId");
    const profileId = searchParams.get("profileId");

    if (!blogId) {
      return NextResponse.json(
        { success: false, error: "blogId is required" },
        { status: 400 }
      );
    }

    // 1. Get likes count
    const { count, error: countError } = await supabaseServer
      .from("blog_likes")
      .select("*", { count: "exact", head: true })
      .eq("blog_id", blogId);

    if (countError) {
      return NextResponse.json(
        { success: false, error: "Failed to fetch likes count: " + countError.message },
        { status: 500 }
      );
    }

    // 2. Check if specific profile has liked it
    let liked = false;
    if (profileId) {
      const { data: likeRecord, error: likeError } = await supabaseServer
        .from("blog_likes")
        .select("id")
        .eq("blog_id", blogId)
        .eq("profile_id", profileId)
        .maybeSingle();

      if (!likeError && likeRecord) {
        liked = true;
      }
    }

    return NextResponse.json({
      success: true,
      count: count || 0,
      liked
    });

  } catch (error: any) {
    console.error("Likes GET error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error: " + (error.message || error) },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { blogId, profileId } = body;

    if (!blogId || !profileId) {
      return NextResponse.json(
        { success: false, error: "blogId and profileId are required" },
        { status: 400 }
      );
    }

    // Check if like already exists
    const { data: existingLike, error: checkError } = await supabaseServer
      .from("blog_likes")
      .select("id")
      .eq("blog_id", blogId)
      .eq("profile_id", profileId)
      .maybeSingle();

    if (checkError) {
      return NextResponse.json(
        { success: false, error: "Database error: " + checkError.message },
        { status: 500 }
      );
    }

    if (existingLike) {
      // Unlike (delete)
      const { error: deleteError } = await supabaseServer
        .from("blog_likes")
        .delete()
        .eq("id", existingLike.id);

      if (deleteError) {
        return NextResponse.json(
          { success: false, error: "Failed to remove like: " + deleteError.message },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        liked: false,
        message: "Blog unliked successfully"
      });
    } else {
      // Like (insert)
      const likeId = `lk-${Math.random().toString(36).substring(2, 9)}`;
      const { error: insertError } = await supabaseServer
        .from("blog_likes")
        .insert([{
          id: likeId,
          blog_id: blogId,
          profile_id: profileId
        }]);

      if (insertError) {
        return NextResponse.json(
          { success: false, error: "Failed to add like: " + insertError.message },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        liked: true,
        message: "Blog liked successfully"
      });
    }

  } catch (error: any) {
    console.error("Likes POST error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error: " + (error.message || error) },
      { status: 500 }
    );
  }
}
