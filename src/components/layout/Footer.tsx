"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ArrowUp, Mail } from "lucide-react";
import { Logo } from "./Logo";
import styles from "./Footer.module.css";

type FooterLink = { label: string; href: string };

// Only routes that exist on the site. Edit here to change footer links.
const LINK_GROUPS: { title: string; links: FooterLink[] }[] = [
  {
    title: "Explore",
    links: [
      { label: "Healing services", href: "/explore-services" },
      { label: "Shop", href: "/shop" },
      { label: "Our gurus", href: "/gurus" },
      { label: "Client reviews", href: "/reviews" },
      { label: "About us", href: "/about" },
    ],
  },
  {
    title: "Learn",
    links: [
      { label: "Blog", href: "/blog" },
      { label: "Glossary", href: "/blog/glossary" },
      { label: "FAQ", href: "/blog/faq" },
      { label: "Case studies", href: "/blog/case-studies" },
      { label: "Video transcripts", href: "/blog/video-transcripts" },
    ],
  },
  {
    title: "Support",
    links: [
      { label: "Contact us", href: "/contact" },
      { label: "Privacy policy", href: "/privacy" },
    ],
  },
];

const SOCIALS = [
  {
    label: "YouTube",
    href: "https://youtube.com/@divingsanatan",
    path: "M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z",
  },
  {
    label: "Instagram",
    href: "https://instagram.com/divingsanatan",
    path: "M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z",
  },
  {
    label: "Facebook",
    href: "https://facebook.com/divingsanatan",
    path: "M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z",
  },
];

const CONTACT_EMAIL = "support@divingsanatan.com";

type Status = "idle" | "loading" | "success" | "error";

export const Footer: React.FC = () => {
  const [email, setEmail] = useState("");
  const [website, setWebsite] = useState(""); // honeypot
  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState("");

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (status === "loading") return;
    setStatus("loading");
    setMessage("");

    try {
      const res = await fetch("/api/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, website }),
      });
      const json = await res.json().catch(() => ({}));

      if (res.ok && json.success) {
        setStatus("success");
        setMessage("You're in. Watch your inbox for guidance rooted in Sanatan wisdom.");
        setEmail("");
      } else {
        setStatus("error");
        setMessage(json.error || "Something went wrong. Please try again.");
      }
    } catch {
      setStatus("error");
      setMessage("Network error. Please check your connection and try again.");
    }
  };

  const scrollToTop = () => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    window.scrollTo({ top: 0, behavior: reduce ? "auto" : "smooth" });
  };

  return (
    <footer className={styles.footer}>
      <div className={styles.inner}>
        {/* Divider with a small star, echoing the logo */}
        <div className={styles.divider} aria-hidden="true">
          <span className={styles.line} />
          <svg viewBox="0 0 24 24" width="18" height="18" className={styles.star}>
            <path d="M12 1.5l2.6 7.9 7.9 2.6-7.9 2.6L12 22.5l-2.6-7.9L1.5 12l7.9-2.6z" fill="currentColor" />
          </svg>
          <span className={styles.line} />
        </div>

        <div className={styles.grid}>
          {/* Brand */}
          <div className={styles.brand}>
            <Link href="/" className={styles.brandRow} aria-label="Diving Sanatan home">
              <Logo size={34} />
              <span className={styles.brandName}>DIVING SANATAN</span>
            </Link>
            <p className={styles.tagline} lang="hi">सनातन की गहराई में</p>
            <p className={styles.desc}>
              Healing, meditation and energy alignment guided by certified practitioners and the
              timeless wisdom of Sanatan Dharma.
            </p>
            <div className={styles.socials}>
              {SOCIALS.map((s) => (
                <a
                  key={s.label}
                  href={s.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.social}
                  aria-label={`Diving Sanatan on ${s.label}`}
                >
                  <svg viewBox="0 0 24 24" width="17" height="17" fill="currentColor" aria-hidden="true">
                    <path d={s.path} />
                  </svg>
                </a>
              ))}
            </div>
          </div>

          {/* Link columns */}
          <nav className={styles.cols} aria-label="Footer">
            {LINK_GROUPS.map((group) => (
              <div key={group.title}>
                <h2 className={styles.heading}>{group.title}</h2>
                <ul className={styles.list}>
                  {group.links.map((l) => (
                    <li key={l.href}>
                      <Link href={l.href} className={styles.link}>
                        {l.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </nav>
        </div>

        {/* Newsletter */}
        <div className={styles.news}>
          <div className={styles.newsText}>
            <h2 className={styles.newsTitle}>Weekly guidance, gently delivered</h2>
            <p className={styles.newsSub}>Insights rooted in Sanatan wisdom, sent to your inbox. No spam, unsubscribe anytime.</p>
          </div>
          <form onSubmit={handleSubscribe} className={styles.form} noValidate>
            <label htmlFor="footer-email" className={styles.srOnly}>
              Email address
            </label>
            <div className={styles.formRow}>
              <input
                id="footer-email"
                type="email"
                inputMode="email"
                autoComplete="email"
                placeholder="Your email address"
                className={styles.input}
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (status === "error") setStatus("idle");
                }}
                required
                disabled={status === "loading"}
                aria-describedby="footer-newsletter-status"
              />
              {/* Honeypot: hidden from people and assistive tech */}
              <input
                type="text"
                name="website"
                tabIndex={-1}
                autoComplete="off"
                aria-hidden="true"
                className={styles.honeypot}
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
              />
              <button type="submit" className={styles.submit} disabled={status === "loading"}>
                {status === "loading" ? "Joining…" : "Subscribe"}
              </button>
            </div>
            <p
              id="footer-newsletter-status"
              role="status"
              aria-live="polite"
              className={`${styles.status} ${
                status === "success" ? styles.statusOk : status === "error" ? styles.statusErr : ""
              }`}
            >
              {message}
            </p>
          </form>
        </div>

        {/* Bottom bar */}
        <div className={styles.bottom}>
          <p className={styles.legal}>&copy; {new Date().getFullYear()} Diving Sanatan. All rights reserved.</p>
          <div className={styles.bottomRight}>
            <a href={`mailto:${CONTACT_EMAIL}`} className={styles.mail}>
              <Mail size={15} aria-hidden="true" />
              {CONTACT_EMAIL}
            </a>
            <button type="button" onClick={scrollToTop} className={styles.top} aria-label="Back to top">
              <ArrowUp size={17} aria-hidden="true" />
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
};
