"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { formatCurrency } from "@/utils/formatters";
import { Service, Practitioner, Review } from "@/types/database";

export default function ServiceDetailPage() {
  const params = useParams();
  const router = useRouter();
  const serviceId = params?.id as string;

  const [service, setService] = useState<Service | null>(null);
  const [practitioner, setPractitioner] = useState<Practitioner | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState<"desc" | "benefits" | "process">("desc");

  useEffect(() => {
    if (!serviceId) return;

    async function loadServiceDetails() {
      try {
        setLoading(true);
        // 1. Fetch Service details
        const sRes = await fetch(`/api/services?id=${serviceId}`);
        const sJson = await sRes.json();

        if (!sJson.success) {
          setError(sJson.error || "Service details could not be retrieved.");
          setLoading(false);
          return;
        }

        const serviceData = sJson.data as Service;
        setService(serviceData);

        // 2. Fetch Practitioner details matching name & reviews matching service ID
        const [pRes, rRes] = await Promise.all([
          fetch("/api/practitioners"),
          fetch("/api/reviews")
        ]);

        const pJson = await pRes.json();
        const rJson = await rRes.json();

        if (pJson.success) {
          const matchPrac = pJson.data.find(
            (p: Practitioner) => p.name.toLowerCase() === serviceData.practitioner.toLowerCase()
          );
          if (matchPrac) {
            setPractitioner(matchPrac);
          }
        }

        if (rJson.success) {
          const serviceReviews = rJson.data.filter(
            (r: Review) => r.serviceId === serviceData.id || r.serviceName.toLowerCase() === serviceData.name.toLowerCase()
          );
          setReviews(serviceReviews);
        }

      } catch (err: any) {
        console.error(err);
        setError("An error occurred while loading this page.");
      } finally {
        setLoading(false);
      }
    }

    loadServiceDetails();
  }, [serviceId]);

  if (loading) {
    return (
      <div style={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>
        <Header />
        <main className="loading-state-wrapper">
          <div className="spinner"></div>
          <p>Aligning frequencies & reading service records...</p>
        </main>
        <Footer />
        <style jsx>{`
          .loading-state-wrapper {
            flex: 1;
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            gap: 16px;
            color: hsl(var(--text-muted));
            font-size: 1.1rem;
            min-height: 50vh;
          }
          .spinner {
            width: 40px;
            height: 40px;
            border: 3px solid rgba(124, 58, 237, 0.1);
            border-top-color: #7c3aed;
            border-radius: 50%;
            animation: spin 1s infinite linear;
          }
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  if (error || !service) {
    return (
      <div style={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>
        <Header />
        <main className="error-state-wrapper">
          <h2>⚠️ Session Scan Terminated</h2>
          <p>{error || "The requested therapy was not found in the Sanctuary record."}</p>
          <Button variant="gold" onClick={() => router.push("/search")} style={{ marginTop: "16px" }}>
            Return to Services List
          </Button>
        </main>
        <Footer />
        <style jsx>{`
          .error-state-wrapper {
            flex: 1;
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            gap: 12px;
            padding: 40px 24px;
            text-align: center;
            min-height: 50vh;
          }
          .error-state-wrapper h2 {
            font-family: var(--font-serif);
            color: #ef4444;
            font-size: 1.8rem;
          }
          .error-state-wrapper p {
            color: hsl(var(--text-muted));
          }
        `}</style>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>
      <Header />

      <main className="service-details-container">
        {/* Breadcrumbs */}
        <div className="breadcrumbs-row">
          <span className="breadcrumb-link" onClick={() => router.push("/")}>Home</span>
          <span className="breadcrumb-divider">/</span>
          <span className="breadcrumb-link" onClick={() => router.push("/search")}>Therapies</span>
          <span className="breadcrumb-divider">/</span>
          <span className="breadcrumb-active">{service.name}</span>
        </div>

        {/* Layout Split: Media Content + Sidebar booking card */}
        <div className="details-split-layout">
          
          {/* Main Content Column */}
          <div className="main-content-column">
            
            {/* Header info card */}
            <Card variant="glass" className="service-hero-header-card">
              <div className="hero-category-row">
                {service.categories && service.categories.length > 0 ? (
                  service.categories.map(cat => (
                    <span key={cat} className="service-category-badge">{cat}</span>
                  ))
                ) : (
                  <span className="service-category-badge">{service.category}</span>
                )}
                {service.rating && (
                  <span className="rating-tag">⭐ {service.rating.toFixed(1)} / 5.0</span>
                )}
              </div>
              <h1 className="service-page-title">{service.name}</h1>
              <p className="service-practitioner-subline">
                Guided by <strong>{service.practitioner}</strong>
              </p>
            </Card>

            {/* Video Player or Image display */}
            <div className="service-media-viewport">
              {service.video_url ? (
                <div className="video-player-wrapper glass-panel">
                  <video 
                    src={service.video_url} 
                    controls 
                    poster={service.image && !service.image.startsWith("aura_") && !service.image.startsWith("crystal_") && !service.image.startsWith("chakra_") ? service.image : "/images/reiki_placeholder.jpg"}
                    className="details-video-player"
                  />
                  <div className="video-tag-indicator">
                    📺 Guided Somatic Video Overview
                  </div>
                </div>
              ) : (
                <div 
                  className="hero-image-placeholder-wrapper glass-panel"
                  style={{
                    backgroundImage: `linear-gradient(rgba(0,0,0,0.1), rgba(0,0,0,0.4)), url(${
                      service.image && !service.image.startsWith("aura_") && !service.image.startsWith("crystal_") && !service.image.startsWith("chakra_")
                        ? service.image 
                        : "/images/reiki_placeholder.jpg"
                    })`
                  }}
                >
                  <div className="image-tag-indicator">
                    ✨ High-Vibrational Energy Field
                  </div>
                </div>
              )}
            </div>

            {/* Content Tabs for Description, Benefits, and Process */}
            <div className="details-navigation-tabs glass-panel">
              <div className="tabs-header-nav">
                <button 
                  className={`nav-tab-btn ${activeTab === "desc" ? "active" : ""}`}
                  onClick={() => setActiveTab("desc")}
                >
                  🪷 Description
                </button>
                <button 
                  className={`nav-tab-btn ${activeTab === "benefits" ? "active" : ""}`}
                  onClick={() => setActiveTab("benefits")}
                >
                  ✨ Somatic Benefits
                </button>
                <button 
                  className={`nav-tab-btn ${activeTab === "process" ? "active" : ""}`}
                  onClick={() => setActiveTab("process")}
                >
                  ⚙️ Therapeutic Process
                </button>
              </div>

              <div className="tab-pane-content">
                {activeTab === "desc" && (
                  <div className="desc-pane animate-fade-in">
                    <p className="tab-paragraph-text">{service.description}</p>
                    <div className="quick-specs-bullet-grid">
                      <div className="spec-bullet-item">
                        <span className="spec-icon">⏱️</span>
                        <div>
                          <strong>Session Duration</strong>
                          <span>{service.duration} Session</span>
                        </div>
                      </div>
                      <div className="spec-bullet-item">
                        <span className="spec-icon">🛡️</span>
                        <div>
                          <strong>Certified Sanctuary</strong>
                          <span>100% Secure & Sanitized Environment</span>
                        </div>
                      </div>
                      <div className="spec-bullet-item">
                        <span className="spec-icon">🔮</span>
                        <div>
                          <strong>Vibrational Focus</strong>
                          <span>{service.category} Alignment</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === "benefits" && (
                  <div className="benefits-pane animate-fade-in">
                    <h4 className="pane-section-title">Physical & Emotional Advantages</h4>
                    {service.benefits && service.benefits.length > 0 ? (
                      <div className="benefits-cards-grid">
                        {service.benefits.map((b, idx) => (
                          <div key={idx} className="benefit-card-bullet">
                            <span className="benefit-check">✦</span>
                            <span className="benefit-text">{b}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="empty-benefits-label">
                        This energy session offers full-body chakra alignment, somatic tension release, and inner peace integration.
                      </p>
                    )}
                  </div>
                )}

                {activeTab === "process" && (
                  <div className="process-pane animate-fade-in">
                    <h4 className="pane-section-title">What to Expect During Your Session</h4>
                    {service.process && service.process.length > 0 ? (
                      <div className="process-timeline-vertical">
                        {service.process.map((step, idx) => (
                          <div key={idx} className="timeline-node-item">
                            <div className="timeline-step-badge">{idx + 1}</div>
                            <div className="timeline-step-info">
                              <h5>Stage {idx + 1}</h5>
                              <p>{step}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="process-timeline-vertical">
                        <div className="timeline-node-item">
                          <div className="timeline-step-badge">1</div>
                          <div className="timeline-step-info">
                            <h5>Aura Scan & Alignment Check</h5>
                            <p>Initial evaluation mapping current chakra flow blockages.</p>
                          </div>
                        </div>
                        <div className="timeline-node-item">
                          <div className="timeline-step-badge">2</div>
                          <div className="timeline-step-info">
                            <h5>Targeted Energy Induction</h5>
                            <p>Certified practitioner applies selected aromatherapy, light reiki, or tuning forks to balance nodes.</p>
                          </div>
                        </div>
                        <div className="timeline-node-item">
                          <div className="timeline-step-badge">3</div>
                          <div className="timeline-step-info">
                            <h5>Post-Session Grounding</h5>
                            <p>Integration conversation to discuss findings and establish daily maintenance routines.</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Practitioner Profile Summary */}
            {practitioner && (
              <Card variant="glass" className="practitioner-profile-card">
                <h4 className="section-minor-heading">Your Therapist</h4>
                <div className="practitioner-flex-row">
                  <div 
                    className="prac-avatar"
                    style={{
                      backgroundImage: `url(${
                        practitioner.image && !practitioner.image.startsWith("elara_") && !practitioner.image.startsWith("master_") && !practitioner.image.startsWith("celeste_")
                          ? practitioner.image 
                          : "/images/avatar_placeholder.jpg"
                      })`
                    }}
                  />
                  <div className="prac-text-bio">
                    <h5>{practitioner.name}</h5>
                    <span className="prac-specialty-badge">{practitioner.specialty}</span>
                    <p className="prac-bio-summary">{practitioner.bio}</p>
                    <div className="prac-rating-stats">
                      <span>⭐ <strong>{practitioner.rating.toFixed(1)}</strong> Practitioner Rating</span>
                      <span className="dot-divider">•</span>
                      <span><strong>{practitioner.reviewsCount}</strong> Healing Reviews</span>
                    </div>
                  </div>
                </div>
              </Card>
            )}

            {/* Reviews Section */}
            <div className="service-reviews-section">
              <h4 className="section-minor-heading">Client Testimonials ({reviews.length})</h4>
              <div className="reviews-vertical-stack">
                {reviews.length === 0 ? (
                  <Card variant="glass" style={{ padding: "20px", textAlign: "center", color: "hsl(var(--text-muted))" }}>
                    No reviews recorded for this session yet. Be the first to schedule and leave feedback!
                  </Card>
                ) : (
                  reviews.map(rev => (
                    <Card key={rev.id} variant="glass" className="review-item-row-card">
                      <div className="review-meta-header">
                        <div>
                          <span className="reviewer-name">{rev.clientName}</span>
                          <span className="review-stars">{"★".repeat(rev.rating)}{"☆".repeat(5 - rev.rating)}</span>
                        </div>
                        <span className="review-date-badge">Verified booking</span>
                      </div>
                      <p className="review-comment-body">"{rev.comment}"</p>
                    </Card>
                  ))
                )}
              </div>
            </div>

          </div>

          {/* Sidebar Booking Card */}
          <div className="sidebar-booking-column">
            <Card variant="glowing" className="floating-booking-summary-card">
              <span className="booking-card-header-lbl">Sanctuary Therapy Booking</span>
              <h3 className="booking-card-title">{service.name}</h3>
              
              <div className="booking-stats-row">
                <div className="booking-stat-cell">
                  <span className="stat-label">Duration</span>
                  <span className="stat-val">{service.duration}</span>
                </div>
                <div className="booking-stat-cell">
                  <span className="stat-label">Type</span>
                  <span className="stat-val">{service.category}</span>
                </div>
              </div>

              <div className="price-tag-big-wrapper">
                <span className="price-tag-lbl">Exchange / Pricing</span>
                <h2 className="price-tag-val">{formatCurrency(service.price)}</h2>
                <span className="tax-notice">Taxes & therapist fee included</span>
              </div>

              <Button 
                variant="gold" 
                size="lg" 
                style={{ width: "100%", padding: "16px", fontSize: "1rem" }}
                onClick={() => router.push(`/booking?service=${service.id}`)}
              >
                Book This Session
              </Button>
              
              <div className="guarantees-subtext">
                <p>✓ Instant Booking Confirmation</p>
                <p>✓ 24hr Free Rescheduling Option</p>
                <p>✓ Led by Certified Healers only</p>
              </div>
            </Card>
          </div>

        </div>
      </main>

      <Footer />

      <style jsx>{`
        .service-details-container {
          max-width: 1200px;
          margin: 0 auto;
          padding: 40px 24px;
          display: flex;
          flex-direction: column;
          gap: 24px;
          width: 100%;
        }
        .breadcrumbs-row {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 0.82rem;
          color: hsl(var(--text-muted));
        }
        .breadcrumb-link {
          cursor: pointer;
          transition: var(--transition-fast);
        }
        .breadcrumb-link:hover {
          color: #7c3aed;
        }
        .breadcrumb-divider {
          color: rgba(0,0,0,0.15);
        }
        .breadcrumb-active {
          color: #4c1d95;
          font-weight: 600;
        }
        .details-split-layout {
          display: grid;
          grid-template-columns: 1.8fr 1fr;
          gap: 32px;
          align-items: start;
        }
        .main-content-column {
          display: flex;
          flex-direction: column;
          gap: 28px;
        }
        .service-hero-header-card {
          padding: 32px !important;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .hero-category-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .service-category-badge {
          background: rgba(16, 185, 129, 0.08);
          border: 1px solid rgba(16, 185, 129, 0.2);
          color: #065f46;
          font-size: 0.72rem;
          font-weight: 700;
          padding: 4px 10px;
          border-radius: 6px;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }
        .rating-tag {
          font-size: 0.85rem;
          font-weight: 700;
          color: #b45309;
        }
        .service-page-title {
          font-family: var(--font-serif);
          font-size: 2.2rem;
          color: #4c1d95;
          line-height: 1.15;
        }
        .service-practitioner-subline {
          font-size: 0.95rem;
          color: hsl(var(--text-muted));
        }
        .service-media-viewport {
          width: 100%;
        }
        .video-player-wrapper {
          position: relative;
          background: #000000;
          border-radius: 20px;
          overflow: hidden;
          box-shadow: 0 10px 30px rgba(0,0,0,0.1);
        }
        .details-video-player {
          width: 100%;
          display: block;
          max-height: 480px;
          aspect-ratio: 16/9;
          object-fit: contain;
          outline: none;
        }
        .video-tag-indicator, .image-tag-indicator {
          position: absolute;
          bottom: 16px;
          left: 16px;
          background: rgba(0,0,0,0.6);
          backdrop-filter: blur(8px);
          color: #ffffff;
          padding: 6px 14px;
          border-radius: 8px;
          font-size: 0.75rem;
          font-weight: 600;
        }
        .hero-image-placeholder-wrapper {
          position: relative;
          width: 100%;
          height: 380px;
          background-size: cover;
          background-position: center;
          border-radius: 20px;
          box-shadow: 0 10px 30px rgba(0,0,0,0.08);
        }
        
        /* Details Navigation Tabs */
        .details-navigation-tabs {
          padding: 24px 32px !important;
        }
        .tabs-header-nav {
          display: flex;
          gap: 16px;
          border-bottom: 1.5px solid rgba(0,0,0,0.06);
          padding-bottom: 12px;
          margin-bottom: 20px;
        }
        .nav-tab-btn {
          background: transparent;
          border: none;
          color: hsl(var(--text-muted));
          font-size: 0.95rem;
          font-weight: 600;
          cursor: pointer;
          position: relative;
          padding: 4px 8px;
          transition: var(--transition-fast);
        }
        .nav-tab-btn:hover {
          color: #7c3aed;
        }
        .nav-tab-btn.active {
          color: #7c3aed;
        }
        .nav-tab-btn.active::after {
          content: "";
          position: absolute;
          bottom: -13.5px;
          left: 0;
          right: 0;
          height: 2px;
          background: #7c3aed;
          border-radius: 99px;
        }
        .tab-pane-content {
          min-height: 150px;
        }
        .animate-fade-in {
          animation: tabFade 0.35s ease-out;
        }
        @keyframes tabFade {
          from { opacity: 0; transform: translateY(4px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .tab-paragraph-text {
          font-size: 0.98rem;
          line-height: 1.75;
          color: #334155;
        }
        .quick-specs-bullet-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 20px;
          margin-top: 24px;
          border-top: 1px solid rgba(0,0,0,0.05);
          padding-top: 20px;
        }
        .spec-bullet-item {
          display: flex;
          gap: 12px;
          align-items: center;
        }
        .spec-icon {
          font-size: 1.6rem;
          display: flex;
          align-items: center;
        }
        .spec-bullet-item strong {
          display: block;
          font-size: 0.82rem;
          color: #1e1b4b;
        }
        .spec-bullet-item span {
          font-size: 0.76rem;
          color: hsl(var(--text-muted));
        }

        /* Somatic Benefits style */
        .pane-section-title {
          font-family: var(--font-serif);
          font-size: 1.2rem;
          color: #4c1d95;
          margin-bottom: 16px;
        }
        .benefits-cards-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 12px;
        }
        .benefit-card-bullet {
          display: flex;
          gap: 10px;
          align-items: flex-start;
          background: rgba(168, 85, 247, 0.03);
          border: 1px solid rgba(168, 85, 247, 0.12);
          padding: 14px 18px;
          border-radius: 12px;
        }
        .benefit-check {
          color: #7c3aed;
          font-weight: 700;
        }
        .benefit-text {
          font-size: 0.88rem;
          color: #1e293b;
          line-height: 1.4;
        }
        .empty-benefits-label {
          font-size: 0.95rem;
          color: hsl(var(--text-muted));
          line-height: 1.6;
        }

        /* Therapeutic Process Timeline */
        .process-timeline-vertical {
          display: flex;
          flex-direction: column;
          gap: 20px;
          position: relative;
          padding-left: 20px;
          margin-top: 8px;
        }
        .process-timeline-vertical::before {
          content: "";
          position: absolute;
          top: 8px;
          bottom: 8px;
          left: 31px;
          width: 2px;
          background: rgba(168, 85, 247, 0.15);
          z-index: 1;
        }
        .timeline-node-item {
          display: flex;
          gap: 20px;
          position: relative;
          z-index: 2;
        }
        .timeline-step-badge {
          width: 24px;
          height: 24px;
          background: #7c3aed;
          color: #ffffff;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 0.78rem;
          font-weight: 700;
          box-shadow: 0 0 10px rgba(124, 58, 237, 0.25);
          flex-shrink: 0;
          margin-top: 2px;
        }
        .timeline-step-info {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        .timeline-step-info h5 {
          font-size: 0.92rem;
          font-weight: 700;
          color: #1e1b4b;
        }
        .timeline-step-info p {
          font-size: 0.85rem;
          color: hsl(var(--text-muted));
          line-height: 1.5;
        }

        /* Practitioner profile card */
        .section-minor-heading {
          font-family: var(--font-serif);
          font-size: 1.3rem;
          color: #4c1d95;
          margin-bottom: 16px;
        }
        :global(.practitioner-profile-card) {
          padding: 28px 32px !important;
        }
        .practitioner-flex-row {
          display: flex;
          gap: 24px;
          align-items: flex-start;
        }
        .prac-avatar {
          width: 80px;
          height: 80px;
          border-radius: 50%;
          background-size: cover;
          background-position: center;
          border: 2px solid var(--gold-border);
          box-shadow: 0 4px 15px rgba(0,0,0,0.05);
          flex-shrink: 0;
        }
        .prac-text-bio {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .prac-text-bio h5 {
          font-size: 1.15rem;
          color: #1e1b4b;
          font-weight: 700;
        }
        .prac-specialty-badge {
          background: rgba(124, 58, 237, 0.08);
          border: 1px solid rgba(124, 58, 237, 0.2);
          color: #6d28d9;
          font-size: 0.72rem;
          font-weight: 600;
          padding: 2px 8px;
          border-radius: 4px;
          width: max-content;
        }
        .prac-bio-summary {
          font-size: 0.88rem;
          line-height: 1.5;
          color: #334155;
        }
        .prac-rating-stats {
          font-size: 0.78rem;
          color: hsl(var(--text-muted));
          display: flex;
          align-items: center;
          gap: 8px;
          margin-top: 4px;
        }
        .dot-divider {
          color: rgba(0,0,0,0.15);
        }

        /* Testimonials style */
        .service-reviews-section {
          margin-top: 8px;
        }
        .reviews-vertical-stack {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        .review-item-row-card {
          padding: 20px 24px !important;
        }
        .review-meta-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 8px;
        }
        .reviewer-name {
          font-size: 0.9rem;
          font-weight: 700;
          color: #1e1b4b;
          margin-right: 12px;
        }
        .review-stars {
          color: #d97706;
          font-size: 0.8rem;
          letter-spacing: 1.5px;
        }
        .review-date-badge {
          background: rgba(34, 197, 94, 0.08);
          border: 1px solid rgba(34, 197, 94, 0.15);
          color: #166534;
          font-size: 0.65rem;
          font-weight: 700;
          padding: 2px 8px;
          border-radius: 4px;
          text-transform: uppercase;
        }
        .review-comment-body {
          font-size: 0.85rem;
          font-style: italic;
          color: hsl(var(--text-muted));
          line-height: 1.5;
        }

        /* Sidebar Booking Column layout */
        .sidebar-booking-column {
          position: sticky;
          top: 24px;
        }
        .floating-booking-summary-card {
          padding: 28px 24px !important;
          display: flex;
          flex-direction: column;
          gap: 20px;
        }
        .booking-card-header-lbl {
          font-size: 0.72rem;
          font-weight: 700;
          color: hsl(var(--text-muted));
          text-transform: uppercase;
          letter-spacing: 0.08em;
          border-bottom: 1px solid rgba(0,0,0,0.05);
          padding-bottom: 10px;
        }
        .booking-card-title {
          font-family: var(--font-serif);
          font-size: 1.45rem;
          color: #4c1d95;
          margin-top: -6px;
        }
        .booking-stats-row {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          background: rgba(0,0,0,0.02);
          border: 1px solid rgba(0,0,0,0.05);
          border-radius: 12px;
          padding: 12px;
        }
        .booking-stat-cell {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 2px;
        }
        .booking-stat-cell:first-child {
          border-right: 1px solid rgba(0,0,0,0.05);
        }
        .booking-stat-cell .stat-label {
          font-size: 0.68rem;
          color: hsl(var(--text-muted));
          text-transform: uppercase;
        }
        .booking-stat-cell .stat-val {
          font-size: 0.85rem;
          font-weight: 700;
          color: #1e1b4b;
        }
        .price-tag-big-wrapper {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }
        .price-tag-lbl {
          font-size: 0.72rem;
          color: hsl(var(--text-muted));
          text-transform: uppercase;
        }
        .price-tag-val {
          font-family: var(--font-serif);
          font-size: 2.1rem;
          color: #db2777;
          font-weight: 800;
        }
        .tax-notice {
          font-size: 0.72rem;
          color: rgba(0,0,0,0.4);
        }
        .guarantees-subtext {
          display: flex;
          flex-direction: column;
          gap: 6px;
          border-top: 1px solid rgba(0,0,0,0.05);
          padding-top: 14px;
        }
        .guarantees-subtext p {
          font-size: 0.75rem;
          color: hsl(var(--text-muted));
          font-weight: 500;
        }

        @media (max-width: 1024px) {
          .details-split-layout {
            grid-template-columns: 1fr;
          }
          .sidebar-booking-column {
            position: static;
            margin-top: 16px;
          }
        }
      `}</style>
    </div>
  );
}
