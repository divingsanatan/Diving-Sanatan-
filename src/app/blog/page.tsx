"use client";

import React, { useState, useEffect } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import Link from "next/link";
import { useBlog } from "./BlogContext";
import { Carousel } from "@/components/ui/Carousel";

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
  section?: string | null;
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
  const { searchQuery, activeCategory, setActiveCategory } = useBlog();
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

  // Filter blogs based on category & search query
  useEffect(() => {
    let result = [...blogs];
    if (activeCategory !== "all") {
      result = result.filter(b => b.category.toLowerCase() === activeCategory.toLowerCase());
    }
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(b => b.title.toLowerCase().includes(q) || b.content.toLowerCase().includes(q));
    }
    setFilteredBlogs(result);
  }, [blogs, activeCategory, searchQuery]);

  const categories = [
    "all",
    ...Array.from(new Set(blogs.map((b) => b.category).filter(Boolean)))
  ];

  // Separate blogs into sections for the default landing state (when no filter is active)
  const recommendedBlogs = blogs.filter(b => b.section === "recommended");
  const practiceBlogs = blogs.filter(b => b.section === "practice");
  const discussBlogs = blogs.filter(b => b.section === "discuss");
  const regularBlogs = blogs.filter(
    b => !b.section || (b.section !== "recommended" && b.section !== "practice" && b.section !== "discuss")
  );

  const renderBlogCard = (post: Blog) => (
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
          {post.content.substring(0, 120)}...
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
  );

  const isFilteringActive = activeCategory !== "all" || searchQuery !== "";

  return (
    <div className="blog-posts-page">
      {/* Header */}
      <section className="blog-header">
        <h1 className="blog-title">Spiritual Guidance Blog</h1>
      </section>

      {/* Top Categories Filter */}
      <section className="blog-controls-section glass-panel">
        <div className="blog-tabs">
          {categories.map(cat => (
            <button
              key={cat}
              className={`blog-tab-btn ${activeCategory === cat ? "active" : ""}`}
              onClick={() => setActiveCategory(cat)}
            >
              {cat === "all" ? "All Writings" : cat}
            </button>
          ))}
        </div>
      </section>

      {/* Listings Grid */}
      <section className="blog-content-section">
        {loading ? (
          <p style={{ textAlign: "center", color: "hsl(var(--text-muted))", padding: "80px 0" }}>Retrieving sacred scrolls...</p>
        ) : isFilteringActive ? (
          // FILTERED LISTING VIEW (Flat Grid)
          <div className="filtered-results-wrapper">
            <div className="results-header">
              <h2 className="section-title">
                {searchQuery
                  ? `Search Results for "${searchQuery}"`
                  : `${activeCategory.toUpperCase()} Articles`
                }
              </h2>
              <span className="results-count">({filteredBlogs.length} articles found)</span>
            </div>

            {filteredBlogs.length === 0 ? (
              <div className="empty-state glass-card" style={{ padding: "40px", textAlign: "center" }}>
                <p>No articles found matching your query metrics.</p>
              </div>
            ) : (
              <div className="blog-cards-grid">
                {filteredBlogs.map(post => renderBlogCard(post))}
              </div>
            )}
          </div>
        ) : (
          // DYNAMIC HOME SECTIONS VIEW
          <div className="dashboard-sections-wrapper">
            {/* Recommended Blogs Section */}
            {recommendedBlogs.length > 0 && (
              <section className="blog-showcase-section">
                <h2 className="section-title">Recommended Readings</h2>
                <div className="blog-cards-grid">
                  {recommendedBlogs.map(post => renderBlogCard(post))}
                </div>
              </section>
            )}

            {/* Practice with us Carousel */}
            {practiceBlogs.length > 0 && (
              <section className="blog-showcase-section">
                <Carousel title="Practice With Us">
                  {practiceBlogs.map(post => renderBlogCard(post))}
                </Carousel>
              </section>
            )}

            {/* Discuss with us Carousel */}
            {discussBlogs.length > 0 && (
              <section className="blog-showcase-section">
                <Carousel title="Discuss With Us">
                  {discussBlogs.map(post => renderBlogCard(post))}
                </Carousel>
              </section>
            )}

            {/* General Feed */}
            {regularBlogs.length > 0 && (
              <section className="blog-showcase-section">
                <h2 className="section-title">Latest Wisdom</h2>
                <div className="blog-cards-grid">
                  {regularBlogs.map(post => renderBlogCard(post))}
                </div>
              </section>
            )}

            {blogs.length === 0 && (
              <div className="empty-state glass-card" style={{ padding: "40px", textAlign: "center" }}>
                <p>No articles currently published in the catalog.</p>
              </div>
            )}
          </div>
        )}
      </section>

      <style jsx>{`
        .blog-posts-page {
          display: flex;
          flex-direction: column;
          gap: 32px;
          width: 100%;
        }
        .blog-header {
          text-align: center;
          padding: 8px 0 0;
        }
        .blog-title {
          font-size: 2.2rem;
          color: #4c1d95;
          margin-bottom: 4px;
          text-align: center;
          font-weight: 700;
          letter-spacing: -0.01em;
        }
        .blog-controls-section {
          display: flex;
          justify-content: center;
          align-items: center;
          padding: 10px 20px;
          border-radius: 20px;
          width: 100%;
        }
        .blog-tabs {
          display: flex;
          gap: 8px;
          align-items: center;
          flex-wrap: wrap;
          justify-content: center;
        }
        .blog-tab-btn {
          background: transparent;
          border: 1px solid transparent;
          color: hsl(var(--text-muted));
          font-family: var(--font-serif);
          font-size: 0.85rem;
          font-weight: 600;
          padding: 6px 16px;
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
        .results-header {
          display: flex;
          align-items: baseline;
          gap: 12px;
          margin-bottom: 20px;
        }
        .results-count {
          font-size: 0.85rem;
          color: hsl(var(--text-muted));
        }
        .section-title {
          font-family: var(--font-serif);
          font-size: 1.6rem;
          color: #4c1d95;
          margin-bottom: 16px;
          font-weight: 700;
        }
        .blog-showcase-section {
          margin-bottom: 40px;
        }
        .blog-showcase-section:last-child {
          margin-bottom: 0;
        }
        .blog-cards-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
          gap: 24px;
        }
        :global(.blog-card) {
          display: flex;
          flex-direction: column;
          overflow: hidden;
          padding: 0 !important;
          border-radius: 16px;
          height: 100%;
        }
        :global(.blog-card-image-container) {
          position: relative;
          width: 100%;
          height: 160px;
          overflow: hidden;
        }
        :global(.blog-card-img) {
          width: 100%;
          height: 100%;
          object-fit: cover;
          transition: transform 0.6s cubic-bezier(0.16, 1, 0.3, 1);
        }
        :global(.blog-card:hover .blog-card-img) {
          transform: scale(1.06);
        }
        :global(.blog-card-badge) {
          position: absolute;
          top: 12px;
          left: 12px;
          background: rgba(255, 255, 255, 0.9);
          backdrop-filter: blur(4px);
          border: 1px solid rgba(168, 85, 247, 0.2);
          color: #7c3aed;
          font-size: 0.68rem;
          font-weight: 700;
          padding: 3px 8px;
          border-radius: 6px;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
        }
        :global(.blog-card-content) {
          padding: 16px;
          display: flex;
          flex-direction: column;
          flex: 1;
        }
        :global(.blog-card-header-info) {
          display: flex;
          justify-content: flex-end;
          margin-bottom: 6px;
        }
        :global(.blog-card-time) {
          font-size: 0.7rem;
          color: hsl(var(--text-muted));
          font-weight: 500;
        }
        :global(.blog-card-title) {
          font-family: var(--font-serif);
          font-size: 1.15rem;
          color: #4c1d95;
          margin-bottom: 8px;
          line-height: 1.35;
          font-weight: 600;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
          min-height: 3.1em;
        }
        :global(.blog-card-excerpt) {
          font-size: 0.8rem;
          line-height: 1.45;
          color: hsl(var(--text-muted));
          margin-bottom: 12px;
          flex: 1;
          display: -webkit-box;
          -webkit-line-clamp: 3;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        :global(.blog-card-footer) {
          display: flex;
          justify-content: space-between;
          font-size: 0.72rem;
          color: hsl(var(--text-muted));
          border-top: 1px solid rgba(0, 0, 0, 0.05);
          padding-top: 8px;
          margin-bottom: 12px;
        }
        :global(.blog-card-author) {
          font-weight: 500;
        }
        :global(.blog-card-action) {
          width: 100%;
        }
        @media (max-width: 968px) {
          .blog-controls-section {
            padding: 12px;
          }
        }
      `}</style>
    </div>
  );
}
