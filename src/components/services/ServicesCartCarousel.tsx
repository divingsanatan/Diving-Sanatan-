"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { Carousel } from "@/components/ui/Carousel";
import { formatCurrency } from "@/utils/formatters";
import { Service } from "@/types/database";

interface ServicesCartCarouselProps {
  services: Service[];
  title?: string;
  activeServiceId?: string | null;
  onBookThis?: (service: Service) => void;
  emptyMessage?: string;
  className?: string;
}

const getServiceImage = (imgName: string) => {
  if (!imgName) return "/images/service_chakra_healing.png";
  if (imgName.startsWith("http") || imgName.startsWith("/")) return imgName;
  const mappings: Record<string, string> = {
    chakra_healing: "/images/service_chakra_healing.png",
    aura_scanning: "/images/service_aura_scanning.png",
    reiki_healing: "/images/service_reiki_healing.png",
    sound_healing: "/images/service_sound_healing.png",
    personal_guidance: "/images/service_personal_guidance.png",
    meditation_program: "/images/service_meditation_program.png",
    full_moon_program: "/images/service_full_moon_program.png",
    manifestation_program: "/images/service_manifestation_program.png",
    aura_balancing: "/images/service_aura_scanning.png",
    crystal_healing: "/images/service_reiki_healing.png",
    chakra_clearing: "/images/service_chakra_healing.png",
    mindfulness_meditation: "/images/service_meditation_program.png",
    anxiety_release: "/images/service_reiki_healing.png",
    spiritual_counseling: "/images/service_personal_guidance.png",
  };
  return mappings[imgName] || "/images/service_chakra_healing.png";
};

