import { supabaseServer } from "@/utils/supabaseServer";
import { sanitizeCommentHtml, sanitizeHtml } from "@/utils/sanitizeHtml";
import { leadingWords } from "./glossaryShared";
import { slugifyQuestion } from "./faqShared";
import {
  QA_DEFAULT_CATEGORIES,
  defaultQaFocusKeyword,
  effectiveMetaDescription,
  effectiveMetaTitle,
  isAnswered,
  linkCount,
  mapQaComment,
  mapQaRow,
  normalizeTitle,
  plainText,
  relatedQuestions,
  type QaComment,
  type QaQuestion,
} from "./qaShared";

/** New comments from visitors wait for staff approval (healer and staff comments go live straight away). */
export const COMMENTS_NEED_APPROVAL = true;
/** Visitor limits per signed-in user per day. */
export const MAX_QUESTIONS_PER_DAY = 5;
export const MAX_COMMENTS_PER_DAY = 20;

/* ------------------------------ reads ------------------------------ */

const isMissingTable = (e: { code?: string } | null | undefined) => e?.code === "42P01" || e?.code === "PGRST205";

/** question id -> number of approved comments */
export async function getCommentCounts(): Promise<Map<string, number>> {
  const counts = new Map<string, number>();
  try {
    const { data } = await supabaseServer.from("qa_comments").select("question_id").eq("status", "published").limit(20000);
    for (const r of data || []) counts.set(r.question_id, (counts.get(r.question_id) || 0) + 1);
  } catch {
    /* counts are optional */
  }
  return counts;
}

/** Live questions (answered first, then waiting for a healer), newest first. Public-safe fields only. */
export async function getPublishedQuestions(): Promise<QaQuestion[]> {
  try {
    const { data, error } = await supabaseServer
      .from("qa_questions")
      .select("*")
      .eq("status", "published")
      .order("published_at", { ascending: false })
      .limit(2000);
    if (error) {
      if (!isMissingTable(error)) console.error("getPublishedQuestions:", error.message);
      return [];
    }
    const counts = await getCommentCounts();
    return (data || []).map((r) => ({ ...mapQaRow(r, false), commentCount: counts.get(r.id) || 0 }));
  } catch (e) {
    console.error("getPublishedQuestions failed:", e);
    return [];
  }
}

export async function getQuestionBySlug(slug: string): Promise<QaQuestion | null> {
  try {
    const { data, error } = await supabaseServer.from("qa_questions").select("*").eq("slug", slug).eq("status", "published").maybeSingle();
    if (error || !data) return null;
    return mapQaRow(data, false);
  } catch {
    return null;
  }
}

export async function getPublishedComments(questionId: string): Promise<QaComment[]> {
  try {
    const { data, error } = await supabaseServer
      .from("qa_comments")
      .select("*")
      .eq("question_id", questionId)
      .eq("status", "published")
      .order("created_at", { ascending: true })
      .limit(500);
    if (error) return [];
    return (data || []).map(mapQaComment);
  } catch {
    return [];
  }
}

/** How many rows this signed-in user created in the last 24 hours (daily limits). */
export async function countRecent(table: "qa_questions" | "qa_comments", profileColumn: string, profileId: string): Promise<number> {
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const { count } = await supabaseServer.from(table).select("id", { count: "exact", head: true }).eq(profileColumn, profileId).gte("created_at", since);
  return count || 0;
}

/** Categories a visitor may choose: the defaults plus any a healer or staff member has used. */
export async function allowedCategories(): Promise<string[]> {
  const set = new Set(QA_DEFAULT_CATEGORIES);
  try {
    const { data } = await supabaseServer.from("qa_questions").select("category").neq("category", "").limit(2000);
    for (const r of data || []) if (r.category) set.add(r.category);
  } catch {
    /* defaults are enough */
  }
  return Array.from(set);
}

/* --------------------------- input validation --------------------------- */

type Row = Record<string, unknown>;
type Parsed = { ok: true; row: Row } | { ok: false; errors: string[] };
const str = (v: unknown, max: number) => (typeof v === "string" ? v.trim().slice(0, max) : "");
const isHttp = (s: string) => /^https?:\/\/[^\s]+\.[^\s]+$/i.test(s);
const SLUG = /^[a-z0-9]+(-[a-z0-9]+)*$/;

