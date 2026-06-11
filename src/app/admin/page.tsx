"use client";

import React, { useState, useEffect } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { formatCurrency } from "@/utils/formatters";
import { Booking, Service, Practitioner, Review } from "@/types/database";

export default function AdminDashboardPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [practitioners, setPractitioners] = useState<Practitioner[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const [bRes, sRes, pRes, rRes] = await Promise.all([
        fetch("/api/bookings"),
        fetch("/api/services"),
        fetch("/api/practitioners"),
        fetch("/api/reviews")
      ]);

      const bJson = await bRes.json();
      const sJson = await sRes.json();
      const pJson = await pRes.json();
      const rJson = await rRes.json();

      if (bJson.success && sJson.success && pJson.success && rJson.success) {
        setBookings(bJson.data);
        setServices(sJson.data);
        setPractitioners(pJson.data);
        setReviews(rJson.data);
      }
    } catch (err) {
      console.error("Failed to load dashboard data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  const totalRevenue = bookings
    .filter(b => b.paymentStatus === "paid" && b.status !== "cancelled")
    .reduce((sum, b) => sum + b.price, 0);

  const pendingCount = bookings.filter(b => b.status === "pending").length;

  return (
    <div className="dashboard-content">
      {/* Header */}
      <div className="dashboard-header-row">
        <div>
          <h2>Sanctuary Logistics Control</h2>
          <p style={{ color: "hsl(var(--text-muted))", fontSize: "0.9rem", marginTop: "4px" }}>
            Real-time analytics monitor and administrative overview of sanctuary systems.
          </p>
        </div>
        <button className="sync-btn" onClick={loadDashboardData}>
          🔄 Refresh Monitor
        </button>
      </div>

      {loading ? (
        <p style={{ color: "hsl(var(--text-muted))", marginTop: "40px" }}>Loading metrics...</p>
      ) : (
        <>
          {/* Stats Widgets */}
          <section className="stats-row">
            <Card variant="glass" className="stat-widget">
              <span className="stat-lbl">Sanctuary Revenue</span>
              <h3 className="stat-num">{formatCurrency(totalRevenue)}</h3>
              <span className="stat-sub">From paid confirmed bookings</span>
            </Card>

            <Card variant="glass" className="stat-widget">
              <span className="stat-lbl">Active Bookings</span>
              <h3 className="stat-num">{bookings.length}</h3>
              <span className="stat-sub">{pendingCount} pending approvals</span>
            </Card>

            <Card variant="glass" className="stat-widget">
              <span className="stat-lbl">Certified Healers</span>
              <h3 className="stat-num">{practitioners.length}</h3>
              <span className="stat-sub">Active in directory</span>
            </Card>

            <Card variant="glass" className="stat-widget">
              <span className="stat-lbl">Client Reviews</span>
              <h3 className="stat-num">{reviews.length}</h3>
              <span className="stat-sub">Testimonials recorded</span>
            </Card>
          </section>

          {/* Overview Columns */}
          <section className="dashboard-split-layout">
            {/* Recent Bookings */}
            <div className="split-column">
              <div className="column-header-row">
                <h3 className="column-title">Recent Appointments</h3>
              </div>
              <Card variant="glass" style={{ padding: "24px" }}>
                {bookings.length === 0 ? (
                  <p style={{ color: "hsl(var(--text-muted))", fontSize: "0.9rem" }}>No active bookings.</p>
                ) : (
                  <div className="recent-list">
                    {bookings.slice(0, 5).map(b => (
                      <div key={b.id} className="recent-item">
                        <div className="item-details">
                          <span className="item-title">{b.clientName}</span>
                          <span className="item-subtitle">{b.serviceName} • {b.date}</span>
                        </div>
                        <span className={`status-badge ${b.status}`}>{b.status}</span>
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            </div>

            {/* Testimonials moderator list */}
            <div className="split-column">
              <div className="column-header-row">
                <h3 className="column-title">Moderator Testimonials Feed</h3>
              </div>
              <Card variant="glass" style={{ padding: "24px" }}>
                {reviews.length === 0 ? (
                  <p style={{ color: "hsl(var(--text-muted))", fontSize: "0.9rem" }}>No reviews posted yet.</p>
                ) : (
                  <div className="recent-list">
                    {reviews.slice(0, 5).map(r => (
                      <div key={r.id} className="recent-item-vertical">
                        <div className="review-meta-row">
                          <span className="reviewer-name">{r.clientName}</span>
                          <span className="review-rating">{"★".repeat(r.rating)}</span>
                        </div>
                        <p className="review-comment">"{r.comment}"</p>
                        <span className="review-sub">{r.serviceName} • {r.practitionerName}</span>
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            </div>
          </section>
        </>
      )}

      <style jsx>{`
        .dashboard-content {
          display: flex;
          flex-direction: column;
          gap: 32px;
        }
        .dashboard-header-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .dashboard-header-row h2 {
          font-family: var(--font-serif);
          color: #4c1d95;
          font-size: 1.8rem;
        }
        .sync-btn {
          background: rgba(0,0,0,0.02);
          border: 1px solid rgba(0,0,0,0.08);
          color: hsl(var(--text-cream));
          padding: 10px 18px;
          border-radius: 8px;
          cursor: pointer;
          font-size: 0.85rem;
          font-weight: 600;
          transition: var(--transition-fast);
        }
        .sync-btn:hover {
          background: rgba(168, 85, 247, 0.08);
          border-color: #7c3aed;
          color: #7c3aed;
        }
        .stats-row {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 24px;
        }
        .stat-widget {
          padding: 24px;
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        .stat-lbl {
          font-size: 0.8rem;
          color: hsl(var(--text-muted));
          text-transform: uppercase;
          font-weight: 600;
          letter-spacing: 0.05em;
        }
        .stat-num {
          font-family: var(--font-serif);
          font-size: 2.1rem;
          color: #4c1d95;
        }
        .stat-sub {
          font-size: 0.75rem;
          color: hsl(var(--text-muted));
        }
        .dashboard-split-layout {
          display: grid;
          grid-template-columns: 1fr 1.2fr;
          gap: 32px;
        }
        .split-column {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        .column-title {
          font-family: var(--font-serif);
          font-size: 1.35rem;
          color: #4c1d95;
        }
        .recent-list {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        .recent-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-bottom: 1px solid rgba(0,0,0,0.05);
          padding-bottom: 12px;
        }
        .recent-item:last-child {
          border-bottom: none;
          padding-bottom: 0;
        }
        .item-details {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        .item-title {
          font-size: 0.95rem;
          font-weight: 600;
          color: hsl(var(--text-cream));
        }
        .item-subtitle {
          font-size: 0.8rem;
          color: hsl(var(--text-muted));
        }
        .recent-item-vertical {
          display: flex;
          flex-direction: column;
          gap: 8px;
          border-bottom: 1px solid rgba(0,0,0,0.05);
          padding-bottom: 14px;
        }
        .recent-item-vertical:last-child {
          border-bottom: none;
          padding-bottom: 0;
        }
        .review-meta-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .reviewer-name {
          font-size: 0.95rem;
          font-weight: 600;
          color: hsl(var(--text-cream));
        }
        .review-rating {
          color: #d97706;
          font-size: 0.85rem;
          letter-spacing: 2px;
        }
        .review-comment {
          font-size: 0.85rem;
          font-style: italic;
          color: hsl(var(--text-muted));
          line-height: 1.5;
        }
        .review-sub {
          font-size: 0.75rem;
          color: rgba(0,0,0,0.4);
        }
        .status-badge {
          font-size: 0.7rem;
          font-weight: 700;
          padding: 4px 10px;
          border-radius: 6px;
          text-transform: uppercase;
        }
        .status-badge.confirmed { background: rgba(34, 197, 94, 0.08); color: #15803d; border: 1px solid rgba(34, 197, 94, 0.25); }
        .status-badge.pending { background: rgba(234, 179, 8, 0.08); color: #b45309; border: 1px solid rgba(234, 179, 8, 0.25); }
        .status-badge.cancelled { background: rgba(239, 68, 68, 0.08); color: #b91c1c; border: 1px solid rgba(239, 68, 68, 0.25); }

        @media (max-width: 1024px) {
          .stats-row {
            grid-template-columns: repeat(2, 1fr);
          }
          .dashboard-split-layout {
            grid-template-columns: 1fr;
          }
        }
        @media (max-width: 640px) {
          .stats-row {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
}
