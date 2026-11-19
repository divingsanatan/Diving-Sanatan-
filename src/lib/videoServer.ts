import { supabaseServer } from "@/utils/supabaseServer";
import { sanitizeHtml } from "@/utils/sanitizeHtml";
import { stripHtml } from "./shopShared";
import { leadingWords } from "./glossaryShared";
import { slugifyQuestion } from "./faqShared";
import { parseYouTube } from "./youtube";
import {
  defaultVideoFocusKeyword,
  effectiveMetaDescription,
  effectiveMetaTitle,
  mapVideoRow,
  parseDuration,
  parseTranscript,
  relatedVideos,
  transcriptPlain,
  type VideoPost,
} from "./videoShared";
import { plainText } from "./qaShared";

/* ------------------------------ reads ------------------------------ */

const isMissingTable = (e: { code?: string } | null | undefined) => e?.code === "42P01" || e?.code === "PGRST205";

/** Live videos, newest first. */
export async function getPublishedVideos(): Promise<VideoPost[]> {
  try {
    const { data, error } = await supabaseServer
      .from("video_posts")
      .select("*")
      .eq("status", "published")
      .order("upload_date", { ascending: false, nullsFirst: false })
      .order("created_at", { ascending: false })
      .limit(1000);
    if (error) {
      if (!isMissingTable(error)) console.error("getPublishedVideos:", error.message);
      return [];
    }
    return (data || []).map(mapVideoRow);
  } catch (e) {
    console.error("getPublishedVideos failed:", e);
    return [];
  }
}

export async function getVideoBySlug(slug: string): Promise<VideoPost | null> {
  try {
    const { data, error } = await supabaseServer.from("video_posts").select("*").eq("slug", slug).eq("status", "published").maybeSingle();
    if (error || !data) return null;
    return mapVideoRow(data);
  } catch {
    return null;
  }
}

/* --------------------------- input validation --------------------------- */

type Row = Record<string, unknown>;
type Parsed = { ok: true; row: Row } | { ok: false; errors: string[] };
const str = (v: unknown, max: number) => (typeof v === "string" ? v.trim().slice(0, max) : "");
const isHttp = (s: string) => /^https?:\/\/[^\s]+\.[^\s]+$/i.test(s);
const SLUG = /^[a-z0-9]+(-[a-z0-9]+)*$/;

/**
 * Turns an untrusted request body into a database row. partial=true (editing) only touches the fields that
 * were sent. The YouTube link can be pasted in any common form: it is converted to the 11-character id.
 */
export function parseVideoInput(body: unknown, partial: boolean): Parsed {
  const b = (body && typeof body === "object" ? body : {}) as Record<string, unknown>;
  const errors: string[] = [];
  const row: Row = {};
  const has = (k: string) => !partial || b[k] !== undefined;

  if (has("title")) {
    const t = str(b.title, 220);
    if (!t) errors.push("The title is required.");
    row.title = t;
  }
  if (has("slug") || (!partial && b.title)) {
    const raw = str(b.slug, 100) || str(b.title, 220);
    const slug = slugifyQuestion(raw);
    if ((!slug || !SLUG.test(slug)) && (raw || partial)) errors.push("Please enter a valid page address (letters, numbers and hyphens).");
    row.slug = slug;
  }

  // YouTube link (any form) or a bare id
  const link = str(b.youtubeUrl, 400) || str(b.youtubeId, 400);
  if (link) {
    const yt = parseYouTube(link);
    if (!yt) errors.push("That does not look like a YouTube link. Paste the video address, e.g. https://www.youtube.com/shorts/abc123XYZ_-");
    else {
      row.youtube_id = yt.id;
      if (b.format === undefined && yt.vertical) row.format = "vertical"; // a /shorts/ link is always vertical
    }
  } else if (!partial) {
    errors.push("A YouTube video link is required.");
  }

  if (b.format !== undefined) {
    const f = str(b.format, 20);
    if (!["vertical", "horizontal"].includes(f)) errors.push("Format must be vertical or horizontal.");
    row.format = f;
  } else if (!partial && row.format === undefined) {
    row.format = "vertical";
  }

  if (has("description")) row.description = plainText(typeof b.description === "string" ? b.description : "", 400);
  if (has("thumbnailUrl")) {
    const t = str(b.thumbnailUrl, 600);
    if (t && !isHttp(t) && !t.startsWith("/")) errors.push("The cover image must be a web address.");
    row.thumbnail_url = t;
  }
  if (b.durationSeconds !== undefined || b.duration !== undefined) {
    // pick by presence, not with ??, because an explicit null means "clear the length"
    const raw = b.durationSeconds !== undefined ? b.durationSeconds : b.duration;
    const cleared = raw === null || raw === "";
    const sec = typeof raw === "number" ? Math.round(raw) : parseDuration(String(raw ?? ""));
    if (!cleared && (sec === null || sec < 0 || sec > 86400)) errors.push("Video length must look like 0:58 or 12:05.");
    row.duration_seconds = cleared ? null : sec;
  }
  if (has("uploadDate")) {
    const d = str(b.uploadDate, 10);
    if (d && (!/^\d{4}-\d{2}-\d{2}$/.test(d) || Number.isNaN(new Date(d).getTime()))) errors.push("Upload date must be a valid date.");
    row.upload_date = d || null;
  }
  if (has("category")) row.category = str(b.category, 60);
  if (has("authorName")) row.author_name = str(b.authorName, 100);
  if (has("authorCredentials")) row.author_credentials = str(b.authorCredentials, 200);
  if (has("transcript")) row.transcript = plainText(typeof b.transcript === "string" ? b.transcript.replace(/\r/g, "") : "", 40000);
  if (has("content")) row.content = sanitizeHtml(typeof b.content === "string" ? b.content.trim().slice(0, 60000) : "");
  if (has("shortAnswer")) row.short_answer = str(b.shortAnswer, 700);

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
  if (has("relatedVideos")) row.related_videos = list(b.relatedVideos, 12, 100).filter((s) => SLUG.test(s));
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
  if (has("featured")) row.featured = !!b.featured;

  if (b.status !== undefined) {
    const status = str(b.status, 20);
    if (!["draft", "published"].includes(status)) errors.push("Invalid status.");
    row.status = status;
  } else if (!partial) {
    row.status = "draft";
  }

  return errors.length ? { ok: false, errors } : { ok: true, row };
}

