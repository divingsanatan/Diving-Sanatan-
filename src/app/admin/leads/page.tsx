"use client";

import React, { useState, useEffect } from "react";
import { Card } from "@/components/ui/Card";

interface LeadAnswer {
  id: string;
  question_id: string;
  question_text: string;
  answer_text: string;
}

interface LeadProfile {
  id: string;
  name: string;
  email: string;
  phone: string;
  gender: string;
  dob: string;
  category: string;
  created_at: string;
  user_answers?: LeadAnswer[];
  report_sent?: boolean;
  report_content?: string;
  chakra_scores?: Record<string, number>;
}

export default function LeadsAdmin() {
  const [leads, setLeads] = useState<LeadProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");
  const [expandedLeadId, setExpandedLeadId] = useState<string | null>(null);

  const [editingSubject, setEditingSubject] = useState("");
  const [editingContent, setEditingContent] = useState("");
  const [editingChakras, setEditingChakras] = useState<Record<string, number>>({
    Root: 70, Sacral: 70, Solar: 70, Heart: 70, Throat: 70, ThirdEye: 70, Crown: 70
  });
  const [sendingReport, setSendingReport] = useState(false);
  const [sendStatus, setSendStatus] = useState("");

  const categories = ["all", "Anxiety", "Stress", "Loss", "Health"];

  useEffect(() => {
    fetchLeads();
  }, []);

  const fetchLeads = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/leads");
      const json = await res.json();
      if (json.success) {
        setLeads(json.data || []);
      }
    } catch (err) {
      console.error("Failed to load leads:", err);
    } finally {
      setLoading(false);
    }
  };

  const toggleExpandLead = (lead: LeadProfile) => {
    if (expandedLeadId === lead.id) {
      setExpandedLeadId(null);
    } else {
      setExpandedLeadId(lead.id);
      setSendStatus("");
      
      setEditingSubject(`Your Personalized Soul Report & Somatic Alignment - Diving Sanatan`);
      
      const defaultChakras = {
        Root: 70, Sacral: 70, Solar: 70, Heart: 70, Throat: 70, ThirdEye: 70, Crown: 70
      };
      if (lead.chakra_scores) {
        Object.assign(defaultChakras, lead.chakra_scores);
      } else {
        const cat = lead.category.toLowerCase();
        if (cat.includes("anxi")) {
          defaultChakras.Root = 35;
          defaultChakras.Solar = 45;
        } else if (cat.includes("stress")) {
          defaultChakras.Solar = 30;
          defaultChakras.Heart = 45;
        } else if (cat.includes("loss") || cat.includes("pain") || cat.includes("partner")) {
          defaultChakras.Heart = 30;
          defaultChakras.Crown = 50;
        } else if (cat.includes("health")) {
          defaultChakras.Root = 30;
          defaultChakras.Sacral = 35;
        }
      }
      setEditingChakras(defaultChakras);

      if (lead.report_content) {
        setEditingContent(lead.report_content);
      } else {
        setEditingContent(`Dear ${lead.name},

Thank you for completing your Somatic Alignment check on Diving Sanatan. Our wellness practitioners have manually analyzed your responses to map out your energetic profile.

Here is your customized alignment summary:

EMOTIONAL RESISTANCE PROFILE:
- Focus Focus: ${lead.category}
- Somatic State: ${lead.category.toLowerCase().includes("anxi") ? "Overactive nervous system with grounded safety depletion." : lead.category.toLowerCase().includes("stress") ? "Congested adrenal flow resulting in chronic fatigue and heart constriction." : "Blocked heart/vitality flows requiring somatic release."}

MANUAL CHAKRA MAPPING:
- Sahasrara (Crown Chakra): ${defaultChakras.Crown}%
- Ajna (Third Eye): ${defaultChakras.ThirdEye}%
- Vishuddha (Throat Chakra): ${defaultChakras.Throat}%
- Anahata (Heart Chakra): ${defaultChakras.Heart}%
- Manipura (Solar Plexus): ${defaultChakras.Solar}%
- Svadhisthana (Sacral Chakra): ${defaultChakras.Sacral}%
- Muladhara (Root Chakra): ${defaultChakras.Root}%

[ADD HEALER CLINICAL OBSERVATION AND ADVICE HERE]

RECOMMENDED ALIGNMENT PLAN:
We highly recommend booking your complimentary 15-minute Live Video Consultation with our team to walk through these blocks and begin active sound / crystal therapy.

In addition, we recommend starting a specialized program like Aura Balancing or Chakra Clearing to address the specific depleted nodes above.

In light & healing,
Diving Sanatan Wellness Team`);
      }
    }
  };

  const handleSendReport = async (leadId: string) => {
    try {
      setSendingReport(true);
      setSendStatus("");
      
      const res = await fetch("/api/leads/send-report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          leadId,
          subject: editingSubject,
          content: editingContent,
          chakraScores: editingChakras
        })
      });

      const json = await res.json();
      if (json.success) {
        setSendStatus("success");
        fetchLeads();
      } else {
        setSendStatus(`Error: ${json.error}`);
      }
    } catch (err: any) {
      console.error(err);
      setSendStatus(`Failed to connect: ${err.message}`);
    } finally {
      setSendingReport(false);
    }
  };

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit"
      });
    } catch (e) {
      return dateStr;
    }
  };

  const calculateAge = (dobStr: string) => {
    try {
      const birthDate = new Date(dobStr);
      const difference = Date.now() - birthDate.getTime();
      const ageDate = new Date(difference);
      return Math.abs(ageDate.getUTCFullYear() - 1970);
    } catch (e) {
      return "";
    }
  };

  const filteredLeads = leads.filter((lead) => {
    const matchesSearch =
      lead.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lead.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lead.phone.includes(searchQuery);

    const matchesCategory =
      activeCategory === "all" || lead.category === activeCategory;

    return matchesSearch && matchesCategory;
  });

  return (
    <div className="admin-container">
      <div className="admin-header-row">
        <div>
          <h1 className="admin-page-title">User Leads Profiles</h1>
          <p className="admin-page-subtitle">Track and review patient emotional profiles, answers, and contacts</p>
        </div>
      </div>

      {/* Filters Row */}
      <div className="filters-row">
        <input
          type="text"
          placeholder="Search by name, email, or phone..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="search-input"
        />
        
        <div className="category-filters">
          {categories.map((cat) => (
            <button
              key={cat}
              className={`filter-btn ${activeCategory === cat ? "active" : ""}`}
              onClick={() => setActiveCategory(cat)}
            >
              {cat === "all" ? "All" : cat}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="loading-state">Loading leads profiles...</div>
      ) : filteredLeads.length === 0 ? (
        <div className="empty-state">No lead profiles found.</div>
      ) : (
        <div className="leads-list">
          {filteredLeads.map((lead) => {
            const isExpanded = expandedLeadId === lead.id;
            return (
              <Card key={lead.id} variant="glass" className={`lead-card ${isExpanded ? "expanded" : ""}`}>
                <div className="lead-row" onClick={() => toggleExpandLead(lead)}>
                  <div className="lead-meta">
                    <span className="lead-date">{formatDate(lead.created_at)}</span>
                    <h3 className="lead-name">{lead.name}</h3>
                    <span className="lead-email">{lead.email}</span>
                  </div>

                  <div className="lead-stats">
                    <span className="category-badge">{lead.category}</span>
                    <span className="answers-count">
                      📝 {lead.user_answers?.length || 0} Answers
                    </span>
                    <button className="expand-indicator">
                      {isExpanded ? "▲" : "▼"}
                    </button>
                  </div>
                </div>

                {isExpanded && (
                  <div className="lead-details">
                    <div className="profile-grid">
                      <div className="profile-field">
                        <strong>WhatsApp / Phone:</strong>
                        <span>{lead.phone}</span>
                      </div>
                      <div className="profile-field">
                        <strong>Gender:</strong>
                        <span>{lead.gender}</span>
                      </div>
                      <div className="profile-field">
                        <strong>Date of Birth:</strong>
                        <span>{lead.dob} ({calculateAge(lead.dob)} years old)</span>
                      </div>
                      <div className="profile-field">
                        <strong>Problem Focus:</strong>
                        <span className="highlight">{lead.category}</span>
                      </div>
                    </div>

                    <div className="answers-section">
                      <h4 className="answers-title">Quiz Question Responses</h4>
                      {lead.user_answers && lead.user_answers.length > 0 ? (
                        <div className="answers-list">
                          {lead.user_answers.map((ans, idx) => (
                            <div key={ans.id} className="answer-item">
                              <div className="answer-q">
                                <span className="q-number">Q{idx + 1}:</span> {ans.question_text}
                              </div>
                              <div className="answer-a">
                                <strong>Answer:</strong> {ans.answer_text}
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="no-answers">No question responses logged for this profile.</p>
                      )}
                    </div>

                    {/* Manual Report Designer */}
                    <div className="manual-report-section" style={{ marginTop: "24px", paddingTop: "24px", borderTop: "1px solid rgba(0,0,0,0.06)" }}>
                      <h4 className="answers-title" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <span>Manually Design & Send Soul Report</span>
                        {lead.report_sent ? (
                          <span style={{ fontSize: "0.85rem", padding: "4px 8px", background: "rgba(34, 197, 94, 0.08)", border: "1px solid rgba(34, 197, 94, 0.2)", color: "#15803d", borderRadius: "6px", fontWeight: "700" }}>
                            ✓ Report Sent
                          </span>
                        ) : (
                          <span style={{ fontSize: "0.85rem", padding: "4px 8px", background: "rgba(239, 68, 68, 0.08)", border: "1px solid rgba(239, 68, 68, 0.2)", color: "#b91c1c", borderRadius: "6px", fontWeight: "700" }}>
                            ✗ Pending Report
                          </span>
                        )}
                      </h4>

                      {lead.report_sent && lead.report_content && (
                        <div className="sent-report-preview" style={{ background: "rgba(168, 85, 247, 0.03)", border: "1px solid rgba(168, 85, 247, 0.15)", borderRadius: "8px", padding: "16px", marginBottom: "16px" }}>
                          <strong style={{ display: "block", marginBottom: "6px", fontSize: "0.85rem", color: "#475569" }}>Previously Sent Report Content:</strong>
                          <pre style={{ whiteSpace: "pre-wrap", fontFamily: "inherit", fontSize: "0.9rem", color: "#334155", margin: 0 }}>{lead.report_content}</pre>
                        </div>
                      )}

                      <div className="report-designer-form" style={{ display: "flex", flexDirection: "column", gap: "16px", background: "#ffffff", border: "1px solid rgba(0,0,0,0.06)", borderRadius: "12px", padding: "20px" }}>
                        
                        {/* Chakra sliders */}
                        <div>
                          <strong style={{ fontSize: "0.9rem", color: "#334155", display: "block", marginBottom: "12px" }}>Set Chakra Flow Alignment Score (%)</strong>
                          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "12px" }}>
                            {Object.keys(editingChakras).map((chakra) => (
                              <div key={chakra} style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                                <label style={{ fontSize: "0.75rem", textTransform: "uppercase", color: "#64748b", fontWeight: "600" }}>
                                  {chakra}: {editingChakras[chakra]}%
                                </label>
                                <input
                                  type="range"
                                  min="10"
                                  max="100"
                                  value={editingChakras[chakra]}
                                  onChange={(e) => {
                                    const val = Number(e.target.value);
                                    setEditingChakras({ ...editingChakras, [chakra]: val });
                                    
                                    // Update the score value dynamically in the text editor
                                    const regex = new RegExp(`(- ${chakra}[^:]*:\\s*)\\d+%`, "g");
                                    if (regex.test(editingContent)) {
                                      setEditingContent(editingContent.replace(regex, `$1${val}%`));
                                    }
                                  }}
                                  style={{ accentColor: "#7c3aed" }}
                                />
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Subject */}
                        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                          <label style={{ fontSize: "0.8rem", textTransform: "uppercase", color: "#64748b", fontWeight: "600" }}>Email Subject</label>
                          <input
                            type="text"
                            className="search-input"
                            style={{ width: "100%", padding: "10px 14px", fontSize: "0.9rem" }}
                            value={editingSubject}
                            onChange={(e) => setEditingSubject(e.target.value)}
                          />
                        </div>

                        {/* Textarea for report content */}
                        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                          <label style={{ fontSize: "0.8rem", textTransform: "uppercase", color: "#64748b", fontWeight: "600" }}>Report Body / Email Content</label>
                          <textarea
                            rows={12}
                            style={{ width: "100%", padding: "14px", border: "1px solid rgba(0,0,0,0.1)", borderRadius: "8px", fontSize: "0.9rem", resize: "vertical", fontFamily: "inherit" }}
                            value={editingContent}
                            onChange={(e) => setEditingContent(e.target.value)}
                          />
                        </div>

                        {/* Status message */}
                        {sendStatus === "success" && (
                          <div style={{ padding: "10px 14px", background: "rgba(34, 197, 94, 0.08)", border: "1px solid rgba(34, 197, 94, 0.2)", color: "#15803d", borderRadius: "8px", fontSize: "0.88rem" }}>
                            ✓ Soul Report successfully saved and sent/simulated via email!
                          </div>
                        )}
                        {sendStatus && sendStatus !== "success" && (
                          <div style={{ padding: "10px 14px", background: "rgba(239, 68, 68, 0.08)", border: "1px solid rgba(239, 68, 68, 0.2)", color: "#b91c1c", borderRadius: "8px", fontSize: "0.88rem" }}>
                            {sendStatus}
                          </div>
                        )}

                        {/* Submit Button */}
                        <button
                          type="button"
                          className="filter-btn"
                          disabled={sendingReport || !editingSubject || !editingContent}
                          onClick={() => handleSendReport(lead.id)}
                          style={{
                            background: "linear-gradient(135deg, #7c3aed 0%, #4c1d95 100%)",
                            color: "#ffffff",
                            border: "none",
                            padding: "12px 24px",
                            fontSize: "0.9rem",
                            fontWeight: "600",
                            borderRadius: "8px",
                            cursor: "pointer",
                            width: "fit-content",
                            alignSelf: "flex-end",
                            display: "flex",
                            alignItems: "center",
                            gap: "8px"
                          }}
                        >
                          {sendingReport ? "Sending..." : lead.report_sent ? "Resend Soul Report" : "Send Soul Report"} ➔
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}

      <style jsx>{`
        .admin-container {
          max-width: 1000px;
          margin: 0 auto;
        }
        .admin-header-row {
          margin-bottom: 32px;
        }
        .admin-page-title {
          font-size: 2rem;
          color: #4c1d95;
          margin-bottom: 6px;
        }
        .admin-page-subtitle {
          color: hsl(var(--text-muted));
          font-size: 0.95rem;
        }
        .filters-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 20px;
          margin-bottom: 24px;
        }
        .search-input {
          padding: 12px 18px;
          border-radius: 12px;
          border: 1px solid rgba(0,0,0,0.1);
          background: rgba(0,0,0,0.01);
          font-size: 0.92rem;
          width: 320px;
          outline: none;
        }
        .search-input:focus {
          border-color: #7c3aed;
          box-shadow: 0 0 10px rgba(124, 58, 237, 0.08);
        }
        .category-filters {
          display: flex;
          gap: 8px;
        }
        .filter-btn {
          background: transparent;
          border: 1px solid rgba(0,0,0,0.08);
          padding: 8px 16px;
          font-size: 0.85rem;
          font-weight: 600;
          color: hsl(var(--text-muted));
          cursor: pointer;
          border-radius: 8px;
          transition: var(--transition-fast);
        }
        .filter-btn:hover, .filter-btn.active {
          color: #7c3aed;
          border-color: #7c3aed;
          background: rgba(168, 85, 247, 0.03);
        }
        .loading-state, .empty-state {
          text-align: center;
          padding: 40px;
          color: hsl(var(--text-muted));
        }
        .leads-list {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        .lead-card {
          border-radius: 16px;
          overflow: hidden;
          transition: var(--transition-smooth);
        }
        .lead-row {
          padding: 20px 24px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          cursor: pointer;
          transition: var(--transition-fast);
        }
        .lead-row:hover {
          background: rgba(168, 85, 247, 0.02);
        }
        .lead-meta {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        .lead-date {
          font-size: 0.75rem;
          color: hsl(var(--text-muted));
        }
        .lead-name {
          font-size: 1.15rem;
          font-family: var(--font-sans);
          font-weight: 700;
          color: #1e1b4b;
        }
        .lead-email {
          font-size: 0.85rem;
          color: hsl(var(--text-muted));
        }
        .lead-stats {
          display: flex;
          align-items: center;
          gap: 20px;
        }
        .category-badge {
          background: rgba(168, 85, 247, 0.08);
          border: 1px solid rgba(168, 85, 247, 0.2);
          color: #7c3aed;
          font-size: 0.75rem;
          font-weight: 700;
          padding: 4px 10px;
          border-radius: 6px;
          text-transform: uppercase;
        }
        .answers-count {
          font-size: 0.85rem;
          color: #059669;
          font-weight: 600;
        }
        .expand-indicator {
          background: transparent;
          border: none;
          color: hsl(var(--text-muted));
          font-size: 0.8rem;
          cursor: pointer;
        }
        .lead-details {
          border-top: 1.5px solid rgba(0,0,0,0.06);
          padding: 24px;
          background: rgba(0,0,0,0.01);
        }
        .profile-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
          gap: 16px;
          margin-bottom: 24px;
        }
        .profile-field {
          display: flex;
          flex-direction: column;
          gap: 4px;
          font-size: 0.9rem;
        }
        .profile-field strong {
          color: #334155;
          font-size: 0.8rem;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }
        .profile-field span {
          color: #1e293b;
        }
        .profile-field span.highlight {
          color: #7c3aed;
          font-weight: 700;
        }
        .answers-section {
          background: #ffffff;
          border: 1px solid rgba(0,0,0,0.06);
          border-radius: 12px;
          padding: 20px;
        }
        .answers-title {
          font-size: 1rem;
          color: #4c1d95;
          margin-bottom: 16px;
          font-weight: 700;
        }
        .answers-list {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        .answer-item {
          border-bottom: 1px solid rgba(0,0,0,0.04);
          padding-bottom: 12px;
        }
        .answer-item:last-child {
          border-bottom: none;
          padding-bottom: 0;
        }
        .answer-q {
          font-size: 0.95rem;
          font-weight: 600;
          color: #1e293b;
          margin-bottom: 6px;
        }
        .q-number {
          color: #7c3aed;
        }
        .answer-a {
          font-size: 0.9rem;
          color: hsl(var(--text-muted));
        }
        .no-answers {
          color: hsl(var(--text-muted));
          font-size: 0.9rem;
          font-style: italic;
        }
        @media (max-width: 768px) {
          .filters-row {
            flex-direction: column;
            align-items: stretch;
          }
          .search-input {
            width: 100%;
          }
          .lead-row {
            flex-direction: column;
            align-items: flex-start;
            gap: 16px;
          }
          .lead-stats {
            align-self: flex-end;
          }
        }
      `}</style>
    </div>
  );
}
