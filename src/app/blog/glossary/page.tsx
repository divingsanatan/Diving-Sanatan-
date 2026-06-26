"use client";

import React, { useState, useEffect } from "react";
import { Card } from "@/components/ui/Card";
import { useBlog } from "../BlogContext";
import { GlossaryTerm } from "@/types/database";
import { GlossaryTermIllustration } from "@/components/blog/GlossaryTermIllustration";

const PUBLIC_PAGE_SIZE = 5; // Display 5 cards per page on the public page for clean spacing

export default function GlossaryPage() {
  const { searchQuery } = useBlog();
  const [activeLetter, setActiveLetter] = useState("all");
  const [terms, setTerms] = useState<GlossaryTerm[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);

  const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

  useEffect(() => {
    async function loadTerms() {
      try {
        const res = await fetch("/api/glossary");
        const json = await res.json();
        if (json.success) setTerms(json.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadTerms();
  }, []);

  const speakTerm = (term: GlossaryTerm) => {
    if (typeof window !== "undefined" && window.speechSynthesis) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(`${term.word}. ${term.definition}`);
      utterance.rate = 0.95;
      utterance.pitch = 1.0;
      window.speechSynthesis.speak(utterance);
    } else {
      alert("Text-to-speech is not supported in this browser.");
    }
  };

  const filteredTerms = terms.filter((t) => {
    const matchesLetter =
      activeLetter === "all" || t.word.toLowerCase().startsWith(activeLetter.toLowerCase());
    const matchesSearch =
      t.word.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.definition.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (t.category && t.category.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesLetter && matchesSearch;
  });

  // Whenever filters change, go back to page 1
  useEffect(() => {
    setCurrentPage(1);
  }, [activeLetter, searchQuery]);

  // Pagination bounds
  const totalPages = Math.ceil(filteredTerms.length / PUBLIC_PAGE_SIZE) || 1;
  const safePage = Math.min(currentPage, totalPages);
  const paginatedTerms = filteredTerms.slice((safePage - 1) * PUBLIC_PAGE_SIZE, safePage * PUBLIC_PAGE_SIZE);

  return (
    <div className="glossary-page">
      <div className="glossary-header">
        <h1 className="glossary-title">Metaphysical Glossary</h1>
        <p className="glossary-subtitle">
          An A-Z dictionary index of spiritual terms, alignments, and vibrational practices.
        </p>
      </div>

      <section className="glossary-controls-section glass-panel">
        {searchQuery && (
          <div className="glossary-active-search-badge">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
            <span>&ldquo;{searchQuery}&rdquo;</span>
          </div>
        )}

        <div className="alphabet-bar">
          <button
            type="button"
            className={`letter-btn ${activeLetter === "all" ? "active" : ""}`}
            onClick={() => setActiveLetter("all")}
          >
            All
          </button>
          {letters.map((letter) => {
            const hasTerms = terms.some((t) => t.word.toUpperCase().startsWith(letter));
            return (
              <button
                key={letter}
                type="button"
                className={`letter-btn ${activeLetter === letter ? "active" : ""} ${!hasTerms ? "disabled" : ""}`}
                onClick={() => hasTerms && setActiveLetter(letter)}
                disabled={!hasTerms && activeLetter !== letter}
              >
                {letter}
              </button>
            );
          })}
        </div>
      </section>

      <div className="terms-container">
        {loading ? (
          <div className="terms-empty glass-card">
            <p>Loading glossary terms...</p>
          </div>
        ) : filteredTerms.length === 0 ? (
          <div className="terms-empty glass-card">
            <p>No glossary definitions match your search terms.</p>
          </div>
        ) : (
          <>
            {paginatedTerms.map((term) => (
              <Card key={term.id} variant="glass" className="term-card">
                <div className="term-card-content">
                  <div className="term-main-info">
                    <div className="term-title-row">
                      <div className="title-left">
                        <h3 className="term-word">{term.word}</h3>
                        {term.phonetic && <span className="term-phonetic">{term.phonetic}</span>}
                      </div>

                      <button
                        type="button"
                        className="speak-btn"
                        onClick={() => speakTerm(term)}
                        title="Listen to pronunciation"
                      >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                          <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07" />
                        </svg>
                      </button>
                    </div>

                    {term.category && <span className="term-category-badge">{term.category}</span>}
                    <p className="term-definition-text">{term.definition}</p>
                  </div>

                  <GlossaryTermIllustration illustration={term.illustration} />
                </div>
              </Card>
            ))}

            {filteredTerms.length > PUBLIC_PAGE_SIZE && (
              <div className="public-pagination-bar">
                <span className="pagination-info">
                  Showing {(safePage - 1) * PUBLIC_PAGE_SIZE + 1}–{Math.min(safePage * PUBLIC_PAGE_SIZE, filteredTerms.length)} of {filteredTerms.length}
                </span>
                <div className="pagination-controls">
                  <button
                    type="button"
                    className="page-btn"
                    disabled={safePage <= 1}
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  >
                    ← Prev
                  </button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                    <button
                      key={page}
                      type="button"
                      className={`page-btn ${page === safePage ? "active" : ""}`}
                      onClick={() => setCurrentPage(page)}
                    >
                      {page}
                    </button>
                  ))}
                  <button
                    type="button"
                    className="page-btn"
                    disabled={safePage >= totalPages}
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  >
                    Next →
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      <style jsx>{`
        .glossary-page {
          display: flex;
          flex-direction: column;
          gap: 36px;
          width: 100%;
        }
        .glossary-header {
          text-align: center;
          padding: 8px 0 0;
        }
        .glossary-title {
          font-size: 2.4rem;
          color: #4c1d95;
          margin-bottom: 8px;
          font-weight: 700;
          letter-spacing: -0.01em;
        }
        .glossary-subtitle {
          font-size: 1rem;
          color: hsl(var(--text-muted));
          max-width: 650px;
          margin: 0 auto;
        }
        .glossary-controls-section {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 16px;
          padding: 16px 24px;
          border-radius: 20px;
          width: 100%;
        }
        .glossary-active-search-badge {
          display: flex;
          align-items: center;
          gap: 6px;
          background: rgba(124, 58, 237, 0.07);
          border: 1px solid rgba(124, 58, 237, 0.2);
          color: #7c3aed;
          font-size: 0.8rem;
          font-weight: 600;
          padding: 5px 12px;
          border-radius: 20px;
          white-space: nowrap;
        }
        .alphabet-bar {
          display: flex;
          flex-wrap: wrap;
          justify-content: center;
          gap: 6px;
          width: 100%;
          max-width: 720px;
        }
        .letter-btn {
          width: 32px;
          height: 32px;
          border-radius: 8px;
          border: 1px solid rgba(0, 0, 0, 0.04);
          background: rgba(255, 255, 255, 0.6);
          color: hsl(var(--text-cream));
          font-weight: 600;
          font-size: 0.85rem;
          cursor: pointer;
          transition: var(--transition-fast);
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .letter-btn:hover:not(.disabled) {
          border-color: #7c3aed;
          color: #7c3aed;
          background: rgba(168, 85, 247, 0.04);
          transform: translateY(-1px);
        }
        .letter-btn.active {
          background: #7c3aed;
          color: #ffffff;
          border-color: #7c3aed;
          box-shadow: 0 4px 10px rgba(124, 58, 237, 0.2);
        }
        .letter-btn.disabled {
          opacity: 0.3;
          cursor: not-allowed;
          background: transparent;
        }
        .terms-container {
          display: flex;
          flex-direction: column;
          gap: 24px;
        }
        .term-card {
          padding: 24px !important;
          border-radius: 20px;
        }
        .term-card-content {
          display: flex;
          gap: 32px;
          align-items: center;
        }
        .term-main-info {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .term-title-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .title-left {
          display: flex;
          align-items: baseline;
          gap: 12px;
          flex-wrap: wrap;
        }
        .term-word {
          font-size: 1.8rem;
          color: #4c1d95;
          margin: 0;
        }
        .term-phonetic {
          font-size: 0.9rem;
          color: hsl(var(--text-muted));
          font-family: var(--font-sans);
          font-style: italic;
        }
        .speak-btn {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          border: 1px solid rgba(168, 85, 247, 0.15);
          background: rgba(168, 85, 247, 0.03);
          color: #7c3aed;
          cursor: pointer;
          transition: var(--transition-fast);
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        .speak-btn:hover {
          background: #7c3aed;
          color: #ffffff;
          box-shadow: 0 4px 10px rgba(124, 58, 237, 0.25);
          transform: scale(1.05);
        }
        .term-category-badge {
          align-self: flex-start;
          font-size: 0.72rem;
          font-weight: 700;
          color: #0d9488;
          background: rgba(13, 148, 136, 0.06);
          border: 1px solid rgba(13, 148, 136, 0.2);
          padding: 4px 10px;
          border-radius: 6px;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }
        .term-definition-text {
          font-size: 1.05rem;
          line-height: 1.7;
          color: hsl(var(--text-cream));
        }
        .terms-empty {
          text-align: center;
          padding: 40px !important;
          color: hsl(var(--text-muted));
        }
        .public-pagination-bar {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 20px 24px;
          border-top: 1px solid rgba(168, 85, 247, 0.08);
          background: rgba(255, 255, 255, 0.15);
          border-radius: 12px;
          flex-wrap: wrap;
          gap: 12px;
          margin-top: 12px;
        }
        .pagination-info {
          font-size: 0.85rem;
          color: hsl(var(--text-muted));
        }
        .pagination-controls {
          display: flex;
          gap: 4px;
          flex-wrap: wrap;
        }
        .page-btn {
          background: transparent;
          border: 1px solid rgba(0, 0, 0, 0.08);
          padding: 6px 12px;
          border-radius: 6px;
          font-size: 0.8rem;
          font-weight: 600;
          color: hsl(var(--text-muted));
          cursor: pointer;
          transition: var(--transition-fast);
          min-width: 32px;
        }
        .page-btn:hover:not(:disabled) {
          border-color: #7c3aed;
          color: #7c3aed;
        }
        .page-btn.active {
          background: #7c3aed;
          color: #fff;
          border-color: #7c3aed;
        }
        .page-btn:disabled {
          opacity: 0.4;
          cursor: not-allowed;
        }
        @media (max-width: 680px) {
          .term-card-content {
            flex-direction: column;
            align-items: stretch;
            gap: 20px;
          }
        }
      `}</style>
    </div>
  );
}
