"use client";

import React from "react";
import { useBlog } from "@/app/blog/BlogContext";
import { usePathname, useRouter } from "next/navigation";
import { 
  Grid, Flower, Sparkles, Compass, Heart, Volume2, 
  Flame, Leaf, Shield, BookOpen, Eye, Briefcase, Megaphone, Quote,
  HelpCircle, MessageSquare, Video, User, Scale, GitFork, ChevronDown, ChevronUp,
  Library
} from "lucide-react";

interface CategoryItem {
  id: string;
  name: string;
  icon: React.ReactNode;
}

export const BlogSidebar: React.FC = () => {
  const pathname = usePathname();
  const router = useRouter();
  const { activeCategory, setActiveCategory } = useBlog();

  const [categoriesExpanded, setCategoriesExpanded] = React.useState(false);

  const categoryItems: CategoryItem[] = [
    { id: "chakra healing", name: "Chakra Healing", icon: <Flower size={14} strokeWidth={1.5} /> },
    { id: "aura & energy", name: "Aura & Energy", icon: <Sparkles size={14} strokeWidth={1.5} /> },
    { id: "meditation & mindfulness", name: "Meditation & Mindfulness", icon: <Compass size={14} strokeWidth={1.5} /> },
    { id: "reiki healing", name: "Reiki Healing", icon: <Heart size={14} strokeWidth={1.5} /> },
    { id: "sound healing", name: "Sound Healing", icon: <Volume2 size={14} strokeWidth={1.5} /> },
    { id: "manifestation", name: "Manifestation", icon: <Flame size={14} strokeWidth={1.5} /> },
    { id: "spiritual growth", name: "Spiritual Growth", icon: <Leaf size={14} strokeWidth={1.5} /> },
    { id: "sacred rituals", name: "Sacred Rituals", icon: <Flame size={14} strokeWidth={1.5} /> },
    { id: "holistic wellness", name: "Holistic Wellness", icon: <Shield size={14} strokeWidth={1.5} /> },
  ];

  const categoryIds = categoryItems.map(item => item.id);

  // Auto-expand categories if we are on /blog and a subcategory is active
  React.useEffect(() => {
    if (pathname === "/blog" && categoryIds.includes(activeCategory.toLowerCase())) {
      setCategoriesExpanded(true);
    }
  }, [activeCategory, pathname]);

  const isCategoryActive = pathname === "/blog" && categoryIds.includes(activeCategory.toLowerCase());

  return (
    <div className="blog-sidebar">
      <div className="sidebar-menu">
        {/* All Blogs */}
        <button 
          onClick={() => {
            setActiveCategory("all");
            if (pathname !== "/blog") {
              router.push("/blog");
            }
          }} 
          className={`sidebar-item ${pathname === "/blog" && activeCategory === "all" ? "active" : ""}`}
        >
          <Grid size={16} strokeWidth={1.5} />
          <div className="item-text-container">
            <span className="item-name">All Blogs</span>
          </div>
        </button>

        {/* Categories (Collapsible) */}
        <div>
          <button 
            onClick={() => setCategoriesExpanded(!categoriesExpanded)} 
            className={`sidebar-item ${isCategoryActive ? "active-parent" : ""}`}
            aria-expanded={categoriesExpanded}
          >
            <GitFork size={16} strokeWidth={1.5} />
            <div className="item-text-container" style={{ flex: 1 }}>
              <span className="item-name">Categories</span>
            </div>
            {categoriesExpanded ? (
              <ChevronUp size={14} strokeWidth={1.5} style={{ opacity: 0.5 }} />
            ) : (
              <ChevronDown size={14} strokeWidth={1.5} style={{ opacity: 0.5 }} />
            )}
          </button>

          {categoriesExpanded && (
            <div className="category-children">
              {categoryItems.map((item) => {
                const isActive = pathname === "/blog" && activeCategory.toLowerCase() === item.id.toLowerCase();
                return (
                  <button 
                    key={item.id} 
                    onClick={() => setActiveCategory(item.id)} 
                    className={`sidebar-child-item ${isActive ? "active" : ""}`}
                  >
                    {item.icon}
                    <span className="child-item-name">{item.name}</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Glossary */}
        <button 
          onClick={() => router.push("/blog/glossary")} 
          className={`sidebar-item ${pathname === "/blog/glossary" ? "active" : ""}`}
        >
          <BookOpen size={16} strokeWidth={1.5} />
          <div className="item-text-container">
            <span className="item-name">Glossary</span>
          </div>
        </button>

        {/* FAQ & Help */}
        <button 
          onClick={() => router.push("/blog/faq")} 
          className={`sidebar-item ${pathname === "/blog/faq" ? "active" : ""}`}
        >
          <HelpCircle size={16} strokeWidth={1.5} />
          <div className="item-text-container">
            <span className="item-name">FAQ & Help</span>
          </div>
        </button>

        {/* Q&A Community */}
        <button 
          onClick={() => router.push("/blog/quora-qa")} 
          className={`sidebar-item ${pathname === "/blog/quora-qa" ? "active" : ""}`}
        >
          <MessageSquare size={16} strokeWidth={1.5} />
          <div className="item-text-container">
            <span className="item-name">Q&A Community</span>
          </div>
        </button>

        {/* Video Transcripts */}
        <button 
          onClick={() => router.push("/blog/video-transcripts")} 
          className={`sidebar-item ${pathname === "/blog/video-transcripts" ? "active" : ""}`}
        >
          <Video size={16} strokeWidth={1.5} />
          <div className="item-text-container">
            <span className="item-name">Video Transcripts</span>
          </div>
        </button>

        {/* Case Studies */}
        <button 
          onClick={() => router.push("/blog/case-studies")} 
          className={`sidebar-item ${pathname === "/blog/case-studies" ? "active" : ""}`}
        >
          <Briefcase size={16} strokeWidth={1.5} />
          <div className="item-text-container">
            <span className="item-name">Case Studies</span>
          </div>
        </button>

        {/* Guided Practices */}
        <button 
          onClick={() => router.push("/blog/guided-practices")} 
          className={`sidebar-item ${pathname === "/blog/guided-practices" ? "active" : ""}`}
        >
          <Compass size={16} strokeWidth={1.5} />
          <div className="item-text-container">
            <span className="item-name">Guided Practices</span>
          </div>
        </button>

        {/* Healer Stories */}
        <button 
          onClick={() => router.push("/blog/healer-stories")} 
          className={`sidebar-item ${pathname === "/blog/healer-stories" ? "active" : ""}`}
        >
          <User size={16} strokeWidth={1.5} />
          <div className="item-text-container">
            <span className="item-name">Healer Stories</span>
          </div>
        </button>

        {/* Media Library */}
        <button 
          onClick={() => router.push("/blog/media-library")} 
          className={`sidebar-item ${pathname === "/blog/media-library" ? "active" : ""}`}
        >
          <Library size={16} strokeWidth={1.5} />
          <div className="item-text-container">
            <span className="item-name">Media Library</span>
          </div>
        </button>

        {/* Announcements */}
        <button 
          onClick={() => router.push("/blog/announcements")} 
          className={`sidebar-item ${pathname === "/blog/announcements" ? "active" : ""}`}
        >
          <Megaphone size={16} strokeWidth={1.5} />
          <div className="item-text-container">
            <span className="item-name">Announcements</span>
          </div>
        </button>

      </div>

      {/* Daily Inspiration Card or Q&A Promo Card */}
      {pathname === "/blog/quora-qa" ? (
        <div className="q-promo-card">
          <div className="q-promo-lotus-wrapper">
            <svg viewBox="0 0 100 100" className="q-promo-lotus-icon">
              <path d="M50 25 C45 45 35 60 50 80 C65 60 55 45 50 25 Z" fill="none" stroke="#7c3aed" strokeWidth="4" />
              <path d="M50 80 C35 75 25 60 20 40 C35 50 45 60 50 80 Z" fill="none" stroke="#7c3aed" strokeWidth="4" />
              <path d="M50 80 C65 75 75 60 80 40 C65 50 55 60 50 80 Z" fill="none" stroke="#7c3aed" strokeWidth="4" />
              <path d="M50 80 C30 80 10 70 5 55 C20 65 35 70 50 80 Z" fill="none" stroke="#7c3aed" strokeWidth="4" />
              <path d="M50 80 C70 80 90 70 95 55 C80 65 65 70 50 80 Z" fill="none" stroke="#7c3aed" strokeWidth="4" />
            </svg>
          </div>
          <h4 className="q-promo-title">Your voice matters.</h4>
          <p className="q-promo-desc">
            Ask, share and learn from a community that cares.
          </p>
          <button 
            className="q-promo-btn"
            onClick={() => {
              const askInput = document.querySelector("#add-comment-input") as HTMLTextAreaElement;
              if (askInput) {
                askInput.focus();
                askInput.scrollIntoView({ behavior: "smooth", block: "center" });
              }
            }}
          >
            Ask a Question
          </button>
        </div>
      ) : pathname === "/blog/faq" ? (
        <div className="faq-inspiration-card">
          <h4 className="faq-inspiration-title">Curiosity leads to clarity.</h4>
          <p className="faq-inspiration-desc">
            Explore answers to common questions on healing, practices, and spiritual growth.
          </p>
          <div className="faq-inspiration-image-wrapper">
            <img src="/images/meditation_aura.png" alt="Curiosity leads to clarity" className="faq-inspiration-image" />
          </div>
          <button 
            className="faq-inspiration-btn"
            onClick={() => router.push("/blog")}
          >
            Explore All Blogs
          </button>
        </div>
      ) : (
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
      )}

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
        .sidebar-item.active-parent {
          background: #faf5ff;
          border-left: 2px solid #a855f7;
          border-top-left-radius: 0;
          border-bottom-left-radius: 0;
        }
        .sidebar-item.active-parent svg {
          color: #8b5cf6;
        }
        .sidebar-item.active-parent .item-name {
          color: #7c3aed;
          font-weight: 600;
        }
        .category-children {
          display: flex;
          flex-direction: column;
          gap: 4px;
          margin-top: 4px;
          margin-bottom: 8px;
          border-left: 1px solid rgba(168, 85, 247, 0.15);
          margin-left: 22px;
          padding-left: 8px;
        }
        .sidebar-child-item {
          width: 100%;
          padding: 8px 12px;
          background: transparent;
          border: none;
          border-radius: 8px;
          display: flex;
          align-items: center;
          gap: 10px;
          cursor: pointer;
          font-family: var(--font-sans);
          transition: var(--transition-fast);
          text-align: left;
        }
        .sidebar-child-item svg {
          color: #a855f7;
          opacity: 0.65;
          width: 14px;
          height: 14px;
          transition: var(--transition-fast);
        }
        .sidebar-child-item:hover {
          color: #7c3aed;
          background: rgba(168, 85, 247, 0.04);
        }
        .sidebar-child-item:hover svg {
          color: #7c3aed;
          opacity: 1;
        }
        .sidebar-child-item.active {
          background: #f3e8ff;
        }
        .sidebar-child-item.active svg {
          color: #6b21a8;
          opacity: 1;
        }
        .child-item-name {
          font-size: 0.8rem;
          font-weight: 500;
          color: #4b5563;
          font-family: var(--font-sans);
          transition: var(--transition-fast);
        }
        .sidebar-child-item:hover .child-item-name {
          color: #7c3aed;
        }
        .sidebar-child-item.active .child-item-name {
          color: #581c87;
          font-weight: 600;
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

        /* Q&A Promo Card */
        .q-promo-card {
          background: linear-gradient(135deg, #f5f3ff 0%, #edd8fc 100%);
          border: 1px solid rgba(124, 58, 237, 0.15);
          border-radius: 20px;
          padding: 24px 20px;
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          gap: 14px;
          box-shadow: 0 4px 15px rgba(124, 58, 237, 0.05);
          transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.3s ease;
        }
        .q-promo-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 25px rgba(124, 58, 237, 0.12);
        }
        .q-promo-lotus-wrapper {
          display: flex;
          justify-content: center;
        }
        .q-promo-lotus-icon {
          width: 60px;
          height: 52px;
          filter: drop-shadow(0 4px 8px rgba(124, 58, 237, 0.2));
        }
        .q-promo-title {
          font-family: var(--font-serif);
          font-size: 1.2rem;
          font-weight: 750 !important;
          color: #2e0854;
          margin: 0;
        }
        .q-promo-desc {
          font-family: var(--font-sans);
          font-size: 0.8rem;
          color: #5b21b6;
          line-height: 1.4;
          margin: 0;
        }
        .q-promo-btn {
          width: 100%;
          background: #581c87;
          color: #ffffff;
          border: none;
          padding: 10px 16px;
          border-radius: 12px;
          font-weight: 700;
          font-size: 0.82rem;
          font-family: var(--font-sans);
          cursor: pointer;
          transition: background-color 0.2s ease, transform 0.1s ease;
          box-shadow: 0 4px 12px rgba(88, 28, 135, 0.25);
        }
        .q-promo-btn:hover {
          background: #451070;
          transform: translateY(-1px);
        }
        .q-promo-btn:active {
          transform: translateY(0);
        }

        /* FAQ Inspiration Card */
        .faq-inspiration-card {
          background: linear-gradient(180deg, #faf5ff 0%, #fdf2f8 100%);
          border: 1px solid rgba(168, 85, 247, 0.1);
          border-radius: 20px;
          padding: 24px 20px;
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          gap: 14px;
          box-shadow: 0 4px 15px rgba(168, 85, 247, 0.03);
          transition: transform 0.3s ease;
        }
        .faq-inspiration-card:hover {
          transform: translateY(-2px);
        }
        .faq-inspiration-title {
          font-family: var(--font-serif);
          font-size: 1.25rem;
          font-weight: 750 !important;
          color: #4c1d95;
          margin: 0;
          line-height: 1.2;
        }
        .faq-inspiration-desc {
          font-family: var(--font-sans);
          font-size: 0.8rem;
          color: #7c3aed;
          line-height: 1.4;
          margin: 0;
        }
        .faq-inspiration-image-wrapper {
          width: 100%;
          height: 110px;
          border-radius: 14px;
          overflow: hidden;
          box-shadow: 0 4px 10px rgba(0, 0, 0, 0.05);
          background: #fdf4ff;
        }
        .faq-inspiration-image {
          width: 100%;
          height: 100%;
          object-fit: cover;
          transition: transform 0.5s ease;
        }
        .faq-inspiration-card:hover .faq-inspiration-image {
          transform: scale(1.05);
        }
        .faq-inspiration-btn {
          width: 100%;
          background: #4c1d95;
          color: #ffffff;
          border: none;
          padding: 10px 16px;
          border-radius: 12px;
          font-weight: 700;
          font-size: 0.82rem;
          font-family: var(--font-sans);
          cursor: pointer;
          transition: background-color 0.2s ease, transform 0.1s ease;
          box-shadow: 0 4px 12px rgba(76, 29, 149, 0.2);
        }
        .faq-inspiration-btn:hover {
          background: #3b0764;
          transform: translateY(-1px);
        }
      `}</style>
    </div>
  );
};
