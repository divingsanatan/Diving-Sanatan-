import { SITE_NAME, SITE_URL, slugify, stripHtml, truncate, wordCount } from "./shopShared";

/**
 * Glossary logic shared by the server, the public pages and the admin screen.
 * No database access in here.
 */

export interface GlossaryFaq {
  question: string;
  answer: string;
}
export interface GlossarySource {
  title: string;
  url: string;
}

export interface GlossaryEntry {
  id: string;
  slug: string;
  word: string;
  phonetic: string;
  category: string;
  definition: string;
  illustration: string | null;
  imageAlt: string;
  status: "draft" | "published";
  shortAnswer: string;
  extendedContent: string;
  origin: string;
  alternateNames: string[];
  keyTakeaways: string[];
  faqs: GlossaryFaq[];
  sources: GlossarySource[];
  sameAs: string[];
  relatedTerms: string[]; // slugs of other terms
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

export const GLOSSARY_PATH = "/blog/glossary";
export const termPath = (slug: string) => `${GLOSSARY_PATH}/${slug}`;
export const termUrl = (slug: string) => `${SITE_URL}${termPath(slug)}`;
export const GLOSSARY_NAME = "Diving Sanatan Spiritual Glossary";

/** Database row (snake_case) -> app object. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function mapGlossaryRow(r: any): GlossaryEntry {
  const arr = <T,>(v: unknown): T[] => (Array.isArray(v) ? (v as T[]) : []);
  return {
    id: r.id,
    slug: r.slug || "",
    word: r.word ?? "",
    phonetic: r.phonetic ?? "",
    category: r.category ?? "",
    definition: r.definition ?? "",
    illustration: r.illustration || null,
    imageAlt: r.image_alt ?? "",
    status: r.status === "draft" ? "draft" : "published",
    shortAnswer: r.short_answer ?? "",
    extendedContent: r.extended_content ?? "",
    origin: r.origin ?? "",
    alternateNames: arr<string>(r.alternate_names),
    keyTakeaways: arr<string>(r.key_takeaways),
    faqs: arr<GlossaryFaq>(r.faqs).filter((f) => f && f.question),
    sources: arr<GlossarySource>(r.sources).filter((s) => s && s.url),
    sameAs: arr<string>(r.same_as),
    relatedTerms: arr<string>(r.related_terms),
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

/** "Atman (Soul)" -> "atman" */
export const slugifyTerm = (word: string) => slugify(word.replace(/\([^)]*\)/g, " "));

/** The bare term without brackets, e.g. "Atman". */
export const coreWord = (word: string) => word.replace(/\([^)]*\)/g, " ").replace(/\s+/g, " ").trim();

/** First sentences of a text, up to maxWords words. */
export function leadingWords(text: string, maxWords: number): string {
  const clean = stripHtml(text);
  const sentences = clean.match(/[^.!?]+[.!?]+(\s|$)|[^.!?]+$/g) || [clean];
  let out = "";
  for (const s of sentences) {
    const next = (out + " " + s).trim();
    if (next.split(/\s+/).length > maxWords) {
      if (!out) return clean.split(/\s+/).slice(0, maxWords).join(" ").replace(/[,;:]$/, "") + "…";
      break;
    }
    out = next;
  }
  return out;
}

/* ---------- "effective" values: what search engines will actually see ---------- */

export const effectiveShortAnswer = (e: GlossaryEntry) => e.shortAnswer.trim() || leadingWords(e.definition, 55);

export function effectiveMetaTitle(e: GlossaryEntry): string {
  if (e.metaTitle.trim()) return e.metaTitle.trim();
  const w = coreWord(e.word);
  const long = `${w}: Meaning, Origin & Significance | ${SITE_NAME}`;
  return long.length <= 62 ? long : `${w} Meaning | ${SITE_NAME}`;
}

export const effectiveMetaDescription = (e: GlossaryEntry) =>
  e.metaDescription.trim() || truncate(effectiveShortAnswer(e), 155);

export const effectiveCanonical = (e: GlossaryEntry) => e.canonicalUrl.trim() || termUrl(e.slug);

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

