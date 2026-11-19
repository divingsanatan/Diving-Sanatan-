import { SITE_NAME, SITE_URL, stripHtml, truncate, wordCount } from "./shopShared";
import { leadingWords } from "./glossaryShared";
import {
  FAQ_SLUG_MAX,
  covers,
  isUrl,
  sentences,
  sumChecks,
  tokens,
  defaultFocusKeyword,
  type Check,
  type FaqSource,
  type Scores,
} from "./faqShared";
import { YOUTUBE_CHANNEL_URL, youtubeEmbedBase, youtubeThumb } from "./youtube";

/**
 * Video Blogs logic shared by the server, the public pages and the admin screen.
 * No database access in here. Same approach as faqShared.ts / qaShared.ts.
 */

export type VideoFormat = "vertical" | "horizontal";
export type VideoStatus = "draft" | "published";

export interface VideoPost {
  id: string;
  slug: string;
  title: string;
  description: string; // short plain-text summary (cards, search results)
  format: VideoFormat;
  youtubeId: string;
  thumbnailUrl: string; // custom cover; "" = the YouTube thumbnail
  durationSeconds: number | null;
  uploadDate: string | null; // YYYY-MM-DD
  category: string;
  authorName: string;
  authorCredentials: string;
  transcript: string; // raw, timestamped lines
  content: string; // optional written article (HTML)
  shortAnswer: string;
  keyTakeaways: string[];
  alternateQuestions: string[]; // questions this video answers
  sources: FaqSource[];
  sameAs: string[];
  relatedVideos: string[]; // slugs
  reviewedBy: string;
  lastReviewed: string | null;
  metaTitle: string;
  metaDescription: string;
  focusKeyword: string;
  secondaryKeywords: string[];
  canonicalUrl: string;
  ogImage: string;
  noindex: boolean;
  featured: boolean;
  status: VideoStatus;
  sourceBlogId: string;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export const VIDEO_PATH = "/blog/video-transcripts";
export const videoPath = (slug: string) => `${VIDEO_PATH}/${slug}`;
export const videoUrl = (slug: string) => `${SITE_URL}${videoPath(slug)}`;
export const VIDEO_HUB_NAME = "Diving Sanatan Video Blogs";
export const VIDEO_DEFAULT_CATEGORIES = ["Meditation & Mindfulness", "Chakra Healing", "Mind & Emotions", "Vedic Wisdom", "Shorts"];

/** Database row -> app object. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function mapVideoRow(r: any): VideoPost {
  const arr = <T,>(v: unknown): T[] => (Array.isArray(v) ? (v as T[]) : []);
  return {
    id: r.id,
    slug: r.slug || "",
    title: r.title ?? "",
    description: r.description ?? "",
    format: r.format === "horizontal" ? "horizontal" : "vertical",
    youtubeId: r.youtube_id ?? "",
    thumbnailUrl: r.thumbnail_url ?? "",
    durationSeconds: typeof r.duration_seconds === "number" ? r.duration_seconds : null,
    uploadDate: r.upload_date ? String(r.upload_date).slice(0, 10) : null,
    category: r.category ?? "",
    authorName: r.author_name ?? "",
    authorCredentials: r.author_credentials ?? "",
    transcript: r.transcript ?? "",
    content: r.content ?? "",
    shortAnswer: r.short_answer ?? "",
    keyTakeaways: arr<string>(r.key_takeaways),
    alternateQuestions: arr<string>(r.alternate_questions),
    sources: arr<FaqSource>(r.sources).filter((s) => s && s.url),
    sameAs: arr<string>(r.same_as),
    relatedVideos: arr<string>(r.related_videos),
    reviewedBy: r.reviewed_by ?? "",
    lastReviewed: r.last_reviewed ? String(r.last_reviewed).slice(0, 10) : null,
    metaTitle: r.meta_title ?? "",
    metaDescription: r.meta_description ?? "",
    focusKeyword: r.focus_keyword ?? "",
    secondaryKeywords: arr<string>(r.secondary_keywords),
    canonicalUrl: r.canonical_url ?? "",
    ogImage: r.og_image ?? "",
    noindex: !!r.noindex,
    featured: !!r.featured,
    status: r.status === "published" ? "published" : "draft",
    sourceBlogId: r.source_blog_id ?? "",
    publishedAt: r.published_at ?? null,
    createdAt: r.created_at ?? "",
    updatedAt: r.updated_at ?? r.created_at ?? "",
  };
}

/* ---------- transcript and duration ---------- */

export interface TranscriptLine {
  seconds: number;
  timeStr: string; // "0:12" or "1:02:03"
  text: string;
  timed: boolean; // false when the line had no timestamp
}

export function formatDuration(total: number | null | undefined): string {
  if (total === null || total === undefined || !Number.isFinite(total) || total < 0) return "";
  const s = Math.floor(total);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  return h > 0 ? `${h}:${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}` : `${m}:${String(sec).padStart(2, "0")}`;
}

/** "58", "0:58", "12:05" or "1:02:03" -> seconds (null when it cannot be understood). */
export function parseDuration(input: string): number | null {
  const t = (input || "").trim();
  if (!t) return null;
  if (/^\d+$/.test(t)) return parseInt(t, 10);
  const m = t.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?$/);
  if (!m) return null;
  return m[3] !== undefined ? +m[1] * 3600 + +m[2] * 60 + +m[3] : +m[1] * 60 + +m[2];
}

