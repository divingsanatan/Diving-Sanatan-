import { SITE_NAME, SITE_URL, slugify, stripHtml, truncate, wordCount } from "./shopShared";
import { leadingWords } from "./glossaryShared";

/**
 * FAQ logic shared by the server, the public pages and the admin screen.
 * No database access in here. Mirrors glossaryShared.ts so both sections work the same way.
 */

export interface FaqSource {
  title: string;
  url: string;
}

export interface FaqEntry {
  id: string;
  slug: string;
  question: string;
  answer: string; // full answer (HTML from the editor)
  status: "draft" | "published";
  verified: boolean; // shows the "verified by an expert" badge
  isPublished: boolean; // legacy flag, always equals status === "published"
  shortAnswer: string; // the self-contained answer AI assistants and Google quote
  extendedContent: string; // optional deeper explanation (HTML)
  alternateQuestions: string[]; // other ways people phrase the same question
  keyTakeaways: string[];
  sources: FaqSource[];
  sameAs: string[]; // Wikipedia / Wikidata links for the main concept
  relatedFaqs: string[]; // slugs of other FAQs
  reviewedBy: string;
  lastReviewed: string | null; // YYYY-MM-DD
  metaTitle: string;
  metaDescription: string;
  focusKeyword: string;
  secondaryKeywords: string[];
  canonicalUrl: string;
  ogImage: string;
  noindex: boolean;
  createdAt: string;
  updatedAt: string;
}

export const FAQ_PATH = "/blog/faq";
export const faqPath = (slug: string) => `${FAQ_PATH}/${slug}`;
export const faqUrl = (slug: string) => `${SITE_URL}${faqPath(slug)}`;
export const FAQ_NAME = "Diving Sanatan FAQ";
export const FAQ_SLUG_MAX = 60;

/** Database row (snake_case) -> app object. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function mapFaqRow(r: any): FaqEntry {
  const arr = <T,>(v: unknown): T[] => (Array.isArray(v) ? (v as T[]) : []);
  // status is the source of truth; fall back to the old flag for rows read before the migration
  const status: FaqEntry["status"] =
    r.status === "draft" || (r.status === undefined && r.is_published === false) ? "draft" : "published";
  return {
    id: r.id,
    slug: r.slug || "",
    question: r.question ?? "",
    answer: r.answer ?? "",
    status,
    verified: !!r.verified,
    isPublished: status === "published",
    shortAnswer: r.short_answer ?? "",
    extendedContent: r.extended_content ?? "",
    alternateQuestions: arr<string>(r.alternate_questions),
    keyTakeaways: arr<string>(r.key_takeaways),
    sources: arr<FaqSource>(r.sources).filter((s) => s && s.url),
    sameAs: arr<string>(r.same_as),
    relatedFaqs: arr<string>(r.related_faqs),
    reviewedBy: r.reviewed_by ?? "",
    lastReviewed: r.last_reviewed ? String(r.last_reviewed).slice(0, 10) : null,
    metaTitle: r.meta_title ?? "",
    metaDescription: r.meta_description ?? "",
    focusKeyword: r.focus_keyword ?? "",
    secondaryKeywords: arr<string>(r.secondary_keywords),
    canonicalUrl: r.canonical_url ?? "",
    ogImage: r.og_image ?? "",
    noindex: !!r.noindex,
    createdAt: r.created_at ?? "",
    updatedAt: r.updated_at ?? r.created_at ?? "",
  };
}

/** "What is holistic healing?" -> "what-is-holistic-healing" (max 60 characters, cut at a word boundary). */
export function slugifyQuestion(question: string): string {
  const full = slugify(question);
  if (full.length <= FAQ_SLUG_MAX) return full;
  const cut = full.slice(0, FAQ_SLUG_MAX);
  const lastDash = cut.lastIndexOf("-");
  return (lastDash > 0 ? cut.slice(0, lastDash) : cut).replace(/-+$/g, "");
}

/** Question without the trailing "?" and extra spaces. */
export const cleanQuestion = (q: string) => q.replace(/\s+/g, " ").replace(/\?+\s*$/, "").trim();

