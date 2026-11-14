import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/utils/supabaseServer";
import { invalidateServerCache } from "@/utils/serverCache";
import { requireStaff } from "@/utils/authSession";
import { blanksFor } from "@/lib/faqServer";
import { mapFaqRow } from "@/lib/faqShared";
import { revalidateFaq } from "@/lib/faqRevalidate";

export const dynamic = "force-dynamic";

/**
 * Fills EMPTY basics (quick answer, SEO title/description, focus keyword, related questions)
 * for every FAQ. Anything you have already written is never touched.
 */
export async function POST(req: NextRequest) {
  const auth = requireStaff(req);
  if (!auth.ok) return auth.response;

  const { data, error } = await supabaseServer.from("faqs").select("*").order("created_at", { ascending: true }).limit(2000);
  if (error) return NextResponse.json({ success: false, error: "Could not load FAQs." }, { status: 500 });

  const all = (data || []).map(mapFaqRow);
  let updated = 0;
  for (const e of all) {
    const patch = blanksFor(e, all);
    if (Object.keys(patch).length === 0) continue;
    const { error: upErr } = await supabaseServer
      .from("faqs")
      .update({ ...patch, updated_at: new Date().toISOString() })
      .eq("id", e.id);
    if (!upErr) updated += 1;
  }
  invalidateServerCache("faqs_");
  revalidateFaq(all.map((e) => e.slug));
  return NextResponse.json({ success: true, updated, total: all.length });
}
