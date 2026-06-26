"use client";

import React, { Suspense } from "react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { BlogSidebar } from "@/components/blog/BlogSidebar";
import { BlogProvider, useBlog } from "./BlogContext";
import { usePathname } from "next/navigation";

function BlogLayoutInner({ children }: { children: React.ReactNode }) {
  const { searchQuery, setSearchQuery } = useBlog();
  const pathname = usePathname();

  // Per-page search config
  const searchConfig: Record<string, { title: string; placeholder: string }> = {
    "/blog": { title: "Search Articles", placeholder: "Type keywords..." },
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
          <div className="sidebar-search-box glass-panel">
            <h4 className="search-box-title">{config.title}</h4>
            <div className="blog-search-wrapper">
              <svg className="search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8"></circle>
                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
              </svg>
              <input
                type="text"
                placeholder={config.placeholder}
                className="search-input"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
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

        {/* Main Content on the Right */}
        <main className="blog-main-content">
          {children}
        </main>
      </div>

      <Footer />

      <style jsx global>{`
        .blog-layout-container + .footer-container {
          margin-top: 24px;
        }
        .blog-layout-container {
          max-width: 1200px;
          margin: 0 auto;
          padding: 40px 24px 24px;
          display: flex;
          gap: 40px;
          width: 100%;
          align-items: flex-start;
        }
        .blog-main-content {
          flex: 3;
          min-width: 0;
        }
        .blog-sidebar-container {
          flex: 0 0 260px;
          width: 260px;
          display: flex;
          flex-direction: column;
          gap: 16px;
          position: sticky;
          top: 94px;
          align-self: flex-start;
          max-height: calc(100vh - 110px);
          overflow-y: auto;
          overflow-x: hidden;
          /* Hide scrollbar but keep scrollable */
          scrollbar-width: none;
          -ms-overflow-style: none;
        }
        .blog-sidebar-container::-webkit-scrollbar {
          display: none;
        }
        .sidebar-search-box {
          padding: 16px;
          border-radius: 12px;
          display: flex;
          flex-direction: column;
          gap: 8px;
          flex-shrink: 0;
        }
        .search-box-title {
          font-size: 0.78rem;
          font-weight: 700;
          color: #4c1d95;
          text-transform: uppercase;
          letter-spacing: 0.07em;
          margin: 0;
          transition: all 0.3s ease;
        }
        .blog-search-wrapper {
          display: flex;
          align-items: center;
          position: relative;
          width: 100%;
        }
        .search-icon {
          position: absolute;
          left: 10px;
          color: #7c3aed;
          pointer-events: none;
          flex-shrink: 0;
        }
        .search-input {
          width: 100%;
          padding: 8px 30px 8px 32px;
          border-radius: 30px;
          background: rgba(255, 255, 255, 0.7);
          border: 1px solid rgba(168, 85, 247, 0.2);
          color: #1e293b;
          font-family: var(--font-sans);
          font-size: 0.82rem;
          outline: none;
          transition: var(--transition-smooth);
        }
        .search-input:focus {
          background: rgba(255, 255, 255, 0.95);
          border-color: #7c3aed;
          box-shadow: 0 0 10px rgba(124, 58, 237, 0.15);
        }
        .search-clear-btn {
          position: absolute;
          right: 10px;
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
        }
        .search-clear-btn:hover {
          color: #ef4444;
        }

        @media (max-width: 1024px) {
          .blog-layout-container {
            gap: 24px;
          }
          .blog-sidebar-container {
            flex: 0 0 220px;
            width: 220px;
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
