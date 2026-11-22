import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/utils/supabaseServer";
import { requireStaff } from "@/utils/authSession";
import {
  deleteTopic,
  findUnassigned,
  getTopicAdmin,
  getTopicRefs,
  listTopicsAdmin,
  parseItemsInput,
  parseTopicInput,
  saveTopic,
  searchContent,
  setTopicItems,
  suggestForTopic,
} from "@/lib/topicsServer";
import { itemPath, topicPath, type TopicItemRef } from "@/lib/topicsShared";
import { revalidateTopics } from "@/lib/topicsRevalidate";

export const dynamic = "force-dynamic";

const NO_STORE = { "Cache-Control": "no-store" };
const fail = (error: string, status = 400) => NextResponse.json({ success: false, error }, { status, headers: NO_STORE });
const ok = (data: unknown) => NextResponse.json({ success: true, data }, { headers: NO_STORE });
const pathsOf = (refs: TopicItemRef[]) => refs.map((r) => itemPath(r.type, r.slug));

/**
 * Staff only. The public site reads topics on the server, so nothing here is public.
 *   ?list=1            all topics with member counts
 *   ?id=<id>           one topic with its members and publish checks
 *   ?search=<text>     find articles, questions, videos and glossary terms to add
 *   ?suggest=<id>      related content that is not in the topic yet
 *   ?gaps=1            published content that no topic links to
 */
export async function GET(req: NextRequest) {
  const auth = requireStaff(req);
  if (!auth.ok) return auth.response;
  try {
    const p = new URL(req.url).searchParams;
    if (p.get("list")) return ok(await listTopicsAdmin());
    if (p.get("id")) {
      const t = await getTopicAdmin(p.get("id")!);
      return t ? ok(t) : fail("Topic not found.", 404);
    }
    if (p.get("search") !== null) return ok(await searchContent(p.get("search") || ""));
    if (p.get("suggest")) return ok(await suggestForTopic(p.get("suggest")!));
    if (p.get("gaps")) return ok(await findUnassigned());
    return fail("Unknown request.");
  } catch (e) {
    return fail(e instanceof Error ? e.message : "Could not load topics.", 500);
  }
}

/** Create a topic: { topic: {...}, items?: [{type, slug, role, sortOrder}] } */
export async function POST(req: NextRequest) {
  const auth = requireStaff(req);
  if (!auth.ok) return auth.response;
  try {
    const body = await req.json().catch(() => null);
    const parsed = parseTopicInput(body?.topic);
    if (!parsed.ok) return fail(parsed.errors.join(" "));
    const saved = await saveTopic(parsed.value);
    if (!saved.ok) return fail(saved.errors.join(" "));
    const items = parseItemsInput(body?.items);
    if (items.length) await setTopicItems(saved.id, items);
    revalidateTopics([saved.slug], pathsOf(items));
    return ok({ id: saved.id, slug: saved.slug });
  } catch (e) {
    return fail(e instanceof Error ? e.message : "Could not create the topic.", 500);
  }
}

/**
 * Update a topic. Send any of:
 *   topic       the topic fields
 *   items       the full member list (replaces the current one)
 *   addItems    members to add without touching the rest
 */
export async function PUT(req: NextRequest) {
  const auth = requireStaff(req);
  if (!auth.ok) return auth.response;
  try {
    const id = new URL(req.url).searchParams.get("id");
    if (!id) return fail("Missing topic id.");
    const body = await req.json().catch(() => null);
    const before = await getTopicRefs(id);
    let slug = "";
    let previousSlug: string | undefined;
    let wasPublished = false;

    const { data: cur } = await supabaseServer.from("topics").select("slug, status").eq("id", id).maybeSingle();
    if (!cur) return fail("That topic no longer exists.", 404);
    slug = cur.slug;
    wasPublished = cur.status === "published";

    if (body?.topic) {
      const parsed = parseTopicInput(body.topic);
      if (!parsed.ok) return fail(parsed.errors.join(" "));
      // Save the member list first when both are sent, so the publish checks see the new members.
      if (Array.isArray(body.items)) await setTopicItems(id, parseItemsInput(body.items));
      const saved = await saveTopic(parsed.value, id);
      if (!saved.ok) return fail(saved.errors.join(" "));
      slug = saved.slug;
      previousSlug = saved.previousSlug;
    } else if (Array.isArray(body?.items)) {
      await setTopicItems(id, parseItemsInput(body.items));
    }

    if (Array.isArray(body?.addItems)) {
      const current = await getTopicRefs(id);
      const add = parseItemsInput(body.addItems);
      const known = new Set(current.map((r) => `${r.type}:${r.slug}`));
      const next = [...current, ...add.filter((a) => !known.has(`${a.type}:${a.slug}`)).map((a, n) => ({ ...a, sortOrder: (current.length + n + 1) * 10 }))];
      await setTopicItems(id, next);
    }

    // The old address keeps working: a published topic that is renamed gets a permanent redirect.
    if (previousSlug && wasPublished) {
      await supabaseServer.from("redirects").upsert({ source_path: topicPath(previousSlug), target_path: topicPath(slug), status_code: 301 }, { onConflict: "source_path" });
    }

    const after = await getTopicRefs(id);
    revalidateTopics([slug, previousSlug || ""], pathsOf([...before, ...after]));
    return ok({ id, slug });
  } catch (e) {
    return fail(e instanceof Error ? e.message : "Could not save the topic.", 500);
  }
}

export async function DELETE(req: NextRequest) {
  const auth = requireStaff(req);
  if (!auth.ok) return auth.response;
  try {
    const id = new URL(req.url).searchParams.get("id");
    if (!id) return fail("Missing topic id.");
    const refs = await getTopicRefs(id);
    const slug = await deleteTopic(id);
    revalidateTopics([slug || ""], pathsOf(refs));
    return ok({ id });
  } catch (e) {
    return fail(e instanceof Error ? e.message : "Could not delete the topic.", 500);
  }
}
