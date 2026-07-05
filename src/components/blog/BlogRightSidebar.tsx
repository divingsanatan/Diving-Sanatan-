"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Play, Plus, BookOpen, User, Calendar, ExternalLink } from "lucide-react";
import { useBlog } from "@/app/blog/BlogContext";
import { Blog, Practitioner } from "@/types/database";

export const BlogRightSidebar: React.FC = () => {
  const { activeBlog } = useBlog();
  const [practitioners, setPractitioners] = useState<Practitioner[]>([]);
  const [allBlogs, setAllBlogs] = useState<Blog[]>([]);

  useEffect(() => {
    async function loadData() {
      try {
        const [pRes, bRes] = await Promise.all([
          fetch("/api/practitioners"),
          fetch("/api/blogs"),
        ]);
        const pJson = await pRes.json();
        const bJson = await bRes.json();
        if (pJson.success) setPractitioners(pJson.data);
        if (bJson.success) setAllBlogs(bJson.data);
      } catch (err) {
        console.error("Failed to load sidebars data:", err);
      }
    }
    loadData();
  }, []);

  const getPractitionerImage = (img: string) => {
    if (!img) return "/images/insight_blog.png";
    if (img.startsWith("http://") || img.startsWith("https://") || img.startsWith("/")) {
      return img;
    }
    // Mapped defaults
    const mappings: Record<string, string> = {
      "elara_vance": "/images/insight_blog.png",
      "master_zephyr": "/images/insight_space.png",
      "celeste_thorne": "/images/insight_video.png",
    };
    return mappings[img] || "/images/insight_blog.png";
  };

  const getBlogImage = (img: string) => {
    if (!img) return "/images/insight_blog.png";
    if (img.startsWith("http://") || img.startsWith("https://") || img.startsWith("/")) {
      return img;
    }
    return "/images/insight_blog.png";
  };

  // Helper to extract H2/H3 or numbered steps from HTML content
  const extractTOC = (html: string) => {
    const headings: string[] = [];
    const hRegex = /<h[23][^>]*>(.*?)<\/h[23]>/g;
    let match;
    while ((match = hRegex.exec(html)) !== null) {
      const clean = match[1].replace(/<[^>]+>/g, "").trim();
      if (clean) headings.push(clean);
    }

    if (headings.length === 0) {
      // Fallback: look for lines starting with bold numbers like 1., 2.
      const lines = html.split(/<br\s*\/?>|<\/p>|<p>|\n/);
      for (const line of lines) {
        const clean = line.replace(/<[^>]+>/g, "").trim();
        if (/^\d+\.\s+[A-Za-z]/.test(clean)) {
          headings.push(clean);
        }
      }
    }

    // Default headers if none found
    if (headings.length === 0) {
      return ["Introduction", "Core Practice", "Benefits", "How to practice", "Conclusion"];
    }

    return headings;
  };

  // Determine if it's detail page and what type
  const isVideoBlog = activeBlog && (
    (activeBlog.videos && activeBlog.videos.length > 0) ||
    activeBlog.category.toLowerCase() === "video transcripts" ||
    activeBlog.category.toLowerCase() === "video blog"
  );

  // Static fallback data for standard sidebar
  const mostViewedFallback = [
    {
      id: "aura-cleanse",
      title: "How to Cleanse Your Aura Daily",
      views: "12.5K views",
      image: "/images/insight_blog.png"
    },
    {
      id: "seven-chakras",
      title: "Understanding the 7 Chakras & Their Meanings",
      views: "9.8K views",
      image: "/images/insight_space.png"
    },
    {
      id: "full-moon-rituals",
      title: "Full Moon Rituals for Release & Renewal",
      views: "8.3K views",
      image: "/images/insight_video.png"
    }
  ];

  // Dynamic filter for Video Blog Layout
  const otherVideoBlogs = allBlogs
    .filter(b => b.id !== activeBlog?.id && b.videos && b.videos.length > 0)
    .slice(0, 5);

  const galleryShowcase = activeBlog?.images || [];

  // Dynamic filter for Normal Blog Layout
  const matchedAuthor = activeBlog
    ? practitioners.find(p => p.name.toLowerCase() === activeBlog.author.toLowerCase())
    : null;

  const relatedBlogs = activeBlog
    ? allBlogs
        .filter(b => b.id !== activeBlog.id && b.category.toLowerCase() === activeBlog.category.toLowerCase())
        .slice(0, 3)
    : [];

  const categories = [
    "Healer Interviews",
    "Guided Meditations",
    "Spiritual Techniques",
    "Wellness Tips",
    "Client Transformations"
  ];

  // Render Video Blog Details Sidebar
  if (activeBlog && isVideoBlog) {
    const toc = extractTOC(activeBlog.content);
    return (
      <div className="blog-right-sidebar">
        {/* On This Page (TOC) */}
        <div className="right-sidebar-card toc-card">
          <div className="sidebar-title-row">
            <svg viewBox="0 0 100 100" className="sidebar-lotus-icon">
              <path d="M50 25 C45 45 35 60 50 80 C65 60 55 45 50 25 Z" fill="none" stroke="#a855f7" strokeWidth="4" />
              <path d="M50 80 C35 75 25 60 20 40 C35 50 45 60 50 80 Z" fill="none" stroke="#a855f7" strokeWidth="4" />
              <path d="M50 80 C65 75 75 60 80 40 C65 50 55 60 50 80 Z" fill="none" stroke="#a855f7" strokeWidth="4" />
            </svg>
            <h4 className="sidebar-heading">On This Page</h4>
          </div>
          <ul className="toc-list">
            {toc.map((item, idx) => (
              <li key={idx} className="toc-item">
                <span className="toc-bullet">•</span>
                <span className="toc-text">{item}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Custom Quote Box */}
        <div className="right-sidebar-card quote-box-card">
          <span className="quote-icon">“</span>
          <p className="sidebar-quote-text">
            Your breath is your superpower. Use it wisely, every day.
          </p>
          <div className="quote-lotus-watermark">
            <svg viewBox="0 0 100 100" className="watermark-lotus">
              <path d="M50 25 C45 45 35 60 50 80 C65 60 55 45 50 25 Z" fill="none" stroke="#a855f7" strokeWidth="2.5" strokeOpacity="0.1" />
              <path d="M50 80 C35 75 25 60 20 40 C35 50 45 60 50 80 Z" fill="none" stroke="#a855f7" strokeWidth="2.5" strokeOpacity="0.1" />
              <path d="M50 80 C65 75 75 60 80 40 C65 50 55 60 50 80 Z" fill="none" stroke="#a855f7" strokeWidth="2.5" strokeOpacity="0.1" />
            </svg>
          </div>
        </div>

        {/* Supporting Videos */}
        {otherVideoBlogs.length > 0 && (
          <div className="right-sidebar-card">
            <div className="sidebar-header-row">
              <div className="sidebar-title-row">
                <svg viewBox="0 0 100 100" className="sidebar-lotus-icon">
                  <path d="M50 25 C45 45 35 60 50 80 C65 60 55 45 50 25 Z" fill="none" stroke="#a855f7" strokeWidth="4" />
                  <path d="M50 80 C35 75 25 60 20 40 C35 50 45 60 50 80 Z" fill="none" stroke="#a855f7" strokeWidth="4" />
                  <path d="M50 80 C65 75 75 60 80 40 C65 50 55 60 50 80 Z" fill="none" stroke="#a855f7" strokeWidth="4" />
                </svg>
                <h4 className="sidebar-heading">Supporting Videos</h4>
              </div>
            </div>

            <div className="video-blogs-list">
              {otherVideoBlogs.map((video) => (
                <Link key={video.id} href={`/blog/${video.id}`} className="video-blog-item">
                  <div className="video-thumbnail-wrapper">
                    <img src={getBlogImage(video.image)} alt={video.title} className="video-thumbnail" />
                    <div className="play-button-overlay">
                      <Play size={12} fill="white" color="white" />
                    </div>
                  </div>
                  <div className="video-info">
                    <h5>{video.title}</h5>
                    <span>⏱️ {video.readTime}</span>
                  </div>
                </Link>
              ))}
            </div>
            <Link href="/blog/video-transcripts" className="view-all-sidebar-btn">
              View All Videos
            </Link>
          </div>
        )}

        {/* Supporting Images */}
        {galleryShowcase.length > 0 && (
          <div className="right-sidebar-card">
            <div className="sidebar-title-row">
              <svg viewBox="0 0 100 100" className="sidebar-lotus-icon">
                <path d="M50 25 C45 45 35 60 50 80 C65 60 55 45 50 25 Z" fill="none" stroke="#a855f7" strokeWidth="4" />
                <path d="M50 80 C35 75 25 60 20 40 C35 50 45 60 50 80 Z" fill="none" stroke="#a855f7" strokeWidth="4" />
                <path d="M50 80 C65 75 75 60 80 40 C65 50 55 60 50 80 Z" fill="none" stroke="#a855f7" strokeWidth="4" />
              </svg>
              <h4 className="sidebar-heading">Supporting Images</h4>
            </div>

            <div className="supporting-images-grid">
              {galleryShowcase.slice(0, 6).map((img, idx) => (
                <div key={idx} className="supporting-img-item" onClick={() => window.open(getBlogImage(img), "_blank")}>
                  <img src={getBlogImage(img)} alt={`Supporting ${idx}`} className="supporting-gallery-thumbnail" />
                </div>
              ))}
            </div>
            <button className="view-all-sidebar-btn" onClick={() => {
              const gallerySection = document.querySelector(".article-carousel-showcase");
              if (gallerySection) gallerySection.scrollIntoView({ behavior: "smooth" });
            }}>
              View All Images
            </button>
          </div>
        )}

        {/* Personalized Guidance Consultation Booking */}
        <div className="right-sidebar-card booking-cta-card">
          <h4 className="cta-title">Want Personalized Guidance?</h4>
          <p className="cta-desc">
            Book a 1:1 session with our experts to deepen your breath practice.
          </p>
          <Link href="/booking" className="cta-btn">
            Book a Consultation
          </Link>
          <div className="cta-lotus-badge">
            <svg viewBox="0 0 100 100" className="cta-lotus">
              <path d="M50 25 C45 45 35 60 50 80 C65 60 55 45 50 25 Z" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="2.5" />
              <path d="M50 80 C35 75 25 60 20 40 C35 50 45 60 50 80 Z" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="2.5" />
              <path d="M50 80 C65 75 75 60 80 40 C65 50 55 60 50 80 Z" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="2.5" />
            </svg>
          </div>
        </div>

        <style jsx>{`
          .blog-right-sidebar {
            display: flex;
            flex-direction: column;
            gap: 20px;
            width: 100%;
          }
          .right-sidebar-card {
            background: #ffffff;
            border: 1px solid rgba(168, 85, 247, 0.08);
            padding: 20px;
            border-radius: 20px;
            display: flex;
            flex-direction: column;
            gap: 16px;
            box-shadow: 0 4px 15px rgba(0, 0, 0, 0.01);
            position: relative;
            overflow: hidden;
          }
          .sidebar-title-row {
            display: flex;
            align-items: center;
            gap: 8px;
          }
          .sidebar-lotus-icon {
            width: 22px;
            height: 22px;
            flex-shrink: 0;
          }
          .sidebar-heading {
            font-family: var(--font-sans);
            font-size: 1.05rem;
            color: #111827;
            font-weight: 700 !important;
            margin: 0;
          }
          .toc-list {
            list-style: none;
            padding: 0;
            margin: 0;
            display: flex;
            flex-direction: column;
            gap: 10px;
          }
          .toc-item {
            display: flex;
            align-items: flex-start;
            gap: 8px;
            font-size: 0.85rem;
            color: #4b5563;
            line-height: 1.4;
          }
          .toc-bullet {
            color: #a855f7;
            font-weight: bold;
          }
          .quote-box-card {
            background: linear-gradient(135deg, #faf5ff 0%, #f3e8ff 100%);
            border-color: rgba(168, 85, 247, 0.12);
            text-align: center;
            padding: 28px 20px 20px;
          }
          .quote-icon {
            font-family: var(--font-serif);
            font-size: 3.5rem;
            color: rgba(168, 85, 247, 0.2);
            line-height: 1;
            position: absolute;
            top: 2px;
            left: 20px;
          }
          .sidebar-quote-text {
            font-family: var(--font-serif);
            font-style: italic;
            font-size: 0.95rem;
            color: #581c87;
            margin: 0;
            line-height: 1.5;
            position: relative;
            z-index: 2;
          }
          .quote-lotus-watermark {
            position: absolute;
            right: -10px;
            bottom: -15px;
            width: 80px;
            height: 80px;
            opacity: 0.5;
          }
          .watermark-lotus {
            width: 100%;
            height: 100%;
          }
          .video-blogs-list {
            display: flex;
            flex-direction: column;
            gap: 14px;
          }
          .video-blog-item {
            display: flex;
            align-items: center;
            gap: 12px;
            text-decoration: none;
            color: inherit;
            transition: transform 0.2s ease;
          }
          .video-blog-item:hover {
            transform: translateX(4px);
          }
          .video-thumbnail-wrapper {
            width: 76px;
            height: 48px;
            border-radius: 8px;
            overflow: hidden;
            position: relative;
            background: #f3e8ff;
            flex-shrink: 0;
            border: 1px solid rgba(168, 85, 247, 0.05);
          }
          .video-thumbnail {
            width: 100%;
            height: 100%;
            object-fit: cover;
          }
          .play-button-overlay {
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0, 0, 0, 0.3);
            display: flex;
            align-items: center;
            justify-content: center;
          }
          .video-info {
            display: flex;
            flex-direction: column;
            gap: 2px;
            min-width: 0;
          }
          .video-info h5 {
            font-family: var(--font-sans);
            font-size: 0.8rem;
            font-weight: 600;
            color: #1f2937;
            margin: 0;
            line-height: 1.35;
            display: -webkit-box;
            -webkit-line-clamp: 2;
            -webkit-box-orient: vertical;
            overflow: hidden;
          }
          .video-blog-item:hover h5 {
            color: #7c3aed;
          }
          .video-info span {
            font-size: 0.7rem;
            color: #6b7280;
          }
          .view-all-sidebar-btn {
            width: 100%;
            padding: 10px;
            background: rgba(124, 58, 237, 0.05);
            border: 1px solid rgba(124, 58, 237, 0.15);
            color: #7c3aed;
            font-size: 0.78rem;
            font-weight: 700;
            text-align: center;
            border-radius: 10px;
            cursor: pointer;
            transition: all 0.2s ease;
            text-decoration: none;
          }
          .view-all-sidebar-btn:hover {
            background: #7c3aed;
            color: #ffffff;
          }
          .supporting-images-grid {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 8px;
          }
          .supporting-img-item {
            aspect-ratio: 1;
            border-radius: 8px;
            overflow: hidden;
            border: 1px solid rgba(168, 85, 247, 0.1);
            cursor: pointer;
            background: #faf5ff;
            transition: transform 0.2s ease;
          }
          .supporting-img-item:hover {
            transform: scale(1.05);
          }
          .supporting-gallery-thumbnail {
            width: 100%;
            height: 100%;
            object-fit: cover;
          }
          .booking-cta-card {
            background: linear-gradient(135deg, #581c87 0%, #3b0764 100%);
            border: none;
            color: #ffffff;
            text-align: center;
            padding: 28px 24px;
          }
          .cta-title {
            font-family: var(--font-serif);
            font-size: 1.15rem;
            font-weight: 700;
            color: #ffffff;
            margin: 0;
          }
          .cta-desc {
            font-size: 0.8rem;
            color: rgba(255, 255, 255, 0.85);
            line-height: 1.5;
            margin: 0;
          }
          .cta-btn {
            background: #ffffff;
            color: #581c87;
            padding: 12px;
            border-radius: 10px;
            font-weight: 700;
            font-size: 0.82rem;
            text-decoration: none;
            transition: all 0.2s ease;
            box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
          }
          .cta-btn:hover {
            background: #fdf4ff;
            transform: translateY(-1px);
          }
          .cta-lotus-badge {
            position: absolute;
            left: 50%;
            top: 50%;
            transform: translate(-50%, -50%);
            width: 150px;
            height: 150px;
            pointer-events: none;
          }
          .cta-lotus {
            width: 100%;
            height: 100%;
          }
        `}</style>
      </div>
    );
  }

  // Render Normal Blog / General Details Sidebar
  const authorPhoto = matchedAuthor ? getPractitionerImage(matchedAuthor.image) : "/images/insight_blog.png";
  const authorSpecialty = matchedAuthor ? matchedAuthor.specialty : "Wellness Expert";
  const authorBio = matchedAuthor
    ? matchedAuthor.bio.length > 130
      ? `${matchedAuthor.bio.substring(0, 127)}...`
      : matchedAuthor.bio
    : "Sharing somatic healing practices, meditation guides, and holistic methods to restore energy fields.";

  return (
    <div className="blog-right-sidebar">
      {/* About The Author Profile */}
      {activeBlog && (
        <div className="right-sidebar-card author-profile-card">
          <div className="sidebar-title-row">
            <svg viewBox="0 0 100 100" className="sidebar-lotus-icon">
              <path d="M50 25 C45 45 35 60 50 80 C65 60 55 45 50 25 Z" fill="none" stroke="#a855f7" strokeWidth="4" />
              <path d="M50 80 C35 75 25 60 20 40 C35 50 45 60 50 80 Z" fill="none" stroke="#a855f7" strokeWidth="4" />
              <path d="M50 80 C65 75 75 60 80 40 C65 50 55 60 50 80 Z" fill="none" stroke="#a855f7" strokeWidth="4" />
            </svg>
            <h4 className="sidebar-heading">About The Author</h4>
          </div>

          <div className="author-summary-layout">
            <img src={authorPhoto} alt={activeBlog.author} className="author-avatar-img" />
            <h5 className="author-name-text">{activeBlog.author}</h5>
            <span className="author-specialty-badge">{authorSpecialty}</span>
            <p className="author-bio-desc">{authorBio}</p>
            {matchedAuthor && (
              <Link href={`/team`} className="author-view-profile-btn">
                View Profile
              </Link>
            )}
          </div>
        </div>
      )}

      {/* Most Viewed Blogs */}
      {!activeBlog && (
        <div className="right-sidebar-card">
          <div className="sidebar-title-row">
            <svg viewBox="0 0 100 100" className="sidebar-lotus-icon">
              <path d="M50 25 C45 45 35 60 50 80 C65 60 55 45 50 25 Z" fill="none" stroke="#a855f7" strokeWidth="4" />
              <path d="M50 80 C35 75 25 60 20 40 C35 50 45 60 50 80 Z" fill="none" stroke="#a855f7" strokeWidth="4" />
              <path d="M50 80 C65 75 75 60 80 40 C65 50 55 60 50 80 Z" fill="none" stroke="#a855f7" strokeWidth="4" />
            </svg>
            <h4 className="sidebar-heading">Most Viewed Blogs</h4>
          </div>
          
          <div className="most-viewed-list">
            {mostViewedFallback.map((blog, idx) => (
              <Link key={blog.id} href={`/blog/${blog.id}`} className="most-viewed-item">
                <div className="mv-number-badge">{idx + 1}</div>
                <div className="mv-thumbnail-wrapper">
                  <img src={blog.image} alt={blog.title} className="mv-thumbnail" />
                </div>
                <div className="mv-info">
                  <h5>{blog.title}</h5>
                  <span>{blog.views}</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Related Blogs */}
      {relatedBlogs.length > 0 && (
        <div className="right-sidebar-card">
          <div className="sidebar-title-row">
            <svg viewBox="0 0 100 100" className="sidebar-lotus-icon">
              <path d="M50 25 C45 45 35 60 50 80 C65 60 55 45 50 25 Z" fill="none" stroke="#a855f7" strokeWidth="4" />
              <path d="M50 80 C35 75 25 60 20 40 C35 50 45 60 50 80 Z" fill="none" stroke="#a855f7" strokeWidth="4" />
              <path d="M50 80 C65 75 75 60 80 40 C65 50 55 60 50 80 Z" fill="none" stroke="#a855f7" strokeWidth="4" />
            </svg>
            <h4 className="sidebar-heading">Related Blogs</h4>
          </div>

          <div className="related-blogs-list">
            {relatedBlogs.map((b) => (
              <Link key={b.id} href={`/blog/${b.id}`} className="related-blog-row">
                <div className="related-thumb">
                  <img src={getBlogImage(b.image)} alt={b.title} />
                </div>
                <div className="related-meta-info">
                  <h5>{b.title}</h5>
                  <span>{b.readTime}</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Booking CTA card */}
      <div className="right-sidebar-card booking-cta-card">
        <h4 className="cta-title">Ready to Deepen Your Healing Journey?</h4>
        <p className="cta-desc">
          Our experts are here to guide you every step of the way with somatic advice.
        </p>
        <Link href="/booking" className="cta-btn">
          Book a Consultation
        </Link>
        <div className="cta-lotus-badge">
          <svg viewBox="0 0 100 100" className="cta-lotus">
            <path d="M50 25 C45 45 35 60 50 80 C65 60 55 45 50 25 Z" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="2.5" />
            <path d="M50 80 C35 75 25 60 20 40 C35 50 45 60 50 80 Z" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="2.5" />
            <path d="M50 80 C65 75 75 60 80 40 C65 50 55 60 50 80 Z" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="2.5" />
          </svg>
        </div>
      </div>

      <style jsx>{`
        .blog-right-sidebar {
          display: flex;
          flex-direction: column;
          gap: 20px;
          width: 100%;
        }
        .right-sidebar-card {
          background: #ffffff;
          border: 1px solid rgba(168, 85, 247, 0.08);
          padding: 20px;
          border-radius: 20px;
          display: flex;
          flex-direction: column;
          gap: 16px;
          box-shadow: 0 4px 15px rgba(0, 0, 0, 0.01);
          position: relative;
          overflow: hidden;
        }
        .sidebar-title-row {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .sidebar-lotus-icon {
          width: 22px;
          height: 22px;
          flex-shrink: 0;
        }
        .sidebar-heading {
          font-family: var(--font-sans);
          font-size: 1.05rem;
          color: #111827;
          font-weight: 700 !important;
          margin: 0;
        }
        
        /* Author Card Layout */
        .author-summary-layout {
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          gap: 8px;
        }
        .author-avatar-img {
          width: 80px;
          height: 80px;
          border-radius: 50%;
          object-fit: cover;
          border: 2px solid var(--gold-border);
          box-shadow: 0 4px 10px rgba(0, 0, 0, 0.05);
          margin-bottom: 4px;
        }
        .author-name-text {
          font-family: var(--font-sans);
          font-size: 1rem;
          font-weight: 700;
          color: #1e1b4b;
          margin: 0;
        }
        .author-specialty-badge {
          font-size: 0.72rem;
          font-weight: 600;
          color: #0d9488;
          background: rgba(13, 148, 136, 0.08);
          padding: 2px 8px;
          border-radius: 6px;
          text-transform: capitalize;
        }
        .author-bio-desc {
          font-size: 0.8rem;
          color: #475569;
          line-height: 1.5;
          margin: 4px 0 8px;
        }
        .author-view-profile-btn {
          width: 100%;
          padding: 10px;
          background: #7c3aed;
          color: #ffffff;
          font-size: 0.8rem;
          font-weight: 700;
          text-align: center;
          border-radius: 10px;
          text-decoration: none;
          transition: all 0.2s ease;
        }
        .author-view-profile-btn:hover {
          background: #581c87;
        }

        /* Most Viewed */
        .most-viewed-list {
          display: flex;
          flex-direction: column;
          gap: 14px;
        }
        :global(.most-viewed-item) {
          display: flex;
          align-items: center;
          gap: 12px;
          text-decoration: none;
          color: inherit;
          transition: transform 0.2s ease;
        }
        :global(.most-viewed-item:hover) {
          transform: translateX(4px);
        }
        .mv-number-badge {
          width: 22px;
          height: 22px;
          border-radius: 50%;
          background: #7c3aed;
          color: #ffffff;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 0.7rem;
          font-weight: 700;
          flex-shrink: 0;
        }
        .mv-thumbnail-wrapper {
          width: 52px;
          height: 52px;
          border-radius: 10px;
          overflow: hidden;
          background: #f3e8ff;
          flex-shrink: 0;
          border: 1px solid rgba(168, 85, 247, 0.05);
        }
        .mv-thumbnail {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        .mv-info {
          display: flex;
          flex-direction: column;
          gap: 2px;
          min-width: 0;
        }
        .mv-info h5 {
          font-family: var(--font-sans);
          font-size: 0.8rem;
          font-weight: 600;
          color: #1f2937;
          margin: 0;
          line-height: 1.35;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        .most-viewed-item:hover h5 {
          color: #7c3aed;
        }
        .mv-info span {
          font-size: 0.7rem;
          color: #6b7280;
        }

        /* Related Blogs */
        .related-blogs-list {
          display: flex;
          flex-direction: column;
          gap: 14px;
        }
        .related-blog-row {
          display: flex;
          align-items: center;
          gap: 12px;
          text-decoration: none;
          color: inherit;
          transition: transform 0.2s ease;
        }
        .related-blog-row:hover {
          transform: translateX(4px);
        }
        .related-thumb {
          width: 52px;
          height: 52px;
          border-radius: 10px;
          overflow: hidden;
          background: #f3e8ff;
          flex-shrink: 0;
          border: 1px solid rgba(168, 85, 247, 0.05);
        }
        .related-thumb img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        .related-meta-info {
          display: flex;
          flex-direction: column;
          gap: 2px;
          min-width: 0;
        }
        .related-meta-info h5 {
          font-family: var(--font-sans);
          font-size: 0.8rem;
          font-weight: 600;
          color: #1f2937;
          margin: 0;
          line-height: 1.35;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        .related-blog-row:hover h5 {
          color: #7c3aed;
        }
        .related-meta-info span {
          font-size: 0.7rem;
          color: #6b7280;
        }

        /* Booking Card */
        .booking-cta-card {
          background: linear-gradient(135deg, #581c87 0%, #3b0764 100%);
          border: none;
          color: #ffffff;
          text-align: center;
          padding: 28px 24px;
        }
        .cta-title {
          font-family: var(--font-serif);
          font-size: 1.15rem;
          font-weight: 700;
          color: #ffffff;
          margin: 0;
        }
        .cta-desc {
          font-size: 0.8rem;
          color: rgba(255, 255, 255, 0.85);
          line-height: 1.5;
          margin: 0;
        }
        .cta-btn {
          background: #ffffff;
          color: #581c87;
          padding: 12px;
          border-radius: 10px;
          font-weight: 700;
          font-size: 0.82rem;
          text-decoration: none;
          transition: all 0.2s ease;
          box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
        }
        .cta-btn:hover {
          background: #fdf4ff;
          transform: translateY(-1px);
        }
        .cta-lotus-badge {
          position: absolute;
          left: 50%;
          top: 50%;
          transform: translate(-50%, -50%);
          width: 150px;
          height: 150px;
          pointer-events: none;
        }
        .cta-lotus {
          width: 100%;
          height: 100%;
        }
      `}</style>
    </div>
  );
};

