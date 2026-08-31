"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Calendar,
  Briefcase,
  Users,
  Grid,
  Key,
  HelpCircle,
  MessageSquare,
  FileText,
  BookOpen,
  BarChart2,
  UserCheck,
  Globe,
  LogOut,
  Menu,
  Radar,
  Compass,
  Video
} from "lucide-react";
import "./admin-lte.css";

export default function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const router = useRouter();
  const pathname = usePathname();
  const [authenticated, setAuthenticated] = useState(false);
  const [checking, setChecking] = useState(true);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [adminUser, setAdminUser] = useState<any>(null);

  useEffect(() => {
    const stored = window.localStorage.getItem("admin_sidebar_collapsed");
    if (stored === "true") {
      setSidebarCollapsed(true);
    }
  }, []);

  const toggleSidebar = () => {
    if (window.innerWidth >= 992) {
      const nextState = !sidebarCollapsed;
      setSidebarCollapsed(nextState);
      window.localStorage.setItem("admin_sidebar_collapsed", String(nextState));
    } else {
      setSidebarOpen(!sidebarOpen);
    }
  };

  useEffect(() => {
    if (pathname === "/admin/login") {
      setChecking(false);
      return;
    }

    setChecking(true);
    let isAuthorized = false;
    let currentUser: any = null;

    // 1. Check admin specific session in sessionStorage
    const isAdminAuth = window.sessionStorage.getItem("divingsanatan_admin_auth");
    const adminUserStr = window.sessionStorage.getItem("divingsanatan_admin_user");
    if (adminUserStr) {
      try {
        currentUser = JSON.parse(adminUserStr);
      } catch (e) {}
    }

    if (isAdminAuth === "true") {
      isAuthorized = true;
    }

    // 2. Check general user session from localStorage
    const userSessionStr = window.localStorage.getItem("divingsanatan_user_session");
    if (userSessionStr) {
      try {
        const userObj = JSON.parse(userSessionStr);
        if (["admin", "super_admin", "guru", "subadmin"].includes(userObj?.role)) {
          isAuthorized = true;
          if (!currentUser) {
            currentUser = userObj;
          }
        }
      } catch (e) {}
    }

    if (isAuthorized) {
      setAdminUser(currentUser);
      setAuthenticated(true);
      setChecking(false);
    } else {
      setAdminUser(null);
      setAuthenticated(false);
      setChecking(false);
      router.push("/admin/login");
    }
  }, [pathname, router]);

  const handleLogout = () => {
    window.sessionStorage.removeItem("divingsanatan_admin_auth");
    window.sessionStorage.removeItem("divingsanatan_admin_user");
    setAuthenticated(false);
    setAdminUser(null);
    router.push("/admin/login");
  };

  const getSectionName = () => {
    switch (pathname) {
      case "/admin":
        return "Dashboard Overview";
      case "/admin/bookings":
        return "Bookings Scheduler";
      case "/admin/services":
        return "Services & Offerings";
      case "/admin/practitioners":
        return "Practitioners Registry";
      case "/admin/categories":
        return "Healing Disciplines";
      case "/admin/keywords":
        return "SEO Keywords";
      case "/admin/quiz-questions":
        return "Diagnostic Quiz Bank";
      case "/admin/quora-qa":
        return "Public Q&A Board";
      case "/admin/blogs":
        return "Publication & Blogs";
      case "/admin/video-blogs":
        return "Video Blogs & Transcripts";
      case "/admin/pillar":
        return "Pillar Guides Manager";
      case "/admin/glossary":
        return "Sanskrit Glossary";
      case "/admin/faq":
        return "FAQs Manager";
      case "/admin/comparisons":
        return "Comparisons Board";
      case "/admin/leads":
        return "Customer Leads Profiles";
      case "/admin/seo-command":
        return "SEO Command Center";
      default:
        return "Admin Portal";
    }
  };

  const getBreadcrumb = () => {
    switch (pathname) {
      case "/admin":
        return null;
      case "/admin/bookings":
        return "Bookings";
      case "/admin/services":
        return "Services";
      case "/admin/practitioners":
        return "Practitioners";
      case "/admin/categories":
        return "Categories";
      case "/admin/keywords":
        return "Keywords";
      case "/admin/quiz-questions":
        return "Quiz Questions";
      case "/admin/quora-qa":
        return "Q&A Board";
      case "/admin/blogs":
        return "Blogs";
      case "/admin/video-blogs":
        return "Video Blogs";
      case "/admin/pillar":
        return "Pillar Guides";
      case "/admin/glossary":
        return "Glossary";
      case "/admin/faq":
        return "FAQs";
      case "/admin/comparisons":
        return "Comparisons";
      case "/admin/leads":
        return "Leads";
      case "/admin/seo-command":
        return "SEO Command Center";
      default:
        return null;
    }
  };

  // If the path is /admin/login, we do not want to show the sidebar layout wrapper
  if (pathname === "/admin/login") {
    return <>{children}</>;
  }

  if (checking) {
    return (
      <div className="admin-auth-checking" style={{ padding: "40px", textAlign: "center", fontFamily: "sans-serif" }}>
        <p>Verifying credentials...</p>
      </div>
    );
  }

  if (!authenticated) {
    return null; // Redirecting is occurring
  }

  const activeBreadcrumb = getBreadcrumb();

  return (
    <div className={`admin-lte-theme admin-layout-wrapper ${sidebarCollapsed ? "sidebar-collapsed" : ""} ${sidebarOpen ? "sidebar-open" : ""}`}>
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div
          className="admin-sidebar-overlay"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar Navigation */}
      <aside className="admin-sidebar">
        <div className="sidebar-brand">
          <Globe size={22} color="#007bff" />
          <span className="brand-label">Sanatan Admin</span>
        </div>

        <nav className="sidebar-nav">
          {/* Section: MONITOR */}
          <div className="sidebar-nav-header">Dashboard Monitor</div>
          <Link
            href="/admin"
            title="Overview"
            className={`sidebar-link ${pathname === "/admin" ? "active" : ""}`}
            onClick={() => setSidebarOpen(false)}
          >
            <LayoutDashboard size={16} />
            <span>Overview</span>
          </Link>
          <Link
            href="/admin/bookings"
            title="Bookings"
            className={`sidebar-link ${pathname === "/admin/bookings" ? "active" : ""}`}
            onClick={() => setSidebarOpen(false)}
          >
            <Calendar size={16} />
            <span>Bookings</span>
          </Link>
          <Link
            href="/admin/leads"
            title="Leads Profiles"
            className={`sidebar-link ${pathname === "/admin/leads" ? "active" : ""}`}
            onClick={() => setSidebarOpen(false)}
          >
            <UserCheck size={16} />
            <span>Leads Profiles</span>
          </Link>

          {/* Section: CORE DIRECTORIES */}
          <div className="sidebar-nav-header">Core Directories</div>
          <Link
            href="/admin/services"
            title="Services"
            className={`sidebar-link ${pathname === "/admin/services" ? "active" : ""}`}
            onClick={() => setSidebarOpen(false)}
          >
            <Briefcase size={16} />
            <span>Services</span>
          </Link>
          <Link
            href="/admin/quiz-questions"
            title="Quiz Questions"
            className={`sidebar-link ${pathname === "/admin/quiz-questions" ? "active" : ""}`}
            onClick={() => setSidebarOpen(false)}
          >
            <HelpCircle size={16} />
            <span>Quiz Questions</span>
          </Link>
          <Link
            href="/admin/practitioners"
            title="Practitioners"
            className={`sidebar-link ${pathname === "/admin/practitioners" ? "active" : ""}`}
            onClick={() => setSidebarOpen(false)}
          >
            <Users size={16} />
            <span>Practitioners</span>
          </Link>
          <Link
            href="/admin/categories"
            title="Categories"
            className={`sidebar-link ${pathname === "/admin/categories" ? "active" : ""}`}
            onClick={() => setSidebarOpen(false)}
          >
            <Grid size={16} />
            <span>Categories</span>
          </Link>

          {/* Section: CONTENT & DIAGNOSTICS */}
          <div className="sidebar-nav-header">Content & Diagnostics</div>
          <Link
            href="/admin/blogs"
            title="Blogs"
            className={`sidebar-link ${pathname === "/admin/blogs" ? "active" : ""}`}
            onClick={() => setSidebarOpen(false)}
          >
            <FileText size={16} />
            <span>Blogs</span>
          </Link>
          <Link
            href="/admin/video-blogs"
            title="Video Blogs"
            className={`sidebar-link ${pathname === "/admin/video-blogs" ? "active" : ""}`}
            onClick={() => setSidebarOpen(false)}
          >
            <Video size={16} />
            <span>Video Blogs</span>
          </Link>
          <Link
            href="/admin/pillar"
            title="Pillar Guides"
            className={`sidebar-link ${pathname === "/admin/pillar" ? "active" : ""}`}
            onClick={() => setSidebarOpen(false)}
          >
            <Compass size={16} />
            <span>Pillar Guides</span>
          </Link>
          <Link
            href="/admin/quora-qa"
            title="Q&A Board"
            className={`sidebar-link ${pathname === "/admin/quora-qa" ? "active" : ""}`}
            onClick={() => setSidebarOpen(false)}
          >
            <MessageSquare size={16} />
            <span>Q&A Board</span>
          </Link>
          <Link
            href="/admin/glossary"
            title="Glossary"
            className={`sidebar-link ${pathname === "/admin/glossary" ? "active" : ""}`}
            onClick={() => setSidebarOpen(false)}
          >
            <BookOpen size={16} />
            <span>Glossary</span>
          </Link>
          <Link
            href="/admin/faq"
            title="FAQs"
            className={`sidebar-link ${pathname === "/admin/faq" ? "active" : ""}`}
            onClick={() => setSidebarOpen(false)}
          >
            <HelpCircle size={16} />
            <span>FAQs</span>
          </Link>
          <Link
            href="/admin/comparisons"
            title="Comparisons"
            className={`sidebar-link ${pathname === "/admin/comparisons" ? "active" : ""}`}
            onClick={() => setSidebarOpen(false)}
          >
            <BarChart2 size={16} />
            <span>Comparisons</span>
          </Link>

          {/* Section: SEO & SETTINGS */}
          <div className="sidebar-nav-header">SEO & Settings</div>
          <Link
            href="/admin/seo-command"
            title="SEO Command Center"
            className={`sidebar-link ${pathname === "/admin/seo-command" ? "active" : ""}`}
            onClick={() => setSidebarOpen(false)}
          >
            <Radar size={16} />
            <span>SEO Command Center</span>
          </Link>
          <Link
            href="/admin/keywords"
            title="Keywords"
            className={`sidebar-link ${pathname === "/admin/keywords" ? "active" : ""}`}
            onClick={() => setSidebarOpen(false)}
          >
            <Key size={16} />
            <span>Keywords</span>
          </Link>

          <div style={{ borderTop: "1px solid #4b545c", margin: "10px 0" }}></div>

          <Link
            href="/"
            title="Public Site"
            className="sidebar-link"
          >
            <Globe size={16} />
            <span>Public Site</span>
          </Link>
        </nav>

        <div className="sidebar-footer">
          <button onClick={handleLogout} className="logout-btn">
            <LogOut size={14} style={{ marginRight: "6px", display: "inline-block", verticalAlign: "middle" }} />
            <span>Lock Panel</span>
          </button>
        </div>
      </aside>

      {/* Right Column: Navbar + Main Content */}
      <div className="admin-body-container">
        {/* Top Navbar */}
        <header className="admin-top-navbar">
          <div className="admin-navbar-left">
            <button className="navbar-toggle-btn" onClick={toggleSidebar} aria-label="Toggle Sidebar">
              <Menu size={18} />
            </button>
            <h4 className="navbar-section-title">{getSectionName()}</h4>
          </div>
          <div className="admin-navbar-right">
            <span style={{ fontSize: "0.85rem", color: "#6c757d" }}>
              Logged in as {adminUser?.name || adminUser?.email || "Admin User"} {adminUser?.role ? `(${adminUser.role})` : ""}
            </span>
          </div>
        </header>

        {/* Content Breadcrumbs */}
        <div className="admin-content-header">
          <div style={{ fontSize: "1.2rem", fontWeight: "600" }}>{getSectionName()}</div>
          <ul className="admin-breadcrumbs">
            <li><Link href="/admin">Home</Link></li>
            {activeBreadcrumb && <li>{activeBreadcrumb}</li>}
          </ul>
        </div>

        {/* Main Panel */}
        <main className="admin-main-panel">
          {children}
        </main>
      </div>
    </div>
  );
}