/* ------------------------ "fill the blanks" helper ------------------------ */

/** Sensible starting values for anything left empty. Never overwrites what you wrote. */
export function blanksForVideo(v: VideoPost, all: VideoPost[]): Row {
  const patch: Row = {};
  const source = v.description.trim() || stripHtml(v.content) || transcriptPlain(parseTranscript(v.transcript));
  if (!v.shortAnswer.trim() && source) patch.short_answer = leadingWords(source, 55);
  if (!v.focusKeyword.trim()) patch.focus_keyword = defaultVideoFocusKeyword(v.title);
  const filled: VideoPost = {
    ...v,
    shortAnswer: (patch.short_answer as string) || v.shortAnswer,
    focusKeyword: (patch.focus_keyword as string) || v.focusKeyword,
  };
  if (!v.metaTitle.trim()) patch.meta_title = effectiveMetaTitle({ ...filled, metaTitle: "" });
  if (!v.metaDescription.trim()) patch.meta_description = effectiveMetaDescription({ ...filled, metaDescription: "" });
  if (v.relatedVideos.length === 0) {
    const pool = relatedVideos(filled, all, 4);
    if (pool.length) patch.related_videos = pool.map((o) => o.slug);
  }
  return patch;
}

/* ------------------- import from the old blog-post videos ------------------- */

export const DEMO_YOUTUBE_ID = "dQw4w9WgXcQ"; // the placeholder the old pages fell back to. Never a real video.

const DEFAULT_PLACEHOLDER_IMAGES = ["/images/insight_video.png", "/images/anara_video.png"];
const GENERIC_CATEGORIES = ["video transcripts", "video blog", "video blogs", "video"];

/**
 * Converts a row of the old `blogs` table (a video blog post) into a video_posts row.
 * Returns the reason when it cannot be imported (e.g. no real YouTube link).
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function videoRowFromBlog(b: any): { ok: true; row: Row } | { ok: false; reason: string } {
  const candidates: string[] = [b.video_embed_url, ...(Array.isArray(b.videos) ? b.videos : [])].filter((x) => typeof x === "string" && x.trim());
  const yt = candidates.map((c) => parseYouTube(c)).find(Boolean) || null;
  if (!yt) return { ok: false, reason: "no YouTube link" };
  if (yt.id === DEMO_YOUTUBE_ID) return { ok: false, reason: "placeholder video, not a real one" };
  const title = String(b.title || "").trim().slice(0, 220);
  if (!title) return { ok: false, reason: "no title" };

  const html = String(b.content || "");
  const plain = stripHtml(html);
  const description = plainText(String(b.tldr || "") || plain, 400);
  const rawDate = String(b.date || "");
  const parsedDate = rawDate && !Number.isNaN(Date.parse(rawDate)) ? new Date(rawDate).toISOString().slice(0, 10) : null;
  const category = String(b.category || "").trim();
  const image = String(b.image || "").trim();
  const faqQs = Array.isArray(b.faq_pairs) ? b.faq_pairs.map((p: { question?: string }) => String(p?.question || "").trim()).filter(Boolean).slice(0, 10) : [];
  const published = (b.approval_status === undefined || b.approval_status === "published") && b.status !== "draft" && b.status !== "scheduled";

  return {
    ok: true,
    row: {
      title,
      slug: slugifyQuestion(String(b.slug || "") || title),
      description,
      format: "vertical", // matches your Shorts-first channel. Flip any horizontal video in the editor
      youtube_id: yt.id,
      thumbnail_url: /^(https?:\/\/)/i.test(image) && !DEFAULT_PLACEHOLDER_IMAGES.includes(image) ? image : "",
      upload_date: parsedDate,
      category: GENERIC_CATEGORIES.includes(category.toLowerCase()) ? "" : category.slice(0, 60),
      author_name: String(b.author || "").trim().slice(0, 100),
      author_credentials: String(b.author_bio || "").trim().slice(0, 200),
      transcript: String(b.video_transcript || "").replace(/\r/g, "").slice(0, 40000),
      content: sanitizeHtml(html.slice(0, 60000)),
      short_answer: String(b.tldr || "").trim().slice(0, 700),
      alternate_questions: faqQs,
      reviewed_by: String(b.reviewed_by || "").trim().slice(0, 100),
      meta_title: String(b.meta_title || "").trim().slice(0, 120),
      meta_description: String(b.meta_description || "").trim().slice(0, 320),
      focus_keyword: String(b.focus_keyword || "").trim().slice(0, 80),
      canonical_url: /^https?:\/\//i.test(String(b.canonical_url || "")) ? String(b.canonical_url) : "",
      noindex: /noindex/i.test(String(b.robots_directive || "")),
      status: published ? "published" : "draft",
      source_blog_id: String(b.id),
    },
  };
}
