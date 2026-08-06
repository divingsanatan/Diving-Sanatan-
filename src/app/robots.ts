import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = "https://divingsanatan.online";
  
  return {
    rules: [
      {
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
          "/booking",
          "/cart"
        ],
      },
      {
        userAgent: ["GPTBot", "ClaudeBot", "anthropic-ai", "Google-Extended", "PerplexityBot"],
        allow: ["/", "/blog", "/blog/*", "/services", "/services/*", "/about", "/reviews"],
        disallow: ["/admin", "/profile", "/cart", "/checkout", "/booking"],
      }
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}

