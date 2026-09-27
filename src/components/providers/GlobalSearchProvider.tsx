"use client";

import React, { Suspense } from "react";
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
    <Suspense fallback={null}>
      <BlogProvider>
        {children}
        <FloatingSearchBarWithRouteCheck />
      </BlogProvider>
    </Suspense>
  );
}
