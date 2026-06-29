"use client";

import React from "react";
import Link from "next/link";
import { Play, Plus } from "lucide-react";

export const BlogRightSidebar: React.FC = () => {
  const mostViewed = [
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
    },
    {
      id: "reiki-healing-benefits",
      title: "Reiki Healing: Benefits & What to Expect",
      views: "7.1K views",
      image: "/images/insight_blog.png"
    }
  ];

  const videoBlogs = [
    {
      id: "aura-reading-vid",
      title: "Aura Reading Explained",
      author: "Anara Singh",
      duration: "6:45",
      image: "/images/insight_space.png"
    },
    {
      id: "chakra-balancing-vid",
      title: "Chakra Balancing Guided Practice",
      author: "Rohan Mehta",
      duration: "12:30",
      image: "/images/insight_video.png"
    },
    {
      id: "sound-bath-vid",
      title: "Sound Bath for Deep Relaxation",
      author: "Elena Rostova",
      duration: "10:15",
      image: "/images/insight_blog.png"
    }
  ];

  const categories = [
    "Healer Interviews",
    "Guided Meditations",
    "Spiritual Techniques",
    "Wellness Tips",
    "Client Transformations"
  ];

  return (
    <div className="blog-right-sidebar">
      {/* Most Viewed Blogs */}
      <div className="right-sidebar-card">
        <div className="sidebar-title-row">
          <svg viewBox="0 0 100 100" className="sidebar-lotus-icon">
            <path d="M50 25 C45 45 35 60 50 80 C65 60 55 45 50 25 Z" fill="none" stroke="#a855f7" strokeWidth="4" />
            <path d="M50 80 C35 75 25 60 20 40 C35 50 45 60 50 80 Z" fill="none" stroke="#a855f7" strokeWidth="4" />
            <path d="M50 80 C65 75 75 60 80 40 C65 50 55 60 50 80 Z" fill="none" stroke="#a855f7" strokeWidth="4" />
            <path d="M50 80 C30 80 10 70 5 55 C20 65 35 70 50 80 Z" fill="none" stroke="#a855f7" strokeWidth="4" />
            <path d="M50 80 C70 80 90 70 95 55 C80 65 65 70 50 80 Z" fill="none" stroke="#a855f7" strokeWidth="4" />
          </svg>
          <h4 className="sidebar-heading">Most Viewed Blogs</h4>
        </div>
        
        <div className="most-viewed-list">
          {mostViewed.map((blog, idx) => (
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

      {/* Video Blogs */}
      <div className="right-sidebar-card">
        <div className="sidebar-header-row">
          <div className="sidebar-title-row">
            <svg viewBox="0 0 100 100" className="sidebar-lotus-icon">
              <path d="M50 25 C45 45 35 60 50 80 C65 60 55 45 50 25 Z" fill="none" stroke="#a855f7" strokeWidth="4" />
              <path d="M50 80 C35 75 25 60 20 40 C35 50 45 60 50 80 Z" fill="none" stroke="#a855f7" strokeWidth="4" />
              <path d="M50 80 C65 75 75 60 80 40 C65 50 55 60 50 80 Z" fill="none" stroke="#a855f7" strokeWidth="4" />
              <path d="M50 80 C30 80 10 70 5 55 C20 65 35 70 50 80 Z" fill="none" stroke="#a855f7" strokeWidth="4" />
              <path d="M50 80 C70 80 90 70 95 55 C80 65 65 70 50 80 Z" fill="none" stroke="#a855f7" strokeWidth="4" />
            </svg>
            <h4 className="sidebar-heading">Video Blogs</h4>
          </div>
          <Link href="/blog/video-transcripts" className="view-all-link">View all</Link>
        </div>

        <div className="video-blogs-list">
          {videoBlogs.map((video) => (
            <Link key={video.id} href={`/blog/video-transcripts`} className="video-blog-item">
              <div className="video-thumbnail-wrapper">
                <img src={video.image} alt={video.title} className="video-thumbnail" />
                <div className="play-button-overlay">
                  <Play size={12} fill="white" color="white" />
                </div>
              </div>
              <div className="video-info">
                <h5>{video.title}</h5>
                <span>by {video.author} • {video.duration}</span>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* More Categories */}
      <div className="right-sidebar-card">
        <div className="sidebar-title-row">
          <svg viewBox="0 0 100 100" className="sidebar-lotus-icon">
            <path d="M50 25 C45 45 35 60 50 80 C65 60 55 45 50 25 Z" fill="none" stroke="#a855f7" strokeWidth="4" />
            <path d="M50 80 C35 75 25 60 20 40 C35 50 45 60 50 80 Z" fill="none" stroke="#a855f7" strokeWidth="4" />
            <path d="M50 80 C65 75 75 60 80 40 C65 50 55 60 50 80 Z" fill="none" stroke="#a855f7" strokeWidth="4" />
            <path d="M50 80 C30 80 10 70 5 55 C20 65 35 70 50 80 Z" fill="none" stroke="#a855f7" strokeWidth="4" />
            <path d="M50 80 C70 80 90 70 95 55 C80 65 65 70 50 80 Z" fill="none" stroke="#a855f7" strokeWidth="4" />
          </svg>
          <h4 className="sidebar-heading">More Categories</h4>
        </div>

        <div className="more-categories-list">
          {categories.map((cat, idx) => (
            <div key={cat} className="category-pill-row">
              <span className="category-pill-text">{cat}</span>
              {idx === categories.length - 1 && <Plus size={12} className="plus-icon" />}
            </div>
          ))}
        </div>

        <button className="explore-categories-btn">
          Explore All Categories
        </button>
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
        }
        .sidebar-header-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          width: 100%;
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
          margin-top: -2px;
        }
        .sidebar-heading {
          font-family: var(--font-sans);
          font-size: 1.05rem;
          color: #111827;
          font-weight: 700 !important;
          margin: 0;
        }
        .view-all-link {
          font-size: 0.76rem;
          color: #7c3aed;
          font-weight: 700;
          text-decoration: none;
          transition: color 0.2s ease;
        }
        .view-all-link:hover {
          color: #581c87;
          text-decoration: underline;
        }

        /* Most Viewed List */
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
          transition: color 0.2s ease;
        }
        :global(.most-viewed-item):hover .mv-info h5 {
          color: #7c3aed;
        }
        .mv-info span {
          font-size: 0.7rem;
          color: #6b7280;
        }

        /* Video Blogs List */
        .video-blogs-list {
          display: flex;
          flex-direction: column;
          gap: 14px;
        }
        :global(.video-blog-item) {
          display: flex;
          align-items: center;
          gap: 12px;
          text-decoration: none;
          color: inherit;
          transition: transform 0.2s ease;
        }
        :global(.video-blog-item:hover) {
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
          transition: background-color 0.2s ease;
        }
        .video-blog-item:hover .play-button-overlay {
          background: rgba(0, 0, 0, 0.45);
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
          transition: color 0.2s ease;
        }
        :global(.video-blog-item):hover .video-info h5 {
          color: #7c3aed;
        }
        .video-info span {
          font-size: 0.7rem;
          color: #6b7280;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        /* More Categories */
        .more-categories-list {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .category-pill-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 10px 14px;
          border: 1px solid rgba(168, 85, 247, 0.08);
          border-radius: 10px;
          font-size: 0.82rem;
          color: #4b5563;
          font-weight: 500;
          background: #ffffff;
          cursor: pointer;
          transition: border-color 0.2s ease, background-color 0.2s ease, color 0.2s ease;
        }
        .category-pill-row:hover {
          border-color: rgba(168, 85, 247, 0.3);
          background: #faf5ff;
          color: #7c3aed;
        }
        .plus-icon {
          color: #7c3aed;
          opacity: 0.85;
          transition: transform 0.2s ease;
        }
        .category-pill-row:hover .plus-icon {
          transform: rotate(90deg);
        }
        .explore-categories-btn {
          width: 100%;
          padding: 12px;
          border: none;
          border-radius: 10px;
          background: #581c87;
          color: #ffffff;
          font-size: 0.8rem;
          font-weight: 700;
          cursor: pointer;
          transition: background 0.2s ease, transform 0.1s ease;
          margin-top: 4px;
        }
        .explore-categories-btn:hover {
          background: #3b0764;
        }
      `}</style>
    </div>
  );
};
