"use client";

import React, { useEffect, useState, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { ComparisonPage, Service } from "@/types/database";
import { MediaCarousel } from "@/components/ui/MediaCarousel";
import { ServicesCartCarousel } from "@/components/services/ServicesCartCarousel";
import { Button } from "@/components/ui/Button";
import { useBlog } from "../../BlogContext";

export default function ComparisonSlugPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;
  const { searchQuery } = useBlog();

  const [page, setPage] = useState<ComparisonPage | null>(null);
  const [allServices, setAllServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch(`/api/comparisons?slug=${encodeURIComponent(slug)}`).then(r => r.json()),
      fetch("/api/services").then(r => r.json()),
    ])
      .then(([cJson, sJson]) => {
        if (cJson.success) setPage(cJson.data);
        else router.replace("/blog/comparison");
        if (sJson.success) setAllServices(sJson.data);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [slug, router]);

  const filteredRows = useMemo(() => {
    if (!page) return [];
    if (!searchQuery.trim()) return page.rows;
    const q = searchQuery.toLowerCase();
    return page.rows.filter(
      r =>
        r.label.toLowerCase().includes(q) ||
        r.valueA.toLowerCase().includes(q) ||
        r.valueB.toLowerCase().includes(q)
    );
  }, [page, searchQuery]);

  const carouselServices = useMemo(() => {
    if (!page) return [];
    if (page.serviceIds.length > 0) {
      return allServices.filter(s => page.serviceIds.includes(s.id));
    }
    const linked = [page.modalityAServiceId, page.modalityBServiceId].filter(Boolean);
    if (linked.length > 0) {
      return allServices.filter(s => linked.includes(s.id));
    }
    return allServices.slice(0, 6);
  }, [page, allServices]);

  if (loading) {
    return <p className="text-center-pad">Loading comparison...</p>;
  }

  if (!page) return null;

  return (
    <div className="comparison-page">
      <div className="comp-header">
        <h1 className="page-title">{page.title}</h1>
        {page.subtitle && <p className="page-subtitle">{page.subtitle}</p>}
      </div>

      {/* Card-grid comparison table */}
      <div className="comparison-grid-table">
        {/* Header row */}
        <div className="grid-row header-row">
          <div className="comp-card label-card header-label">
            <span className="header-features">Features</span>
          </div>
          <div className="comp-card modality-header">
            <span className="modality-title">{page.modalityAName}</span>
            {page.modalityAPrice && <span className="modality-price">{page.modalityAPrice}</span>}
          </div>
          <div className="comp-card modality-header">
            <span className="modality-title">{page.modalityBName}</span>
            {page.modalityBPrice && <span className="modality-price">{page.modalityBPrice}</span>}
          </div>
        </div>

        {/* Data rows */}
        {filteredRows.map((row, idx) => (
          <div key={idx} className="grid-row">
            <div className="comp-card label-card">
              <span className="row-label">{row.label}</span>
            </div>
            <div className="comp-card value-card">
              <p>{row.valueA}</p>
            </div>
            <div className="comp-card value-card">
              <p>{row.valueB}</p>
            </div>
          </div>
        ))}

        {filteredRows.length === 0 && (
          <div className="no-results">No rows match your search.</div>
        )}
      </div>

      {/* Booking CTAs */}
      {(page.modalityAServiceId || page.modalityBServiceId) && (
        <div className="booking-cta-grid">
          {page.modalityAServiceId && (
            <div className="cta-card glass-panel">
              <h4>Book {page.modalityAName}</h4>
              <Button variant="gold" size="lg" onClick={() => router.push(`/booking?service=${page.modalityAServiceId}`)}>
                Book {page.modalityAName}
              </Button>
            </div>
          )}
          {page.modalityBServiceId && (
            <div className="cta-card glass-panel">
              <h4>Book {page.modalityBName}</h4>
              <Button variant="primary" size="lg" onClick={() => router.push(`/booking?service=${page.modalityBServiceId}`)}>
                Book {page.modalityBName}
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Media carousel */}
      {page.media.length > 0 && (
        <MediaCarousel items={page.media} title="✨ Sacred Gallery" />
      )}

      {/* Services carousel */}
      <ServicesCartCarousel
        services={carouselServices}
        title="Book Your Recommended Session"
      />

      <style jsx>{`
        .comparison-page {
          display: flex;
          flex-direction: column;
          gap: 40px;
          width: 100%;
        }
        .comp-header {
          text-align: center;
          padding: 8px 0 0;
        }
        .page-title {
          font-size: 2.4rem;
          color: #5D327C;
          margin-bottom: 8px;
          font-weight: 700;
          font-family: var(--font-serif);
          letter-spacing: -0.01em;
        }
        .page-subtitle {
          font-size: 1rem;
          color: hsl(var(--text-muted));
          max-width: 650px;
          margin: 0 auto;
          line-height: 1.6;
        }
        .comparison-grid-table {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .grid-row {
          display: grid;
          grid-template-columns: 1fr 1.4fr 1.4fr;
          gap: 12px;
        }
        .comp-card {
          background: #fff;
          border-radius: 10px;
          padding: 20px 24px;
          box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
          border: 1px solid rgba(0, 0, 0, 0.04);
        }
        .label-card {
          display: flex;
          align-items: center;
        }
        .header-label {
          background: rgba(93, 50, 124, 0.04);
        }
        .header-features {
          font-family: var(--font-serif);
          font-size: 1.1rem;
          color: #5D327C;
          font-weight: 700;
        }
        .modality-header {
          display: flex;
          flex-direction: column;
          gap: 6px;
          justify-content: center;
        }
        .modality-title {
          font-family: var(--font-serif);
          font-size: 1.35rem;
          color: #5D327C;
          font-weight: 700;
        }
        .modality-price {
          font-size: 0.78rem;
          color: #2D8A5B;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.04em;
        }
        .row-label {
          font-weight: 700;
          font-size: 0.9rem;
          color: hsl(var(--text-muted));
        }
        .value-card p {
          font-size: 0.92rem;
          color: hsl(var(--text-cream));
          line-height: 1.55;
          margin: 0;
        }
        .no-results {
          text-align: center;
          padding: 32px;
          color: hsl(var(--text-muted));
          font-size: 0.95rem;
        }
        .booking-cta-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 24px;
        }
        .cta-card {
          padding: 28px;
          border-radius: 16px;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 16px;
          text-align: center;
        }
        .cta-card h4 {
          font-family: var(--font-serif);
          font-size: 1.2rem;
          color: #5D327C;
        }
        @media (max-width: 768px) {
          .grid-row {
            grid-template-columns: 1fr;
          }
          .header-row {
            display: none;
          }
          .grid-row:not(.header-row) .label-card {
            background: rgba(93, 50, 124, 0.06);
            border-bottom: none;
            padding-bottom: 8px;
          }
          .booking-cta-grid {
            grid-template-columns: 1fr;
          }
          .page-title { font-size: 1.8rem; }
        }
      `}</style>
    </div>
  );
}
