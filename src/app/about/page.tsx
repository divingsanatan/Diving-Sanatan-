"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Card } from "@/components/ui/Card";

interface Practitioner {
  id: string;
  name: string;
  specialty: string;
  bio: string;
  rating: number;
  reviewsCount: number;
  image: string;
}

export default function AboutPage() {
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

  const values = [
    {
      title: "Resonance Alignment",
      desc: "We focus on realigning biological vibration with cognitive focus, correcting blockages at the energetic source.",
      symbol: "⚡"
    },
    {
      title: "Holistic Purification",
      desc: "Every layout uses natural minerals, tuning acoustics, and thermal layouts configured to your local environmental conditions.",
      symbol: "💎"
    },
    {
      title: "Spiritual Autonomy",
      desc: "Our healers act as counselors and guides, equipping you with somatic breath exercises to continue self-purification.",
      symbol: "🧘"
    }
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>
      <Header />

      <main className="about-container">
        
        {/* Header */}
        <section className="about-header">
          <h1 className="about-title">Our Sanctuary</h1>
          <p className="about-subtitle">
            Diving Sanatan was established to bridge ancient energy medicine techniques with modern cognitive therapy standards.
          </p>
        </section>

        {/* Mission Statement */}
        <section className="mission-section glass-panel">
          <div className="mission-content">
            <h2 className="mission-heading">The Healing Manifesto</h2>
            <p className="mission-desc">
              We believe that fatigue, anxiety, and mental stress are rarely isolated occurrences. They are biological and auric signals indicating that our energetic nodes have become stagnant. By combining tactile reiki, natural mineral crystals, and sound bowls, we generate high-frequency currents that release tension, reset parasympathetic systems, and guide seekers back to cognitive stillness.
            </p>
          </div>
        </section>

        {/* Core Values */}
        <section className="values-section">
          <h2 className="section-title">Core Tenets</h2>
          <div className="values-grid">
            {values.map((v, i) => (
              <Card key={i} variant="glass" className="value-card">
                <span className="value-symbol">{v.symbol}</span>
                <h3 className="value-title">{v.title}</h3>
                <p className="value-desc">{v.desc}</p>
              </Card>
            ))}
          </div>
        </section>

        {/* Healers/Practitioners list */}
        <section className="practitioners-section">
          <h2 className="section-title">Certified Healers & Guides</h2>
          <p style={{ textAlign: "center", color: "hsl(var(--text-muted))", marginBottom: "40px", fontSize: "0.95rem" }}>
            Meet the team of master physicians committed to your cosmic balance.
          </p>

          {loading ? (
            <p style={{ textAlign: "center" }}>Aligning healing frequencies...</p>
          ) : (
            <div className="practitioners-grid">
              {practitioners.map(prac => (
                <Card key={prac.id} variant="glass" className="prac-card">
                  <div className="prac-avatar-container">
                    {/* Render actual uploaded photo if available, fallback to initials */}
                    {prac.image && prac.image.startsWith("/") ? (
                      <img src={prac.image} alt={prac.name} className="prac-img-avatar" />
                    ) : (
                      <div className="prac-placeholder-avatar">
                        {prac.name.split(" ").map(n => n[0]).join("")}
                      </div>
                    )}
                  </div>
                  
                  <div className="prac-card-info">
                    <h3 className="prac-name">{prac.name}</h3>
                    <span className="prac-spec">{prac.specialty}</span>
                    
                    <div className="prac-rating">
                      <span className="stars">★ ★ ★ ★ ★</span>
                      <span className="score">{prac.rating.toFixed(1)} ({prac.reviewsCount} Reviews)</span>
                    </div>

                    <p className="prac-bio">{prac.bio.length > 140 ? `${prac.bio.substring(0, 140)}...` : prac.bio}</p>
                    
                    <Link href={`/team/${prac.id}`} className="prac-view-profile-link">
                      View Full Profile →
                    </Link>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </section>

      </main>

      <Footer />

      <style jsx>{`
        .about-container {
          max-width: 1200px;
          margin: 0 auto;
          padding: 60px 24px 40px;
          display: flex;
          flex-direction: column;
          gap: 60px;
          width: 100%;
        }
        .about-title {
          font-size: 2.8rem;
          color: #4c1d95;
          margin-bottom: 12px;
          text-align: center;
        }
        .about-subtitle {
          font-size: 1.05rem;
          color: hsl(var(--text-muted));
          text-align: center;
          max-width: 700px;
          margin: 0 auto;
        }
        .mission-section {
          padding: 48px;
        }
        .mission-heading {
          font-family: var(--font-serif);
          font-size: 1.8rem;
          color: #4c1d95;
          margin-bottom: 16px;
          text-align: center;
        }
        .mission-desc {
          font-size: 1.05rem;
          line-height: 1.8;
          color: hsl(var(--text-cream));
          max-width: 900px;
          margin: 0 auto;
          text-align: center;
        }
        .section-title {
          font-family: var(--font-serif);
          font-size: 2rem;
          color: #4c1d95;
          text-align: center;
          margin-bottom: 40px;
        }
        .values-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 32px;
        }
        .value-card {
          padding: 32px;
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          gap: 16px;
        }
        .value-symbol {
          font-size: 2.5rem;
          margin-bottom: 8px;
        }
        .value-title {
          font-family: var(--font-serif);
          font-size: 1.25rem;
          color: #4c1d95;
        }
        .value-desc {
          font-size: 0.9rem;
          line-height: 1.6;
        }
        .practitioners-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(360px, 1fr));
          gap: 32px;
        }
        .prac-card {
          padding: 32px;
          display: flex;
          gap: 24px;
          align-items: flex-start;
        }
        .prac-avatar-container {
          flex-shrink: 0;
        }
        .prac-img-avatar {
          width: 80px;
          height: 80px;
          border-radius: 50%;
          object-fit: cover;
          border: 2px solid var(--gold-border);
          box-shadow: 0 4px 15px rgba(168,85,247,0.1);
        }
        .prac-placeholder-avatar {
          width: 80px;
          height: 80px;
          border-radius: 50%;
          background: var(--btn-gold-bg);
          border: 2px solid var(--gold-border);
          display: flex;
          align-items: center;
          justify-content: center;
          font-family: var(--font-serif);
          font-weight: 700;
          color: #4c1d95;
          font-size: 1.5rem;
          box-shadow: 0 4px 15px rgba(168,85,247,0.1);
        }
        .prac-view-profile-link {
          font-family: var(--font-serif);
          font-size: 0.8rem;
          color: #7c3aed;
          text-decoration: none;
          font-weight: 600;
          margin-top: 8px;
          display: inline-block;
          transition: color 0.2s;
        }
        .prac-view-profile-link:hover {
          color: #d4af37;
        }
        .prac-card-info {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .prac-name {
          font-family: var(--font-serif);
          font-size: 1.3rem;
          color: #4c1d95;
        }
        .prac-spec {
          font-size: 0.85rem;
          color: #0d9488;
          font-weight: 600;
          text-transform: uppercase;
        }
        .prac-rating {
          display: flex;
          gap: 8px;
          align-items: center;
          margin: 4px 0;
        }
        .stars {
          color: #d97706;
          font-size: 0.8rem;
        }
        .score {
          font-size: 0.75rem;
          color: hsl(var(--text-muted));
        }
        .prac-bio {
          font-size: 0.85rem;
          line-height: 1.6;
        }
        @media (max-width: 1024px) {
          .values-grid {
            grid-template-columns: 1fr;
          }
        }
        @media (max-width: 640px) {
          .prac-card {
            flex-direction: column;
            align-items: center;
            text-align: center;
          }
          .prac-rating {
            justify-content: center;
          }
        }
      `}</style>
    </div>
  );
}
