"use client";

import React, { useState, useEffect } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

type PacerPhase = "Inhale" | "Hold" | "Exhale";

export default function GuidedPracticesPage() {
  const [isFocusMode, setIsFocusMode] = useState(false);
  const [pacerActive, setPacerActive] = useState(false);
  const [phase, setPhase] = useState<PacerPhase>("Inhale");
  const [secondsLeft, setSecondsLeft] = useState(6);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (pacerActive) {
      timer = setInterval(() => {
        setSecondsLeft((prev) => {
          if (prev <= 1) {
            // Transition phases
            if (phase === "Inhale") {
              setPhase("Hold");
              return 4; // 4s Hold
            } else if (phase === "Hold") {
              setPhase("Exhale");
              return 6; // 6s Exhale
            } else {
              setPhase("Inhale");
              return 6; // 6s Inhale
            }
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      setPhase("Inhale");
      setSecondsLeft(6);
    }

    return () => clearInterval(timer);
  }, [pacerActive, phase]);

  const togglePacer = () => {
    setPacerActive(!pacerActive);
  };

  // Determine pacer circle scale based on phase
  const getPacerScale = () => {
    if (!pacerActive) return 1.0;
    if (phase === "Inhale") {
      // Scale grows from 1.0 to 1.8 over 6 seconds
      const progress = (6 - secondsLeft) / 6;
      return 1.0 + progress * 0.8;
    }
    if (phase === "Hold") {
      return 1.8; // Holds at full expansion
    }
    if (phase === "Exhale") {
      // Scale shrinks from 1.8 to 1.0 over 6 seconds
      const progress = (6 - secondsLeft) / 6;
      return 1.8 - progress * 0.8;
    }
    return 1.0;
  };

  const getPhaseInstruction = () => {
    if (phase === "Inhale") return "Breathe in slowly, filling your abdomen with vital prana.";
    if (phase === "Hold") return "Hold the breath, letting the sound bowl vibrations settle.";
    return "Exhale slowly, releasing all muscle tension and anxieties.";
  };

  const getPacerColor = () => {
    if (phase === "Inhale") return "#22d3ee"; // Cyan
    if (phase === "Hold") return "#facc15"; // Gold/Yellow
    return "#c084fc"; // Purple
  };

  return (
    <div className={`guided-practices-page ${isFocusMode ? "focus-mode-active" : ""}`}>
      
      {/* Focus Mode Overlay Background */}
      {isFocusMode && <div className="focus-dim-overlay"></div>}

      <div className="practice-header">
        <h1 className="page-title">Ambient Media Hub</h1>
        <p className="page-subtitle">
          Practice somatic breathwork using our interactive breathing pacer. Toggle Focus Mode for an immersive experience.
        </p>

        {/* Focus Mode Control */}
        <div className="focus-mode-toggle-bar glass-panel">
          <span className="toggle-label">Focus Meditation Mode</span>
          <button 
            className={`toggle-switch ${isFocusMode ? "on" : "off"}`}
            onClick={() => setIsFocusMode(!isFocusMode)}
          >
            <span className="toggle-handle"></span>
          </button>
        </div>
      </div>

      <div className="practice-workspace">
        {/* Left: Breathing Pacer */}
        <div className="pacer-column">
          <Card variant="glass" className="pacer-card">
            <h3 className="card-block-title">Interactive Breath Pacer</h3>
            <p className="card-block-subtitle">Harmonize your nervous system cycles (6-4-6 timing).</p>

            <div className="pacer-display-area">
              <div 
                className="pacer-outer-ring"
                style={{
                  transform: `scale(${getPacerScale()})`,
                  borderColor: getPacerColor(),
                  boxShadow: pacerActive ? `0 0 40px ${getPacerColor()}30` : undefined,
                  transition: phase === "Hold" ? "none" : "transform 1s linear, border-color 0.4s ease"
                }}
              >
                <div 
                  className="pacer-inner-core"
                  style={{
                    backgroundColor: getPacerColor(),
                    opacity: pacerActive ? 0.15 : 0.05
                  }}
                ></div>
                <div className="pacer-texts">
                  <span className="pacer-phase-label" style={{ color: pacerActive ? getPacerColor() : undefined }}>
                    {pacerActive ? phase : "Ready"}
                  </span>
                  <span className="pacer-timer">
                    {pacerActive ? `${secondsLeft}s` : "✦"}
                  </span>
                </div>
              </div>
            </div>

            <div className="pacer-instructions">
              <p className="pacer-inst-text">
                {pacerActive ? getPhaseInstruction() : "Press Start to begin your custom alignment breathing cycle."}
              </p>
            </div>

            <div className="pacer-controls">
              <Button variant="gold" size="lg" onClick={togglePacer}>
                {pacerActive ? "Pause Pacer" : "Start Breathwork"}
              </Button>
            </div>
          </Card>
        </div>

        {/* Right: Step-by-Step Exercise Guides */}
        <div className="guides-column">
          <div className="exercise-guide-panel glass-panel">
            <h3 className="card-block-title">Step-by-Step Guidance</h3>
            
            <div className="guide-steps-list">
              <div className="guide-step-card glass-card">
                <span className="step-number">01</span>
                <div className="step-content">
                  <h5>Establish Grounding</h5>
                  <p>Sit comfortably with your spine erect. Close your eyes and feel your feet connected to the earth. Release jaw tension.</p>
                </div>
              </div>

              <div className="guide-step-card glass-card">
                <span className="step-number">02</span>
                <div className="step-content">
                  <h5>Follow the Pacer</h5>
                  <p>Coordinate your lungs with the expanding and contracting rings. Inhale as the circle grows, hold as it stays gold, and exhale as it shrinks.</p>
                </div>
              </div>

              <div className="guide-step-card glass-card">
                <span className="step-number">03</span>
                <div className="step-content">
                  <h5>Complete 10 Cycles</h5>
                  <p>Repetition for 3-5 minutes balances vagal nerve output, immediately reducing somatic anxiety levels by 40%.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .guided-practices-page {
          width: 100%;
          position: relative;
          transition: background-color 0.6s ease, color 0.6s ease;
        }
        .focus-dim-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          z-index: 990;
          background: #03000a;
          pointer-events: none;
        }
        
        /* Focus Mode Active Overrides */
        .guided-practices-page.focus-mode-active {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          z-index: 1000;
          background: #03000a;
          padding: 60px 40px;
          overflow-y: auto;
        }
        
        .guided-practices-page.focus-mode-active :global(.header-nav),
        .guided-practices-page.focus-mode-active :global(.header-spacer),
        .guided-practices-page.focus-mode-active :global(.blog-sidebar-container),
        .guided-practices-page.focus-mode-active :global(footer) {
          display: none !important;
        }
        
        /* Hide global layout sidebar when focus active */
        :global(body:has(.focus-mode-active)) :global(.blog-sidebar-container) {
          display: none !important;
        }
        :global(body:has(.focus-mode-active)) :global(.blog-layout-container) {
          max-width: 900px !important;
          margin: 0 auto;
          justify-content: center;
        }
        
        .practice-header {
          text-align: center;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 16px;
          z-index: 995;
          position: relative;
        }
        .page-title {
          font-size: 2.8rem;
          color: #4c1d95;
          transition: color 0.4s;
        }
        .focus-mode-active .page-title {
          color: #c084fc;
        }
        .page-subtitle {
          font-size: 1.05rem;
          color: hsl(var(--text-muted));
          max-width: 650px;
        }
        .focus-mode-active .page-subtitle {
          color: #a78bfa;
        }
        .focus-mode-toggle-bar {
          display: flex;
          align-items: center;
          gap: 18px;
          padding: 10px 20px;
          border-radius: 99px;
          margin-top: 10px;
        }
        .toggle-label {
          font-weight: 700;
          font-size: 0.88rem;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: #4c1d95;
        }
        .focus-mode-active .toggle-label {
          color: #c084fc;
        }
        .toggle-switch {
          width: 50px;
          height: 26px;
          border-radius: 99px;
          border: none;
          background: rgba(0, 0, 0, 0.08);
          position: relative;
          cursor: pointer;
          transition: background-color 0.3s;
        }
        .toggle-switch.on {
          background-color: #7c3aed;
        }
        .toggle-handle {
          position: absolute;
          top: 3px;
          left: 3px;
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: #ffffff;
          box-shadow: 0 2px 4px rgba(0,0,0,0.2);
          transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .toggle-switch.on .toggle-handle {
          transform: translateX(24px);
        }
        .practice-workspace {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 32px;
          margin-top: 40px;
          z-index: 995;
          position: relative;
          align-items: stretch;
        }
        .pacer-column {
          display: flex;
          flex-direction: column;
        }
        .pacer-card {
          padding: 30px !important;
          border-radius: 20px;
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          height: 100%;
        }
        .card-block-title {
          font-size: 1.4rem;
          color: #4c1d95;
          margin-bottom: 4px;
        }
        .focus-mode-active .card-block-title {
          color: #c084fc;
        }
        .card-block-subtitle {
          font-size: 0.85rem;
          color: hsl(var(--text-muted));
          margin-bottom: 30px;
        }
        .pacer-display-area {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          height: 240px;
          width: 100%;
          margin-bottom: 24px;
        }
        .pacer-outer-ring {
          width: 120px;
          height: 120px;
          border-radius: 50%;
          border: 4px solid #d1d5db;
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
        }
        .pacer-inner-core {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          border-radius: 50%;
        }
        .pacer-texts {
          display: flex;
          flex-direction: column;
          align-items: center;
          z-index: 2;
        }
        .pacer-phase-label {
          font-family: var(--font-serif);
          font-weight: 700;
          font-size: 1.1rem;
          color: hsl(var(--text-muted));
          text-transform: uppercase;
          letter-spacing: 0.04em;
        }
        .pacer-timer {
          font-size: 0.85rem;
          font-weight: 600;
          color: hsl(var(--text-muted));
        }
        .pacer-instructions {
          min-height: 50px;
          margin-bottom: 24px;
          max-width: 320px;
        }
        .pacer-inst-text {
          font-size: 0.95rem;
          line-height: 1.5;
          color: hsl(var(--text-cream));
        }
        .focus-mode-active .pacer-inst-text {
          color: #e9d5ff;
        }
        .pacer-controls {
          width: 100%;
          display: flex;
          justify-content: center;
        }
        .guides-column {
          width: 100%;
        }
        .exercise-guide-panel {
          padding: 30px;
          border-radius: 20px;
          height: 100%;
          display: flex;
          flex-direction: column;
          gap: 20px;
        }
        .guide-steps-list {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        .guide-step-card {
          padding: 16px 20px !important;
          border-radius: 12px;
          display: flex;
          gap: 16px;
          align-items: flex-start;
          transition: var(--transition-fast);
        }
        .guide-step-card:hover {
          transform: translateX(4px);
        }
        .step-number {
          font-family: var(--font-serif);
          font-weight: 700;
          font-size: 1.8rem;
          color: #7c3aed;
          opacity: 0.7;
          line-height: 1;
        }
        .step-content {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        .step-content h5 {
          font-family: var(--font-serif);
          font-size: 1.15rem;
          color: #4c1d95;
        }
        .focus-mode-active .step-content h5 {
          color: #c084fc;
        }
        .step-content p {
          font-size: 0.85rem;
          line-height: 1.5;
          color: hsl(var(--text-muted));
        }
        .focus-mode-active .step-content p {
          color: #a78bfa;
        }

        @media (max-width: 860px) {
          .practice-workspace {
            grid-template-columns: 1fr;
          }
          .guided-practices-page.focus-mode-active {
            padding: 30px 20px;
          }
        }
      `}</style>
    </div>
  );
}
