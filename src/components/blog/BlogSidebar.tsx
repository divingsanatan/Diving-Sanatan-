"use client";

import React from "react";
import { useBlog } from "@/app/blog/BlogContext";
import { 
  Grid, Flower, Sparkles, Compass, Heart, Volume2, 
  Flame, Leaf, Shield, BookOpen, Eye, Briefcase, Megaphone, Quote
} from "lucide-react";

interface CategoryItem {
  id: string;
  name: string;
  icon: React.ReactNode;
}

export const BlogSidebar: React.FC = () => {
  const { activeCategory, setActiveCategory } = useBlog();

  const items: CategoryItem[] = [
    { id: "all", name: "All Blogs", icon: <Grid size={16} strokeWidth={1.5} /> },
    { id: "chakra healing", name: "Chakra Healing", icon: <Flower size={16} strokeWidth={1.5} /> },
    { id: "aura & energy", name: "Aura & Energy", icon: <Sparkles size={16} strokeWidth={1.5} /> },
    { id: "meditation & mindfulness", name: "Meditation & Mindfulness", icon: <Compass size={16} strokeWidth={1.5} /> },
    { id: "reiki healing", name: "Reiki Healing", icon: <Heart size={16} strokeWidth={1.5} /> },
    { id: "sound healing", name: "Sound Healing", icon: <Volume2 size={16} strokeWidth={1.5} /> },
    { id: "manifestation", name: "Manifestation", icon: <Flame size={16} strokeWidth={1.5} /> },
    { id: "spiritual growth", name: "Spiritual Growth", icon: <Leaf size={16} strokeWidth={1.5} /> },
    { id: "sacred rituals", name: "Sacred Rituals", icon: <Flame size={16} strokeWidth={1.5} /> },
    { id: "holistic wellness", name: "Holistic Wellness", icon: <Shield size={16} strokeWidth={1.5} /> },
    { id: "healer stories", name: "Healer Stories", icon: <BookOpen size={16} strokeWidth={1.5} /> },
    { id: "guided practices", name: "Guided Practices", icon: <Eye size={16} strokeWidth={1.5} /> },
    { id: "case studies", name: "Case Studies", icon: <Briefcase size={16} strokeWidth={1.5} /> },
    { id: "announcements", name: "Announcements", icon: <Megaphone size={16} strokeWidth={1.5} /> },
  ];

  return (
    <div className="blog-sidebar">
      <div className="sidebar-menu">
        {items.map((item) => {
          const isActive = activeCategory.toLowerCase() === item.id.toLowerCase();
          return (
            <button 
              key={item.id} 
              onClick={() => setActiveCategory(item.id)} 
              className={`sidebar-item ${isActive ? "active" : ""}`}
            >
              {item.icon}
              <div className="item-text-container">
                <span className="item-name">{item.name}</span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Daily Inspiration Card */}
      <div className="inspiration-card">
        <div className="quote-header">
          <Quote size={20} strokeWidth={1.5} className="quote-mark-icon" />
          <span className="inspiration-label">Daily Inspiration</span>
        </div>
        <p className="inspiration-quote">
          "Your healing journey begins the moment you choose yourself."
        </p>
        <div className="inspiration-lotus-wrapper">
          <svg viewBox="0 0 100 100" className="inspiration-lotus-icon">
            <path d="M50 25 C45 45 35 60 50 80 C65 60 55 45 50 25 Z" fill="none" stroke="#a855f7" strokeWidth="2.5" strokeOpacity="0.3" />
            <path d="M50 80 C35 75 25 60 20 40 C35 50 45 60 50 80 Z" fill="none" stroke="#a855f7" strokeWidth="2.5" strokeOpacity="0.3" />
            <path d="M50 80 C65 75 75 60 80 40 C65 50 55 60 50 80 Z" fill="none" stroke="#a855f7" strokeWidth="2.5" strokeOpacity="0.3" />
            <path d="M50 80 C30 80 10 70 5 55 C20 65 35 70 50 80 Z" fill="none" stroke="#a855f7" strokeWidth="2.5" strokeOpacity="0.3" />
            <path d="M50 80 C70 80 90 70 95 55 C80 65 65 70 50 80 Z" fill="none" stroke="#a855f7" strokeWidth="2.5" strokeOpacity="0.3" />
          </svg>
        </div>
      </div>

      <style jsx>{`
        .blog-sidebar {
          display: flex;
          flex-direction: column;
          gap: 24px;
        }
        .sidebar-menu {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        .sidebar-item {
          width: 100%;
          padding: 10px 14px;
          background: transparent;
          border: none;
          border-radius: 10px;
          display: flex;
          align-items: center;
          gap: 12px;
          cursor: pointer;
          font-family: var(--font-sans);
          transition: var(--transition-fast);
          text-align: left;
        }
        .sidebar-item svg {
          color: #a855f7;
          transition: var(--transition-fast);
          width: 16px;
          height: 16px;
          opacity: 0.8;
        }
        .sidebar-item:hover {
          color: #7c3aed;
          background: rgba(168, 85, 247, 0.04);
        }
        .sidebar-item:hover svg {
          color: #7c3aed;
          opacity: 1;
        }
        .sidebar-item.active {
          background: #f3e8ff;
        }
        .sidebar-item.active svg {
          color: #6b21a8;
          opacity: 1;
        }
        .item-text-container {
          display: flex;
          flex-direction: column;
        }
        .item-name {
          font-size: 0.85rem;
          font-weight: 500;
          color: #4b5563;
          font-family: var(--font-sans);
          transition: var(--transition-fast);
        }
        .sidebar-item:hover .item-name {
          color: #7c3aed;
        }
        .sidebar-item.active .item-name {
          color: #581c87;
          font-weight: 600;
        }
 
        /* Inspiration Card */
        .inspiration-card {
          background: #fdf4ff;
          border: 1px solid rgba(168, 85, 247, 0.08);
          border-radius: 20px;
          padding: 24px 20px;
          position: relative;
          display: flex;
          flex-direction: column;
          gap: 12px;
          overflow: hidden;
        }
        .quote-header {
          display: flex;
          align-items: center;
          gap: 8px;
          color: #a855f7;
          opacity: 0.85;
        }
        .quote-mark-icon {
          flex-shrink: 0;
        }
        .inspiration-label {
          font-family: var(--font-sans);
          font-size: 0.8rem;
          font-weight: 700;
          color: #7c3aed;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }
        .inspiration-quote {
          font-family: var(--font-serif);
          font-size: 0.95rem;
          color: #3b0764;
          line-height: 1.5;
          margin: 0;
          font-style: italic;
          font-weight: 500;
        }
        .inspiration-lotus-wrapper {
          display: flex;
          justify-content: center;
          margin-top: 4px;
        }
        .inspiration-lotus-icon {
          width: 50px;
          height: 44px;
        }
      `}</style>
    </div>
  );
};
