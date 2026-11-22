/* eslint-disable @typescript-eslint/no-explicit-any */
import { SITE_NAME, SITE_URL, stripHtml, truncate, wordCount } from "./shopShared";
import { isUrl, type FaqSource } from "./faqShared";
import { qaPath } from "./qaShared";
import { videoPath } from "./videoShared";
import { termPath } from "./glossaryShared";

/* Topic hubs ("pillar" pages). One topic ties together a guide, articles, questions, videos and glossary terms. */

export type TopicStatus = "draft" | "published";
export type TopicItemType = "blog" | "qa" | "video" | "glossary";
export type TopicRole = "pillar" | "cluster" | "supporting";

export const TOPICS_PATH = "/blog/topics";
export const topicPath = (slug: string) => `${TOPICS_PATH}/${slug}`;
export const topicUrl = (slug: string) => `${SITE_URL}${topicPath(slug)}`;
export const TOPICS_NAME = "Diving Sanatan Topic Guides";

export const ITEM_TYPES: TopicItemType[] = ["blog", "qa", "video", "glossary"];
export const ITEM_LABEL: Record<TopicItemType, string> = { blog: "Article", qa: "Question", video: "Video", glossary: "Glossary term" };
export const ITEM_LABEL_PLURAL: Record<TopicItemType, string> = { blog: "Articles", qa: "Questions", video: "Videos", glossary: "Glossary terms" };
export const ROLE_LABEL: Record<TopicRole, string> = { pillar: "Main guide", cluster: "In depth", supporting: "Supporting" };

export const itemPath = (type: TopicItemType, slug: string): string =>
  type === "blog" ? `/blog/${slug}` : type === "qa" ? qaPath(slug) : type === "video" ? videoPath(slug) : termPath(slug);
export const itemUrl = (type: TopicItemType, slug: string) => `${SITE_URL}${itemPath(type, slug)}`;

