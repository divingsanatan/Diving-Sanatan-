import { supabaseServer } from "@/utils/supabaseServer";
import { sanitizeHtml } from "@/utils/sanitizeHtml";
import { stripHtml } from "./shopShared";
import { leadingWords } from "./glossaryShared";
import {
  defaultFocusKeyword,
  effectiveMetaDescription,
  effectiveMetaTitle,
  mapFaqRow,
  relatedBySimilarity,
  slugifyQuestion,
  type FaqEntry,
} from "./faqShared";

/* ------------------------------ reads ------------------------------ */

export async function getPublishedFaqs(): Promise<FaqEntry[]> {
  try {
    const { data, error } = await supabaseServer
      .from("faqs")
      .select("*")
      .eq("status", "published")
      .order("created_at", { ascending: true })
      .limit(2000);
    if (error) {
      // 42703 = the new columns do not exist yet (code deployed before the SQL migration ran).
      // Fall back to the old flag so the FAQ page never goes blank. Those rows have no page address yet.
      if ((error as { code?: string }).code === "42703") {
        const legacy = await supabaseServer
          .from("faqs")
          .select("*")
          .eq("is_published", true)
          .order("created_at", { ascending: true })
          .limit(2000);
        if (!legacy.error) return (legacy.data || []).map(mapFaqRow);
      }
      console.error("getPublishedFaqs:", error.message);
      return [];
    }
    return (data || []).map(mapFaqRow);
  } catch (e) {
    console.error("getPublishedFaqs failed:", e);
    return [];
  }
}

export async function getFaqBySlug(slug: string): Promise<FaqEntry | null> {
  try {
    const { data, error } = await supabaseServer
      .from("faqs")
      .select("*")
      .eq("slug", slug)
      .eq("status", "published")
      .maybeSingle();
    if (error || !data) return null;
    return mapFaqRow(data);
  } catch {
    return null;
  }
}

/* --------------------------- input validation --------------------------- */

type Row = Record<string, unknown>;
const str = (v: unknown, max: number) => (typeof v === "string" ? v.trim().slice(0, max) : "");
const isHttp = (s: string) => /^https?:\/\/[^\s]+\.[^\s]+$/i.test(s);
const SLUG = /^[a-z0-9]+(-[a-z0-9]+)*$/;

/**
 * Turns an untrusted request body into a database update.
 * partial=true (editing) only touches the fields that were sent, so older callers that send just
 * question/answer/verified/isPublished can never wipe the SEO fields.
 * The old `isPublished` flag is still understood and is translated to `status`.
 */
export function parseFaqInput(
  body: unknown,
  partial: boolean
): { ok: true; row: Row } | { ok: false; errors: string[] } {
  const b = (body && typeof body === "object" ? body : {}) as Record<string, unknown>;
  const errors: string[] = [];
  const row: Row = {};
  const has = (k: string) => !partial || b[k] !== undefined;

  if (has("question")) {
    const q = str(b.question, 220);
    if (!q) errors.push("The question is required.");
    row.question = q;
  }
  if (has("answer")) {
    const ans = sanitizeHtml(typeof b.answer === "string" ? b.answer.trim().slice(0, 20000) : "");
    if (!stripHtml(ans)) errors.push("The answer is required.");
    row.answer = ans;
  }
  if (has("slug") || (!partial && b.question)) {
    const raw = str(b.slug, 100) || str(b.question, 220);
    const slug = slugifyQuestion(raw);
    // An empty question is already reported above, so only complain about the address when there is something to turn into one
    if ((!slug || !SLUG.test(slug)) && (raw || partial)) errors.push("Please enter a valid page address (letters, numbers and hyphens).");
    row.slug = slug;
  }

  // status (new) or isPublished (legacy)
  if (b.status !== undefined) {
    const status = str(b.status, 20) || "published";
    if (!["draft", "published"].includes(status)) errors.push("Invalid status.");
    row.status = status;
    row.is_published = status === "published";
  } else if (b.isPublished !== undefined) {
    row.status = b.isPublished ? "published" : "draft";
    row.is_published = !!b.isPublished;
  } else if (!partial) {
    row.status = "published";
    row.is_published = true;
  }

  if (b.verified !== undefined) row.verified = !!b.verified;
  else if (!partial) row.verified = true;

  if (has("shortAnswer")) row.short_answer = str(b.shortAnswer, 700);
  if (has("extendedContent")) row.extended_content = sanitizeHtml(typeof b.extendedContent === "string" ? b.extendedContent.slice(0, 60000) : "");

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
  if (has("relatedFaqs")) {
    row.related_faqs = list(b.relatedFaqs, 12, 100).filter((s) => SLUG.test(s));
  }
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

  return errors.length ? { ok: false, errors } : { ok: true, row };
}

/* ------------------------ "fill the blanks" helper ------------------------ */

/**
 * Sensible starting values for anything left empty. Never overwrites what you wrote.
 * Related questions: the most similar published questions, so every page links to others.
 */
export function blanksFor(e: FaqEntry, all: FaqEntry[]): Row {
  const patch: Row = {};
  if (!e.shortAnswer.trim()) patch.short_answer = leadingWords(e.answer, 55);
  if (!e.focusKeyword.trim()) patch.focus_keyword = defaultFocusKeyword(e.question);
  const filled = {
    ...e,
    shortAnswer: (patch.short_answer as string) || e.shortAnswer,
    focusKeyword: (patch.focus_keyword as string) || e.focusKeyword,
  };
  if (!e.metaTitle.trim()) patch.meta_title = effectiveMetaTitle({ ...filled, metaTitle: "" });
  if (!e.metaDescription.trim()) patch.meta_description = effectiveMetaDescription({ ...filled, metaDescription: "" });
  if (e.relatedFaqs.length === 0) {
    const pool = relatedBySimilarity(filled, all, 4);
    if (pool.length) patch.related_faqs = pool.map((o) => o.slug);
  }
  return patch;
}
