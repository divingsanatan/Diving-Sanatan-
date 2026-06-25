"use client";

import React, { useState } from "react";
import { ComparisonMediaItem } from "@/types/database";

interface MediaCarouselProps {
  items: ComparisonMediaItem[];
  title?: string;
  className?: string;
}

export const MediaCarousel: React.FC<MediaCarouselProps> = ({
  items,
  title = "Sacred Gallery",
  className = "",
}) => {
  const [activeIndex, setActiveIndex] = useState(0);

  if (items.length === 0) return null;

  const current = items[activeIndex];
  const prev = () => setActiveIndex(i => (i === 0 ? items.length - 1 : i - 1));
  const next = () => setActiveIndex(i => (i === items.length - 1 ? 0 : i + 1));

  return (
    <section className={`media-carousel-section ${className}`}>
      <h4 className="media-carousel-title">{title}</h4>

      <div className="carousel-container glass-panel">
        <div className="carousel-viewport">
          {current.type === "video" ? (
            <video key={current.src} controls className="carousel-active-slide-video">
              <source src={current.src} type="video/mp4" />
              Your browser does not support the video tag.
            </video>
          ) : (
            <img
              src={current.src}
              alt={`Gallery slide ${activeIndex + 1}`}
              className="carousel-active-slide-img"
            />
          )}
          {current.type === "video" && (
            <div className="carousel-media-badge">🎥 Video</div>
          )}
        </div>

        {items.length > 1 && (
          <>
            <button type="button" className="carousel-control-btn prev" onClick={prev} aria-label="Previous slide">
              ‹
            </button>
            <button type="button" className="carousel-control-btn next" onClick={next} aria-label="Next slide">
              ›
            </button>
            <div className="carousel-dots-indicator">
              {items.map((item, idx) => (
                <button
                  key={idx}
                  type="button"
                  className={`carousel-dot-btn ${item.type === "video" ? "video-dot" : ""} ${activeIndex === idx ? "active" : ""}`}
                  onClick={() => setActiveIndex(idx)}
                  aria-label={`Jump to ${item.type} slide ${idx + 1}`}
                />
              ))}
            </div>
          </>
        )}

        <div className="carousel-counter">
          {activeIndex + 1} / {items.length}
        </div>
      </div>

      <style jsx>{`
        .media-carousel-section {
          width: 100%;
        }
        .media-carousel-title {
          font-family: var(--font-serif);
          font-size: 1.2rem;
          color: #4c1d95;
          margin-bottom: 16px;
        }
        .carousel-container {
          position: relative;
          border-radius: 16px;
          overflow: hidden;
        }
        .carousel-viewport {
          position: relative;
          width: 100%;
          height: 380px;
          background: rgba(0, 0, 0, 0.03);
        }
        .carousel-active-slide-img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
        }
        .carousel-active-slide-video {
          width: 100%;
          height: 100%;
          object-fit: contain;
          background: #000;
          display: block;
        }
        .carousel-media-badge {
          position: absolute;
          top: 16px;
          left: 16px;
          background: rgba(0, 0, 0, 0.55);
          backdrop-filter: blur(6px);
          color: #fff;
          font-size: 0.75rem;
          font-weight: 700;
          padding: 5px 12px;
          border-radius: 20px;
          z-index: 10;
        }
        .carousel-counter {
          position: absolute;
          top: 16px;
          right: 16px;
          background: rgba(0, 0, 0, 0.45);
          backdrop-filter: blur(6px);
          color: rgba(255, 255, 255, 0.9);
          font-size: 0.75rem;
          font-weight: 600;
          padding: 5px 12px;
          border-radius: 20px;
          z-index: 10;
        }
        .carousel-control-btn {
          position: absolute;
          top: 50%;
          transform: translateY(-50%);
          width: 42px;
          height: 42px;
          border-radius: 50%;
          border: 1.5px solid rgba(255, 255, 255, 0.3);
          background: rgba(0, 0, 0, 0.35);
          backdrop-filter: blur(8px);
          color: #fff;
          font-size: 1.6rem;
          line-height: 1;
          cursor: pointer;
          z-index: 10;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: var(--transition-fast);
        }
        .carousel-control-btn:hover {
          background: rgba(124, 58, 237, 0.7);
          border-color: #7c3aed;
        }
        .carousel-control-btn.prev { left: 16px; }
        .carousel-control-btn.next { right: 16px; }
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
        .carousel-dot-btn.active {
          background: #7c3aed;
          transform: scale(1.3);
        }
        .carousel-dot-btn.video-dot {
          border-radius: 4px;
          width: 10px;
          height: 10px;
        }
        @media (max-width: 768px) {
          .carousel-viewport { height: 260px; }
        }
      `}</style>
    </section>
  );
};
