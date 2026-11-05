"use client";

import React from "react";
import { BlogProvider } from "@/app/blog/BlogContext";
import { BlogFloatingSearchBar } from "@/components/blog/BlogFloatingSearchBar";
import { usePathname } from "next/navigation";

function FloatingSearchBarWithRouteCheck() {
  const pathname = usePathname();

  // Hide floating search bar on admin pages
  if (pathname.startsWith("/admin")) {
    return null;
  }

  return <BlogFloatingSearchBar />;
}

export function GlobalSearchProvider({ children }: { children: React.ReactNode }) {
  return (
    // No <Suspense> here on purpose: BlogProvider isolates its own useSearchParams() call, and a boundary
    // above {children} makes the server send HTTP 200 for pages that later call notFound().
    <BlogProvider>
      {children}
      <FloatingSearchBarWithRouteCheck />
    </BlogProvider>
  );
}
