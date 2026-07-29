import BlogDetailsPage from "./BlogClient";
import { Metadata } from "next";
import { supabaseServer } from "@/utils/supabaseServer";
import { getDb } from "@/utils/db";
import { slugify } from "@/utils/slugify";

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  
  try {
    let blog: any = null;
    
    // 1. Try exact ID or slug query first
    const { data: match } = await supabaseServer
      .from("blogs")
      .select("id, title, category, content, author, slug")
      .eq("approval_status", "published")
      .or(`id.eq.${id},slug.eq.${id}`);

    if (match && match.length > 0) {
      blog = match[0];
    } else {
      // 2. Fetch published blogs only if targeted match failed
      const { data: allBlogs } = await supabaseServer
        .from("blogs")
        .select("id, title, category, content, author, slug")
        .eq("approval_status", "published");

      if (allBlogs && allBlogs.length > 0) {
        blog = allBlogs.find((b: any) =>
          b.id === id ||
          b.slug === id ||
          slugify(b.slug || b.title || "") === id
        );
      }
    }

    if (!blog) {
      const localDb = getDb();
      blog = localDb.blogs?.find((b: any) =>
        b.id === id ||
        b.slug === id ||
        slugify(b.slug || b.title || "") === id
      );
    }

    if (!blog) {
      return {
        title: "Article Not Found | Diving Sanatan",
        description: "The requested spiritual wellness article could not be resolved from our database."
      };
    }

    // Strip HTML tags and summarize description
    const plainText = (blog.content || "").replace(/<[^>]*>/g, "").trim();
    const shortDesc = plainText.length > 155 ? plainText.substring(0, 155) + "..." : plainText;

    return {
      title: `${blog.title} | ${blog.category}`,
      description: shortDesc,
      keywords: [
        blog.category,
        "Diving sanatan",
        "soul healing",
        "chakras",
        "urja tantra",
        "hopeful life",
        "Indian belief",
        "natural healing",
        "holistic healing",
        "inner engineers",
        blog.author || "Diving Sanatan Team"
      ],
      openGraph: {
        title: blog.title,
        description: shortDesc,
        type: "article",
        url: `https://divingsanatan.com/blog/${blog.slug || id}`,
        authors: [blog.author || "Diving Sanatan Team"]
      }
    };
  } catch (err) {
    console.error("Failed to generate dynamic blog metadata:", err);
    return {
      title: "Spiritual Healing Wisdom Blog | Diving Sanatan",
      description: "Read insightful guides on holistic therapy, energy medicine, chakra healing, and natural healing methods."
    };
  }
}

export default function Page() {
  return <BlogDetailsPage />;
}
