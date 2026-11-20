import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/utils/supabaseServer";
import { invalidateServerCache } from "@/utils/serverCache";
import { STAFF_ROLES, PANEL_ROLES, requireStaff, requireUser } from "@/utils/authSession";
import { allow } from "@/utils/rateLimit";
import { COMMENTS_NEED_APPROVAL, MAX_COMMENTS_PER_DAY, countRecent, getPublishedComments, parseCommentInput } from "@/lib/qaServer";
import { mapQaComment, publicName } from "@/lib/qaShared";
import { revalidateQa } from "@/lib/qaRevalidate";

export const dynamic = "force-dynamic";

const newId = () => `qc-${Math.random().toString(36).substring(2, 10)}${Date.now().toString(36).slice(-3)}`;

/**
 * Public: ?questionId=...  the APPROVED comments of one question (no ids of who wrote them).
 * Staff:  ?all=1&status=pending  the moderation queue (default status: pending).
 */
export async function GET(req: NextRequest) {
  try {
    const params = new URL(req.url).searchParams;

    if (params.get("all") === "1") {
      const auth = requireStaff(req);
      if (!auth.ok) return auth.response;
      const status = ["pending", "published", "rejected"].includes(params.get("status") || "") ? (params.get("status") as string) : "pending";
      const { data, error } = await supabaseServer.from("qa_comments").select("*").eq("status", status).order("created_at", { ascending: false }).limit(300);
      if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500 });
      const ids = Array.from(new Set((data || []).map((c) => c.question_id)));
      const titles = new Map<string, { title: string; slug: string }>();
      if (ids.length) {
        const { data: qs } = await supabaseServer.from("qa_questions").select("id, title, slug").in("id", ids);
        for (const q of qs || []) titles.set(q.id, { title: q.title, slug: q.slug });
      }
      return NextResponse.json(
        { success: true, data: (data || []).map((c) => ({ ...mapQaComment(c), questionTitle: titles.get(c.question_id)?.title || "", questionSlug: titles.get(c.question_id)?.slug || "" })) },
        { headers: { "Cache-Control": "no-store" } }
      );
    }

    const questionId = params.get("questionId") || "";
    if (!questionId) return NextResponse.json({ success: false, error: "questionId is required" }, { status: 400 });
    const { data: q } = await supabaseServer.from("qa_questions").select("id").eq("id", questionId).eq("status", "published").maybeSingle();
    if (!q) return NextResponse.json({ success: true, data: [] });
    return NextResponse.json({ success: true, data: await getPublishedComments(questionId) }, { headers: { "Cache-Control": "public, max-age=30, s-maxage=60, stale-while-revalidate=300" } });
  } catch (err: unknown) {
    return NextResponse.json({ success: false, error: err instanceof Error ? err.message : "Failed to read comments" }, { status: 500 });
  }
}

/** A signed-in visitor comments. Healer and staff comments go live straight away; visitor comments wait for approval. */
export async function POST(req: NextRequest) {
  const auth = requireUser(req);
  if (!auth.ok) return auth.response;
  const user = auth.user;
  try {
    const parsed = parseCommentInput(await req.json().catch(() => null));
    if (!parsed.ok) return NextResponse.json({ success: false, error: parsed.errors.join(" ") }, { status: 400 });

    const panel = PANEL_ROLES.includes(user.role);
    if (!allow(`qa-comment:${user.id}`, 5, 5 * 60 * 1000)) {
      return NextResponse.json({ success: false, error: "You are commenting too quickly. Please wait a few minutes." }, { status: 429 });
    }
    if (!panel && (await countRecent("qa_comments", "profile_id", user.id)) >= MAX_COMMENTS_PER_DAY) {
      return NextResponse.json({ success: false, error: `You can post up to ${MAX_COMMENTS_PER_DAY} comments a day.` }, { status: 429 });
    }

    const { data: question } = await supabaseServer.from("qa_questions").select("id, slug, status").eq("id", parsed.questionId).maybeSingle();
    if (!question || (question.status !== "published" && !panel)) {
      return NextResponse.json({ success: false, error: "That question is not open for comments." }, { status: 404 });
    }

    // Replies: one level only, and only to a comment that is already live on the same question
    let parentId: string | null = null;
    if (parsed.parentId) {
      const { data: parent } = await supabaseServer.from("qa_comments").select("id, question_id, parent_id, status").eq("id", parsed.parentId).maybeSingle();
      if (!parent || parent.question_id !== question.id || parent.parent_id || parent.status !== "published") {
        return NextResponse.json({ success: false, error: "You can only reply to a visible comment." }, { status: 400 });
      }
      parentId = parent.id;
    }

    const role = STAFF_ROLES.includes(user.role) ? "staff" : user.role === "guru" ? "healer" : "member";
    const status = role !== "member" || !COMMENTS_NEED_APPROVAL ? "published" : "pending";
    const { data, error } = await supabaseServer
      .from("qa_comments")
      .insert([
        {
          id: newId(),
          question_id: question.id,
          parent_id: parentId,
          profile_id: user.id, // always the verified session, never taken from the request
          author_name: role === "member" ? publicName(user.name || user.email || "") || "Member" : user.name || "Diving Sanatan",
          author_role: role,
          body: parsed.text,
          body_format: "html",
          status,
        },
      ])
      .select()
      .single();
    if (error) return NextResponse.json({ success: false, error: "Could not save your comment. Please try again." }, { status: 500 });
    if (status === "published") {
      invalidateServerCache("qa_");
      revalidateQa([question.slug]);
    }
    return NextResponse.json({ success: true, data: mapQaComment(data), awaitingApproval: status === "pending" }, { status: 201 });
  } catch {
    return NextResponse.json({ success: false, error: "Failed to save the comment" }, { status: 500 });
  }
}

/** Staff: approve or reject a comment. */
export async function PUT(req: NextRequest) {
  const auth = requireStaff(req);
  if (!auth.ok) return auth.response;
  try {
    const body = await req.json().catch(() => null);
    const id = body && typeof body.id === "string" ? body.id : "";
    const status = body && typeof body.status === "string" ? body.status : "";
    if (!id || !["pending", "published", "rejected"].includes(status)) {
      return NextResponse.json({ success: false, error: "A comment ID and a valid status are required." }, { status: 400 });
    }
    const { data, error } = await supabaseServer.from("qa_comments").update({ status }).eq("id", id).select("*, qa_questions(slug)").single();
    if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    invalidateServerCache("qa_");
    revalidateQa([(data as { qa_questions?: { slug?: string } }).qa_questions?.slug || ""]);
    return NextResponse.json({ success: true, data: mapQaComment(data) });
  } catch {
    return NextResponse.json({ success: false, error: "Failed to update the comment" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const auth = requireStaff(req);
  if (!auth.ok) return auth.response;
  try {
    const id = new URL(req.url).searchParams.get("id");
    if (!id) return NextResponse.json({ success: false, error: "Comment ID is required" }, { status: 400 });
    const { data, error } = await supabaseServer.from("qa_comments").delete().eq("id", id).select("question_id").maybeSingle();
    if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    let slug = "";
    if (data?.question_id) {
      const { data: q } = await supabaseServer.from("qa_questions").select("slug").eq("id", data.question_id).maybeSingle();
      slug = q?.slug || "";
    }
    invalidateServerCache("qa_");
    revalidateQa([slug]);
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ success: false, error: "Failed to delete the comment" }, { status: 500 });
  }
}
