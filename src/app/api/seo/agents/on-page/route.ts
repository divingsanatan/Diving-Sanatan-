import { NextRequest, NextResponse } from "next/server";
import { runOnPageAgent } from "@/lib/seo/agents/onPageAgent";
import { supabaseServer } from "@/utils/supabaseServer";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { url, blogId } = body;

    let targetUrl = url || "https://divingsanatan.online/blog";
    let targetContent = "Diving Sanatan Sanctuary energy healing guides, chakra balancing, and mindfulness practices.";
    let targetBlogId = blogId;

    // If blogId not supplied, pick the latest blog from Supabase
    if (!targetBlogId) {
      const { data: latestBlog } = await supabaseServer
        .from("blogs")
        .select("id, title, content, slug")
        .order("date", { ascending: false })
        .limit(1)
        .single();

      if (latestBlog) {
        targetBlogId = latestBlog.id;
        targetUrl = `https://divingsanatan.online/blog/${latestBlog.slug || latestBlog.id}`;
        targetContent = `${latestBlog.title}\n\n${latestBlog.content}`;
      }
    }

    const result = await runOnPageAgent(targetUrl, targetContent, targetBlogId);
    return NextResponse.json({ success: true, data: result });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