const QUESTION = /^(what|why|how|is|are|can|does|do|who|when|where|which|should|will)\b.*\?$/i;
const isUrl = (s: string) => /^https?:\/\/[^\s]+\.[^\s]+/i.test(s.trim());
const sum = (checks: Check[]) => checks.reduce((n, c) => n + (c.pass ? c.weight : 0), 0);

export function scoreTerm(e: GlossaryEntry, now: number = Date.now()): Scores {
  const kw = e.focusKeyword.trim().toLowerCase();
  const kwSlug = kw.replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
  const title = effectiveMetaTitle(e);
  const desc = effectiveMetaDescription(e);
  const answer = effectiveShortAnswer(e);
  const answerWords = answer.split(/\s+/).filter(Boolean).length;
  const body = stripHtml(`${e.definition} ${e.extendedContent}`);
  const first100 = body.split(" ").slice(0, 100).join(" ").toLowerCase();
  const has = (s: string) => !!kw && s.toLowerCase().includes(kw);
  const words = wordCount(e.definition) + wordCount(e.extendedContent);
  const customTitle = e.metaTitle.trim();
  const customDesc = e.metaDescription.trim();
  const goodFaqs = e.faqs.filter((f) => f.question.trim() && wordCount(f.answer) >= 15);
  const validSources = e.sources.filter((s) => s.title.trim() && isUrl(s.url));
  const months = e.lastReviewed ? (now - new Date(e.lastReviewed).getTime()) / (1000 * 60 * 60 * 24 * 30.4) : Infinity;
  const headings = (e.extendedContent.match(/<h[2-4][\s>]/gi) || []).length;
  const hasImage = !!e.illustration && /^(https?:)?\/\//.test(e.illustration);

  const seo: Check[] = [
    { id: "title", label: "Custom SEO title is 30–60 characters", pass: customTitle.length >= 30 && customTitle.length <= 60, weight: 12,
      hint: customTitle ? `Currently ${customTitle.length} characters.` : `Not set. Search engines will use: “${title}”.` },
    { id: "desc", label: "Custom meta description is 70–160 characters", pass: customDesc.length >= 70 && customDesc.length <= 160, weight: 12,
      hint: customDesc ? `Currently ${customDesc.length} characters.` : "Not set. An auto-summary is used, which is rarely the most clickable." },
    { id: "kw", label: "Focus keyword is set", pass: !!kw, weight: 8, hint: "The phrase people search for, e.g. “what is kundalini”." },
    { id: "kwTitle", label: "Focus keyword is in the title", pass: has(title), weight: 10, hint: "Put the keyword near the start of the title." },
    { id: "kwDesc", label: "Focus keyword is in the meta description", pass: has(desc), weight: 8, hint: "Use it naturally once." },
    { id: "kwSlug", label: "Focus keyword is in the page address", pass: !!kwSlug && e.slug.includes(kwSlug.split("-")[0]), weight: 6, hint: "Short, keyword-rich addresses rank and read better." },
    { id: "kwBody", label: "Focus keyword appears in the first 100 words", pass: has(first100), weight: 6, hint: "Mention it early in the definition." },
    { id: "depth", label: "Page has 300+ words of explanation", pass: words >= 300, weight: 12, hint: `Currently ${words} words. Add an in-depth explanation (extended content). Thin pages rank poorly.` },
    { id: "links", label: "Links to 3+ related terms (internal links)", pass: e.relatedTerms.length >= 3, weight: 8, hint: "Related terms build a web of pages Google can crawl and trust." },
    { id: "image", label: "Has an image with alt text", pass: hasImage && e.imageAlt.trim().length > 0, weight: 6, hint: hasImage ? "Add alt text describing the image." : "Upload an illustration for this term." },
    { id: "slug", label: "Page address is short and clean (≤ 50 characters)", pass: e.slug.length > 0 && e.slug.length <= 50, weight: 4, hint: "Remove filler words from the address." },
    { id: "cat", label: "Has a category", pass: !!e.category.trim(), weight: 4, hint: "Categories help visitors and search engines understand the topic." },
    { id: "index", label: "Allowed to appear in search results", pass: !e.noindex && e.status === "published", weight: 4, hint: e.status !== "published" ? "Draft terms are not public." : "Marked noindex: hidden from Google." },
  ];

  const geo: Check[] = [
    { id: "answer", label: "Has a direct “quick answer” of 30–70 words", pass: !!e.shortAnswer.trim() && answerWords >= 30 && answerWords <= 70, weight: 18,
      hint: e.shortAnswer.trim() ? `Currently ${answerWords} words.` : "AI assistants quote a clear, self-contained answer. Write one." },
    { id: "pattern", label: "Quick answer states what the term IS (“Kundalini is…”)", pass: !!e.shortAnswer.trim() && new RegExp(`^${coreWord(e.word).replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b.{0,40}\\b(is|are|refers|means)\\b`, "i").test(e.shortAnswer.trim()), weight: 8,
      hint: "Start with the term and a plain “is/means” so it can be lifted straight into an AI answer." },
    { id: "takeaways", label: "3+ key takeaways", pass: e.keyTakeaways.filter((t) => t.trim()).length >= 3, weight: 10, hint: "Short bullet facts are easy for AI systems to cite." },
    { id: "faqs", label: "3+ FAQs with full answers (15+ words each)", pass: goodFaqs.length >= 3, weight: 14, hint: `You have ${goodFaqs.length} complete FAQ${goodFaqs.length === 1 ? "" : "s"}.` },
    { id: "sources", label: "2+ cited sources", pass: validSources.length >= 2, weight: 14, hint: "Cited, credible sources make AI engines trust and reference you." },
    { id: "entity", label: "Linked to a trusted reference (Wikipedia / Wikidata)", pass: e.sameAs.filter(isUrl).length >= 1, weight: 10, hint: "Entity links connect your page to the knowledge graph AI systems use." },
    { id: "origin", label: "Origin / tradition explained", pass: e.origin.trim().length >= 20, weight: 8, hint: "Where the word comes from (e.g. Sanskrit root, lineage)." },
    { id: "reviewed", label: "Reviewed by a named expert in the last 12 months", pass: !!e.reviewedBy.trim() && months <= 12, weight: 10, hint: "Freshness and expertise signals (E-E-A-T)." },
    { id: "alt", label: "Alternate names / spellings listed", pass: e.alternateNames.filter((a) => a.trim()).length >= 1, weight: 4, hint: "e.g. “Kundalini Shakti”. Helps match how people phrase the question." },
    { id: "extended", label: "In-depth explanation (150+ words)", pass: wordCount(e.extendedContent) >= 150, weight: 4, hint: "Gives AI systems more to quote and context to trust." },
  ];

  const aeo: Check[] = [
    { id: "ans", label: "Quick answer is 40–60 words (featured-snippet length)", pass: !!e.shortAnswer.trim() && answerWords >= 40 && answerWords <= 60, weight: 25, hint: `Currently ${e.shortAnswer.trim() ? answerWords : 0} words.` },
    { id: "faq3", label: "3+ FAQs", pass: e.faqs.filter((f) => f.question.trim() && f.answer.trim()).length >= 3, weight: 20, hint: "These feed “People also ask” and AI answers. (Google stopped showing FAQ rich results in May 2026, but the questions still help.)" },
    { id: "q", label: "FAQ questions are real questions (“What is…?”)", pass: e.faqs.length > 0 && e.faqs.every((f) => QUESTION.test(f.question.trim())), weight: 15, hint: "Start with What / Why / How / Is / Can and end with ?" },
    { id: "speak", label: "Quick answer is short enough to be read aloud (≤ 3 sentences)", pass: !!e.shortAnswer.trim() && (e.shortAnswer.match(/[.!?](\s|$)/g) || []).length <= 3 && answerWords <= 60, weight: 10, hint: "Voice assistants read short, complete answers." },
    { id: "bullets", label: "Key takeaways list", pass: e.keyTakeaways.filter((t) => t.trim()).length >= 3, weight: 10, hint: "Bullet lists are favoured for list-style answers." },
    { id: "headings", label: "Explanation is broken up with 2+ sub-headings", pass: headings >= 2, weight: 10, hint: "Use headings like “Meaning”, “How it is practised”." },
    { id: "related", label: "3+ related terms for follow-up questions", pass: e.relatedTerms.length >= 3, weight: 5, hint: "Answer engines love connected topics." },
    { id: "phon", label: "Pronunciation provided", pass: !!e.phonetic.trim(), weight: 5, hint: "Helps voice search and Sanskrit terms people mispronounce." },
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

/** One @graph with DefinedTerm, WebPage (+speakable), FAQPage and BreadcrumbList. */
export function termJsonLd(e: GlossaryEntry) {
  const url = termUrl(e.slug);
  const title = effectiveMetaTitle(e);
  const description = effectiveMetaDescription(e);
  const setId = `${SITE_URL}${GLOSSARY_PATH}#set`;
  const sameAs = e.sameAs.filter(isUrl);
  const sources = e.sources.filter((s) => s.title.trim() && isUrl(s.url));

  const graph: Record<string, unknown>[] = [
    {
      "@type": "DefinedTerm",
      "@id": `${url}#term`,
      name: coreWord(e.word),
      description: effectiveShortAnswer(e),
      url,
      termCode: e.slug,
      inDefinedTermSet: { "@type": "DefinedTermSet", "@id": setId, name: GLOSSARY_NAME, url: `${SITE_URL}${GLOSSARY_PATH}` },
      ...(e.alternateNames.filter(Boolean).length ? { alternateName: e.alternateNames.filter(Boolean) } : {}),
      ...(sameAs.length ? { sameAs } : {}),
    },
    {
      "@type": "WebPage",
      "@id": url,
      url,
      name: title,
      description,
      inLanguage: "en",
      isPartOf: { "@type": "WebSite", name: SITE_NAME, url: SITE_URL },
      mainEntity: { "@id": `${url}#term` },
      ...(e.createdAt ? { datePublished: isoDate(e.createdAt) } : {}),
      ...(e.updatedAt ? { dateModified: isoDate(e.updatedAt) } : {}),
      ...(e.lastReviewed ? { lastReviewed: e.lastReviewed } : {}),
      ...(e.reviewedBy.trim() ? { reviewedBy: { "@type": "Person", name: e.reviewedBy.trim() } } : {}),
      ...(sources.length ? { citation: sources.map((s) => ({ "@type": "CreativeWork", name: s.title, url: s.url })) } : {}),
      ...(e.illustration && /^https?:/.test(e.illustration) ? { primaryImageOfPage: { "@type": "ImageObject", url: e.illustration, ...(e.imageAlt ? { caption: e.imageAlt } : {}) } } : {}),
      speakable: { "@type": "SpeakableSpecification", cssSelector: [".speakable-answer", "h1"] },
    },
    {
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
        { "@type": "ListItem", position: 2, name: "Blog", item: `${SITE_URL}/blog` },
        { "@type": "ListItem", position: 3, name: "Glossary", item: `${SITE_URL}${GLOSSARY_PATH}` },
        { "@type": "ListItem", position: 4, name: coreWord(e.word), item: url },
      ],
    },
  ];

  const faqs = e.faqs.filter((f) => f.question.trim() && f.answer.trim());
  if (faqs.length) {
    graph.push({
      "@type": "FAQPage",
      "@id": `${url}#faq`,
      mainEntity: faqs.map((f) => ({
        "@type": "Question",
        name: f.question.trim(),
        acceptedAnswer: { "@type": "Answer", text: stripHtml(f.answer) },
      })),
    });
  }
  return { "@context": "https://schema.org", "@graph": graph };
}

export function glossaryIndexJsonLd(entries: GlossaryEntry[]) {
  const url = `${SITE_URL}${GLOSSARY_PATH}`;
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "CollectionPage",
        "@id": url,
        url,
        name: `${GLOSSARY_NAME}: Sanatan Dharma, Chakra & Healing Terms`,
        isPartOf: { "@type": "WebSite", name: SITE_NAME, url: SITE_URL },
        mainEntity: { "@id": `${url}#set` },
      },
      {
        "@type": "DefinedTermSet",
        "@id": `${url}#set`,
        name: GLOSSARY_NAME,
        url,
        hasDefinedTerm: entries.slice(0, 200).map((e) => ({
          "@type": "DefinedTerm",
          name: coreWord(e.word),
          url: termUrl(e.slug),
          description: truncate(effectiveShortAnswer(e), 200),
        })),
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
          { "@type": "ListItem", position: 2, name: "Blog", item: `${SITE_URL}/blog` },
          { "@type": "ListItem", position: 3, name: "Glossary", item: url },
        ],
      },
    ],
  };
}
