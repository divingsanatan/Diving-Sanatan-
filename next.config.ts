import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  compress: true,
  reactStrictMode: true,
  images: {
    unoptimized: true,
  },
  // Retired pages: a real server redirect (not a page-level one), so search engines and visitors
  // get a clean permanent move to the topic guides on /blog.
  async redirects() {
    return [
      { source: "/blog/pillar", destination: "/blog", permanent: true },
      { source: "/blog/topics", destination: "/blog", permanent: true },
      // Removed sections: old links go to the blog home instead of a dead page
      { source: "/blog/case-studies", destination: "/blog", permanent: true },
      { source: "/blog/comparison", destination: "/blog", permanent: true },
      { source: "/blog/comparison/:slug*", destination: "/blog", permanent: true },
      { source: "/comparisons", destination: "/blog", permanent: true },
      { source: "/admin/pillar", destination: "/admin/topics", permanent: false },
      // FAQ merged into Questions & Answers: public pages (same page names) and the admin screen
      { source: "/blog/faq", destination: "/blog/quora-qa", permanent: true },
      { source: "/blog/faq/:slug", destination: "/blog/quora-qa/:slug", permanent: true },
      { source: "/admin/faq", destination: "/admin/quora-qa", permanent: false },
      // /services/explore showed the same page as /explore-services
      { source: "/services/explore", destination: "/explore-services", permanent: true },
    ];
  },
  // A second safety lock on private areas: even if a link to them leaks, search engines are told not to index them.
  async headers() {
    const noindex = [{ key: "X-Robots-Tag", value: "noindex, nofollow" }];
    return ["/admin/:path*", "/api/:path*", "/profile/:path*", "/cart", "/checkout", "/booking", "/search", "/shop/cart", "/shop/checkout", "/shop/order/:path*", "/blog/topics/preview/:path*"].map((source) => ({ source, headers: noindex }));
  },
  // The files public/llms.txt and public/llm-full.txt are old, hand-written copies that would
  // otherwise be served instead of the live versions. These rules make the live versions
  // (which list your services, blogs and glossary terms) take priority.
  async rewrites() {
    return {
      beforeFiles: [
        { source: "/llms.txt", destination: "/api/ai/llms" },
        { source: "/llm-full.txt", destination: "/api/ai/llm-full" },
      ],
      afterFiles: [],
      fallback: [],
    };
  },
};

export default nextConfig;
