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
  has_auth?: boolean;
}

const PAGE_SIZE = 10;
const categories = ["all", "Anxiety", "Stress", "Loss", "Health"];

export default function LeadsAdmin() {
  const [leads, setLeads] = useState<LeadProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);

  const [viewingLead, setViewingLead] = useState<LeadProfile | null>(null);
  const [editingSubject, setEditingSubject] = useState("");
  const [editingContent, setEditingContent] = useState("");
  const [editingChakras, setEditingChakras] = useState<Record<string, number>>({
    Root: 70, Sacral: 70, Solar: 70, Heart: 70, Throat: 70, ThirdEye: 70, Crown: 70,
  });
  const [sendingReport, setSendingReport] = useState(false);
  const [sendStatus, setSendStatus] = useState("");

  useEffect(() => {
    fetchLeads();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, activeCategory]);

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

  const openViewModal = (lead: LeadProfile) => {
    setViewingLead(lead);
    setSendStatus("");
    setEditingSubject(`Your Personalized Soul Report & Somatic Alignment - Diving Sanatan`);

    const defaultChakras = {
      Root: 70, Sacral: 70, Solar: 70, Heart: 70, Throat: 70, ThirdEye: 70, Crown: 70,
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
  };

  const closeViewModal = () => {
    setViewingLead(null);
    setSendStatus("");
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
          chakraScores: editingChakras,
        }),
      });

      const json = await res.json();
      if (json.success) {
        setSendStatus("success");
        fetchLeads();
      } else {
        setSendStatus(`Error: ${json.error}`);
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Unknown error";
      setSendStatus(`Failed to connect: ${message}`);
    } finally {
      setSendingReport(false);
    }
  };

  const handleDeleteLead = async (id: string, name: string) => {
    if (!confirm(`Delete user profile for "${name}"? This cannot be undone.`)) return;
    try {
      const res = await fetch(`/api/leads?id=${id}`, { method: "DELETE" });
      const json = await res.json();
      if (json.success) {
        if (viewingLead?.id === id) closeViewModal();
        fetchLeads();
      } else {
        alert("Delete failed: " + json.error);
      }
    } catch (err) {
      console.error(err);
      alert("Failed to delete profile.");
    }
  };

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return dateStr;
    }
  };

  const calculateAge = (dobStr: string) => {
    try {
      const birthDate = new Date(dobStr);
      const difference = Date.now() - birthDate.getTime();
      const ageDate = new Date(difference);
      return Math.abs(ageDate.getUTCFullYear() - 1970);
    } catch {
      return "";
    }
  };

  const filteredLeads = leads.filter((lead) => {
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      lead.name.toLowerCase().includes(q) ||
      lead.email.toLowerCase().includes(q) ||
      lead.phone.includes(searchQuery);
    const matchesCategory =
      activeCategory === "all" || lead.category === activeCategory;
    return matchesSearch && matchesCategory;
  });

  const totalPages = Math.max(1, Math.ceil(filteredLeads.length / PAGE_SIZE));
  const safePage = Math.min(currentPage, totalPages);
  const paginatedLeads = filteredLeads.slice(
    (safePage - 1) * PAGE_SIZE,
    safePage * PAGE_SIZE
  );

  return (
    <div className="dashboard-content">
      <div className="dashboard-header-row">
        <div>
          <h2>User Profiles</h2>
          <p className="admin-header-desc">
            Unified leads &amp; auth users — one record per email, no duplicates.
          </p>
        </div>
        <button className="sync-btn" onClick={fetchLeads}>
          🔄 Refresh
        </button>
      </div>

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
        <p className="admin-loading">Loading user profiles...</p>
      ) : (
        <Card variant="glass" className="admin-card-flush">
          <div className="table-wrapper">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Date / Time</th>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Phone</th>
                  <th>Category</th>
                  <th>Answers</th>
                  <th>Auth</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedLeads.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="empty-cell">No user profiles found.</td>
                  </tr>
                ) : (
                  paginatedLeads.map((lead) => (
                    <tr key={lead.id}>
                      <td className="date-cell">{formatDate(lead.created_at)}</td>
                      <td><strong>{lead.name}</strong></td>
                      <td>{lead.email}</td>
                      <td>{lead.phone}</td>
                      <td>
                        <span className="category-badge">{lead.category}</span>
                      </td>
                      <td>
                        <span className="answers-count">
                          {lead.user_answers?.length || 0}
                        </span>
                      </td>
                      <td>
                        <span className={`auth-badge ${lead.has_auth ? "registered" : "lead"}`}>
                          {lead.has_auth ? "Registered" : "Lead Only"}
                        </span>
                      </td>
                      <td>
                        <div className="action-btns-group">
                          <button className="tbl-btn view" onClick={() => openViewModal(lead)}>
                            View
                          </button>
                          <button
                            className="tbl-btn danger"
                            onClick={() => handleDeleteLead(lead.id, lead.name)}
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {filteredLeads.length > 0 && (
            <div className="pagination-bar">
              <span className="pagination-info">
                Showing {(safePage - 1) * PAGE_SIZE + 1}–{Math.min(safePage * PAGE_SIZE, filteredLeads.length)} of {filteredLeads.length}
              </span>
              <div className="pagination-controls">
                <button
                  className="page-btn"
                  disabled={safePage <= 1}
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                >
                  ← Prev
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <button
                    key={page}
                    className={`page-btn ${page === safePage ? "active" : ""}`}
                    onClick={() => setCurrentPage(page)}
                  >
                    {page}
                  </button>
                ))}
                <button
                  className="page-btn"
                  disabled={safePage >= totalPages}
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                >
                  Next →
                </button>
              </div>
            </div>
          )}
        </Card>
      )}

      {/* Detail / Report Modal */}
      {viewingLead && (
        <div className="modal-overlay" onClick={closeViewModal}>
          <div className="modal-panel" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h3>{viewingLead.name}</h3>
                <span className="modal-subtitle">{viewingLead.email}</span>
              </div>
              <button className="modal-close" onClick={closeViewModal}>✕</button>
            </div>

            <div className="modal-body">
              <div className="profile-grid">
                <div className="profile-field">
                  <strong>WhatsApp / Phone</strong>
                  <span>{viewingLead.phone}</span>
                </div>
                <div className="profile-field">
                  <strong>Gender</strong>
                  <span>{viewingLead.gender}</span>
                </div>
                <div className="profile-field">
                  <strong>Date of Birth</strong>
                  <span>{viewingLead.dob} ({calculateAge(viewingLead.dob)} yrs)</span>
                </div>
                <div className="profile-field">
                  <strong>Category</strong>
                  <span className="highlight">{viewingLead.category}</span>
                </div>
                <div className="profile-field">
                  <strong>Auth Status</strong>
                  <span className={viewingLead.has_auth ? "auth-yes" : "auth-no"}>
                    {viewingLead.has_auth ? "Can log in" : "Lead only — signup will claim this profile"}
                  </span>
                </div>
                <div className="profile-field">
                  <strong>Joined</strong>
                  <span>{formatDate(viewingLead.created_at)}</span>
                </div>
              </div>

              <div className="answers-section">
                <h4 className="section-title">Quiz Responses</h4>
                {viewingLead.user_answers && viewingLead.user_answers.length > 0 ? (
                  <div className="answers-list">
                    {viewingLead.user_answers.map((ans, idx) => (
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
                  <p className="no-answers">No quiz responses logged.</p>
                )}
              </div>

              <div className="report-section">
                <h4 className="section-title flex-between">
                  <span>Soul Report</span>
                  {viewingLead.report_sent ? (
                    <span className="report-badge sent">✓ Sent</span>
                  ) : (
                    <span className="report-badge pending">✗ Pending</span>
                  )}
                </h4>

                {viewingLead.report_sent && viewingLead.report_content && (
                  <div className="sent-preview">
                    <strong>Previously sent:</strong>
                    <pre>{viewingLead.report_content}</pre>
                  </div>
                )}

                <div className="chakra-sliders-grid">
                  {Object.keys(editingChakras).map((chakra) => (
                    <div key={chakra} className="chakra-field">
                      <label>{chakra}: {editingChakras[chakra]}%</label>
                      <input
                        type="range"
                        min="10"
                        max="100"
                        value={editingChakras[chakra]}
                        onChange={(e) => {
                          const val = Number(e.target.value);
                          setEditingChakras({ ...editingChakras, [chakra]: val });
                          const regex = new RegExp(`(- ${chakra}[^:]*:\\s*)\\d+%`, "g");
                          if (regex.test(editingContent)) {
                            setEditingContent(editingContent.replace(regex, `$1${val}%`));
                          }
                        }}
                        className="chakra-range"
                      />
                    </div>
                  ))}
                </div>

                <div className="report-field">
                  <label>Email Subject</label>
                  <input
                    type="text"
                    className="search-input full-width"
                    value={editingSubject}
                    onChange={(e) => setEditingSubject(e.target.value)}
                  />
                </div>

                <div className="report-field">
                  <label>Report Body</label>
                  <textarea
                    rows={10}
                    className="report-textarea"
                    value={editingContent}
                    onChange={(e) => setEditingContent(e.target.value)}
                  />
                </div>

                {sendStatus === "success" && (
                  <div className="status-msg success">✓ Report sent successfully!</div>
                )}
                {sendStatus && sendStatus !== "success" && (
                  <div className="status-msg error">{sendStatus}</div>
                )}

                <button
                  type="button"
                  className="send-report-btn"
                  disabled={sendingReport || !editingSubject || !editingContent}
                  onClick={() => handleSendReport(viewingLead.id)}
                >
                  {sendingReport ? "Sending..." : viewingLead.report_sent ? "Resend Report" : "Send Report"} ➔
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .dashboard-content {
          display: flex;
          flex-direction: column;
          gap: 24px;
        }
        .dashboard-header-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .dashboard-header-row h2 {
          font-family: var(--font-serif);
          color: #4c1d95;
          font-size: 1.8rem;
          margin-bottom: 4px;
        }
        .admin-header-desc {
          color: hsl(var(--text-muted));
          font-size: 0.9rem;
        }
        .sync-btn {
          background: rgba(0,0,0,0.02);
          border: 1px solid rgba(0,0,0,0.08);
          color: hsl(var(--text-cream));
          padding: 10px 18px;
          border-radius: 8px;
          cursor: pointer;
          font-size: 0.85rem;
          font-weight: 600;
          transition: var(--transition-fast);
        }
        .sync-btn:hover {
          background: rgba(168, 85, 247, 0.08);
          border-color: #7c3aed;
          color: #7c3aed;
        }
        .filters-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 20px;
          flex-wrap: wrap;
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
        .full-width { width: 100%; }
        .category-filters {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
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
        .admin-loading {
          text-align: center;
          padding: 40px;
          color: hsl(var(--text-muted));
        }
        .table-wrapper {
          width: 100%;
          overflow-x: auto;
        }
        .admin-table {
          width: 100%;
          border-collapse: collapse;
          text-align: left;
          font-size: 0.88rem;
        }
        .admin-table th {
          background: rgba(0,0,0,0.02);
          border-bottom: 1px solid rgba(0,0,0,0.08);
          padding: 14px 16px;
          font-weight: 600;
          text-transform: uppercase;
          font-size: 0.72rem;
          color: hsl(var(--text-muted));
          letter-spacing: 0.05em;
          white-space: nowrap;
        }
        .admin-table td {
          border-bottom: 1px solid rgba(0,0,0,0.05);
          padding: 14px 16px;
          vertical-align: middle;
        }
        .date-cell {
          font-size: 0.8rem;
          color: hsl(var(--text-muted));
          white-space: nowrap;
        }
        .category-badge {
          background: rgba(168, 85, 247, 0.08);
          border: 1px solid rgba(168, 85, 247, 0.2);
          color: #7c3aed;
          font-size: 0.7rem;
          font-weight: 700;
          padding: 3px 8px;
          border-radius: 6px;
          text-transform: uppercase;
          white-space: nowrap;
        }
        .answers-count {
          font-weight: 700;
          color: #059669;
        }
        .auth-badge {
          font-size: 0.7rem;
          font-weight: 700;
          padding: 4px 10px;
          border-radius: 6px;
          text-transform: uppercase;
          white-space: nowrap;
        }
        .auth-badge.registered {
          background: rgba(34, 197, 94, 0.08);
          color: #15803d;
          border: 1px solid rgba(34, 197, 94, 0.25);
        }
        .auth-badge.lead {
          background: rgba(234, 179, 8, 0.08);
          color: #b45309;
          border: 1px solid rgba(234, 179, 8, 0.25);
        }
        .action-btns-group {
          display: flex;
          gap: 6px;
        }
        .tbl-btn {
          border: none;
          padding: 6px 12px;
          border-radius: 6px;
          cursor: pointer;
          font-size: 0.75rem;
          font-weight: 600;
          transition: var(--transition-fast);
          white-space: nowrap;
        }
        .tbl-btn.view {
          background: rgba(168, 85, 247, 0.08);
          color: #6d28d9;
          border: 1px solid rgba(168, 85, 247, 0.25);
        }
        .tbl-btn.view:hover { background: #7c3aed; color: #fff; }
        .tbl-btn.danger {
          background: rgba(239, 68, 68, 0.08);
          color: #b91c1c;
          border: 1px solid rgba(239, 68, 68, 0.2);
        }
        .tbl-btn.danger:hover { background: #b91c1c; color: #fff; }
        .empty-cell {
          text-align: center;
          padding: 32px;
          color: hsl(var(--text-muted));
        }
        .pagination-bar {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 16px 20px;
          border-top: 1px solid rgba(0,0,0,0.06);
          flex-wrap: wrap;
          gap: 12px;
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
          border: 1px solid rgba(0,0,0,0.08);
          padding: 6px 12px;
          border-radius: 6px;
          font-size: 0.8rem;
          font-weight: 600;
          color: hsl(var(--text-muted));
          cursor: pointer;
          transition: var(--transition-fast);
          min-width: 36px;
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
        .modal-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0,0,0,0.45);
          z-index: 1000;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 24px;
        }
        .modal-panel {
          background: #FAF9F6;
          border-radius: 16px;
          width: 100%;
          max-width: 720px;
          max-height: 90vh;
          overflow-y: auto;
          box-shadow: 0 20px 60px rgba(0,0,0,0.2);
        }
        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          padding: 24px 24px 0;
          position: sticky;
          top: 0;
          background: #FAF9F6;
          z-index: 1;
        }
        .modal-header h3 {
          font-size: 1.3rem;
          color: #4c1d95;
          margin-bottom: 2px;
        }
        .modal-subtitle {
          font-size: 0.85rem;
          color: hsl(var(--text-muted));
        }
        .modal-close {
          background: transparent;
          border: none;
          font-size: 1.2rem;
          cursor: pointer;
          color: hsl(var(--text-muted));
          padding: 4px 8px;
        }
        .modal-body {
          padding: 20px 24px 24px;
        }
        .profile-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
          gap: 14px;
          margin-bottom: 20px;
        }
        .profile-field {
          display: flex;
          flex-direction: column;
          gap: 3px;
          font-size: 0.88rem;
        }
        .profile-field strong {
          color: #64748b;
          font-size: 0.72rem;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }
        .profile-field .highlight { color: #7c3aed; font-weight: 700; }
        .auth-yes { color: #15803d; font-weight: 600; }
        .auth-no { color: #b45309; font-weight: 600; }
        .answers-section, .report-section {
          background: #fff;
          border: 1px solid rgba(0,0,0,0.06);
          border-radius: 12px;
          padding: 16px;
          margin-bottom: 16px;
        }
        .section-title {
          font-size: 0.95rem;
          color: #4c1d95;
          margin-bottom: 12px;
          font-weight: 700;
        }
        .flex-between {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .answers-list { display: flex; flex-direction: column; gap: 12px; }
        .answer-item {
          border-bottom: 1px solid rgba(0,0,0,0.04);
          padding-bottom: 10px;
        }
        .answer-item:last-child { border-bottom: none; padding-bottom: 0; }
        .answer-q { font-weight: 600; color: #1e293b; margin-bottom: 4px; font-size: 0.9rem; }
        .q-number { color: #7c3aed; }
        .answer-a { font-size: 0.85rem; color: hsl(var(--text-muted)); }
        .no-answers { color: hsl(var(--text-muted)); font-style: italic; font-size: 0.88rem; }
        .report-badge {
          font-size: 0.78rem;
          padding: 3px 8px;
          border-radius: 6px;
          font-weight: 700;
        }
        .report-badge.sent { background: rgba(34,197,94,0.08); color: #15803d; }
        .report-badge.pending { background: rgba(239,68,68,0.08); color: #b91c1c; }
        .sent-preview {
          background: rgba(168,85,247,0.03);
          border: 1px solid rgba(168,85,247,0.15);
          border-radius: 8px;
          padding: 12px;
          margin-bottom: 12px;
          font-size: 0.85rem;
        }
        .sent-preview pre {
          white-space: pre-wrap;
          font-family: inherit;
          margin: 6px 0 0;
          color: #334155;
        }
        .chakra-sliders-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
          gap: 10px;
          margin-bottom: 14px;
        }
        .chakra-field label {
          font-size: 0.72rem;
          text-transform: uppercase;
          color: #64748b;
          font-weight: 600;
        }
        .chakra-range { accent-color: #7c3aed; width: 100%; }
        .report-field {
          display: flex;
          flex-direction: column;
          gap: 6px;
          margin-bottom: 12px;
        }
        .report-field label {
          font-size: 0.72rem;
          text-transform: uppercase;
          color: #64748b;
          font-weight: 600;
        }
        .report-textarea {
          width: 100%;
          padding: 12px;
          border: 1px solid rgba(0,0,0,0.1);
          border-radius: 8px;
          font-size: 0.88rem;
          resize: vertical;
          font-family: inherit;
        }
        .status-msg {
          padding: 10px 14px;
          border-radius: 8px;
          font-size: 0.85rem;
          margin-bottom: 12px;
        }
        .status-msg.success {
          background: rgba(34,197,94,0.08);
          border: 1px solid rgba(34,197,94,0.2);
          color: #15803d;
        }
        .status-msg.error {
          background: rgba(239,68,68,0.08);
          border: 1px solid rgba(239,68,68,0.2);
          color: #b91c1c;
        }
        .send-report-btn {
          background: linear-gradient(135deg, #7c3aed 0%, #4c1d95 100%);
          color: #fff;
          border: none;
          padding: 12px 24px;
          font-size: 0.88rem;
          font-weight: 600;
          border-radius: 8px;
          cursor: pointer;
          width: fit-content;
          align-self: flex-end;
          display: block;
          margin-left: auto;
        }
        .send-report-btn:disabled { opacity: 0.6; cursor: not-allowed; }
        @media (max-width: 768px) {
          .filters-row { flex-direction: column; align-items: stretch; }
          .search-input { width: 100%; }
          .dashboard-header-row { flex-direction: column; gap: 12px; align-items: flex-start; }
        }
      `}</style>
    </div>
  );
}
