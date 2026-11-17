import { SITE_NAME, SITE_URL, stripHtml, truncate, wordCount } from "./shopShared";
import { leadingWords } from "./glossaryShared";
import {
  FAQ_SLUG_MAX,
  cleanQuestion,
  covers,
  defaultFocusKeyword,
  isUrl,
  sentences,
  slugifyQuestion,
  sumChecks,
  tokens,
  type Check,
  type FaqSource,
  type Scores,
} from "./faqShared";

/**
 * Q&A Board logic shared by the server, the public pages and the admin screen.
 * No database access in here. Same approach as faqShared.ts / glossaryShared.ts.
 *
 * Who does what:
 *  - visitors (signed in) ask questions and write comments. Both wait for staff approval.
 *  - healers (guru role) and staff write the official answer.
 *  - staff approve, edit, and manage the SEO fields.
 */

export type QaStatus = "pending" | "published" | "rejected";
export type QaSource = "member" | "staff";

export interface QaQuestion {
  id: string;
  slug: string;
  title: string; // the question
  description: string; // optional details from the asker (plain text)
  category: string;
  source: QaSource;
  askedByName: string; // public display name, "" = anonymous
  anonymous: boolean;
  status: QaStatus;
  // the official answer
  answer: string; // HTML from the editor
  shortAnswer: string;
  answererName: string;
  answererRole: string;
  answererCredentials: string;
  answererImage: string;
  practitionerId: string;
  answeredAt: string | null;
  // SEO / GEO / AEO
  keyTakeaways: string[];
  sources: FaqSource[];
  sameAs: string[];
  relatedQuestions: string[]; // slugs
  alternateQuestions: string[];
  reviewedBy: string;
  lastReviewed: string | null;
  metaTitle: string;
  metaDescription: string;
  focusKeyword: string;
  secondaryKeywords: string[];
  canonicalUrl: string;
  ogImage: string;
  noindex: boolean;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
  // derived
  commentCount?: number;
  // STAFF ONLY. Never included in public responses.
  moderationNote?: string;
  askedByProfileId?: string;
}

export interface QaComment {
  id: string;
  questionId: string;
  parentId: string | null;
  authorName: string;
  authorRole: "member" | "healer" | "staff";
  body: string;
  status: QaStatus;
  createdAt: string;
  // staff queue only
  questionTitle?: string;
  questionSlug?: string;
}

export const QA_PATH = "/blog/quora-qa";
export const qaPath = (slug: string) => `${QA_PATH}/${slug}`;
export const qaUrl = (slug: string) => `${SITE_URL}${qaPath(slug)}`;
export const QA_NAME = "Diving Sanatan Q&A";
export const QA_DEFAULT_CATEGORIES = ["Mind & Emotions", "Chakra Healing", "Aura & Energy", "Meditation & Mindfulness", "Reiki Healing"];
export const ANON_NAME = "Community member";

