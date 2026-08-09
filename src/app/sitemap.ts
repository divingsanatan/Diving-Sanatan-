import { MetadataRoute } from "next";
import { supabaseServer } from "@/utils/supabaseServer";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = "https://divingsanatan.online";

  // Static site pages
  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: `${baseUrl}`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1.0,
    },
    {
      url: `${baseUrl}/services`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.9,
    },
    {
      url: `${baseUrl}/booking`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.9,
    },
    {
      url: `${baseUrl}/blog`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.85,
    },
    {
      url: `${baseUrl}/about`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${baseUrl}/reviews`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.75,
    },
    {
      url: `${baseUrl}/contact`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: `${baseUrl}/privacy`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.4,
    },
  ];

  try {
    // Dynamic blog articles, services, and comparison pages from Supabase
    const [blogsRes, servRes, compRes] = await Promise.all([
      supabaseServer.from("blogs").select("id, date").order("date", { ascending: false }),
      supabaseServer.from("services").select("id, name"),
      supabaseServer.from("comparison_pages").select("slug")
    ]);

    const blogRoutes: MetadataRoute.Sitemap = (blogsRes.data || []).map((blog) => ({
      url: `${baseUrl}/blog/${blog.id}`,
      lastModified: blog.date ? new Date(blog.date) : new Date(),
      changeFrequency: "weekly",
      priority: 0.7,
    }));

    const serviceRoutes: MetadataRoute.Sitemap = (servRes.data || []).map((serv) => ({
      url: `${baseUrl}/services/${serv.id}`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.8,
    }));

    const compRoutes: MetadataRoute.Sitemap = (compRes.data || []).map((comp) => ({
      url: `${baseUrl}/blog/comparison/${comp.slug}`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.65,
    }));

    return [...staticRoutes, ...blogRoutes, ...serviceRoutes, ...compRoutes];
  } catch (error) {
    console.error("Error generating dynamic sitemap routes:", error);
  }

  return staticRoutes;
}
