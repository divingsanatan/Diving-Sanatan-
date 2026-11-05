"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, Suspense } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Blog } from "@/types/database";

interface BlogContextType {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  executeSearch: (query: string) => void;
  activeCategory: string;
  setActiveCategory: (category: string) => void;
  activeBlog: Blog | null;
  setActiveBlog: (blog: Blog | null) => void;
}

const BlogContext = createContext<BlogContextType | undefined>(undefined);

/**
 * Reads ?category= / ?search= from the URL.
 * useSearchParams() must live in its own <Suspense> leaf: calling it in the provider itself
 * forced EVERY page below it to render only in the browser (no server HTML, wrong 404 status).
 * The two effects keep their original order: clear the search on navigation, then sync from URL.
 */
function UrlSync({
  pathname,
  clearSearch,
  setCategory,
  setSearch,
}: {
  pathname: string;
  clearSearch: () => void;
  setCategory: (c: string) => void;
  setSearch: (q: string) => void;
}) {
  const searchParams = useSearchParams();

  // Clear search when navigating between pages
  useEffect(() => {
    clearSearch();
  }, [pathname, clearSearch]);

  // Sync category from URL on /blog main page
  useEffect(() => {
    if (pathname === "/blog") {
      const urlCategory = searchParams.get("category");
      const urlSearch = searchParams.get("search");
      if (urlCategory) setCategory(urlCategory);
      else setCategory("all");
      if (urlSearch) setSearch(urlSearch);
    }
  }, [pathname, searchParams, setCategory, setSearch]);

  return null;
}

export function BlogProvider({ children }: { children: React.ReactNode }) {
  const [searchQuery, setSearchQueryState] = useState("");
  const [activeCategory, setActiveCategoryState] = useState("all");
  const [activeBlog, setActiveBlog] = useState<Blog | null>(null);
  const pathname = usePathname();
  const router = useRouter();
  const clearSearch = useCallback(() => setSearchQueryState(""), []);
  const setCategoryFromUrl = useCallback((c: string) => setActiveCategoryState(c), []);
  const setSearchFromUrl = useCallback((q: string) => setSearchQueryState(q), []);

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

  // Explicitly execute search: live update if on searchable page, or navigate to /blog?search=...
  const executeSearch = useCallback((query: string) => {
    const trimmed = query.trim();
    setSearchQueryState(trimmed);

    const searchablePages = ["/blog", "/blog/faq", "/blog/glossary", "/blog/pillar", "/blog/comparison"];
    if (searchablePages.includes(pathname)) {
      if (pathname === "/blog") {
        const params = new URLSearchParams(window.location.search);
        if (trimmed) params.set("search", trimmed);
        else params.delete("search");
        router.replace(`/blog?${params.toString()}`, { scroll: false });
      }
    } else {
      if (trimmed) {
        router.push(`/blog?search=${encodeURIComponent(trimmed)}`);
      } else {
        router.push("/blog");
      }
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
    <BlogContext.Provider
      value={{
        searchQuery,
        setSearchQuery,
        executeSearch,
        activeCategory,
        setActiveCategory,
        activeBlog,
        setActiveBlog,
      }}
    >
      <Suspense fallback={null}>
        <UrlSync pathname={pathname} clearSearch={clearSearch} setCategory={setCategoryFromUrl} setSearch={setSearchFromUrl} />
      </Suspense>
      {children}
    </BlogContext.Provider>
  );
}

export function useBlog() {
  const context = useContext(BlogContext);
  if (!context) throw new Error("useBlog must be used within a BlogProvider");
  return context;
}

