/* eslint-disable @typescript-eslint/no-explicit-any */
import { supabaseServer } from "@/utils/supabaseServer";
import { sanitizeHtml } from "@/utils/sanitizeHtml";
import { slugify, stripHtml, truncate } from "./shopShared";
import { isUrl } from "./faqShared";
import { mapVideoRow, thumbnailOf } from "./videoShared";
import {
  ITEM_TYPES,
  journeyOf,
  itemPath,
  mapTopicRow,
  readinessChecks,
  type ResolvedItem,
  type Topic,
  type TopicItemRef,
  type TopicItemType,
  type TopicRole,
} from "./topicsShared";

const isMissingTable = (e: { code?: string } | null | undefined) => e?.code === "42P01" || e?.code === "PGRST205";
const ROLES: TopicRole[] = ["pillar", "cluster", "supporting"];

/* ------------------------------ public reads ------------------------------ */

export async function getPublishedTopics(): Promise<Topic[]> {
  try {
    const { data, error } = await supabaseServer.from("topics").select("*").eq("status", "published").order("sort_order", { ascending: true }).limit(200);
    if (error) {
      if (!isMissingTable(error)) console.error("getPublishedTopics:", error.message);
      return [];
    }
    return (data || []).map(mapTopicRow);
  } catch (e) {
    console.error("getPublishedTopics failed:", e);
    return [];
  }
}

export async function getTopicBySlug(slug: string, opts: { includeDraft?: boolean } = {}): Promise<Topic | null> {
  try {
    let q = supabaseServer.from("topics").select("*").eq("slug", slug);
    if (!opts.includeDraft) q = q.eq("status", "published");
    const { data, error } = await q.maybeSingle();
    if (error || !data) return null;
    return mapTopicRow(data);
  } catch {
    return null;
  }
}

export async function getTopicRefs(topicId: string): Promise<TopicItemRef[]> {
  try {
    const { data, error } = await supabaseServer.from("topic_items").select("item_type, item_slug, role, sort_order").eq("topic_id", topicId).order("sort_order", { ascending: true }).limit(500);
    if (error) return [];
    return (data || []).map((r: any) => ({
      type: r.item_type as TopicItemType,
      slug: r.item_slug as string,
      role: (ROLES.includes(r.role) ? r.role : "cluster") as TopicRole,
      sortOrder: Number(r.sort_order) || 0,
    }));
  } catch {
    return [];
  }
}

const blogImage = (img: unknown) => (typeof img === "string" && (img.startsWith("http") || img.startsWith("/")) ? img : "");

/** Turn slugs into cards. Anything unpublished (or deleted) is left out, so a hub never links to a dead page. */
export async function resolveItems(refs: TopicItemRef[]): Promise<ResolvedItem[]> {
  const by = (t: TopicItemType) => refs.filter((r) => r.type === t);
  const slugs = (t: TopicItemType) => by(t).map((r) => r.slug);
  const out: ResolvedItem[] = [];
  const refOf = (t: TopicItemType, slug: string) => by(t).find((r) => r.slug === slug)!;

  const jobs: Promise<void>[] = [];

  if (slugs("blog").length) {
    jobs.push(
      (async () => {
        const { data } = await supabaseServer.from("blogs").select("slug, title, category, tldr, content, image, date").eq("approval_status", "published").in("slug", slugs("blog"));
        for (const r of data || []) {
          const ref = refOf("blog", r.slug);
          out.push({ ...ref, title: r.title || r.slug, summary: (r.tldr || "").trim() || truncate(stripHtml(r.content || ""), 170), path: itemPath("blog", r.slug), category: r.category || "", image: blogImage(r.image), date: r.date || null });
        }
      })()
    );
  }
  if (slugs("qa").length) {
    jobs.push(
      (async () => {
        const { data } = await supabaseServer.from("qa_questions").select("slug, title, category, short_answer, answer, published_at").eq("status", "published").in("slug", slugs("qa"));
        for (const r of data || []) {
          if (!stripHtml(r.answer || "").trim()) continue; // an unanswered question is not worth linking from a guide
          const ref = refOf("qa", r.slug);
          out.push({ ...ref, title: r.title, summary: (r.short_answer || "").trim() || truncate(stripHtml(r.answer || ""), 170), path: itemPath("qa", r.slug), category: r.category || "", image: "", date: r.published_at || null });
        }
      })()
    );
  }
  if (slugs("video").length) {
    jobs.push(
      (async () => {
        const { data } = await supabaseServer.from("video_posts").select("*").eq("status", "published").in("slug", slugs("video"));
        for (const row of data || []) {
          const v = mapVideoRow(row);
          const ref = refOf("video", v.slug);
          out.push({ ...ref, title: v.title, summary: v.shortAnswer.trim() || truncate(v.description, 170), path: itemPath("video", v.slug), category: v.category, image: thumbnailOf(v), date: v.uploadDate });
        }
      })()
    );
  }
  if (slugs("glossary").length) {
    jobs.push(
      (async () => {
        const { data } = await supabaseServer.from("glossary_terms").select("slug, word, category, short_answer, definition").eq("status", "published").in("slug", slugs("glossary"));
        for (const r of data || []) {
          const ref = refOf("glossary", r.slug);
          out.push({ ...ref, title: (r.word || r.slug).replace(/\s*\([^)]*\)/g, "").trim(), summary: (r.short_answer || "").trim() || truncate(stripHtml(r.definition || ""), 150), path: itemPath("glossary", r.slug), category: r.category || "", image: "", date: null });
        }
      })()
    );
  }
  await Promise.all(jobs.map((j) => j.catch((e) => console.error("resolveItems:", e))));
  return out;
}

