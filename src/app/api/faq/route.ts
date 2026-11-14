import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/utils/supabaseServer";
import { getOrSetServerCache, invalidateServerCache } from "@/utils/serverCache";
import { PANEL_ROLES, getSession, requireStaff } from "@/utils/authSession";
import { parseFaqInput } from "@/lib/faqServer";
import { mapFaqRow } from "@/lib/faqShared";
import { revalidateFaq } from "@/lib/faqRevalidate";

export const dynamic = "force-dynamic";

/**
 * Public: PUBLISHED FAQs only (drafts are never returned).
 * Staff may add ?all=1 to also receive drafts (used by the admin screen).
 * Each item still carries the old fields (id, question, answer, verified, isPublished, createdAt)
 * plus the new SEO fields, so existing consumers keep working.
 */
export async function GET(req: NextRequest) {
  try {
    const wantAll = new URL(req.url).searchParams.get("all") === "1";
    const session = getSession(req);
    const staff = !!session && PANEL_ROLES.includes(session.role);

    if (wantAll && staff) {
      const { data, error } = await supabaseServer
        .from("faqs")
        .select("*")
        .order("created_at", { ascending: true })
        .limit(2000);
      if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500 });
      return NextResponse.json(
        { success: true, data: (data || []).map(mapFaqRow) },
        { headers: { "Cache-Control": "no-store" } }
      );
    }

    const data = await getOrSetServerCache("faqs_published", 60, async () => {
      const { data: dbData, error } = await supabaseServer
        .from("faqs")
        .select("*")
        .eq("status", "published")
        .order("created_at", { ascending: true })
        .limit(2000);
      if (error) throw new Error(error.message);
      return (dbData || []).map(mapFaqRow);
    });

    return NextResponse.json(
      { success: true, data },
      { headers: { "Cache-Control": "public, max-age=60, s-maxage=300, stale-while-revalidate=600" } }
    );
  } catch (err: unknown) {
    return NextResponse.json({ success: false, error: err instanceof Error ? err.message : "Failed to read FAQ items" }, { status: 500 });
  }
}

function newId() {
  return `faq-${Math.random().toString(36).substring(2, 9)}`;
}

export async function POST(req: NextRequest) {
  const auth = requireStaff(req);
  if (!auth.ok) return auth.response;
  try {
    const body = await req.json().catch(() => null);
    const parsed = parseFaqInput(body, false);
    if (!parsed.ok) return NextResponse.json({ success: false, error: parsed.errors.join(" ") }, { status: 400 });

    const { data, error } = await supabaseServer
      .from("faqs")
      .insert([{ id: newId(), ...parsed.row }])
      .select()
      .single();
    if (error) {
      if (error.code === "23505") {
        return NextResponse.json({ success: false, error: "That page address is already used by another FAQ." }, { status: 409 });
      }
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
    const entry = mapFaqRow(data);
    invalidateServerCache("faqs_");
    revalidateFaq([entry.slug]);
    return NextResponse.json({ success: true, data: entry }, { status: 201 });
  } catch {
    return NextResponse.json({ success: false, error: "Failed to create FAQ item" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  const auth = requireStaff(req);
  if (!auth.ok) return auth.response;
  try {
    const body = await req.json().catch(() => null);
    const id = body && typeof body.id === "string" ? body.id : "";
    if (!id) return NextResponse.json({ success: false, error: "FAQ ID is required" }, { status: 400 });

    const parsed = parseFaqInput(body, true);
    if (!parsed.ok) return NextResponse.json({ success: false, error: parsed.errors.join(" ") }, { status: 400 });

    const { data: existing } = await supabaseServer.from("faqs").select("id, slug, status").eq("id", id).maybeSingle();
    if (!existing) return NextResponse.json({ success: false, error: "FAQ not found." }, { status: 404 });

    const { data, error } = await supabaseServer
      .from("faqs")
      .update({ ...parsed.row, updated_at: new Date().toISOString() })
      .eq("id", id)
      .select()
      .single();
    if (error) {
      if (error.code === "23505") {
        return NextResponse.json({ success: false, error: "That page address is already used by another FAQ." }, { status: 409 });
      }
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    const entry = mapFaqRow(data);
    const slugChanged = existing.slug !== entry.slug;
    if (slugChanged) {
      // Keep old links and rankings alive with a permanent redirect
      await supabaseServer.from("redirects").delete().eq("source_path", `/blog/faq/${entry.slug}`);
      if (existing.status === "published") {
        await supabaseServer
          .from("redirects")
          .upsert(
            { source_path: `/blog/faq/${existing.slug}`, target_path: `/blog/faq/${entry.slug}`, status_code: 301 },
            { onConflict: "source_path" }
          );
      }
    }
    invalidateServerCache("faqs_");
    revalidateFaq([existing.slug, entry.slug]);
    return NextResponse.json({ success: true, data: entry, redirectCreated: slugChanged && existing.status === "published" });
  } catch {
    return NextResponse.json({ success: false, error: "Failed to update FAQ item" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const auth = requireStaff(req);
  if (!auth.ok) return auth.response;
  try {
    const id = new URL(req.url).searchParams.get("id");
    if (!id) return NextResponse.json({ success: false, error: "FAQ ID is required" }, { status: 400 });
    const { data, error } = await supabaseServer.from("faqs").delete().eq("id", id).select("slug").maybeSingle();
    if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    invalidateServerCache("faqs_");
    revalidateFaq(data?.slug ? [data.slug] : []);
    return NextResponse.json({ success: true, message: "FAQ item removed successfully" });
  } catch {
    return NextResponse.json({ success: false, error: "Failed to delete FAQ item" }, { status: 500 });
  }
}
