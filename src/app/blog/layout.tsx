"use client";

import React, { Suspense } from "react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { BlogSidebar } from "@/components/blog/BlogSidebar";
import { BlogRightSidebar } from "@/components/blog/BlogRightSidebar";
import { BlogProvider, useBlog } from "./BlogContext";
import { usePathname } from "next/navigation";

function BlogLayoutInner({ children }: { children: React.ReactNode }) {
  const { searchQuery, setSearchQuery, activeBlog, activeCategory } = useBlog();
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);

  // Auto-close mobile menu on navigation
  React.useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname, activeCategory]);

  // Per-page search config
  const searchConfig: Record<string, { title: string; placeholder: string }> = {
    "/blog": { title: "Explore Blogs", placeholder: "Search blogs, topics, healers..." },
    "/blog/faq": { title: "Search Questions", placeholder: "Type your question..." },
    "/blog/glossary": { title: "Search Terms", placeholder: "Type a term..." },
    "/blog/quora-qa": { title: "Search Answers", placeholder: "Type your question..." },
    "/blog/case-studies": { title: "Search Case Studies", placeholder: "Type keywords..." },
    "/blog/video-transcripts": { title: "Search Transcripts", placeholder: "Type keywords..." },
    "/blog/pillar": { title: "Search Pillar Blogs", placeholder: "Search pillar guides..." },
  };

  const config = searchConfig[pathname] ?? { title: "Search", placeholder: "Type keywords..." };
  const isFullWidthPage = pathname === "/blog/faq" || pathname === "/blog/glossary" || pathname.startsWith("/blog/quora-qa");

  const isVideoBlog = activeBlog && (
    (activeBlog.videos && activeBlog.videos.length > 0) ||
    activeBlog.category.toLowerCase() === "video transcripts" ||
    activeBlog.category.toLowerCase() === "video blog"
  );

  const getActivePageLabel = () => {
    if (pathname === "/blog") {
      if (activeCategory && activeCategory !== "all") {
        return `Category: ${activeCategory.split(" ").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ")}`;
      }
      return "All Blogs";
    }
    if (pathname === "/blog/faq") return "FAQ & Help";
    if (pathname === "/blog/glossary") return "Glossary";
    if (pathname === "/blog/quora-qa") return "Q&A Community";
    if (pathname === "/blog/video-transcripts") return "Video Transcripts";
    if (pathname === "/blog/pillar") return "Pillar Blog";
    if (pathname.includes("/blog/") && activeBlog) return `Article: ${activeBlog.title}`;
    return "Blog Menu";
  };

  return (
    <div className="page-col">
      <Header />

      <div className="blog-layout-container">
        {/* Sidebar on the Left */}
        <aside className={`blog-sidebar-container ${isMobileMenuOpen ? "mobile-open" : "mobile-collapsed"}`}>
          {/* Mobile Menu Toggle Bar */}
          <button 
            type="button"
            className="blog-mobile-menu-toggle"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-expanded={isMobileMenuOpen}
            aria-label="Toggle blog menu"
          >
            <div className="toggle-label-group">
              <svg viewBox="0 0 100 100" className="sidebar-lotus-icon">
                <path d="M50 25 C45 45 35 60 50 80 C65 60 55 45 50 25 Z" fill="none" stroke="#a855f7" strokeWidth="4" />
                <path d="M50 80 C35 75 25 60 20 40 C35 50 45 60 50 80 Z" fill="none" stroke="#a855f7" strokeWidth="4" />
                <path d="M50 80 C65 75 75 60 80 40 C65 50 55 60 50 80 Z" fill="none" stroke="#a855f7" strokeWidth="4" />
                <path d="M50 80 C30 80 10 70 5 55 C20 65 35 70 50 80 Z" fill="none" stroke="#a855f7" strokeWidth="4" />
                <path d="M50 80 C70 80 90 70 95 55 C80 65 65 70 50 80 Z" fill="none" stroke="#a855f7" strokeWidth="4" />
              </svg>
              <span className="toggle-label">{getActivePageLabel()}</span>
            </div>
            <div className="toggle-icon-wrapper">
              {isMobileMenuOpen ? (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              ) : (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="3" y1="12" x2="21" y2="12"></line>
                  <line x1="3" y1="6" x2="21" y2="6"></line>
                  <line x1="3" y1="18" x2="21" y2="18"></line>
                </svg>
              )}
            </div>
          </button>

          <div className="sidebar-mobile-content">
            {!isVideoBlog && (
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
            )}
            
            <BlogSidebar />
          </div>
        </aside>

        {/* Main Content on the Center */}
        <main className="blog-main-content">
          {children}
        </main>

        {/* Sidebar on the Right */}
        {!isFullWidthPage && (
          <aside className="blog-right-sidebar-container">
            <BlogRightSidebar />
          </aside>
        )}
      </div>

      <Footer />

      <style jsx global>{`
        .blog-layout-container + .footer-container {
          margin-top: 24px;
        }
        .blog-layout-container {
          max-width: 1400px;
          margin: 0 auto;
          padding: 24px 24px 24px;
          display: flex;
          gap: 32px;
          width: 100%;
          align-items: flex-start;
          box-sizing: border-box;
        }
        .blog-main-content {
          flex: 1;
          min-width: 0;
          width: 100%;
          max-width: 100%;
          box-sizing: border-box;
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

        .blog-mobile-menu-toggle {
          display: none;
        }

        @media (max-width: 1200px) {
          .blog-right-sidebar-container {
            display: none;
          }
        }

        @media (max-width: 968px) {
          .blog-layout-container {
            flex-direction: column;
            padding: 20px 16px 24px;
            gap: 20px;
          }
          .blog-sidebar-container {
            width: 100%;
            flex: none;
            position: static;
            max-height: none;
            overflow: visible;
            margin-bottom: 0px;
          }
          .blog-mobile-menu-toggle {
            display: flex;
            align-items: center;
            justify-content: space-between;
            width: 100%;
            padding: 12px 18px;
            background: linear-gradient(135deg, #faf5ff 0%, #fdf4ff 100%);
            border: 1px solid rgba(168, 85, 247, 0.15);
            border-radius: 12px;
            cursor: pointer;
            font-family: var(--font-sans);
            font-size: 0.92rem;
            font-weight: 700;
            color: #6b21a8;
            transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
            box-shadow: 0 4px 12px rgba(124, 58, 237, 0.03);
          }
          .blog-mobile-menu-toggle:hover {
            background: linear-gradient(135deg, #f5f3ff 0%, #edd8fc 100%);
            border-color: rgba(168, 85, 247, 0.3);
            box-shadow: 0 6px 16px rgba(124, 58, 237, 0.08);
          }
          .toggle-label-group {
            display: flex;
            align-items: center;
            gap: 10px;
          }
          .toggle-label-group .sidebar-lotus-icon {
            width: 20px;
            height: 20px;
            margin: 0;
          }
          .toggle-label {
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            max-width: 200px;
          }
          .toggle-icon-wrapper {
            display: flex;
            align-items: center;
            justify-content: center;
            color: #7c3aed;
          }
          .sidebar-mobile-content {
            display: none;
            flex-direction: column;
            gap: 16px;
            margin-top: 12px;
            padding: 16px;
            background: #ffffff;
            border: 1px solid rgba(168, 85, 247, 0.1);
            border-radius: 16px;
            box-shadow: 0 4px 20px rgba(124, 58, 237, 0.03);
          }
          .blog-sidebar-container.mobile-open .sidebar-mobile-content {
            display: flex;
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
