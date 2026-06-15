"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Practitioner, Service, Review } from "@/types/database";
import { formatCurrency } from "@/utils/formatters";

export default function HealerDetailPage() {
  const params = useParams();
  const router = useRouter();
  const healerId = params?.id as string;

  const [healer, setHealer] = useState<Practitioner | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!healerId) return;

    async function loadHealerDetails() {
      try {
        setLoading(true);
        // 1. Fetch healer details by ID
        const hRes = await fetch(`/api/practitioners?id=${healerId}`);
        const hJson = await hRes.json();

        if (!hJson.success) {
          setError(hJson.error || "Healer details could not be retrieved.");
          setLoading(false);
          return;
        }

        const healerData = hJson.data as Practitioner;
        setHealer(healerData);

        // 2. Fetch all services and reviews to filter
        const [servicesRes, reviewsRes] = await Promise.all([
          fetch("/api/services"),
          fetch("/api/reviews")
        ]);

        const sJson = await servicesRes.json();
        const rJson = await reviewsRes.json();

        if (sJson.success) {
          // Filter services led by this healer
          const filteredServices = sJson.data.filter((s: Service) => 
            s.practitioner.toLowerCase() === healerData.name.toLowerCase()
          );
          setServices(filteredServices);
        }

        if (rJson.success) {
          // Filter reviews mentioning this healer
          const filteredReviews = rJson.data.filter((r: Review) => 
            r.practitionerId === healerData.id || r.practitionerName.toLowerCase() === healerData.name.toLowerCase()
          );
          setReviews(filteredReviews);
        }

      } catch (err) {
        console.error(err);
        setError("An error occurred while loading this profile.");
      } finally {
        setLoading(false);
      }
    }

    loadHealerDetails();
  }, [healerId]);

  const getFileName = (url: string) => {
    return url.split("/").pop() || "Document";
  };

  if (loading) {
    return (
      <div style={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>
        <Header />
        <main className="loading-state-wrapper">
          <div className="spinner"></div>
          <p>Aligning frequencies & opening practitioner bio...</p>
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
            border: 3px solid rgba(212, 175, 55, 0.1);
            border-top-color: #d4af37;
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

  if (error || !healer) {
    return (
      <div style={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>
        <Header />
        <main className="error-state-wrapper">
          <h2>⚠️ Registry Search Terminated</h2>
          <p>{error || "The requested practitioner profile was not found."}</p>
          <Button variant="gold" onClick={() => router.push("/team")} style={{ marginTop: "16px" }}>
            Return to Team List
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

      <main className="profile-details-container animate-fade-in">
        {/* Breadcrumbs */}
        <div className="breadcrumbs-row">
          <span className="breadcrumb-link" onClick={() => router.push("/")}>Home</span>
          <span className="breadcrumb-divider">/</span>
          <span className="breadcrumb-link" onClick={() => router.push("/team")}>Our Team</span>
          <span className="breadcrumb-divider">/</span>
          <span className="breadcrumb-active">{healer.name}</span>
        </div>

        {/* Layout Split: Left column sidebar (image, expertise, certs) + Right column main (bio, video, services, reviews) */}
        <div className="profile-split-layout">
          
          {/* Sidebar Column */}
          <div className="profile-sidebar-col">
            <Card variant="glowing" className="sidebar-info-card">
              <div className="avatar-frame">
                {healer.image && healer.image.startsWith("/") ? (
                  <img src={healer.image} alt={healer.name} className="profile-large-img" />
                ) : (
                  <div className="profile-large-placeholder">
                    {healer.name.split(" ").map(n => n[0]).join("")}
                  </div>
                )}
                <div className="profile-glowing-ring"></div>
              </div>

              <h2 className="profile-name">{healer.name}</h2>
              <span className="profile-specialty">{healer.specialty}</span>

              <div className="rating-metrics">
                <span className="stars">★ ★ ★ ★ ★</span>
                <span className="metrics-text">{healer.rating.toFixed(1)} ({healer.reviewsCount} Reviews)</span>
              </div>

              {/* Area of Expertise */}
              {healer.expertise && healer.expertise.length > 0 && (
                <div className="sidebar-section">
                  <h4 className="sidebar-section-title">Areas of Expertise</h4>
                  <div className="expertise-tags-container">
                    {healer.expertise.map((exp, idx) => (
                      <span key={idx} className="expertise-pill">{exp}</span>
                    ))}
                  </div>
                </div>
              )}

              {/* Certifications list */}
              {healer.certifications && healer.certifications.length > 0 && (
                <div className="sidebar-section">
                  <h4 className="sidebar-section-title">Credentials & Certifications</h4>
                  <div className="certs-listing">
                    {healer.certifications.map((url, idx) => (
                      <a 
                        key={idx} 
                        href={url} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="cert-link-item"
                      >
                        <span className="cert-icon">📜</span>
                        <span className="cert-file-name" title={getFileName(url)}>{getFileName(url)}</span>
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </Card>
          </div>

          {/* Main Content Column */}
          <div className="profile-main-col">
            
            {/* Biography */}
            <Card variant="glass" className="main-content-card">
              <h3 className="section-title">Sacred Biography</h3>
              <p className="healer-bio-text">{healer.bio}</p>
            </Card>

            {/* Video Bio */}
            {healer.video_url && (
              <Card variant="glass" className="main-content-card video-card-wrapper">
                <h3 className="section-title">Video Introduction</h3>
                <p className="section-desc">Listen directly to {healer.name} discuss their healing lineage and approach.</p>
                <div className="video-player-container">
                  <video src={healer.video_url} controls className="embedded-video-player" />
                </div>
              </Card>
            )}

            {/* Services Offered */}
            <div className="section-block">
              <h3 className="section-title-outer">Therapies Offered</h3>
              {services.length === 0 ? (
                <Card variant="glass" style={{ padding: "24px", color: "hsl(var(--text-muted))" }}>
                  There are currently no active therapies listed under {healer.name}'s guidance.
                </Card>
              ) : (
                <div className="services-list-grid">
                  {services.map(srv => (
                    <Card key={srv.id} variant="glass" className="service-offer-card">
                      <div className="service-card-header">
                        <div>
                          <h4>{srv.name}</h4>
                          <span className="duration-tag">⏱️ {srv.duration}</span>
                        </div>
                        <div className="price-tag">{formatCurrency(srv.price)}</div>
                      </div>
                      <p className="service-desc-preview">
                        {srv.description.length > 120 ? `${srv.description.substring(0, 120)}...` : srv.description}
                      </p>
                      <div className="service-card-action">
                        <Link href={`/services/${srv.id}`} className="view-therapy-btn">
                          View Therapy Details
                        </Link>
                        <Link href={`/booking?service=${srv.id}`} className="book-therapy-btn">
                          Book Session
                        </Link>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </div>

            {/* Reviews / Testimonials */}
            <div className="section-block">
              <h3 className="section-title-outer">Client Testimonials ({reviews.length})</h3>
              {reviews.length === 0 ? (
                <Card variant="glass" style={{ padding: "24px", textAlign: "center", color: "hsl(var(--text-muted))" }}>
                  No testimonials recorded for {healer.name} yet.
                </Card>
              ) : (
                <div className="reviews-stack">
                  {reviews.map(rev => (
                    <Card key={rev.id} variant="glass" className="review-card-item">
                      <div className="review-header">
                        <div>
                          <span className="reviewer-name">{rev.clientName}</span>
                          <span className="review-rating-stars">{"★".repeat(rev.rating)}{"☆".repeat(5 - rev.rating)}</span>
                        </div>
                        {rev.serviceName && <span className="review-service-badge">{rev.serviceName}</span>}
                      </div>
                      <p className="review-comment">"{rev.comment}"</p>
                      <span className="review-date">{new Date(rev.date).toLocaleDateString()}</span>
                    </Card>
                  ))}
                </div>
              )}
            </div>

          </div>

        </div>
      </main>

      <Footer />

      <style jsx>{`
        .profile-details-container {
          max-width: 1200px;
          margin: 0 auto;
          padding: 40px 24px 80px;
          display: flex;
          flex-direction: column;
          gap: 24px;
          width: 100%;
          flex-grow: 1;
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
          color: #d4af37;
        }

        .breadcrumb-divider {
          color: rgba(255, 255, 255, 0.1);
        }

        .breadcrumb-active {
          color: #ecd3b6;
          font-weight: 600;
        }

        .profile-split-layout {
          display: grid;
          grid-template-columns: 1fr 2fr;
          gap: 40px;
          align-items: start;
        }

        /* Sidebar column styling */
        .profile-sidebar-col {
          display: flex;
          flex-direction: column;
          gap: 24px;
        }

        :global(.sidebar-info-card) {
          padding: 40px 32px !important;
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          background: rgba(15, 12, 28, 0.5) !important;
          border: 1px solid rgba(212, 175, 55, 0.15) !important;
        }

        .avatar-frame {
          position: relative;
          width: 160px;
          height: 160px;
          margin-bottom: 24px;
        }

        .profile-large-img {
          width: 160px;
          height: 160px;
          border-radius: 50%;
          object-fit: cover;
          position: relative;
          z-index: 2;
          border: 2px solid var(--gold-border);
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.4);
        }

        .profile-large-placeholder {
          width: 160px;
          height: 160px;
          border-radius: 50%;
          background: linear-gradient(135deg, rgba(124, 58, 237, 0.2) 0%, rgba(212, 175, 55, 0.2) 100%);
          border: 2px solid var(--gold-border);
          display: flex;
          align-items: center;
          justify-content: center;
          font-family: var(--font-serif);
          font-weight: 700;
          color: #ecd3b6;
          font-size: 2.8rem;
          position: relative;
          z-index: 2;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.4);
        }

        .profile-glowing-ring {
          position: absolute;
          top: -8px;
          left: -8px;
          right: -8px;
          bottom: -8px;
          border-radius: 50%;
          border: 1.5px dashed rgba(212, 175, 55, 0.35);
          z-index: 1;
        }

        .profile-name {
          font-family: var(--font-serif);
          font-size: 1.8rem;
          color: #ffffff;
          margin-bottom: 6px;
        }

        .profile-specialty {
          font-size: 0.9rem;
          color: #d4af37;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          margin-bottom: 16px;
        }

        .rating-metrics {
          display: flex;
          flex-direction: column;
          gap: 6px;
          align-items: center;
          margin-bottom: 24px;
        }

        .stars {
          color: #d4af37;
          font-size: 0.95rem;
          letter-spacing: 2px;
        }

        .metrics-text {
          font-size: 0.8rem;
          color: hsl(var(--text-muted));
        }

        .sidebar-section {
          width: 100%;
          border-top: 1px solid rgba(255, 255, 255, 0.06);
          padding-top: 24px;
          margin-top: 12px;
          text-align: left;
        }

        .sidebar-section-title {
          font-family: var(--font-serif);
          font-size: 0.95rem;
          color: #ecd3b6;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          margin-bottom: 14px;
          font-weight: 600;
        }

        .expertise-tags-container {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
        }

        .expertise-pill {
          font-size: 0.75rem;
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.08);
          color: #e2e8f0;
          padding: 6px 12px;
          border-radius: 6px;
          font-weight: 500;
        }

        .certs-listing {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .cert-link-item {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 8px 12px;
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid rgba(255, 255, 255, 0.06);
          border-radius: 8px;
          text-decoration: none;
          color: #cbd5e1;
          font-size: 0.8rem;
          transition: background-color 0.2s, border-color 0.2s;
        }

        .cert-link-item:hover {
          background: rgba(212, 175, 55, 0.05);
          border-color: rgba(212, 175, 55, 0.2);
          color: #ffffff;
        }

        .cert-icon {
          font-size: 1.1rem;
        }

        .cert-file-name {
          text-overflow: ellipsis;
          overflow: hidden;
          white-space: nowrap;
          max-width: 180px;
        }

        /* Main column styling */
        .profile-main-col {
          display: flex;
          flex-direction: column;
          gap: 32px;
        }

        :global(.main-content-card) {
          padding: 36px !important;
          background: rgba(15, 12, 28, 0.35) !important;
          border: 1px solid rgba(255, 255, 255, 0.05) !important;
        }

        .section-title {
          font-family: var(--font-serif);
          font-size: 1.5rem;
          color: #ecd3b6;
          margin-bottom: 18px;
          border-bottom: 1.5px solid rgba(212, 175, 55, 0.15);
          padding-bottom: 8px;
          width: max-content;
        }

        .healer-bio-text {
          font-size: 1.02rem;
          line-height: 1.8;
          color: #e2e8f0;
          white-space: pre-line;
        }

        .section-desc {
          font-size: 0.9rem;
          color: hsl(var(--text-muted));
          margin-top: -8px;
          margin-bottom: 20px;
        }

        /* Video style */
        .video-player-container {
          position: relative;
          background: #000000;
          border-radius: 16px;
          overflow: hidden;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
          aspect-ratio: 16/9;
          max-width: 100%;
        }

        .embedded-video-player {
          width: 100%;
          height: 100%;
          display: block;
          object-fit: contain;
          outline: none;
        }

        /* Services offer grid */
        .section-title-outer {
          font-family: var(--font-serif);
          font-size: 1.6rem;
          color: #ffffff;
          margin-bottom: 20px;
        }

        .section-block {
          width: 100%;
        }

        .services-list-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
          gap: 24px;
        }

        :global(.service-offer-card) {
          padding: 24px !important;
          display: flex;
          flex-direction: column;
          gap: 12px;
          background: rgba(15, 12, 28, 0.3) !important;
          border: 1px solid rgba(255, 255, 255, 0.05) !important;
        }

        .service-card-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 12px;
        }

        .service-card-header h4 {
          font-family: var(--font-serif);
          font-size: 1.2rem;
          color: #ffffff;
        }

        .duration-tag {
          font-size: 0.72rem;
          color: #ecd3b6;
          display: block;
          margin-top: 4px;
          font-weight: 500;
        }

        .price-tag {
          font-size: 1.2rem;
          font-weight: 700;
          color: #d4af37;
          font-family: var(--font-serif);
        }

        .service-desc-preview {
          font-size: 0.88rem;
          color: #cbd5e1;
          line-height: 1.5;
          flex-grow: 1;
        }

        .service-card-action {
          display: grid;
          grid-template-columns: 1.2fr 1fr;
          gap: 12px;
          margin-top: 8px;
        }

        .view-therapy-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 10px;
          border-radius: 8px;
          border: 1px solid rgba(255, 255, 255, 0.1);
          color: #ffffff;
          font-size: 0.8rem;
          text-decoration: none;
          font-weight: 600;
          transition: background-color 0.2s;
        }

        .view-therapy-btn:hover {
          background: rgba(255, 255, 255, 0.05);
        }

        .book-therapy-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 10px;
          border-radius: 8px;
          background: var(--btn-gold-bg);
          color: var(--btn-gold-text);
          font-size: 0.8rem;
          text-decoration: none;
          font-weight: 700;
          transition: opacity 0.2s;
        }

        .book-therapy-btn:hover {
          filter: brightness(1.1);
        }

        /* Reviews Stack */
        .reviews-stack {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        :global(.review-card-item) {
          padding: 24px !important;
          background: rgba(15, 12, 28, 0.25) !important;
          border: 1px solid rgba(255, 255, 255, 0.05) !important;
        }

        .review-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 16px;
          margin-bottom: 12px;
        }

        .reviewer-name {
          font-weight: 600;
          color: #ffffff;
          display: block;
          font-size: 0.95rem;
        }

        .review-rating-stars {
          color: #d4af37;
          font-size: 0.8rem;
          letter-spacing: 1.5px;
          margin-top: 2px;
          display: block;
        }

        .review-service-badge {
          font-size: 0.72rem;
          background: rgba(212, 175, 55, 0.08);
          border: 1px solid rgba(212, 175, 55, 0.15);
          color: #d4af37;
          padding: 2px 8px;
          border-radius: 4px;
          font-weight: 500;
        }

        .review-comment {
          font-size: 0.9rem;
          line-height: 1.6;
          color: #cbd5e1;
          font-style: italic;
          margin-bottom: 8px;
        }

        .review-date {
          font-size: 0.72rem;
          color: hsl(var(--text-muted));
          display: block;
          text-align: right;
        }

        .animate-fade-in {
          animation: fadeIn 0.8s cubic-bezier(0.16, 1, 0.3, 1) both;
        }

        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        @media (max-width: 960px) {
          .profile-split-layout {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
}
