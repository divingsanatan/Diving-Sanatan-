"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useBlog } from "../BlogContext";
import { 
  Flower, Sparkles, Heart, Compass, BookOpen, Clock, 
  ChevronLeft, ChevronRight, ChevronDown, ChevronUp, HelpCircle
} from "lucide-react";

interface Blog {
  id: string;
  slug?: string;
  title: string;
  category: string;
  author: string;
  content: string;
  date: string;
  readTime: string;
  image: string;
  section?: string | null;
}

interface SubArticle {
  title: string;
  slug: string;
  readTime: string;
}

interface ParsedPillar {
  id: string;
  title: string;
  description: string;
  category: string;
  articles: SubArticle[];
}

const MeditatingLotusSVG = () => (
  <svg viewBox="0 0 200 200" width="150" height="150" className="welcome-meditation-svg">
    <defs>
      <radialGradient id="glowGrad" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stopColor="#d8b4fe" stopOpacity="0.4" />
        <stop offset="100%" stopColor="#7c3aed" stopOpacity="0" />
      </radialGradient>
      <linearGradient id="lotusGrad" x1="0%" y1="100%" x2="0%" y2="0%">
        <stop offset="0%" stopColor="#7c3aed" stopOpacity="0.6" />
        <stop offset="100%" stopColor="#c084fc" stopOpacity="0.1" />
      </linearGradient>
    </defs>
    
    {/* Concentric glowing background circles */}
    <circle cx="100" cy="95" r="75" fill="url(#glowGrad)" />
    
    {/* Lotus outline petals */}
    <g stroke="#a855f7" strokeWidth="1.5" strokeOpacity="0.35" fill="none" className="lotus-glow-petals">
      {/* Center petal */}
      <path d="M100 35 C90 65 90 85 100 115 C110 85 110 65 100 35 Z" fill="url(#lotusGrad)" />
      {/* Left petal 1 */}
      <path d="M100 115 C75 100 65 80 48 65 C68 75 83 90 100 115 Z" fill="url(#lotusGrad)" />
      {/* Right petal 1 */}
      <path d="M100 115 C125 100 135 80 152 65 C132 75 117 90 100 115 Z" fill="url(#lotusGrad)" />
      {/* Left petal 2 */}
      <path d="M100 115 C58 110 38 90 28 80 C48 90 73 100 100 115 Z" fill="url(#lotusGrad)" />
      {/* Right petal 2 */}
      <path d="M100 115 C142 110 162 90 172 80 C152 90 127 100 100 115 Z" fill="url(#lotusGrad)" />
    </g>
    
    {/* Meditating Silhouette */}
    <g fill="#7c3aed" opacity="0.9" className="meditator-silhouette">
      {/* Head */}
      <circle cx="100" cy="55" r="10" />
      {/* Body */}
      <path d="M100 70 C90 70 82 74 80 82 L76 96 C74 102 78 108 85 108 L115 108 C122 108 126 102 124 96 L120 82 C118 74 110 70 100 70 Z" />
      {/* Crossed legs */}
      <path d="M76 100 C70 100 64 103 60 108 L53 118 C50 122 53 128 58 128 L142 128 C147 128 150 122 147 118 L140 108 C136 103 130 100 124 100 L76 100 Z" />
    </g>
    
    {/* Small floating sparkles */}
    <circle cx="55" cy="50" r="2.5" fill="#fdf4ff" opacity="0.9" className="sparkle-one" />
    <circle cx="145" cy="50" r="1.5" fill="#fdf4ff" opacity="0.9" className="sparkle-two" />
    <circle cx="80" cy="25" r="1.5" fill="#fdf4ff" opacity="0.7" className="sparkle-three" />
    <circle cx="120" cy="25" r="2" fill="#fdf4ff" opacity="0.7" className="sparkle-four" />
    
    <style jsx>{`
      .welcome-meditation-svg {
        animation: floatSvg 6s infinite ease-in-out;
        filter: drop-shadow(0 8px 16px rgba(124, 58, 237, 0.08));
      }
      .lotus-glow-petals {
        animation: spinPetals 60s infinite linear;
        transform-origin: 100px 95px;
      }
      .meditator-silhouette {
        transform-origin: 100px 95px;
        animation: breathMeditator 4s infinite ease-in-out;
      }
      @keyframes floatSvg {
        0%, 100% { transform: translateY(0px); }
        50% { transform: translateY(-6px); }
      }
      @keyframes breathMeditator {
        0%, 100% { transform: scale(1); }
        50% { transform: scale(1.02); }
      }
    `}</style>
  </svg>
);