/** Database row -> app object. Private fields are only included when `staff` is true. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function mapQaRow(r: any, staff = false): QaQuestion {
  const arr = <T,>(v: unknown): T[] => (Array.isArray(v) ? (v as T[]) : []);
  const status: QaStatus = r.status === "published" || r.status === "rejected" ? r.status : "pending";
  const q: QaQuestion = {
    id: r.id,
    slug: r.slug || "",
    title: r.title ?? "",
    description: r.description ?? "",
    category: r.category ?? "",
    source: r.source === "staff" ? "staff" : "member",
    askedByName: r.anonymous ? "" : r.asked_by_name ?? "",
    anonymous: !!r.anonymous,
    status,
    answer: r.answer ?? "",
    shortAnswer: r.short_answer ?? "",
    answererName: r.answerer_name ?? "",
    answererRole: r.answerer_role ?? "",
    answererCredentials: r.answerer_credentials ?? "",
    answererImage: r.answerer_image ?? "",
    practitionerId: r.practitioner_id ?? "",
    answeredAt: r.answered_at ?? null,
    keyTakeaways: arr<string>(r.key_takeaways),
    sources: arr<FaqSource>(r.sources).filter((s) => s && s.url),
    sameAs: arr<string>(r.same_as),
    relatedQuestions: arr<string>(r.related_questions),
    alternateQuestions: arr<string>(r.alternate_questions),
    reviewedBy: r.reviewed_by ?? "",
    lastReviewed: r.last_reviewed ? String(r.last_reviewed).slice(0, 10) : null,
    metaTitle: r.meta_title ?? "",
    metaDescription: r.meta_description ?? "",
    focusKeyword: r.focus_keyword ?? "",
    secondaryKeywords: arr<string>(r.secondary_keywords),
    canonicalUrl: r.canonical_url ?? "",
    ogImage: r.og_image ?? "",
    noindex: !!r.noindex,
    publishedAt: r.published_at ?? null,
    createdAt: r.created_at ?? "",
    updatedAt: r.updated_at ?? r.created_at ?? "",
  };
  if (staff) {
    q.moderationNote = r.moderation_note ?? "";
    q.askedByProfileId = r.asked_by_profile_id ?? "";
  }
  return q;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function mapQaComment(r: any): QaComment {
  return {
    id: r.id,
    questionId: r.question_id,
    parentId: r.parent_id ?? null,
    authorName: r.author_name || ANON_NAME,
    authorRole: r.author_role === "healer" || r.author_role === "staff" ? r.author_role : "member",
    body: r.body ?? "",
    status: r.status === "published" || r.status === "rejected" ? r.status : "pending",
    createdAt: r.created_at ?? "",
  };
}

/* ---------- privacy-safe names and text ---------- */

/** "Priya Sharma" -> "Priya S." (first name + last initial). Visitors are never shown with a full name or email. */
export function publicName(full: string): string {
  const parts = (full || "").replace(/@.*/, "").replace(/[^\p{L}\p{M}\s'.-]/gu, " ").trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "";
  const first = parts[0].slice(0, 20);
  const last = parts.length > 1 ? parts[parts.length - 1] : "";
  return last ? `${first} ${last.charAt(0).toUpperCase()}.` : first;
}

/** Plain text only: removes tags, collapses spaces. Used for everything a visitor types. */
export const plainText = (s: string, max: number) =>
  s.replace(/<[^>]*>/g, " ").replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, "").replace(/[ \t]+/g, " ").replace(/\n{3,}/g, "\n\n").trim().slice(0, max);

/** How many links does a visitor's text contain? (link spam guard) */
export const linkCount = (s: string) => (s.match(/https?:\/\/|www\./gi) || []).length;

const QWORD = /^(what|why|how|is|are|can|could|does|do|did|who|when|where|which|should|will|would|may|might)\b/i;
/** Adds the missing "?" to a title that is clearly a question. */
export function normalizeTitle(t: string): string {
  const s = t.replace(/\s+/g, " ").trim();
  return QWORD.test(s) && !/[?!.]$/.test(s) ? `${s}?` : s;
}

export const slugifyTitle = slugifyQuestion;
export const isAnswered = (q: Pick<QaQuestion, "answer">) => stripHtml(q.answer).length > 0;
/** Live, answered, and not hidden from search. Only these are indexable and listed in the sitemap. */
export const isIndexable = (q: QaQuestion) => q.status === "published" && isAnswered(q) && !q.noindex;

export function answerWho(q: QaQuestion): string {
  return [q.answererName, q.answererCredentials].filter(Boolean).join(", ");
}

/* ---------- "effective" values: what search engines will actually see ---------- */

export const effectiveShortAnswer = (q: QaQuestion) => q.shortAnswer.trim() || leadingWords(q.answer, 55);

export function effectiveMetaTitle(q: QaQuestion): string {
  if (q.metaTitle.trim()) return q.metaTitle.trim();
  const t = q.title.replace(/\s+/g, " ").trim() || "Question";
  const long = `${t} | ${SITE_NAME}`;
  if (long.length <= 62) return long;
  return t.length <= 62 ? t : truncate(t, 60);
}

export const effectiveMetaDescription = (q: QaQuestion) =>
  q.metaDescription.trim() || truncate(effectiveShortAnswer(q) || q.description, 155);

export const effectiveCanonical = (q: QaQuestion) => q.canonicalUrl.trim() || qaUrl(q.slug);

/** Up to n live, answered questions about the same thing (shared meaningful words, same category first). */
export function relatedQuestions(q: QaQuestion, all: QaQuestion[], n = 4): QaQuestion[] {
  const mine = new Set(tokens(`${q.title} ${q.focusKeyword} ${q.alternateQuestions.join(" ")}`));
  const pool = all.filter((o) => o.id !== q.id && isIndexable(o));
  const scored = pool
    .map((o) => {
      const t = tokens(`${o.title} ${o.focusKeyword}`).filter((x) => mine.has(x)).length * 3;
      const cat = q.category && o.category === q.category ? 2 : 0;
      return { o, score: t + cat };
    })
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score || (b.o.answeredAt || "").localeCompare(a.o.answeredAt || ""));
  const picked = scored.slice(0, n).map((x) => x.o);
  if (picked.length >= n) return picked;
  return [...picked, ...pool.filter((o) => !picked.includes(o)).slice(0, n - picked.length)];
}