/** A visitor asking a question. Plain text only, link-spam limited, always lands as "pending". */
export function parseAskInput(body: unknown, categories: string[]): Parsed {
  const b = (body && typeof body === "object" ? body : {}) as Record<string, unknown>;
  const errors: string[] = [];
  const title = normalizeTitle(plainText(typeof b.title === "string" ? b.title : "", 200));
  const description = plainText(typeof b.description === "string" ? b.description : "", 1500);
  if (title.length < 10 || title.split(/\s+/).length < 3) errors.push("Please write your question in at least a few words (10+ characters).");
  if (linkCount(`${title} ${description}`) > 1) errors.push("Please remove links from your question.");
  const cat = str(b.category, 60);
  const category = cat && categories.includes(cat) ? cat : "";
  if (errors.length) return { ok: false, errors };
  return { ok: true, row: { title, description, category, anonymous: b.anonymous === true } };
}

/** Most links one comment may contain (link-spam guard). */
export const MAX_LINKS_PER_COMMENT = 3;

/**
 * A visitor's (or healer's) comment. The editor sends a little formatting (bold, italic, lists, quotes, links).
 * It is cleaned here with an allow-list, so nothing else (scripts, images, styles) can ever be stored.
 */
export function parseCommentInput(body: unknown): { ok: true; questionId: string; parentId: string | null; text: string } | { ok: false; errors: string[] } {
  const b = (body && typeof body === "object" ? body : {}) as Record<string, unknown>;
  const questionId = str(b.questionId, 100);
  const parentId = str(b.parentId, 100) || null;
  const html = sanitizeCommentHtml(typeof b.body === "string" ? b.body.slice(0, 12000) : "").trim();
  const text = plainText(html.replace(/<\/(p|li|blockquote)>|<br>/gi, " "), 6000);
  const errors: string[] = [];
  if (!questionId) errors.push("Missing question.");
  if (text.length < 2) errors.push("Please write a comment.");
  if (text.length > 2000) errors.push("Please keep your comment under 2000 characters.");
  // count real links plus any bare web addresses typed outside a link (a link whose text is its own URL counts once)
  const outsideLinks = plainText(html.replace(/<a\s[^>]*>[\s\S]*?<\/a>/gi, " "), 6000);
  const links = (html.match(/<a\s/gi) || []).length + linkCount(outsideLinks);
  if (links > MAX_LINKS_PER_COMMENT) errors.push(`Please use at most ${MAX_LINKS_PER_COMMENT} links in a comment.`);
  return errors.length ? { ok: false, errors } : { ok: true, questionId, parentId, text: html };
}

const ANSWER_KEYS = new Set([
  "answer", "short_answer", "answerer_name", "answerer_role", "answerer_credentials", "answerer_image", "practitioner_id",
  "key_takeaways", "sources", "same_as", "reviewed_by", "last_reviewed",
]);

/**
 * Team editing of a question. partial=true only touches fields that were sent.
 * Healers (role "guru") may only change the ANSWER fields. Everything else (status, wording, SEO,
 * asker details) is staff only, even if a healer sends it.
 */