/** seconds -> ISO 8601 duration for structured data, e.g. 125 -> "PT2M5S" */
export function isoDuration(total: number): string {
  const s = Math.max(0, Math.floor(total));
  const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), sec = s % 60;
  return `PT${h ? `${h}H` : ""}${m ? `${m}M` : ""}${sec || (!h && !m) ? `${sec}S` : ""}`;
}

/**
 * Turns "0:12 Welcome" / "[01:05] Breathe in" / "1:02:03 - Closing" lines into timed lines.
 * Lines without a timestamp are kept (shown as plain text) and flagged timed:false.
 */
export function parseTranscript(text: string | null | undefined): TranscriptLine[] {
  if (!text || !text.trim()) return [];
  const out: TranscriptLine[] = [];
  for (const raw of text.split("\n")) {
    const line = raw.trim();
    if (!line) continue;
    const m = line.match(/^\[?(?:(\d{1,2}):)?(\d{1,2}):(\d{2})\]?\s*[-–:]?\s*(.*)$/);
    if (m && (m[1] !== undefined || +m[2] < 100)) {
      const h = m[1] !== undefined ? parseInt(m[1], 10) : 0;
      const seconds = h * 3600 + parseInt(m[2], 10) * 60 + parseInt(m[3], 10);
      out.push({ seconds, timeStr: formatDuration(seconds), text: (m[4] || "").trim(), timed: true });
    } else {
      out.push({ seconds: out.length ? out[out.length - 1].seconds : 0, timeStr: "", text: line, timed: false });
    }
  }
  return out.filter((l) => l.text);
}

export const transcriptPlain = (lines: TranscriptLine[]) => lines.map((l) => l.text).join(" ").replace(/\s+/g, " ").trim();

/* ---------- "effective" values: what search engines and visitors will see ---------- */

export const thumbnailOf = (v: Pick<VideoPost, "thumbnailUrl" | "youtubeId">) => v.thumbnailUrl.trim() || youtubeThumb(v.youtubeId);

export const isPublishedVideo = (v: VideoPost) => v.status === "published";
export const isIndexableVideo = (v: VideoPost) => v.status === "published" && !v.noindex;

export function effectiveSummary(v: VideoPost): string {
  return v.shortAnswer.trim() || v.description.trim() || leadingWords(v.content || transcriptPlain(parseTranscript(v.transcript)), 55);
}

export function effectiveMetaTitle(v: VideoPost): string {
  if (v.metaTitle.trim()) return v.metaTitle.trim();
  const t = v.title.replace(/\s+/g, " ").trim() || "Video";
  const long = `${t} | ${SITE_NAME}`;
  if (long.length <= 62) return long;
  return t.length <= 62 ? t : truncate(t, 60);
}