export default function PillarListingClient() {
  const router = useRouter();
  const { searchQuery } = useBlog();
  const [pillars, setPillars] = useState<any[]>([]);
  const [filteredPillars, setFilteredPillars] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Accordion Expand/Collapse State
  const [expandedPillarId, setExpandedPillarId] = useState<string | null>(null);

  // Infinite Scroll State
  const [visibleCount, setVisibleCount] = useState(3);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const observerRef = useRef<HTMLDivElement | null>(null);
  const BATCH_SIZE = 3;

  // Fetch pillar guides on mount
  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const res = await fetch("/api/pillar-guides");
        const json = await res.json();

        if (json.success) {
          setPillars(json.data || []);
          // Auto-expand the first pillar guide by default
          if (json.data && json.data.length > 0) {
            setExpandedPillarId(json.data[0].id);
          }
        }
      } catch (err) {
        console.error("Failed to load pillar guides data:", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  // Filter based on Search Query
  useEffect(() => {
    let result = [...pillars];
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        p => 
          p.title.toLowerCase().includes(q) || 
          p.description.toLowerCase().includes(q) ||
          p.articles.some((art: any) => art.title.toLowerCase().includes(q))
      );
    }
    setFilteredPillars(result);
    setVisibleCount(3); // Reset visible count on search/filter
  }, [pillars, searchQuery]);

  const hasMoreItems = visibleCount < filteredPillars.length;

  // IntersectionObserver for Infinite Scrolling
  useEffect(() => {
    const node = observerRef.current;
    if (!node || !hasMoreItems) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !isLoadingMore) {
          setIsLoadingMore(true);
          setTimeout(() => {
            setVisibleCount((prev) => prev + BATCH_SIZE);
            setIsLoadingMore(false);
          }, 350);
        }
      },
      { threshold: 0.1, rootMargin: "250px" }
    );

    observer.observe(node);
    return () => {
      observer.disconnect();
    };
  }, [hasMoreItems, isLoadingMore, filteredPillars.length]);

  const toggleAccordion = (id: string) => {
    setExpandedPillarId(prevId => (prevId === id ? null : id));
  };

  const getPillarIcon = (category: string) => {
    const cat = category.toLowerCase();
    if (cat.includes("meditation") || cat.includes("mindfulness")) {
      return <Compass size={18} />;
    }
    if (cat.includes("energy") || cat.includes("chakra")) {
      return <Sparkles size={18} />;
    }
    if (cat.includes("spiritual")) {
      return <Heart size={18} />;
    }
    return <Flower size={18} />;
  };

  const displayedPillars = filteredPillars.slice(0, visibleCount);

  const renderInfiniteScrollSentinel = () => {
    if (loading) return null;

    return (
      <div className="infinite-scroll-sentinel-wrapper">
        {hasMoreItems ? (
          <div ref={observerRef} className="infinite-loader-box">
            <button 
              type="button"
              className="load-more-btn"
              onClick={() => {
                setIsLoadingMore(true);
                setTimeout(() => {
                  setVisibleCount((prev) => prev + BATCH_SIZE);
                  setIsLoadingMore(false);
                }, 250);
              }}
              disabled={isLoadingMore}
            >
              <svg viewBox="0 0 100 100" className={`loader-lotus-spin ${isLoadingMore ? 'spinning' : ''}`}>
                <path d="M50 25 C45 45 35 60 50 80 C65 60 55 45 50 25 Z" fill="none" stroke="#7c3aed" strokeWidth="4" />
                <path d="M50 80 C35 75 25 60 20 40 C35 50 45 60 50 80 Z" fill="none" stroke="#7c3aed" strokeWidth="4" />
                <path d="M50 80 C65 75 75 60 80 40 C65 50 55 60 50 80 Z" fill="none" stroke="#7c3aed" strokeWidth="4" />
              </svg>
              <span>{isLoadingMore ? "Retrieving more guides..." : "Load More Sacred Guides"}</span>
            </button>
          </div>
        ) : filteredPillars.length > 0 ? (
          <div className="end-of-list-badge">
            <Sparkles size={16} className="end-sparkles-icon" />
            <span>You've explored all {filteredPillars.length} sacred pillar guides</span>
          </div>
        ) : null}
      </div>
    );
  };

  return (
    <div className="pillar-dashboard-container">
      {/* 1. Header Welcome Banner */}
      <div className="pillar-welcome-banner" id="pillar-header-section">
        <div className="banner-left">
          <div className="pillar-title-row">
            <svg viewBox="0 0 100 100" className="banner-lotus-icon">
              <path d="M50 25 C45 45 35 60 50 80 C65 60 55 45 50 25 Z" fill="none" stroke="#7c3aed" strokeWidth="4" />
              <path d="M50 80 C35 75 25 60 20 40 C35 50 45 60 50 80 Z" fill="none" stroke="#7c3aed" strokeWidth="4" />
              <path d="M50 80 C65 75 75 60 80 40 C65 50 55 60 50 80 Z" fill="none" stroke="#7c3aed" strokeWidth="4" />
            </svg>
            <h1 className="banner-title">Pillar Blogs</h1>
          </div>
          <p className="banner-desc">
            Our pillar blogs are comprehensive guides that cover essential aspects of holistic healing. Each pillar is divided into detailed sub-topics to support your journey.
          </p>
        </div>
        <div className="banner-right">
          <MeditatingLotusSVG />
        </div>
      </div>

      {/* 2. Accordions Listing Section */}
      <div className="pillar-accordions-list">
        {loading ? (
          <div className="pillar-empty-card">
            <p className="empty-title">Retrieving sacred guides...</p>
            <p className="empty-desc">Please wait while we pull the latest pillar layouts from the library.</p>
          </div>
        ) : filteredPillars.length === 0 ? (
          <div className="pillar-empty-card">
            <HelpCircle className="empty-icon" size={40} />
            <p className="empty-title">No pillar guides found</p>
            <p className="empty-desc">We couldn't find any results matching "{searchQuery}". Try editing your keyword search.</p>
          </div>
        ) : (
          displayedPillars.map((pillar, index) => {
            const isOpen = expandedPillarId === pillar.id;
            const displayIndex = index + 1;
            
            return (
              <div 
                key={pillar.id}
                id={`pillar-accordion-${index}`}
                className={`pillar-accordion-card ${isOpen ? "open" : ""}`}
              >
                {/* Header row */}
                <button
                  type="button"
                  className="accordion-trigger-btn"
                  onClick={() => toggleAccordion(pillar.id)}
                  aria-expanded={isOpen}
                >
                  <div className="trigger-left-details">
                    <div className="index-circle-badge">
                      {displayIndex}
                    </div>
                    <div className="pillar-icon-wrapper">
                      {getPillarIcon(pillar.category)}
                    </div>
                    <div className="pillar-text-group">
                      <h3 className="pillar-card-title">{pillar.title}</h3>
                      <p className="pillar-card-teaser">{pillar.description}</p>
                    </div>
                  </div>

                  <div className="trigger-right-badge-arrows">
                    <span className="articles-count-badge">
                      {pillar.articles.length} Articles
                    </span>
                    <div className="arrow-toggle-circle">
                      {isOpen ? (
                        <ChevronUp size={18} strokeWidth={2.5} />
                      ) : (
                        <ChevronDown size={18} strokeWidth={2.5} />
                      )}
                    </div>
                  </div>
                </button>

                {/* Sub-articles Expanded Body */}
                <div className={`accordion-collapse-panel ${isOpen ? "expanded" : "collapsed"}`}>
                  <div className="accordion-content-inner">
                    <div className="content-top-divider" />
                    <div className="sub-articles-vertical-list">
                      {pillar.articles.length === 0 ? (
                        <p className="no-sub-articles-text">No sub-articles linked in this guide yet.</p>
                      ) : (
                        pillar.articles.map((article: any, artIdx: number) => (
                          <Link 
                            key={artIdx}
                            href={article.link || "#"} 
                            className="sub-article-item-row"
                          >
                            <div className="item-row-left">
                              <span className="purple-bullet-dot" />
                              <span className="sub-article-title">{article.title}</span>
                            </div>
                            <div className="item-row-right">
                              <div className="read-time-pill">
                                <Clock size={12} className="clock-icon" />
                                <span>{article.readTime}</span>
                              </div>
                              <ChevronRight size={14} className="chevron-right-action" />
                            </div>
                          </Link>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* 3. Infinite Pagination Sentinel & Load More */}
      {renderInfiniteScrollSentinel()}

      <style jsx>{`
        .pillar-dashboard-container {
          display: flex;
          flex-direction: column;
          gap: 16px;
          width: 100%;
          box-sizing: border-box;
        }

        /* 1. Header Banner */
        .pillar-welcome-banner {
          display: flex;
          align-items: center;
          justify-content: space-between;
          background: linear-gradient(135deg, #FAF7FF 0%, #FFFFFF 100%);
          border: 1px solid rgba(168, 85, 247, 0.08);
          border-radius: 24px;
          padding: 20px 30px;
          gap: 20px;
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.03);
          overflow: hidden;
        }
        .banner-left {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .pillar-title-row {
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .banner-lotus-icon {
          width: 32px;
          height: 32px;
          flex-shrink: 0;
          color: #7c3aed;
        }
        .banner-title {
          font-family: var(--font-sans);
          font-size: 1.6rem;
          color: #111827;
          font-weight: 800;
          margin: 0;
          line-height: 1.2;
        }
        .banner-desc {
          font-size: 0.84rem;
          color: #6b7280;
          line-height: 1.6;
          margin: 0;
          max-width: 90%;
        }
        .banner-right {
          flex-shrink: 0;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        /* 2. Accordions Listing */
        .pillar-accordions-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
          width: 100%;
        }
        .pillar-empty-card {
          padding: 48px 30px;
          text-align: center;
          background: #ffffff;
          border-radius: 20px;
          border: 1px solid rgba(168, 85, 247, 0.08);
          color: #6b7280;
          box-shadow: 0 4px 15px rgba(0, 0, 0, 0.01);
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 12px;
        }
        .empty-icon {
          color: #c084fc;
        }
        .empty-title {
          font-family: var(--font-sans);
          font-size: 1.05rem;
          font-weight: 700;
          color: #1f2937;
          margin: 0;
        }
        .empty-desc {
          font-size: 0.8rem;
          margin: 0;
          max-width: 340px;
          line-height: 1.5;
        }

        /* Accordion Card */
        .pillar-accordion-card {
          background: #ffffff;
          border: 1px solid rgba(168, 85, 247, 0.08);
          border-radius: 20px;
          box-shadow: 0 4px 18px rgba(0, 0, 0, 0.02);
          transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
          overflow: hidden;
          width: 100%;
        }
        .pillar-accordion-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 10px 24px rgba(124, 58, 237, 0.06);
          border-color: rgba(168, 85, 247, 0.15);
        }
        .pillar-accordion-card.open {
          border-color: rgba(168, 85, 247, 0.25);
          box-shadow: 0 12px 30px rgba(124, 58, 237, 0.08);
        }

        /* Accordion Trigger */
        .accordion-trigger-btn {
          width: 100%;
          background: transparent;
          border: none;
          padding: 16px 20px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          cursor: pointer;
          text-align: left;
          gap: 20px;
        }
        .trigger-left-details {
          display: flex;
          align-items: center;
          gap: 16px;
          flex: 1;
          min-width: 0;
        }
        .index-circle-badge {
          width: 34px;
          height: 34px;
          border-radius: 50%;
          background: #faf5ff;
          color: #7c3aed;
          display: flex;
          align-items: center;
          justify-content: center;
          font-family: var(--font-sans);
          font-size: 0.95rem;
          font-weight: 850;
          flex-shrink: 0;
          border: 1px solid rgba(168, 85, 247, 0.08);
        }
        .pillar-icon-wrapper {
          width: 38px;
          height: 38px;
          border-radius: 50%;
          background: #faf5ff;
          color: #7c3aed;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          border: 1px solid rgba(168, 85, 247, 0.06);
          transition: all 0.3s ease;
        }
        .pillar-accordion-card:hover .pillar-icon-wrapper {
          background: #7c3aed;
          color: #ffffff;
        }
        .pillar-text-group {
          display: flex;
          flex-direction: column;
          gap: 4px;
          min-width: 0;
          flex: 1;
        }
        .pillar-card-title {
          font-family: var(--font-sans);
          font-size: 1.15rem;
          color: #111827;
          font-weight: 750 !important;
          margin: 0;
          line-height: 1.3;
          transition: color 0.2s ease;
        }
        .pillar-accordion-card:hover .pillar-card-title {
          color: #7c3aed;
        }
        .pillar-card-teaser {
          font-size: 0.8rem;
          color: #6b7280;
          line-height: 1.45;
          margin: 0;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          max-width: 90%;
        }

        .trigger-right-badge-arrows {
          display: flex;
          align-items: center;
          gap: 14px;
          flex-shrink: 0;
        }
        .articles-count-badge {
          background: #faf5ff;
          color: #7c3aed;
          font-size: 0.72rem;
          font-weight: 700;
          padding: 5px 12px;
          border-radius: 8px;
          border: 1px solid rgba(168, 85, 247, 0.08);
          letter-spacing: 0.02em;
          text-transform: uppercase;
        }
        .arrow-toggle-circle {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #6b7280;
          background: transparent;
          transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
          border: 1px solid rgba(0, 0, 0, 0.04);
        }
        .pillar-accordion-card:hover .arrow-toggle-circle {
          background: #fdf4ff;
          color: #7c3aed;
          border-color: rgba(168, 85, 247, 0.15);
        }
        .pillar-accordion-card.open .arrow-toggle-circle {
          background: #7c3aed;
          color: #ffffff;
          border-color: #7c3aed;
          transform: rotate(0deg);
        }

        /* Accordion Collapse Panel */
        .accordion-collapse-panel {
          display: grid;
          transition: grid-template-rows 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .accordion-collapse-panel.collapsed {
          grid-template-rows: 0fr;
        }
        .accordion-collapse-panel.expanded {
          grid-template-rows: 1fr;
        }
        .accordion-content-inner {
          overflow: hidden;
          width: 100%;
        }
        .content-top-divider {
          height: 1px;
          background: rgba(168, 85, 247, 0.06);
          margin: 0 20px;
        }

        /* Sub-articles Vertical List */
        .sub-articles-vertical-list {
          padding: 8px 20px 16px;
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        .no-sub-articles-text {
          font-size: 0.78rem;
          color: #9ca3af;
          font-style: italic;
          margin: 10px 0;
        }
        
        /* Interactive Sub-article Row Link */
        :global(.sub-article-item-row) {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 12px 14px;
          border-radius: 12px;
          background: transparent;
          text-decoration: none;
          color: inherit;
          transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
          box-sizing: border-box;
          width: 100%;
        }
        :global(.sub-article-item-row:hover) {
          background: #faf5ff;
          transform: translateX(4px);
        }
        .item-row-left {
          display: flex;
          align-items: center;
          gap: 12px;
          min-width: 0;
          flex: 1;
        }
        .purple-bullet-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: #c084fc;
          flex-shrink: 0;
          transition: transform 0.2s ease, background-color 0.2s ease;
        }
        :global(.sub-article-item-row:hover) .purple-bullet-dot {
          background: #7c3aed;
          transform: scale(1.3);
        }
        .sub-article-title {
          font-size: 0.86rem;
          font-weight: 500;
          color: #4b5563;
          line-height: 1.4;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          transition: color 0.2s ease;
        }
        :global(.sub-article-item-row:hover) .sub-article-title {
          color: #581c87;
          font-weight: 600;
        }
        
        .item-row-right {
          display: flex;
          align-items: center;
          gap: 16px;
          flex-shrink: 0;
          margin-left: 12px;
        }
        .read-time-pill {
          display: flex;
          align-items: center;
          gap: 6px;
          background: rgba(0, 0, 0, 0.03);
          border: 1px solid rgba(0, 0, 0, 0.02);
          padding: 4px 10px;
          border-radius: 20px;
          font-size: 0.72rem;
          color: #6b7280;
        }
        :global(.sub-article-item-row:hover) .read-time-pill {
          background: rgba(124, 58, 237, 0.05);
          color: #7c3aed;
          border-color: rgba(168, 85, 247, 0.08);
        }
        .clock-icon {
          color: #9ca3af;
          transition: color 0.2s ease;
        }
        :global(.sub-article-item-row:hover) .clock-icon {
          color: #7c3aed;
        }
        .chevron-right-action {
          color: #9ca3af;
          opacity: 0.7;
          transition: all 0.2s ease;
        }
        :global(.sub-article-item-row:hover) .chevron-right-action {
          color: #7c3aed;
          opacity: 1;
          transform: translateX(2px);
        }

        /* 3. Infinite Scroll Sentinel & Load More */
        .infinite-scroll-sentinel-wrapper {
          display: flex;
          justify-content: center;
          align-items: center;
          padding: 28px 0 16px;
          margin-top: 16px;
          border-top: 1px solid rgba(168, 85, 247, 0.08);
          width: 100%;
        }
        .infinite-loader-box {
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .load-more-btn {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 10px 24px;
          border-radius: 24px;
          background: #ffffff;
          border: 1px solid rgba(168, 85, 247, 0.2);
          color: #7c3aed;
          font-family: var(--font-sans);
          font-size: 0.85rem;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
          box-shadow: 0 4px 15px rgba(124, 58, 237, 0.06);
        }
        .load-more-btn:hover:not(:disabled) {
          background: #faf5ff;
          border-color: #7c3aed;
          transform: translateY(-2px);
          box-shadow: 0 8px 20px rgba(124, 58, 237, 0.12);
        }
        .load-more-btn:disabled {
          opacity: 0.8;
          cursor: wait;
        }
        .loader-lotus-spin {
          width: 22px;
          height: 22px;
          flex-shrink: 0;
          transition: transform 0.3s ease;
        }
        .loader-lotus-spin.spinning {
          animation: spinLotus 1.8s linear infinite;
        }
        @keyframes spinLotus {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        .end-of-list-badge {
          display: flex;
          align-items: center;
          gap: 8px;
          font-family: var(--font-sans);
          font-size: 0.82rem;
          font-weight: 600;
          color: #6b7280;
          padding: 10px 20px;
          background: #faf5ff;
          border-radius: 20px;
          border: 1px solid rgba(168, 85, 247, 0.1);
        }
        :global(.end-sparkles-icon) {
          color: #a855f7;
        }

        /* Responsive Layout adjustments */
        @media (max-width: 1024px) {
          .pillar-welcome-banner {
            flex-direction: column;
            align-items: flex-start;
            padding: 16px 20px;
            gap: 16px;
          }
          .banner-desc {
            max-width: 100%;
          }
          .banner-right {
            display: none;
          }
        }

        @media (max-width: 768px) {
          .accordion-trigger-btn {
            padding: 12px 16px;
            gap: 12px;
          }
          .trigger-left-details {
            gap: 12px;
          }
          .index-circle-badge {
            width: 28px;
            height: 28px;
            font-size: 0.85rem;
          }
          .pillar-icon-wrapper {
            display: none;
          }
          .pillar-card-title {
            font-size: 1.05rem;
          }
          .trigger-right-badge-arrows {
            gap: 8px;
          }
          .articles-count-badge {
            padding: 4px 8px;
            font-size: 0.65rem;
          }
          .arrow-toggle-circle {
            width: 28px;
            height: 28px;
          }
          .sub-articles-vertical-list {
            padding: 8px 12px 14px;
          }
        }

        @media (max-width: 640px) {
          .pillar-pagination-wrapper {
            gap: 8px;
            flex-wrap: wrap;
          }
          .pagination-arrow-btn {
            padding: 8px 12px;
            font-size: 0.75rem;
          }
          .pagination-numbers {
            gap: 4px;
          }
          .pagination-number-btn {
            width: 30px;
            height: 30px;
            font-size: 0.75rem;
          }
        }
      `}</style>
    </div>
  );
}
