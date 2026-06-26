"use client";

import React, { useState, useEffect } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { GlossaryTerm, GlossaryIllustration } from "@/types/database";

const ILLUSTRATION_OPTIONS: { value: GlossaryIllustration; label: string }[] = [
  { value: null, label: "None" },
  { value: "aura-chart", label: "Aura Layer Mapping" },
  { value: "chakra-system", label: "Chakra System Diagram" },
];

const PAGE_SIZE = 10; // Better for full width view

export default function AdminGlossaryPage() {
  const [terms, setTerms] = useState<GlossaryTerm[]>([]);
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);

  // Form states
  const [word, setWord] = useState("");
  const [phonetic, setPhonetic] = useState("");
  const [category, setCategory] = useState("");
  const [definition, setDefinition] = useState("");
  const [illustration, setIllustration] = useState<GlossaryIllustration>(null);

  // Modal and pagination state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  const loadTerms = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/glossary");
      const json = await res.json();
      if (json.success) {
        setTerms(json.data);
        setCurrentPage(1); // Reset page on refresh/load
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTerms();
  }, []);

  const resetForm = () => {
    setWord("");
    setPhonetic("");
    setCategory("");
    setDefinition("");
    setIllustration(null);
    setEditMode(false);
    setEditId(null);
    setIsModalOpen(false);
  };

  const handleOpenCreate = () => {
    setEditMode(false);
    setEditId(null);
    setWord("");
    setPhonetic("");
    setCategory("");
    setDefinition("");
    setIllustration(null);
    setIsModalOpen(true);
  };

  const handleEdit = (term: GlossaryTerm) => {
    setEditMode(true);
    setEditId(term.id);
    setWord(term.word);
    setPhonetic(term.phonetic);
    setCategory(term.category);
    setDefinition(term.definition);
    setIllustration(term.illustration ?? null);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!word.trim() || !definition.trim()) {
      alert("Word and definition are required.");
      return;
    }

    const payload = {
      word: word.trim(),
      phonetic: phonetic.trim(),
      category: category.trim(),
      definition: definition.trim(),
      illustration,
    };

    try {
      const res = await fetch("/api/glossary", {
        method: editMode && editId ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editMode && editId ? { id: editId, ...payload } : payload),
      });
      const json = await res.json();
      if (json.success) {
        alert(editMode ? "Term updated successfully!" : "Term created successfully!");
        resetForm();
        loadTerms();
      } else {
        alert(json.error || "Operation failed.");
      }
    } catch (err) {
      console.error(err);
      alert("Something went wrong. Please try again.");
    }
  };

  const handleDelete = async (id: string, termWord: string) => {
    if (!confirm(`Delete glossary term "${termWord}"?`)) return;
    try {
      const res = await fetch(`/api/glossary?id=${encodeURIComponent(id)}`, { method: "DELETE" });
      const json = await res.json();
      if (json.success) {
        if (editId === id) resetForm();
        loadTerms();
      } else {
        alert(json.error || "Failed to delete term.");
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Pagination calculation
  const totalPages = Math.ceil(terms.length / PAGE_SIZE) || 1;
  const safePage = Math.min(currentPage, totalPages);
  const paginatedTerms = terms.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  return (
    <div className="dashboard-content">
      <div className="dashboard-header-row">
        <div>
          <h2>Glossary Manager</h2>
          <p className="admin-header-desc">
            Add, edit, or remove metaphysical glossary terms shown on the public glossary page.
          </p>
        </div>
        <div className="header-actions">
          <button type="button" className="sync-btn" onClick={loadTerms}>
            Refresh Terms
          </button>
          <Button variant="gold" onClick={handleOpenCreate}>
            + New Term
          </Button>
        </div>
      </div>

      {loading ? (
        <p className="admin-loading">Loading glossary terms...</p>
      ) : (
        <div className="admin-full-layout">
          <Card variant="glass" className="admin-table-card">
            <div className="table-header-bar">
              <h3 className="column-title">Terms Index ({terms.length})</h3>
            </div>
            
            <div className="table-wrapper">
              {terms.length === 0 ? (
                <div className="empty-state-padding">
                  <p className="empty-list-msg">No glossary terms found. Click &quot;+ New Term&quot; to create one.</p>
                </div>
              ) : (
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Term</th>
                      <th>Category</th>
                      <th>Definition</th>
                      <th>Illustration</th>
                      <th style={{ textAlign: "right" }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedTerms.map((term) => (
                      <tr key={term.id}>
                        <td>
                          <div className="term-word-cell">
                            <strong>{term.word}</strong>
                            {term.phonetic && <span className="phonetic-sub">{term.phonetic}</span>}
                          </div>
                        </td>
                        <td>
                          {term.category ? (
                            <span className="category-badge">{term.category}</span>
                          ) : (
                            <span className="term-meta-uncategorized">None</span>
                          )}
                        </td>
                        <td>
                          <div className="term-def-cell" title={term.definition}>
                            {term.definition}
                          </div>
                        </td>
                        <td>
                          {term.illustration ? (
                            <span className="illustration-badge">{term.illustration}</span>
                          ) : (
                            <span className="illustration-none">—</span>
                          )}
                        </td>
                        <td>
                          <div className="action-btns-row">
                            <button
                              type="button"
                              className="edit-row-btn"
                              onClick={() => handleEdit(term)}
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              className="delete-row-btn"
                              onClick={() => handleDelete(term.id, term.word)}
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

            {terms.length > 0 && (
              <div className="pagination-bar">
                <span className="pagination-info">
                  Showing {(safePage - 1) * PAGE_SIZE + 1}–{Math.min(safePage * PAGE_SIZE, terms.length)} of {terms.length}
                </span>
                <div className="pagination-controls">
                  <button
                    type="button"
                    className="page-btn"
                    disabled={safePage <= 1}
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  >
                    ← Prev
                  </button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                    <button
                      key={page}
                      type="button"
                      className={`page-btn ${page === safePage ? "active" : ""}`}
                      onClick={() => setCurrentPage(page)}
                    >
                      {page}
                    </button>
                  ))}
                  <button
                    type="button"
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
        </div>
      )}

      {/* Slide / Popup Modal Form */}
      {isModalOpen && (
        <div className="modal-overlay" onClick={resetForm}>
          <div className="modal-content-wrapper" onClick={(e) => e.stopPropagation()}>
            <Card variant="glass" className="modal-inner-card">
              <h3 className="modal-title-bar">
                {editMode ? "Edit Glossary Term" : "Create Glossary Term"}
              </h3>
              <form onSubmit={handleSubmit} className="admin-catalog-form">
                <div className="modal-form-scroll">
                  <div className="form-group">
                    <label>Term *</label>
                    <input
                      type="text"
                      className="glass-input"
                      required
                      placeholder="e.g. Aura"
                      value={word}
                      onChange={(e) => setWord(e.target.value)}
                    />
                  </div>

                  <div className="form-group">
                    <label>Phonetic</label>
                    <input
                      type="text"
                      className="glass-input"
                      placeholder="e.g. /ˈɔːrə/"
                      value={phonetic}
                      onChange={(e) => setPhonetic(e.target.value)}
                    />
                  </div>

                  <div className="form-group">
                    <label>Category</label>
                    <input
                      type="text"
                      className="glass-input"
                      placeholder="e.g. Bio-Energy"
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                    />
                  </div>

                  <div className="form-group">
                    <label>Definition *</label>
                    <textarea
                      className="glass-input textarea-input"
                      required
                      rows={5}
                      placeholder="Full definition text..."
                      value={definition}
                      onChange={(e) => setDefinition(e.target.value)}
                    />
                  </div>

                  <div className="form-group">
                    <label>Illustration</label>
                    <select
                      className="glass-input"
                      value={illustration ?? ""}
                      onChange={(e) =>
                        setIllustration(
                          e.target.value === "" ? null : (e.target.value as GlossaryIllustration)
                        )
                      }
                    >
                      {ILLUSTRATION_OPTIONS.map((opt) => (
                        <option key={opt.label} value={opt.value ?? ""}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="modal-form-footer">
                  <button type="button" className="modal-cancel-btn" onClick={resetForm}>
                    Cancel
                  </button>
                  <Button variant="gold" type="submit" className="flex-1">
                    {editMode ? "Update Term" : "Create Term"}
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
        .term-word-cell {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }
        .term-word-cell strong {
          color: #4c1d95;
          font-size: 1rem;
        }
        .phonetic-sub {
          font-size: 0.78rem;
          color: hsl(var(--text-muted));
          font-family: var(--font-sans);
          font-style: italic;
        }
        .category-badge {
          background: rgba(13, 148, 136, 0.06);
          border: 1px solid rgba(13, 148, 136, 0.2);
          color: #0d9488;
          font-size: 0.7rem;
          font-weight: 700;
          padding: 4px 10px;
          border-radius: 6px;
          text-transform: uppercase;
          white-space: nowrap;
        }
        .term-meta-uncategorized {
          font-size: 0.78rem;
          color: hsl(var(--text-muted));
          font-style: italic;
        }
        .term-def-cell {
          font-size: 0.85rem;
          color: hsl(var(--text-muted));
          line-height: 1.5;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
          max-width: 480px;
        }
        .illustration-badge {
          background: rgba(168, 85, 247, 0.06);
          border: 1px solid rgba(168, 85, 247, 0.2);
          color: #7c3aed;
          font-size: 0.7rem;
          font-weight: 700;
          padding: 4px 10px;
          border-radius: 6px;
          text-transform: uppercase;
          white-space: nowrap;
        }
        .illustration-none {
          color: hsl(var(--text-muted));
          font-size: 0.85rem;
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
        .pagination-bar {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 20px 24px;
          border-top: 1px solid rgba(168, 85, 247, 0.08);
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
          border: 1px solid rgba(0, 0, 0, 0.08);
          padding: 6px 12px;
          border-radius: 6px;
          font-size: 0.8rem;
          font-weight: 600;
          color: hsl(var(--text-muted));
          cursor: pointer;
          transition: var(--transition-fast);
          min-width: 32px;
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
          min-height: 110px;
        }
        .empty-state-padding {
          padding: 48px;
          text-align: center;
        }
        .empty-list-msg {
          color: hsl(var(--text-muted));
          font-size: 0.95rem;
        }
      `}</style>
    </div>
  );
}