export const effectiveMetaDescription = (v: VideoPost) => v.metaDescription.trim() || truncate(effectiveSummary(v), 155);
export const effectiveCanonical = (v: VideoPost) => v.canonicalUrl.trim() || videoUrl(v.slug);
export const defaultVideoFocusKeyword = (title: string) => defaultFocusKeyword(title.replace(/[|:–-].*$/, ""));

/** Up to n other published videos about the same thing (shared words, same category first). */
export function relatedVideos(v: VideoPost, all: VideoPost[], n = 4): VideoPost[] {
  const mine = new Set(tokens(`${v.title} ${v.focusKeyword} ${v.category}`));
  const pool = all.filter((o) => o.id !== v.id && isIndexableVideo(o));
  const scored = pool
    .map((o) => {
      const t = tokens(`${o.title} ${o.focusKeyword}`).filter((x) => mine.has(x)).length * 3;
      return { o, score: t + (v.category && o.category === v.category ? 2 : 0) };
    })
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score || (b.o.uploadDate || "").localeCompare(a.o.uploadDate || ""));
  const picked = scored.slice(0, n).map((x) => x.o);
  if (picked.length >= n) return picked;
  return [...picked, ...pool.filter((o) => !picked.includes(o)).slice(0, n - picked.length)];
}

/* ---------- scoring ---------- */

const QUESTION = /^(what|why|how|is|are|can|could|does|do|did|who|when|where|which|should|will|would)\b/i;

