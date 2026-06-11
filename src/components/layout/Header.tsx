"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";

export const Header: React.FC = () => {
  const [cartCount, setCartCount] = useState(0);

  useEffect(() => {
    // Keep check on local selections
    const checkCart = () => {
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
    };
    
    checkCart();
    // Poll localstorage slightly for state updates
    const interval = setInterval(checkCart, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="header-nav">
      <div className="nav-container">
        {/* Glowing Lotus Brand Logo */}
        <Link href="/" className="logo-brand">
          <svg className="lotus-logo" viewBox="0 0 50 50" width="36" height="36" xmlns="http://www.w3.org/2000/svg">
            <path d="M25 5C25 5 18 18 12 22C10 23.5 7 24 5 24C3 24 2.5 25 3 26C4 28 10 29 15 28C21 27 24 35 25 45C26 35 29 27 35 28C40 29 46 28 47 26C47.5 25 47 24 45 24C43 24 40 23.5 38 22C32 18 25 5 25 5Z" />
            <path d="M25 12C25 12 21 21 16 24C14.5 25 12 25.5 10 25.5C8.5 25.5 8 26.2 8.5 27C9.5 28.5 14 29 18 28.5C22.5 28 24.5 33.5 25 41C25.5 33.5 27.5 28 32 28.5C36 29 40.5 28.5 41.5 27C42 26.2 41.5 25.5 40 25.5C38 25.5 35.5 25 34 24C29 21 25 12 25 12Z" opacity="0.8" />
          </svg>
          <span className="brand-text">DIVING SANATAN</span>
        </Link>

        {/* Links */}
        <nav className="nav-menu">
          <Link href="/" className="nav-item-link">Home</Link>
          <Link href="/search" className="nav-item-link">Services</Link>
          <Link href="/about" className="nav-item-link">About</Link>
          <Link href="/blog" className="nav-item-link">Blog</Link>
          <Link href="/reviews" className="nav-item-link">Reviews</Link>
          <Link href="/contact" className="nav-item-link">Contact</Link>
        </nav>

        {/* CTA Buttons */}
        <div className="nav-actions">
          {cartCount > 0 && (
            <Link href="/search" className="cart-badge-container">
              <span className="cart-pulse"></span>
              <span className="cart-text">Cart ({cartCount})</span>
            </Link>
          )}
          <Link href="/admin" className="admin-cta-btn">
            Admin Portal
          </Link>
        </div>
      </div>

      <style jsx>{`
        .header-nav {
          position: sticky;
          top: 0;
          z-index: 100;
          background: var(--header-bg);
          backdrop-filter: blur(16px);
          border-bottom: 1.5px solid var(--border-glass);
          padding: 16px 0;
          transition: var(--transition-smooth);
        }
        .nav-container {
          max-width: 1200px;
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
        .lotus-logo {
          fill: var(--header-logo-fill);
          filter: drop-shadow(0 0 8px var(--header-logo-shadow));
          transition: var(--transition-smooth);
        }
        .logo-brand:hover .lotus-logo {
          transform: rotate(15deg) scale(1.05);
        }
        .brand-text {
          font-family: var(--font-serif);
          color: var(--header-brand-color);
          font-size: 1.15rem;
          font-weight: 700;
          letter-spacing: 0.12em;
          text-shadow: 0 0 10px var(--header-brand-shadow);
          text-decoration: none !important;
        }
        .nav-menu {
          display: flex;
          gap: 28px;
        }
        .nav-item-link {
          font-size: 0.85rem;
          font-weight: 600;
          color: var(--header-link-color);
          text-decoration: none !important;
          letter-spacing: 0.08em;
          transition: var(--transition-fast);
          text-transform: uppercase;
          position: relative;
          padding: 4px 0;
        }
        .nav-item-link::after {
          content: '';
          position: absolute;
          bottom: 0;
          left: 0;
          width: 0;
          height: 1.5px;
          background: var(--header-link-hover-color);
          transition: var(--transition-fast);
          box-shadow: 0 0 8px var(--header-link-hover-shadow);
        }
        .nav-item-link:hover {
          color: var(--header-link-hover-color);
        }
        .nav-item-link:hover::after {
          width: 100%;
        }
        .nav-actions {
          display: flex;
          align-items: center;
          gap: 20px;
        }
        .cart-badge-container {
          display: flex;
          align-items: center;
          gap: 8px;
          background: var(--cart-badge-bg);
          border: 1px solid var(--cart-badge-border);
          padding: 6px 12px;
          border-radius: 99px;
          color: var(--cart-badge-text);
          text-decoration: none !important;
          font-size: 0.8rem;
          font-weight: 600;
          position: relative;
        }
        .cart-pulse {
          width: 8px;
          height: 8px;
          background-color: var(--cart-pulse-color);
          border-radius: 50%;
          animation: badgeGlow 1.5s infinite ease-in-out;
        }
        .admin-cta-btn {
          font-family: var(--font-serif);
          font-size: 0.75rem;
          font-weight: 700;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          background: var(--admin-cta-bg);
          border: 1.5px solid var(--admin-cta-border);
          color: var(--admin-cta-text);
          padding: 10px 20px;
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
        @keyframes badgeGlow {
          0%, 100% { transform: scale(1); opacity: 0.8; }
          50% { transform: scale(1.4); opacity: 1; }
        }
        @media (max-width: 768px) {
          .nav-menu {
            display: none; /* Mobile collapsible menu handled in core layouts or simplified */
          }
        }
      `}</style>
    </header>
  );
};