export const ServicesCartCarousel: React.FC<ServicesCartCarouselProps> = ({
  services,
  title = "Featured Healing Therapies",
  activeServiceId = null,
  onBookThis,
  emptyMessage = "No therapies available.",
  className = "",
}) => {
  const router = useRouter();

  const handleBookThis = (srv: Service) => {
    if (onBookThis) {
      onBookThis(srv);
    } else {
      router.push(`/booking?service=${srv.id}`);
    }
  };

  if (services.length === 0) {
    return (
      <section className={`services-cart-carousel-section ${className}`}>
        <Card variant="glass" className="card-empty-muted">
          {emptyMessage}
        </Card>
      </section>
    );
  }

  return (
    <>
      <section className={`services-cart-carousel-section ${className}`}>
        <Carousel title={title} viewAllHref="/explore-services">
          {services.map(srv => {
            const isActive = activeServiceId === srv.id;
            return (
              <Card
                key={srv.id}
                variant="glass"
                className={`carousel-service-card ${isActive ? "active-booking" : ""}`}
              >
                <div className="carousel-service-image">
                  <img
                    className="carousel-service-image-img"
                    src={getServiceImage(srv.image)}
                    alt={srv.name}
                  />
                </div>
                <div className="carousel-service-body">
                  <div className="carousel-service-header">
                    <h4>{srv.name}</h4>
                    <span className="carousel-service-price">{formatCurrency(srv.price)}</span>
                  </div>
                  <p className="carousel-service-desc">
                    {srv.description.length > 90 ? `${srv.description.substring(0, 90)}...` : srv.description}
                  </p>
                  <div className="carousel-service-actions">
                    <button
                      type="button"
                      className={`book-select-btn ${isActive ? "active" : ""}`}
                      onClick={() => handleBookThis(srv)}
                    >
                      {isActive ? "Selected" : "Book Session"}
                    </button>
                  </div>
                </div>
              </Card>
            );
          })}
        </Carousel>
      </section>

      <style jsx>{`
        .services-cart-carousel-section {
          width: 100%;
        }
        :global(.carousel-service-card) {
          padding: 0 !important;
          overflow: hidden;
          height: 100%;
          display: flex;
          flex-direction: column;
        }
        :global(.carousel-service-card.active-booking) {
          outline: 2px solid rgba(124, 58, 237, 0.35);
        }
        .carousel-service-image {
          width: 100%;
          aspect-ratio: 4 / 3;
          min-height: 200px;
          overflow: hidden;
          flex-shrink: 0;
        }
        .carousel-service-body {
          padding: 16px;
          display: flex;
          flex-direction: column;
          gap: 10px;
          flex: 1;
        }
        .carousel-service-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 8px;
        }
        .carousel-service-header h4 {
          font-size: 0.95rem;
          color: #4c1d95;
          line-height: 1.3;
        }
        .carousel-service-price {
          font-size: 0.85rem;
          font-weight: 700;
          color: #db2777;
          white-space: nowrap;
        }
        .carousel-service-desc {
          font-size: 0.78rem;
          color: hsl(var(--text-muted));
          line-height: 1.45;
          flex: 1;
        }
        .carousel-service-actions {
          display: flex;
          gap: 8px;
          margin-top: auto;
        }
        .cart-toggle-btn, .book-select-btn {
          flex: 1;
          padding: 8px 6px;
          border-radius: 8px;
          font-size: 0.72rem;
          font-weight: 700;
          cursor: pointer;
          transition: var(--transition-fast);
          text-transform: uppercase;
          letter-spacing: 0.03em;
        }
        .cart-toggle-btn {
          background: rgba(168, 85, 247, 0.06);
          border: 1px solid rgba(168, 85, 247, 0.25);
          color: #6d28d9;
        }
        .cart-toggle-btn.selected {
          background: #7c3aed;
          border-color: #7c3aed;
          color: #fff;
        }
        .book-select-btn {
          background: transparent;
          border: 1px solid rgba(0, 0, 0, 0.1);
          color: hsl(var(--text-muted));
        }
        .book-select-btn.active {
          border-color: #7c3aed;
          color: #7c3aed;
          background: rgba(124, 58, 237, 0.06);
        }
        @keyframes slideUp {
          from { transform: translateY(100%); }
          to { transform: translateY(0); }
        }
        .cart-drawer-panel {
          position: fixed;
          bottom: 0;
          left: 0;
          right: 0;
          background: rgba(255, 255, 255, 0.95);
          backdrop-filter: blur(20px);
          border-top: 2px solid var(--gold-border);
          box-shadow: 0 -10px 40px rgba(0,0,0,0.05);
          z-index: 1000;
          padding: 20px 24px;
          animation: slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .cart-drawer-container {
          max-width: 1200px;
          margin: 0 auto;
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 40px;
        }
        .cart-drawer-left {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 12px;
          overflow: hidden;
          color: #1e1b4b;
        }
        .cart-drawer-title {
          font-family: var(--font-serif);
          font-size: 0.85rem;
          color: #4c1d95;
          letter-spacing: 0.08em;
        }
        .cart-items-preview {
          display: flex;
          gap: 10px;
          overflow-x: auto;
          padding-bottom: 4px;
        }
        .cart-preview-pill {
          background: rgba(168, 85, 247, 0.05);
          border: 1px solid rgba(168, 85, 247, 0.25);
          color: #6d28d9;
          font-size: 0.75rem;
          font-weight: 600;
          padding: 6px 12px;
          border-radius: 99px;
          white-space: nowrap;
          display: inline-flex;
          align-items: center;
          gap: 8px;
        }
        .pill-remove-btn {
          background: transparent;
          border: none;
          color: rgba(0,0,0,0.4);
          font-size: 1rem;
          cursor: pointer;
          line-height: 1;
        }
        .pill-remove-btn:hover {
          color: #ef4444;
        }
        .cart-drawer-right {
          display: flex;
          align-items: center;
          gap: 28px;
        }
        .cart-price-summary {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
        }
        .cart-summary-label {
          font-size: 0.75rem;
          color: hsl(var(--text-muted));
          text-transform: uppercase;
        }
        .cart-summary-val {
          font-family: var(--font-serif);
          font-size: 1.5rem;
          font-weight: 700;
          color: #db2777;
        }
        .cart-drawer-actions {
          display: flex;
          gap: 12px;
        }
        .drawer-clear-btn {
          background: transparent;
          border: 1px solid rgba(0,0,0,0.12);
          color: hsl(var(--text-muted));
          padding: 12px 18px;
          border-radius: 10px;
          font-size: 0.8rem;
          cursor: pointer;
          font-weight: 600;
          transition: var(--transition-fast);
        }
        .drawer-clear-btn:hover {
          border-color: #ef4444;
          color: #ef4444;
        }
        .drawer-checkout-btn {
          background: var(--btn-gold-bg);
          color: var(--btn-gold-text);
          border: 1px solid var(--btn-gold-border);
          font-family: var(--font-serif);
          font-weight: 700;
          font-size: 0.8rem;
          padding: 12px 22px;
          border-radius: 10px;
          cursor: pointer;
          transition: var(--transition-fast);
        }
        .drawer-checkout-btn:hover {
          transform: translateY(-1px);
          box-shadow: 0 6px 20px rgba(212, 175, 55, 0.25);
        }
        .cart-page-spacer {
          height: 130px;
        }
        @media (max-width: 768px) {
          .cart-drawer-container {
            flex-direction: column;
            align-items: stretch;
            gap: 16px;
          }
          .cart-drawer-right {
            flex-direction: column;
            align-items: stretch;
          }
          .cart-price-summary {
            align-items: flex-start;
          }
        }
      `}</style>
    </>
  );
};
