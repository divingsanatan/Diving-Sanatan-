import React from "react";
import { GlossaryIllustration } from "@/types/database";

interface GlossaryTermIllustrationProps {
  illustration?: GlossaryIllustration;
}

export function GlossaryTermIllustration({ illustration }: GlossaryTermIllustrationProps) {
  if (illustration === "aura-chart") {
    return (
      <div className="term-graphic-container">
        <span className="graphic-label">Aura Layer Mapping</span>
        <div className="aura-chart-svg-wrapper">
          <svg width="100%" height="150" viewBox="0 0 200 150">
            <circle cx="100" cy="75" r="50" stroke="rgba(192, 132, 252, 0.4)" strokeWidth="8" fill="none" />
            <circle cx="100" cy="75" r="42" stroke="rgba(129, 140, 248, 0.3)" strokeWidth="6" fill="none" />
            <circle cx="100" cy="75" r="35" stroke="rgba(34, 211, 238, 0.3)" strokeWidth="4" fill="none" />
            <circle cx="100" cy="75" r="28" stroke="rgba(74, 222, 128, 0.2)" strokeWidth="4" fill="none" />
            <path d="M100 35 C105 35, 107 40, 105 45 C107 50, 103 55, 100 55 C97 55, 93 50, 95 45 C93 40, 95 35, 100 35 Z" fill="rgba(109, 40, 217, 0.08)" stroke="#6d28d9" strokeWidth="1.5" />
            <path d="M100 55 C90 60, 80 65, 75 75 C70 85, 60 95, 60 105 C60 115, 80 115, 100 115 C120 115, 140 115, 140 105 C140 95, 130 85, 125 75 C120 65, 110 60, 100 55 Z" fill="rgba(109, 40, 217, 0.08)" stroke="#6d28d9" strokeWidth="1.5" />
            <circle cx="100" cy="40" r="3.5" fill="#c084fc" className="glow-node" />
            <circle cx="100" cy="48" r="3.5" fill="#818cf8" className="glow-node" />
            <circle cx="100" cy="57" r="3.5" fill="#22d3ee" className="glow-node" />
            <circle cx="100" cy="69" r="3.5" fill="#4ade80" className="glow-node" />
            <circle cx="100" cy="82" r="3.5" fill="#facc15" className="glow-node" />
            <circle cx="100" cy="95" r="3.5" fill="#fb923c" className="glow-node" />
            <circle cx="100" cy="108" r="3.5" fill="#f87171" className="glow-node" />
          </svg>
        </div>
        <style jsx>{`
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
          @keyframes subtleGlow {
            0%, 100% { opacity: 0.6; transform: scale(1); }
            50% { opacity: 1; transform: scale(1.2); }
          }
          :global(.glow-node) {
            animation: subtleGlow 3s infinite ease-in-out;
          }
          @media (max-width: 680px) {
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

  if (illustration === "chakra-system") {
    return (
      <div className="term-graphic-container">
        <span className="graphic-label">Energy Center Alignment</span>
        <div className="aura-chart-svg-wrapper">
          <svg width="100%" height="150" viewBox="0 0 200 150">
            <line x1="100" y1="20" x2="100" y2="130" stroke="rgba(168, 85, 247, 0.15)" strokeWidth="3" strokeDasharray="3 3" />
            <circle cx="100" cy="22" r="6" fill="#c084fc" />
            <circle cx="100" cy="40" r="6" fill="#818cf8" />
            <circle cx="100" cy="58" r="6" fill="#22d3ee" />
            <circle cx="100" cy="76" r="6" fill="#4ade80" />
            <circle cx="100" cy="94" r="6" fill="#facc15" />
            <circle cx="100" cy="112" r="6" fill="#fb923c" />
            <circle cx="100" cy="130" r="6" fill="#f87171" />
            <path d="M70 76 Q100 56 130 76" fill="none" stroke="rgba(74, 222, 128, 0.4)" strokeWidth="1.5" />
            <path d="M70 76 Q100 96 130 76" fill="none" stroke="rgba(74, 222, 128, 0.4)" strokeWidth="1.5" />
            <path d="M80 40 Q100 30 120 40" fill="none" stroke="rgba(129, 140, 248, 0.4)" strokeWidth="1.5" />
            <path d="M80 40 Q100 50 120 40" fill="none" stroke="rgba(129, 140, 248, 0.4)" strokeWidth="1.5" />
          </svg>
        </div>
        <style jsx>{`
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
          @media (max-width: 680px) {
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

  return null;
}
