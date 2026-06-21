"use client";

import React, { useState, useEffect, useRef } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

interface ChakraSection {
  id: string;
  name: string;
  sanskrit: string;
  color: string;
  frequency: string;
  location: string;
  description: string;
}

const CHAKRAS: ChakraSection[] = [
  {
    id: "root",
    name: "Root Chakra",
    sanskrit: "Muladhara",
    color: "#f87171", // Soft Red
    frequency: "396 Hz",
    location: "Base of Spine",
    description: "Governs survival, security, and stability. When balanced, you feel grounded, safe, and resilient. A blockage can manifest as chronic fear, anxiety, or financial insecurity.",
  },
  {
    id: "sacral",
    name: "Sacral Chakra",
    sanskrit: "Svadhisthana",
    color: "#fb923c", // Soft Orange
    frequency: "417 Hz",
    location: "Lower Abdomen",
    description: "Governs creativity, sensuality, and emotional flow. When open, you experience passion, healthy boundaries, and adaptability. A blockage can manifest as creative blocks or emotional numbness.",
  },
  {
    id: "solar",
    name: "Solar Plexus Chakra",
    sanskrit: "Manipura",
    color: "#facc15", // Soft Yellow
    frequency: "528 Hz",
    location: "Upper Abdomen / Stomach",
    description: "Governs personal power, self-esteem, and willpower. When balanced, you feel confident, decisive, and highly motivated. A blockage can manifest as low self-worth or control issues.",
  },
  {
    id: "heart",
    name: "Heart Chakra",
    sanskrit: "Anahata",
    color: "#4ade80", // Soft Green
    frequency: "639 Hz",
    location: "Center of Chest",
    description: "Governs love, compassion, and emotional integration. When open, you give and receive love freely, practicing empathy and forgiveness. A blockage can manifest as isolation or defensiveness.",
  },
  {
    id: "throat",
    name: "Throat Chakra",
    sanskrit: "Vishuddha",
    color: "#22d3ee", // Soft Cyan
    frequency: "741 Hz",
    location: "Throat",
    description: "Governs communication, self-expression, and truth. When balanced, you speak your truth clearly and listen deeply to others. A blockage can manifest as social anxiety or speaking dishonesty.",
  },
  {
    id: "thirdeye",
    name: "Third Eye Chakra",
    sanskrit: "Ajna",
    color: "#818cf8", // Soft Indigo
    frequency: "852 Hz",
    location: "Forehead / Between Brows",
    description: "Governs intuition, imagination, and inner wisdom. When balanced, you trust your gut feelings and see the bigger picture clearly. A blockage can manifest as mental fog or rigid thinking.",
  },
  {
    id: "crown",
    name: "Crown Chakra",
    sanskrit: "Sahasrara",
    color: "#c084fc", // Soft Purple
    frequency: "963 Hz",
    location: "Top of Head",
    description: "Governs spiritual connection, enlightenment, and universal consciousness. When balanced, you feel connected to all things and experience deep inner peace. A blockage can manifest as skepticism or spiritual crisis.",
  },
];

