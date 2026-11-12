import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/utils/supabaseServer";
import { PANEL_ROLES, getSession, requireStaff } from "@/utils/authSession";
import { blanksFor, parseGlossaryInput } from "@/lib/glossaryServer";
import { mapGlossaryRow } from "@/lib/glossaryShared";
import { revalidateGlossary } from "@/lib/glossaryRevalidate";

export const dynamic = "force-dynamic";

/**
 * Public: published terms only.
 * Staff may add ?all=1 to also receive drafts (used by the admin screen).
 */
export async function GET(req: NextRequest) {
  try {
    const wantAll = new URL(req.url).searchParams.get("all") === "1";
    const session = getSession(req);
    const staff = !!session && PANEL_ROLES.includes(session.role);

    let query = supabaseServer.from("glossary_terms").select("*").order("word", { ascending: true }).limit(2000);
    if (!(wantAll && staff)) query = query.eq("status", "published");
    const { data, error } = await query;
    if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    return NextResponse.json({ success: true, data: (data || []).map(mapGlossaryRow) });
  } catch {
    return NextResponse.json({ success: false, error: "Failed to read glossary terms" }, { status: 500 });
  }
}

function newId() {
  return `gloss-${Math.random().toString(36).substring(2, 9)}`;
}

export async function POST(req: NextRequest) {
  const auth = requireStaff(req);
  if (!auth.ok) return auth.response;
  try {
    const body = await req.json().catch(() => null);
    const parsed = parseGlossaryInput(body, false);
    if (!parsed.ok) return NextResponse.json({ success: false, error: parsed.errors.join(" ") }, { status: 400 });

    const { data, error } = await supabaseServer
      .from("glossary_terms")
      .insert([{ id: newId(), status: "published", ...parsed.row }])
      .select()
      .single();
    if (error) {
      if (error.code === "23505") {
        return NextResponse.json({ success: false, error: "That page address is already used by another term." }, { status: 409 });
      }
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
    const entry = mapGlossaryRow(data);
    revalidateGlossary([entry.slug]);
    return NextResponse.json({ success: true, data: entry }, { status: 201 });
  } catch {
    return NextResponse.json({ success: false, error: "Failed to create glossary term" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  const auth = requireStaff(req);
  if (!auth.ok) return auth.response;
  try {
    const body = await req.json().catch(() => null);
    const id = body && typeof body.id === "string" ? body.id : "";
    if (!id) return NextResponse.json({ success: false, error: "Term ID is required" }, { status: 400 });

    const parsed = parseGlossaryInput(body, true);
    if (!parsed.ok) return NextResponse.json({ success: false, error: parsed.errors.join(" ") }, { status: 400 });

    const { data: existing } = await supabaseServer.from("glossary_terms").select("id, slug, status").eq("id", id).maybeSingle();
    if (!existing) return NextResponse.json({ success: false, error: "Term not found." }, { status: 404 });

    const { data, error } = await supabaseServer
      .from("glossary_terms")
      .update({ ...parsed.row, updated_at: new Date().toISOString() })
      .eq("id", id)
      .select()
      .single();
    if (error) {
      if (error.code === "23505") {
        return NextResponse.json({ success: false, error: "That page address is already used by another term." }, { status: 409 });
      }
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    const entry = mapGlossaryRow(data);
    const slugChanged = existing.slug !== entry.slug;
    if (slugChanged) {
      // Keep old links and rankings alive with a permanent redirect
      await supabaseServer.from("redirects").delete().eq("source_path", `/blog/glossary/${entry.slug}`);
      if (existing.status === "published") {
        await supabaseServer
          .from("redirects")
          .upsert(
            { source_path: `/blog/glossary/${existing.slug}`, target_path: `/blog/glossary/${entry.slug}`, status_code: 301 },
            { onConflict: "source_path" }
          );
      }
    }
    revalidateGlossary([existing.slug, entry.slug]);
    return NextResponse.json({ success: true, data: entry, redirectCreated: slugChanged && existing.status === "published" });
  } catch {
    return NextResponse.json({ success: false, error: "Failed to update glossary term" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const auth = requireStaff(req);
  if (!auth.ok) return auth.response;
  try {
    const id = new URL(req.url).searchParams.get("id");
    if (!id) return NextResponse.json({ success: false, error: "Term ID is required" }, { status: 400 });
    const { data } = await supabaseServer.from("glossary_terms").delete().eq("id", id).select("slug").maybeSingle();
    revalidateGlossary(data?.slug ? [data.slug] : []);
    return NextResponse.json({ success: true, message: "Glossary term removed successfully" });
  } catch {
    return NextResponse.json({ success: false, error: "Failed to delete glossary term" }, { status: 500 });
  }
}