export interface TopicTrailData {
  topic: Topic;
  journey: ResolvedItem[];
  glossary: ResolvedItem[];
  index: number; // position of this page in the journey, -1 for glossary terms
  prev: ResolvedItem | null;
  next: ResolvedItem | null;
  more: ResolvedItem[];
}

/** Everything a member page needs to show where it sits in its topic. Null when it belongs to no published topic. */
export async function getTrailFor(type: TopicItemType, slug: string): Promise<TopicTrailData | null> {
  try {
    const { data: links, error } = await supabaseServer.from("topic_items").select("topic_id").eq("item_type", type).eq("item_slug", slug);
    if (error || !links?.length) return null;
    const { data: tops } = await supabaseServer.from("topics").select("*").eq("status", "published").in("id", links.map((l: any) => l.topic_id)).order("sort_order", { ascending: true });
    if (!tops?.length) return null;
    const topic = mapTopicRow(tops[0]);
    const items = await resolveItems(await getTopicRefs(topic.id));
    const journey = journeyOf(items.slice());
    const glossary = items.filter((i) => i.type === "glossary");
    const index = journey.findIndex((i) => i.type === type && i.slug === slug);
    const prev = index > 0 ? journey[index - 1] : null;
    const next = index >= 0 && index < journey.length - 1 ? journey[index + 1] : null;
    const skip = new Set([prev && `${prev.type}:${prev.slug}`, next && `${next.type}:${next.slug}`, `${type}:${slug}`]);
    const more = journey.filter((i) => !skip.has(`${i.type}:${i.slug}`)).slice(0, 4);
    return { topic, journey, glossary, index, prev, next, more };
  } catch (e) {
    console.error("getTrailFor failed:", e);
    return null;
  }
}

/** Counts per published topic, for the topics index page and sitemap. */
export async function getTopicsWithItems(): Promise<{ topic: Topic; items: ResolvedItem[] }[]> {
  const topics = await getPublishedTopics();
  return Promise.all(topics.map(async (topic) => ({ topic, items: await resolveItems(await getTopicRefs(topic.id)) })));
}

/* ------------------------------ admin ------------------------------ */

export async function listTopicsAdmin() {
  const { data: tops, error } = await supabaseServer.from("topics").select("*").order("sort_order", { ascending: true });
  if (error) throw new Error(error.message);
  const { data: items } = await supabaseServer.from("topic_items").select("topic_id, item_type").limit(5000);
  const counts = new Map<string, Record<string, number>>();
  for (const i of items || []) {
    const c = counts.get(i.topic_id) || {};
    c[i.item_type] = (c[i.item_type] || 0) + 1;
    counts.set(i.topic_id, c);
  }
  return (tops || []).map((r: any) => ({ ...mapTopicRow(r), counts: counts.get(r.id) || {} }));
}

