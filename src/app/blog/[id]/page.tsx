"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

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

const getBlogImage = (img: string) => {
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

export default function BlogDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;

  const [blog, setBlog] = useState<Blog | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  const nextImage = () => {
    if (!blog || !blog.images || blog.images.length === 0) return;
    setActiveImageIndex((prev) => (prev + 1) % blog.images!.length);
  };

  const prevImage = () => {
    if (!blog || !blog.images || blog.images.length === 0) return;
    setActiveImageIndex((prev) => (prev - 1 + blog.images!.length) % blog.images!.length);
  };

  useEffect(() => {
    if (!id) return;
    
    async function loadBlogDetail() {
      try {
        setLoading(true);
        const res = await fetch(`/api/blogs?id=${id}`);
        const json = await res.json();
        if (json.success) {
          setBlog(json.data);
        } else {
          setError(json.error || "Article not found");
        }
      } catch (err) {
        console.error(err);
        setError("Failed to resolve article server connection.");
      } finally {
        setLoading(false);
      }
    }
    loadBlogDetail();
  }, [id]);

  const paragraphs = blog ? blog.content.split(/\r?\n\r?\n/).filter(p => p.trim().length > 0) : [];

  return (
    <div className="blog-detail-page">
      {loading ? (
        <p style={{ textAlign: "center", padding: "80px 0", color: "hsl(var(--text-muted))" }}>Unrolling manuscript...</p>
      ) : error || !blog ? (
        <div className="error-card glass-panel" style={{ padding: "40px", textAlign: "center" }}>
          <h3>Error Resolving Article</h3>
          <p style={{ margin: "16px 0", color: "hsl(var(--text-muted))" }}>{error}</p>
          <Button variant="gold" onClick={() => router.push("/blog")}>Back to Blog</Button>
        </div>
      ) : (
        <article className="blog-article-content">
          
          {/* Header info */}
          <div className="article-header">
            <span className="article-category">{blog.category}</span>
            <h1 className="article-title">{blog.title}</h1>
            <div className="article-meta">
              <span>Written by: <strong>{blog.author}</strong></span>
              <span>•</span>
              <span>Released: <strong>{blog.date}</strong></span>
              <span>•</span>
              <span>Reading estimate: <strong>{blog.readTime}</strong></span>
            </div>
          </div>

          {/* Cover image banner */}
          <div className="article-cover-wrapper">
            <img 
              src={getBlogImage(blog.image)} 
              alt={blog.title} 
              className="article-cover-img" 
            />
          </div>

          {/* Content panel */}
          <Card variant="glass" className="article-body-card">
            <div className="article-paragraph-wrapper">
              {paragraphs.map((para, index) => (
                <p key={index} className={index === 0 ? "first-paragraph-dropcap" : ""}>
                  {para.trim()}
                </p>
              ))}
              
              {paragraphs.length <= 1 && (
                <>
                  {/* Visual quote spacer */}
                  <div className="article-blockquote">
                    <span className="quote-mark">“</span>
                    <p>Energy flow balances are the foundational blueprint of physical comfort. Maintain your aura, and your mind will follow.</p>
                  </div>

                  <p>
                    Somatic therapies remind us that blockades within our chakras aren't just mystical constructs. They represent chemical blockades in our nervous pathways. By introducing sound bowls vibrating at specific frequencies (e.g. 528Hz for DNA repair or 432Hz for deep meditation), we assist our bodies in aligning these frequencies, which stabilizes cortisol flow and reduces tension. Ensure you discuss layout sessions with a certified practitioner to customize crystals based on your current physical conditions.
                  </p>
                </>
              )}
            </div>

            {/* Dynamic Gallery Carousel Showcase */}
            {blog.images && blog.images.length > 0 && (
              <div className="article-carousel-showcase">
                <h4 className="media-section-title">✨ Sacred Gallery</h4>
                
                <div className="carousel-container glass-panel">
                  {/* Viewport */}
                  <div className="carousel-viewport">
                    <img 
                      src={getBlogImage(blog.images[activeImageIndex])} 
                      alt={`${blog.title} slide ${activeImageIndex + 1}`} 
                      className="carousel-active-slide-img"
                      onClick={() => window.open(getBlogImage(blog.images![activeImageIndex]), "_blank")}
                    />
                  </div>

                  {/* Navigation controls */}
                  {blog.images.length > 1 && (
                    <>
                      <button type="button" className="carousel-control-btn prev" onClick={prevImage}>
                        ‹
                      </button>
                      <button type="button" className="carousel-control-btn next" onClick={nextImage}>
                        ›
                      </button>

                      {/* Dot Indicators */}
                      <div className="carousel-dots-indicator">
                        {blog.images.map((_, idx) => (
                          <button
                            key={idx}
                            type="button"
                            className={`carousel-dot-btn ${activeImageIndex === idx ? "active" : ""}`}
                            onClick={() => setActiveImageIndex(idx)}
                            aria-label={`Jump to slide ${idx + 1}`}
                          />
                        ))}
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}

            {/* Dynamic Video Showcase */}
            {blog.videos && blog.videos.length > 0 && (
              <div className="article-video-showcase">
                <h4 className="media-section-title">🎥 Video Transcriptions & Somatic Guides</h4>
                <div className="videos-list">
                  {blog.videos.map((vidUrl, index) => (
                    <div key={index} className="video-player-wrapper glass-panel">
                      <video controls className="showcase-video">
                        <source src={vidUrl} type="video/mp4" />
                        Your browser does not support the video tag.
                      </video>
                      <div className="video-info">
                        <span className="video-badge">Session Video {index + 1}</span>
                        <p className="video-url-label">{vidUrl.split('/').pop()}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Actions footer */}
            <div className="article-footer-actions">
              <Button variant="gold-outline" onClick={() => router.push("/blog")}>
                ← Back to Listings
              </Button>
              
              <Button variant="gold" onClick={() => router.push(`/search?query=${encodeURIComponent(blog.category)}`)}>
                Book Related Sessions
              </Button>
            </div>
          </Card>

        </article>
      )}

      <style jsx>{`
        .blog-detail-page {
          width: 100%;
          max-width: 800px;
          margin: 0 auto;
        }
        .article-header {
          text-align: center;
          margin-bottom: 32px;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 12px;
        }
        .article-category {
          background: rgba(16, 185, 129, 0.08);
          border: 1px solid rgba(16, 185, 129, 0.2);
          color: #065f46;
          font-size: 0.75rem;
          font-weight: 600;
          padding: 4px 10px;
          border-radius: 6px;
          text-transform: uppercase;
        }
        .article-title {
          font-size: 2.3rem;
          color: #4c1d95;
          line-height: 1.3;
          font-weight: 700;
        }
        .article-meta {
          display: flex;
          gap: 12px;
          font-size: 0.85rem;
          color: hsl(var(--text-muted));
          margin-top: 4px;
        }
        .article-cover-wrapper {
          width: 100%;
          height: 380px;
          border-radius: 24px;
          overflow: hidden;
          margin-bottom: 40px;
          border: 1px solid var(--gold-border);
          box-shadow: 0 16px 40px rgba(0, 0, 0, 0.04);
        }
        .article-cover-img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          transition: transform 0.8s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .article-cover-wrapper:hover .article-cover-img {
          transform: scale(1.03);
        }
        .article-body-card {
          padding: 40px !important;
        }
        .article-paragraph-wrapper {
          display: flex;
          flex-direction: column;
          gap: 24px;
        }
        .article-paragraph-wrapper p {
          font-size: 1.05rem;
          line-height: 1.8;
          color: hsl(var(--text-cream));
        }
        .first-paragraph-dropcap::first-letter {
          font-family: var(--font-serif);
          font-size: 3.5rem;
          float: left;
          line-height: 0.8;
          padding-right: 8px;
          padding-top: 4px;
          color: #7c3aed;
          font-weight: 700;
        }
        .article-blockquote {
          background: rgba(168, 85, 247, 0.04);
          border-left: 3px solid #7c3aed;
          padding: 24px;
          border-radius: 0 16px 16px 0;
          margin: 12px 0;
          position: relative;
        }
        .quote-mark {
          position: absolute;
          top: -10px;
          left: 10px;
          font-size: 4rem;
          font-family: var(--font-serif);
          color: rgba(168, 85, 247, 0.15);
          line-height: 1;
        }
        .article-blockquote p {
          font-family: var(--font-serif);
          font-style: italic;
          font-size: 1.15rem;
          color: #4c1d95 !important;
        }
        .article-footer-actions {
          display: flex;
          justify-content: space-between;
          border-top: 1px solid rgba(0,0,0,0.06);
          padding-top: 32px;
          margin-top: 40px;
        }
        @media (max-width: 640px) {
          .article-title {
            font-size: 1.8rem;
          }
          .article-meta {
            flex-direction: column;
            gap: 4px;
            align-items: center;
          }
          .article-meta span:nth-child(even) {
            display: none;
          }
          .article-cover-wrapper {
            height: 220px;
            margin-bottom: 24px;
            border-radius: 16px;
          }
          .article-body-card {
            padding: 20px !important;
          }
          .article-footer-actions {
            flex-direction: column;
            gap: 16px;
          }
          .article-footer-actions :global(button) {
            width: 100%;
          }
        }

        /* Dynamic Carousel Showcase Styles */
        .media-section-title {
          font-family: var(--font-serif);
          font-size: 1.4rem;
          color: #4c1d95;
          margin: 32px 0 16px;
          border-bottom: 1.5px solid rgba(168, 85, 247, 0.15);
          padding-bottom: 8px;
          letter-spacing: 0.02em;
        }
        .article-carousel-showcase {
          margin: 36px 0 24px;
        }
        .carousel-container {
          position: relative;
          width: 100%;
          height: 440px;
          border-radius: 20px;
          overflow: hidden;
          padding: 0 !important;
          border: 1px solid var(--border-glass);
          box-shadow: 0 10px 30px rgba(0,0,0,0.04);
          background: rgba(255, 255, 255, 0.4);
        }
        .carousel-viewport {
          width: 100%;
          height: 100%;
          position: relative;
          overflow: hidden;
          background: #000;
        }
        .carousel-active-slide-img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
          cursor: pointer;
          transition: transform 0.6s cubic-bezier(0.16, 1, 0.3, 1), filter 0.3s;
        }
        .carousel-active-slide-img:hover {
          transform: scale(1.02);
          filter: brightness(0.96);
        }
        .carousel-control-btn {
          position: absolute;
          top: 50%;
          transform: translateY(-50%);
          width: 48px;
          height: 48px;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.7);
          backdrop-filter: blur(8px);
          border: 1px solid rgba(168, 85, 247, 0.2);
          color: #7c3aed;
          font-size: 2rem;
          font-weight: 300;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: var(--transition-fast);
          z-index: 10;
          line-height: 1;
        }
        .carousel-control-btn:hover {
          background: #7c3aed;
          color: #ffffff;
          border-color: #7c3aed;
          box-shadow: 0 4px 15px rgba(124, 58, 237, 0.25);
        }
        .carousel-control-btn.prev {
          left: 20px;
          padding-right: 2px;
        }
        .carousel-control-btn.next {
          right: 20px;
          padding-left: 2px;
        }
        .carousel-dots-indicator {
          position: absolute;
          bottom: 20px;
          left: 50%;
          transform: translateX(-50%);
          display: flex;
          gap: 10px;
          z-index: 10;
          background: rgba(0, 0, 0, 0.25);
          backdrop-filter: blur(4px);
          padding: 8px 16px;
          border-radius: 20px;
          border: 1.5px solid rgba(255, 255, 255, 0.15);
        }
        .carousel-dot-btn {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          border: none;
          background: rgba(255, 255, 255, 0.5);
          cursor: pointer;
          padding: 0;
          transition: var(--transition-fast);
        }
        .carousel-dot-btn:hover {
          background: rgba(255, 255, 255, 0.85);
        }
        .carousel-dot-btn.active {
          background: #7c3aed;
          transform: scale(1.3);
          box-shadow: 0 0 8px #7c3aed;
        }
        .videos-list {
          display: flex;
          flex-direction: column;
          gap: 24px;
          margin-bottom: 24px;
        }
        .video-player-wrapper {
          border-radius: 20px;
          overflow: hidden;
          border: 1px solid var(--border-glass);
          padding: 0 !important;
          background: rgba(255, 255, 255, 0.8);
          box-shadow: 0 8px 30px rgba(0,0,0,0.04);
        }
        .showcase-video {
          width: 100%;
          max-height: 420px;
          background: #000;
          display: block;
        }
        .video-info {
          padding: 16px 20px;
          display: flex;
          align-items: center;
          gap: 12px;
          border-top: 1px solid rgba(0,0,0,0.03);
        }
        .video-badge {
          background: rgba(124, 58, 237, 0.08);
          border: 1px solid rgba(124, 58, 237, 0.2);
          color: #7c3aed;
          font-size: 0.72rem;
          font-weight: 700;
          padding: 4px 10px;
          border-radius: 6px;
          text-transform: uppercase;
        }
        .video-url-label {
          font-size: 0.82rem;
          color: hsl(var(--text-muted));
          margin: 0 !important;
          font-weight: 500;
        }
      `}</style>
    </div>
  );
}