export interface Topic {
  id: string;
  slug: string;
  title: string;
  shortAnswer: string;
  overviewHtml: string;
  keyTakeaways: string[];
  sources: FaqSource[];
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
  status: TopicStatus;
  noindex: boolean;
  sortOrder: number;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface TopicItemRef {
  type: TopicItemType;
  slug: string;
  role: TopicRole;
  sortOrder: number;
}

/** A topic member with the fields needed to show a card or a link. */
export interface ResolvedItem extends TopicItemRef {
  title: string;
  summary: string;
  path: string;
  category: string;
  image: string;
  date: string | null;
}

const arr = <T>(v: unknown): T[] => (Array.isArray(v) ? (v as T[]) : []);
const strs = (v: unknown): string[] => arr<unknown>(v).map((x) => String(x ?? "").trim()).filter(Boolean);

export function mapTopicRow(r: any): Topic {
  return {
    id: r.id,
    slug: r.slug,
    title: r.title ?? "",
    shortAnswer: r.short_answer ?? "",
    overviewHtml: r.overview_html ?? "",
    keyTakeaways: strs(r.key_takeaways),
    sources: arr<FaqSource>(r.sources).filter((s) => s && s.url),
    sameAs: strs(r.same_as),
    alternateQuestions: strs(r.alternate_questions),
    focusKeyword: r.focus_keyword ?? "",
    secondaryKeywords: strs(r.secondary_keywords),
    metaTitle: r.meta_title ?? "",
    metaDescription: r.meta_description ?? "",
    canonicalUrl: r.canonical_url ?? "",
    ogImage: r.og_image ?? "",
    authorName: r.author_name ?? "",
    authorCredentials: r.author_credentials ?? "",
    reviewedBy: r.reviewed_by ?? "",
    lastReviewed: r.last_reviewed ?? null,
    ctaLabel: r.cta_label ?? "",
    ctaUrl: r.cta_url ?? "",
    ctaText: r.cta_text ?? "",
    status: r.status === "published" ? "published" : "draft",
    noindex: !!r.noindex,
    sortOrder: Number(r.sort_order) || 0,
    publishedAt: r.published_at ?? null,
    createdAt: r.created_at ?? "",
    updatedAt: r.updated_at ?? "",
  };
}

export const effectiveMetaTitle = (t: Topic) => t.metaTitle.trim() || `${t.title}: A Complete Guide | ${SITE_NAME}`;
export const effectiveMetaDescription = (t: Topic) => t.metaDescription.trim() || truncate(t.shortAnswer, 155);
export const effectiveCanonical = (t: Topic) => t.canonicalUrl.trim() || topicUrl(t.slug);
export const isIndexableTopic = (t: Topic) => t.status === "published" && !t.noindex;

/* ---------------------------- reading order ---------------------------- */

const ROLE_RANK: Record<TopicRole, number> = { pillar: 0, cluster: 1, supporting: 2 };
const TYPE_RANK: Record<TopicItemType, number> = { blog: 0, video: 1, qa: 2, glossary: 3 };

/** The reading path: main guide first, then articles, videos and questions. Glossary terms are reference, not a path. */
export function journeyOf(items: ResolvedItem[]): ResolvedItem[] {
  return items
    .filter((i) => i.type !== "glossary")
    .sort((a, b) => ROLE_RANK[a.role] - ROLE_RANK[b.role] || TYPE_RANK[a.type] - TYPE_RANK[b.type] || a.sortOrder - b.sortOrder);
}

export const itemsOfType = (items: ResolvedItem[], type: TopicItemType) =>
  items.filter((i) => i.type === type).sort((a, b) => ROLE_RANK[a.role] - ROLE_RANK[b.role] || a.sortOrder - b.sortOrder);

export function countsOf(items: ResolvedItem[]): Record<TopicItemType, number> {
  const c: Record<TopicItemType, number> = { blog: 0, qa: 0, video: 0, glossary: 0 };
  for (const i of items) c[i.type] += 1;
  return c;
}

export function countsLabel(c: Record<TopicItemType, number>): string {
  const parts: string[] = [];
  if (c.blog) parts.push(`${c.blog} ${c.blog === 1 ? "article" : "articles"}`);
  if (c.video) parts.push(`${c.video} ${c.video === 1 ? "video" : "videos"}`);
  if (c.qa) parts.push(`${c.qa} ${c.qa === 1 ? "question" : "questions"}`);
  if (c.glossary) parts.push(`${c.glossary} glossary ${c.glossary === 1 ? "term" : "terms"}`);
  return parts.join(", ");
}

/* ------------------------------ checks ------------------------------ */

export interface ReadinessCheck {
  ok: boolean;
  label: string;
  /** true = the topic cannot be published until this is fixed */
  blocking: boolean;
}

/** What a hub needs before it is worth publishing. Shown in the admin screen. */
export function readinessChecks(t: Pick<Topic, "title" | "shortAnswer" | "overviewHtml" | "keyTakeaways" | "sources" | "reviewedBy" | "focusKeyword" | "metaDescription">, items: Pick<ResolvedItem, "type" | "role">[]): ReadinessCheck[] {
  const quick = wordCount(t.shortAnswer);
  const guideWords = wordCount(stripHtml(t.overviewHtml));
  const hasPillar = items.some((i) => i.role === "pillar" && i.type === "blog");
  const nonGlossary = items.filter((i) => i.type !== "glossary").length;
  return [
    { ok: !!t.title.trim(), label: "Has a title", blocking: true },
    { ok: quick >= 25 && quick <= 70, label: `Quick answer is 25 to 70 words (now ${quick})`, blocking: true },
    { ok: guideWords >= 150 || hasPillar, label: "Has a written guide (150+ words) or a main-guide article", blocking: true },
    { ok: nonGlossary >= 3, label: `Links at least 3 articles, videos or questions (now ${nonGlossary})`, blocking: false },
    { ok: t.keyTakeaways.length >= 3, label: "Has 3 or more key takeaways", blocking: false },
    { ok: t.sources.length >= 1, label: "Cites at least one source", blocking: false },
    { ok: !!t.reviewedBy.trim(), label: "Reviewed by a named person", blocking: false },
    { ok: !!t.focusKeyword.trim(), label: "Has a focus keyword", blocking: false },
    { ok: t.metaDescription.trim().length >= 70, label: "Has a written meta description", blocking: false },
  ];
}

/* ----------------------------- structured data ----------------------------- */

const isoDate = (d: string | null | undefined) => (d ? new Date(d).toISOString() : undefined);
const orgRef = { "@type": "Organization", name: SITE_NAME, url: SITE_URL };

const partType = (type: TopicItemType) => (type === "blog" ? "Article" : type === "qa" ? "QAPage" : type === "video" ? "VideoObject" : "DefinedTerm");

/** Hub page: a collection page + the guide itself + breadcrumbs, linked by @id so search and AI tools see the structure. */
export function topicJsonLd(t: Topic, items: ResolvedItem[]) {
  const url = topicUrl(t.slug);
  const journey = journeyOf(items);
  const sources = t.sources.filter((s) => s.title?.trim() && isUrl(s.url));
  const sameAs = t.sameAs.filter(isUrl);
  const author = t.authorName.trim() && !/team$/i.test(t.authorName.trim())
    ? { "@type": "Person", name: t.authorName.trim(), ...(t.authorCredentials.trim() ? { description: t.authorCredentials.trim() } : {}) }
    : orgRef;
  const about = { "@type": "Thing", name: t.focusKeyword.trim() || t.title, ...(sameAs.length ? { sameAs } : {}) };
  const parts = items.map((i) => ({ "@type": partType(i.type), "@id": itemUrl(i.type, i.slug), url: itemUrl(i.type, i.slug), name: i.title }));

  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "CollectionPage",
        "@id": `${url}#page`,
        url,
        name: effectiveMetaTitle(t),
        description: effectiveMetaDescription(t),
        inLanguage: "en",
        isPartOf: { "@type": "WebSite", name: SITE_NAME, url: SITE_URL },
        about,
        breadcrumb: { "@id": `${url}#breadcrumb` },
        mainEntity: { "@id": `${url}#guide` },
        hasPart: parts,
        ...(t.updatedAt ? { dateModified: isoDate(t.updatedAt) } : {}),
      },
      {
        "@type": "Article",
        "@id": `${url}#guide`,
        headline: t.title,
        description: t.shortAnswer,
        url,
        mainEntityOfPage: { "@id": `${url}#page` },
        inLanguage: "en",
        isAccessibleForFree: true,
        author,
        publisher: orgRef,
        about,
        ...(t.focusKeyword || t.secondaryKeywords.length ? { keywords: [t.focusKeyword, ...t.secondaryKeywords].filter(Boolean).join(", ") } : {}),
        ...(t.ogImage ? { image: t.ogImage } : {}),
        ...(t.publishedAt ? { datePublished: isoDate(t.publishedAt) } : {}),
        ...(t.updatedAt ? { dateModified: isoDate(t.updatedAt) } : {}),
        ...(t.lastReviewed ? { lastReviewed: t.lastReviewed } : {}),
        ...(t.reviewedBy.trim() ? { reviewedBy: { "@type": "Person", name: t.reviewedBy.trim() } } : {}),
        ...(sources.length ? { citation: sources.map((s) => ({ "@type": "CreativeWork", name: s.title, url: s.url })) } : {}),
        hasPart: parts,
        speakable: { "@type": "SpeakableSpecification", cssSelector: [".speakable-answer", "h1"] },
      },
      {
        "@type": "ItemList",
        "@id": `${url}#reading-path`,
        name: `${t.title}: reading path`,
        itemListElement: journey.map((i, n) => ({ "@type": "ListItem", position: n + 1, url: itemUrl(i.type, i.slug), name: i.title })),
      },
      {
        "@type": "BreadcrumbList",
        "@id": `${url}#breadcrumb`,
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
          { "@type": "ListItem", position: 2, name: "Blog", item: `${SITE_URL}/blog` },
          { "@type": "ListItem", position: 3, name: t.title, item: url },
        ],
      },
    ],
  };
}