export async function getTopicAdmin(id: string) {
  const { data, error } = await supabaseServer.from("topics").select("*").eq("id", id).maybeSingle();
  if (error || !data) return null;
  const topic = mapTopicRow(data);
  const refs = await getTopicRefs(id);
  const resolved = await resolveItems(refs);
  const known = new Set(resolved.map((r) => `${r.type}:${r.slug}`));
  // Members whose page is unpublished or gone are listed too, flagged, so they can be fixed or removed.
  const members = refs.map((r) => {
    const hit = resolved.find((x) => x.type === r.type && x.slug === r.slug);
    return { ...r, title: hit?.title || r.slug, live: known.has(`${r.type}:${r.slug}`) };
  });
  return { topic, members, readiness: readinessChecks(topic, resolved) };
}

export interface TopicInput {
  title: string;
  slug: string;
  shortAnswer: string;
  overviewHtml: string;
  keyTakeaways: string[];
  sources: { title: string; url: string }[];
  sameAs: string[];
  alternateQuestions: string[];
  focusKeyword: string;
  secondaryKeywords: string[];
  metaTitle: string;
  metaDescription: string;
  canonicalUrl: string;
  ogImage: string;
  authorName: string;
  authorCredentials: string;
  reviewedBy: string;
  lastReviewed: string | null;
  ctaLabel: string;
  ctaUrl: string;
  ctaText: string;
  status: "draft" | "published";
  noindex: boolean;
  sortOrder: number;
}

const s = (v: unknown, max = 500) => (typeof v === "string" ? v.trim().slice(0, max) : "");
const list = (v: unknown, max = 40, len = 300) => (Array.isArray(v) ? v.map((x) => s(x, len)).filter(Boolean).slice(0, max) : []);

export function parseTopicInput(body: unknown): { ok: true; value: TopicInput } | { ok: false; errors: string[] } {
  const b = (body && typeof body === "object" ? body : {}) as Record<string, unknown>;
  const errors: string[] = [];
  const title = s(b.title, 160);
  if (!title) errors.push("Please add a title.");
  const slug = slugify(s(b.slug, 120) || title);
  if (!slug) errors.push("Please add a web address (slug).");
  const sources = (Array.isArray(b.sources) ? b.sources : [])
    .map((x: any) => ({ title: s(x?.title, 200), url: s(x?.url, 500) }))
    .filter((x) => x.title && isUrl(x.url))
    .slice(0, 20);
  const lastReviewed = s(b.lastReviewed, 10);
  const ctaUrl = s(b.ctaUrl, 300);
  if (ctaUrl && !/^(https?:\/\/|\/)/i.test(ctaUrl)) errors.push("The call-to-action link must start with / or https://");
  const value: TopicInput = {
    title,
    slug,
    shortAnswer: s(b.shortAnswer, 700),
    overviewHtml: sanitizeHtml(typeof b.overviewHtml === "string" ? b.overviewHtml.slice(0, 120000) : ""),
    keyTakeaways: list(b.keyTakeaways, 12, 400),
    sources,
    sameAs: list(b.sameAs, 20, 300).filter(isUrl),
    alternateQuestions: list(b.alternateQuestions, 20, 200),
    focusKeyword: s(b.focusKeyword, 120),
    secondaryKeywords: list(b.secondaryKeywords, 20, 120),
    metaTitle: s(b.metaTitle, 120),
    metaDescription: s(b.metaDescription, 300),
    canonicalUrl: s(b.canonicalUrl, 300),
    ogImage: s(b.ogImage, 500),
    authorName: s(b.authorName, 120) || "Diving Sanatan Team",
    authorCredentials: s(b.authorCredentials, 300),
    reviewedBy: s(b.reviewedBy, 120),
    lastReviewed: /^\d{4}-\d{2}-\d{2}$/.test(lastReviewed) ? lastReviewed : null,
    ctaLabel: s(b.ctaLabel, 80) || "Book a session",
    ctaUrl: ctaUrl || "/explore-services",
    ctaText: s(b.ctaText, 400),
    status: b.status === "published" ? "published" : "draft",
    noindex: !!b.noindex,
    sortOrder: Number.isFinite(Number(b.sortOrder)) ? Math.round(Number(b.sortOrder)) : 0,
  };
  return errors.length ? { ok: false, errors } : { ok: true, value };
}

