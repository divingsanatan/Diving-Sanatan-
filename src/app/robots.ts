import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = "https://divingsanatan.com";
  
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/admin",
        "/admin/*",
        "/profile",
        "/profile/*",
        "/api",
        "/api/*",
        "/checkout",
        "/booking"
      ],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
