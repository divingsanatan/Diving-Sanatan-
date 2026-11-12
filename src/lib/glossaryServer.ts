import { supabaseServer } from "@/utils/supabaseServer";
import { sanitizeHtml } from "@/utils/sanitizeHtml";
import { stripHtml, truncate } from "./shopShared";
import {
  coreWord,
  effectiveMetaDescription,
  effectiveMetaTitle,
  effectiveShortAnswer,
  leadingWords,
  mapGlossaryRow,
  slugifyTerm,
  type GlossaryEntry,
} from "./glossaryShared";

/* ------------------------------ reads ------------------------------ */

export async function getPublishedGlossary(): Promise<GlossaryEntry[]> {
  try {
    const { data, error } = await supabaseServer
      .from("glossary_terms")
      .select("*")
      .eq("status", "published")
      .order("word", { ascending: true })
      .limit(2000);
    if (error) {
      console.error("getPublishedGlossary:", error.message);
      return [];
    }
    return (data || []).map(mapGlossaryRow);
  } catch (e) {
    console.error("getPublishedGlossary failed:", e);
    return [];
  }
}

export async function getGlossaryBySlug(slug: string): Promise<GlossaryEntry | null> {
  try {
    const { data, error } = await supabaseServer
      .from("glossary_terms")
      .select("*")
      .eq("slug", slug)
      .eq("status", "published")
      .maybeSingle();
    if (error || !data) return null;
    return mapGlossaryRow(data);
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
 * partial=true (editing) only touches the fields that were sent, so older callers that send
 * just word/definition/etc. can never wipe the new SEO fields.
 */
export function parseGlossaryInput(
  body: unknown,
  partial: boolean
): { ok: true; row: Row } | { ok: false; errors: string[] } {
  const b = (body && typeof body === "object" ? body : {}) as Record<string, unknown>;
  const errors: string[] = [];
  const row: Row = {};
  const has = (k: string) => !partial || b[k] !== undefined;

  if (has("word")) {
    const word = str(b.word, 120);
    if (!word) errors.push("The term (word) is required.");
    row.word = word;
  }
  if (has("definition")) {
    const def = sanitizeHtml(typeof b.definition === "string" ? b.definition.trim().slice(0, 20000) : "");
    if (!stripHtml(def)) errors.push("The definition is required.");
    row.definition = def;
  }
  if (has("slug") || (!partial && b.word)) {
    const slug = slugifyTerm(str(b.slug, 100) || str(b.word, 120));
    if (!slug || !SLUG.test(slug)) errors.push("Please enter a valid page address (letters, numbers and hyphens).");
    row.slug = slug;
  }
  if (has("phonetic")) row.phonetic = str(b.phonetic, 80);
  if (has("category")) row.category = str(b.category, 80);
  if (has("illustration")) {
    const ill = str(b.illustration, 600);
    row.illustration = ill || null;
  }
  if (has("imageAlt")) row.image_alt = str(b.imageAlt, 200);

  if (has("status")) {
    const status = str(b.status, 20) || "published";
    if (!["draft", "published"].includes(status)) errors.push("Invalid status.");
    row.status = status;
  }
  if (has("shortAnswer")) row.short_answer = str(b.shortAnswer, 700);
  if (has("extendedContent")) row.extended_content = sanitizeHtml(typeof b.extendedContent === "string" ? b.extendedContent.slice(0, 60000) : "");
  if (has("origin")) row.origin = str(b.origin, 900);

  const list = (v: unknown, n: number, max: number) =>
    Array.isArray(v) ? Array.from(new Set(v.map((x) => str(x, max)).filter(Boolean))).slice(0, n) : [];
  if (has("alternateNames")) row.alternate_names = list(b.alternateNames, 15, 80);
  if (has("keyTakeaways")) row.key_takeaways = list(b.keyTakeaways, 10, 240);
  if (has("secondaryKeywords")) row.secondary_keywords = list(b.secondaryKeywords, 10, 80);

  if (has("faqs")) {
    row.faqs = Array.isArray(b.faqs)
      ? b.faqs
          .map((f) => {
            const it = (f || {}) as Record<string, unknown>;
            return { question: str(it.question, 220), answer: stripHtml(str(it.answer, 1800)) };
          })
          .filter((f) => f.question && f.answer)
          .slice(0, 15)
      : [];
  }
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
  if (has("relatedTerms")) {
    const rel = list(b.relatedTerms, 12, 100).filter((s) => SLUG.test(s));
    row.related_terms = rel;
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
 * Related terms: up to 4 neighbours from the same category, so every page links to others.
 */
export function blanksFor(e: GlossaryEntry, all: GlossaryEntry[]): Row {
  const patch: Row = {};
  const core = coreWord(e.word);
  if (!e.shortAnswer.trim()) patch.short_answer = leadingWords(e.definition, 55);
  if (!e.focusKeyword.trim()) patch.focus_keyword = `${core.toLowerCase()} meaning`;
  const filled = { ...e, shortAnswer: (patch.short_answer as string) || e.shortAnswer, focusKeyword: (patch.focus_keyword as string) || e.focusKeyword };
  if (!e.metaTitle.trim()) patch.meta_title = effectiveMetaTitle({ ...filled, metaTitle: "" });
  if (!e.metaDescription.trim()) patch.meta_description = effectiveMetaDescription({ ...filled, metaDescription: "" });
  if (e.illustration && /^https?:/.test(e.illustration) && !e.imageAlt.trim()) patch.image_alt = `${core} illustration`;
  if (e.relatedTerms.length === 0) {
    const same = all.filter((o) => o.id !== e.id && o.category && o.category === e.category).slice(0, 4);
    const pool = same.length >= 3 ? same : [...same, ...all.filter((o) => o.id !== e.id && !same.includes(o))].slice(0, 4);
    if (pool.length) patch.related_terms = pool.map((o) => o.slug);
  }
  return patch;
}

export { effectiveShortAnswer, truncate };
