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
            <p>📍 777 Ethereal Pathway, Zen City, CA</p>
            <p>✉️ support@divingsanatan.com</p>
            <p>📞 +1 (555) 777-AURA</p>
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
          padding: 0 16px;
          border-radius: 10px;
          cursor: pointer;
          font-size: 0.8rem;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          transition: var(--transition-fast);
        }
        .newsletter-btn:hover {
          filter: brightness(1.1);
        }
        .newsletter-success {
          color: var(--newsletter-success-color);
          font-size: 0.9rem;
          font-weight: 600;
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
