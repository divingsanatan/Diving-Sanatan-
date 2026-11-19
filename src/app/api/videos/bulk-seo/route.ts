import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/utils/supabaseServer";
import { invalidateServerCache } from "@/utils/serverCache";
import { requireStaff } from "@/utils/authSession";
import { blanksForVideo } from "@/lib/videoServer";
import { mapVideoRow } from "@/lib/videoShared";
import { revalidateVideos } from "@/lib/videoRevalidate";

export const dynamic = "force-dynamic";

/** Fills EMPTY basics (summary, SEO title/description, focus keyword, related videos) for every video. Never overwrites. */
export async function POST(req: NextRequest) {
  const auth = requireStaff(req);
  if (!auth.ok) return auth.response;

  const { data, error } = await supabaseServer.from("video_posts").select("*").order("created_at", { ascending: true }).limit(2000);
  if (error) return NextResponse.json({ success: false, error: "Could not load videos." }, { status: 500 });

  const all = (data || []).map(mapVideoRow);
  let updated = 0;
  for (const v of all) {
    const patch = blanksForVideo(v, all);
    if (Object.keys(patch).length === 0) continue;
    const { error: upErr } = await supabaseServer.from("video_posts").update(patch).eq("id", v.id);
    if (!upErr) updated += 1;
  }
  invalidateServerCache("videos_");
  revalidateVideos(all.map((v) => v.slug));
  return NextResponse.json({ success: true, updated, total: all.length });
}
