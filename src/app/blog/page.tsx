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
}

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

  const categories = ["all", "Crystals", "Energy Healing", "Mindfulness"];

  return (
    <div className="blog-posts-page">
      {/* Header */}
      <section className="blog-header">
        <h1 className="blog-title">Spiritual Guidance Blog</h1>
        <p className="blog-subtitle">
          Exploring the metaphysics of energy nodes, sound meditation rhythms, and natural mineral properties.
        </p>

        {/* Search bar */}
        <div className="blog-search-wrapper">
          <input
            type="text"
            placeholder="Search articles..."
            className="glass-input search-input"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </section>

      {/* Categories Tabs */}
      <section className="blog-tabs-section">
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
      </section>

      {/* Listings Grid */}
      <section className="blog-grid-section">
        {loading ? (
          <p style={{ textAlign: "center" }}>Retrieving sacred scrolls...</p>
        ) : filteredBlogs.length === 0 ? (
          <div className="empty-state glass-card" style={{ padding: "40px", textAlign: "center" }}>
            <p>No articles found matching your query metrics.</p>
          </div>
        ) : (
          <div className="blog-cards-grid">
            {filteredBlogs.map(post => (
              <Card key={post.id} className="blog-card" variant="glass">
                <div className="blog-card-meta">
                  <span className="blog-card-cat">{post.category}</span>
                  <span className="blog-card-time">{post.readTime}</span>
                </div>

                <h3 className="blog-card-title">{post.title}</h3>
                <p className="blog-card-excerpt">
                  {post.content.substring(0, 150)}...
                </p>

                <div className="blog-card-footer">
                  <span className="blog-card-author">By {post.author}</span>
                  <span className="blog-card-date">{post.date}</span>
                </div>

                <div className="blog-card-action">
                  <Link href={`/blog/${post.id}`}>
                    <Button variant="gold-outline" size="sm">
                      Read Article
                    </Button>
                  </Link>
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
          gap: 40px;
          width: 100%;
        }
        .blog-title {
          font-size: 2.8rem;
          color: #4c1d95;
          margin-bottom: 12px;
          text-align: center;
        }
        .blog-subtitle {
          font-size: 1.05rem;
          color: hsl(var(--text-muted));
          text-align: center;
          max-width: 650px;
          margin: 0 auto 32px;
        }
        .blog-search-wrapper {
          display: flex;
          justify-content: center;
          width: 100%;
        }
        .blog-search-wrapper :global(.search-input) {
          max-width: 480px;
          border-radius: 99px;
          text-align: center;
          border: 1px solid var(--gold-border);
        }
        .blog-tabs {
          display: flex;
          justify-content: center;
          gap: 16px;
          border-bottom: 1.5px solid rgba(0,0,0,0.06);
          padding-bottom: 16px;
        }
        .blog-tab-btn {
          background: transparent;
          border: none;
          color: hsl(var(--text-muted));
          font-family: var(--font-serif);
          font-size: 0.95rem;
          font-weight: 600;
          padding: 8px 16px;
          cursor: pointer;
          letter-spacing: 0.05em;
          text-transform: uppercase;
          transition: var(--transition-fast);
          position: relative;
        }
        .blog-tab-btn:hover {
          color: #7c3aed;
        }
        .blog-tab-btn.active {
          color: #7c3aed;
        }
        .blog-tab-btn.active::after {
          content: '';
          position: absolute;
          bottom: -17.5px;
          left: 0;
          right: 0;
          height: 2px;
          background: #7c3aed;
          box-shadow: 0 0 10px rgba(124, 58, 237, 0.4);
        }
        .blog-cards-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
          gap: 32px;
        }
        .blog-card {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        .blog-card-meta {
          display: flex;
          justify-content: space-between;
          font-size: 0.75rem;
          font-weight: 600;
        }
        .blog-card-cat {
          color: #0d9488;
          text-transform: uppercase;
        }
        .blog-card-time {
          color: hsl(var(--text-muted));
        }
        .blog-card-title {
          font-size: 1.3rem;
          color: #4c1d95;
        }
        .blog-card-excerpt {
          font-size: 0.88rem;
          line-height: 1.6;
          flex: 1;
        }
        .blog-card-footer {
          display: flex;
          justify-content: space-between;
          font-size: 0.78rem;
          color: hsl(var(--text-muted));
          border-top: 1px solid rgba(0,0,0,0.05);
          padding-top: 12px;
        }
        .blog-card-action {
          margin-top: 4px;
        }
        @media (max-width: 640px) {
          .blog-tabs {
            flex-wrap: wrap;
            gap: 8px;
          }
        }
      `}</style>
    </div>
  );
}