/** The /blog page: topic guides first, then articles. */
export function landingJsonLd(topics: Topic[], articles: { title: string; path: string }[]) {
  const url = `${SITE_URL}/blog`;
  const list = [
    ...topics.map((t) => ({ url: topicUrl(t.slug), name: t.title })),
    ...articles.slice(0, 30).map((a) => ({ url: `${SITE_URL}${a.path}`, name: a.title })),
  ];
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "CollectionPage",
        "@id": `${url}#page`,
        url,
        name: `${TOPICS_NAME} | ${SITE_NAME}`,
        inLanguage: "en",
        isPartOf: { "@type": "WebSite", name: SITE_NAME, url: SITE_URL },
        mainEntity: { "@type": "ItemList", itemListElement: list.map((x, n) => ({ "@type": "ListItem", position: n + 1, url: x.url, name: x.name })) },
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
          { "@type": "ListItem", position: 2, name: "Blog", item: url },
        ],
      },
    ],
  };
}

/** A member page's path through its topic: Home > Blog > Topics > Topic > this page. */
export function memberBreadcrumbJsonLd(t: Topic, currentName: string, currentUrl: string) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "@id": `${currentUrl}#topic-breadcrumb`,
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
      { "@type": "ListItem", position: 2, name: "Blog", item: `${SITE_URL}/blog` },
      { "@type": "ListItem", position: 3, name: t.title, item: topicUrl(t.slug) },
      { "@type": "ListItem", position: 4, name: truncate(currentName.trim(), 80), item: currentUrl },
    ],
  };
}
