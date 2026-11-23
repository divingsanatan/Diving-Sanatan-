import { SITE_NAME, SITE_URL, stripHtml, truncate, wordCount } from "./shopShared";
import { topicPath } from "./topicsShared";

/** The fields of a blog row that the page and its structured data use. */
export interface BlogRow {
  id: string;
  slug?: string;
  title: string;
  category?: string;
  author?: string;
  author_bio?: string;
  reviewed_by?: string;
  content?: string;
  date?: string;
  updated_at?: string;
  image?: string;
  og_image_override?: string;
  featured_image_alt?: string;
  tldr?: string;
  meta_title?: string;
  meta_description?: string;
  focus_keyword?: string;
  canonical_url?: string;
  robots_directive?: string;
  schema_type?: string;
  faq_pairs?: { question: string; answer: string }[];
  tags?: string[];
  content_type?: string;
  section?: string | null;
}

export const blogPath = (b: Pick<BlogRow, "id" | "slug">) => `/blog/${b.slug || b.id}`;
export const blogUrl = (b: Pick<BlogRow, "id" | "slug">) => `${SITE_URL}${blogPath(b)}`;

const absolute = (u?: string) => (!u ? "" : /^https?:\/\//i.test(u) ? u : u.startsWith("/") ? `${SITE_URL}${u}` : "");
const iso = (d?: string) => {
  if (!d) return undefined;
  const t = new Date(d);
  return Number.isNaN(t.getTime()) ? undefined : t.toISOString();
};

/** A search snippet must be plain text: no tags, no markdown marks, no emoji, no stray spaces, and short enough to show in full. */
export function cleanSnippet(input: string, max = 155): string {
  const text = (input || "")
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/(\*\*|__|`)/g, "")
    .replace(/^#+\s*/gm, "")
    .replace(/[\p{Extended_Pictographic}\u200d\ufe0f]/gu, "")
    .replace(/\s+/g, " ")
    .trim();
  if (text.length <= max) return text;
  const cut = text.slice(0, max - 1);
  return `${cut.slice(0, Math.max(cut.lastIndexOf(" "), 80)).trim()}…`;
}

export const blogDescription = (b: BlogRow) => cleanSnippet((b.meta_description || "").trim() || (b.tldr || "").trim() || stripHtml(b.content || ""));
export const blogImageUrl = (b: BlogRow) => absolute(b.og_image_override) || absolute(b.image);
export const blogIsNoindex = (b: BlogRow) => /noindex/i.test(b.robots_directive || "");

/** Article markup for a blog post. The topic hub (when the post belongs to one) is named as the larger work it is part of. */
export function blogJsonLd(b: BlogRow, topic?: { slug: string; title: string } | null) {
  const url = blogUrl(b);
  const author = (b.author || "").trim();
  const img = blogImageUrl(b);
  const faqs = (b.faq_pairs || []).filter((f) => f && f.question?.trim() && f.answer?.trim());
  const text = stripHtml(b.content || "");

  const graph: Record<string, unknown>[] = [
    {
      "@type": b.schema_type === "BlogPosting" ? "BlogPosting" : "Article",
      "@id": `${url}#article`,
      headline: truncate((b.title || "").trim(), 110),
      description: blogDescription(b),
      url,
      mainEntityOfPage: url,
      inLanguage: "en",
      isAccessibleForFree: true,
      wordCount: wordCount(text),
      ...(img ? { image: img } : {}),
      ...(iso(b.date) ? { datePublished: iso(b.date) } : {}),
      dateModified: iso(b.updated_at) || iso(b.date),
      author: author && !/team$/i.test(author)
        ? { "@type": "Person", name: author, ...(b.author_bio?.trim() ? { description: b.author_bio.trim() } : {}) }
        : { "@type": "Organization", name: SITE_NAME, url: SITE_URL },
      publisher: { "@type": "Organization", name: SITE_NAME, url: SITE_URL },
      ...(b.reviewed_by?.trim() ? { reviewedBy: { "@type": "Person", name: b.reviewed_by.trim() } } : {}),
      ...(b.category ? { articleSection: b.category } : {}),
      ...((b.tags?.length || b.focus_keyword) ? { keywords: [b.focus_keyword, ...(b.tags || [])].filter(Boolean).join(", ") } : {}),
      ...(topic ? { isPartOf: { "@type": "CollectionPage", name: `${topic.title} guide`, url: `${SITE_URL}${topicPath(topic.slug)}` }, about: { "@type": "Thing", name: topic.title } } : {}),
      speakable: { "@type": "SpeakableSpecification", cssSelector: [".blog-article-content h1", ".blog-article-content p:first-of-type"] },
    },
    {
      "@type": "BreadcrumbList",
      "@id": `${url}#breadcrumb`,
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
        { "@type": "ListItem", position: 2, name: "Blog", item: `${SITE_URL}/blog` },
        { "@type": "ListItem", position: 3, name: truncate((b.title || "").trim(), 80), item: url },
      ],
    },
  ];

  // Only when the editor chose FAQ markup and the questions really are on the page.
  if (b.schema_type === "FAQPage" && faqs.length) {
    graph.push({
      "@type": "FAQPage",
      "@id": `${url}#faq`,
      mainEntity: faqs.map((f) => ({ "@type": "Question", name: f.question.trim(), acceptedAnswer: { "@type": "Answer", text: stripHtml(f.answer) } })),
    });
  }
  return { "@context": "https://schema.org", "@graph": graph };
}