/** A sensible default focus keyword: the question itself, as people type it (max 9 words). */
export function defaultFocusKeyword(question: string): string {
  return cleanQuestion(question)
    .toLowerCase()
    .replace(/[^a-z0-9\s'-]/g, " ")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 9)
    .join(" ");
}

/* ---------- keyword helpers ---------- */

const STOP = new Set(
  "a an and are as at be by can do does for from has have how i in is it its my of on or our should the their there this to was we what when where which who why will with you your".split(" ")
);
const tokens = (s: string) => s.toLowerCase().replace(/[^a-z0-9\s]/g, " ").split(/\s+/).filter((t) => t && !STOP.has(t));

/** Does the text cover the keyword? (exact phrase, or at least 75% of its meaningful words) */
function covers(text: string, keyword: string): boolean {
  const kw = keyword.trim().toLowerCase();
  if (!kw) return false;
  const t = text.toLowerCase();
  if (t.includes(kw)) return true;
  const words = tokens(kw);
  if (words.length === 0) return false;
  return words.filter((w) => t.includes(w)).length / words.length >= 0.75;
}

/** Up to n published FAQs that talk about the same thing (shared meaningful words), best match first. */
export function relatedBySimilarity(e: FaqEntry, all: FaqEntry[], n = 4): FaqEntry[] {
  const mine = new Set(tokens(`${e.question} ${e.focusKeyword} ${e.alternateQuestions.join(" ")}`));
  const mineAns = new Set(tokens(stripHtml(e.shortAnswer || e.answer)));
  const scored = all
    .filter((o) => o.id !== e.id && o.status === "published" && !o.noindex)
    .map((o) => {
      const theirs = tokens(o.question);
      const q = theirs.filter((t) => mine.has(t)).length * 3;
      const a = tokens(stripHtml(o.shortAnswer || o.answer)).filter((t) => mine.has(t) || mineAns.has(t)).length;
      return { o, score: q + Math.min(a, 6) };
    })
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score || a.o.createdAt.localeCompare(b.o.createdAt));
  const picked = scored.slice(0, n).map((x) => x.o);
  if (picked.length >= n) return picked;
  // pad with the nearest neighbours so every page still links to others
  const rest = all.filter((o) => o.id !== e.id && o.status === "published" && !o.noindex && !picked.includes(o));
  return [...picked, ...rest.slice(0, n - picked.length)];
}

/* ---------- "effective" values: what search engines will actually see ---------- */

export const effectiveShortAnswer = (e: FaqEntry) => e.shortAnswer.trim() || leadingWords(e.answer, 55);

export function effectiveMetaTitle(e: FaqEntry): string {
  if (e.metaTitle.trim()) return e.metaTitle.trim();
  const q = e.question.replace(/\s+/g, " ").trim() || "FAQ";
  const long = `${q} | ${SITE_NAME}`;
  if (long.length <= 62) return long;
  return q.length <= 62 ? q : truncate(q, 60);
}

export const effectiveMetaDescription = (e: FaqEntry) =>
  e.metaDescription.trim() || truncate(effectiveShortAnswer(e), 155);

export const effectiveCanonical = (e: FaqEntry) => e.canonicalUrl.trim() || faqUrl(e.slug);

/* ---------- scoring ---------- */

export interface Check {
  id: string;
  label: string;
  pass: boolean;
  weight: number;
  hint: string;
}
export interface Pillar {
  score: number;
  checks: Check[];
}
export interface Scores {
  seo: Pillar;
  geo: Pillar;
  aeo: Pillar;
  overall: number;
}

const QUESTION = /^(what|why|how|is|are|can|could|does|do|did|who|when|where|which|should|will|would)\b.*\?$/i;
const isUrl = (s: string) => /^https?:\/\/[^\s]+\.[^\s]+/i.test(s.trim());
const sum = (checks: Check[]) => checks.reduce((n, c) => n + (c.pass ? c.weight : 0), 0);
const sentences = (s: string) => (s.match(/[^.!?]+[.!?]+(\s|$)|[^.!?]+$/g) || []).map((x) => x.trim()).filter(Boolean);

export function scoreFaq(e: FaqEntry, now: number = Date.now()): Scores {
  const kw = e.focusKeyword.trim().toLowerCase();
  const title = effectiveMetaTitle(e);
  const desc = effectiveMetaDescription(e);
  const answer = effectiveShortAnswer(e);
  const answerWords = answer.split(/\s+/).filter(Boolean).length;
  const hasShort = !!e.shortAnswer.trim();
  const full = stripHtml(`${e.answer} ${e.extendedContent}`);
  const first100 = full.split(" ").slice(0, 100).join(" ");
  const fullAnswerWords = wordCount(e.answer);
  const totalWords = fullAnswerWords + wordCount(e.extendedContent);
  const customTitle = e.metaTitle.trim();
  const customDesc = e.metaDescription.trim();
  const validSources = e.sources.filter((s) => s.title.trim() && isUrl(s.url));
  const months = e.lastReviewed ? (now - new Date(e.lastReviewed).getTime()) / (1000 * 60 * 60 * 24 * 30.4) : Infinity;
  const headings = (e.extendedContent.match(/<h[2-4][\s>]/gi) || []).length + (e.answer.match(/<h[2-4][\s>]/gi) || []).length;
  const lists = (e.extendedContent.match(/<(ul|ol)[\s>]/gi) || []).length + (e.answer.match(/<(ul|ol)[\s>]/gi) || []).length;
  const altQs = e.alternateQuestions.filter((q) => q.trim());
  const qWords = e.question.trim().split(/\s+/).filter(Boolean).length;
  const slugWords = new Set(e.slug.split("-"));
  const kwWords = tokens(kw);
  const kwInSlug = kwWords.length > 0 && kwWords.filter((w) => slugWords.has(w) || e.slug.includes(w)).length / kwWords.length >= 0.5;
  const takeaways = e.keyTakeaways.filter((t) => t.trim());
  const avgSentence = (() => {
    const s = sentences(answer);
    return s.length ? answerWords / s.length : 0;
  })();

  const seo: Check[] = [
    { id: "title", label: "Custom SEO title is 30–60 characters", pass: customTitle.length >= 30 && customTitle.length <= 60, weight: 12,
      hint: customTitle ? `Currently ${customTitle.length} characters.` : `Not set. Search engines will use: “${title}”.` },
    { id: "desc", label: "Custom meta description is 70–160 characters", pass: customDesc.length >= 70 && customDesc.length <= 160, weight: 12,
      hint: customDesc ? `Currently ${customDesc.length} characters.` : "Not set. An auto-summary is used, which is rarely the most clickable." },
    { id: "kw", label: "Focus keyword is set", pass: !!kw, weight: 8, hint: "The phrase people type, e.g. “what is holistic healing”." },
    { id: "kwTitle", label: "Focus keyword is in the title", pass: covers(title, kw), weight: 10, hint: "Use the words people search for in the title." },
    { id: "kwDesc", label: "Focus keyword is in the meta description", pass: covers(desc, kw), weight: 8, hint: "Use it naturally once." },
    { id: "kwSlug", label: "Focus keyword is in the page address", pass: kwInSlug, weight: 6, hint: "Short, keyword-rich addresses rank and read better." },
    { id: "kwBody", label: "Focus keyword appears in the first 100 words", pass: covers(first100, kw), weight: 6, hint: "Mention it early in the answer." },
    { id: "depth", label: "Answer and explanation total 150+ words", pass: totalWords >= 150, weight: 12, hint: `Currently ${totalWords} words. Thin pages rank poorly. Add detail to the full answer or the in-depth explanation.` },
    { id: "links", label: "Links to 2+ related questions (internal links)", pass: e.relatedFaqs.length >= 2, weight: 8, hint: "Related questions build a web of pages Google can crawl and trust." },
    { id: "qlen", label: "Question is clear and 4–15 words", pass: qWords >= 4 && qWords <= 15, weight: 6, hint: `Currently ${qWords} words. The question becomes the page heading and title.` },
    { id: "og", label: "Social sharing image is set", pass: isUrl(e.ogImage), weight: 4, hint: "Shown when the page is shared on WhatsApp, Facebook and X." },
    { id: "slug", label: "Page address is short and clean (≤ 60 characters)", pass: e.slug.length > 0 && e.slug.length <= FAQ_SLUG_MAX, weight: 4, hint: "Remove filler words from the address." },
    { id: "index", label: "Allowed to appear in search results", pass: !e.noindex && e.status === "published", weight: 4, hint: e.status !== "published" ? "Draft FAQs are not public." : "Marked noindex: hidden from Google." },
  ];

  const geo: Check[] = [
    { id: "answer", label: "Has a direct “quick answer” of 30–70 words", pass: hasShort && answerWords >= 30 && answerWords <= 70, weight: 18,
      hint: hasShort ? `Currently ${answerWords} words.` : "AI assistants quote a clear, self-contained answer. Write one." },
    { id: "subject", label: "Quick answer names its subject (doesn’t start with “It”, “This”, “They”…)", pass: hasShort && !/^(it|this|that|they|these|those|there|here)\b/i.test(e.shortAnswer.trim()), weight: 8,
      hint: "AI engines lift the answer out of the page, so it must make sense on its own." },
    { id: "lead", label: "Quick answer leads with the answer (no “it depends…” lead-in)", pass: hasShort && !/^(it depends|that depends|well,|so,|many (people|factors)|there (is|are) (many|no one))/i.test(e.shortAnswer.trim()), weight: 6,
      hint: "Give the answer first, then the nuance." },
    { id: "substance", label: "Full answer has 60+ words", pass: fullAnswerWords >= 60, weight: 10, hint: `Currently ${fullAnswerWords} words. Enough substance gives AI something worth citing.` },
    { id: "takeaways", label: "3+ key takeaways", pass: takeaways.length >= 3, weight: 10, hint: "Short bullet facts are easy for AI systems to cite." },
    { id: "sources", label: "2+ cited sources", pass: validSources.length >= 2, weight: 14, hint: "Cited, credible sources make AI engines trust and reference you." },
    { id: "entity", label: "Linked to a trusted reference (Wikipedia / Wikidata)", pass: e.sameAs.filter(isUrl).length >= 1, weight: 10, hint: "Entity links connect your page to the knowledge graph AI systems use." },
    { id: "reviewed", label: "Reviewed by a named expert in the last 12 months", pass: !!e.reviewedBy.trim() && months <= 12, weight: 10, hint: "Freshness and expertise signals (E-E-A-T)." },
    { id: "alt", label: "2+ alternate ways to ask the question", pass: altQs.length >= 2, weight: 8, hint: "e.g. “Is energy healing real?” and “Does Reiki actually work?”. Helps match how people phrase it." },
    { id: "extended", label: "In-depth explanation (120+ words)", pass: wordCount(e.extendedContent) >= 120, weight: 6, hint: "Gives AI systems more to quote and context to trust." },
  ];

  const aeo: Check[] = [
    { id: "ans", label: "Quick answer is 40–60 words (featured-snippet length)", pass: hasShort && answerWords >= 40 && answerWords <= 60, weight: 25, hint: `Currently ${hasShort ? answerWords : 0} words.` },
    { id: "q", label: "Question is a real question (“What is…?”, ends with ?)", pass: QUESTION.test(e.question.trim()), weight: 15, hint: "Start with What / Why / How / Is / Can and end with ?" },
    { id: "concise", label: "Question is concise (4–15 words)", pass: qWords >= 4 && qWords <= 15, weight: 10, hint: "Short questions match how people speak and type." },
    { id: "speak", label: "Quick answer can be read aloud (≤ 3 sentences)", pass: hasShort && sentences(e.shortAnswer).length <= 3 && answerWords <= 60, weight: 10, hint: "Voice assistants read short, complete answers." },
    { id: "plain", label: "Quick answer is easy to follow (sentences average ≤ 22 words)", pass: hasShort && avgSentence > 0 && avgSentence <= 22, weight: 5, hint: "Shorter sentences are easier to read aloud." },
    { id: "bullets", label: "Key takeaways list", pass: takeaways.length >= 3, weight: 10, hint: "Bullet lists are favoured for list-style answers." },
    { id: "structure", label: "Explanation is structured (2+ sub-headings or a list)", pass: headings >= 2 || lists >= 1, weight: 10, hint: "Use headings or a bulleted/numbered list so it can be scanned." },
    { id: "alt", label: "2+ alternate questions for voice search", pass: altQs.length >= 2, weight: 10, hint: "People ask the same thing in many ways." },
    { id: "related", label: "2+ related questions for follow-ups", pass: e.relatedFaqs.length >= 2, weight: 5, hint: "Answer engines love connected topics." },
  ];

  const s = sum(seo), g = sum(geo), a = sum(aeo);
  return {
    seo: { score: s, checks: seo },
    geo: { score: g, checks: geo },
    aeo: { score: a, checks: aeo },
    overall: Math.round(s * 0.4 + g * 0.35 + a * 0.25),
  };
}

export const scoreTone = (n: number) => (n >= 80 ? "good" : n >= 50 ? "ok" : "bad");

/* ---------- structured data (JSON-LD) ---------- */

const isoDate = (s: string) => (s ? new Date(s).toISOString() : undefined);

/**
 * One @graph per FAQ page: WebPage (+speakable), FAQPage with this question, and BreadcrumbList.
 * Note: Google stopped showing FAQ rich results on 7 May 2026, but FAQPage is still valid
 * schema.org that other search engines and AI systems read. The visible page is what matters most.
 */
export function faqJsonLd(e: FaqEntry) {
  const url = faqUrl(e.slug);
  const title = effectiveMetaTitle(e);
  const description = effectiveMetaDescription(e);
  const sameAs = e.sameAs.filter(isUrl);
  const sources = e.sources.filter((s) => s.title.trim() && isUrl(s.url));
  const topic = (e.focusKeyword.trim() || cleanQuestion(e.question)).trim();
  const alts = e.alternateQuestions.filter((q) => q.trim());
  const answerText = stripHtml(e.answer) || effectiveShortAnswer(e);

  const graph: Record<string, unknown>[] = [
    {
      "@type": "WebPage",
      "@id": url,
      url,
      name: title,
      description,
      inLanguage: "en",
      isPartOf: { "@type": "WebSite", name: SITE_NAME, url: SITE_URL },
      mainEntity: { "@id": `${url}#faq` },
      ...(e.createdAt ? { datePublished: isoDate(e.createdAt) } : {}),
      ...(e.updatedAt ? { dateModified: isoDate(e.updatedAt) } : {}),
      ...(e.lastReviewed ? { lastReviewed: e.lastReviewed } : {}),
      ...(e.reviewedBy.trim() ? { reviewedBy: { "@type": "Person", name: e.reviewedBy.trim() } } : {}),
      ...(sources.length ? { citation: sources.map((s) => ({ "@type": "CreativeWork", name: s.title, url: s.url })) } : {}),
      ...(sameAs.length ? { about: { "@type": "Thing", name: topic, sameAs } } : {}),
      speakable: { "@type": "SpeakableSpecification", cssSelector: [".speakable-answer", "h1"] },
    },
    {
      "@type": "FAQPage",
      "@id": `${url}#faq`,
      url,
      name: e.question.trim(),
      mainEntity: [
        {
          "@type": "Question",
          "@id": `${url}#question`,
          name: e.question.trim(),
          ...(alts.length ? { alternateName: alts } : {}),
          answerCount: 1,
          ...(e.createdAt ? { dateCreated: isoDate(e.createdAt) } : {}),
          acceptedAnswer: {
            "@type": "Answer",
            text: answerText,
            ...(e.updatedAt ? { dateModified: isoDate(e.updatedAt) } : {}),
            url,
            author: { "@type": "Organization", name: SITE_NAME, url: SITE_URL },
          },
        },
      ],
    },
    {
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
        { "@type": "ListItem", position: 2, name: "Blog", item: `${SITE_URL}/blog` },
        { "@type": "ListItem", position: 3, name: "FAQ", item: `${SITE_URL}${FAQ_PATH}` },
        { "@type": "ListItem", position: 4, name: truncate(e.question.trim(), 80), item: url },
      ],
    },
  ];
  return { "@context": "https://schema.org", "@graph": graph };
}

/**
 * The FAQ hub. It deliberately does NOT repeat FAQPage markup: every question has its own page that
 * carries it, and the same question marked up on two URLs is discouraged.
 */
export function faqIndexJsonLd(entries: FaqEntry[]) {
  const url = `${SITE_URL}${FAQ_PATH}`;
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "CollectionPage",
        "@id": url,
        url,
        name: `${FAQ_NAME}: Healing, Meditation & Chakra Questions Answered`,
        inLanguage: "en",
        isPartOf: { "@type": "WebSite", name: SITE_NAME, url: SITE_URL },
        mainEntity: { "@id": `${url}#list` },
      },
      {
        "@type": "ItemList",
        "@id": `${url}#list`,
        name: FAQ_NAME,
        numberOfItems: entries.length,
        itemListElement: entries.slice(0, 200).map((e, i) => ({
          "@type": "ListItem",
          position: i + 1,
          url: faqUrl(e.slug),
          name: e.question.trim(),
        })),
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
          { "@type": "ListItem", position: 2, name: "Blog", item: `${SITE_URL}/blog` },
          { "@type": "ListItem", position: 3, name: "FAQ", item: url },
        ],
      },
    ],
  };
}