const toRow = (v: TopicInput) => ({
  slug: v.slug,
  title: v.title,
  short_answer: v.shortAnswer,
  overview_html: v.overviewHtml,
  key_takeaways: v.keyTakeaways,
  sources: v.sources,
  same_as: v.sameAs,
  alternate_questions: v.alternateQuestions,
  focus_keyword: v.focusKeyword,
  secondary_keywords: v.secondaryKeywords,
  meta_title: v.metaTitle,
  meta_description: v.metaDescription,
  canonical_url: v.canonicalUrl,
  og_image: v.ogImage,
  author_name: v.authorName,
  author_credentials: v.authorCredentials,
  reviewed_by: v.reviewedBy,
  last_reviewed: v.lastReviewed,
  cta_label: v.ctaLabel,
  cta_url: v.ctaUrl,
  cta_text: v.ctaText,
  status: v.status,
  noindex: v.noindex,
  sort_order: v.sortOrder,
  updated_at: new Date().toISOString(),
});

/** Create (no id) or update a topic. Publishing needs the blocking checks to pass. */
export async function saveTopic(v: TopicInput, id?: string): Promise<{ ok: true; id: string; slug: string; previousSlug?: string } | { ok: false; errors: string[] }> {
  const { data: clash } = await supabaseServer.from("topics").select("id").eq("slug", v.slug).maybeSingle();
  if (clash && clash.id !== id) return { ok: false, errors: [`Another topic already uses the address "${v.slug}".`] };

  let previousSlug: string | undefined;
  let existingPublishedAt: string | null = null;
  if (id) {
    const { data: cur } = await supabaseServer.from("topics").select("slug, published_at").eq("id", id).maybeSingle();
    if (!cur) return { ok: false, errors: ["That topic no longer exists."] };
    previousSlug = cur.slug !== v.slug ? cur.slug : undefined;
    existingPublishedAt = cur.published_at;
  }

  if (v.status === "published") {
    const refs = id ? await getTopicRefs(id) : [];
    const resolved = await resolveItems(refs);
    const blocking = readinessChecks(
      { title: v.title, shortAnswer: v.shortAnswer, overviewHtml: v.overviewHtml, keyTakeaways: v.keyTakeaways, sources: v.sources, reviewedBy: v.reviewedBy, focusKeyword: v.focusKeyword, metaDescription: v.metaDescription },
      resolved
    ).filter((c) => c.blocking && !c.ok);
    if (blocking.length) return { ok: false, errors: ["Not ready to publish yet: " + blocking.map((c) => c.label).join("; ") + "."] };
  }

  const row = { ...toRow(v), ...(v.status === "published" ? { published_at: existingPublishedAt || new Date().toISOString() } : {}) };
  if (id) {
    const { error } = await supabaseServer.from("topics").update(row).eq("id", id);
    if (error) return { ok: false, errors: [error.message] };
    return { ok: true, id, slug: v.slug, previousSlug };
  }
  const newId = `topic-${v.slug}`;
  const { error } = await supabaseServer.from("topics").insert({ id: newId, ...row });
  if (error) return { ok: false, errors: [error.message] };
  return { ok: true, id: newId, slug: v.slug };
}

export async function deleteTopic(id: string) {
  const { data: cur } = await supabaseServer.from("topics").select("slug").eq("id", id).maybeSingle();
  const { error } = await supabaseServer.from("topics").delete().eq("id", id);
  if (error) throw new Error(error.message);
  return cur?.slug as string | undefined;
}

export function parseItemsInput(body: unknown): TopicItemRef[] {
  const arr = Array.isArray(body) ? body : [];
  const seen = new Set<string>();
  const out: TopicItemRef[] = [];
  arr.forEach((x: any, n) => {
    const type = x?.type as TopicItemType;
    const slug = s(x?.slug, 200);
    if (!ITEM_TYPES.includes(type) || !slug) return;
    const key = `${type}:${slug}`;
    if (seen.has(key)) return;
    seen.add(key);
    out.push({ type, slug, role: ROLES.includes(x?.role) ? x.role : "cluster", sortOrder: Number.isFinite(Number(x?.sortOrder)) ? Math.round(Number(x.sortOrder)) : (n + 1) * 10 });
  });
  return out;
}

