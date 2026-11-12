import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  compress: true,
  reactStrictMode: true,
  images: {
    unoptimized: true,
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
