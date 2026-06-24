"use client";

import React, { useState } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

interface FAQItem {
  id: string;
  category: string;
  question: string;
  answer: string;
  verified: boolean;
}

const FAQ_DATA: FAQItem[] = [
  {
    id: "faq-1",
    category: "Aura Scanning",
    question: "What is an Aura Scanning session?",
    answer: "An Aura Scanning session is a non-invasive diagnostic practice where our practitioners use bio-energy sensing and visual mapping to detect energy blocks, color densities, and leaks in your personal electromagnetic field.",
    verified: true,
  },
  {
    id: "faq-2",
    category: "Aura Scanning",
    question: "How long does a session take, and what should I expect?",
    answer: "A standard session takes 45 to 60 minutes. You will sit comfortably while our practitioner scans your field. You will receive a detailed visual and written report outlining your aura's primary color frequencies and node balances.",
    verified: true,
  },
  {
    id: "faq-3",
    category: "Chakra Healing",
    question: "How do I know if my chakras are blocked?",
    answer: "Common signs of chakra blockages include chronic physical fatigue, emotional volatility, mental fog, or feeling stuck in life. Each chakra corresponds to different bodily zones and emotional states; a block in the Root Chakra, for instance, often manifests as anxiety about security.",
    verified: true,
  },
  {
    id: "faq-4",
    category: "Chakra Healing",
    question: "Can chakra healing help with chronic physical tension?",
    answer: "Yes. Somatic therapies and chakra alignment stabilize your nervous pathway responses, which helps reduce physical tension, lower cortisol levels, and release trapped emotional trauma from the muscles.",
    verified: false,
  },
  {
    id: "faq-5",
    category: "Aura Gems",
    question: "How do I select the right crystal for my energy field?",
    answer: "Crystals are selected based on their specific mineral vibration frequencies. For example, Amethyst aligns with the Crown Chakra for peace, while Tiger's Eye aligns with the Solar Plexus for courage. During our sessions, we scan your frequencies to match crystals that balance your current deficiencies.",
    verified: true,
  },
  {
    id: "faq-6",
    category: "Aura Gems",
    question: "Do crystals need to be cleansed or charged?",
    answer: "Absolutely. Crystals absorb ambient vibrations from their environment. We recommend cleansing them under running water, sound vibrations (like a singing bowl), or moonlight, and charging them with positive, focused intentions.",
    verified: true,
  },
];

