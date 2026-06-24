"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

interface BlogContextType {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  activeCategory: string;
  setActiveCategory: (category: string) => void;
}

const BlogContext = createContext<BlogContextType | undefined>(undefined);

export function BlogProvider({ children }: { children: React.ReactNode }) {
  const [searchQuery, setSearchQueryState] = useState("");
  const [activeCategory, setActiveCategoryState] = useState("all");
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();

  // Clear search when navigating between pages
  useEffect(() => {
    setSearchQueryState("");
  }, [pathname]);

  // Sync category from URL on /blog main page
  useEffect(() => {
    if (pathname === "/blog") {
      const urlCategory = searchParams.get("category");
      const urlSearch = searchParams.get("search");
      if (urlCategory) setActiveCategoryState(urlCategory);
      else setActiveCategoryState("all");
      if (urlSearch) setSearchQueryState(urlSearch);
    }
  }, [pathname, searchParams]);

  // Search always updates in-place on the current page (no redirect)
  const setSearchQuery = useCallback((query: string) => {
    setSearchQueryState(query);
    if (pathname === "/blog") {
      const params = new URLSearchParams(window.location.search);
      if (query) params.set("search", query);
      else params.delete("search");
      router.replace(`/blog?${params.toString()}`, { scroll: false });
    }
  }, [pathname, router]);

  // Category: update on /blog in-place; redirect from sub-pages
  const setActiveCategory = useCallback((cat: string) => {
    if (pathname === "/blog") {
      setActiveCategoryState(cat);
      const params = new URLSearchParams(window.location.search);
      if (cat && cat !== "all") params.set("category", cat);
      else params.delete("category");
      router.replace(`/blog?${params.toString()}`, { scroll: false });
    } else {
      // Redirect to main blog with category filter
      const params = new URLSearchParams();
      if (cat && cat !== "all") params.set("category", cat);
      router.push(`/blog?${params.toString()}`);
    }
  }, [pathname, router]);

  return (
    <BlogContext.Provider value={{ searchQuery, setSearchQuery, activeCategory, setActiveCategory }}>
      {children}
    </BlogContext.Provider>
  );
}

export function useBlog() {
  const context = useContext(BlogContext);
  if (!context) throw new Error("useBlog must be used within a BlogProvider");
  return context;
}
