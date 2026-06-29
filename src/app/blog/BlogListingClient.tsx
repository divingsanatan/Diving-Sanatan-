"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useBlog } from "./BlogContext";
import { Service } from "@/types/database";
import { 
  Flower, Sparkles, Heart, Volume2, User, 
  Search, Monitor, Play, Compass, RefreshCw,
  ChevronLeft, ChevronRight, BookOpen, Clock, Calendar
} from "lucide-react";

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

export default function BlogListingPage() {
  const router = useRouter();
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [filteredBlogs, setFilteredBlogs] = useState<Blog[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const { searchQuery, activeCategory } = useBlog();
  const [loading, setLoading] = useState(true);

  const servicesScrollRef = useRef<HTMLDivElement>(null);

  // Load blogs and services
  useEffect(() => {
    async function loadData() {
      try {
        const [blogsRes, servicesRes] = await Promise.all([
          fetch(`/api/blogs?t=${Date.now()}`),
          fetch(`/api/services?t=${Date.now()}`),
        ]);
        const json = await blogsRes.json();
        const servicesJson = await servicesRes.json();
        if (json.success) {
          setBlogs(json.data);
          setFilteredBlogs(json.data);
        }
        if (servicesJson.success) {
          setServices(servicesJson.data);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
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

  const scrollCarousel = (ref: React.RefObject<HTMLDivElement | null>, direction: "left" | "right") => {
    if (ref.current) {
      const scrollAmount = 240;
      ref.current.scrollBy({
        left: direction === "left" ? -scrollAmount : scrollAmount,
        behavior: "smooth"
      });
    }
  };

  const getServiceIcon = (name: string) => {
    const n = name.toLowerCase();
    if (n.includes("chakra")) return <Flower size={20} strokeWidth={1.5} />;
    if (n.includes("aura") || n.includes("scanning")) return <Sparkles size={20} strokeWidth={1.5} />;
    if (n.includes("reiki")) return <Heart size={20} strokeWidth={1.5} />;
    if (n.includes("sound")) return <Volume2 size={20} strokeWidth={1.5} />;
    return <User size={20} strokeWidth={1.5} />;
  };

  const getServiceTagline = (name: string) => {
    const n = name.toLowerCase();
    if (n.includes("chakra")) return "Balance & Align";
    if (n.includes("aura") || n.includes("scanning")) return "Discover Your Energy";
    if (n.includes("reiki")) return "Energy Restoration";
    if (n.includes("sound")) return "Vibrational Balance";
    if (n.includes("guidance") || n.includes("personal")) return "1:1 Consultations";
    return "Holistic Support";
  };



  const renderBlogCard = (post: Blog) => (
    <div key={post.id} style={{ display: 'block', width: '100%', minWidth: 0 }}>
      <Link href={`/blog/${post.id}`} style={{ display: 'block', textDecoration: 'none', color: 'inherit', width: '100%' }}>
        <div className="blog-item-card">
          <div className="blog-card-media-wrapper">
            <img 
              src={post.image || "/images/insight_blog.png"} 
              alt={post.title} 
              className="blog-media-img" 
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.src = "/images/insight_blog.png";
                target.onerror = null;
              }}
            />
            <span className="blog-badge-floating-left">{post.category}</span>
            <span className="blog-badge-floating-right">{post.readTime || (post as any).read_time || '5 min read'}</span>
          </div>
          <div className="blog-card-body">
            <h4 className="blog-card-title">{post.title}</h4>
            <p className="blog-card-desc">{post.content.replace(/<[^>]*>/g, '').substring(0, 100)}...</p>
            <div className="blog-author-row">
              <div className="author-avatar">{post.author.charAt(0)}</div>
              <div className="author-details">
                <span className="author-name">{post.author}</span>
                <span className="author-separator">•</span>
                <span className="blog-date">{post.date}</span>
              </div>
            </div>
          </div>
        </div>
      </Link>
    </div>
  );

  const isFilteringActive = activeCategory !== "all" || searchQuery !== "";

  return (
    <div className="blog-center-dashboard">
      {/* Title Header */}
      <div className="blog-welcome-row">
        <svg viewBox="0 0 100 100" className="blog-title-lotus">
          <path d="M50 25 C45 45 35 60 50 80 C65 60 55 45 50 25 Z" fill="none" stroke="#a855f7" strokeWidth="4" />
          <path d="M50 80 C35 75 25 60 20 40 C35 50 45 60 50 80 Z" fill="none" stroke="#a855f7" strokeWidth="4" />
          <path d="M50 80 C65 75 75 60 80 40 C65 50 55 60 50 80 Z" fill="none" stroke="#a855f7" strokeWidth="4" />
          <path d="M50 80 C30 80 10 70 5 55 C20 65 35 70 50 80 Z" fill="none" stroke="#a855f7" strokeWidth="4" />
          <path d="M50 80 C70 80 90 70 95 55 C80 65 65 70 50 80 Z" fill="none" stroke="#a855f7" strokeWidth="4" />
        </svg>
        <div className="welcome-text">
          <h1 className="welcome-heading">Welcome to Our Blog</h1>
          <p className="welcome-subheading">Explore wisdom, practices, and real stories to elevate your healing journey.</p>
        </div>
      </div>

      {loading ? (
        <p className="loading-text">Retrieving sacred scrolls...</p>
      ) : isFilteringActive ? (
        // FILTERED SEARCH RESULTS VIEW
        <div className="filtered-results-container">
          <div className="results-header-row">
            <h3 className="section-title">
              {searchQuery ? `Search Results for "${searchQuery}"` : `${activeCategory} Articles`}
            </h3>
            <span className="results-count">({filteredBlogs.length} articles found)</span>
          </div>

          {filteredBlogs.length === 0 ? (
            <div className="empty-results-box">
              <p>No articles found matching your query metrics.</p>
            </div>
          ) : (
            <div className="latest-posts-grid">
              {filteredBlogs.map(post => renderBlogCard(post))}
            </div>
          )}
        </div>
      ) : (
        // DEFAULT LANDING STATE DASHBOARD
        <div className="dashboard-content-stack">
          
          {/* Hero Banner Card */}
          <div className="blog-hero-banner">
            <div className="banner-text-content">
              <span className="banner-tagline">HEAL. GROW. TRANSFORM.</span>
              <h2 className="banner-main-title">Insights for Your<br />Holistic Journey</h2>
              <button onClick={() => router.push("/services")} className="banner-explore-btn">
                Explore All Articles
              </button>
            </div>
            
            {/* Background lotus outlines */}
            <div className="banner-lotus-watermark">
              <svg viewBox="0 0 100 100" className="banner-watermark-svg">
                <path d="M50 25 C45 45 35 60 50 80 C65 60 55 45 50 25 Z" fill="none" stroke="#a855f7" strokeWidth="2.5" strokeOpacity="0.4" />
                <path d="M50 80 C35 75 25 60 20 40 C35 50 45 60 50 80 Z" fill="none" stroke="#a855f7" strokeWidth="2.5" strokeOpacity="0.4" />
                <path d="M50 80 C65 75 75 60 80 40 C65 50 55 60 50 80 Z" fill="none" stroke="#a855f7" strokeWidth="2.5" strokeOpacity="0.4" />
                <path d="M50 80 C30 80 10 70 5 55 C20 65 35 70 50 80 Z" fill="none" stroke="#a855f7" strokeWidth="2.5" strokeOpacity="0.4" />
                <path d="M50 80 C70 80 90 70 95 55 C80 65 65 70 50 80 Z" fill="none" stroke="#a855f7" strokeWidth="2.5" strokeOpacity="0.4" />
              </svg>
            </div>
            <div className="banner-image-panel" />
          </div>

          {/* Our Services Carousel Section */}
          <div className="dashboard-section">
            <div className="section-header-row">
              <div className="section-title-wrap">
                <svg viewBox="0 0 100 100" className="section-title-lotus">
                  <path d="M50 25 C45 45 35 60 50 80 C65 60 55 45 50 25 Z" fill="none" stroke="#a855f7" strokeWidth="4" />
                  <path d="M50 80 C35 75 25 60 20 40 C35 50 45 60 50 80 Z" fill="none" stroke="#a855f7" strokeWidth="4" />
                  <path d="M50 80 C65 75 75 60 80 40 C65 50 55 60 50 80 Z" fill="none" stroke="#a855f7" strokeWidth="4" />
                  <path d="M50 80 C30 80 10 70 5 55 C20 65 35 70 50 80 Z" fill="none" stroke="#a855f7" strokeWidth="4" />
                  <path d="M50 80 C70 80 90 70 95 55 C80 65 65 70 50 80 Z" fill="none" stroke="#a855f7" strokeWidth="4" />
                </svg>
                <h3 className="section-title">Our Services</h3>
              </div>
              <div className="carousel-nav-arrows">
                <button onClick={() => scrollCarousel(servicesScrollRef, "left")} className="arrow-btn" aria-label="Previous">
                  <ChevronLeft size={16} />
                </button>
                <button onClick={() => scrollCarousel(servicesScrollRef, "right")} className="arrow-btn" aria-label="Next">
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>

            <div ref={servicesScrollRef} className="horizontal-scroll-container">
              {services.map((service) => (
                <div key={service.id} onClick={() => router.push("/services")} className="service-simple-card">
                  <div className="service-icon-circle">
                    {getServiceIcon(service.name)}
                  </div>
                  <h4 className="service-card-name">{service.name}</h4>
                  <span className="service-card-tagline">{getServiceTagline(service.name)}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Latest Blog Posts Grid Section */}
          <div className="dashboard-section">
            <div className="section-header-row">
              <div className="section-title-wrap">
                <svg viewBox="0 0 100 100" className="section-title-lotus">
                  <path d="M50 25 C45 45 35 60 50 80 C65 60 55 45 50 25 Z" fill="none" stroke="#a855f7" strokeWidth="4" />
                  <path d="M50 80 C35 75 25 60 20 40 C35 50 45 60 50 80 Z" fill="none" stroke="#a855f7" strokeWidth="4" />
                  <path d="M50 80 C65 75 75 60 80 40 C65 50 55 60 50 80 Z" fill="none" stroke="#a855f7" strokeWidth="4" />
                  <path d="M50 80 C30 80 10 70 5 55 C20 65 35 70 50 80 Z" fill="none" stroke="#a855f7" strokeWidth="4" />
                  <path d="M50 80 C70 80 90 70 95 55 C80 65 65 70 50 80 Z" fill="none" stroke="#a855f7" strokeWidth="4" />
                </svg>
                <h3 className="section-title">Latest Blog Posts</h3>
              </div>
            </div>

            {blogs.length === 0 ? (
              <div className="empty-results-box">
                <p>No articles currently published in the catalog.</p>
              </div>
            ) : (
              <div className="latest-posts-grid">
                {blogs.map(post => renderBlogCard(post))}
              </div>
            )}
          </div>

        </div>
      )}

      <style jsx>{`
        .blog-center-dashboard {
          display: flex;
          flex-direction: column;
          gap: 28px;
          width: 100%;
        }

        /* Title Welcome Heading */
        .blog-welcome-row {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 8px;
        }
        .blog-title-lotus {
          width: 38px;
          height: 38px;
          flex-shrink: 0;
        }
        .welcome-text {
          display: flex;
          flex-direction: column;
        }
        .welcome-heading {
          font-family: var(--font-sans);
          font-size: 1.6rem;
          color: #111827;
          font-weight: 800;
          margin: 0;
          line-height: 1.2;
        }
        .welcome-subheading {
          font-size: 0.82rem;
          color: #6b7280;
          margin: 4px 0 0;
        }
        .loading-text {
          font-size: 0.85rem;
          color: #6b7280;
        }

        /* Dashboard Content Stack */
        .dashboard-content-stack {
          display: flex;
          flex-direction: column;
          gap: 32px;
          width: 100%;
          max-width: 100%;
        }

        /* Hero Banner Card */
        .blog-hero-banner {
          width: 100%;
          border-radius: 24px;
          background: linear-gradient(135deg, #f3e8ff 0%, #faf5ff 100%);
          border: 1px solid rgba(168, 85, 247, 0.1);
          padding: 32px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          position: relative;
          min-height: 200px;
          overflow: hidden;
        }
        .banner-text-content {
          z-index: 2;
          max-width: 55%;
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          gap: 12px;
        }
        .banner-tagline {
          font-family: var(--font-sans);
          font-size: 0.72rem;
          font-weight: 800;
          color: #7c3aed;
          letter-spacing: 0.08em;
          text-transform: uppercase;
        }
        .banner-main-title {
          font-family: var(--font-serif);
          font-size: 1.85rem;
          color: #111827;
          font-weight: 700;
          line-height: 1.2;
          margin: 0;
        }
        .banner-explore-btn {
          padding: 8px 18px;
          border-radius: 20px;
          background: #4c1d95;
          color: #ffffff;
          border: none;
          font-size: 0.76rem;
          font-weight: 700;
          cursor: pointer;
          transition: background 0.2s ease;
          margin-top: 6px;
        }
        .banner-explore-btn:hover {
          background: #3b0764;
        }
        .banner-lotus-watermark {
          position: absolute;
          left: 45%;
          bottom: -15px;
          width: 120px;
          height: 120px;
          z-index: 1;
        }
        .banner-watermark-svg {
          width: 100%;
          height: 100%;
        }
        .banner-image-panel {
          position: absolute;
          top: 0;
          right: 0;
          bottom: 0;
          width: 44%;
          background-image: url("/images/blog_hero_bg.png");
          background-size: cover;
          background-position: right center;
          z-index: 1;
          mask-image: linear-gradient(to left, rgba(0,0,0,1) 60%, rgba(0,0,0,0) 100%);
          -webkit-mask-image: linear-gradient(to left, rgba(0,0,0,1) 60%, rgba(0,0,0,0) 100%);
        }

        /* Dashboard Sections */
        .dashboard-section {
          display: flex;
          flex-direction: column;
          gap: 16px;
          width: 100%;
          max-width: 100%;
        }
        .section-header-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          width: 100%;
        }
        .section-title-wrap {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .section-title-lotus {
          width: 24px;
          height: 24px;
          flex-shrink: 0;
        }
        .section-title {
          font-family: var(--font-serif);
          font-size: 1.25rem;
          color: #111827;
          font-weight: 700 !important;
          margin: 0;
        }
        .carousel-nav-arrows {
          display: flex;
          gap: 6px;
        }
        .arrow-btn {
          width: 28px;
          height: 28px;
          border-radius: 50%;
          border: 1px solid rgba(168, 85, 247, 0.15);
          background: #ffffff;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #7c3aed;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        .arrow-btn:hover {
          background: #eedffd;
          border-color: rgba(168, 85, 247, 0.3);
        }

        /* Carousels Horizontal Scroll */
        .horizontal-scroll-container {
          display: flex;
          gap: 16px;
          overflow-x: auto;
          scrollbar-width: none; /* Firefox */
          -ms-overflow-style: none; /* IE 10+ */
          padding: 4px 4px 16px;
          margin: -4px -4px -16px;
        }
        .horizontal-scroll-container::-webkit-scrollbar {
          display: none; /* Safari and Chrome */
        }
        .service-simple-card {
          flex: 0 0 170px;
          width: 170px;
          padding: 20px 16px;
          border-radius: 20px;
          background: #ffffff;
          border: 1px solid rgba(168, 85, 247, 0.08);
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          cursor: pointer;
          transition: transform 0.25s ease, box-shadow 0.25s ease, border-color 0.25s ease;
        }
        .service-simple-card:hover {
          transform: translateY(-4px);
          border-color: rgba(168, 85, 247, 0.2);
          box-shadow: 0 10px 25px rgba(124, 58, 237, 0.06);
        }
        .service-icon-circle {
          width: 48px;
          height: 48px;
          border-radius: 50%;
          background: #faf5ff;
          border: 1px solid rgba(168, 85, 247, 0.08);
          color: #7c3aed;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 14px;
          transition: background-color 0.2s ease, color 0.2s ease;
        }
        .service-simple-card:hover .service-icon-circle {
          background: #7c3aed;
          color: #ffffff;
        }
        .service-card-name {
          font-family: var(--font-sans);
          font-size: 0.8rem;
          font-weight: 700;
          color: #1f2937;
          margin: 0;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          width: 100%;
        }
        .service-card-tagline {
          font-size: 0.68rem;
          color: #6b7280;
          margin-top: 4px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          width: 100%;
        }

        /* Filtered search results view */
        .filtered-results-container {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        .results-header-row {
          display: flex;
          align-items: baseline;
          gap: 10px;
        }
        .results-count {
          font-size: 0.76rem;
          color: #6b7280;
        }
        .empty-results-box {
          padding: 40px;
          text-align: center;
          background: #ffffff;
          border-radius: 16px;
          border: 1px solid rgba(168, 85, 247, 0.1);
          color: #6b7280;
          font-size: 0.85rem;
        }
      `}</style>

      <style jsx global>{`
        /* Latest Blog Posts Grid - 4 Columns */
        .latest-posts-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 16px;
          width: 100%;
          box-sizing: border-box;
          overflow: hidden;
        }
        @media (max-width: 1024px) {
          .latest-posts-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }
        @media (max-width: 640px) {
          .latest-posts-grid {
            grid-template-columns: 1fr;
          }
        }
        .blog-item-card {
          background: #ffffff;
          border: 1px solid rgba(168, 85, 247, 0.08);
          border-radius: 20px;
          overflow: hidden;
          display: flex;
          flex-direction: column;
          width: 100%;
          box-sizing: border-box;
          box-shadow: 0 4px 15px rgba(0, 0, 0, 0.04);
          transition: transform 0.25s ease, box-shadow 0.25s ease;
        }
        .blog-item-card:hover {
          transform: translateY(-6px);
          box-shadow: 0 12px 30px rgba(124, 58, 237, 0.12);
        }
        .blog-card-media-wrapper {
          width: 100%;
          height: 120px;
          overflow: hidden;
          background: #faf5ff;
          position: relative;
          flex-shrink: 0;
        }
        .blog-badge-floating-left {
          position: absolute;
          bottom: 12px;
          left: 12px;
          background: rgba(255, 255, 255, 0.95);
          backdrop-filter: blur(4px);
          color: #581c87;
          font-size: 0.65rem;
          font-weight: 700;
          padding: 4px 10px;
          border-radius: 20px;
          text-transform: uppercase;
          border: 1px solid rgba(168, 85, 247, 0.1);
          z-index: 2;
        }
        .blog-badge-floating-right {
          position: absolute;
          bottom: 12px;
          right: 12px;
          background: rgba(255, 255, 255, 0.95);
          backdrop-filter: blur(4px);
          color: #4b5563;
          font-size: 0.65rem;
          font-weight: 600;
          padding: 4px 10px;
          border-radius: 20px;
          border: 1px solid rgba(0, 0, 0, 0.05);
          z-index: 2;
        }
        .blog-media-img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          object-position: center;
          display: block;
          transition: transform 0.5s ease;
        }
        .blog-item-card:hover .blog-media-img {
          transform: scale(1.05);
        }
        .blog-card-body {
          padding: 16px;
          display: flex;
          flex-direction: column;
          gap: 8px;
          flex: 1;
        }
        .blog-card-title {
          font-family: var(--font-sans);
          font-size: 0.95rem;
          color: #111827;
          font-weight: 700 !important;
          margin: 0;
          line-height: 1.4;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
          transition: color 0.2s ease;
        }
        .blog-item-card:hover .blog-card-title {
          color: #7c3aed;
        }
        .blog-card-desc {
          font-size: 0.76rem;
          color: #6b7280;
          line-height: 1.5;
          margin: 0;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
          flex: 1;
        }
        .blog-author-row {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-top: 6px;
          border-top: 1px solid rgba(0, 0, 0, 0.04);
          padding-top: 12px;
        }
        .author-avatar {
          width: 24px;
          height: 24px;
          border-radius: 50%;
          background: #f3e8ff;
          color: #6b21a8;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 0.75rem;
          font-weight: 700;
        }
        .author-details {
          display: flex;
          align-items: center;
          gap: 6px;
          color: #6b7280;
          font-size: 0.72rem;
        }
        .author-name {
          color: #4b5563;
          font-weight: 600;
        }
        .author-separator {
          color: #d1d5db;
        }
        .blog-date {
          color: #9ca3af;
        }
      `}</style>
    </div>
  );
}
