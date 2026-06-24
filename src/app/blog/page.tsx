"use client";

import React, { useState, useEffect } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import Link from "next/link";

interface Blog {
  id: string;
  title: string;
  category: string;
  author: string;
  content: string;
  date: string;
  readTime: string;
  image: string;
  images?: string[];
  videos?: string[];
}

export const getBlogImage = (img: string) => {
  if (!img) return "/images/insight_blog.png";
  if (img.startsWith("http://") || img.startsWith("https://") || img.startsWith("/")) {
    return img;
  }
  const mappings: Record<string, string> = {
    "amethyst_crystals": "/images/insight_blog.png",
    "chakras_guide": "/images/insight_space.png",
    "breathing_stress": "/images/insight_video.png",
  };
  return mappings[img] || "/images/insight_blog.png";
};

export default function BlogListingPage() {
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [filteredBlogs, setFilteredBlogs] = useState<Blog[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [loading, setLoading] = useState(true);

  // Load blogs
  useEffect(() => {
    async function loadBlogs() {
      try {
        const res = await fetch("/api/blogs");
        const json = await res.json();
        if (json.success) {
          setBlogs(json.data);
          setFilteredBlogs(json.data);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadBlogs();
  }, []);

  // Filter blogs
  useEffect(() => {
    let result = [...blogs];
    if (activeTab !== "all") {
      result = result.filter(b => b.category.toLowerCase() === activeTab.toLowerCase());
    }
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(b => b.title.toLowerCase().includes(q) || b.content.toLowerCase().includes(q));
    }
    setFilteredBlogs(result);
  }, [blogs, activeTab, searchQuery]);

  const categories = [
    "all",
    ...Array.from(new Set(blogs.map((b) => b.category).filter(Boolean)))
  ];

  return (
    <div className="blog-posts-page">
      {/* Header */}
      <section className="blog-header">
        <h1 className="blog-title">Spiritual Guidance Blog</h1>
      </section>

      {/* Control panel (Tabs & Search combined) */}
      <section className="blog-controls-section glass-panel">
        <div className="blog-tabs">
          {categories.map(cat => (
            <button
              key={cat}
              className={`blog-tab-btn ${activeTab === cat ? "active" : ""}`}
              onClick={() => setActiveTab(cat)}
            >
              {cat === "all" ? "All Writings" : cat}
            </button>
          ))}
        </div>

        <div className="blog-search-wrapper">
          <svg className="search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8"></circle>
            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
          </svg>
          <input
            type="text"
            placeholder="Search articles..."
            className="search-input"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </section>

      {/* Listings Grid */}
      <section className="blog-grid-section">
        {loading ? (
          <p style={{ textAlign: "center", color: "hsl(var(--text-muted))", padding: "40px 0" }}>Retrieving sacred scrolls...</p>
        ) : filteredBlogs.length === 0 ? (
          <div className="empty-state glass-card" style={{ padding: "40px", textAlign: "center" }}>
            <p>No articles found matching your query metrics.</p>
          </div>
        ) : (
          <div className="blog-cards-grid">
            {filteredBlogs.map(post => (
              <Card key={post.id} className="blog-card" variant="glass">
                <div className="blog-card-image-container">
                  <img
                    src={getBlogImage(post.image)}
                    alt={post.title}
                    className="blog-card-img"
                  />
                  <span className="blog-card-badge">{post.category}</span>
                </div>

                <div className="blog-card-content">
                  <div className="blog-card-header-info">
                    <span className="blog-card-time">⏱️ {post.readTime}</span>
                  </div>

                  <h3 className="blog-card-title">{post.title}</h3>
                  <p className="blog-card-excerpt">
                    {post.content.substring(0, 130)}...
                  </p>

                  <div className="blog-card-footer">
                    <span className="blog-card-author">By <strong>{post.author}</strong></span>
                    <span className="blog-card-date">{post.date}</span>
                  </div>

                  <div className="blog-card-action">
                    <Link href={`/blog/${post.id}`}>
                      <Button variant="gold-outline" size="sm">
                        Read Article
                      </Button>
                    </Link>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </section>

      <style jsx>{`
        .blog-posts-page {
          display: flex;
          flex-direction: column;
          gap: 36px;
          width: 100%;
        }
        .blog-header {
          text-align: center;
          padding: 8px 0 0;
        }
        .blog-title {
          font-size: 2.4rem;
          color: #4c1d95;
          margin-bottom: 8px;
          text-align: center;
          font-weight: 700;
          letter-spacing: -0.01em;
        }
        .blog-subtitle {
          font-size: 1rem;
          color: hsl(var(--text-muted));
          text-align: center;
          max-width: 650px;
          margin: 0 auto;
        }
        .blog-controls-section {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 24px;
          padding: 12px 24px;
          border-radius: 20px;
          width: 100%;
        }
        .blog-tabs {
          display: flex;
          gap: 8px;
          align-items: center;
        }
        .blog-tab-btn {
          background: transparent;
          border: 1px solid transparent;
          color: hsl(var(--text-muted));
          font-family: var(--font-serif);
          font-size: 0.85rem;
          font-weight: 600;
          padding: 6px 14px;
          border-radius: 30px;
          cursor: pointer;
          letter-spacing: 0.03em;
          text-transform: uppercase;
          transition: var(--transition-fast);
        }
        .blog-tab-btn:hover {
          color: #7c3aed;
          background: rgba(168, 85, 247, 0.04);
        }
        .blog-tab-btn.active {
          color: #7c3aed;
          background: linear-gradient(135deg, rgba(251, 207, 232, 0.25) 0%, rgba(233, 213, 255, 0.25) 100%);
          border-color: rgba(168, 85, 247, 0.2);
          box-shadow: 0 4px 10px rgba(168, 85, 247, 0.05);
        }
        .blog-search-wrapper {
          display: flex;
          align-items: center;
          position: relative;
          width: 260px;
        }
        .search-icon {
          position: absolute;
          left: 12px;
          color: hsl(var(--text-muted));
          pointer-events: none;
        }
        .blog-search-wrapper :global(.search-input) {
          width: 100%;
          padding: 8px 12px 8px 36px;
          border-radius: 30px;
          background: rgba(255, 255, 255, 0.6);
          border: 1px solid var(--border-glass);
          color: hsl(var(--text-cream));
          font-family: var(--font-sans);
          font-size: 0.85rem;
          outline: none;
          transition: var(--transition-smooth);
        }
        .blog-search-wrapper :global(.search-input):focus {
          background: rgba(255, 255, 255, 0.95);
          border-color: #7c3aed;
          box-shadow: 0 0 10px rgba(124, 58, 237, 0.15);
        }
        .blog-cards-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
          gap: 28px;
        }
        .blog-card {
          display: flex;
          flex-direction: column;
          overflow: hidden;
          padding: 0 !important;
          border-radius: 20px;
        }
        .blog-card-image-container {
          position: relative;
          width: 100%;
          height: 180px;
          overflow: hidden;
        }
        .blog-card-img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          transition: transform 0.6s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .blog-card:hover .blog-card-img {
          transform: scale(1.06);
        }
        .blog-card-badge {
          position: absolute;
          top: 12px;
          left: 12px;
          background: rgba(255, 255, 255, 0.9);
          backdrop-filter: blur(4px);
          border: 1px solid rgba(168, 85, 247, 0.2);
          color: #7c3aed;
          font-size: 0.7rem;
          font-weight: 700;
          padding: 3px 8px;
          border-radius: 6px;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
        }
        .blog-card-content {
          padding: 20px;
          display: flex;
          flex-direction: column;
          flex: 1;
        }
        .blog-card-header-info {
          display: flex;
          justify-content: flex-end;
          margin-bottom: 8px;
        }
        .blog-card-time {
          font-size: 0.72rem;
          color: hsl(var(--text-muted));
          font-weight: 500;
        }
        .blog-card-title {
          font-family: var(--font-serif);
          font-size: 1.25rem;
          color: #4c1d95;
          margin-bottom: 10px;
          line-height: 1.35;
          font-weight: 600;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        .blog-card-excerpt {
          font-size: 0.85rem;
          line-height: 1.5;
          color: hsl(var(--text-muted));
          margin-bottom: 16px;
          flex: 1;
          display: -webkit-box;
          -webkit-line-clamp: 3;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        .blog-card-footer {
          display: flex;
          justify-content: space-between;
          font-size: 0.75rem;
          color: hsl(var(--text-muted));
          border-top: 1px solid rgba(0, 0, 0, 0.05);
          padding-top: 10px;
          margin-bottom: 14px;
        }
        .blog-card-author {
          font-weight: 500;
        }
        .blog-card-action {
          width: 100%;
        }
        @media (max-width: 968px) {
          .blog-controls-section {
            flex-direction: column;
            gap: 16px;
            align-items: stretch;
            padding: 16px;
          }
          .blog-tabs {
            justify-content: center;
            flex-wrap: wrap;
          }
          .blog-search-wrapper {
            width: 100%;
          }
        }
        @media (max-width: 640px) {
          .blog-tab-btn {
            font-size: 0.78rem;
            padding: 5px 10px;
          }
        }
      `}</style>
    </div>
  );
}