/** Replace a topic's members with exactly this list. */
export async function setTopicItems(topicId: string, items: TopicItemRef[]) {
  const rows = items.map((i) => ({ topic_id: topicId, item_type: i.type, item_slug: i.slug, role: i.role, sort_order: i.sortOrder }));
  if (rows.length) {
    const { error } = await supabaseServer.from("topic_items").upsert(rows, { onConflict: "topic_id,item_type,item_slug" });
    if (error) throw new Error(error.message);
  }
  const { data: existing } = await supabaseServer.from("topic_items").select("id, item_type, item_slug").eq("topic_id", topicId);
  const keep = new Set(items.map((i) => `${i.type}:${i.slug}`));
  const drop = (existing || []).filter((e: any) => !keep.has(`${e.item_type}:${e.item_slug}`)).map((e: any) => e.id);
  if (drop.length) {
    const { error } = await supabaseServer.from("topic_items").delete().in("id", drop);
    if (error) throw new Error(error.message);
  }
}

/* ---------------------- picker, suggestions, gaps ---------------------- */

export interface ContentHit {
  type: TopicItemType;
  slug: string;
  title: string;
  summary: string;
  published: boolean;
}

const like = (q: string) => `%${q.replace(/[%_,()]/g, " ").trim()}%`;

export async function searchContent(q: string, limit = 8): Promise<ContentHit[]> {
  const term = q.trim();
  if (term.length < 2) return [];
  const p = like(term);
  const [blogs, qa, videos, gloss] = await Promise.all([
    supabaseServer.from("blogs").select("slug, title, approval_status").ilike("title", p).limit(limit),
    supabaseServer.from("qa_questions").select("slug, title, status").ilike("title", p).limit(limit),
    supabaseServer.from("video_posts").select("slug, title, status").ilike("title", p).limit(limit),
    supabaseServer.from("glossary_terms").select("slug, word, status").ilike("word", p).limit(limit),
  ]);
  return [
    ...(blogs.data || []).map((r: any): ContentHit => ({ type: "blog", slug: r.slug, title: r.title, summary: "", published: r.approval_status === "published" })),
    ...(qa.data || []).map((r: any): ContentHit => ({ type: "qa", slug: r.slug, title: r.title, summary: "", published: r.status === "published" })),
    ...(videos.data || []).map((r: any): ContentHit => ({ type: "video", slug: r.slug, title: r.title, summary: "", published: r.status === "published" })),
    ...(gloss.data || []).map((r: any): ContentHit => ({ type: "glossary", slug: r.slug, title: (r.word || r.slug).replace(/\s*\([^)]*\)/g, "").trim(), summary: "", published: r.status === "published" })),
  ].filter((h) => h.slug);
}

const STOP = new Set("the and for with that this from what how why are was were can you your about into their them they have has had not but all any more most other some such than then there these those when where which will would who whom its also very".split(" "));

function keywordsOf(t: Topic): { phrases: string[]; words: string[] } {
  const phrases = [t.title, t.focusKeyword, ...t.secondaryKeywords, ...t.alternateQuestions].map((x) => x.toLowerCase().trim()).filter((x) => x.length > 2);
  const words = Array.from(new Set(phrases.flatMap((p) => p.split(/[^a-z0-9ā-ž]+/i)).filter((w) => w.length > 3 && !STOP.has(w))));
  return { phrases: Array.from(new Set(phrases)), words };
}

export interface Suggestion extends ContentHit {
  score: number;
  matched: string[];
}