export function scoreVideo(v: VideoPost, now: number = Date.now()): Scores {
  const kw = v.focusKeyword.trim().toLowerCase();
  const title = effectiveMetaTitle(v);
  const desc = effectiveMetaDescription(v);
  const summary = effectiveSummary(v);
  const summaryWords = summary.split(/\s+/).filter(Boolean).length;
  const hasShort = !!v.shortAnswer.trim();
  const lines = parseTranscript(v.transcript);
  const transcriptText = transcriptPlain(lines);
  const transcriptWords = transcriptText ? transcriptText.split(/\s+/).length : 0;
  const timedLines = lines.filter((l) => l.timed).length;
  const writeUpWords = wordCount(v.content);
  const bodyText = `${v.description} ${stripHtml(v.content)} ${transcriptText}`;
  const first100 = bodyText.split(/\s+/).slice(0, 100).join(" ");
  const totalWords = bodyText.split(/\s+/).filter(Boolean).length;
  const customTitle = v.metaTitle.trim();
  const customDesc = v.metaDescription.trim();
  const validSources = v.sources.filter((s) => s.title.trim() && isUrl(s.url));
  const months = v.lastReviewed ? (now - new Date(v.lastReviewed).getTime()) / (1000 * 60 * 60 * 24 * 30.4) : Infinity;
  const altQs = v.alternateQuestions.filter((q) => q.trim());
  const takeaways = v.keyTakeaways.filter((t) => t.trim());
  const titleWords = v.title.trim().split(/\s+/).filter(Boolean).length;
  const slugWords = new Set(v.slug.split("-"));
  const kwWords = tokens(kw);
  const kwInSlug = kwWords.length > 0 && kwWords.filter((w) => slugWords.has(w) || v.slug.includes(w)).length / kwWords.length >= 0.5;
  const avgSentence = (() => {
    const s = sentences(summary);
    return s.length ? summaryWords / s.length : 0;
  })();

  const seo: Check[] = [
    { id: "title", label: "Custom SEO title is 30–60 characters", pass: customTitle.length >= 30 && customTitle.length <= 60, weight: 10,
      hint: customTitle ? `Currently ${customTitle.length} characters.` : `Not set. Search engines will use: “${title}”.` },
    { id: "desc", label: "Custom meta description is 70–160 characters", pass: customDesc.length >= 70 && customDesc.length <= 160, weight: 10,
      hint: customDesc ? `Currently ${customDesc.length} characters.` : "Not set. An auto-summary is used, which is rarely the most clickable." },
    { id: "kw", label: "Focus keyword is set", pass: !!kw, weight: 6, hint: "The phrase people search for, e.g. “hanuman ji ka rahasya”." },
    { id: "kwTitle", label: "Focus keyword is in the title", pass: covers(title, kw), weight: 9, hint: "Use the words people search for in the title." },
    { id: "kwDesc", label: "Focus keyword is in the meta description", pass: covers(desc, kw), weight: 7, hint: "Use it naturally once." },
    { id: "kwSlug", label: "Focus keyword is in the page address", pass: kwInSlug, weight: 5, hint: "Short, keyword-rich addresses rank and read better." },
    { id: "kwBody", label: "Focus keyword appears in the first 100 words of the text", pass: covers(first100, kw), weight: 5, hint: "Mention it early in the description or transcript." },
    { id: "transcript", label: "Has a transcript of 100+ words", pass: transcriptWords >= 100, weight: 12,
      hint: transcriptWords ? `Currently ${transcriptWords} words.` : "Search engines cannot watch videos. The transcript is the text they index. Paste the captions from YouTube Studio." },
    { id: "depth", label: "Page has 250+ words of text (description, write-up and transcript)", pass: totalWords >= 250, weight: 10, hint: `Currently ${totalWords} words. Thin video pages rank poorly.` },
    { id: "duration", label: "Video length is set", pass: !!v.durationSeconds && v.durationSeconds > 0, weight: 5, hint: "Needed for the video structured data." },
    { id: "date", label: "Upload date is set", pass: !!v.uploadDate, weight: 4, hint: "The date the video went live on YouTube." },
    { id: "links", label: "Links to 2+ related videos (internal links)", pass: v.relatedVideos.length >= 2, weight: 8, hint: "Related videos keep visitors watching and build crawlable links." },
    { id: "qlen", label: "Title is clear and 3–15 words", pass: titleWords >= 3 && titleWords <= 15, weight: 4, hint: `Currently ${titleWords} words.` },
    { id: "cover", label: "Custom cover or social image is set", pass: !!v.thumbnailUrl.trim() || isUrl(v.ogImage), weight: 3, hint: "A cover made for the page stands out when shared." },
    { id: "slug", label: "Page address is short and clean (≤ 60 characters)", pass: v.slug.length > 0 && v.slug.length <= FAQ_SLUG_MAX, weight: 1, hint: "Remove filler words from the address." },
    { id: "index", label: "Live and allowed in search results", pass: v.status === "published" && !v.noindex, weight: 1,
      hint: v.status !== "published" ? "Draft videos are not public." : "Marked noindex: hidden from Google." },
  ];

  const geo: Check[] = [
    { id: "answer", label: "Has a direct summary of 30–70 words", pass: hasShort && summaryWords >= 30 && summaryWords <= 70, weight: 16,
      hint: hasShort ? `Currently ${summaryWords} words.` : "AI assistants quote a clear, self-contained summary. Write one." },
    { id: "subject", label: "Summary names its subject (doesn’t start with “It”, “This”, “They”…)", pass: hasShort && !/^(it|this|that|they|these|those|there|here)\b/i.test(v.shortAnswer.trim()), weight: 6,
      hint: "AI engines lift the summary out of the page, so it must make sense on its own." },
    { id: "lead", label: "Summary leads with the point (no “in this video…” filler)", pass: hasShort && !/^(in this video|hello|hi |namaste|welcome|today)/i.test(v.shortAnswer.trim()), weight: 6,
      hint: "State the answer or the idea first. “In this video…” adds nothing." },
    { id: "transcript", label: "Transcript of 100+ words (AI cannot watch the video)", pass: transcriptWords >= 100, weight: 10, hint: "AI systems read text. The transcript is what they can cite." },
    { id: "takeaways", label: "3+ key takeaways", pass: takeaways.length >= 3, weight: 10, hint: "Short bullet facts are easy for AI systems to cite." },
    { id: "sources", label: "2+ cited sources", pass: validSources.length >= 2, weight: 12, hint: "Cite the scripture, book or study you mention. AI engines trust pages that cite sources." },
    { id: "entity", label: "Linked to a trusted reference (Wikipedia / Wikidata)", pass: v.sameAs.filter(isUrl).length >= 1, weight: 10, hint: "Entity links connect your video to the knowledge graph AI systems use." },
    { id: "reviewed", label: "Reviewed by a named expert in the last 12 months", pass: !!v.reviewedBy.trim() && months <= 12, weight: 8, hint: "Freshness and expertise signals (E-E-A-T)." },
    { id: "speaker", label: "Speaker is named with credentials", pass: !!v.authorName.trim() && !!v.authorCredentials.trim(), weight: 10, hint: "Say who is speaking and why they can be trusted on this topic." },
    { id: "alt", label: "2+ questions this video answers", pass: altQs.length >= 2, weight: 6, hint: "e.g. “Why is Hanuman called Sankat Mochan?”. Helps match how people ask." },
    { id: "writeup", label: "Written write-up of 100+ words", pass: writeUpWords >= 100, weight: 6, hint: "A short article under the video gives AI systems more to quote." },
  ];

  const aeo: Check[] = [
    { id: "ans", label: "Summary is 40–60 words (featured-snippet length)", pass: hasShort && summaryWords >= 40 && summaryWords <= 60, weight: 22, hint: `Currently ${hasShort ? summaryWords : 0} words.` },
    { id: "q", label: "A question this video answers starts with What / Why / How…", pass: QUESTION.test(v.title.trim()) || altQs.some((q) => QUESTION.test(q.trim())), weight: 15, hint: "Add the question people ask. Question-style phrasing is what answer engines match." },
    { id: "speak", label: "Summary can be read aloud (≤ 3 sentences)", pass: hasShort && sentences(v.shortAnswer).length <= 3 && summaryWords <= 60, weight: 10, hint: "Voice assistants read short, complete answers." },
    { id: "plain", label: "Summary is easy to follow (sentences average ≤ 22 words)", pass: hasShort && avgSentence > 0 && avgSentence <= 22, weight: 5, hint: "Shorter sentences are easier to read aloud." },
    { id: "bullets", label: "Key takeaways list", pass: takeaways.length >= 3, weight: 10, hint: "Bullet lists are favoured for list-style answers." },
    { id: "moments", label: "Timestamped transcript with 3+ moments (Key Moments)", pass: timedLines >= 3, weight: 10, hint: "Timestamps let Google and visitors jump to the part that answers the question." },
    { id: "alt", label: "2+ alternate questions for voice search", pass: altQs.length >= 2, weight: 10, hint: "People ask the same thing in many ways." },
    { id: "related", label: "2+ related videos for follow-ups", pass: v.relatedVideos.length >= 2, weight: 8, hint: "Answer engines love connected topics." },
    { id: "text", label: "Transcript or write-up of 100+ words", pass: transcriptWords >= 100 || writeUpWords >= 100, weight: 10, hint: "Without text, the page has nothing to answer with." },
  ];

  const s = sumChecks(seo), g = sumChecks(geo), a = sumChecks(aeo);
  return {
    seo: { score: s, checks: seo },
    geo: { score: g, checks: geo },
    aeo: { score: a, checks: aeo },
    overall: Math.round(s * 0.4 + g * 0.35 + a * 0.25),
  };
}