export function parseQuestionAdminInput(body: unknown, partial: boolean, role: string, staffRoles: string[]): Parsed {
  const b = (body && typeof body === "object" ? body : {}) as Record<string, unknown>;
  const errors: string[] = [];
  const row: Row = {};
  const has = (k: string) => !partial || b[k] !== undefined;
  const isStaff = staffRoles.includes(role);

  if (has("title")) {
    const t = normalizeTitle(str(b.title, 220));
    if (!t) errors.push("The question is required.");
    row.title = t;
  }
  if (has("description")) row.description = plainText(typeof b.description === "string" ? b.description : "", 1500);
  if (has("category")) row.category = str(b.category, 60);
  if (has("slug") || (!partial && b.title)) {
    const raw = str(b.slug, 100) || str(b.title, 220);
    const slug = slugifyQuestion(raw);
    if ((!slug || !SLUG.test(slug)) && (raw || partial)) errors.push("Please enter a valid page address (letters, numbers and hyphens).");
    row.slug = slug;
  }

  if (b.status !== undefined) {
    const status = str(b.status, 20);
    if (!["pending", "published", "rejected"].includes(status)) errors.push("Invalid status.");
    row.status = status;
  } else if (!partial) {
    row.status = "published";
  }
  if (has("moderationNote")) row.moderation_note = plainText(typeof b.moderationNote === "string" ? b.moderationNote : "", 500);
  if (has("askedByName")) row.asked_by_name = plainText(typeof b.askedByName === "string" ? b.askedByName : "", 60);
  if (b.anonymous !== undefined) row.anonymous = !!b.anonymous;

  // the official answer
  if (has("answer")) row.answer = sanitizeHtml(typeof b.answer === "string" ? b.answer.trim().slice(0, 30000) : "");
  if (has("shortAnswer")) row.short_answer = str(b.shortAnswer, 700);
  if (has("answererName")) row.answerer_name = str(b.answererName, 100);
  if (has("answererRole")) row.answerer_role = str(b.answererRole, 100);
  if (has("answererCredentials")) row.answerer_credentials = str(b.answererCredentials, 200);
  if (has("answererImage")) {
    const img = str(b.answererImage, 600);
    if (img && !isHttp(img) && !img.startsWith("/")) errors.push("Healer photo must be a web address.");
    row.answerer_image = img;
  }
  if (has("practitionerId")) row.practitioner_id = str(b.practitionerId, 100) || null;

  const list = (v: unknown, n: number, max: number) =>
    Array.isArray(v) ? Array.from(new Set(v.map((x) => str(x, max)).filter(Boolean))).slice(0, n) : [];
  if (has("alternateQuestions")) row.alternate_questions = list(b.alternateQuestions, 10, 200);
  if (has("keyTakeaways")) row.key_takeaways = list(b.keyTakeaways, 10, 240);
  if (has("secondaryKeywords")) row.secondary_keywords = list(b.secondaryKeywords, 10, 80);

  if (has("sources")) {
    const sources: { title: string; url: string }[] = [];
    if (Array.isArray(b.sources)) {
      for (const s of b.sources.slice(0, 10)) {
        const it = (s || {}) as Record<string, unknown>;
        const url = str(it.url, 600);
        const title = str(it.title, 200);
        if (!url && !title) continue;
        if (!isHttp(url)) {
          errors.push(`Source “${title || url}” needs a full web address starting with https://`);
          continue;
        }
        sources.push({ title: title || url, url });
      }
    }
    row.sources = sources;
  }
  if (has("sameAs")) {
    const same = list(b.sameAs, 8, 600);
    if (same.some((u) => !isHttp(u))) errors.push("Reference links must be full web addresses starting with https://");
    row.same_as = same.filter(isHttp);
  }
  if (has("relatedQuestions")) row.related_questions = list(b.relatedQuestions, 12, 100).filter((s) => SLUG.test(s));
  if (has("reviewedBy")) row.reviewed_by = str(b.reviewedBy, 100);
  if (has("lastReviewed")) {
    const d = str(b.lastReviewed, 10);
    if (d && (!/^\d{4}-\d{2}-\d{2}$/.test(d) || Number.isNaN(new Date(d).getTime()))) errors.push("Reviewed date must be a valid date.");
    row.last_reviewed = d || null;
  }

  if (has("metaTitle")) row.meta_title = str(b.metaTitle, 120);
  if (has("metaDescription")) row.meta_description = str(b.metaDescription, 320);
  if (has("focusKeyword")) row.focus_keyword = str(b.focusKeyword, 80);
  if (has("canonicalUrl")) {
    const c = str(b.canonicalUrl, 600);
    if (c && !isHttp(c)) errors.push("Canonical URL must start with https://");
    row.canonical_url = c;
  }
  if (has("ogImage")) {
    const og = str(b.ogImage, 600);
    if (og && !isHttp(og)) errors.push("Social image must be a full web address.");
    row.og_image = og;
  }
  if (has("noindex")) row.noindex = !!b.noindex;

  if (errors.length) return { ok: false, errors };
  if (!isStaff) {
    // Healers: keep only the answer fields, silently dropping anything else they sent
    for (const k of Object.keys(row)) if (!ANSWER_KEYS.has(k)) delete row[k];
  }
  return { ok: true, row };
}

/* ------------------------ "fill the blanks" helper ------------------------ */

/**
 * Sensible starting values for anything left empty on an ANSWERED question. Never overwrites what you wrote.
 */
export function blanksForQuestion(q: QaQuestion, all: QaQuestion[]): Row {
  const patch: Row = {};
  if (!isAnswered(q)) return patch;
  if (!q.shortAnswer.trim()) patch.short_answer = leadingWords(q.answer, 55);
  if (!q.focusKeyword.trim()) patch.focus_keyword = defaultQaFocusKeyword(q.title);
  const filled: QaQuestion = {
    ...q,
    shortAnswer: (patch.short_answer as string) || q.shortAnswer,
    focusKeyword: (patch.focus_keyword as string) || q.focusKeyword,
  };
  if (!q.metaTitle.trim()) patch.meta_title = effectiveMetaTitle({ ...filled, metaTitle: "" });
  if (!q.metaDescription.trim()) patch.meta_description = effectiveMetaDescription({ ...filled, metaDescription: "" });
  if (q.relatedQuestions.length === 0) {
    const pool = relatedQuestions(filled, all, 4);
    if (pool.length) patch.related_questions = pool.map((o) => o.slug);
  }
  return patch;
}

