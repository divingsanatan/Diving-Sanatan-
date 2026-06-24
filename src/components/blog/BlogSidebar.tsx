"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

interface SidebarItem {
  name: string;
  path: string;
  description: string;
  icon: React.ReactNode;
}

export const BlogSidebar: React.FC = () => {
  const pathname = usePathname();

  const items: SidebarItem[] = [
    {
      name: "Blog Articles",
      path: "/blog",
      description: "Latest writings & spiritual insights",
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
          <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
        </svg>
      ),
    },
    {
      name: "FAQ Pages",
      path: "/blog/faq",
      description: "Quick answers to common questions",
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
          <line x1="12" y1="17" x2="12.01" y2="17" />
        </svg>
      ),
    },
    {
      name: "Glossary",
      path: "/blog/glossary",
      description: "A-Z index of metaphysical terms",
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="4" y1="9" x2="20" y2="9" />
          <line x1="4" y1="15" x2="20" y2="15" />
          <line x1="10" y1="3" x2="8" y2="21" />
          <line x1="16" y1="3" x2="14" y2="21" />
        </svg>
      ),
    },
    {
      name: "Video Transcripts",
      path: "/blog/video-transcripts",
      description: "Media playback & time-synced logs",
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polygon points="23 7 16 12 23 17 23 7" />
          <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
        </svg>
      ),
    },
    {
      name: "Case Studies",
      path: "/blog/case-studies",
      description: "Before/After treatment analysis",
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
        </svg>
      ),
    },
    {
      name: "Comparison Pages",
      path: "/blog/comparison",
      description: "Modality comparisons & choices",
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="18" y1="20" x2="18" y2="10" />
          <line x1="12" y1="20" x2="12" y2="4" />
          <line x1="6" y1="20" x2="6" y2="14" />
        </svg>
      ),
    },
    {
      name: "Quora-Style Q&A",
      path: "/blog/quora-qa",
      description: "Expert answers to community FAQs",
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
      ),
    },
  ];

  const checkActive = (itemPath: string) => {
    if (itemPath === "/blog") {
      // Exactly matches /blog or matches detailed post URL (except other sections)
      return pathname === "/blog" || (pathname.startsWith("/blog/") && !items.some(i => i.path !== "/blog" && pathname.startsWith(i.path)));
    }
    return pathname.startsWith(itemPath);
  };

  return (
    <div className="blog-sidebar glass-panel">
      <h3 className="sidebar-title">Portal Navigation</h3>
      <p className="sidebar-desc">Explore different healing modules & resources</p>
      
      <div className="sidebar-menu">
        {items.map((item) => {
          const isActive = checkActive(item.path);
          return (
            <Link key={item.path} href={item.path} className={`sidebar-item ${isActive ? "active" : ""}`}>
              <div className="item-text-container">
                <span className="item-name">{item.name}</span>
              </div>
            </Link>
          );
        })}
      </div>

      <div className="sidebar-footer">
        <span className="footer-glow-text">Diving Sanatan Wellness</span>
      </div>

      <style jsx>{`
        .blog-sidebar {
          padding: 12px;
          border-radius: 12px;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .sidebar-title {
          font-size: 1.1rem;
          color: #4c1d95;
          margin-bottom: 2px;
        }
        .sidebar-desc {
          font-size: 0.72rem;
          color: hsl(var(--text-muted));
          line-height: 1.3;
        }
        .sidebar-menu {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        .sidebar-item {
          display: flex;
          align-items: center;
          padding: 6px 10px;
          border-radius: 8px;
          border: 1px solid transparent;
          transition: var(--transition-fast);
          cursor: pointer;
        }
        .sidebar-item:hover {
          background: rgba(168, 85, 247, 0.04);
          border-color: rgba(168, 85, 247, 0.15);
          transform: translateX(3px);
        }
        .sidebar-item.active {
          background: linear-gradient(135deg, rgba(251, 207, 232, 0.2) 0%, rgba(233, 213, 255, 0.2) 100%);
          border-color: rgba(168, 85, 247, 0.35);
          box-shadow: 0 4px 15px rgba(168, 85, 247, 0.05);
        }
        .item-text-container {
          display: flex;
          flex-direction: column;
          gap: 1px;
        }
        .item-name {
          font-size: 0.8rem;
          font-weight: 600;
          color: #4c1d95;
          font-family: var(--font-serif);
        }
        .sidebar-item.active .item-name {
          color: #6d28d9;
        }
        .sidebar-footer {
          margin-top: 4px;
          padding-top: 10px;
          border-top: 1px solid rgba(0, 0, 0, 0.05);
          text-align: center;
        }
        .footer-glow-text {
          font-family: var(--font-serif);
          font-size: 0.65rem;
          font-weight: 700;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: #9f1239;
          opacity: 0.8;
        }
      `}</style>
    </div>
  );
};
