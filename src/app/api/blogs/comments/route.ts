import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/utils/supabaseServer";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const blogId = searchParams.get("blogId");

    if (!blogId) {
      return NextResponse.json(
        { success: false, error: "blogId is required" },
        { status: 400 }
      );
    }

    const { data: comments, error: fetchError } = await supabaseServer
      .from("blog_comments")
      .select(`
        id,
        blog_id,
        comment_text,
        created_at,
        profile_id,
        user_profiles (
          name
        )
      `)
      .eq("blog_id", blogId)
      .order("created_at", { ascending: false });

    if (fetchError) {
      return NextResponse.json(
        { success: false, error: "Failed to fetch comments: " + fetchError.message },
        { status: 500 }
      );
    }

    const formattedComments = (comments || []).map((c: any) => {
      const uProfile = Array.isArray(c.user_profiles) ? c.user_profiles[0] : c.user_profiles;
      return {
        id: c.id,
        blogId: c.blog_id,
        commentText: c.comment_text,
        createdAt: c.created_at,
        profileId: c.profile_id,
        userName: uProfile?.name || "Anonymous Reader"
      };
    });

    return NextResponse.json({
      success: true,
      data: formattedComments
    });

  } catch (error: any) {
    console.error("Comments GET error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error: " + (error.message || error) },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { blogId, profileId, commentText } = body;

    if (!blogId || !profileId || !commentText || !commentText.trim()) {
      return NextResponse.json(
        { success: false, error: "blogId, profileId, and commentText are required" },
        { status: 400 }
      );
    }

    const commentId = `cm-${Math.random().toString(36).substring(2, 9)}`;

    // Verify profile exists
    const { data: profile, error: profileError } = await supabaseServer
      .from("user_profiles")
      .select("name")
      .eq("id", profileId)
      .maybeSingle();

    if (profileError || !profile) {
      return NextResponse.json(
        { success: false, error: "User profile not found. Please log in again." },
        { status: 401 }
      );
    }

    const newComment = {
      id: commentId,
      blog_id: blogId,
      profile_id: profileId,
      comment_text: commentText.trim()
    };

    const { data: inserted, error: insertError } = await supabaseServer
      .from("blog_comments")
      .insert([newComment])
      .select()
      .single();

    if (insertError) {
      return NextResponse.json(
        { success: false, error: "Failed to post comment: " + insertError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        id: inserted.id,
        blogId: inserted.blog_id,
        commentText: inserted.comment_text,
        createdAt: inserted.created_at,
        profileId: inserted.profile_id,
        userName: profile.name
      },
      message: "Comment posted successfully!"
    }, { status: 201 });

  } catch (error: any) {
    console.error("Comments POST error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error: " + (error.message || error) },
      { status: 500 }
    );
  }
}
