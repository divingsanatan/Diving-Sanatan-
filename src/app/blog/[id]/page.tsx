/* eslint-disable @typescript-eslint/no-explicit-any */
import { cache } from "react";
import BlogDetailsPage from "./BlogClient";
import { Metadata } from "next";
import { supabaseServer } from "@/utils/supabaseServer";
import { getDb } from "@/utils/db";
import { slugify } from "@/utils/slugify";
import { jsonLdString } from "@/lib/shopServer";
import { blogDescription, blogImageUrl, blogIsNoindex, blogJsonLd, blogUrl, type BlogRow } from "@/lib/blogSeo";
import { getTrailFor } from "@/lib/topicsServer";
import { TopicBadge, TopicTrail } from "@/components/blog/TopicTrail";

// Articles are now built on the server (so search and AI crawlers receive the full text),
// and refreshed at most once a minute.
export const revalidate = 60;

interface PageProps {
  params: Promise<{ id: string }>;
}

/** Find a published article by id or address, in the same shape the blog API returns. Shared by the page and its metadata. */
const loadBlog = cache(async (id: string): Promise<(BlogRow & Record<string, any>) | null> => {
  let blog: any = null;
  try {
    const { data: match } = await supabaseServer
      .from("blogs")
      .select("*")
      .eq("approval_status", "published")
      .or(`id.eq.${id},slug.eq.${id}`);
    if (match && match.length > 0) {
      blog = match[0];
    } else {
      const { data: allBlogs } = await supabaseServer.from("blogs").select("*").eq("approval_status", "published");
      blog = (allBlogs || []).find((b: any) => b.id === id || b.slug === id || slugify(b.slug || b.title || "") === id) || null;
    }
  } catch (err) {
    console.error("loadBlog failed:", err);
  }
  if (!blog) {
    const localDb = getDb();
    blog = localDb.blogs?.find((b: any) => b.id === id || b.slug === id || slugify(b.slug || b.title || "") === id) || null;
  }
  if (!blog) return null;
  return {
    ...blog,
    slug: blog.slug || slugify(blog.title) || blog.id,
    readTime: blog.read_time || blog.readTime,
    images: Array.isArray(blog.images) ? blog.images : [],
    videos: Array.isArray(blog.videos) ? blog.videos : [],
  };
});

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  try {
    const blog = await loadBlog(id);
    if (!blog) {
      return {
        title: "Article Not Found | Diving Sanatan",
        description: "The requested spiritual wellness article could not be resolved from our database.",
        robots: { index: false, follow: false },
      };
    }
    const description = blogDescription(blog);
    const title = (blog.meta_title || "").trim() || `${blog.title} | ${blog.category}`;
    const image = blogImageUrl(blog);
    return {
      title,
      description,
      alternates: { canonical: (blog.canonical_url || "").trim() || blogUrl(blog) },
      robots: blogIsNoindex(blog) ? { index: false, follow: true } : { index: true, follow: true },
      keywords: [blog.focus_keyword, blog.category, ...(blog.tags || []), "Diving Sanatan", blog.author || "Diving Sanatan Team"].filter(Boolean) as string[],
      openGraph: {
        title: blog.meta_title || blog.title,
        description,
        type: "article",
        url: blogUrl(blog),
        siteName: "Diving Sanatan",
        authors: [blog.author || "Diving Sanatan Team"],
        ...(image ? { images: [{ url: image, alt: blog.featured_image_alt || blog.title }] } : {}),
        ...(blog.date ? { publishedTime: new Date(blog.date).toISOString() } : {}),
        ...(blog.updated_at ? { modifiedTime: new Date(blog.updated_at).toISOString() } : {}),
      },
      twitter: { card: image ? "summary_large_image" : "summary", title: blog.meta_title || blog.title, description, ...(image ? { images: [image] } : {}) },
    };
  } catch (err) {
    console.error("Failed to generate dynamic blog metadata:", err);
    return {
      title: "Spiritual Healing Wisdom Blog | Diving Sanatan",
      description: "Read insightful guides on holistic therapy, energy medicine, chakra healing, and natural healing methods.",
    };
  }
}

export default async function Page({ params }: PageProps) {
  const { id } = await params;
  const blog = await loadBlog(id);
  if (!blog) return <BlogDetailsPage />;

  const trail = await getTrailFor("blog", blog.slug || id);
  const ld = blogJsonLd(blog, trail ? { slug: trail.topic.slug, title: trail.topic.title } : null);

  return (
    <>
      <TopicBadge trail={trail} />
      <BlogDetailsPage initialBlog={blog as any} />
      <TopicTrail trail={trail} currentTitle={blog.title} currentUrl={blogUrl(blog)} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdString(ld) }} />
    </>
  );
}