export default function PillarPage() {
  const [activeSectionId, setActiveSectionId] = useState("intro");
  const observerRef = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    // Setup observer to track scroll and update progress sidebar
    const observerOptions = {
      root: null,
      rootMargin: "-20% 0px -60% 0px", // triggers when section is in middle of viewport
      threshold: 0,
    };

    observerRef.current = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          setActiveSectionId(entry.target.id);
        }
      });
    }, observerOptions);

    // Observe intro and all chakras
    const elementsToObserve = [
      document.getElementById("intro"),
      ...CHAKRAS.map((c) => document.getElementById(c.id)),
    ].filter(Boolean);

    elementsToObserve.forEach((el) => observerRef.current?.observe(el!));

    return () => {
      observerRef.current?.disconnect();
    };
  }, []);

  const handleScrollTo = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  };

  return (
    <div className="pillar-page">
      <div className="pillar-grid">
        
        {/* Left: Sticky progress tracker */}
        <aside className="progress-tracker-col">
          <div className="sticky-tracker">
            <h4 className="tracker-title">Guide Chapters</h4>
            
            <div className="timeline-wrapper">
              <div className="timeline-line"></div>
              
              <div className="timeline-steps">
                <button
                  className={`step-dot-container ${activeSectionId === "intro" ? "active" : ""}`}
                  onClick={() => handleScrollTo("intro")}
                >
                  <span className="step-dot"></span>
                  <span className="step-label">Introduction</span>
                </button>

                {CHAKRAS.map((c) => (
                  <button
                    key={c.id}
                    className={`step-dot-container ${activeSectionId === c.id ? "active" : ""}`}
                    onClick={() => handleScrollTo(c.id)}
                  >
                    <span className="step-dot" style={{ backgroundColor: activeSectionId === c.id ? c.color : undefined }}></span>
                    <span className="step-label">{c.name}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </aside>

        {/* Right: Long-form content guide */}
        <div className="content-col">
          {/* INTRO */}
          <section id="intro" className="content-section intro-section">
            <h1 className="intro-title">Guide to the 7 Chakras</h1>
            <p className="intro-meta">Complete Spiritual Alignment Manual • 12 Min Read</p>
            
            <Card variant="glass" className="intro-card">
              <p>
                The human body is more than just a biological shell. Surrounding and permeating your physical structure is a detailed energetic system directed by seven primary centers known as <strong>Chakras</strong> (Sanskrit for "spinning wheels").
              </p>
              <p>
                When life force (prana) flows smoothly through these nodes, you experience physical health, mental clarity, and emotional stability. However, somatic stress and trauma can constrict these nodes. This guide outlines each chakra, its locations, emotional impacts, and specific frequencies you can use to restore balance.
              </p>
            </Card>
          </section>

          {/* CHAKRA SECTIONS */}
          {CHAKRAS.map((c) => (
            <section key={c.id} id={c.id} className="content-section chakra-section">
              <Card
                variant="glass"
                className="chakra-card"
                style={{
                  borderLeft: `5px solid ${c.color}`,
                  boxShadow: activeSectionId === c.id ? `0 8px 30px rgba(0, 0, 0, 0.02), 0 0 20px ${c.color}15` : undefined
                }}
              >
                <div className="chakra-header-row">
                  <div className="chakra-title-group">
                    <span className="chakra-sanskrit" style={{ color: c.color }}>{c.sanskrit}</span>
                    <h2 className="chakra-title-name">{c.name}</h2>
                  </div>
                  <div className="chakra-frequency-badge" style={{ backgroundColor: `${c.color}15`, border: `1px solid ${c.color}40`, color: c.color }}>
                    {c.frequency}
                  </div>
                </div>

                <div className="chakra-details">
                  <div className="chakra-detail-item">
                    <span className="detail-label">Physical Location</span>
                    <span className="detail-value">{c.location}</span>
                  </div>
                </div>

                <p className="chakra-desc-text">{c.description}</p>

                <div className="chakra-action-footer">
                  <Button
                    variant="gold-outline"
                    size="sm"
                    onClick={() => alert(`Playing healing sound frequencies for ${c.name} at ${c.frequency}...`)}
                  >
                    🔊 Listen to {c.frequency} Wave
                  </Button>
                </div>
              </Card>
            </section>
          ))}
        </div>

      </div>

      <style jsx>{`
        .pillar-page {
          width: 100%;
        }
        .pillar-grid {
          display: grid;
          grid-template-columns: 240px 1fr;
          gap: 40px;
          align-items: flex-start;
        }
        .progress-tracker-col {
          position: sticky;
          top: 94px;
        }
        .sticky-tracker {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        .tracker-title {
          font-size: 1.25rem;
          color: #4c1d95;
          margin-bottom: 4px;
        }
        .timeline-wrapper {
          position: relative;
          padding-left: 10px;
        }
        .timeline-line {
          position: absolute;
          left: 14px;
          top: 8px;
          bottom: 8px;
          width: 2px;
          background: rgba(0, 0, 0, 0.05);
          z-index: 1;
        }
        .timeline-steps {
          display: flex;
          flex-direction: column;
          gap: 14px;
          position: relative;
          z-index: 2;
        }
        .step-dot-container {
          display: flex;
          align-items: center;
          gap: 14px;
          background: transparent;
          border: none;
          cursor: pointer;
          text-align: left;
          padding: 4px 0;
        }
        .step-dot {
          width: 10px;
          height: 10px;
          border-radius: 50%;
          background: #d1d5db;
          transition: var(--transition-fast);
          border: 2px solid #ffffff;
          box-shadow: 0 0 0 1.5px #d1d5db;
        }
        .step-dot-container.active .step-dot {
          transform: scale(1.3);
          box-shadow: 0 0 8px currentColor;
        }
        .step-label {
          font-size: 0.88rem;
          font-weight: 500;
          color: hsl(var(--text-muted));
          transition: var(--transition-fast);
        }
        .step-dot-container:hover .step-label {
          color: #7c3aed;
        }
        .step-dot-container.active .step-label {
          color: #4c1d95;
          font-weight: 700;
        }
        .content-col {
          display: flex;
          flex-direction: column;
          gap: 40px;
        }
        .content-section {
          scroll-margin-top: 100px;
        }
        .intro-section {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .intro-title {
          font-size: 2.8rem;
          color: #4c1d95;
        }
        .intro-meta {
          font-size: 0.82rem;
          font-weight: 700;
          color: #0d9488;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }
        .intro-card {
          padding: 28px !important;
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        .intro-card p {
          font-size: 1.05rem;
          line-height: 1.7;
          color: hsl(var(--text-cream));
        }
        .chakra-card {
          padding: 30px !important;
          border-radius: 20px;
          transition: var(--transition-smooth);
        }
        .chakra-header-row {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 16px;
        }
        .chakra-title-group {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }
        .chakra-sanskrit {
          font-size: 0.85rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.08em;
        }
        .chakra-title-name {
          font-size: 1.8rem;
          color: #4c1d95;
          margin: 0;
        }
        .chakra-frequency-badge {
          font-size: 0.78rem;
          font-weight: 700;
          padding: 6px 12px;
          border-radius: 8px;
          letter-spacing: 0.04em;
        }
        .chakra-details {
          display: flex;
          gap: 24px;
          margin-bottom: 20px;
          border-bottom: 1px solid rgba(0, 0, 0, 0.03);
          padding-bottom: 14px;
        }
        .chakra-detail-item {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        .detail-label {
          font-size: 0.7rem;
          font-weight: 600;
          color: hsl(var(--text-muted));
          text-transform: uppercase;
          letter-spacing: 0.04em;
        }
        .detail-value {
          font-size: 0.95rem;
          color: hsl(var(--text-cream));
          font-weight: 500;
        }
        .chakra-desc-text {
          font-size: 1.05rem;
          line-height: 1.7;
          color: hsl(var(--text-cream));
          margin-bottom: 24px;
        }
        .chakra-action-footer {
          display: flex;
        }

        @media (max-width: 860px) {
          .pillar-grid {
            grid-template-columns: 1fr;
          }
          .progress-tracker-col {
            display: none; /* Hide timeline tracker on mobile, let them scroll naturally */
          }
        }
      `}</style>
    </div>
  );
}
