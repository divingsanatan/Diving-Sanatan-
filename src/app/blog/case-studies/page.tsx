"use client";

import React, { useState } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

interface CaseStudy {
  id: string;
  title: string;
  client: string;
  age: string;
  focus: string;
  duration: string;
  sessions: number;
  practitioner: string;
  beforeDesc: string;
  afterDesc: string;
  chatLogs: { sender: "healer" | "seeker"; text: string }[];
}

const CASE_STUDIES: CaseStudy[] = [
  {
    id: "cs-1",
    title: "Case Study: Overcoming Severe Anxiety",
    client: "Anonymized Female (A.P.)",
    age: "32 Years",
    focus: "Chronic Anxiety & Insomnia",
    duration: "3 Weeks",
    sessions: 6,
    practitioner: "Acharya Sanatan",
    beforeDesc: "Scattered, unstable red-orange wavelengths radiating from the Solar Plexus, indicating high stress hormones and flight-or-fight response.",
    afterDesc: "Perfect, harmonious concentric violet and indigo wave rings. Energy stabilizes, calming the central nervous system.",
    chatLogs: [
      { sender: "healer", text: "Welcome. Let's start with how you felt after your first audio crystal scan." },
      { sender: "seeker", text: "Before, my heart felt like it was constantly racing. I couldn't sleep because of severe tension in my forehead." },
      { sender: "healer", text: "Understood. The bio-map showed high density in your Third-Eye and Solar Plexus nodes." },
      { sender: "seeker", text: "Yes, exactly! But after the third sound vibration session, I felt a heavy energy lift off my head. My sleep has been deep and uninterrupted for three days now." },
    ],
  },
  {
    id: "cs-2",
    title: "Case Study: Throat Node Reconnection",
    client: "Anonymized Male (R.K.)",
    age: "45 Years",
    focus: "Inability to Express & Throat Blockage",
    duration: "2 Weeks",
    sessions: 4,
    practitioner: "Sadhvi Mira",
    beforeDesc: "Contracted, dark-indigo clusters centered tightly on the throat node. Expression node is completely blocked.",
    afterDesc: "Restored, open bright cyan and blue energy circles. Expression flow is healthy, releasing emotional blockage.",
    chatLogs: [
      { sender: "healer", text: "Did you notice any physical release when the 528Hz tuning fork was introduced?" },
      { sender: "seeker", text: "I actually felt a sudden urge to cough, and then this cooling sensation ran all the way down my neck." },
      { sender: "healer", text: "That is typical of a somatic release in the Vishuddha (throat) chakra." },
      { sender: "seeker", text: "I feel like a weight has been lifted. I spoke up in a meeting yesterday for the first time in months without feeling fear." },
    ],
  },
];

