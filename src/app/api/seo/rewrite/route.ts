import { NextRequest, NextResponse } from "next/server";
import { generateBlogRewriteSuggestion } from "@/lib/seo/agents/blogRewriteAgent";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { blogId } = body;

    if (!blogId) {
      return NextResponse.json({ success: false, error: "blogId parameter is required." }, { status: 400 });
    }

    const result = await generateBlogRewriteSuggestion(blogId);
    if (!result.success) {
      return NextResponse.json({ success: false, error: result.error }, { status: 500 });
    }

    return NextResponse.json({ success: true, data: result });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message || "Failed to generate blog rewrite suggestion." }, { status: 500 });
  }
}
