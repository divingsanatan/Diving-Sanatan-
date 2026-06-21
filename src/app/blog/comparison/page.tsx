"use client";

import React, { useState } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

interface ComparisonRow {
  feature: string;
  auraScanning: string;
  chakraHealing: string;
  isDifferent: boolean;
}

const COMPARISON_ROWS: ComparisonRow[] = [
  {
    feature: "Primary Purpose",
    auraScanning: "Identify leaks, blockages, and color fields in the electromagnetic body.",
    chakraHealing: "Realign and open active energy vortexes along the spinal path.",
    isDifferent: true,
  },
  {
    feature: "Best For Seekers of",
    auraScanning: "Self-awareness, mapping body blockages, and baseline diagnostic reports.",
    chakraHealing: "Anxiety relief, dissolving muscle tension, and emotional catharsis.",
    isDifferent: true,
  },
  {
    feature: "Session Modality",
    auraScanning: "Passive, diagnostic scanning and visual mapping.",
    chakraHealing: "Active therapeutic intervention (sound waves, crystal placement).",
    isDifferent: true,
  },
  {
    feature: "Relieves Anxiety",
    auraScanning: "Moderate (provides mental relief via clarity & diagnostics).",
    chakraHealing: "High (direct somatic nervous system calming).",
    isDifferent: true,
  },
  {
    feature: "Tools Utilized",
    auraScanning: "Bio-resonance sensors, optical frequency maps.",
    chakraHealing: "Tibetan sound bowls, quartz crystals, tuning forks.",
    isDifferent: true,
  },
  {
    feature: "Recommended Frequency",
    auraScanning: "Once every 3 months (quarterly energy check).",
    chakraHealing: "Bi-weekly during high-stress periods.",
    isDifferent: true,
  },
  {
    feature: "Session Duration",
    auraScanning: "45 Minutes",
    chakraHealing: "60 Minutes",
    isDifferent: false,
  },
];

