import BlogDetailsPage from "./BlogClient";
import { Metadata } from "next";
import { supabaseServer } from "@/utils/supabaseServer";

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  
  try {
    const { data: blog, error } = await supabaseServer
      .from("blogs")
      .select("title, category, content, author")
      .eq("id", id)
      .single();

    if (error || !blog) {
      return {
        title: "Article Not Found | Diving Sanatan",
        description: "The requested spiritual wellness article could not be resolved from our database."
      };
    }

    // Strip HTML tags and summarize description
    const plainText = blog.content.replace(/<[^>]*>/g, "").trim();
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
        url: `https://divingsanatan.com/blog/${id}`,
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
