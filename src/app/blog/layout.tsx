"use client";

import React, { Suspense } from "react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { BlogSidebar } from "@/components/blog/BlogSidebar";
import { BlogRightSidebar } from "@/components/blog/BlogRightSidebar";
import { BlogProvider, useBlog } from "./BlogContext";
import { usePathname } from "next/navigation";

function BlogLayoutInner({ children }: { children: React.ReactNode }) {
  const { searchQuery, setSearchQuery } = useBlog();
  const pathname = usePathname();

  // Per-page search config
  const searchConfig: Record<string, { title: string; placeholder: string }> = {
    "/blog": { title: "Explore Blogs", placeholder: "Search blogs, topics, healers..." },
    "/blog/faq": { title: "Search Questions", placeholder: "Type your question..." },
    "/blog/glossary": { title: "Search Terms", placeholder: "Type a term..." },
    "/blog/quora-qa": { title: "Search Answers", placeholder: "Type your question..." },
    "/blog/case-studies": { title: "Search Case Studies", placeholder: "Type keywords..." },
    "/blog/comparison": { title: "Search Comparisons", placeholder: "Search healing modalities... (e.g., anxiety, duration, tools)" },
    "/blog/video-transcripts": { title: "Search Transcripts", placeholder: "Type keywords..." },
  };

  const comparisonSlugConfig = pathname.startsWith("/blog/comparison/") && pathname !== "/blog/comparison"
    ? { title: "Search Comparisons", placeholder: "Search healing modalities... (e.g., anxiety, duration, tools)" }
    : null;

  const config = comparisonSlugConfig ?? searchConfig[pathname] ?? { title: "Search", placeholder: "Type keywords..." };

  return (
    <div className="page-col">
      <Header />

      <div className="blog-layout-container">
        {/* Sidebar on the Left */}
        <aside className="blog-sidebar-container">
          <div className="sidebar-search-box">
            <div className="sidebar-title-row">
              <svg viewBox="0 0 100 100" className="sidebar-lotus-icon">
                <path d="M50 25 C45 45 35 60 50 80 C65 60 55 45 50 25 Z" fill="none" stroke="#a855f7" strokeWidth="4" />
                <path d="M50 80 C35 75 25 60 20 40 C35 50 45 60 50 80 Z" fill="none" stroke="#a855f7" strokeWidth="4" />
                <path d="M50 80 C65 75 75 60 80 40 C65 50 55 60 50 80 Z" fill="none" stroke="#a855f7" strokeWidth="4" />
                <path d="M50 80 C30 80 10 70 5 55 C20 65 35 70 50 80 Z" fill="none" stroke="#a855f7" strokeWidth="4" />
                <path d="M50 80 C70 80 90 70 95 55 C80 65 65 70 50 80 Z" fill="none" stroke="#a855f7" strokeWidth="4" />
              </svg>
              <h4 className="sidebar-heading-small">{config.title}</h4>
            </div>
            
            <div className="blog-search-wrapper">
              <input
                type="text"
                placeholder={config.placeholder}
                className="search-input"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <svg className="search-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8"></circle>
                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
              </svg>
              {searchQuery && (
                <button
                  className="search-clear-btn"
                  onClick={() => setSearchQuery("")}
                  aria-label="Clear search"
                >
                  ✕
                </button>
              )}
            </div>
          </div>
          
          <BlogSidebar />
        </aside>

        {/* Main Content on the Center */}
        <main className="blog-main-content">
          {children}
        </main>

        {/* Sidebar on the Right */}
        <aside className="blog-right-sidebar-container">
          <BlogRightSidebar />
        </aside>
      </div>

      <Footer />

      <style jsx global>{`
        .blog-layout-container + .footer-container {
          margin-top: 24px;
        }
        .blog-layout-container {
          max-width: 1400px;
          margin: 0 auto;
          padding: 40px 24px 24px;
          display: flex;
          gap: 32px;
          width: 100%;
          align-items: flex-start;
        }
        .blog-main-content {
          flex: 1;
          min-width: 0;
        }
        .blog-sidebar-container {
          flex: 0 0 240px;
          width: 240px;
          display: flex;
          flex-direction: column;
          gap: 16px;
          position: sticky;
          top: 94px;
          align-self: flex-start;
          max-height: calc(100vh - 110px);
          overflow-y: auto;
          overflow-x: hidden;
          scrollbar-width: none;
          -ms-overflow-style: none;
        }
        .blog-sidebar-container::-webkit-scrollbar {
          display: none;
        }
        .blog-right-sidebar-container {
          flex: 0 0 280px;
          width: 280px;
          display: flex;
          flex-direction: column;
          gap: 16px;
          position: sticky;
          top: 94px;
          align-self: flex-start;
          max-height: calc(100vh - 110px);
          overflow-y: auto;
          overflow-x: hidden;
          scrollbar-width: none;
          -ms-overflow-style: none;
        }
        .blog-right-sidebar-container::-webkit-scrollbar {
          display: none;
        }
        .sidebar-search-box {
          display: flex;
          flex-direction: column;
          gap: 16px;
          flex-shrink: 0;
          margin-bottom: 24px;
        }
        .sidebar-title-row {
          display: flex;
          align-items: center;
          gap: 6px;
        }
        .sidebar-lotus-icon {
          width: 24px;
          height: 24px;
          flex-shrink: 0;
          margin-top: -2px;
        }
        .sidebar-heading-small {
          font-family: var(--font-sans);
          font-size: 1.15rem;
          color: #111827;
          font-weight: 700 !important;
          margin: 0;
        }
        .blog-search-wrapper {
          display: flex;
          align-items: center;
          width: 100%;
          background: #ffffff;
          border: 1px solid rgba(168, 85, 247, 0.15);
          border-radius: 12px;
          padding: 0 14px;
          box-sizing: border-box;
          transition: var(--transition-fast);
        }
        .blog-search-wrapper:focus-within {
          border-color: rgba(168, 85, 247, 0.4);
          box-shadow: 0 0 0 3px rgba(168, 85, 247, 0.08);
        }
        .search-icon {
          color: #a855f7;
          flex-shrink: 0;
          margin-left: 4px;
        }
        .search-input {
          flex: 1;
          border: none;
          background: transparent;
          outline: none;
          padding: 10px 0;
          font-family: var(--font-sans);
          font-size: 0.85rem;
          color: #111827;
        }
        .search-clear-btn {
          background: none;
          border: none;
          color: hsl(var(--text-muted));
          cursor: pointer;
          font-size: 0.75rem;
          padding: 2px 4px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: color 0.2s ease;
          line-height: 1;
          margin-left: 8px;
        }
        .search-clear-btn:hover {
          color: #ef4444;
        }

        @media (max-width: 1200px) {
          .blog-right-sidebar-container {
            display: none;
          }
        }

        @media (max-width: 968px) {
          .blog-layout-container {
            flex-direction: column;
            padding: 30px 20px 24px;
          }
          .blog-sidebar-container {
            width: 100%;
            flex: none;
            position: static;
            max-height: none;
            overflow: visible;
            margin-bottom: 8px;
          }
        }
      `}</style>
    </div>
  );
}

export default function BlogLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Suspense fallback={<div className="layout-loading">Loading layout...</div>}>
      <BlogProvider>
        <BlogLayoutInner>{children}</BlogLayoutInner>
      </BlogProvider>
    </Suspense>
  );
}
