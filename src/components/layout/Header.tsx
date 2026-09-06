"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Logo } from "./Logo";

export const Header: React.FC = () => {
  const pathname = usePathname();
  const [cartCount, setCartCount] = useState(0);
  const [isAdmin, setIsAdmin] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    // Keep check on local selections, admin auth, and user session states
    const checkState = () => {
      try {
        const item = window.localStorage.getItem("divingsanatan_selections");
        if (item) {
          const parsed = JSON.parse(item);
          setCartCount(parsed.length || 0);
        } else {
          setCartCount(0);
        }
      } catch (err) {
        setCartCount(0);
      }

      try {
        const auth = window.sessionStorage.getItem("divingsanatan_admin_auth");
        setIsAdmin(auth === "true");
      } catch (err) {
        setIsAdmin(false);
      }

      try {
        const session = window.localStorage.getItem("divingsanatan_user_session");
        if (session) {
          setUser(JSON.parse(session));
        } else {
          setUser(null);
        }
      } catch (err) {
        setUser(null);
      }
    };

    checkState();
    // Poll storage slightly for state updates
    const interval = setInterval(checkState, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileMenuOpen]);

  const isHomeActive = pathname === "/";
  const isServicesActive = pathname === "/services" || pathname.startsWith("/services/");
  const isAboutActive = pathname === "/about" || pathname.startsWith("/about/");
  const isBlogActive = pathname === "/blog" || pathname.startsWith("/blog");

  return (
    <>
      <header className="header-nav">
        <div className="nav-container">
          {/* Stylized Brand Logo */}
          <Link href="/" className="logo-brand" onClick={() => setMobileMenuOpen(false)}>
            <Logo size={36} />
            <span className="brand-text">DIVING SANATAN</span>
          </Link>

          {/* Mobile/Tablet active section badge */}
          <div className="mobile-active-section-pill">
            <span className="mobile-pill-dot"></span>
            <span className="mobile-pill-text">
              {isHomeActive ? "Home" : isServicesActive ? "Services" : isAboutActive ? "About" : isBlogActive ? "Blog" : "Menu"}
            </span>
          </div>

          {/* Nav Links */}
          <nav className="nav-menu">
            <Link href="/" className={`nav-item-link ${isHomeActive ? "active" : ""}`}>
              <span>Home</span>
            </Link>
            <Link href="/services" className={`nav-item-link ${isServicesActive ? "active" : ""}`}>
              <span>Services</span>
            </Link>
            <Link href="/about" className={`nav-item-link ${isAboutActive ? "active" : ""}`}>
              <span>About</span>
            </Link>
            <Link href="/blog" className={`nav-item-link ${isBlogActive ? "active" : ""}`}>
              <span>Blog</span>
            </Link>
          </nav>

          {/* CTA Buttons */}
          <div className="nav-actions">
            {user ? (
              <Link href="/profile" className="user-profile-btn" onClick={() => setMobileMenuOpen(false)} aria-label="User Profile">
                <div className="user-avatar-wrapper">
                  {user.avatarUrl ? (
                    <img src={user.avatarUrl} alt={user.name} className="user-avatar-img" />
                  ) : (
                    <div className="user-avatar-initials">
                      {user.name ? user.name.charAt(0).toUpperCase() : "U"}
                    </div>
                  )}
                  <span className="user-online-dot"></span>
                </div>
                <span className="user-name-text">{user.name}</span>
                <svg className="user-chevron-down" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </Link>
            ) : (
              <Link href="/profile" className="user-profile-btn login" onClick={() => setMobileMenuOpen(false)}>
                Sign In
              </Link>
            )}

            {/* Mobile Menu Toggle Hamburger Button */}
            <button
              className={`mobile-menu-toggle-btn ${mobileMenuOpen ? "active" : ""}`}
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle mobile menu"
            >
              <span className="hamburger-bar"></span>
              <span className="hamburger-bar"></span>
              <span className="hamburger-bar"></span>
            </button>
          </div>
        </div>

        {/* Sliding Drawer for Mobile Nav */}
        <div className={`mobile-nav-drawer ${mobileMenuOpen ? "open" : ""}`}>
          <nav className="mobile-drawer-menu">
            <Link href="/" className={`mobile-drawer-link ${isHomeActive ? "active" : ""}`} onClick={() => setMobileMenuOpen(false)}>
              <span className="drawer-link-inner">
                <span>Home</span>
                {isHomeActive && <span className="drawer-active-tag">Active</span>}
              </span>
            </Link>
            <Link href="/services" className={`mobile-drawer-link ${isServicesActive ? "active" : ""}`} onClick={() => setMobileMenuOpen(false)}>
              <span className="drawer-link-inner">
                <span>Services</span>
                {isServicesActive && <span className="drawer-active-tag">Active</span>}
              </span>
            </Link>
            <Link href="/about" className={`mobile-drawer-link ${isAboutActive ? "active" : ""}`} onClick={() => setMobileMenuOpen(false)}>
              <span className="drawer-link-inner">
                <span>About</span>
                {isAboutActive && <span className="drawer-active-tag">Active</span>}
              </span>
            </Link>
            <Link href="/blog" className={`mobile-drawer-link ${isBlogActive ? "active" : ""}`} onClick={() => setMobileMenuOpen(false)}>
              <span className="drawer-link-inner">
                <span>Blog</span>
                {isBlogActive && <span className="drawer-active-tag">Active</span>}
              </span>
            </Link>
          </nav>
        </div>

        {/* Drawer Backdrop Overlay */}
        {mobileMenuOpen && (
          <div className="mobile-drawer-backdrop" onClick={() => setMobileMenuOpen(false)} />
        )}
      </header>

      {/* Spacer to push content below fixed header */}
      <div className="header-spacer" />

      <style jsx>{`
        .header-nav {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          z-index: 100;
          background: var(--header-bg);
          backdrop-filter: blur(16px);
          border-bottom: 1.5px solid var(--border-glass);
          height: 70px;
          display: flex;
          align-items: center;
          transition: var(--transition-smooth);
        }
        .header-spacer {
          height: 70px;
          flex-shrink: 0;
        }
        .nav-container {
          max-width: 100%;
          margin: 0 auto;
          padding: 0 40px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          width: 100%;
        }
        .logo-brand {
          display: flex;
          align-items: center;
          gap: 12px;
          text-decoration: none !important;
        }
        .brand-text {
          font-family: var(--font-serif);
          color: #7c3aed; /* Purple brand text matching mockup */
          font-size: 1.15rem;
          font-weight: 700;
          letter-spacing: 0.12em;
          text-shadow: 0 0 10px rgba(124, 58, 237, 0.05);
          text-decoration: none !important;
          white-space: nowrap;
        }
        .nav-menu {
          display: flex;
          align-items: center;
          gap: 16px;
        }
        .nav-item-link {
          position: relative;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          font-family: var(--font-serif);
          font-size: 1.15rem;
          font-weight: 600;
          color: #475569;
          text-decoration: none !important;
          letter-spacing: 0.02em;
          transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
          text-transform: none;
          padding: 8px 22px;
          border-radius: 99px;
          border: 1.5px solid transparent;
        }
        .nav-item-link span {
          color: inherit;
          font-weight: inherit;
          transition: all 0.25s ease;
        }
        .nav-item-link:hover:not(.active) {
          color: #7c3aed !important;
          background: rgba(124, 58, 237, 0.06);
          transform: translateY(-1px);
        }

        /* High-visibility Active Tab Styling */
        .nav-item-link.active,
        .nav-item-link.active span {
          color: #4c1d95 !important; /* Deep Royal Purple Text */
          font-weight: 800 !important; /* Extra Bold */
        }
        .nav-item-link.active {
          background: #eedffd !important; /* Vivid Light Purple Background Pill */
          border: 1.5px solid rgba(124, 58, 237, 0.35) !important;
          box-shadow: 0 4px 16px rgba(124, 58, 237, 0.18) !important;
        }

        /* Mobile / Tablet Header Section Pill */
        .mobile-active-section-pill {
          display: none;
          align-items: center;
          gap: 6px;
          padding: 4px 12px;
          border-radius: 99px;
          background: linear-gradient(135deg, rgba(243, 232, 255, 0.85) 0%, rgba(250, 245, 255, 0.95) 100%);
          border: 1px solid rgba(168, 85, 247, 0.25);
          box-shadow: 0 2px 8px rgba(124, 58, 237, 0.08);
        }
        .mobile-pill-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: #7c3aed;
          box-shadow: 0 0 6px rgba(124, 58, 237, 0.7);
          animation: pulseDot 2s infinite cubic-bezier(0.4, 0, 0.6, 1);
        }
        .mobile-pill-text {
          font-family: var(--font-serif);
          font-size: 0.78rem;
          font-weight: 700;
          color: #5b21b6;
          letter-spacing: 0.04em;
        }

        @keyframes pulseDot {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.6; transform: scale(1.25); }
        }

        .nav-actions {
          display: flex;
          align-items: center;
          gap: 16px;
        }
        .cart-badge-container {
          display: flex;
          align-items: center;
          justify-content: center;
          background: transparent;
          border: none;
          padding: 6px;
          color: #475569;
          text-decoration: none !important;
          transition: var(--transition-fast);
          border-radius: 99px;
        }
        .cart-badge-container:hover {
          color: var(--header-link-hover-color);
          background: rgba(124, 58, 237, 0.05);
        }
        .cart-icon-wrapper {
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
          width: 32px;
          height: 32px;
        }
        .cart-icon {
          color: #7c3aed;
          transition: var(--transition-fast);
        }
        .cart-floating-badge {
          position: absolute;
          top: -4px;
          right: -4px;
          background: #e11d48;
          color: #ffffff;
          font-family: var(--font-sans);
          font-size: 0.65rem;
          font-weight: 700;
          border-radius: 99px;
          min-width: 16px;
          height: 16px;
          padding: 0 4px;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 1.5px solid #ffffff;
          box-shadow: 0 2px 6px rgba(225, 29, 72, 0.3);
          line-height: 1;
        }
        .admin-cta-btn {
          font-family: var(--font-serif);
          font-size: 0.72rem;
          font-weight: 700;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          background: var(--admin-cta-bg);
          border: 1.5px solid var(--admin-cta-border);
          color: var(--admin-cta-text);
          padding: 8px 16px;
          border-radius: 10px;
          text-decoration: none !important;
          transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
          box-shadow: 0 4px 12px var(--admin-cta-shadow);
        }
        .admin-cta-btn:hover {
          background: var(--admin-cta-hover-bg);
          border-color: var(--admin-cta-hover-border);
          box-shadow: 0 6px 16px var(--admin-cta-hover-shadow);
          transform: translateY(-1px);
        }
        .user-profile-btn {
          font-family: var(--font-sans);
          font-size: 0.9rem;
          font-weight: 600;
          color: #475569;
          background: #ffffff;
          border: 1.5px solid rgba(124, 58, 237, 0.2);
          padding: 4px 12px 4px 6px;
          border-radius: 99px;
          text-decoration: none !important;
          display: flex;
          align-items: center;
          gap: 8px;
          transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
          box-shadow: 0 2px 6px rgba(0, 0, 0, 0.02);
        }
        .user-profile-btn:hover {
          background: rgba(124, 58, 237, 0.04);
          border-color: rgba(124, 58, 237, 0.6);
          color: #7c3aed;
          box-shadow: 0 4px 12px rgba(124, 58, 237, 0.08);
        }
        .user-profile-btn.login {
          color: #7c3aed;
          background: #ffffff;
          border-color: rgba(124, 58, 237, 0.4);
          padding: 6px 16px;
        }
        .user-profile-btn.login:hover {
          background: rgba(124, 58, 237, 0.04);
          border-color: #7c3aed;
          color: #6d28d9;
        }
        .user-avatar-wrapper {
          position: relative;
          width: 32px;
          height: 32px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #eef2f6;
          border: 1px solid rgba(0, 0, 0, 0.05);
          flex-shrink: 0;
        }
        .user-avatar-img {
          width: 100%;
          height: 100%;
          border-radius: 50%;
          object-fit: cover;
        }
        .user-avatar-initials {
          font-family: var(--font-sans);
          font-size: 0.85rem;
          font-weight: 700;
          color: #7c3aed;
        }
        .user-online-dot {
          position: absolute;
          bottom: -1px;
          right: -1px;
          width: 10px;
          height: 10px;
          border-radius: 50%;
          background: #10b981;
          border: 2px solid #ffffff;
          box-shadow: 0 0 0 1px rgba(16, 185, 129, 0.2);
        }
        .user-name-text {
          max-width: 100px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .user-chevron-down {
          color: #94a3b8;
          transition: var(--transition-fast);
        }
        .user-profile-btn:hover .user-chevron-down {
          color: #7c3aed;
          transform: translateY(1px);
        }

        /* Mobile menu hamburger button styles */
        .mobile-menu-toggle-btn {
          display: none;
          flex-direction: column;
          justify-content: space-between;
          width: 22px;
          height: 16px;
          background: transparent;
          border: none;
          cursor: pointer;
          padding: 0;
          z-index: 110;
          outline: none;
        }
        .hamburger-bar {
          width: 100%;
          height: 2px;
          background-color: #7c3aed;
          border-radius: 99px;
          transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        }
        
        /* Transform hamburger lines on active */
        .mobile-menu-toggle-btn.active .hamburger-bar:nth-child(1) {
          transform: translateY(7px) rotate(45deg);
        }
        .mobile-menu-toggle-btn.active .hamburger-bar:nth-child(2) {
          opacity: 0;
        }
        .mobile-menu-toggle-btn.active .hamburger-bar:nth-child(3) {
          transform: translateY(-7px) rotate(-45deg);
        }

        /* Mobile drawer */
        .mobile-nav-drawer {
          position: fixed;
          top: 70px;
          right: -280px;
          width: 260px;
          height: calc(100vh - 70px);
          background: rgba(255, 255, 255, 0.96);
          backdrop-filter: blur(24px);
          -webkit-backdrop-filter: blur(24px);
          box-shadow: -12px 0 40px rgba(124, 58, 237, 0.15), -4px 0 16px rgba(0, 0, 0, 0.1);
          border-left: 1px solid rgba(128, 90, 213, 0.2);
          padding: 32px 20px;
          display: flex;
          flex-direction: column;
          gap: 20px;
          z-index: 95;
          transition: right 0.35s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .mobile-nav-drawer.open {
          right: 0;
        }
        .mobile-drawer-menu {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .mobile-drawer-link {
          font-family: var(--font-serif);
          font-size: 1.15rem;
          font-weight: 500;
          color: #475569 !important;
          padding: 12px 18px;
          border-radius: 14px;
          transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
          text-decoration: none !important;
          display: flex;
          align-items: center;
          justify-content: space-between;
          border: 1px solid transparent;
        }
        .mobile-drawer-link span {
          color: inherit;
          font-weight: inherit;
        }
        .mobile-drawer-link.active {
          background: rgba(124, 58, 237, 0.08) !important;
          color: #7c3aed !important;
          font-weight: 800 !important;
          border-color: rgba(124, 58, 237, 0.25) !important;
          border-left: 4px solid #7c3aed !important;
          box-shadow: 0 4px 16px rgba(124, 58, 237, 0.12) !important;
        }
        .mobile-drawer-link.active span {
          color: #7c3aed !important;
          font-weight: 800 !important;
        }
        .mobile-drawer-link:hover:not(.active) {
          color: var(--header-link-hover-color);
          background: rgba(168, 85, 247, 0.06);
          transform: translateX(4px);
        }
        .drawer-link-inner {
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .drawer-active-tag {
          font-family: var(--font-sans);
          font-size: 0.62rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          color: #7c3aed;
          background: rgba(124, 58, 237, 0.1);
          padding: 2px 8px;
          border-radius: 99px;
          border: 1px solid rgba(124, 58, 237, 0.2);
        }
        .mobile-active-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: #7c3aed;
          box-shadow: 0 0 10px rgba(124, 58, 237, 0.8);
          flex-shrink: 0;
        }
        
        .mobile-drawer-backdrop {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(15, 23, 42, 0.55);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          z-index: 90;
          animation: fadeInBackdrop 0.25s ease-out forwards;
        }

        @keyframes fadeInBackdrop {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @keyframes badgeGlow {
          0%, 100% { transform: scale(1); opacity: 0.8; }
          50% { transform: scale(1.4); opacity: 1; }
        }
        @media (max-width: 768px) {
          .nav-container {
            padding: 0 20px;
          }
          .nav-menu {
            display: none;
          }
          .mobile-active-section-pill {
            display: flex;
          }
          .mobile-menu-toggle-btn {
            display: flex;
          }
          .nav-actions {
            gap: 10px;
          }
          .brand-text {
            font-size: 0.95rem;
            letter-spacing: 0.06em;
          }
          .logo-brand {
            gap: 8px;
          }
          .cart-badge-container {
            padding: 2px;
          }
          .user-profile-btn {
            padding: 0;
            border: none;
            background: transparent;
            box-shadow: none;
          }
          .user-profile-btn:hover {
            background: transparent;
            box-shadow: none;
          }
          .user-name-text {
            display: none;
          }
          .user-chevron-down {
            display: none;
          }
          .user-profile-btn.login {
            padding: 4px 10px;
            font-size: 0.75rem;
            border: 1.5px solid rgba(124, 58, 237, 0.4);
            background: #ffffff;
          }
        }
        @media (max-width: 480px) {
          .nav-container {
            padding: 0 12px;
          }
          .brand-text {
            display: none;
          }
          .logo-brand {
            gap: 6px;
          }
          .nav-actions {
            gap: 8px;
          }
          /* Override svg size via class */
          .logo-brand :global(.ds-logo-svg) {
            width: 28px !important;
            height: 28px !important;
          }
        }
      `}</style>
    </>
  );
};
