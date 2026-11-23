import { MetadataRoute } from "next";

const baseUrl = "https://divingsanatan.online";

// Pages that are personal, private or only useful to staff. Every crawler is asked to skip them.
const PRIVATE = [
  "/admin",
  "/api",
  "/profile",
  "/cart",
  "/checkout",
  "/booking",
  "/search",
  "/shop/cart",
  "/shop/checkout",
  "/shop/order/",
  "/blog/topics/preview/",
];

// Search engines, plus the bots AI assistants use to find and cite pages. All may read the public site.
// To keep a company's AI-training crawler out, remove its name here and it falls under the "*" rule instead.
const AI_BOTS = [
  "GPTBot",
  "OAI-SearchBot",
  "ChatGPT-User",
  "ClaudeBot",
  "Claude-SearchBot",
  "Claude-User",
  "anthropic-ai",
  "PerplexityBot",
  "Perplexity-User",
  "Google-Extended",
  "Applebot",
  "Applebot-Extended",
];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: "*", allow: "/", disallow: PRIVATE },
      { userAgent: AI_BOTS, allow: "/", disallow: PRIVATE },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
    host: baseUrl,
  };
}
