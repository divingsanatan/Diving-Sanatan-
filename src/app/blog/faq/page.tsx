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
      <div className="faq-header">
        <h1 className="faq-page-title">Frequently Asked Questions</h1>
        <p className="faq-page-subtitle">
          Find instant answers to common questions about aura scanning, chakra balancing, and crystal gems.
        </p>

        {/* Search */}
        <div className="faq-search-wrapper">
          <input
            type="text"
            placeholder="Type your question..."
            className="glass-input faq-search-input"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <div className="faq-content-grid">
        {/* Left: Category Navigation */}
        <div className="faq-categories-card glass-panel">
          <h3 className="categories-card-title">Categories</h3>
          <div className="categories-list">
            {categories.map((cat) => (
              <button
                key={cat}
                className={`category-btn ${selectedCategory === cat ? "active" : ""}`}
                onClick={() => setSelectedCategory(cat)}
              >
                <span className="bullet">✦</span>
                <span className="cat-name">{cat === "all" ? "All Questions" : cat}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Right: Accordions List */}
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
      </div>

      <style jsx>{`
        .faq-page-container {
          display: flex;
          flex-direction: column;
          gap: 40px;
          width: 100%;
        }
        .faq-header {
          text-align: center;
        }
        .faq-page-title {
          font-size: 2.8rem;
          color: #4c1d95;
          margin-bottom: 12px;
        }
        .faq-page-subtitle {
          font-size: 1.05rem;
          color: hsl(var(--text-muted));
          max-width: 650px;
          margin: 0 auto 32px;
        }
        .faq-search-wrapper {
          display: flex;
          justify-content: center;
        }
        .faq-search-input {
          max-width: 480px;
          border-radius: 99px;
          text-align: center;
          border: 1px solid var(--gold-border);
        }
        .faq-content-grid {
          display: grid;
          grid-template-columns: 280px 1fr;
          gap: 32px;
          align-items: flex-start;
        }
        .faq-categories-card {
          padding: 24px;
          border-radius: 20px;
        }
        .categories-card-title {
          font-size: 1.25rem;
          color: #4c1d95;
          margin-bottom: 18px;
          border-bottom: 1px solid rgba(0, 0, 0, 0.05);
          padding-bottom: 8px;
        }
        .categories-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .category-btn {
          display: flex;
          align-items: center;
          gap: 10px;
          background: transparent;
          border: none;
          text-align: left;
          color: hsl(var(--text-muted));
          font-size: 0.95rem;
          cursor: pointer;
          transition: var(--transition-fast);
          padding: 6px 4px;
          border-radius: 6px;
        }
        .category-btn:hover {
          color: #7c3aed;
          padding-left: 8px;
        }
        .category-btn.active {
          color: #7c3aed;
          font-weight: 600;
          padding-left: 8px;
        }
        .bullet {
          color: rgba(168, 85, 247, 0.4);
          font-size: 0.8rem;
        }
        .category-btn.active .bullet {
          color: #7c3aed;
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
        @media (max-width: 860px) {
          .faq-content-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
}
