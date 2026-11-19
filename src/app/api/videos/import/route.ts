import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/utils/supabaseServer";
import { invalidateServerCache } from "@/utils/serverCache";
import { requireStaff } from "@/utils/authSession";
import { videoRowFromBlog } from "@/lib/videoServer";
import { revalidateVideos } from "@/lib/videoRevalidate";

export const dynamic = "force-dynamic";

const newId = () => `vid-${Math.random().toString(36).substring(2, 10)}${Date.now().toString(36).slice(-3)}`;

/**
 * One-time (and safe to repeat) copy of the existing video posts from the blog table into the new video list.
 * The original blog posts are left untouched. Videos already imported, or whose YouTube video is already on
 * the list, are skipped. Posts without a real YouTube link are reported, not imported.
 * Unless { redirects: false } is sent, each imported live post's old /blog/<slug> address redirects (301) to
 * its new video page so there is no duplicate content.
 */
export async function POST(req: NextRequest) {
  const auth = requireStaff(req);
  if (!auth.ok) return auth.response;
  try {
    const body = await req.json().catch(() => ({}));
    const withRedirects = body?.redirects !== false;

    const { data: blogs, error } = await supabaseServer.from("blogs").select("*").limit(3000);
    if (error) return NextResponse.json({ success: false, error: "Could not read the blog posts." }, { status: 500 });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const candidates = (blogs || []).filter((b: any) =>
      b.content_type === "video" || !!b.video_embed_url || (Array.isArray(b.videos) && b.videos.length > 0) ||
      String(b.category || "").toLowerCase().includes("video") || String(b.section || "").toLowerCase().includes("video"));

    const { data: existing } = await supabaseServer.from("video_posts").select("slug, youtube_id, source_blog_id").limit(5000);
    const slugs = new Set((existing || []).map((r) => r.slug));
    const ytIds = new Set((existing || []).map((r) => r.youtube_id));
    const sources = new Set((existing || []).map((r) => r.source_blog_id).filter(Boolean));

    const imported: { title: string; slug: string; status: string }[] = [];
    const skipped: { title: string; reason: string }[] = [];
    const slugsToRefresh: string[] = [];

    for (const b of candidates) {
      const title = String(b.title || b.id);
      if (sources.has(String(b.id))) { skipped.push({ title, reason: "already imported" }); continue; }
      const conv = videoRowFromBlog(b);
      if (!conv.ok) { skipped.push({ title, reason: conv.reason }); continue; }
      if (ytIds.has(conv.row.youtube_id as string)) { skipped.push({ title, reason: "this YouTube video is already on the list" }); continue; }

      let slug = conv.row.slug as string;
      for (let n = 2; slugs.has(slug); n++) slug = `${conv.row.slug}-${n}`;
      const row = { id: newId(), ...conv.row, slug };
      const { error: insErr } = await supabaseServer.from("video_posts").insert([row]);
      if (insErr) { skipped.push({ title, reason: "could not be saved" }); continue; }

      slugs.add(slug); ytIds.add(conv.row.youtube_id as string); sources.add(String(b.id));
      imported.push({ title, slug, status: String(conv.row.status) });
      slugsToRefresh.push(slug);

      if (withRedirects && conv.row.status === "published") {
        const newPath = `/blog/video-transcripts/${slug}`;
        // the old post may be reached by its id (what the sitemap lists) or by its slug
        for (const key of Array.from(new Set([String(b.id), b.slug ? String(b.slug) : ""].filter(Boolean)))) {
          const oldPath = `/blog/${key}`;
          if (oldPath !== newPath) {
            await supabaseServer.from("redirects").upsert({ source_path: oldPath, target_path: newPath, status_code: 301 }, { onConflict: "source_path" });
          }
        }
      }
    }
    invalidateServerCache("videos_");
    revalidateVideos(slugsToRefresh);
    return NextResponse.json({ success: true, imported, skipped, redirects: withRedirects });
  } catch {
    return NextResponse.json({ success: false, error: "Import failed" }, { status: 500 });
  }
}
