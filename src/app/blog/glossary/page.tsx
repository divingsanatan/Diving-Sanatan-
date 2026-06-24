"use client";

import React, { useState } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { useBlog } from "../BlogContext";

interface GlossaryTerm {
  word: string;
  phonetic: string;
  category: string;
  definition: string;
  illustration?: "aura-chart" | "chakra-system";
}

const GLOSSARY_TERMS: GlossaryTerm[] = [
  {
    word: "Aura",
    phonetic: "/ˈɔːrə/",
    category: "Bio-Energy",
    definition: "The subtle electromagnetic field surrounding a living being. Composed of multiple layers corresponding to mental, emotional, and spiritual states, the aura reflects the vitality and balance of the body's major energy nodes.",
    illustration: "aura-chart",
  },
  {
    word: "Chakra",
    phonetic: "/ˈtʃʌkrə/",
    category: "Energy Center",
    definition: "Sanskrit for 'wheel' or 'disk'. Represents the seven focal nodes in the subtle body, aligned along the spine, through which life force energy (prana) flows. Balancing these centers prevents somatic blockages.",
    illustration: "chakra-system",
  },
  {
    word: "Cleansing",
    phonetic: "/ˈklɛnzɪŋ/",
    category: "Ritual Practice",
    definition: "The process of removing accumulated negative or heavy frequencies from crystals, healing tools, or personal fields. Typically performed using running water, moonlight, sage, or sound bowl frequencies.",
  },
  {
    word: "Energy Node",
    phonetic: "/ˈɛnərdʒi noʊd/",
    category: "Metaphysics",
    definition: "A crossing point of meridians or nadis in the subtle body. High-density intersections create chakras, while minor nodes direct subtle energy flows through limbs and organs.",
  },
  {
    word: "Kundalini",
    phonetic: "/ˌkʊndəˈliːni/",
    category: "Spirituality",
    definition: "A latent spiritual energy coiled at the base of the spine, represented as a sleeping serpent. When awakened through meditation or yoga, it ascends through the chakras to trigger spiritual enlightenment.",
  },
  {
    word: "Mantra",
    phonetic: "/ˈmæntrə/",
    category: "Meditation",
    definition: "A sacred sound, syllable, word, or phrase repeated in meditation. The vibrational frequency of a mantra (like 'Om') helps align brainwaves and soothe the nervous system.",
  },
  {
    word: "Prana",
    phonetic: "/ˈprɑːnə/",
    category: "Vital force",
    definition: "The Sanskrit term for vital life force or breath. Equivalent to 'Chi' in Chinese philosophy, prana flows through nadis and sustains all living cells.",
  },
  {
    word: "Reiki",
    phonetic: "/ˈreɪki/",
    category: "Healing",
    definition: "A Japanese technique for stress reduction and relaxation that also promotes healing. Administered by 'laying on hands', it is based on the flow of universal life energy.",
  },
];

