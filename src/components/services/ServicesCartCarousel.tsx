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
  if (!imgName) return "/images/reiki_placeholder.jpg";
  if (imgName.startsWith("http") || imgName.startsWith("/")) return imgName;
  const mappings: Record<string, string> = {
    aura_balancing: "/images/service_chakra.png",
    crystal_healing: "/images/service_regression.png",
    chakra_clearing: "/images/service_akashic.png",
    mindfulness_meditation: "/images/service_chakra.png",
    anxiety_release: "/images/service_regression.png",
    spiritual_counseling: "/images/service_akashic.png",
  };
  return mappings[imgName] || "/images/reiki_placeholder.jpg";
};

export const ServicesCartCarousel: React.FC<ServicesCartCarouselProps> = ({
  services,
  title = "Add More Therapies to Cart",
  activeServiceId = null,
  onBookThis,
  emptyMessage = "No therapies available.",
  className = "",
}) => {
  const router = useRouter();
  const [cartSelections, setCartSelections] = useState<Service[]>([]);

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem("divingsanatan_selections");
      if (stored) setCartSelections(JSON.parse(stored));
    } catch (e) {
      console.warn("Could not read cart selections", e);
    }
  }, []);

  const toggleCartSelection = (srv: Service) => {
    const next = cartSelections.some(s => s.id === srv.id)
      ? cartSelections.filter(s => s.id !== srv.id)
      : [...cartSelections, srv];
    setCartSelections(next);
    window.localStorage.setItem("divingsanatan_selections", JSON.stringify(next));
  };

  const clearCartSelections = () => {
    setCartSelections([]);
    window.localStorage.removeItem("divingsanatan_selections");
  };

  const handleCartCheckout = () => {
    if (cartSelections.length === 0) return;
    router.push("/checkout");
  };

  const handleBookThis = (srv: Service) => {
    if (onBookThis) {
      onBookThis(srv);
    } else {
      router.push(`/booking?service=${srv.id}`);
    }
  };

  const totalCartCost = cartSelections.reduce((sum, s) => sum + s.price, 0);

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
      <section
        className={`services-cart-carousel-section ${cartSelections.length > 0 ? "has-cart-pad" : ""} ${className}`}
      >
        <Carousel title={title}>
          {services.map(srv => {
            const inCart = cartSelections.some(s => s.id === srv.id);
            const isActive = activeServiceId === srv.id;
            return (
              <Card
                key={srv.id}
                variant={inCart ? "glowing" : "glass"}
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
                      className={`cart-toggle-btn ${inCart ? "selected" : ""}`}
                      onClick={() => toggleCartSelection(srv)}
                      title={inCart ? "Remove from cart" : "Add to cart"}
                    >
                      {inCart ? "✓ In Cart" : "+ Add to Cart"}
                    </button>
                    <button
                      type="button"
                      className={`book-select-btn ${isActive ? "active" : ""}`}
                      onClick={() => handleBookThis(srv)}
                    >
                      {isActive ? "Selected" : "Book This"}
                    </button>
                  </div>
                </div>
              </Card>
            );
          })}
        </Carousel>
      </section>

      {cartSelections.length > 0 && (
        <div className="cart-drawer-panel">
          <div className="cart-drawer-container">
            <div className="cart-drawer-left">
              <h4 className="cart-drawer-title">YOUR SELECTIONS ({cartSelections.length} Items)</h4>
              <div className="cart-items-preview">
                {cartSelections.map(s => (
                  <span key={s.id} className="cart-preview-pill">
                    {s.name} ({formatCurrency(s.price)})
                    <button type="button" className="pill-remove-btn" onClick={() => toggleCartSelection(s)}>×</button>
                  </span>
                ))}
              </div>
            </div>
            <div className="cart-drawer-right">
              <div className="cart-price-summary">
                <span className="cart-summary-label">Total Price:</span>
                <span className="cart-summary-val">{formatCurrency(totalCartCost)}</span>
              </div>
              <div className="cart-drawer-actions">
                <button type="button" className="drawer-clear-btn" onClick={clearCartSelections}>Clear All</button>
                <button type="button" className="drawer-checkout-btn" onClick={handleCartCheckout}>
                  Proceed to Payment
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {cartSelections.length > 0 && <div className="cart-page-spacer" aria-hidden="true" />}

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
          height: 140px;
          overflow: hidden;
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
