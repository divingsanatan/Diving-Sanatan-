"use client";

import React, { useState } from "react";
import Link from "next/link";

export const Footer: React.FC = () => {
  const [email, setEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) {
      setSubscribed(true);
      setEmail("");
    }
  };

  return (
    <footer className="footer-container">
      <div className="footer-grid">
        {/* Brand */}
        <div className="footer-brand">
          <div className="footer-logo-row">
            <svg viewBox="0 0 50 50" width="30" height="30" fill="var(--header-logo-fill)">
              <path d="M25 5C25 5 18 18 12 22C10 23.5 7 24 5 24C3 24 2.5 25 3 26C4 28 10 29 15 28C21 27 24 35 25 45C26 35 29 27 35 28C40 29 46 28 47 26C47.5 25 47 24 45 24C43 24 40 23.5 38 22C32 18 25 5 25 5Z" />
            </svg>
            <span className="footer-brand-title">Diving Sanatan</span>
          </div>
          <p className="footer-brand-desc">
            Realigning the body, mind, and cosmic resonance through certified vibrational layouts and energy therapy.
          </p>
          <div className="footer-contact-info">
            <p>📍 H.no. 54, Khanuja Enclave, Bawadia Kalan, Bhopal</p>
            <p>✉️ support@divingsanatan.com</p>
            <div className="footer-socials">
              <a href="https://youtube.com/@divingsanatan" target="_blank" rel="noopener noreferrer" className="social-icon-link" title="YouTube">
                <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>
              </a>
              <a href="https://facebook.com/divingsanatan" target="_blank" rel="noopener noreferrer" className="social-icon-link" title="Facebook">
                <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
              </a>
              <a href="https://instagram.com/divingsanatan" target="_blank" rel="noopener noreferrer" className="social-icon-link" title="Instagram">
                <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>
              </a>
            </div>
          </div>
        </div>

        {/* Links */}
        <div className="footer-links-col">
          <h4 className="footer-col-title">Navigation</h4>
          <ul className="footer-links-list">
            <li><Link href="/" className="footer-link">Home</Link></li>
            <li><Link href="/search" className="footer-link">Services</Link></li>
            <li><Link href="/about" className="footer-link">About Healers</Link></li>
            <li><Link href="/blog" className="footer-link">Spiritual Blog</Link></li>
            <li><Link href="/reviews" className="footer-link">Testimonials</Link></li>
          </ul>
        </div>

        {/* Privacy / Admin */}
        <div className="footer-links-col">
          <h4 className="footer-col-title">Resources</h4>
          <ul className="footer-links-list">
            <li><Link href="/contact" className="footer-link">Contact Us</Link></li>
            <li><Link href="/privacy" className="footer-link">Privacy Policy</Link></li>
            <li><Link href="/admin" className="footer-link">Admin Dashboard</Link></li>
          </ul>
        </div>

        {/* Newsletter */}
        <div className="footer-newsletter">
          <h4 className="footer-col-title">Newsletter</h4>
          <p className="newsletter-desc">Subscribe to receive moon cycles updates, chakra guidance, and private booking discounts.</p>
          {!subscribed ? (
            <form onSubmit={handleSubscribe} className="newsletter-form">
              <input
                type="email"
                placeholder="Enter your email address"
                className="glass-input newsletter-input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              <button type="submit" className="newsletter-btn">Join</button>
            </form>
          ) : (
            <p className="newsletter-success">✨ Welcome to the circle of healing!</p>
          )}
        </div>
      </div>

      <div className="footer-bottom">
        <p>&copy; {new Date().getFullYear()} Diving Sanatan Wellness Portal. All rights reserved.</p>
      </div>

      <style jsx>{`
        .footer-container {
          background: var(--footer-bg);
          border-top: 1.5px solid var(--border-glass);
          padding: 80px 24px 40px;
          margin-top: 80px;
        }
        .footer-grid {
          max-width: 1200px;
          margin: 0 auto;
          display: grid;
          grid-template-columns: 1.5fr 1fr 1fr 1.5fr;
          gap: 48px;
        }
        .footer-brand {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }
        .footer-logo-row {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .footer-brand-title {
          font-family: var(--font-serif);
          font-size: 1.25rem;
          font-weight: 700;
          color: var(--footer-brand-color);
          letter-spacing: 0.08em;
        }
        .footer-brand-desc {
          font-size: 0.9rem;
          color: hsl(var(--text-muted));
          line-height: 1.6;
        }
        .footer-contact-info {
          display: flex;
          flex-direction: column;
          gap: 8px;
          font-size: 0.85rem;
          color: hsl(var(--text-muted));
        }
        .footer-col-title {
          font-family: var(--font-serif);
          font-size: 0.95rem;
          font-weight: 600;
          color: var(--footer-title-color);
          margin-bottom: 24px;
          letter-spacing: 0.05em;
          text-transform: uppercase;
        }
        .footer-links-list {
          list-style: none;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .footer-link {
          font-size: 0.9rem;
          color: hsl(var(--text-muted));
          text-decoration: none;
          transition: var(--transition-fast);
        }
        .footer-link:hover {
          color: var(--footer-link-hover-color);
          padding-left: 4px;
        }
        .footer-newsletter {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        .newsletter-desc {
          font-size: 0.85rem;
          color: hsl(var(--text-muted));
        }
        .newsletter-form {
          display: flex;
          gap: 8px;
        }
        .newsletter-input {
          padding: 10px 14px;
          font-size: 0.85rem;
        }
        .newsletter-btn {
          background: var(--btn-gold-bg);
          color: var(--btn-gold-text);
          border: 1px solid var(--btn-gold-border);
          font-family: var(--font-serif);
          font-weight: 700;
          padding: 0 18px;
          border-radius: 10px;
          cursor: pointer;
          font-size: 0.8rem;
          text-transform: uppercase;
          letter-spacing: 0.06em;
          transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
          position: relative;
          overflow: hidden;
          white-space: nowrap;
          box-shadow: 0 4px 14px var(--btn-gold-hover-shadow);
        }
        .newsletter-btn::after {
          content: '';
          position: absolute;
          top: 0;
          left: -150%;
          width: 60%;
          height: 100%;
          background: linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.35) 50%, transparent 100%);
          transform: skewX(-20deg);
          transition: left 0.7s ease;
        }
        .newsletter-btn:hover {
          filter: brightness(1.07);
          transform: translateY(-2px);
          box-shadow: 0 8px 22px var(--btn-gold-hover-shadow);
        }
        .newsletter-btn:hover::after {
          left: 200%;
        }
        .newsletter-btn:active {
          transform: translateY(0);
          box-shadow: 0 2px 8px var(--btn-gold-hover-shadow);
        }
        .newsletter-success {
          color: var(--newsletter-success-color);
          font-size: 0.9rem;
          font-weight: 600;
        }
        .footer-socials {
          display: flex;
          gap: 14px;
          margin-top: 4px;
        }
        .social-icon-link {
          color: hsl(var(--text-muted));
          transition: color 0.2s, transform 0.2s;
          display: flex;
          align-items: center;
        }
        .social-icon-link:hover {
          color: var(--footer-link-hover-color);
          transform: translateY(-2px);
        }
        .footer-bottom {
          max-width: 1200px;
          margin: 60px auto 0;
          padding-top: 24px;
          border-top: 1px solid rgba(0,0,0,0.05);
          text-align: center;
          font-size: 0.8rem;
          color: hsl(var(--text-muted));
        }
        @media (max-width: 1024px) {
          .footer-grid {
            grid-template-columns: repeat(2, 1fr);
            gap: 40px;
          }
        }
        @media (max-width: 640px) {
          .footer-grid {
            grid-template-columns: 1fr;
            gap: 32px;
          }
        }
      `}</style>
    </footer>
  );
};
