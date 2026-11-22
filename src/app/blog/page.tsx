import type { Metadata } from "next";
import BlogLanding, { type LandingArticle, type LandingTopic } from "./BlogLanding";
import { supabaseServer } from "@/utils/supabaseServer";
import { getTopicsWithItems } from "@/lib/topicsServer";
import { countsLabel, countsOf, landingJsonLd } from "@/lib/topicsShared";
import { SITE_NAME, SITE_URL, stripHtml, truncate } from "@/lib/shopShared";
import { jsonLdString } from "@/lib/shopServer";

export const revalidate = 60;

const TITLE = `Spiritual Healing and Sanatan Dharma Guides | ${SITE_NAME}`;
const DESCRIPTION = "Topic guides, articles and answers on chakras, Tantra, meditation and the psychology of Sanatan Dharma. Start with a topic and follow a clear path from a short answer to the full story.";

export const metadata: Metadata = {
  title: { absolute: TITLE },
  description: DESCRIPTION,
  alternates: { canonical: `${SITE_URL}/blog` },
  keywords: ["spiritual healing guides", "Sanatan Dharma", "chakras explained", "Tantra explained", "meditation articles", "Gita psychology", "divingsanatan blog"],
  openGraph: { type: "website", title: TITLE, description: DESCRIPTION, url: `${SITE_URL}/blog`, siteName: SITE_NAME },
  twitter: { card: "summary_large_image", title: TITLE, description: DESCRIPTION },
};

const goodImage = (img: unknown) => (typeof img === "string" && (img.startsWith("http") || img.startsWith("/")) ? img : "");

export default async function BlogPage() {
  const [entries, blogsRes] = await Promise.all([
    getTopicsWithItems().catch(() => []),
    supabaseServer
      .from("blogs")
      .select("id, slug, title, category, tldr, content, image, date")
      .eq("approval_status", "published")
      .order("date", { ascending: false })
      .limit(80),
  ]);

  const topics: LandingTopic[] = entries.map(({ topic, items }) => ({ slug: topic.slug, title: topic.title, shortAnswer: topic.shortAnswer, counts: countsLabel(countsOf(items)) }));
  const articles: LandingArticle[] = (blogsRes.data || []).map((b: Record<string, unknown>) => ({
    key: String(b.id),
    path: `/blog/${b.slug || b.id}`,
    title: String(b.title || ""),
    summary: String(b.tldr || "").trim() || truncate(stripHtml(String(b.content || "")), 150),
    category: String(b.category || ""),
    image: goodImage(b.image),
  }));

  return (
    <>
      <BlogLanding topics={topics} articles={articles} />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLdString(landingJsonLd(entries.map((e) => e.topic), articles.map((a) => ({ title: a.title, path: a.path })))) }}
      />
    </>
  );
}
