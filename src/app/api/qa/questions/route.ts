import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/utils/supabaseServer";
import { getOrSetServerCache, invalidateServerCache } from "@/utils/serverCache";
import { STAFF_ROLES, requirePanel, requireStaff, requireUser } from "@/utils/authSession";
import { allow } from "@/utils/rateLimit";
import {
  MAX_QUESTIONS_PER_DAY,
  allowedCategories,
  countRecent,
  getCommentCounts,
  getPublishedQuestions,
  parseAskInput,
  parseQuestionAdminInput,
} from "@/lib/qaServer";
import { mapQaRow, publicName } from "@/lib/qaShared";
import { revalidateQa } from "@/lib/qaRevalidate";

export const dynamic = "force-dynamic";

const newId = () => `qa-${Math.random().toString(36).substring(2, 10)}${Date.now().toString(36).slice(-3)}`;

/**
 * Public: LIVE questions only, with public-safe fields (no asker ids, no private notes).
 * ?mine=1  a signed-in visitor's own questions (so they can see "awaiting approval").
 * ?all=1   healers and staff: every question. Only staff receive the private moderation fields.
 */
export async function GET(req: NextRequest) {
  try {
    const params = new URL(req.url).searchParams;

    if (params.get("all") === "1") {
      const auth = requirePanel(req);
      if (!auth.ok) return auth.response;
      const staff = STAFF_ROLES.includes(auth.user.role);
      const { data, error } = await supabaseServer.from("qa_questions").select("*").order("created_at", { ascending: false }).limit(3000);
      if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500 });
      const counts = await getCommentCounts();
      return NextResponse.json(
        { success: true, data: (data || []).map((r) => ({ ...mapQaRow(r, staff), commentCount: counts.get(r.id) || 0 })) },
        { headers: { "Cache-Control": "no-store" } }
      );
    }

    if (params.get("mine") === "1") {
      const auth = requireUser(req);
      if (!auth.ok) return auth.response;
      const { data, error } = await supabaseServer
        .from("qa_questions")
        .select("id, slug, title, status, answer, created_at")
        .eq("asked_by_profile_id", auth.user.id)
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) return NextResponse.json({ success: false, error: "Could not load your questions." }, { status: 500 });
      return NextResponse.json(
        { success: true, data: (data || []).map((r) => ({ id: r.id, slug: r.slug, title: r.title, status: r.status, answered: !!String(r.answer || "").trim(), createdAt: r.created_at })) },
        { headers: { "Cache-Control": "no-store" } }
      );
    }

    const data = await getOrSetServerCache("qa_published", 60, () => getPublishedQuestions());
    return NextResponse.json({ success: true, data }, { headers: { "Cache-Control": "public, max-age=60, s-maxage=300, stale-while-revalidate=600" } });
  } catch (err: unknown) {
    return NextResponse.json({ success: false, error: err instanceof Error ? err.message : "Failed to read questions" }, { status: 500 });
  }
}

/**
 * A signed-in visitor asks a question: it is saved as PENDING and stays private until staff approve it.
 * Staff can also write a complete Q&A themselves by sending { admin: true, ... }.
 */
export async function POST(req: NextRequest) {
  const auth = requireUser(req);
  if (!auth.ok) return auth.response;
  const user = auth.user;
  try {
    const body = await req.json().catch(() => null);

    if (STAFF_ROLES.includes(user.role) && body && body.admin === true) {
      const parsed = parseQuestionAdminInput(body, false, user.role, STAFF_ROLES);
      if (!parsed.ok) return NextResponse.json({ success: false, error: parsed.errors.join(" ") }, { status: 400 });
      const row = { ...parsed.row, source: "staff" } as Record<string, unknown>;
      if (typeof row.answer === "string" && row.answer.replace(/<[^>]*>/g, "").trim()) row.answered_at = new Date().toISOString();
      const { data, error } = await supabaseServer.from("qa_questions").insert([{ id: newId(), ...row }]).select().single();
      if (error) {
        if (error.code === "23505") return NextResponse.json({ success: false, error: "That page address is already used by another question." }, { status: 409 });
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
      }
      invalidateServerCache("qa_");
      revalidateQa([data.slug]);
      return NextResponse.json({ success: true, data: mapQaRow(data, true) }, { status: 201 });
    }

    // visitor: speed bump first, then a daily limit that survives restarts
    if (!allow(`qa-ask:${user.id}`, 3, 10 * 60 * 1000)) {
      return NextResponse.json({ success: false, error: "You are asking too quickly. Please wait a few minutes." }, { status: 429 });
    }
    if ((await countRecent("qa_questions", "asked_by_profile_id", user.id)) >= MAX_QUESTIONS_PER_DAY) {
      return NextResponse.json({ success: false, error: `You can ask up to ${MAX_QUESTIONS_PER_DAY} questions a day. Please try again tomorrow.` }, { status: 429 });
    }
    const parsed = parseAskInput(body, await allowedCategories());
    if (!parsed.ok) return NextResponse.json({ success: false, error: parsed.errors.join(" ") }, { status: 400 });

    const anonymous = parsed.row.anonymous === true;
    const { data, error } = await supabaseServer
      .from("qa_questions")
      .insert([
        {
          id: newId(),
          ...parsed.row, // title, description, category, anonymous only. Slug is generated by the database.
          source: "member",
          status: "pending",
          asked_by_profile_id: user.id, // always the verified session, never taken from the request
          asked_by_name: anonymous ? "" : publicName(user.name || user.email || ""),
        },
      ])
      .select("id, title, status")
      .single();
    if (error) return NextResponse.json({ success: false, error: "Could not save your question. Please try again." }, { status: 500 });
    return NextResponse.json({ success: true, data: { id: data.id, title: data.title, status: data.status } }, { status: 201 });
  } catch {
    return NextResponse.json({ success: false, error: "Failed to save the question" }, { status: 500 });
  }
}

