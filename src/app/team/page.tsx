"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Card } from "@/components/ui/Card";
import { Practitioner } from "@/types/database";

export default function TeamPage() {
  const [practitioners, setPractitioners] = useState<Practitioner[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadPractitioners() {
      try {
        const res = await fetch("/api/practitioners");
        const json = await res.json();
        if (json.success) {
          setPractitioners(json.data);
        }
      } catch (err) {
        console.error("Failed to load practitioners", err);
      } finally {
        setLoading(false);
      }
    }
    loadPractitioners();
  }, []);

  return (
    <div className="page-shell">
      <Header />

      <main className="team-container">
        {/* Header Section */}
        <section className="team-header animate-fade-in">
          <span className="section-label">Divine Sanctuary Team</span>
          <h1 className="team-title gold-text-gradient">Our Certified Healers & Guides</h1>
          <p className="team-subtitle">
            Meet our master practitioners committed to your cosmic balance, energetic alignment, and mental tranquility.
          </p>
        </section>

        {/* Grid of Team Members */}
        {loading ? (
          <div className="loading-state">
            <div className="spinner"></div>
            <p>Aligning healer registers and frequencies...</p>
          </div>
        ) : (
          <section className="team-grid-section">
            <div className="team-grid">
              {practitioners.map((prac, idx) => (
                <Card 
                  key={prac.id} 
                  variant="glass" 
                  className={`team-card animate-slide-up team-card-delay-${idx % 12}`}
                >
                  <div className="card-top-accent"></div>
                  
                  <div className="avatar-wrapper">
                    {prac.image && prac.image.startsWith("/") ? (
                      <img src={prac.image} alt={prac.name} className="prac-photo" />
                    ) : (
                      <div className="prac-initial-avatar">
                        {prac.name.split(" ").map(n => n[0]).join("")}
                      </div>
                    )}
                    <div className="avatar-ring"></div>
                  </div>

                  <div className="card-info">
                    <h3 className="prac-name">{prac.name}</h3>
                    <span className="prac-specialty">{prac.specialty}</span>
                    
                    {/* Rating display */}
                    <div className="prac-rating">
                      <span className="stars">★ ★ ★ ★ ★</span>
                      <span className="rating-score">
                        {prac.rating.toFixed(1)} ({prac.reviewsCount} reviews)
                      </span>
                    </div>

                    {/* Expertise chips */}
                    {prac.expertise && prac.expertise.length > 0 && (
                      <div className="expertise-tags-row">
                        {prac.expertise.slice(0, 3).map((exp, i) => (
                          <span key={i} className="expertise-badge">{exp}</span>
                        ))}
                        {prac.expertise.length > 3 && (
                          <span className="expertise-badge-more">+{prac.expertise.length - 3}</span>
                        )}
                      </div>
                    )}

                    <p className="prac-bio-preview">
                      {prac.bio.length > 130 ? `${prac.bio.substring(0, 130)}...` : prac.bio}
                    </p>

                    <div className="card-actions">
                      <Link href={`/team/${prac.id}`} className="view-profile-btn">
                        View Inner Bio & Details <span>→</span>
                      </Link>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </section>
        )}
      </main>

      <Footer />

      <style jsx>{`
        .team-container {
          max-width: 1200px;
          margin: 0 auto;
          padding: 80px 24px;
          display: flex;
          flex-direction: column;
          gap: 60px;
          width: 100%;
          flex-grow: 1;
        }

        .team-header {
          text-align: center;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 12px;
        }

        .section-label {
          font-family: var(--font-serif);
          font-size: 0.85rem;
          text-transform: uppercase;
          letter-spacing: 0.2em;
          color: #7c3aed;
          font-weight: 700;
        }

        .team-title {
          font-family: var(--font-serif);
          font-size: 3rem;
          line-height: 1.15;
          margin: 4px 0 12px;
        }

        .team-subtitle {
          font-size: 1.1rem;
          color: hsl(var(--text-muted));
          max-width: 700px;
          line-height: 1.6;
        }

        /* Grid Section */
        .team-grid-section {
          width: 100%;
        }

        .team-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(360px, 1fr));
          gap: 40px;
        }

        /* Healer Card */
        :global(.team-card) {
          position: relative;
          padding: 0 !important;
          border-radius: 24px !important;
          overflow: hidden;
          transition: transform 0.4s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.4s cubic-bezier(0.16, 1, 0.3, 1) !important;
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          background: rgba(255, 255, 255, 0.8) !important;
          border: 1px solid var(--gold-border) !important;
          box-shadow: 0 8px 30px rgba(168, 85, 247, 0.04) !important;
        }

        :global(.team-card:hover) {
          transform: translateY(-8px);
          box-shadow: 0 20px 40px rgba(124, 58, 237, 0.1) !important;
          border-color: rgba(168, 85, 247, 0.4) !important;
        }

        .card-top-accent {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 6px;
          background: linear-gradient(90deg, #7c3aed, #d4af37);
          opacity: 0.8;
        }

        .avatar-wrapper {
          position: relative;
          margin-top: 40px;
          margin-bottom: 24px;
        }

        .prac-photo {
          width: 120px;
          height: 120px;
          border-radius: 50%;
          object-fit: cover;
          position: relative;
          z-index: 2;
          box-shadow: 0 8px 24px rgba(168, 85, 247, 0.1);
        }

        .prac-initial-avatar {
          width: 120px;
          height: 120px;
          border-radius: 50%;
          background: linear-gradient(135deg, rgba(124, 58, 237, 0.15) 0%, rgba(212, 175, 55, 0.15) 100%);
          border: 2px solid rgba(168, 85, 247, 0.4);
          display: flex;
          align-items: center;
          justify-content: center;
          font-family: var(--font-serif);
          font-weight: 700;
          color: #4c1d95;
          font-size: 2rem;
          position: relative;
          z-index: 2;
          box-shadow: 0 8px 24px rgba(168, 85, 247, 0.1);
        }

        .avatar-ring {
          position: absolute;
          top: -6px;
          left: -6px;
          right: -6px;
          bottom: -6px;
          border-radius: 50%;
          border: 1px dashed rgba(124, 58, 237, 0.3);
          z-index: 1;
          animation: spin-clockwise 40s linear infinite;
        }

        .card-info {
          padding: 0 32px 40px;
          display: flex;
          flex-direction: column;
          align-items: center;
          width: 100%;
        }

        .prac-name {
          font-family: var(--font-serif);
          font-size: 1.5rem;
          color: #4c1d95;
          margin-bottom: 6px;
        }

        .prac-specialty {
          font-size: 0.85rem;
          color: #0d9488;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          margin-bottom: 12px;
        }

        .prac-rating {
          display: flex;
          gap: 8px;
          align-items: center;
          margin-bottom: 16px;
        }

        .stars {
          color: #d4af37;
          font-size: 0.85rem;
          letter-spacing: 2px;
        }

        .rating-score {
          font-size: 0.8rem;
          color: hsl(var(--text-muted));
        }

        .expertise-tags-row {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
          justify-content: center;
          margin-bottom: 20px;
        }

        .expertise-badge {
          font-size: 0.72rem;
          background: rgba(168, 85, 247, 0.05);
          border: 1px solid rgba(168, 85, 247, 0.15);
          color: #6d28d9;
          padding: 4px 10px;
          border-radius: 6px;
          font-weight: 500;
          transition: background-color 0.2s;
        }

        .expertise-badge-more {
          font-size: 0.72rem;
          background: rgba(124, 58, 237, 0.1);
          border: 1px solid rgba(124, 58, 237, 0.2);
          color: #4c1d95;
          padding: 4px 8px;
          border-radius: 6px;
          font-weight: 600;
        }

        .prac-bio-preview {
          font-size: 0.9rem;
          line-height: 1.6;
          color: #475569;
          margin-bottom: 28px;
          height: 80px;
          overflow: hidden;
          display: -webkit-box;
          -webkit-line-clamp: 3;
          -webkit-box-orient: vertical;
        }

        .view-profile-btn {
          font-family: var(--font-serif);
          font-size: 0.8rem;
          color: #7c3aed;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          text-decoration: none;
          font-weight: 700;
          border-bottom: 1.5px solid #7c3aed;
          padding-bottom: 4px;
          transition: border-color 0.2s, color 0.2s, padding-left 0.2s;
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .view-profile-btn span {
          transition: transform 0.2s;
        }

        .view-profile-btn:hover {
          color: #d4af37;
          border-color: #d4af37;
        }

        .view-profile-btn:hover span {
          transform: translateX(4px);
        }

        /* Loading state */
        .loading-state {
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          gap: 20px;
          min-height: 40vh;
          color: hsl(var(--text-muted));
        }

        .spinner {
          width: 50px;
          height: 50px;
          border: 3px solid rgba(124, 58, 237, 0.1);
          border-top-color: #7c3aed;
          border-radius: 50%;
          animation: spin 1s infinite linear;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        @keyframes spin-clockwise {
          to { transform: rotate(360deg); }
        }

        .animate-fade-in {
          animation: fadeIn 0.8s cubic-bezier(0.16, 1, 0.3, 1) both;
        }

        .animate-slide-up {
          animation: slideUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) both;
        }

        :global(.team-card-delay-0) { animation-delay: 0s; }
        :global(.team-card-delay-1) { animation-delay: 0.1s; }
        :global(.team-card-delay-2) { animation-delay: 0.2s; }
        :global(.team-card-delay-3) { animation-delay: 0.3s; }
        :global(.team-card-delay-4) { animation-delay: 0.4s; }
        :global(.team-card-delay-5) { animation-delay: 0.5s; }
        :global(.team-card-delay-6) { animation-delay: 0.6s; }
        :global(.team-card-delay-7) { animation-delay: 0.7s; }
        :global(.team-card-delay-8) { animation-delay: 0.8s; }
        :global(.team-card-delay-9) { animation-delay: 0.9s; }
        :global(.team-card-delay-10) { animation-delay: 1s; }
        :global(.team-card-delay-11) { animation-delay: 1.1s; }

        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        @keyframes slideUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }

        @media (max-width: 640px) {
          .team-title {
            font-size: 2.2rem;
          }
          .team-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
}