/** The focus keyword people would type: the question itself. */
export const defaultQaFocusKeyword = (title: string) => defaultFocusKeyword(title);

/* ---------- scoring (answered questions) ---------- */

export function scoreQuestion(q: QaQuestion, commentCount = q.commentCount ?? 0, now: number = Date.now()): Scores {
  const kw = q.focusKeyword.trim().toLowerCase();
  const title = effectiveMetaTitle(q);
  const desc = effectiveMetaDescription(q);
  const answer = effectiveShortAnswer(q);
  const answerWords = answer.split(/\s+/).filter(Boolean).length;
  const hasShort = !!q.shortAnswer.trim();
  const body = stripHtml(q.answer);
  const first100 = body.split(" ").slice(0, 100).join(" ");
  const bodyWords = wordCount(q.answer);
  const customTitle = q.metaTitle.trim();
  const customDesc = q.metaDescription.trim();
  const validSources = q.sources.filter((s) => s.title.trim() && isUrl(s.url));
  const months = q.lastReviewed ? (now - new Date(q.lastReviewed).getTime()) / (1000 * 60 * 60 * 24 * 30.4) : Infinity;
  const headings = (q.answer.match(/<h[2-4][\s>]/gi) || []).length;
  const lists = (q.answer.match(/<(ul|ol)[\s>]/gi) || []).length;
  const altQs = q.alternateQuestions.filter((x) => x.trim());
  const titleWords = q.title.trim().split(/\s+/).filter(Boolean).length;
  const slugWords = new Set(q.slug.split("-"));
  const kwWords = tokens(kw);
  const kwInSlug = kwWords.length > 0 && kwWords.filter((w) => slugWords.has(w) || q.slug.includes(w)).length / kwWords.length >= 0.5;
  const takeaways = q.keyTakeaways.filter((t) => t.trim());
  const avgSentence = (() => {
    const s = sentences(answer);
    return s.length ? answerWords / s.length : 0;
  })();
  const answered = isAnswered(q);

  const seo: Check[] = [
    { id: "title", label: "Custom SEO title is 30–60 characters", pass: customTitle.length >= 30 && customTitle.length <= 60, weight: 12,
      hint: customTitle ? `Currently ${customTitle.length} characters.` : `Not set. Search engines will use: “${title}”.` },
    { id: "desc", label: "Custom meta description is 70–160 characters", pass: customDesc.length >= 70 && customDesc.length <= 160, weight: 12,
      hint: customDesc ? `Currently ${customDesc.length} characters.` : "Not set. An auto-summary is used, which is rarely the most clickable." },
    { id: "kw", label: "Focus keyword is set", pass: !!kw, weight: 8, hint: "The phrase people type, e.g. “do singing bowls help insomnia”." },
    { id: "kwTitle", label: "Focus keyword is in the title", pass: covers(title, kw), weight: 10, hint: "Use the words people search for in the title." },
    { id: "kwDesc", label: "Focus keyword is in the meta description", pass: covers(desc, kw), weight: 8, hint: "Use it naturally once." },
    { id: "kwSlug", label: "Focus keyword is in the page address", pass: kwInSlug, weight: 6, hint: "Short, keyword-rich addresses rank and read better." },
    { id: "kwBody", label: "Focus keyword appears in the first 100 words of the answer", pass: covers(first100, kw), weight: 6, hint: "Mention it early in the answer." },
    { id: "depth", label: "The healer's answer is 150+ words", pass: bodyWords >= 150, weight: 12, hint: `Currently ${bodyWords} words. Thin pages rank poorly. Explain the why, not just the what.` },
    { id: "links", label: "Links to 2+ related questions (internal links)", pass: q.relatedQuestions.length >= 2, weight: 8, hint: "Related questions build a web of pages Google can crawl and trust." },
    { id: "qlen", label: "Question is clear and 4–20 words", pass: titleWords >= 4 && titleWords <= 20, weight: 6, hint: `Currently ${titleWords} words. The question becomes the page heading and title.` },
    { id: "og", label: "Social sharing image is set", pass: isUrl(q.ogImage), weight: 4, hint: "Shown when the page is shared on WhatsApp, Facebook and X." },
    { id: "slug", label: "Page address is short and clean (≤ 60 characters)", pass: q.slug.length > 0 && q.slug.length <= FAQ_SLUG_MAX, weight: 4, hint: "Remove filler words from the address." },
    { id: "index", label: "Live, answered and allowed in search results", pass: q.status === "published" && answered && !q.noindex, weight: 4,
      hint: q.status !== "published" ? "Not published yet." : !answered ? "No healer answer yet. Unanswered questions are hidden from Google." : "Marked noindex: hidden from Google." },
  ];

  const geo: Check[] = [
    { id: "answer", label: "Has a direct “quick answer” of 30–70 words", pass: hasShort && answerWords >= 30 && answerWords <= 70, weight: 18,
      hint: hasShort ? `Currently ${answerWords} words.` : "AI assistants quote a clear, self-contained answer. Write one." },
    { id: "subject", label: "Quick answer names its subject (doesn’t start with “It”, “This”, “They”…)", pass: hasShort && !/^(it|this|that|they|these|those|there|here)\b/i.test(q.shortAnswer.trim()), weight: 6,
      hint: "AI engines lift the answer out of the page, so it must make sense on its own." },
    { id: "lead", label: "Quick answer leads with the answer (no “it depends…” lead-in)", pass: hasShort && !/^(it depends|that depends|well,|so,|many (people|factors)|there (is|are) (many|no one))/i.test(q.shortAnswer.trim()), weight: 6,
      hint: "Give the answer first, then the nuance." },
    { id: "substance", label: "Full answer has 80+ words", pass: bodyWords >= 80, weight: 10, hint: `Currently ${bodyWords} words. Enough substance gives AI something worth citing.` },
    { id: "takeaways", label: "3+ key takeaways", pass: takeaways.length >= 3, weight: 10, hint: "Short bullet facts are easy for AI systems to cite." },
    { id: "sources", label: "2+ cited sources", pass: validSources.length >= 2, weight: 14, hint: "Cited, credible sources make AI engines trust and reference you." },
    { id: "entity", label: "Linked to a trusted reference (Wikipedia / Wikidata)", pass: q.sameAs.filter(isUrl).length >= 1, weight: 10, hint: "Entity links connect your page to the knowledge graph AI systems use." },
    { id: "reviewed", label: "Reviewed by a named expert in the last 12 months", pass: !!q.reviewedBy.trim() && months <= 12, weight: 10, hint: "Freshness and expertise signals (E-E-A-T)." },
    { id: "credentials", label: "Answered by a named healer with credentials", pass: !!q.answererName.trim() && !!q.answererCredentials.trim(), weight: 10, hint: "Say who answered and why they are qualified. This is the strongest trust signal for wellbeing topics." },
    { id: "alt", label: "2+ alternate ways to ask the question", pass: altQs.length >= 2, weight: 6, hint: "e.g. “Is Reiki real?” and “Does Reiki actually work?”." },
  ];

  const aeo: Check[] = [
    { id: "ans", label: "Quick answer is 40–60 words (featured-snippet length)", pass: hasShort && answerWords >= 40 && answerWords <= 60, weight: 25, hint: `Currently ${hasShort ? answerWords : 0} words.` },
    { id: "q", label: "Title is a real question (“What is…?”, ends with ?)", pass: /^(what|why|how|is|are|can|could|does|do|did|who|when|where|which|should|will|would)\b.*\?$/i.test(q.title.trim()), weight: 15, hint: "Start with What / Why / How / Is / Can and end with ?" },
    { id: "concise", label: "Question is concise (4–20 words)", pass: titleWords >= 4 && titleWords <= 20, weight: 10, hint: "Short questions match how people speak and type." },
    { id: "speak", label: "Quick answer can be read aloud (≤ 3 sentences)", pass: hasShort && sentences(q.shortAnswer).length <= 3 && answerWords <= 60, weight: 10, hint: "Voice assistants read short, complete answers." },
    { id: "plain", label: "Quick answer is easy to follow (sentences average ≤ 22 words)", pass: hasShort && avgSentence > 0 && avgSentence <= 22, weight: 5, hint: "Shorter sentences are easier to read aloud." },
    { id: "bullets", label: "Key takeaways list", pass: takeaways.length >= 3, weight: 10, hint: "Bullet lists are favoured for list-style answers." },
    { id: "structure", label: "Answer is structured (2+ sub-headings or a list)", pass: headings >= 2 || lists >= 1, weight: 10, hint: "Use headings or a bulleted/numbered list so it can be scanned." },
    { id: "alt", label: "2+ alternate questions for voice search", pass: altQs.length >= 2, weight: 5, hint: "People ask the same thing in many ways." },
    { id: "related", label: "2+ related questions for follow-ups", pass: q.relatedQuestions.length >= 2, weight: 5, hint: "Answer engines love connected topics." },
    { id: "community", label: "Has approved community comments", pass: commentCount >= 1, weight: 5, hint: "Active discussion shows the page is useful." },
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

const isoDate = (s: string | null | undefined) => (s ? new Date(s).toISOString() : undefined);

/**
 * QAPage for an ANSWERED question: one visitor question, the healer's accepted answer, and the
 * approved community comments. QAPage is Google's markup for pages where visitors submit questions
 * and answers, which is what this board is (FAQ pages use FAQPage instead).
 * Everything marked up here is visible on the page. Returns null for unanswered questions.
 */
export function qaJsonLd(q: QaQuestion, comments: QaComment[] = []) {
  if (!isAnswered(q)) return null;
  const url = qaUrl(q.slug);
  const sameAs = q.sameAs.filter(isUrl);
  const sources = q.sources.filter((s) => s.title.trim() && isUrl(s.url));
  const alts = q.alternateQuestions.filter((x) => x.trim());
  const topic = (q.focusKeyword.trim() || cleanQuestion(q.title)).trim();
  const approved = comments.filter((c) => c.status === "published").slice(0, 10);
  const healer = q.answererName.trim();

  const answer: Record<string, unknown> = {
    "@type": "Answer",
    "@id": `${url}#answer`,
    text: stripHtml(q.answer),
    url: `${url}#answer`,
    ...(q.answeredAt ? { dateCreated: isoDate(q.answeredAt) } : {}),
    ...(q.updatedAt ? { dateModified: isoDate(q.updatedAt) } : {}),
    author: healer
      ? { "@type": "Person", name: healer, ...(q.answererRole.trim() ? { jobTitle: q.answererRole.trim() } : {}), ...(q.answererCredentials.trim() ? { description: q.answererCredentials.trim() } : {}) }
      : { "@type": "Organization", name: SITE_NAME, url: SITE_URL },
  };

  const question: Record<string, unknown> = {
    "@type": "Question",
    "@id": `${url}#question`,
    name: q.title.trim(),
    text: (q.description || q.title).trim(),
    ...(alts.length ? { alternateName: alts } : {}),
    answerCount: 1,
    commentCount: approved.length,
    dateCreated: isoDate(q.publishedAt || q.createdAt),
    author: { "@type": "Person", name: q.askedByName.trim() || ANON_NAME },
    acceptedAnswer: answer,
    ...(approved.length
      ? { comment: approved.map((c) => ({ "@type": "Comment", text: c.body, dateCreated: isoDate(c.createdAt), author: { "@type": "Person", name: c.authorName } })) }
      : {}),
  };

  const graph: Record<string, unknown>[] = [
    {
      "@type": "QAPage",
      "@id": url,
      url,
      name: effectiveMetaTitle(q),
      description: effectiveMetaDescription(q),
      inLanguage: "en",
      isPartOf: { "@type": "WebSite", name: SITE_NAME, url: SITE_URL },
      mainEntity: question,
      ...(q.publishedAt ? { datePublished: isoDate(q.publishedAt) } : {}),
      ...(q.updatedAt ? { dateModified: isoDate(q.updatedAt) } : {}),
      ...(q.lastReviewed ? { lastReviewed: q.lastReviewed } : {}),
      ...(q.reviewedBy.trim() ? { reviewedBy: { "@type": "Person", name: q.reviewedBy.trim() } } : {}),
      ...(sources.length ? { citation: sources.map((s) => ({ "@type": "CreativeWork", name: s.title, url: s.url })) } : {}),
      ...(sameAs.length ? { about: { "@type": "Thing", name: topic, sameAs } } : {}),
      speakable: { "@type": "SpeakableSpecification", cssSelector: [".speakable-answer", "h1"] },
    },
    {
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
        { "@type": "ListItem", position: 2, name: "Blog", item: `${SITE_URL}/blog` },
        { "@type": "ListItem", position: 3, name: "Q&A", item: `${SITE_URL}${QA_PATH}` },
        { "@type": "ListItem", position: 4, name: truncate(q.title.trim(), 80), item: url },
      ],
    },
  ];
  return { "@context": "https://schema.org", "@graph": graph };
}

/** The board hub. Lists answered questions. It does NOT repeat QAPage markup (each question page carries it). */
export function qaIndexJsonLd(questions: QaQuestion[]) {
  const url = `${SITE_URL}${QA_PATH}`;
  const list = questions.filter(isIndexable);
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "CollectionPage",
        "@id": url,
        url,
        name: `${QA_NAME}: Ask a Healer About Energy Healing, Chakras & Meditation`,
        inLanguage: "en",
        isPartOf: { "@type": "WebSite", name: SITE_NAME, url: SITE_URL },
        mainEntity: { "@id": `${url}#list` },
      },
      {
        "@type": "ItemList",
        "@id": `${url}#list`,
        name: QA_NAME,
        numberOfItems: list.length,
        itemListElement: list.slice(0, 200).map((q, i) => ({ "@type": "ListItem", position: i + 1, url: qaUrl(q.slug), name: q.title.trim() })),
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
          { "@type": "ListItem", position: 2, name: "Blog", item: `${SITE_URL}/blog` },
          { "@type": "ListItem", position: 3, name: "Q&A", item: url },
        ],
      },
    ],
  };
}