/** Healers and staff. Healers can only change the ANSWER fields; staff can change everything. */
export async function PUT(req: NextRequest) {
  const auth = requirePanel(req);
  if (!auth.ok) return auth.response;
  const user = auth.user;
  const staff = STAFF_ROLES.includes(user.role);
  try {
    const body = await req.json().catch(() => null);
    const id = body && typeof body.id === "string" ? body.id : "";
    if (!id) return NextResponse.json({ success: false, error: "Question ID is required" }, { status: 400 });

    const parsed = parseQuestionAdminInput(body, true, user.role, STAFF_ROLES);
    if (!parsed.ok) return NextResponse.json({ success: false, error: parsed.errors.join(" ") }, { status: 400 });

    const { data: existing } = await supabaseServer.from("qa_questions").select("id, slug, status, answer, answered_at, answerer_name").eq("id", id).maybeSingle();
    if (!existing) return NextResponse.json({ success: false, error: "Question not found." }, { status: 404 });
    if (!staff && existing.status === "rejected") return NextResponse.json({ success: false, error: "This question was rejected." }, { status: 403 });

    const row = { ...parsed.row } as Record<string, unknown>;
    // answered_at follows the answer: stamped the first time one is written, cleared if it is removed
    if ("answer" in row) {
      const hasAnswer = !!String(row.answer || "").replace(/<[^>]*>/g, "").trim();
      if (hasAnswer && !existing.answered_at) row.answered_at = new Date().toISOString();
      if (!hasAnswer) row.answered_at = null;
      // a healer who forgets to sign their answer is credited by their account name
      if (hasAnswer && !String(row.answerer_name ?? existing.answerer_name ?? "").trim() && user.name) row.answerer_name = user.name;
    }

    const { data, error } = await supabaseServer.from("qa_questions").update(row).eq("id", id).select().single();
    if (error) {
      if (error.code === "23505") return NextResponse.json({ success: false, error: "That page address is already used by another question." }, { status: 409 });
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    const slugChanged = existing.slug !== data.slug;
    if (slugChanged) {
      await supabaseServer.from("redirects").delete().eq("source_path", `/blog/quora-qa/${data.slug}`);
      if (existing.status === "published") {
        await supabaseServer
          .from("redirects")
          .upsert({ source_path: `/blog/quora-qa/${existing.slug}`, target_path: `/blog/quora-qa/${data.slug}`, status_code: 301 }, { onConflict: "source_path" });
      }
    }
    invalidateServerCache("qa_");
    revalidateQa([existing.slug, data.slug]);
    return NextResponse.json({ success: true, data: mapQaRow(data, staff), redirectCreated: slugChanged && existing.status === "published" });
  } catch {
    return NextResponse.json({ success: false, error: "Failed to update the question" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const auth = requireStaff(req);
  if (!auth.ok) return auth.response;
  try {
    const id = new URL(req.url).searchParams.get("id");
    if (!id) return NextResponse.json({ success: false, error: "Question ID is required" }, { status: 400 });
    const { data, error } = await supabaseServer.from("qa_questions").delete().eq("id", id).select("slug").maybeSingle();
    if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    invalidateServerCache("qa_");
    revalidateQa(data?.slug ? [data.slug] : []);
    return NextResponse.json({ success: true, message: "Question removed." });
  } catch {
    return NextResponse.json({ success: false, error: "Failed to delete the question" }, { status: 500 });
  }
}

