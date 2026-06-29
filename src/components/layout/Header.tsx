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
          <Link href="/" className="logo-brand">
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
            <Link href="/search" className="cart-badge-container">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="cart-icon">
                <circle cx="9" cy="21" r="1"/>
                <circle cx="20" cy="21" r="1"/>
                <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
              </svg>
              <span className="cart-text">Cart ({cartCount})</span>
            </Link>
            {isAdmin && (
              <Link href="/admin" className="admin-cta-btn">
                Admin Panel
              </Link>
            )}
            {user ? (
              <Link href="/profile" className="user-profile-btn">
                <span className="user-avatar-icon">👤</span>
                <span className="user-name-text">{user.name}</span>
              </Link>
            ) : (
              <Link href="/profile" className="user-profile-btn login">
                Sign In
              </Link>
            )}
          </div>
        </div>
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
          padding: 16px 0;
          transition: var(--transition-smooth);
        }
        .header-spacer {
          height: 70px;
          flex-shrink: 0;
        }
        .nav-container {
          max-width: 1050px;
          margin: 0 auto;
          padding: 0 24px;
          display: flex;
          align-items: center;
          justify-content: space-between;
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
          gap: 8px;
          background: transparent;
          border: none;
          padding: 6px 12px;
          color: #475569;
          text-decoration: none !important;
          font-family: var(--font-serif);
          font-size: 1.1rem;
          font-weight: 700;
          transition: var(--transition-fast);
        }
        .cart-badge-container:hover {
          color: var(--header-link-hover-color);
        }
        .cart-icon {
          color: #7c3aed;
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
          font-family: var(--font-serif);
          font-size: 1.05rem;
          font-weight: 700;
          color: #7c3aed;
          background: #ffffff;
          border: 1.5px solid rgba(124, 58, 237, 0.4);
          padding: 8px 20px;
          border-radius: 99px;
          text-decoration: none !important;
          display: flex;
          align-items: center;
          gap: 6px;
          transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
          box-shadow: 0 2px 6px rgba(124, 58, 237, 0.05);
        }
        .user-profile-btn:hover {
          background: rgba(124, 58, 237, 0.04);
          border-color: #7c3aed;
          box-shadow: 0 4px 12px rgba(124, 58, 237, 0.1);
          transform: translateY(-1px);
        }
        .user-profile-btn.login {
          color: #7c3aed;
          background: #ffffff;
          border-color: rgba(124, 58, 237, 0.4);
        }
        .user-profile-btn.login:hover {
          background: rgba(124, 58, 237, 0.04);
          border-color: #7c3aed;
          color: #6d28d9;
        }
        .user-avatar-icon {
          font-size: 0.95rem;
        }
        .user-name-text {
          max-width: 110px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        @keyframes badgeGlow {
          0%, 100% { transform: scale(1); opacity: 0.8; }
          50% { transform: scale(1.4); opacity: 1; }
        }
        @media (max-width: 768px) {
          .nav-menu {
            display: none;
          }
          .nav-actions {
            gap: 10px;
          }
          .brand-text {
            font-size: 1rem;
            letter-spacing: 0.08em;
          }
          .cart-badge-container {
            padding: 4px 8px;
            font-size: 0.72rem;
          }
          .admin-cta-btn, .user-profile-btn {
            padding: 6px 12px;
            font-size: 0.7rem;
          }
        }
      `}</style>
    </>
  );
};
