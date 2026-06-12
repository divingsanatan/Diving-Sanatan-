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
}

export default function LeadsAdmin() {
  const [leads, setLeads] = useState<LeadProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");
  const [expandedLeadId, setExpandedLeadId] = useState<string | null>(null);

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

  const toggleExpandLead = (id: string) => {
    setExpandedLeadId(expandedLeadId === id ? null : id);
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
                <div className="lead-row" onClick={() => toggleExpandLead(lead.id)}>
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