export default function GlossaryPage() {
  const { searchQuery } = useBlog(); // ← sidebar search drives this page
  const [activeLetter, setActiveLetter] = useState("all");

  const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

  const speakTerm = (term: GlossaryTerm) => {
    if (typeof window !== "undefined" && window.speechSynthesis) {
      // Cancel any ongoing speech
      window.speechSynthesis.cancel();
      
      const utterance = new SpeechSynthesisUtterance(`${term.word}. ${term.definition}`);
      utterance.rate = 0.95;
      utterance.pitch = 1.0;
      window.speechSynthesis.speak(utterance);
    } else {
      alert("Text-to-speech is not supported in this browser.");
    }
  };

  const filteredTerms = GLOSSARY_TERMS.filter((t) => {
    const matchesLetter = activeLetter === "all" || t.word.toLowerCase().startsWith(activeLetter.toLowerCase());
    const matchesSearch = t.word.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          t.definition.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesLetter && matchesSearch;
  });

  return (
    <div className="glossary-page">
      {/* Header */}
      <div className="glossary-header">
        <h1 className="glossary-title">Metaphysical Glossary</h1>
        <p className="glossary-subtitle">
          An A-Z dictionary index of spiritual terms, alignments, and vibrational practices.
        </p>
      </div>

      {/* Control panel (Alphabet + active search badge — search is via sidebar) */}
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
            className={`letter-btn ${activeLetter === "all" ? "active" : ""}`}
            onClick={() => setActiveLetter("all")}
          >
            All
          </button>
          {letters.map((letter) => {
            const hasTerms = GLOSSARY_TERMS.some((t) => t.word.toUpperCase().startsWith(letter));
            return (
              <button
                key={letter}
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
        {filteredTerms.length === 0 ? (
          <div className="terms-empty glass-card">
            <p>No glossary definitions match your search terms.</p>
          </div>
        ) : (
          filteredTerms.map((term) => (
            <Card key={term.word} variant="glass" className="term-card">
              <div className="term-card-content">
                <div className="term-main-info">
                  <div className="term-title-row">
                    <div className="title-left">
                      <h3 className="term-word">{term.word}</h3>
                      <span className="term-phonetic">{term.phonetic}</span>
                    </div>

                    <button className="speak-btn" onClick={() => speakTerm(term)} title="Listen to pronunciation">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                        <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07" />
                      </svg>
                    </button>
                  </div>

                  <span className="term-category-badge">{term.category}</span>
                  <p className="term-definition-text">{term.definition}</p>
                </div>

                {term.illustration === "aura-chart" && (
                  <div className="term-graphic-container">
                    <span className="graphic-label">Aura Layer Mapping</span>
                    <div className="aura-chart-svg-wrapper">
                      <svg width="100%" height="150" viewBox="0 0 200 150">
                        {/* Aura Outer Glowing Rings */}
                        <circle cx="100" cy="75" r="50" stroke="rgba(192, 132, 252, 0.4)" strokeWidth="8" fill="none" />
                        <circle cx="100" cy="75" r="42" stroke="rgba(129, 140, 248, 0.3)" strokeWidth="6" fill="none" />
                        <circle cx="100" cy="75" r="35" stroke="rgba(34, 211, 238, 0.3)" strokeWidth="4" fill="none" />
                        <circle cx="100" cy="75" r="28" stroke="rgba(74, 222, 128, 0.2)" strokeWidth="4" fill="none" />
                        
                        {/* Meditating Human Silhouette Outline */}
                        <path d="M100 35 C105 35, 107 40, 105 45 C107 50, 103 55, 100 55 C97 55, 93 50, 95 45 C93 40, 95 35, 100 35 Z" fill="rgba(109, 40, 217, 0.08)" stroke="#6d28d9" strokeWidth="1.5" />
                        <path d="M100 55 C90 60, 80 65, 75 75 C70 85, 60 95, 60 105 C60 115, 80 115, 100 115 C120 115, 140 115, 140 105 C140 95, 130 85, 125 75 C120 65, 110 60, 100 55 Z" fill="rgba(109, 40, 217, 0.08)" stroke="#6d28d9" strokeWidth="1.5" />
                        
                        {/* Chakra nodes mapped inside silhouette */}
                        <circle cx="100" cy="40" r="3.5" fill="#c084fc" className="glow-node" /> {/* Crown */}
                        <circle cx="100" cy="48" r="3.5" fill="#818cf8" className="glow-node" /> {/* Third Eye */}
                        <circle cx="100" cy="57" r="3.5" fill="#22d3ee" className="glow-node" /> {/* Throat */}
                        <circle cx="100" cy="69" r="3.5" fill="#4ade80" className="glow-node" /> {/* Heart */}
                        <circle cx="100" cy="82" r="3.5" fill="#facc15" className="glow-node" /> {/* Solar Plexus */}
                        <circle cx="100" cy="95" r="3.5" fill="#fb923c" className="glow-node" /> {/* Sacral */}
                        <circle cx="100" cy="108" r="3.5" fill="#f87171" className="glow-node" /> {/* Root */}
                      </svg>
                    </div>
                  </div>
                )}

                {term.illustration === "chakra-system" && (
                  <div className="term-graphic-container">
                    <span className="graphic-label">Energy Center Alignment</span>
                    <div className="aura-chart-svg-wrapper">
                      <svg width="100%" height="150" viewBox="0 0 200 150">
                        {/* Spine Line */}
                        <line x1="100" y1="20" x2="100" y2="130" stroke="rgba(168, 85, 247, 0.15)" strokeWidth="3" strokeDasharray="3 3" />
                        
                        {/* Major Chakra Centers on Spine */}
                        <circle cx="100" cy="22" r="6" fill="#c084fc" />
                        <circle cx="100" cy="40" r="6" fill="#818cf8" />
                        <circle cx="100" cy="58" r="6" fill="#22d3ee" />
                        <circle cx="100" cy="76" r="6" fill="#4ade80" />
                        <circle cx="100" cy="94" r="6" fill="#facc15" />
                        <circle cx="100" cy="112" r="6" fill="#fb923c" />
                        <circle cx="100" cy="130" r="6" fill="#f87171" />
                        
                        {/* Horizontal Energy Loops */}
                        <path d="M70 76 Q100 56 130 76" fill="none" stroke="rgba(74, 222, 128, 0.4)" strokeWidth="1.5" />
                        <path d="M70 76 Q100 96 130 76" fill="none" stroke="rgba(74, 222, 128, 0.4)" strokeWidth="1.5" />
                        
                        <path d="M80 40 Q100 30 120 40" fill="none" stroke="rgba(129, 140, 248, 0.4)" strokeWidth="1.5" />
                        <path d="M80 40 Q100 50 120 40" fill="none" stroke="rgba(129, 140, 248, 0.4)" strokeWidth="1.5" />
                      </svg>
                    </div>
                  </div>
                )}
              </div>
            </Card>
          ))
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
        .term-graphic-container {
          width: 180px;
          flex-shrink: 0;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 8px;
          border-left: 1px solid rgba(0, 0, 0, 0.05);
          padding-left: 24px;
        }
        .graphic-label {
          font-size: 0.7rem;
          font-weight: 600;
          color: hsl(var(--text-muted));
          text-transform: uppercase;
          letter-spacing: 0.04em;
        }
        .aura-chart-svg-wrapper {
          width: 100%;
          background: rgba(255, 255, 255, 0.5);
          border-radius: 12px;
          border: 1px solid rgba(0, 0, 0, 0.03);
          padding: 6px;
        }
        .terms-empty {
          text-align: center;
          padding: 40px !important;
          color: hsl(var(--text-muted));
        }
        
        @keyframes subtleGlow {
          0%, 100% { opacity: 0.6; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.2); }
        }
        .glow-node {
          animation: subtleGlow 3s infinite ease-in-out;
        }
        .glow-node:nth-child(even) {
          animation-delay: 1.5s;
        }

        @media (max-width: 680px) {
          .term-card-content {
            flex-direction: column;
            align-items: stretch;
            gap: 20px;
          }
          .term-graphic-container {
            width: 100%;
            border-left: none;
            border-top: 1px solid rgba(0, 0, 0, 0.05);
            padding-left: 0;
            padding-top: 20px;
          }
        }
      `}</style>
    </div>
  );
}