/* ---------- structured data (JSON-LD) ---------- */

const isoDate = (s: string | null | undefined) => (s ? new Date(s.length === 10 ? `${s}T00:00:00Z` : s).toISOString() : undefined);
const ORG_ID = `${SITE_URL}/#organization`;

const organization = {
  "@type": "Organization",
  "@id": ORG_ID,
  name: SITE_NAME,
  url: SITE_URL,
  // the YouTube channel is a verified "same as" of the brand: a strong entity signal for search and AI
  sameAs: [YOUTUBE_CHANNEL_URL],
};

/**
 * One @graph per video page: VideoObject (what Google uses for video results and Key Moments),
 * WebPage (+speakable summary), and BreadcrumbList. Everything marked up is visible on the page.
 */
export function videoJsonLd(v: VideoPost) {
  const url = videoUrl(v.slug);
  const lines = parseTranscript(v.transcript);
  const transcript = transcriptPlain(lines);
  const thumb = thumbnailOf(v);
  const sameAs = v.sameAs.filter(isUrl);
  const sources = v.sources.filter((s) => s.title.trim() && isUrl(s.url));
  const topic = (v.focusKeyword.trim() || v.title).trim();
  const keywords = [v.focusKeyword, ...v.secondaryKeywords].filter(Boolean).join(", ");
  const summary = effectiveSummary(v);

  const video: Record<string, unknown> = {
    "@type": "VideoObject",
    "@id": `${url}#video`,
    name: v.title.trim(),
    description: summary || v.title.trim(),
    thumbnailUrl: [thumb],
    uploadDate: isoDate(v.uploadDate || v.publishedAt || v.createdAt),
    embedUrl: youtubeEmbedBase(v.youtubeId),
    url,
    isAccessibleForFree: true,
    ...(v.durationSeconds ? { duration: isoDuration(v.durationSeconds) } : {}),
    ...(transcript ? { transcript: transcript.slice(0, 8000) } : {}),
    ...(keywords ? { keywords } : {}),
    ...(v.category ? { genre: v.category } : {}),
    ...(v.authorName.trim()
      ? { author: { "@type": "Person", name: v.authorName.trim(), ...(v.authorCredentials.trim() ? { description: v.authorCredentials.trim() } : {}) } }
      : {}),
    publisher: { "@id": ORG_ID },
    ...(sameAs.length ? { about: { "@type": "Thing", name: topic, sameAs } } : {}),
  };

  const graph: Record<string, unknown>[] = [
    organization,
    video,
    {
      "@type": "WebPage",
      "@id": url,
      url,
      name: effectiveMetaTitle(v),
      description: effectiveMetaDescription(v),
      inLanguage: "en",
      isPartOf: { "@type": "WebSite", name: SITE_NAME, url: SITE_URL },
      mainEntity: { "@id": `${url}#video` },
      primaryImageOfPage: { "@type": "ImageObject", url: thumb },
      ...(v.publishedAt ? { datePublished: isoDate(v.publishedAt) } : {}),
      ...(v.updatedAt ? { dateModified: isoDate(v.updatedAt) } : {}),
      ...(v.lastReviewed ? { lastReviewed: v.lastReviewed } : {}),
      ...(v.reviewedBy.trim() ? { reviewedBy: { "@type": "Person", name: v.reviewedBy.trim() } } : {}),
      ...(sources.length ? { citation: sources.map((s) => ({ "@type": "CreativeWork", name: s.title, url: s.url })) } : {}),
      speakable: { "@type": "SpeakableSpecification", cssSelector: [".speakable-answer", "h1"] },
    },
    {
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
        { "@type": "ListItem", position: 2, name: "Blog", item: `${SITE_URL}/blog` },
        { "@type": "ListItem", position: 3, name: "Video Blogs", item: `${SITE_URL}${VIDEO_PATH}` },
        { "@type": "ListItem", position: 4, name: truncate(v.title.trim(), 80), item: url },
      ],
    },
  ];
  return { "@context": "https://schema.org", "@graph": graph };
}

