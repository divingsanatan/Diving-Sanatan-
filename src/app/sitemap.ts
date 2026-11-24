import { MetadataRoute } from "next";
import { effectiveSummary, mapVideoRow, thumbnailOf, videoUrl } from "@/lib/videoShared";
import { YOUTUBE_CHANNEL_NAME, YOUTUBE_CHANNEL_URL, youtubeEmbedBase } from "@/lib/youtube";
import { supabaseServer } from "@/utils/supabaseServer";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = "https://divingsanatan.online";

  // Public pages that are always there. Their dates are left out on purpose: a date that changes on every
  // visit teaches search engines to ignore it, so only pages with a real edit date carry one.
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${baseUrl}`, changeFrequency: "daily", priority: 1.0 },
    { url: `${baseUrl}/blog`, changeFrequency: "daily", priority: 0.9 },
    { url: `${baseUrl}/services`, changeFrequency: "weekly", priority: 0.9 },
    { url: `${baseUrl}/explore-services`, changeFrequency: "weekly", priority: 0.8 },
    { url: `${baseUrl}/gurus`, changeFrequency: "weekly", priority: 0.8 },
    { url: `${baseUrl}/blog/quora-qa`, changeFrequency: "daily", priority: 0.8 },
    { url: `${baseUrl}/blog/glossary`, changeFrequency: "weekly", priority: 0.8 },
    { url: `${baseUrl}/blog/video-transcripts`, changeFrequency: "weekly", priority: 0.7 },
    { url: `${baseUrl}/shop`, changeFrequency: "weekly", priority: 0.8 },
    { url: `${baseUrl}/reviews`, changeFrequency: "weekly", priority: 0.6 },
    { url: `${baseUrl}/about`, changeFrequency: "monthly", priority: 0.6 },
    { url: `${baseUrl}/contact`, changeFrequency: "monthly", priority: 0.5 },
    { url: `${baseUrl}/privacy`, changeFrequency: "yearly", priority: 0.2 },
  ];

  try {
    // Dynamic blog articles, services, practitioners, products, topics, questions and videos from Supabase
    const [blogsRes, servRes, guruRes, shopRes, glossRes, topicRes, qaRes, videoRes] = await Promise.all([
      supabaseServer.from("blogs").select("id, slug, date, updated_at").eq("approval_status", "published").order("date", { ascending: false }),
      supabaseServer.from("services").select("id, created_at").eq("approval_status", "published"),
      supabaseServer.from("practitioners").select("id, created_at").eq("approval_status", "published"),
      // Published products that haven't been marked "noindex"
      supabaseServer
        .from("shop_products")
        .select("slug, updated_at, images")
        .eq("status", "published")
        .eq("noindex", false),
      // Published glossary terms that haven't been marked "noindex"
      supabaseServer
        .from("glossary_terms")
        .select("slug, updated_at, created_at")
        .eq("status", "published")
        .eq("noindex", false),
      // Topic guides that are published and not marked "noindex"
      supabaseServer
        .from("topics")
        .select("slug, updated_at, created_at")
        .eq("status", "published")
        .eq("noindex", false),
      // Q&A: only live questions that a healer has ANSWERED and that aren't marked "noindex"
      // (an unanswered question is a thin page, so it is kept out of the sitemap)
      supabaseServer
        .from("qa_questions")
        .select("slug, answer, updated_at, published_at, created_at")
        .eq("status", "published")
        .eq("noindex", false)
        .neq("answer", ""),
      // Live videos that haven't been marked "noindex" (with the fields Google's video sitemap needs)
      supabaseServer
        .from("video_posts")
        .select("*")
        .eq("status", "published")
        .eq("noindex", false)
    ]);

    const videoPosts = (videoRes.data || []).map(mapVideoRow);
    // Blog posts that were imported as videos now redirect to their video page: keep them out of the sitemap
    const importedBlogIds = new Set(videoPosts.map((v) => v.sourceBlogId).filter(Boolean));

    const blogRoutes: MetadataRoute.Sitemap = (blogsRes.data || []).filter((blog) => !importedBlogIds.has(String(blog.id))).map((blog) => ({
      url: `${baseUrl}/blog/${blog.slug || blog.id}`, // the same address each article names as its canonical link
      lastModified: blog.updated_at || blog.date ? new Date(blog.updated_at || blog.date) : undefined,
      changeFrequency: "weekly",
      priority: 0.7,
    }));

    const serviceRoutes: MetadataRoute.Sitemap = (servRes.data || []).map((serv) => ({
      url: `${baseUrl}/services/${serv.id}`,
      lastModified: serv.created_at ? new Date(serv.created_at) : undefined,
      changeFrequency: "weekly",
      priority: 0.8,
    }));

    const guruRoutes: MetadataRoute.Sitemap = (guruRes.data || []).map((g) => ({
      url: `${baseUrl}/gurus/${g.id}`,
      lastModified: g.created_at ? new Date(g.created_at) : undefined,
      changeFrequency: "monthly" as const,
      priority: 0.7,
    }));

    const shopRoutes: MetadataRoute.Sitemap = (shopRes.data || []).map((prod) => ({
      url: `${baseUrl}/shop/${prod.slug}`,
      lastModified: prod.updated_at ? new Date(prod.updated_at) : undefined,
      changeFrequency: "weekly",
      priority: 0.8,
      images: (Array.isArray(prod.images) ? prod.images : [])
        .map((img: { url?: string }) => img?.url)
        .filter((u: unknown): u is string => typeof u === "string" && /^https?:\/\//.test(u))
        .slice(0, 5),
    }));

    const glossaryRoutes: MetadataRoute.Sitemap = (glossRes.data || []).map((t) => ({
      url: `${baseUrl}/blog/glossary/${t.slug}`,
      lastModified: new Date(t.updated_at || t.created_at || Date.now()),
      changeFrequency: "monthly",
      priority: 0.6,
    }));

    const topicRoutes: MetadataRoute.Sitemap = (topicRes.data || []).map((t) => ({
      url: `${baseUrl}/blog/topics/${t.slug}`,
      lastModified: new Date(t.updated_at || t.created_at || Date.now()),
      changeFrequency: "weekly",
      priority: 0.8,
    }));

    const qaRoutes: MetadataRoute.Sitemap = (qaRes.data || [])
      .filter((q) => String(q.answer || "").replace(/<[^>]*>/g, "").trim())
      .map((q) => ({
        url: `${baseUrl}/blog/quora-qa/${q.slug}`,
        lastModified: new Date(q.updated_at || q.published_at || q.created_at || Date.now()),
        changeFrequency: "monthly" as const,
        priority: 0.6,
      }));

    const videoRoutes: MetadataRoute.Sitemap = videoPosts.map((v) => ({
      url: videoUrl(v.slug),
      lastModified: new Date(v.updatedAt || v.publishedAt || v.createdAt || Date.now()),
      changeFrequency: "monthly" as const,
      priority: 0.7,
      // Google video sitemap entry: helps the video show up in video results and Key Moments
      videos: [
        {
          title: v.title.slice(0, 100),
          thumbnail_loc: thumbnailOf(v),
          description: (effectiveSummary(v) || v.title).slice(0, 2000),
          player_loc: youtubeEmbedBase(v.youtubeId),
          ...(v.durationSeconds ? { duration: v.durationSeconds } : {}),
          publication_date: v.uploadDate || v.publishedAt || undefined,
          family_friendly: "yes" as const,
          uploader: { info: YOUTUBE_CHANNEL_URL, content: YOUTUBE_CHANNEL_NAME },
        },
      ],
    }));

    return [...staticRoutes, ...blogRoutes, ...serviceRoutes, ...guruRoutes, ...shopRoutes, ...glossaryRoutes, ...topicRoutes, ...qaRoutes, ...videoRoutes];
  } catch (error) {
    console.error("Error generating dynamic sitemap routes:", error);
  }

  return staticRoutes;
}
