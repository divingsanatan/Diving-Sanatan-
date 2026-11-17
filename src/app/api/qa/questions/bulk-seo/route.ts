import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/utils/supabaseServer";
import { invalidateServerCache } from "@/utils/serverCache";
import { requireStaff } from "@/utils/authSession";
import { blanksForQuestion } from "@/lib/qaServer";
import { isAnswered, mapQaRow } from "@/lib/qaShared";
import { revalidateQa } from "@/lib/qaRevalidate";

export const dynamic = "force-dynamic";

/**
 * Fills EMPTY basics (quick answer, SEO title/description, focus keyword, related questions) for every
 * ANSWERED question. Anything already written is never touched. Unanswered questions are skipped.
 */
export async function POST(req: NextRequest) {
  const auth = requireStaff(req);
  if (!auth.ok) return auth.response;

  const { data, error } = await supabaseServer.from("qa_questions").select("*").order("created_at", { ascending: true }).limit(3000);
  if (error) return NextResponse.json({ success: false, error: "Could not load questions." }, { status: 500 });

  const all = (data || []).map((r) => mapQaRow(r, false));
  const answered = all.filter(isAnswered);
  let updated = 0;
  for (const q of answered) {
    const patch = blanksForQuestion(q, all);
    if (Object.keys(patch).length === 0) continue;
    const { error: upErr } = await supabaseServer.from("qa_questions").update(patch).eq("id", q.id);
    if (!upErr) updated += 1;
  }
  invalidateServerCache("qa_");
  revalidateQa(answered.map((q) => q.slug));
  return NextResponse.json({ success: true, updated, total: answered.length });
}