/** Published pieces that look related to this topic but are not part of it yet. The editor decides what to add. */
export async function suggestForTopic(topicId: string, limit = 16): Promise<Suggestion[]> {
  const { data: row } = await supabaseServer.from("topics").select("*").eq("id", topicId).maybeSingle();
  if (!row) return [];
  const topic = mapTopicRow(row);
  const members = new Set((await getTopicRefs(topicId)).map((r) => `${r.type}:${r.slug}`));
  const { phrases, words } = keywordsOf(topic);
  if (!words.length) return [];

  const [blogs, qa, videos, gloss] = await Promise.all([
    supabaseServer.from("blogs").select("slug, title, tldr, content, category").eq("approval_status", "published").limit(500),
    supabaseServer.from("qa_questions").select("slug, title, short_answer, answer").eq("status", "published").limit(1000),
    supabaseServer.from("video_posts").select("slug, title, description, transcript").eq("status", "published").limit(500),
    supabaseServer.from("glossary_terms").select("slug, word, short_answer, definition").eq("status", "published").limit(1000),
  ]);

  const candidates: { type: TopicItemType; slug: string; title: string; body: string }[] = [
    ...(blogs.data || []).map((r: any) => ({ type: "blog" as const, slug: r.slug, title: r.title || "", body: `${r.tldr || ""} ${r.category || ""} ${stripHtml(r.content || "").slice(0, 4000)}` })),
    ...(qa.data || []).map((r: any) => ({ type: "qa" as const, slug: r.slug, title: r.title || "", body: `${r.short_answer || ""} ${stripHtml(r.answer || "").slice(0, 3000)}` })),
    ...(videos.data || []).map((r: any) => ({ type: "video" as const, slug: r.slug, title: r.title || "", body: `${r.description || ""} ${String(r.transcript || "").slice(0, 3000)}` })),
    ...(gloss.data || []).map((r: any) => ({ type: "glossary" as const, slug: r.slug, title: (r.word || "").replace(/\s*\([^)]*\)/g, "").trim(), body: `${r.short_answer || ""} ${stripHtml(r.definition || "").slice(0, 1500)}` })),
  ];

  const out: Suggestion[] = [];
  for (const c of candidates) {
    if (!c.slug || members.has(`${c.type}:${c.slug}`)) continue;
    const title = c.title.toLowerCase();
    const body = c.body.toLowerCase();
    let score = 0;
    const matched = new Set<string>();
    for (const p of phrases) {
      if (title.includes(p)) { score += 6; matched.add(p); }
      else if (body.includes(p)) { score += 2; matched.add(p); }
    }
    for (const w of words) {
      if (title.includes(w)) { score += 3; matched.add(w); }
      else if (body.includes(w)) { score += 1; matched.add(w); }
    }
    if (score >= 4) out.push({ type: c.type, slug: c.slug, title: c.title, summary: "", published: true, score, matched: Array.from(matched).slice(0, 4) });
  }
  return out.sort((a, b) => b.score - a.score).slice(0, limit);
}

/** Published pages that no topic links to yet (they have no hub pointing at them). */
export async function findUnassigned(limit = 60): Promise<{ total: number; items: ContentHit[] }> {
  const [{ data: links }, blogs, qa, videos, gloss] = await Promise.all([
    supabaseServer.from("topic_items").select("item_type, item_slug").limit(5000),
    supabaseServer.from("blogs").select("slug, title").eq("approval_status", "published").limit(1000),
    supabaseServer.from("qa_questions").select("slug, title, answer").eq("status", "published").limit(2000),
    supabaseServer.from("video_posts").select("slug, title").eq("status", "published").limit(1000),
    supabaseServer.from("glossary_terms").select("slug, word").eq("status", "published").limit(2000),
  ]);
  const used = new Set((links || []).map((l: any) => `${l.item_type}:${l.item_slug}`));
  const all: ContentHit[] = [
    ...(blogs.data || []).map((r: any): ContentHit => ({ type: "blog", slug: r.slug, title: r.title, summary: "", published: true })),
    ...(qa.data || []).filter((r: any) => stripHtml(r.answer || "").trim()).map((r: any): ContentHit => ({ type: "qa", slug: r.slug, title: r.title, summary: "", published: true })),
    ...(videos.data || []).map((r: any): ContentHit => ({ type: "video", slug: r.slug, title: r.title, summary: "", published: true })),
    ...(gloss.data || []).map((r: any): ContentHit => ({ type: "glossary", slug: r.slug, title: (r.word || r.slug).replace(/\s*\([^)]*\)/g, "").trim(), summary: "", published: true })),
  ].filter((h) => h.slug && !used.has(`${h.type}:${h.slug}`));
  return { total: all.length, items: all.slice(0, limit) };
}