export default function FAQPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [openAccordions, setOpenAccordions] = useState<Record<string, boolean>>({
    "faq-1": true, // open first by default
  });

  const categories = ["all", "Aura Scanning", "Chakra Healing", "Aura Gems"];

  const toggleAccordion = (id: string) => {
    setOpenAccordions((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const filteredFAQs = FAQ_DATA.filter((faq) => {
    const matchesCategory = selectedCategory === "all" || faq.category === selectedCategory;
    const matchesSearch =
      faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="faq-page-container">
      {/* Header */}
      <div className="faq-header">
        <h1 className="faq-page-title">Frequently Asked Questions</h1>
      </div>

      {/* Control panel (Tabs & Search combined) */}
      <section className="faq-controls-section glass-panel">
        <div className="faq-tabs">
          {categories.map((cat) => (
            <button
              key={cat}
              className={`faq-tab-btn ${selectedCategory === cat ? "active" : ""}`}
              onClick={() => setSelectedCategory(cat)}
            >
              {cat === "all" ? "All Questions" : cat}
            </button>
          ))}
        </div>

        <div className="faq-search-wrapper">
          <svg className="search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8"></circle>
            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
          </svg>
          <input
            type="text"
            placeholder="Type your question..."
            className="search-input"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </section>

      {/* Accordions List */}
      <div className="faq-accordions-list">
        {filteredFAQs.length === 0 ? (
          <div className="faq-empty glass-card">
            <p>No questions found matching your criteria. Try refining your search query.</p>
          </div>
        ) : (
          filteredFAQs.map((faq) => {
            const isOpen = !!openAccordions[faq.id];
            return (
              <Card
                key={faq.id}
                variant="glass"
                className={`faq-accordion-card ${isOpen ? "accordion-open" : ""}`}
              >
                <button
                  className="faq-trigger"
                  onClick={() => toggleAccordion(faq.id)}
                  aria-expanded={isOpen}
                >
                  <div className="faq-trigger-left">
                    <span className="faq-category-badge">{faq.category}</span>
                    <span className="faq-question-text">{faq.question}</span>
                  </div>
                  <span className={`faq-arrow-icon ${isOpen ? "rotate" : ""}`}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="6 9 12 15 18 9" />
                    </svg>
                  </span>
                </button>

                <div className={`faq-content-wrapper ${isOpen ? "expanded" : "collapsed"}`}>
                  <div className="faq-content-inner">
                    <p className="faq-answer-text">{faq.answer}</p>

                    <div className="faq-item-meta">
                      {faq.verified && (
                        <div className="verified-badge">
                          <span className="check-icon">✓</span>
                          <span>Expert Verified Answer</span>
                        </div>
                      )}
                      <Button variant="gold-outline" size="sm" onClick={() => alert("Helpful count updated!")}>
                        Helpful (0)
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            );
          })
        )}
      </div>

      <style jsx>{`
        .faq-page-container {
          display: flex;
          flex-direction: column;
          gap: 36px;
          width: 100%;
        }
        .faq-header {
          text-align: center;
          padding: 8px 0 0;
        }
        .faq-page-title {
          font-size: 2.4rem;
          color: #4c1d95;
          margin-bottom: 8px;
          font-weight: 700;
          letter-spacing: -0.01em;
        }
        .faq-page-subtitle {
          font-size: 1rem;
          color: hsl(var(--text-muted));
          max-width: 650px;
          margin: 0 auto;
        }
        .faq-controls-section {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 24px;
          padding: 12px 24px;
          border-radius: 20px;
          width: 100%;
        }
        .faq-tabs {
          display: flex;
          gap: 8px;
          align-items: center;
        }
        .faq-tab-btn {
          background: transparent;
          border: 1px solid transparent;
          color: hsl(var(--text-muted));
          font-family: var(--font-serif);
          font-size: 0.85rem;
          font-weight: 600;
          padding: 6px 14px;
          border-radius: 30px;
          cursor: pointer;
          letter-spacing: 0.03em;
          text-transform: uppercase;
          transition: var(--transition-fast);
        }
        .faq-tab-btn:hover {
          color: #7c3aed;
          background: rgba(168, 85, 247, 0.04);
        }
        .faq-tab-btn.active {
          color: #7c3aed;
          background: linear-gradient(135deg, rgba(251, 207, 232, 0.25) 0%, rgba(233, 213, 255, 0.25) 100%);
          border-color: rgba(168, 85, 247, 0.2);
          box-shadow: 0 4px 10px rgba(168, 85, 247, 0.05);
        }
        .faq-search-wrapper {
          display: flex;
          align-items: center;
          position: relative;
          width: 260px;
        }
        .search-icon {
          position: absolute;
          left: 12px;
          color: hsl(var(--text-muted));
          pointer-events: none;
        }
        .faq-search-wrapper :global(.search-input) {
          width: 100%;
          padding: 8px 12px 8px 36px;
          border-radius: 30px;
          background: rgba(255, 255, 255, 0.6);
          border: 1px solid var(--border-glass);
          color: hsl(var(--text-cream));
          font-family: var(--font-sans);
          font-size: 0.85rem;
          outline: none;
          transition: var(--transition-smooth);
        }
        .faq-search-wrapper :global(.search-input):focus {
          background: rgba(255, 255, 255, 0.95);
          border-color: #7c3aed;
          box-shadow: 0 0 10px rgba(124, 58, 237, 0.15);
        }
        .faq-accordions-list {
          display: flex;
          flex-direction: column;
          gap: 18px;
        }
        .faq-accordion-card {
          padding: 0 !important;
          border-radius: 16px;
          overflow: hidden;
          transition: var(--transition-smooth);
        }
        .faq-accordion-card.accordion-open {
          border-color: var(--gold-border);
          box-shadow: 0 10px 25px rgba(168, 85, 247, 0.04);
        }
        .faq-trigger {
          display: flex;
          width: 100%;
          justify-content: space-between;
          align-items: center;
          padding: 20px 24px;
          background: transparent;
          border: none;
          text-align: left;
          cursor: pointer;
          font-family: inherit;
        }
        .faq-trigger-left {
          display: flex;
          flex-direction: column;
          gap: 8px;
          padding-right: 16px;
        }
        .faq-category-badge {
          align-self: flex-start;
          font-size: 0.72rem;
          font-weight: 700;
          color: #0d9488;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }
        .faq-question-text {
          font-size: 1.15rem;
          color: #4c1d95;
          font-weight: 600;
          font-family: var(--font-serif);
        }
        .faq-arrow-icon {
          color: hsl(var(--text-muted));
          transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1);
          flex-shrink: 0;
        }
        .faq-arrow-icon.rotate {
          transform: rotate(180deg);
          color: #7c3aed;
        }
        .faq-content-wrapper {
          overflow: hidden;
          transition: max-height 0.4s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.4s ease;
        }
        .faq-content-wrapper.collapsed {
          max-height: 0;
          opacity: 0;
          pointer-events: none;
        }
        .faq-content-wrapper.expanded {
          max-height: 500px;
          opacity: 1;
        }
        .faq-content-inner {
          padding: 0 24px 24px;
          border-top: 1px solid rgba(0, 0, 0, 0.03);
          margin-top: -4px;
        }
        .faq-answer-text {
          font-size: 0.98rem;
          line-height: 1.7;
          color: hsl(var(--text-cream));
          margin-bottom: 20px;
          padding-top: 16px;
        }
        .faq-item-meta {
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-top: 1px solid rgba(0, 0, 0, 0.05);
          padding-top: 16px;
        }
        .verified-badge {
          display: flex;
          align-items: center;
          gap: 6px;
          background: rgba(16, 185, 129, 0.06);
          border: 1px solid rgba(16, 185, 129, 0.2);
          color: #065f46;
          font-size: 0.78rem;
          font-weight: 600;
          padding: 4px 10px;
          border-radius: 6px;
        }
        .check-icon {
          font-weight: bold;
        }
        .faq-empty {
          text-align: center;
          padding: 40px !important;
          color: hsl(var(--text-muted));
        }
        @media (max-width: 968px) {
          .faq-controls-section {
            flex-direction: column;
            gap: 16px;
            align-items: stretch;
            padding: 16px;
          }
          .faq-tabs {
            justify-content: center;
            flex-wrap: wrap;
          }
          .faq-search-wrapper {
            width: 100%;
          }
        }
        @media (max-width: 640px) {
          .faq-tab-btn {
            font-size: 0.78rem;
            padding: 5px 10px;
          }
        }
      `}</style>
    </div>
  );
}
