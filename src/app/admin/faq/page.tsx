"use client";

import React, { useState, useEffect } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { FAQItem } from "@/types/database";
import StatsDashboard from "@/components/admin/StatsDashboard";

const PAGE_SIZE = 10;

export default function AdminFAQPage() {
  const [faqs, setFaqs] = useState<FAQItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);

  // Form states
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [verified, setVerified] = useState(true);
  const [isPublished, setIsPublished] = useState(true);

  // Modal, search, pagination state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  const loadFaqs = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/faq");
      const json = await res.json();
      if (json.success) {
        setFaqs(json.data);
        setCurrentPage(1); // Reset page on refresh/load
      }
    } catch (err) {
      console.error("Error loading FAQs:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFaqs();
  }, []);

  const resetForm = () => {
    setQuestion("");
    setAnswer("");
    setVerified(true);
    setIsPublished(true);
    setEditMode(false);
    setEditId(null);
    setIsModalOpen(false);
  };

  const handleOpenCreate = () => {
    setEditMode(false);
    setEditId(null);
    setQuestion("");
    setAnswer("");
    setVerified(true);
    setIsPublished(true);
    setIsModalOpen(true);
  };

  const handleEdit = (faq: FAQItem) => {
    setEditMode(true);
    setEditId(faq.id);
    setQuestion(faq.question);
    setAnswer(faq.answer);
    setVerified(faq.verified);
    setIsPublished(faq.isPublished);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!question.trim() || !answer.trim()) {
      alert("Question and answer are required.");
      return;
    }

    const payload = {
      question: question.trim(),
      answer: answer.trim(),
      verified,
      isPublished,
    };

    try {
      const res = await fetch("/api/faq", {
        method: editMode && editId ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editMode && editId ? { id: editId, ...payload } : payload),
      });
      const json = await res.json();
      if (json.success) {
        alert(editMode ? "FAQ updated successfully!" : "FAQ created successfully!");
        resetForm();
        loadFaqs();
      } else {
        alert(json.error || "Operation failed.");
      }
    } catch (err) {
      console.error(err);
      alert("Something went wrong. Please try again.");
    }
  };

  const handleDelete = async (id: string, faqQuestion: string) => {
    const truncatedQ = faqQuestion.length > 50 ? faqQuestion.substring(0, 50) + "..." : faqQuestion;
    if (!confirm(`Delete FAQ: "${truncatedQ}"?`)) return;
    try {
      const res = await fetch(`/api/faq?id=${encodeURIComponent(id)}`, { method: "DELETE" });
      const json = await res.json();
      if (json.success) {
        if (editId === id) resetForm();
        loadFaqs();
      } else {
        alert(json.error || "Failed to delete FAQ.");
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Filter FAQs based on search query
  const filteredFaqs = faqs.filter(
    (faq) =>
      faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Pagination calculation
  const totalPages = Math.ceil(filteredFaqs.length / PAGE_SIZE) || 1;
  const safePage = Math.min(currentPage, totalPages);
  const paginatedFaqs = filteredFaqs.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  return (
    <div className="dashboard-content">
      <StatsDashboard
        pageType="faq"
        actions={
          <div className="header-actions">
            <button type="button" className="sync-btn" onClick={loadFaqs}>
              Refresh FAQs
            </button>
            <Button variant="gold" onClick={handleOpenCreate}>
              + New FAQ
            </Button>
          </div>
        }
      />


      <div className="admin-full-layout">
        <Card variant="glass" className="admin-table-card">
          <div className="table-header-bar" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "16px", flexWrap: "wrap" }}>
            <h3 className="column-title" style={{ margin: 0 }}>FAQs Index ({filteredFaqs.length})</h3>
            <div className="table-search-box">
              <input
                type="text"
                placeholder="Search FAQs..."
                className="glass-input"
                style={{ maxWidth: "260px", padding: "8px 12px", fontSize: "0.85rem" }}
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
              />
            </div>
          </div>
          
          {loading ? (
            <p className="admin-loading" style={{ padding: "40px", textAlign: "center" }}>Loading FAQs...</p>
          ) : (
            <>
              <div className="table-wrapper">
                {filteredFaqs.length === 0 ? (
                  <div className="empty-state-padding" style={{ padding: "40px", textAlign: "center" }}>
                    <p className="empty-list-msg">No FAQs found. Click &quot;+ New FAQ&quot; to create one.</p>
                  </div>
                ) : (
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th style={{ width: "35%" }}>Question</th>
                        <th style={{ width: "35%" }}>Answer</th>
                        <th style={{ width: "10%" }}>Verified</th>
                        <th style={{ width: "10%" }}>Status</th>
                        <th style={{ textAlign: "right", width: "10%" }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paginatedFaqs.map((faq) => (
                        <tr key={faq.id}>
                          <td>
                            <strong style={{ color: "#4c1d95" }}>{faq.question}</strong>
                          </td>
                          <td>
                            <div className="term-def-cell" title={faq.answer} style={{ maxWidth: "420px" }}>
                              {faq.answer}
                            </div>
                          </td>
                          <td>
                            {faq.verified ? (
                              <span style={{ color: "#10b981", fontWeight: "bold", fontSize: "0.8rem" }}>✓ Yes</span>
                            ) : (
                              <span style={{ color: "#9ca3af", fontSize: "0.8rem" }}>No</span>
                            )}
                          </td>
                          <td>
                            {faq.isPublished ? (
                              <span className="category-badge" style={{ background: "rgba(16, 185, 129, 0.06)", borderColor: "rgba(16, 185, 129, 0.2)", color: "#10b981" }}>Published</span>
                            ) : (
                              <span className="category-badge" style={{ background: "rgba(239, 68, 68, 0.06)", borderColor: "rgba(239, 68, 68, 0.2)", color: "#ef4444" }}>Draft</span>
                            )}
                          </td>
                          <td>
                            <div className="action-btns-row">
                              <button
                                type="button"
                                className="edit-row-btn"
                                onClick={() => handleEdit(faq)}
                              >
                                Edit
                              </button>
                              <button
                                type="button"
                                className="delete-row-btn"
                                onClick={() => handleDelete(faq.id, faq.question)}
                              >
                                Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>

              {filteredFaqs.length > 0 && (
                <div className="admin-pagination-wrapper" style={{ padding: "20px 24px", display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid rgba(168, 85, 247, 0.08)" }}>
                  <span className="pagination-info">
                    Showing {(safePage - 1) * PAGE_SIZE + 1} to {Math.min(safePage * PAGE_SIZE, filteredFaqs.length)} of {filteredFaqs.length} entries
                  </span>
                  <ul className="admin-pagination" style={{ display: "flex", listStyle: "none", gap: "4px", margin: 0, padding: 0 }}>
                    <li className={`page-item ${safePage === 1 ? 'disabled' : ''}`}>
                      <button onClick={() => setCurrentPage(1)} disabled={safePage === 1}>«</button>
                    </li>
                    <li className={`page-item ${safePage === 1 ? 'disabled' : ''}`}>
                      <button onClick={() => setCurrentPage((p) => Math.max(1, p - 1))} disabled={safePage === 1}>Prev</button>
                    </li>
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                      <li key={page} className={`page-item ${page === safePage ? 'active' : ''}`}>
                        <button onClick={() => setCurrentPage(page)}>{page}</button>
                      </li>
                    ))}
                    <li className={`page-item ${safePage === totalPages ? 'disabled' : ''}`}>
                      <button onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))} disabled={safePage === totalPages}>Next</button>
                    </li>
                    <li className={`page-item ${safePage === totalPages ? 'disabled' : ''}`}>
                      <button onClick={() => setCurrentPage(totalPages)} disabled={safePage === totalPages}>»</button>
                    </li>
                  </ul>
                </div>
              )}
            </>
          )}
        </Card>
      </div>

      {/* Slide / Popup Modal Form */}
      {isModalOpen && (
        <div className="modal-overlay" onClick={resetForm}>
          <div className="modal-content-wrapper" onClick={(e) => e.stopPropagation()}>
            <Card variant="glass" className="modal-inner-card">
              <h3 className="modal-title-bar">
                {editMode ? "Edit FAQ" : "Create FAQ"}
              </h3>
              <form onSubmit={handleSubmit} className="admin-catalog-form">
                <div className="modal-form-scroll">
                  <div className="form-group">
                    <label>Question *</label>
                    <textarea
                      className="glass-input textarea-input"
                      required
                      rows={3}
                      placeholder="Enter the question..."
                      value={question}
                      onChange={(e) => setQuestion(e.target.value)}
                    />
                  </div>

                  <div className="form-group">
                    <label>Answer *</label>
                    <textarea
                      className="glass-input textarea-input"
                      required
                      rows={6}
                      placeholder="Enter the answer..."
                      value={answer}
                      onChange={(e) => setAnswer(e.target.value)}
                    />
                  </div>

                  <div className="form-group" style={{ flexDirection: "row", alignItems: "center", gap: "8px", marginTop: "8px" }}>
                    <input
                      type="checkbox"
                      id="verified-checkbox"
                      checked={verified}
                      onChange={(e) => setVerified(e.target.checked)}
                      style={{ width: "16px", height: "16px", accentColor: "#7c3aed" }}
                    />
                    <label htmlFor="verified-checkbox" style={{ textTransform: "none", cursor: "pointer", fontSize: "0.85rem", margin: 0 }}>
                      Expert Verified Answer
                    </label>
                  </div>

                  <div className="form-group" style={{ flexDirection: "row", alignItems: "center", gap: "8px", marginTop: "8px" }}>
                    <input
                      type="checkbox"
                      id="published-checkbox"
                      checked={isPublished}
                      onChange={(e) => setIsPublished(e.target.checked)}
                      style={{ width: "16px", height: "16px", accentColor: "#7c3aed" }}
                    />
                    <label htmlFor="published-checkbox" style={{ textTransform: "none", cursor: "pointer", fontSize: "0.85rem", margin: 0 }}>
                      Is Published (Visible to public)
                    </label>
                  </div>
                </div>

                <div className="modal-form-footer">
                  <button type="button" className="modal-cancel-btn" onClick={resetForm}>
                    Cancel
                  </button>
                  <Button variant="gold" type="submit" className="flex-1">
                    {editMode ? "Update FAQ" : "Create FAQ"}
                  </Button>
                </div>
              </form>
            </Card>
          </div>
        </div>
      )}

      <style jsx>{`
        .dashboard-content {
          display: flex;
          flex-direction: column;
          gap: 32px;
        }
        .dashboard-header-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 16px;
        }
        .dashboard-header-row h2 {
          font-family: var(--font-serif);
          color: #4c1d95;
          font-size: 1.8rem;
        }
        .header-actions {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .sync-btn {
          background: rgba(0, 0, 0, 0.02);
          border: 1px solid rgba(0, 0, 0, 0.08);
          color: hsl(var(--text-cream));
          padding: 10px 18px;
          border-radius: 8px;
          cursor: pointer;
          font-size: 0.85rem;
          font-weight: 600;
        }
        .sync-btn:hover {
          background: rgba(168, 85, 247, 0.08);
          border-color: #7c3aed;
          color: #7c3aed;
        }
        .admin-full-layout {
          width: 100%;
        }
        :global(.admin-table-card) {
          padding: 0 !important;
          overflow: hidden;
        }
        .table-header-bar {
          padding: 24px 24px 12px;
          border-bottom: 1px solid rgba(168, 85, 247, 0.08);
        }
        .column-title {
          font-family: var(--font-serif);
          font-size: 1.35rem;
          color: #4c1d95;
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
          background: rgba(168, 85, 247, 0.03);
          border-bottom: 1px solid rgba(168, 85, 247, 0.08);
          padding: 16px 24px;
          font-weight: 600;
          text-transform: uppercase;
          font-size: 0.72rem;
          color: #4c1d95;
          letter-spacing: 0.05em;
          white-space: nowrap;
        }
        .admin-table td {
          border-bottom: 1px solid rgba(0, 0, 0, 0.04);
          padding: 16px 24px;
          vertical-align: middle;
        }
        .admin-table tbody tr:hover {
          background: rgba(168, 85, 247, 0.01);
        }
        .admin-table tbody tr:last-child td {
          border-bottom: none;
        }
        .category-badge {
          font-size: 0.7rem;
          font-weight: 700;
          padding: 4px 10px;
          border-radius: 6px;
          text-transform: uppercase;
          white-space: nowrap;
          border: 1px solid;
          display: inline-block;
        }
        .term-def-cell {
          font-size: 0.85rem;
          color: hsl(var(--text-muted));
          line-height: 1.5;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        .action-btns-row {
          display: flex;
          gap: 8px;
          justify-content: flex-end;
        }
        .edit-row-btn,
        .delete-row-btn {
          padding: 6px 12px;
          border-radius: 6px;
          font-size: 0.75rem;
          font-weight: 600;
          cursor: pointer;
          border: none;
          transition: var(--transition-fast);
        }
        .edit-row-btn {
          background: rgba(124, 58, 237, 0.06);
          border: 1px solid rgba(124, 58, 237, 0.25);
          color: #7c3aed;
        }
        .edit-row-btn:hover {
          background: rgba(124, 58, 237, 0.12);
        }
        .delete-row-btn {
          background: transparent;
          border: 1px solid rgba(239, 68, 68, 0.3);
          color: #ef4444;
        }
        .delete-row-btn:hover {
          background: rgba(239, 68, 68, 0.08);
        }

        /* Modal Overlay & Styling */
        .modal-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.45);
          backdrop-filter: blur(8px);
          z-index: 1000;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
        }
        .modal-content-wrapper {
          width: 100%;
          max-width: 580px;
          max-height: 90vh;
          border-radius: 20px;
          overflow: hidden;
        }
        :global(.modal-inner-card) {
          padding: 0 !important;
          display: flex;
          flex-direction: column;
          max-height: 90vh;
        }
        .modal-title-bar {
          padding: 28px 28px 0;
          font-family: var(--font-serif);
          color: #4c1d95;
          font-size: 1.4rem;
        }
        .admin-catalog-form {
          display: flex;
          flex-direction: column;
          flex: 1;
          min-height: 0;
        }
        .modal-form-scroll {
          display: flex;
          flex-direction: column;
          gap: 16px;
          overflow-y: auto;
          padding: 20px 28px 24px;
          flex: 1;
        }
        .modal-form-footer {
          display: flex;
          gap: 12px;
          padding: 16px 28px 24px;
          border-top: 1px solid rgba(0, 0, 0, 0.08);
        }
        .modal-cancel-btn {
          background: transparent;
          border: 1px solid rgba(0, 0, 0, 0.12);
          color: hsl(var(--text-muted));
          padding: 10px 20px;
          border-radius: 8px;
          font-size: 0.85rem;
          font-weight: 600;
          cursor: pointer;
        }
        :global(.flex-1) {
          flex: 1;
        }

        /* Form Controls */
        .form-group {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .form-group label {
          font-size: 0.75rem;
          color: hsl(var(--text-muted));
          text-transform: uppercase;
          letter-spacing: 0.05em;
          font-weight: 600;
        }
        :global(.glass-input) {
          width: 100%;
          padding: 10px 14px;
          border-radius: 10px;
          border: 1px solid rgba(0, 0, 0, 0.1);
          background: rgba(255, 255, 255, 0.8);
          font-size: 0.9rem;
          outline: none;
          font-family: var(--font-sans);
        }
        :global(.glass-input:focus) {
          border-color: #7c3aed;
          box-shadow: 0 0 0 3px rgba(124, 58, 237, 0.1);
        }
        .textarea-input {
          resize: vertical;
        }
      `}</style>
    </div>
  );
}
