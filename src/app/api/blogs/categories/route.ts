import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/utils/supabaseServer";
import { requirePanel } from "@/utils/authSession";
import { wantsAdminView, ADMIN_NO_STORE } from "@/utils/adminView";

/**
 * The ONE category list for all content: articles, video blogs, questions and glossary terms.
 * (The table is still called blog_categories. /api/glossary/categories points here too.)
 */

type Row = Record<string, unknown>;
const CONTENT_TABLES = [
  { key: "blog", table: "blogs", publishedFilter: ["approval_status", "published"] },
  { key: "video", table: "video_posts", publishedFilter: ["status", "published"] },
  { key: "qa", table: "qa_questions", publishedFilter: ["status", "published"] },
  { key: "glossary", table: "glossary_terms", publishedFilter: ["status", "published"] },
] as const;
type Counts = { blog: number; video: number; qa: number; glossary: number };

function mapCategory(row: Row, counts?: Counts) {
  return {
    id: row.id as string,
    name: row.name as string,
    createdAt: row.created_at as string | undefined,
    ...(counts ? { counts, total: counts.blog + counts.video + counts.qa + counts.glossary } : {}),
  };
}

/** How many pieces of each kind use each category name (all statuses, so nothing in use is ever deleted by accident). */
async function usageByName(publishedOnly: boolean): Promise<Map<string, Counts>> {
  const out = new Map<string, Counts>();
  await Promise.all(
    CONTENT_TABLES.map(async ({ key, table, publishedFilter }) => {
      let q = supabaseServer.from(table).select("category").limit(5000);
      if (publishedOnly) q = q.eq(publishedFilter[0], publishedFilter[1]);
      const { data } = await q;
      for (const r of (data || []) as { category?: string | null }[]) {
        const name = (r.category || "").trim().toLowerCase();
        if (!name) continue;
        const c = out.get(name) || { blog: 0, video: 0, qa: 0, glossary: 0 };
        c[key] += 1;
        out.set(name, c);
      }
    })
  );
  return out;
}

const zero: Counts = { blog: 0, video: 0, qa: 0, glossary: 0 };

export async function GET(req: NextRequest) {
  try {
    const adminView = wantsAdminView(req);

    let query = supabaseServer.from("blog_categories").select("*");
    if (!adminView) query = query.or("approval_status.eq.published,approval_status.is.null");
    const { data, error } = await query.order("name", { ascending: true });
    if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500 });

    // Public visitors see only what is published; the admin screen sees everything that uses a category.
    const usage = await usageByName(!adminView);
    return NextResponse.json(
      { success: true, data: (data || []).map((r) => mapCategory(r, usage.get(String(r.name).trim().toLowerCase()) || zero)) },
      adminView ? { headers: ADMIN_NO_STORE } : undefined
    );
  } catch {
    return NextResponse.json({ success: false, error: "Failed to read categories" }, { status: 500 });
  }
}

async function nameTaken(name: string, exceptId?: string): Promise<boolean> {
  const { data } = await supabaseServer.from("blog_categories").select("id, name").ilike("name", name.replace(/[%_]/g, " "));
  return (data || []).some((r) => r.id !== exceptId && String(r.name).trim().toLowerCase() === name.trim().toLowerCase());
}

export async function POST(req: NextRequest) {
  const auth = requirePanel(req);
  if (!auth.ok) return auth.response;
  try {
    const body = await req.json();
    const name = String(body?.name || "").trim().slice(0, 60);
    if (!name) return NextResponse.json({ success: false, error: "Category name is required" }, { status: 400 });
    if (await nameTaken(name)) return NextResponse.json({ success: false, error: `"${name}" already exists.` }, { status: 409 });

    const id = `bcat-${Math.random().toString(36).substring(2, 9)}`;
    const { data, error } = await supabaseServer
      .from("blog_categories")
      .insert([{ id, name, approval_status: body?.approval_status || "published" }])
      .select()
      .single();
    if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    return NextResponse.json({ success: true, data: mapCategory(data) }, { status: 201 });
  } catch {
    return NextResponse.json({ success: false, error: "Failed to create category" }, { status: 500 });
  }
}

/** Rename: every article, video, question and glossary term in the category moves to the new name. */
export async function PUT(req: NextRequest) {
  const auth = requirePanel(req);
  if (!auth.ok) return auth.response;
  try {
    const body = await req.json();
    const id = body?.id as string | undefined;
    const newName = String(body?.name || "").trim().slice(0, 60);
    if (!id || !newName) return NextResponse.json({ success: false, error: "Category ID and name are required" }, { status: 400 });

    const { data: old, error: fetchError } = await supabaseServer.from("blog_categories").select("name").eq("id", id).single();
    if (fetchError || !old) return NextResponse.json({ success: false, error: "Category not found" }, { status: 404 });
    if (await nameTaken(newName, id)) return NextResponse.json({ success: false, error: `"${newName}" already exists.` }, { status: 409 });

    const updates: Row = { name: newName };
    if (body?.approval_status) updates.approval_status = body.approval_status;
    const { data, error } = await supabaseServer.from("blog_categories").update(updates).eq("id", id).select().single();
    if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500 });

    if (old.name !== newName) {
      await Promise.all(CONTENT_TABLES.map(({ table }) => supabaseServer.from(table).update({ category: newName }).eq("category", old.name)));
    }
    return NextResponse.json({ success: true, data: mapCategory(data) });
  } catch {
    return NextResponse.json({ success: false, error: "Failed to update category" }, { status: 500 });
  }
}

/** Delete is refused while anything still uses the category, so no article, video, question or term is ever left without one. */
export async function DELETE(req: NextRequest) {
  const auth = requirePanel(req);
  if (!auth.ok) return auth.response;
  try {
    const id = new URL(req.url).searchParams.get("id");
    if (!id) return NextResponse.json({ success: false, error: "Category ID is required" }, { status: 400 });

    const { data: category, error: fetchError } = await supabaseServer.from("blog_categories").select("name").eq("id", id).single();
    if (fetchError || !category) return NextResponse.json({ success: false, error: "Category not found" }, { status: 404 });

    const c = (await usageByName(false)).get(String(category.name).trim().toLowerCase());
    const total = c ? c.blog + c.video + c.qa + c.glossary : 0;
    if (total > 0) {
      const parts = [c!.blog && `${c!.blog} article(s)`, c!.video && `${c!.video} video(s)`, c!.qa && `${c!.qa} question(s)`, c!.glossary && `${c!.glossary} glossary term(s)`].filter(Boolean).join(", ");
      return NextResponse.json({ success: false, error: `"${category.name}" is still used by ${parts}. Move them to another category first, or rename this category instead.` }, { status: 409 });
    }

    const { error } = await supabaseServer.from("blog_categories").delete().eq("id", id);
    if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    return NextResponse.json({ success: true, message: "Category removed successfully" });
  } catch {
    return NextResponse.json({ success: false, error: "Failed to delete category" }, { status: 500 });
  }
}
