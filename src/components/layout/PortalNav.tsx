"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const portalLinks = [
  {
    name: "Blog Articles",
    path: "/blog",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
        <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
      </svg>
    ),
  },
  {
    name: "FAQ Pages",
    path: "/blog/faq",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
        <line x1="12" y1="17" x2="12.01" y2="17" />
      </svg>
    ),
  },
  {
    name: "Glossary",
    path: "/blog/glossary",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
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
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="23 7 16 12 23 17 23 7" />
        <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
      </svg>
    ),
  },
  {
    name: "Case Studies",
    path: "/blog/case-studies",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
      </svg>
    ),
  },
  {
    name: "Comparison Pages",
    path: "/blog/comparison",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="18" y1="20" x2="18" y2="10" />
        <line x1="12" y1="20" x2="12" y2="4" />
        <line x1="6" y1="20" x2="6" y2="14" />
      </svg>
    ),
  },
  {
    name: "Quora-Style Q&A",
    path: "/blog/quora-qa",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
      </svg>
    ),
  },
];

export const PortalNav: React.FC = () => {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  const isActive = (itemPath: string) => {
    if (itemPath === "/blog") {
      return (
        pathname === "/blog" ||
        (pathname.startsWith("/blog/") &&
          !portalLinks.some(
            (l) => l.path !== "/blog" && pathname.startsWith(l.path)
          ))
      );
    }
    return pathname.startsWith(itemPath);
  };

  return (
    <>
      {/* Floating trigger pill */}
      <button
        id="portal-nav-trigger"
        className={`portal-nav-trigger ${open ? "open" : ""}`}
        onClick={() => setOpen((v) => !v)}
        aria-label="Toggle Portal Navigation"
        title="Portal Navigation"
      >
        <span className="trigger-icon">
          {open ? (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          ) : (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="7" height="7" rx="1" />
              <rect x="14" y="3" width="7" height="7" rx="1" />
              <rect x="3" y="14" width="7" height="7" rx="1" />
              <rect x="14" y="14" width="7" height="7" rx="1" />
            </svg>
          )}
        </span>
        <span className="trigger-label">Portal</span>
      </button>

      {/* Backdrop */}
      {open && (
        <div
          className="portal-nav-backdrop"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Panel */}
      <div className={`portal-nav-panel ${open ? "panel-open" : ""}`}>
        {/* Header */}
        <div className="panel-header">
          <div className="panel-header-text">
            <h3 className="panel-title">Portal Navigation</h3>
            <p className="panel-subtitle">
              Explore different healing modules &amp; resources
            </p>
          </div>
          <button
            className="panel-close-btn"
            onClick={() => setOpen(false)}
            aria-label="Close panel"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Nav links */}
        <nav className="panel-nav">
          {portalLinks.map((link) => (
            <Link
              key={link.path}
              href={link.path}
              className={`panel-link ${isActive(link.path) ? "active" : ""}`}
              onClick={() => setOpen(false)}
            >
              <span className="panel-link-icon">{link.icon}</span>
              <span className="panel-link-name">{link.name}</span>
              {isActive(link.path) && <span className="active-dot" />}
            </Link>
          ))}
        </nav>

        {/* Footer brand */}
        <div className="panel-footer">
          <span className="panel-brand">Diving Sanatan Wellness</span>
        </div>
      </div>

      <style jsx>{`
        /* ── Trigger pill ── */
        .portal-nav-trigger {
          position: fixed;
          bottom: 32px;
          right: 28px;
          z-index: 900;
          display: flex;
          align-items: center;
          gap: 7px;
          padding: 10px 16px 10px 12px;
          border-radius: 50px;
          border: 1.5px solid rgba(168, 85, 247, 0.35);
          background: rgba(255, 255, 255, 0.82);
          backdrop-filter: blur(14px);
          -webkit-backdrop-filter: blur(14px);
          box-shadow:
            0 8px 32px rgba(124, 58, 237, 0.18),
            0 2px 8px rgba(0, 0, 0, 0.06);
          cursor: pointer;
          transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
          color: #7c3aed;
        }
        .portal-nav-trigger:hover {
          transform: translateY(-3px);
          box-shadow:
            0 12px 40px rgba(124, 58, 237, 0.25),
            0 4px 12px rgba(0, 0, 0, 0.08);
          border-color: rgba(168, 85, 247, 0.55);
          background: rgba(255, 255, 255, 0.95);
        }
        .portal-nav-trigger.open {
          background: #7c3aed;
          border-color: #7c3aed;
          color: #fff;
          box-shadow: 0 8px 32px rgba(124, 58, 237, 0.35);
        }
        .trigger-icon {
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .trigger-label {
          font-family: var(--font-serif);
          font-size: 0.8rem;
          font-weight: 700;
          letter-spacing: 0.06em;
          text-transform: uppercase;
        }

        /* ── Backdrop ── */
        .portal-nav-backdrop {
          position: fixed;
          inset: 0;
          z-index: 890;
          background: rgba(15, 12, 30, 0.2);
          backdrop-filter: blur(2px);
          animation: fadeIn 0.2s ease;
        }

        /* ── Panel ── */
        .portal-nav-panel {
          position: fixed;
          bottom: 90px;
          right: 28px;
          z-index: 895;
          width: 268px;
          border-radius: 20px;
          background: rgba(255, 255, 255, 0.92);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border: 1.5px solid rgba(168, 85, 247, 0.2);
          box-shadow:
            0 20px 60px rgba(124, 58, 237, 0.18),
            0 4px 16px rgba(0, 0, 0, 0.06);
          display: flex;
          flex-direction: column;
          overflow: hidden;
          /* Hidden by default */
          opacity: 0;
          transform: translateY(12px) scale(0.97);
          pointer-events: none;
          transition: opacity 0.25s cubic-bezier(0.16, 1, 0.3, 1),
            transform 0.25s cubic-bezier(0.16, 1, 0.3, 1);
          transform-origin: bottom right;
        }
        .portal-nav-panel.panel-open {
          opacity: 1;
          transform: translateY(0) scale(1);
          pointer-events: auto;
        }

        /* Panel header */
        .panel-header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          padding: 16px 16px 12px;
          border-bottom: 1px solid rgba(168, 85, 247, 0.1);
          background: linear-gradient(
            135deg,
            rgba(243, 232, 255, 0.6) 0%,
            rgba(255, 255, 255, 0.4) 100%
          );
        }
        .panel-header-text {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }
        .panel-title {
          font-family: var(--font-serif);
          font-size: 1rem;
          font-weight: 700;
          color: #4c1d95;
          margin: 0;
        }
        .panel-subtitle {
          font-size: 0.68rem;
          color: hsl(var(--text-muted));
          line-height: 1.3;
          margin: 0;
          max-width: 180px;
        }
        .panel-close-btn {
          background: rgba(0, 0, 0, 0.04);
          border: 1px solid rgba(0, 0, 0, 0.06);
          border-radius: 8px;
          width: 28px;
          height: 28px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          color: #64748b;
          transition: all 0.15s ease;
          flex-shrink: 0;
        }
        .panel-close-btn:hover {
          background: rgba(239, 68, 68, 0.08);
          border-color: rgba(239, 68, 68, 0.2);
          color: #ef4444;
        }

        /* Nav links */
        .panel-nav {
          display: flex;
          flex-direction: column;
          padding: 10px 10px;
          gap: 2px;
          max-height: 340px;
          overflow-y: auto;
          scrollbar-width: none;
        }
        .panel-nav::-webkit-scrollbar {
          display: none;
        }
        .panel-link {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 9px 12px;
          border-radius: 10px;
          border: 1px solid transparent;
          text-decoration: none;
          transition: all 0.18s cubic-bezier(0.16, 1, 0.3, 1);
          position: relative;
        }
        .panel-link:hover {
          background: rgba(168, 85, 247, 0.06);
          border-color: rgba(168, 85, 247, 0.15);
          transform: translateX(3px);
        }
        .panel-link.active {
          background: linear-gradient(
            135deg,
            rgba(251, 207, 232, 0.25) 0%,
            rgba(233, 213, 255, 0.25) 100%
          );
          border-color: rgba(168, 85, 247, 0.3);
          box-shadow: 0 2px 10px rgba(168, 85, 247, 0.08);
        }
        .panel-link-icon {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 28px;
          height: 28px;
          border-radius: 8px;
          background: rgba(168, 85, 247, 0.07);
          color: #7c3aed;
          flex-shrink: 0;
          transition: background 0.18s ease;
        }
        .panel-link:hover .panel-link-icon {
          background: rgba(168, 85, 247, 0.14);
        }
        .panel-link.active .panel-link-icon {
          background: rgba(168, 85, 247, 0.15);
          color: #6d28d9;
        }
        .panel-link-name {
          font-family: var(--font-serif);
          font-size: 0.82rem;
          font-weight: 600;
          color: #4c1d95;
          flex: 1;
        }
        .active-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: #7c3aed;
          box-shadow: 0 0 6px rgba(124, 58, 237, 0.5);
          flex-shrink: 0;
        }

        /* Panel footer */
        .panel-footer {
          padding: 10px 16px 14px;
          border-top: 1px solid rgba(0, 0, 0, 0.05);
          text-align: center;
          background: rgba(248, 245, 255, 0.5);
        }
        .panel-brand {
          font-family: var(--font-serif);
          font-size: 0.62rem;
          font-weight: 700;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: #9f1239;
          opacity: 0.85;
        }

        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        /* Mobile: wider panel, anchored lower */
        @media (max-width: 640px) {
          .portal-nav-panel {
            width: calc(100vw - 40px);
            right: 20px;
            bottom: 80px;
          }
          .portal-nav-trigger {
            right: 20px;
            bottom: 24px;
          }
        }
      `}</style>
    </>
  );
};
