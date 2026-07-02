"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

export default function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const router = useRouter();
  const pathname = usePathname();
  const [authenticated, setAuthenticated] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const isAuth = window.sessionStorage.getItem("divingsanatan_admin_auth");
    if (isAuth === "true") {
      setAuthenticated(true);
      setChecking(false);
    } else {
      setAuthenticated(false);
      setChecking(false);
      // Redirect to /admin/login if trying to access any admin dashboard page
      if (pathname !== "/admin/login") {
        router.push("/admin/login");
      }
    }
  }, [pathname, router]);

  const handleLogout = () => {
    window.sessionStorage.removeItem("divingsanatan_admin_auth");
    setAuthenticated(false);
    router.push("/admin/login");
  };

  // If the path is /admin/login, we do not want to show the sidebar layout wrapper
  if (pathname === "/admin/login") {
    return <>{children}</>;
  }

  if (checking) {
    return (
      <div className="admin-auth-checking">
        <p>Verifying credentials...</p>
      </div>
    );
  }

  if (!authenticated) {
    return null; // Redirecting is occurring
  }

  return (
    <div className="admin-layout-wrapper">
      {/* Sidebar Navigation */}
      <aside className="admin-sidebar">
        <div className="sidebar-brand">
          <svg viewBox="0 0 50 50" width="28" height="28" fill="#db2777">
            <path d="M25 5C25 5 18 18 12 22C10 23.5 7 24 5 24C3 24 2.5 25 3 26C4 28 10 29 15 28C21 27 24 35 25 45C26 35 29 27 35 28C40 29 46 28 47 26C47.5 25 47 24 45 24C43 24 40 23.5 38 22C32 18 25 5 25 5Z" />
          </svg>
          <span className="brand-label">Admin Portal</span>
        </div>
        
        <nav className="sidebar-nav">
          <Link href="/admin" className={`sidebar-link ${pathname === "/admin" ? "active" : ""}`}>Overview</Link>
          <Link href="/admin/bookings" className={`sidebar-link ${pathname === "/admin/bookings" ? "active" : ""}`}>Bookings</Link>
          <Link href="/admin/services" className={`sidebar-link ${pathname === "/admin/services" ? "active" : ""}`}>Services</Link>
          <Link href="/admin/practitioners" className={`sidebar-link ${pathname === "/admin/practitioners" ? "active" : ""}`}>Practitioners</Link>
          <Link href="/admin/categories" className={`sidebar-link ${pathname === "/admin/categories" ? "active" : ""}`}>Categories</Link>
          <Link href="/admin/keywords" className={`sidebar-link ${pathname === "/admin/keywords" ? "active" : ""}`}>Keywords</Link>
          <Link href="/admin/quiz-questions" className={`sidebar-link ${pathname === "/admin/quiz-questions" ? "active" : ""}`}>Quiz Questions</Link>
          <Link href="/admin/quora-qa" className={`sidebar-link ${pathname === "/admin/quora-qa" ? "active" : ""}`}>Q&A Board</Link>
          <Link href="/admin/blogs" className={`sidebar-link ${pathname === "/admin/blogs" ? "active" : ""}`}>Blogs</Link>
          <Link href="/admin/glossary" className={`sidebar-link ${pathname === "/admin/glossary" ? "active" : ""}`}>Glossary</Link>
          <Link href="/admin/comparisons" className={`sidebar-link ${pathname === "/admin/comparisons" ? "active" : ""}`}>Comparisons</Link>
          <Link href="/admin/leads" className={`sidebar-link ${pathname === "/admin/leads" ? "active" : ""}`}>Leads Profiles</Link>
          <Link href="/" className="sidebar-link">Public Site</Link>
        </nav>
        
        <div className="sidebar-footer">
          <button onClick={handleLogout} className="logout-btn">
            🔒 Lock Panel
          </button>
        </div>
      </aside>

      {/* Main Panel */}
      <main className="admin-main-panel">
        {children}
      </main>

      <style jsx>{`
        .admin-layout-wrapper {
          display: flex;
          min-height: 100vh;
        }
        .admin-sidebar {
          width: 250px;
          background: #FAF9F6;
          border-right: 1.5px solid var(--border-glass);
          padding: 32px 24px;
          display: flex;
          flex-direction: column;
          gap: 40px;
          flex-shrink: 0;
        }
        .sidebar-brand {
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .brand-label {
          font-family: var(--font-serif);
          font-weight: 700;
          color: #4c1d95;
          font-size: 1.15rem;
          letter-spacing: 0.05em;
        }
        .sidebar-nav {
          display: flex;
          flex-direction: column;
          gap: 8px;
          flex: 1;
        }
        .sidebar-link {
          padding: 12px 16px;
          border-radius: 8px;
          color: hsl(var(--text-muted));
          text-decoration: none;
          font-size: 0.9rem;
          font-weight: 600;
          transition: var(--transition-fast);
        }
        .sidebar-link:hover, .sidebar-link.active {
          background: rgba(168, 85, 247, 0.05);
          color: #7c3aed;
        }
        .sidebar-footer {
          border-top: 1px solid rgba(0,0,0,0.05);
          padding-top: 20px;
        }
        .logout-btn {
          width: 100%;
          background: transparent;
          border: 1px solid rgba(239, 68, 68, 0.25);
          color: #ef4444;
          padding: 10px;
          border-radius: 8px;
          font-size: 0.8rem;
          font-weight: 600;
          cursor: pointer;
          transition: var(--transition-fast);
        }
        .logout-btn:hover {
          background: rgba(239, 68, 68, 0.08);
          border-color: #ef4444;
        }
        .admin-main-panel {
          flex: 1;
          background: #ffffff;
          padding: 40px;
          overflow-y: auto;
        }
        @media (max-width: 768px) {
          .admin-layout-wrapper {
            flex-direction: column;
          }
          .admin-sidebar {
            width: 100%;
            border-right: none;
            border-bottom: 1.5px solid var(--border-glass);
            flex-direction: row;
            justify-content: space-between;
            align-items: center;
            padding: 16px 24px;
            gap: 20px;
          }
          .sidebar-nav {
            flex-direction: row;
            flex: 0;
            gap: 12px;
          }
          .sidebar-footer {
            border-top: none;
            padding-top: 0;
          }
          .admin-main-panel {
            padding: 24px;
          }
        }
      `}</style>
    </div>
  );
}
