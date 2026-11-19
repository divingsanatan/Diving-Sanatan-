import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/utils/supabaseServer";
import { getOrSetServerCache, invalidateServerCache } from "@/utils/serverCache";
import { requireStaff, getSession, STAFF_ROLES } from "@/utils/authSession";
import { getPublishedVideos, parseVideoInput } from "@/lib/videoServer";
import { mapVideoRow } from "@/lib/videoShared";
import { revalidateVideos } from "@/lib/videoRevalidate";

export const dynamic = "force-dynamic";

const newId = () => `vid-${Math.random().toString(36).substring(2, 10)}${Date.now().toString(36).slice(-3)}`;

/** One conflict message for the two unique rules (page address, YouTube video). */
const conflictMessage = (error: { message?: string; details?: string }) =>
  /youtube_id/.test(`${error.message} ${error.details}`)
    ? "That YouTube video is already on the list."
    : "That page address is already used by another video.";

/** Only one video can be the featured one at the top of the page. */
async function keepSingleFeatured(id: string) {
  await supabaseServer.from("video_posts").update({ featured: false }).eq("featured", true).neq("id", id);
}

/** Public: PUBLISHED videos only. Staff may add ?all=1 to also receive drafts (admin screen). */
export async function GET(req: NextRequest) {
  try {
    const wantAll = new URL(req.url).searchParams.get("all") === "1";
    const session = getSession(req);
    const staff = !!session && STAFF_ROLES.includes(session.role);

    if (wantAll && staff) {
      const { data, error } = await supabaseServer.from("video_posts").select("*").order("created_at", { ascending: false }).limit(2000);
      if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500 });
      return NextResponse.json({ success: true, data: (data || []).map(mapVideoRow) }, { headers: { "Cache-Control": "no-store" } });
    }
    const data = await getOrSetServerCache("videos_published", 60, () => getPublishedVideos());
    return NextResponse.json({ success: true, data }, { headers: { "Cache-Control": "public, max-age=60, s-maxage=300, stale-while-revalidate=600" } });
  } catch (err: unknown) {
    return NextResponse.json({ success: false, error: err instanceof Error ? err.message : "Failed to read videos" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const auth = requireStaff(req);
  if (!auth.ok) return auth.response;
  try {
    const parsed = parseVideoInput(await req.json().catch(() => null), false);
    if (!parsed.ok) return NextResponse.json({ success: false, error: parsed.errors.join(" ") }, { status: 400 });
    const { data, error } = await supabaseServer.from("video_posts").insert([{ id: newId(), ...parsed.row }]).select().single();
    if (error) {
      if (error.code === "23505") return NextResponse.json({ success: false, error: conflictMessage(error) }, { status: 409 });
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
    if (parsed.row.featured === true) await keepSingleFeatured(data.id);
    invalidateServerCache("videos_");
    revalidateVideos([data.slug]);
    return NextResponse.json({ success: true, data: mapVideoRow(data) }, { status: 201 });
  } catch {
    return NextResponse.json({ success: false, error: "Failed to create the video" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  const auth = requireStaff(req);
  if (!auth.ok) return auth.response;
  try {
    const body = await req.json().catch(() => null);
    const id = body && typeof body.id === "string" ? body.id : "";
    if (!id) return NextResponse.json({ success: false, error: "Video ID is required" }, { status: 400 });

    const parsed = parseVideoInput(body, true);
    if (!parsed.ok) return NextResponse.json({ success: false, error: parsed.errors.join(" ") }, { status: 400 });

    const { data: existing } = await supabaseServer.from("video_posts").select("id, slug, status").eq("id", id).maybeSingle();
    if (!existing) return NextResponse.json({ success: false, error: "Video not found." }, { status: 404 });

    const { data, error } = await supabaseServer.from("video_posts").update(parsed.row).eq("id", id).select().single();
    if (error) {
      if (error.code === "23505") return NextResponse.json({ success: false, error: conflictMessage(error) }, { status: 409 });
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    const slugChanged = existing.slug !== data.slug;
    if (slugChanged) {
      await supabaseServer.from("redirects").delete().eq("source_path", `/blog/video-transcripts/${data.slug}`);
      if (existing.status === "published") {
        await supabaseServer
          .from("redirects")
          .upsert({ source_path: `/blog/video-transcripts/${existing.slug}`, target_path: `/blog/video-transcripts/${data.slug}`, status_code: 301 }, { onConflict: "source_path" });
      }
    }
    if (parsed.row.featured === true) await keepSingleFeatured(id);
    invalidateServerCache("videos_");
    revalidateVideos([existing.slug, data.slug]);
    return NextResponse.json({ success: true, data: mapVideoRow(data), redirectCreated: slugChanged && existing.status === "published" });
  } catch {
    return NextResponse.json({ success: false, error: "Failed to update the video" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const auth = requireStaff(req);
  if (!auth.ok) return auth.response;
  try {
    const id = new URL(req.url).searchParams.get("id");
    if (!id) return NextResponse.json({ success: false, error: "Video ID is required" }, { status: 400 });
    const { data, error } = await supabaseServer.from("video_posts").delete().eq("id", id).select("slug").maybeSingle();
    if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    invalidateServerCache("videos_");
    revalidateVideos(data?.slug ? [data.slug] : []);
    return NextResponse.json({ success: true, message: "Video removed." });
  } catch {
    return NextResponse.json({ success: false, error: "Failed to delete the video" }, { status: 500 });
  }
}
