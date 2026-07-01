import { MetadataRoute } from "next";
import { supabaseServer } from "@/utils/supabaseServer";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = "https://divingsanatan.com";

  // Static site pages
  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: `${baseUrl}`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1.0,
    },
    {
      url: `${baseUrl}/about`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${baseUrl}/services`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.9,
    },
    {
      url: `${baseUrl}/blog`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${baseUrl}/contact`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.7,
    },
  ];

  try {
    // Dynamic blog articles fetched directly from Supabase
    const { data: blogs } = await supabaseServer
      .from("blogs")
      .select("id, date")
      .order("date", { ascending: false });

    if (blogs && blogs.length > 0) {
      const dynamicBlogRoutes: MetadataRoute.Sitemap = blogs.map((blog) => ({
        url: `${baseUrl}/blog/${blog.id}`,
        lastModified: blog.date ? new Date(blog.date) : new Date(),
        changeFrequency: "monthly",
        priority: 0.6,
      }));

      return [...staticRoutes, ...dynamicBlogRoutes];
    }
  } catch (error) {
    console.error("Error generating dynamic sitemap routes:", error);
  }

  return staticRoutes;
}
