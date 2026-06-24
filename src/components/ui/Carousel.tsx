"use client";

import React, { useState, useEffect, useRef } from "react";

interface CarouselProps {
  children: React.ReactNode[];
  title?: string;
}

export const Carousel: React.FC<CarouselProps> = ({ children, title }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [visibleCount, setVisibleCount] = useState(3);
  const containerRef = useRef<HTMLDivElement>(null);

  // Handle responsive visible counts
  useEffect(() => {
    const handleResize = () => {
      if (!window) return;
      const width = window.innerWidth;
      if (width <= 640) {
        setVisibleCount(1);
      } else if (width <= 1024) {
        setVisibleCount(2);
      } else {
        setVisibleCount(3);
      }
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const totalItems = children.length;
  const maxIndex = Math.max(0, totalItems - visibleCount);

  // Reset index if visibleCount changes and exceeds maxIndex
  useEffect(() => {
    if (currentIndex > maxIndex) {
      setCurrentIndex(maxIndex);
    }
  }, [visibleCount, maxIndex, currentIndex]);

  const handlePrev = () => {
    setCurrentIndex((prev) => Math.max(0, prev - 1));
  };

  const handleNext = () => {
    setCurrentIndex((prev) => Math.min(maxIndex, prev + 1));
  };

  if (totalItems === 0) return null;

  return (
    <div className="custom-carousel-wrapper">
      <div className="carousel-header">
        {title && <h3 className="carousel-title">{title}</h3>}
        <div className="carousel-actions">
          <button
            onClick={handlePrev}
            className={`carousel-control-btn prev ${currentIndex === 0 ? "disabled" : ""}`}
            disabled={currentIndex === 0}
            aria-label="Previous slide"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="19" y1="12" x2="5" y2="12"></line>
              <polyline points="12 19 5 12 12 5"></polyline>
            </svg>
          </button>
          <button
            onClick={handleNext}
            className={`carousel-control-btn next ${currentIndex >= maxIndex ? "disabled" : ""}`}
            disabled={currentIndex >= maxIndex}
            aria-label="Next slide"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="5" y1="12" x2="19" y2="12"></line>
              <polyline points="12 5 19 12 12 19"></polyline>
            </svg>
          </button>
        </div>
      </div>

      <div className="carousel-viewport" ref={containerRef}>
        <div
          className="carousel-track"
          style={{
            transform: `translateX(-${currentIndex * (100 / visibleCount)}%)`,
            transition: "transform 0.5s cubic-bezier(0.16, 1, 0.3, 1)",
          }}
        >
          {children.map((child, index) => (
            <div
              key={index}
              className="carousel-slide"
              style={{
                flex: `0 0 ${100 / visibleCount}%`,
              }}
            >
              <div className="slide-content-pad">{child}</div>
            </div>
          ))}
        </div>
      </div>

      <style jsx>{`
        .custom-carousel-wrapper {
          width: 100%;
          display: flex;
          flex-direction: column;
          gap: 16px;
          margin-bottom: 24px;
        }
        .carousel-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          width: 100%;
        }
        .carousel-title {
          font-family: var(--font-serif);
          font-size: 1.6rem;
          color: #4c1d95;
          font-weight: 700;
          margin: 0;
        }
        .carousel-actions {
          display: flex;
          gap: 10px;
        }
        .carousel-control-btn {
          width: 38px;
          height: 38px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(255, 255, 255, 0.7);
          border: 1px solid rgba(168, 85, 247, 0.2);
          color: #7c3aed;
          cursor: pointer;
          transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
        }
        .carousel-control-btn:hover:not(.disabled) {
          background: #7c3aed;
          color: #ffffff;
          transform: scale(1.08);
          box-shadow: 0 6px 16px rgba(124, 58, 237, 0.2);
        }
        .carousel-control-btn.disabled {
          opacity: 0.4;
          cursor: not-allowed;
          background: rgba(255, 255, 255, 0.3);
          border-color: rgba(0, 0, 0, 0.05);
          color: hsl(var(--text-muted));
          box-shadow: none;
        }
        .carousel-viewport {
          width: 100%;
          overflow: hidden;
          padding: 8px 0;
        }
        .carousel-track {
          display: flex;
          width: 100%;
        }
        .carousel-slide {
          box-sizing: border-box;
          transition: opacity 0.3s ease;
        }
        .slide-content-pad {
          padding: 0 10px;
          height: 100%;
        }
        @media (max-width: 640px) {
          .slide-content-pad {
            padding: 0;
          }
          .carousel-title {
            font-size: 1.35rem;
          }
        }
      `}</style>
    </div>
  );
};