export default function CaseStudiesPage() {
  const [selectedId, setSelectedId] = useState("cs-1");

  const activeCS = CASE_STUDIES.find((cs) => cs.id === selectedId) || CASE_STUDIES[0];

  return (
    <div className="case-studies-page">
      <div className="cs-header">
        <h1 className="page-title">Spiritual Case Studies</h1>
        <p className="page-subtitle">
          Anonymized practitioner reviews, clinical bio-energy scans, and client journey logs.
        </p>

        {/* Case Study selector tabs */}
        <div className="cs-tabs">
          {CASE_STUDIES.map((cs) => (
            <button
              key={cs.id}
              className={`cs-tab-btn ${selectedId === cs.id ? "active" : ""}`}
              onClick={() => setSelectedId(cs.id)}
            >
              {cs.focus.split(" & ")[0]}
            </button>
          ))}
        </div>
      </div>

      <div className="cs-main-content">
        {/* Profile Card & Info */}
        <div className="cs-meta-grid">
          <Card variant="glass" className="cs-profile-card">
            <h3 className="card-section-title">Anonymized Profile</h3>
            <div className="profile-details">
              <div className="detail-item">
                <span className="label">Client:</span>
                <span className="value">{activeCS.client}</span>
              </div>
              <div className="detail-item">
                <span className="label">Age:</span>
                <span className="value">{activeCS.age}</span>
              </div>
              <div className="detail-item">
                <span className="label">Primary Focus:</span>
                <span className="value focus-text">{activeCS.focus}</span>
              </div>
              <div className="detail-item">
                <span className="label">Treatment Span:</span>
                <span className="value">{activeCS.duration}</span>
              </div>
              <div className="detail-item">
                <span className="label">Sessions:</span>
                <span className="value">{activeCS.sessions} Sessions</span>
              </div>
              <div className="detail-item">
                <span className="label">Practitioner:</span>
                <span className="value">{activeCS.practitioner}</span>
              </div>
            </div>
          </Card>

          {/* Before vs After Scans */}
          <Card variant="glass" className="cs-scans-card">
            <h3 className="card-section-title">Bio-Energy Scan: Before vs After</h3>
            
            <div className="scans-comparison">
              {/* BEFORE */}
              <div className="scan-item">
                <span className="scan-label before">Before Treatment</span>
                <div className="scan-graphic-box red-bg">
                  <svg width="100%" height="120" viewBox="0 0 100 100">
                    {/* Chaotic Aura */}
                    <circle cx="50" cy="50" r="38" stroke="rgba(248, 113, 113, 0.4)" strokeWidth="6" strokeDasharray="3 4" fill="none" className="pulse-chaotic" />
                    <circle cx="50" cy="50" r="30" stroke="rgba(251, 146, 60, 0.4)" strokeWidth="4" strokeDasharray="1 5" fill="none" className="pulse-chaotic" />
                    
                    {/* Disrupted nodes */}
                    <circle cx="50" cy="30" r="5" fill="#f87171" />
                    <circle cx="50" cy="50" r="8" fill="#fb923c" className="alert-node" />
                    <circle cx="50" cy="70" r="4" fill="#fb7185" />
                  </svg>
                </div>
                <p className="scan-desc">{activeCS.beforeDesc}</p>
              </div>

              {/* AFTER */}
              <div className="scan-item">
                <span className="scan-label after">After Treatment</span>
                <div className="scan-graphic-box green-bg">
                  <svg width="100%" height="120" viewBox="0 0 100 100">
                    {/* Stable Aura */}
                    <circle cx="50" cy="50" r="36" stroke="rgba(192, 132, 252, 0.6)" strokeWidth="4" fill="none" className="pulse-stable" />
                    <circle cx="50" cy="50" r="28" stroke="rgba(129, 140, 248, 0.5)" strokeWidth="3" fill="none" className="pulse-stable" />
                    
                    {/* Aligned nodes */}
                    <circle cx="50" cy="30" r="4" fill="#c084fc" />
                    <circle cx="50" cy="50" r="4" fill="#818cf8" />
                    <circle cx="50" cy="70" r="4" fill="#4ade80" />
                  </svg>
                </div>
                <p className="scan-desc">{activeCS.afterDesc}</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Healer-Seeker QA Chat Logs */}
        <div className="cs-chat-section glass-panel">
          <h3 className="card-section-title">Practitioner Interview Logs</h3>
          <div className="chat-bubbles-container">
            {activeCS.chatLogs.map((log, index) => {
              const isHealer = log.sender === "healer";
              return (
                <div key={index} className={`chat-row ${isHealer ? "healer-row" : "seeker-row"}`}>
                  <div className="chat-avatar">
                    {isHealer ? "H" : "S"}
                  </div>
                  <div className="chat-bubble">
                    <span className="speaker-label">{isHealer ? "Certified Healer" : "Seeker Profile"}</span>
                    <p className="bubble-text">{log.text}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <style jsx>{`
        .case-studies-page {
          display: flex;
          flex-direction: column;
          gap: 40px;
          width: 100%;
        }
        .cs-header {
          text-align: center;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 16px;
        }
        .page-title {
          font-size: 2.8rem;
          color: #4c1d95;
        }
        .page-subtitle {
          font-size: 1.05rem;
          color: hsl(var(--text-muted));
          max-width: 650px;
        }
        .cs-tabs {
          display: flex;
          gap: 12px;
          margin-top: 10px;
          border-bottom: 1.5px solid rgba(0,0,0,0.05);
          padding-bottom: 16px;
        }
        .cs-tab-btn {
          background: transparent;
          border: none;
          color: hsl(var(--text-muted));
          font-family: var(--font-serif);
          font-size: 0.95rem;
          font-weight: 600;
          padding: 8px 16px;
          cursor: pointer;
          transition: var(--transition-fast);
          position: relative;
        }
        .cs-tab-btn:hover {
          color: #7c3aed;
        }
        .cs-tab-btn.active {
          color: #7c3aed;
        }
        .cs-tab-btn.active::after {
          content: '';
          position: absolute;
          bottom: -17.5px;
          left: 0;
          right: 0;
          height: 2px;
          background: #7c3aed;
        }
        .cs-main-content {
          display: flex;
          flex-direction: column;
          gap: 32px;
        }
        .cs-meta-grid {
          display: grid;
          grid-template-columns: 320px 1fr;
          gap: 32px;
          align-items: stretch;
        }
        .card-section-title {
          font-size: 1.3rem;
          color: #4c1d95;
          margin-bottom: 20px;
          border-bottom: 1px solid rgba(0, 0, 0, 0.05);
          padding-bottom: 10px;
        }
        .cs-profile-card {
          padding: 24px !important;
        }
        .profile-details {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        .detail-item {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        .label {
          font-size: 0.72rem;
          font-weight: 600;
          color: hsl(var(--text-muted));
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }
        .value {
          font-size: 0.98rem;
          color: hsl(var(--text-cream));
          font-weight: 500;
        }
        .focus-text {
          color: #b91c1c; /* Soothing alert red */
          font-weight: 600;
        }
        .cs-scans-card {
          padding: 24px !important;
        }
        .scans-comparison {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 24px;
        }
        .scan-item {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 12px;
        }
        .scan-label {
          font-size: 0.8rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }
        .scan-label.before {
          color: #b91c1c;
        }
        .scan-label.after {
          color: #047857;
        }
        .scan-graphic-box {
          width: 100%;
          height: 140px;
          border-radius: 12px;
          border: 1px solid rgba(0, 0, 0, 0.04);
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .scan-graphic-box.red-bg {
          background: radial-gradient(circle at center, rgba(239, 68, 68, 0.05) 0%, rgba(239, 68, 68, 0) 70%);
        }
        .scan-graphic-box.green-bg {
          background: radial-gradient(circle at center, rgba(16, 185, 129, 0.05) 0%, rgba(16, 185, 129, 0) 70%);
        }
        .scan-desc {
          font-size: 0.8rem;
          color: hsl(var(--text-muted));
          text-align: center;
          line-height: 1.4;
        }
        .cs-chat-section {
          padding: 30px;
          border-radius: 20px;
        }
        .chat-bubbles-container {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }
        .chat-row {
          display: flex;
          gap: 16px;
          max-width: 80%;
        }
        .healer-row {
          align-self: flex-start;
        }
        .seeker-row {
          align-self: flex-end;
          flex-direction: row-reverse;
        }
        .chat-avatar {
          width: 38px;
          height: 38px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
          font-size: 0.9rem;
          flex-shrink: 0;
        }
        .healer-row .chat-avatar {
          background: #7c3aed;
          color: #ffffff;
          box-shadow: 0 4px 10px rgba(124, 58, 237, 0.3);
        }
        .seeker-row .chat-avatar {
          background: #0d9488;
          color: #ffffff;
          box-shadow: 0 4px 10px rgba(13, 148, 136, 0.3);
        }
        .chat-bubble {
          display: flex;
          flex-direction: column;
          gap: 4px;
          padding: 12px 18px;
          border-radius: 16px;
        }
        .healer-row .chat-bubble {
          background: rgba(168, 85, 247, 0.05);
          border: 1px solid rgba(168, 85, 247, 0.15);
          border-top-left-radius: 2px;
        }
        .seeker-row .chat-bubble {
          background: rgba(13, 148, 136, 0.05);
          border: 1px solid rgba(13, 148, 136, 0.15);
          border-top-right-radius: 2px;
          text-align: right;
        }
        .speaker-label {
          font-size: 0.7rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }
        .healer-row .speaker-label { color: #6d28d9; }
        .seeker-row .speaker-label { color: #0f766e; }
        
        .bubble-text {
          font-size: 0.92rem;
          line-height: 1.5;
          color: hsl(var(--text-cream));
          margin: 0;
        }
        
        @keyframes chaoticFloat {
          0%, 100% { transform: scale(1) translate(0, 0); opacity: 0.4; }
          50% { transform: scale(1.08) translate(2px, -2px); opacity: 0.8; }
        }
        .pulse-chaotic {
          animation: chaoticFloat 4s infinite ease-in-out;
        }
        .alert-node {
          animation: chaoticFloat 2s infinite alternate ease-in-out;
          filter: drop-shadow(0 0 4px rgba(251, 146, 60, 0.8));
        }
        
        @keyframes stableFloat {
          0%, 100% { transform: scale(1); opacity: 0.7; }
          50% { transform: scale(1.04); opacity: 1; }
        }
        .pulse-stable {
          animation: stableFloat 6s infinite ease-in-out;
        }
        
        @media (max-width: 860px) {
          .cs-meta-grid {
            grid-template-columns: 1fr;
          }
          .scans-comparison {
            grid-template-columns: 1fr;
          }
          .chat-row {
            max-width: 100%;
          }
        }
      `}</style>
    </div>
  );
}
