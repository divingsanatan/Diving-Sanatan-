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

  return (
    <>
      <header className="header-nav">
        <div className="nav-container">
          {/* Stylized Brand Logo */}
          <Link href="/" className="logo-brand" onClick={() => setMobileMenuOpen(false)}>
            <Logo size={36} />
            <span className="brand-text">DIVING SANATAN</span>
          </Link>

          {/* Nav Links */}
          <nav className="nav-menu">
            <Link href="/" className={`nav-item-link ${pathname === "/" ? "active" : ""}`}>Home</Link>
            <Link href="/services" className={`nav-item-link ${pathname === "/services" || pathname.startsWith("/services/") ? "active" : ""}`}>Services</Link>
            <Link href="/about" className={`nav-item-link ${pathname === "/about" ? "active" : ""}`}>About</Link>
            <Link href="/blog" className={`nav-item-link ${pathname === "/blog" ? "active" : ""}`}>Blog</Link>
          </nav>

          {/* CTA Buttons */}
          <div className="nav-actions">
            <Link href="/cart" className="cart-badge-container" onClick={() => setMobileMenuOpen(false)} aria-label="Shopping Cart">
              <div className="cart-icon-wrapper">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="cart-icon">
                  <circle cx="9" cy="21" r="1" />
                  <circle cx="20" cy="21" r="1" />
                  <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
                </svg>
                {cartCount > 0 && <span className="cart-floating-badge">{cartCount}</span>}
              </div>
            </Link>

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
            <Link href="/" className={`mobile-drawer-link ${pathname === "/" ? "active" : ""}`} onClick={() => setMobileMenuOpen(false)}>Home</Link>
            <Link href="/services" className={`mobile-drawer-link ${pathname === "/services" || pathname.startsWith("/services/") ? "active" : ""}`} onClick={() => setMobileMenuOpen(false)}>Services</Link>
            <Link href="/about" className={`mobile-drawer-link ${pathname === "/about" ? "active" : ""}`} onClick={() => setMobileMenuOpen(false)}>About</Link>
            <Link href="/blog" className={`mobile-drawer-link ${pathname === "/blog" ? "active" : ""}`} onClick={() => setMobileMenuOpen(false)}>Blog</Link>
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
          font-family: var(--font-serif);
          font-size: 1.15rem;
          font-weight: 700;
          color: var(--header-link-color);
          text-decoration: none !important;
          letter-spacing: 0.02em;
          transition: var(--transition-fast);
          text-transform: none;
          padding: 6px 16px;
          border-radius: 99px;
        }
        .nav-item-link.active {
          background: #eedffd;
          color: #4c1d95;
        }
        .nav-item-link:hover:not(.active) {
          color: var(--header-link-hover-color);
          background: rgba(168, 85, 247, 0.04);
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
          background: rgba(255, 255, 255, 0.85);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          box-shadow: -10px 0 40px rgba(124, 58, 237, 0.08);
          border-left: 1px solid rgba(128, 90, 213, 0.15);
          padding: 32px 24px;
          display: flex;
          flex-direction: column;
          gap: 20px;
          z-index: 95;
          transition: right 0.4s cubic-bezier(0.16, 1, 0.3, 1);
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
          font-size: 1.25rem;
          font-weight: 700;
          color: var(--header-link-color);
          padding: 10px 20px;
          border-radius: 99px;
          transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
          text-decoration: none !important;
        }
        .mobile-drawer-link.active {
          background: #eedffd;
          color: #4c1d95;
        }
        .mobile-drawer-link:hover:not(.active) {
          color: var(--header-link-hover-color);
          background: rgba(168, 85, 247, 0.06);
          transform: translateX(6px);
        }
        
        .mobile-drawer-backdrop {
          position: fixed;
          top: 70px;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.15);
          backdrop-filter: blur(4px);
          z-index: 90;
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
            font-size: 0.85rem;
            letter-spacing: 0.04em;
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