/** The video hub. Lists the videos; each video page carries its own VideoObject. */
export function videoIndexJsonLd(videos: VideoPost[]) {
  const url = `${SITE_URL}${VIDEO_PATH}`;
  const list = videos.filter(isIndexableVideo);
  return {
    "@context": "https://schema.org",
    "@graph": [
      organization,
      {
        "@type": "CollectionPage",
        "@id": url,
        url,
        name: `${VIDEO_HUB_NAME}: Short Videos on Healing, Meditation & Vedic Wisdom`,
        inLanguage: "en",
        isPartOf: { "@type": "WebSite", name: SITE_NAME, url: SITE_URL },
        publisher: { "@id": ORG_ID },
        mainEntity: { "@id": `${url}#list` },
      },
      {
        "@type": "ItemList",
        "@id": `${url}#list`,
        name: VIDEO_HUB_NAME,
        numberOfItems: list.length,
        itemListElement: list.slice(0, 200).map((v, i) => ({ "@type": "ListItem", position: i + 1, url: videoUrl(v.slug), name: v.title.trim() })),
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
          { "@type": "ListItem", position: 2, name: "Blog", item: `${SITE_URL}/blog` },
          { "@type": "ListItem", position: 3, name: "Video Blogs", item: url },
        ],
      },
    ],
  };
}

