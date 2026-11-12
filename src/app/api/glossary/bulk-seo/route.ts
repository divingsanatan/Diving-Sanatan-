import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/utils/supabaseServer";
import { requireStaff } from "@/utils/authSession";
import { blanksFor } from "@/lib/glossaryServer";
import { mapGlossaryRow } from "@/lib/glossaryShared";
import { revalidateGlossary } from "@/lib/glossaryRevalidate";

export const dynamic = "force-dynamic";

/**
 * Fills EMPTY basics (quick answer, SEO title/description, keyword, image alt, related terms)
 * for every term. Anything you have already written is never touched.
 */
export async function POST(req: NextRequest) {
  const auth = requireStaff(req);
  if (!auth.ok) return auth.response;

  const { data, error } = await supabaseServer.from("glossary_terms").select("*").order("word", { ascending: true }).limit(2000);
  if (error) return NextResponse.json({ success: false, error: "Could not load terms." }, { status: 500 });

  const all = (data || []).map(mapGlossaryRow);
  let updated = 0;
  for (const e of all) {
    const patch = blanksFor(e, all);
    if (Object.keys(patch).length === 0) continue;
    const { error: upErr } = await supabaseServer
      .from("glossary_terms")
      .update({ ...patch, updated_at: new Date().toISOString() })
      .eq("id", e.id);
    if (!upErr) updated += 1;
  }
  revalidateGlossary(all.map((e) => e.slug));
  return NextResponse.json({ success: true, updated, total: all.length });
}