export default function ComparisonPage() {
  const [selectedGoal, setSelectedGoal] = useState<"diagnose" | "heal" | null>(null);

  return (
    <div className="comparison-page">
      <div className="comp-header">
        <h1 className="page-title">Healing Modal Comparison</h1>
        <p className="page-subtitle">
          Compare our signature spiritual practices side-by-side to determine which session aligns with your needs.
        </p>
      </div>

      {/* Main Table Card */}
      <Card variant="glass" className="table-card">
        <div className="table-responsive-container">
          <table className="comparison-table">
            <thead>
              <tr>
                <th className="feature-column-header">Features</th>
                <th className={`service-column-header aura-col ${selectedGoal === "diagnose" ? "highlight-col" : ""}`}>
                  <div className="header-cell-content">
                    <span className="modality-title">Aura Scanning</span>
                    <span className="modality-price">₹1,500 / session</span>
                  </div>
                </th>
                <th className={`service-column-header chakra-col ${selectedGoal === "heal" ? "highlight-col" : ""}`}>
                  <div className="header-cell-content">
                    <span className="modality-title">Chakra Healing</span>
                    <span className="modality-price">₹2,500 / session</span>
                  </div>
                </th>
              </tr>
            </thead>
            <tbody>
              {COMPARISON_ROWS.map((row, idx) => (
                <tr key={idx} className={row.isDifferent ? "diff-row" : ""}>
                  <td className="feature-cell">{row.feature}</td>
                  <td className={`data-cell ${selectedGoal === "diagnose" ? "highlight-cell" : ""}`}>
                    {row.auraScanning}
                  </td>
                  <td className={`data-cell ${selectedGoal === "heal" ? "highlight-cell" : ""}`}>
                    {row.chakraHealing}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Interactive Helper Choice Box */}
      <div className="interactive-choice-section glass-panel">
        <h3 className="choice-title">Find Your Alignment</h3>
        <p className="choice-desc">Select your primary healing goal below, and we will highlight the ideal service for you.</p>
        
        <div className="choice-buttons-row">
          <button
            className={`choice-card-btn ${selectedGoal === "diagnose" ? "selected" : ""}`}
            onClick={() => setSelectedGoal("diagnose")}
          >
            <span className="btn-icon">👁</span>
            <div className="btn-texts">
              <span className="btn-title">I want to scan & diagnose</span>
              <span className="btn-subtitle">Find leaks & check energy field colors</span>
            </div>
          </button>

          <button
            className={`choice-card-btn ${selectedGoal === "heal" ? "selected" : ""}`}
            onClick={() => setSelectedGoal("heal")}
          >
            <span className="btn-icon">⚡</span>
            <div className="btn-texts">
              <span className="btn-title">I want to clear & heal</span>
              <span className="btn-subtitle">Clear somatic blocks & relieve anxiety</span>
            </div>
          </button>
        </div>

        {selectedGoal && (
          <div className="recommendation-badge gold-text-gradient">
            {selectedGoal === "diagnose" 
              ? "Recommended choice: Aura Scanning for deep diagnostics" 
              : "Recommended choice: Chakra Healing for active energy restoration"}
          </div>
        )}
      </div>

      {/* Booking Action Grid */}
      <div className="booking-cta-grid">
        <Card variant="glass" className="cta-sub-card">
          <h4>Need a Diagnostic Report?</h4>
          <p>Book a customized Aura scan to receive a full map of your fields.</p>
          <Button variant="gold" size="lg" onClick={() => alert("Redirecting to Aura Scanning booking...")}>
            Book Aura Scan
          </Button>
        </Card>

        <Card variant="glass" className="cta-sub-card">
          <h4>Ready for Active Alignment?</h4>
          <p>Schedule a complete Sound Bowl & Crystal therapy session today.</p>
          <Button variant="primary" size="lg" onClick={() => alert("Redirecting to Chakra Healing booking...")}>
            Book Chakra Healing
          </Button>
        </Card>
      </div>

      <style jsx>{`
        .comparison-page {
          display: flex;
          flex-direction: column;
          gap: 40px;
          width: 100%;
        }
        .comp-header {
          text-align: center;
        }
        .page-title {
          font-size: 2.8rem;
          color: #4c1d95;
          margin-bottom: 12px;
        }
        .page-subtitle {
          font-size: 1.05rem;
          color: hsl(var(--text-muted));
          max-width: 650px;
          margin: 0 auto;
        }
        .table-card {
          padding: 0 !important;
          border-radius: 20px;
          overflow: hidden;
        }
        .table-responsive-container {
          overflow-x: auto;
          width: 100%;
        }
        .comparison-table {
          width: 100%;
          border-collapse: collapse;
          text-align: left;
          font-size: 0.95rem;
        }
        .comparison-table th, .comparison-table td {
          padding: 18px 24px;
          border-bottom: 1px solid rgba(0, 0, 0, 0.05);
        }
        .feature-column-header {
          background: rgba(0, 0, 0, 0.01);
          color: #4c1d95;
          font-family: var(--font-serif);
          font-size: 1.15rem;
          width: 25%;
        }
        .service-column-header {
          width: 37.5%;
          transition: var(--transition-smooth);
        }
        .header-cell-content {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        .modality-title {
          font-family: var(--font-serif);
          font-size: 1.4rem;
          color: #4c1d95;
        }
        .modality-price {
          font-size: 0.8rem;
          color: #0d9488;
          font-weight: 700;
          text-transform: uppercase;
        }
        .comparison-table tbody tr:last-child td {
          border-bottom: none;
        }
        .feature-cell {
          font-weight: 600;
          color: hsl(var(--text-muted));
          background: rgba(0, 0, 0, 0.01);
        }
        .data-cell {
          color: hsl(var(--text-cream));
          line-height: 1.5;
          transition: var(--transition-smooth);
        }
        .diff-row {
          background: rgba(168, 85, 247, 0.01);
        }
        .highlight-col {
          background: linear-gradient(180deg, rgba(233, 213, 255, 0.15) 0%, rgba(233, 213, 255, 0.03) 100%) !important;
          border-bottom: 2px solid #7c3aed !important;
        }
        .highlight-cell {
          background: rgba(233, 213, 255, 0.04) !important;
          color: #4c1d95;
          font-weight: 500;
        }
        .interactive-choice-section {
          padding: 30px;
          border-radius: 20px;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 16px;
          text-align: center;
        }
        .choice-title {
          font-size: 1.4rem;
          color: #4c1d95;
        }
        .choice-desc {
          font-size: 0.9rem;
          color: hsl(var(--text-muted));
          max-width: 500px;
          margin-bottom: 10px;
        }
        .choice-buttons-row {
          display: flex;
          gap: 20px;
          width: 100%;
          max-width: 680px;
        }
        .choice-card-btn {
          flex: 1;
          display: flex;
          align-items: center;
          gap: 16px;
          padding: 16px 20px;
          border-radius: 14px;
          border: 1px solid rgba(0, 0, 0, 0.05);
          background: rgba(255, 255, 255, 0.7);
          cursor: pointer;
          transition: var(--transition-smooth);
          text-align: left;
        }
        .choice-card-btn:hover {
          border-color: rgba(168, 85, 247, 0.3);
          transform: translateY(-2px);
          box-shadow: 0 4px 15px rgba(0, 0, 0, 0.02);
        }
        .choice-card-btn.selected {
          border-color: #7c3aed;
          background: linear-gradient(135deg, rgba(251, 207, 232, 0.15) 0%, rgba(233, 213, 255, 0.15) 100%);
          box-shadow: 0 0 20px rgba(168, 85, 247, 0.08);
        }
        .btn-icon {
          font-size: 1.8rem;
          color: #7c3aed;
          opacity: 0.8;
        }
        .choice-card-btn.selected .btn-icon {
          opacity: 1;
          transform: scale(1.1);
        }
        .btn-texts {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }
        .btn-title {
          font-size: 0.95rem;
          font-weight: 600;
          color: #4c1d95;
          font-family: var(--font-serif);
        }
        .btn-subtitle {
          font-size: 0.75rem;
          color: hsl(var(--text-muted));
        }
        .recommendation-badge {
          font-weight: 700;
          font-family: var(--font-serif);
          font-size: 1.1rem;
          margin-top: 10px;
          animation: pulseGlow 2s infinite ease-in-out;
        }
        .booking-cta-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 32px;
        }
        .cta-sub-card {
          padding: 30px !important;
          display: flex;
          flex-direction: column;
          gap: 12px;
          align-items: center;
          text-align: center;
        }
        .cta-sub-card h4 {
          font-size: 1.25rem;
          color: #4c1d95;
        }
        .cta-sub-card p {
          font-size: 0.88rem;
          color: hsl(var(--text-muted));
          margin-bottom: 8px;
        }
        
        @keyframes pulseGlow {
          0%, 100% { transform: scale(1); opacity: 0.9; }
          50% { transform: scale(1.02); opacity: 1; }
        }

        @media (max-width: 768px) {
          .choice-buttons-row {
            flex-direction: column;
            gap: 12px;
          }
          .booking-cta-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
}
