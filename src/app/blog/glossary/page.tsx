"use client";

import React, { useState, useEffect, useRef } from "react";
import { useBlog } from "../BlogContext";
import { GlossaryTerm } from "@/types/database";
import { GlossaryTermIllustration } from "@/components/blog/GlossaryTermIllustration";
import { Sparkles } from "lucide-react";

const PUBLIC_PAGE_SIZE = 5; // Display 5 terms per batch

export default function GlossaryPage() {
  const { searchQuery } = useBlog();
  const [activeLetter, setActiveLetter] = useState("all");
  const [activeScrollLetter, setActiveScrollLetter] = useState("all");
  const [terms, setTerms] = useState<GlossaryTerm[]>([]);
  const [loading, setLoading] = useState(true);

  // Infinite Scroll State
  const [visibleCount, setVisibleCount] = useState(PUBLIC_PAGE_SIZE);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const observerRef = useRef<HTMLDivElement | null>(null);
  const activeBtnRef = useRef<HTMLButtonElement | null>(null);

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

  const filteredTerms = terms.filter((t) => {
    const matchesLetter =
      activeLetter === "all" || t.word.toLowerCase().startsWith(activeLetter.toLowerCase());
    const matchesSearch =
      t.word.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.definition.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (t.category && t.category.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesLetter && matchesSearch;
  });

  // Whenever filters change, reset visible count and scroll letter
  useEffect(() => {
    setVisibleCount(PUBLIC_PAGE_SIZE);
    if (activeLetter !== "all") {
      setActiveScrollLetter(activeLetter);
    } else {
      setActiveScrollLetter("all");
    }
  }, [activeLetter, searchQuery]);

  const hasMoreItems = visibleCount < filteredTerms.length;

  // IntersectionObserver for Infinite Scrolling
  useEffect(() => {
    const node = observerRef.current;
    if (!node || !hasMoreItems) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !isLoadingMore) {
          setIsLoadingMore(true);
          setTimeout(() => {
            setVisibleCount((prev) => prev + PUBLIC_PAGE_SIZE);
            setIsLoadingMore(false);
          }, 300);
        }
      },
      { threshold: 0.1, rootMargin: "250px" }
    );

    observer.observe(node);
    return () => {
      observer.disconnect();
    };
  }, [hasMoreItems, isLoadingMore, filteredTerms.length]);

  const displayedTerms = filteredTerms.slice(0, visibleCount);

  // IntersectionObserver for dynamic scroll letter highlighting
  useEffect(() => {
    if (typeof window === "undefined") return;

    const cardElements = document.querySelectorAll(".term-card[data-letter]");
    if (cardElements.length === 0) return;

    const cardObserver = new IntersectionObserver(
      (entries) => {
        const visibleEntries = entries.filter((e) => e.isIntersecting);
        if (visibleEntries.length > 0) {
          visibleEntries.sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
          const topCard = visibleEntries[0].target as HTMLElement;
          const letter = topCard.getAttribute("data-letter");
          if (letter) {
            setActiveScrollLetter(letter);
          }
        }
      },
      {
        rootMargin: "-80px 0px -60% 0px",
        threshold: 0.1,
      }
    );

    cardElements.forEach((el) => cardObserver.observe(el));

    return () => {
      cardObserver.disconnect();
    };
  }, [displayedTerms, activeLetter]);

  // Auto-scroll active letter button into view horizontally inside the alphabet bar
  useEffect(() => {
    if (activeBtnRef.current) {
      activeBtnRef.current.scrollIntoView({
        behavior: "smooth",
        inline: "center",
        block: "nearest",
      });
    }
  }, [activeLetter, activeScrollLetter]);

  const isLetterActive = (letter: string) => {
    if (letter === "all") {
      return activeLetter === "all" && activeScrollLetter === "all";
    }
    if (activeLetter !== "all") {
      return activeLetter === letter;
    }
    return activeScrollLetter === letter;
  };

  return (
    <div className="glossary-page">
      <div className="glossary-header">
        <h1 className="glossary-title">Metaphysical Glossary</h1>
        <p className="glossary-subtitle">
          An A-Z dictionary index of spiritual terms, alignments, and vibrational practices.
        </p>
      </div>

      <section className="glossary-controls-section">
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
            ref={isLetterActive("all") ? activeBtnRef : null}
            className={`letter-btn ${isLetterActive("all") ? "active" : ""}`}
            onClick={() => {
              setActiveLetter("all");
              setActiveScrollLetter("all");
            }}
          >
            All
          </button>
          {letters.map((letter) => {
            const hasTerms = terms.some((t) => t.word.toUpperCase().startsWith(letter));
            const isActive = isLetterActive(letter);

            return (
              <button
                key={letter}
                ref={isActive ? activeBtnRef : null}
                type="button"
                className={`letter-btn ${isActive ? "active" : ""} ${!hasTerms ? "disabled" : ""}`}
                onClick={() => {
                  if (hasTerms) {
                    setActiveLetter(letter);
                    setActiveScrollLetter(letter);
                  }
                }}
                disabled={!hasTerms && !isActive}
              >
                {letter}
              </button>
            );
          })}
        </div>
      </section>

      <div className="terms-container">
        {loading ? (
          <div className="terms-empty">
            <p>Loading glossary terms...</p>
          </div>
        ) : filteredTerms.length === 0 ? (
          <div className="terms-empty">
            <p>No glossary definitions match your search terms.</p>
          </div>
        ) : (
          <>
            {displayedTerms.map((term) => {
              const firstLetter = term.word.charAt(0).toUpperCase();

              return (
                <div key={term.id} className="term-card" data-letter={firstLetter}>
                  <div className="term-card-content">
                    <div className="term-main-info">
                      <div className="term-title-row">
                        <div className="title-left">
                          <h3 className="term-word">{term.word}</h3>
                          {term.phonetic && <span className="term-phonetic">{term.phonetic}</span>}
                        </div>

                      </div>

                      {term.category && (
                        <span className="term-category-badge">{term.category}</span>
                      )}
                      <p className="term-definition-text" dangerouslySetInnerHTML={{ __html: term.definition }} />
                    </div>

                    <GlossaryTermIllustration illustration={term.illustration} />
                  </div>
                </div>
              );
            })}

            <div className="infinite-scroll-sentinel-wrapper">
              {hasMoreItems ? (
                <div ref={observerRef} className="infinite-loader-box">
                  <svg viewBox="0 0 100 100" className="loader-lotus-spin">
                    <path d="M50 25 C45 45 35 60 50 80 C65 60 55 45 50 25 Z" fill="none" stroke="#7c3aed" strokeWidth="4" />
                    <path d="M50 80 C35 75 25 60 20 40 C35 50 45 60 50 80 Z" fill="none" stroke="#7c3aed" strokeWidth="4" />
                    <path d="M50 80 C65 75 75 60 80 40 C65 50 55 60 50 80 Z" fill="none" stroke="#7c3aed" strokeWidth="4" />
                  </svg>
                  <span>Loading more definitions...</span>
                </div>
              ) : filteredTerms.length > 0 ? (
                <div className="end-of-list-badge">
                  <Sparkles size={16} style={{ color: "#7c3aed" }} />
                  <span>You've reached the end of the glossary</span>
                </div>
              ) : null}
            </div>
          </>
        )}
      </div>

      <style jsx>{`
        .glossary-page {
          display: flex;
          flex-direction: column;
          gap: 28px;
          width: 100%;
        }
        .glossary-header {
          text-align: left;
          padding: 8px 0 0;
        }
        .glossary-title {
          font-family: var(--font-serif);
          font-size: 2.3rem;
          color: #1e1b4b;
          font-weight: 750 !important;
          line-height: 1.2 !important;
          margin-bottom: 8px;
        }
        .glossary-subtitle {
          font-family: var(--font-sans);
          font-size: 0.92rem;
          color: #6b7280;
          line-height: 1.5;
          max-width: 650px;
          margin: 0;
        }
        .glossary-controls-section {
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          gap: 12px;
          padding: 14px 18px;
          width: 100%;
          position: sticky;
          top: 80px;
          z-index: 25;
          background: rgba(255, 255, 255, 0.92);
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
          border: 1px solid rgba(168, 85, 247, 0.15);
          border-radius: 20px;
          box-shadow: 0 10px 30px rgba(124, 58, 237, 0.06);
          box-sizing: border-box;
          transition: border-color 0.3s ease, box-shadow 0.3s ease;
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
          flex-wrap: nowrap;
          justify-content: flex-start;
          align-items: center;
          gap: 6px;
          width: 100%;
          overflow-x: auto;
          overflow-y: hidden;
          padding: 2px 2px 6px;
          scrollbar-width: none; /* Firefox */
          -ms-overflow-style: none; /* IE 10+ */
          -webkit-overflow-scrolling: touch;
        }
        .alphabet-bar::-webkit-scrollbar {
          display: none; /* Chrome/Safari/Edge */
        }
        .letter-btn {
          font-family: var(--font-sans);
          font-size: 0.82rem;
          font-weight: 600;
          color: #4b5563;
          width: 34px;
          height: 34px;
          border-radius: 10px;
          border: 1px solid rgba(168, 85, 247, 0.1);
          background: rgba(255, 255, 255, 0.8);
          cursor: pointer;
          transition: all 0.22s cubic-bezier(0.16, 1, 0.3, 1);
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        .letter-btn:hover:not(.disabled) {
          border-color: #7c3aed;
          color: #7c3aed;
          background: rgba(168, 85, 247, 0.06);
          transform: translateY(-2px);
        }
        .letter-btn.active {
          background: #7c3aed;
          color: #ffffff;
          border-color: #7c3aed;
          box-shadow: 0 4px 14px rgba(124, 58, 237, 0.35);
          transform: scale(1.05);
        }
        .letter-btn.disabled {
          opacity: 0.3;
          cursor: not-allowed;
          background: transparent;
          border-color: transparent;
        }
        .terms-container {
          display: flex;
          flex-direction: column;
        }
        .term-card {
          padding: 28px 10px;
          border-bottom: 1px solid rgba(168, 85, 247, 0.12);
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
          font-family: var(--font-serif);
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
        .term-category-badge {
          font-family: var(--font-sans);
          font-size: 0.72rem;
          font-weight: 700;
          color: #0d9488;
          background: rgba(13, 148, 136, 0.06);
          border: 1px solid rgba(13, 148, 136, 0.2);
          padding: 4px 10px;
          border-radius: 6px;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          align-self: flex-start;
        }
        .term-definition-text {
          font-family: var(--font-sans);
          font-size: 0.88rem;
          line-height: 1.6;
          color: hsl(var(--text-cream));
        }
        .term-definition-text :global(a) {
          color: #7c3aed;
          text-decoration: underline;
          font-weight: 500;
          transition: color 0.15s ease;
        }
        .term-definition-text :global(a:hover) {
          color: #6d28d9;
        }
        .terms-empty {
          text-align: center;
          padding: 40px 10px;
          color: hsl(var(--text-muted));
        }
        .infinite-scroll-sentinel-wrapper {
          display: flex;
          justify-content: center;
          align-items: center;
          padding: 28px 0 16px;
          width: 100%;
        }
        .infinite-loader-box {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 10px 20px;
          border-radius: 20px;
          background: rgba(124, 58, 237, 0.05);
          border: 1px solid rgba(168, 85, 247, 0.15);
          color: #7c3aed;
          font-family: var(--font-sans);
          font-size: 0.82rem;
          font-weight: 600;
        }
        .loader-lotus-spin {
          width: 20px;
          height: 20px;
          animation: spinLotus 2s linear infinite;
        }
        @keyframes spinLotus {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        .end-of-list-badge {
          display: flex;
          align-items: center;
          gap: 8px;
          font-family: var(--font-sans);
          font-size: 0.82rem;
          color: #6b7280;
          padding: 8px 16px;
          background: #ffffff;
          border-radius: 20px;
          border: 1px solid rgba(0, 0, 0, 0.05);
        }
        @media (max-width: 680px) {
          .glossary-controls-section {
            top: 70px;
            padding: 10px 14px;
          }
          .term-card-content {
            flex-direction: column;
            align-items: stretch;
            gap: 20px;
          }
          .glossary-title {
            font-size: 1.8rem;
          }
          .term-word {
            font-size: 1.4rem;
          }
          .term-definition-text {
            font-size: 0.88rem;
            line-height: 1.6;
          }
        }
        @media (max-width: 480px) {
          .letter-btn {
            width: 30px;
            height: 30px;
            font-size: 0.75rem;
            border-radius: 8px;
          }
        }
      `}</style>
    </div>
  );
}



