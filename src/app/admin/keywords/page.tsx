"use client";

import React, { useState, useEffect, useRef } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Keyword, Category } from "@/types/database";

const CHAKRAS_LIST = [
  { name: "Crown", color: "#a855f7", key: "crown" },
  { name: "Third Eye", color: "#6366f1", key: "thirdeye" },
  { name: "Throat", color: "#06b6d4", key: "throat" },
  { name: "Heart", color: "#22c55e", key: "heart" },
  { name: "Solar Plexus", color: "#eab308", key: "solar" },
  { name: "Sacral", color: "#f97316", key: "sacral" },
  { name: "Root", color: "#ef4444", key: "root" }
];

const chakraKey = (name: string): string => {
  const n = name.toLowerCase();
  if (n.includes("root")) return "root";
  if (n.includes("sacral")) return "sacral";
  if (n.includes("solar")) return "solar";
  if (n.includes("heart")) return "heart";
  if (n.includes("throat")) return "throat";
  if (n.includes("third")) return "thirdeye";
  if (n.includes("crown")) return "crown";
  return "root";
};

export default function AdminKeywordsPage() {
  const [keywords, setKeywords] = useState<Keyword[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Modal & form states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editKeywordId, setEditKeywordId] = useState<string | null>(null);

  const [keywordWord, setKeywordWord] = useState("");
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedChakras, setSelectedChakras] = useState<string[]>([]);

  // UI state for dropdowns
  const [catDropdownOpen, setCatDropdownOpen] = useState(false);
  const [chkDropdownOpen, setChkDropdownOpen] = useState(false);

  const catRef = useRef<HTMLDivElement>(null);
  const chkRef = useRef<HTMLDivElement>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      const [kRes, cRes] = await Promise.all([
        fetch("/api/keywords"),
        fetch("/api/categories")
      ]);
      const kJson = await kRes.json();
      const cJson = await cRes.json();

      if (kJson.success && cJson.success) {
        setKeywords(kJson.data);
        setCategories(cJson.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Click outside to close dropdowns
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (catRef.current && !catRef.current.contains(event.target as Node)) {
        setCatDropdownOpen(false);
      }
      if (chkRef.current && !chkRef.current.contains(event.target as Node)) {
        setChkDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const resetForm = () => {
    setKeywordWord("");
    setSelectedCategories([]);
    setSelectedChakras([]);
    setEditMode(false);
    setEditKeywordId(null);
  };

  const handleOpenCreateModal = () => {
    resetForm();
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (kw: Keyword) => {
    setEditMode(true);
    setEditKeywordId(kw.id);
    setKeywordWord(kw.word);
    setSelectedCategories(kw.categoryIds || []);
    setSelectedChakras(kw.chakras || []);
    setIsModalOpen(true);
  };

  const handleSaveKeyword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!keywordWord.trim()) {
      alert("Please enter a keyword.");
      return;
    }

    const payload = {
      word: keywordWord.trim().toLowerCase(),
      categoryIds: selectedCategories,
      chakras: selectedChakras
    };

    try {
      let res;
      if (editMode && editKeywordId) {
        res = await fetch("/api/keywords", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: editKeywordId, ...payload })
        });
      } else {
        res = await fetch("/api/keywords", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });
      }

      const json = await res.json();
      if (json.success) {
        setIsModalOpen(false);
        resetForm();
        alert(editMode ? "Keyword updated successfully!" : "Keyword created successfully!");
        loadData();
      } else {
        alert("Operation failed: " + json.error);
      }
    } catch (err) {
      console.error(err);
      alert("An error occurred while saving the keyword.");
    }
  };

  const handleDeleteKeyword = async (id: string) => {
    if (!confirm("Are you sure you want to delete this keyword?")) return;
    try {
      const res = await fetch(`/api/keywords?id=${id}`, { method: "DELETE" });
      const json = await res.json();
      if (json.success) {
        loadData();
      } else {
        alert("Failed to delete keyword: " + json.error);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const toggleCategorySelection = (catId: string) => {
    if (selectedCategories.includes(catId)) {
      setSelectedCategories(selectedCategories.filter(id => id !== catId));
    } else {
      setSelectedCategories([...selectedCategories, catId]);
    }
  };

  const toggleChakraSelection = (chakraName: string) => {
    if (selectedChakras.includes(chakraName)) {
      setSelectedChakras(selectedChakras.filter(name => name !== chakraName));
    } else {
      setSelectedChakras([...selectedChakras, chakraName]);
    }
  };

  return (
    <div className="dashboard-content">
      <div className="dashboard-header-row">
        <div>
          <h2>Keywords Resonance Manager</h2>
          <p className="admin-header-desc">
            Create and align search words to specific healing categories and primary chakras.
          </p>
        </div>
        <div className="header-actions">
          <button className="sync-btn" onClick={loadData}>
            🔄 Refresh Keywords
          </button>
          <Button variant="gold" onClick={handleOpenCreateModal}>
            ➕ Add Keyword
          </Button>
        </div>
      </div>

      {loading ? (
        <p className="admin-loading">Loading keywords database...</p>
      ) : (
        <div className="admin-split-layout">
          <div className="split-list-col">
            <h3 className="column-title">Aligned Keywords ({keywords.length})</h3>
            <div className="table-responsive-container">
              <table className="admin-glass-table">
                <thead>
                  <tr>
                    <th>Keyword</th>
                    <th>Linked Categories</th>
                    <th>Linked Chakras</th>
                    <th className="text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {keywords.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="admin-empty-cell">
                        No keywords aligned yet.
                      </td>
                    </tr>
                  ) : (
                    keywords.map(k => (
                      <tr key={k.id}>
                        <td>
                          <span className="keyword-word">“{k.word}”</span>
                        </td>
                        <td>
                          <div className="categories-chips-container">
                            {k.categories && k.categories.length > 0 ? (
                              k.categories.map((cat, idx) => (
                                <span key={idx} className="category-chip">
                                  {cat}
                                </span>
                              ))
                            ) : (
                              <span className="category-chip muted">None</span>
                            )}
                          </div>
                        </td>
                        <td>
                          <div className="chakras-chips-container">
                            {k.chakras && k.chakras.length > 0 ? (
                              k.chakras.map((chk, idx) => (
                                <span 
                                  key={idx} 
                                  className="chakra-chip-badge"
                                  data-chakra={chakraKey(chk)}
                                >
                                  ● {chk}
                                </span>
                              ))
                            ) : (
                              <span className="chakra-chip-badge muted">None</span>
                            )}
                          </div>
                        </td>
                        <td className="text-right">
                          <div className="action-buttons-cell">
                            <button className="edit-row-btn" onClick={() => handleOpenEditModal(k)}>
                              ✎ Edit
                            </button>
                            <button className="delete-row-btn" onClick={() => handleDeleteKeyword(k.id)}>
                              ✕ Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Add/Edit Keyword Modal */}
      {isModalOpen && (
        <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div className="modal-content-wrapper" onClick={(e) => e.stopPropagation()}>
            <Card variant="glass" className="modal-inner-card">
              <button className="close-modal-btn" onClick={() => setIsModalOpen(false)}>
                ✕
              </button>
              <h3 className="column-title column-title-spaced">
                {editMode ? "Edit Keyword Alignment" : "Add Aligned Keyword"}
              </h3>
              
              <form onSubmit={handleSaveKeyword} className="admin-catalog-form">
                <div className="form-group">
                  <label>Keyword / Term *</label>
                  <input
                    type="text"
                    className="glass-input"
                    required
                    placeholder="e.g. fatigue, anxious, sad"
                    value={keywordWord}
                    onChange={(e) => setKeywordWord(e.target.value)}
                  />
                </div>

                {/* Categories multi-select dropdown */}
                <div className="form-group" ref={catRef}>
                  <label>Align Categories</label>
                  <div className="dropdown-selector-wrapper">
                    <div 
                      className="dropdown-trigger-box glass-input"
                      onClick={() => setCatDropdownOpen(!catDropdownOpen)}
                    >
                      <div className="selected-categories-preview">
                        {selectedCategories.length === 0 ? (
                          <span className="placeholder-text">Select Categories...</span>
                        ) : (
                          selectedCategories.map(id => {
                            const name = categories.find(c => c.id === id)?.name || id;
                            return (
                              <span 
                                key={id} 
                                className="selected-preview-chip"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleCategorySelection(id);
                                }}
                              >
                                {name} <span className="chip-close-x">×</span>
                              </span>
                            );
                          })
                        )}
                      </div>
                      <span className="dropdown-chevron-arrow">▼</span>
                    </div>

                    {catDropdownOpen && (
                      <div className="dropdown-options-menu glass-panel">
                        {categories.map(cat => {
                          const isSelected = selectedCategories.includes(cat.id);
                          return (
                            <div
                              key={cat.id}
                              className={`dropdown-option-item ${isSelected ? "selected" : ""}`}
                              onClick={() => toggleCategorySelection(cat.id)}
                            >
                              <span className="checkbox-indicator">{isSelected ? "✓" : ""}</span>
                              <span className="option-label">{cat.name}</span>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>

                {/* Chakras multi-select dropdown */}
                <div className="form-group" ref={chkRef}>
                  <label>Align Chakras</label>
                  <div className="dropdown-selector-wrapper">
                    <div 
                      className="dropdown-trigger-box glass-input"
                      onClick={() => setChkDropdownOpen(!chkDropdownOpen)}
                    >
                      <div className="selected-categories-preview">
                        {selectedChakras.length === 0 ? (
                          <span className="placeholder-text">Select Chakras...</span>
                        ) : (
                          selectedChakras.map(name => (
                            <span 
                              key={name} 
                              className="selected-preview-chip chakra-preview-chip"
                              data-chakra={chakraKey(name)}
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleChakraSelection(name);
                              }}
                            >
                              {name} <span className="chip-close-x">×</span>
                            </span>
                          ))
                        )}
                      </div>
                      <span className="dropdown-chevron-arrow">▼</span>
                    </div>

                    {chkDropdownOpen && (
                      <div className="dropdown-options-menu glass-panel">
                        {CHAKRAS_LIST.map(chk => {
                          const isSelected = selectedChakras.includes(chk.name);
                          return (
                            <div
                              key={chk.name}
                              className={`dropdown-option-item ${isSelected ? "selected" : ""}`}
                              onClick={() => toggleChakraSelection(chk.name)}
                            >
                              <span className="checkbox-indicator">{isSelected ? "✓" : ""}</span>
                              <span className="option-label chakra-option-label" data-chakra={chk.key}>
                                ● {chk.name}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>

                <Button variant="gold" type="submit" >
                  {editMode ? "Save Keyword" : "Create Keyword"}
                </Button>
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
        }
        .dashboard-header-row h2 {
          font-family: var(--font-serif);
          color: #4c1d95;
          font-size: 1.8rem;
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
        .admin-split-layout {
          display: flex;
          flex-direction: column;
          gap: 32px;
        }
        .header-actions {
          display: flex;
          gap: 12px;
          align-items: center;
        }
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.45);
          backdrop-filter: blur(8px);
          z-index: 1000;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
          animation: fadeIn 0.25s ease-out;
        }
        .modal-content-wrapper {
          width: 100%;
          max-width: 520px;
          max-height: 90vh;
          overflow-y: auto;
          border-radius: 20px;
          box-shadow: 0 20px 50px rgba(0,0,0,0.15);
          animation: scaleUp 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        }
        :global(.modal-inner-card) {
          padding: 32px !important;
          position: relative !important;
        }
        .close-modal-btn {
          position: absolute;
          top: 20px;
          right: 20px;
          background: transparent;
          border: none;
          color: hsl(var(--text-muted));
          font-size: 1.2rem;
          cursor: pointer;
          transition: var(--transition-fast);
          z-index: 10;
        }
        .close-modal-btn:hover {
          color: #ef4444;
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes scaleUp {
          from { transform: scale(0.95); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
        .split-list-col {
          display: flex;
          flex-direction: column;
          gap: 16px;
          min-width: 0;
        }
        .column-title {
          font-family: var(--font-serif);
          font-size: 1.35rem;
          color: #4c1d95;
        }
        .table-responsive-container {
          width: 100%;
          overflow-x: auto;
          background: rgba(255, 255, 255, 0.95);
          backdrop-filter: blur(8px);
          border: 1px solid rgba(0, 0, 0, 0.05);
          border-radius: 16px;
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.03);
        }
        .admin-glass-table {
          width: 100%;
          border-collapse: collapse;
          text-align: left;
        }
        .admin-glass-table th {
          padding: 16px 20px;
          font-size: 0.75rem;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: hsl(var(--text-muted));
          border-bottom: 1px solid rgba(0, 0, 0, 0.08);
          background: rgba(0, 0, 0, 0.01);
        }
        .admin-glass-table td {
          padding: 16px 20px;
          font-size: 0.9rem;
          color: hsl(var(--text-cream));
          border-bottom: 1px solid rgba(0, 0, 0, 0.05);
          vertical-align: middle;
        }
        .admin-glass-table tbody tr {
          transition: var(--transition-fast);
        }
        .admin-glass-table tbody tr:hover {
          background: rgba(0, 0, 0, 0.02);
        }
        .admin-glass-table tbody tr:last-child td {
          border-bottom: none;
        }
        .keyword-word {
          font-weight: 700;
          font-size: 1.05rem;
          color: #1e1b4b;
        }
        .categories-chips-container {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
          max-width: 250px;
        }
        .category-chip {
          background: rgba(16, 185, 129, 0.08);
          border: 1px solid rgba(16, 185, 129, 0.2);
          color: #065f46;
          padding: 3px 8px;
          border-radius: 99px;
          font-size: 0.75rem;
          font-weight: 500;
          white-space: nowrap;
        }
        .category-chip.muted {
          background: rgba(0, 0, 0, 0.04);
          border-color: rgba(0, 0, 0, 0.08);
          color: hsl(var(--text-muted));
        }
        .chakras-chips-container {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
          max-width: 250px;
        }
        .chakra-chip-badge {
          border: 1px solid;
          padding: 3px 10px;
          border-radius: 99px;
          font-size: 0.75rem;
          font-weight: 600;
          white-space: nowrap;
        }
        .chakra-chip-badge.muted {
          border-color: rgba(0, 0, 0, 0.08);
          color: hsl(var(--text-muted));
          background: rgba(0, 0, 0, 0.04);
        }
        .action-buttons-cell {
          display: flex;
          gap: 8px;
          justify-content: flex-end;
        }
        .edit-row-btn {
          background: transparent;
          border: 1px solid rgba(124, 58, 237, 0.3);
          color: #6d28d9;
          padding: 6px 12px;
          border-radius: 6px;
          cursor: pointer;
          font-size: 0.75rem;
          font-weight: 600;
          transition: var(--transition-fast);
        }
        .edit-row-btn:hover {
          background: rgba(124, 58, 237, 0.08);
        }
        .delete-row-btn {
          background: transparent;
          border: 1px solid rgba(239, 68, 68, 0.3);
          color: #ef4444;
          padding: 6px 12px;
          border-radius: 6px;
          cursor: pointer;
          font-size: 0.75rem;
          font-weight: 600;
          transition: var(--transition-fast);
        }
        .delete-row-btn:hover {
          background: rgba(239, 68, 68, 0.08);
        }
        .admin-catalog-form {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }
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
        
        /* Dropdown Multi-Select UI Styles */
        .dropdown-selector-wrapper {
          position: relative;
          width: 100%;
        }
        .dropdown-trigger-box {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 10px 16px;
          cursor: pointer;
          min-height: 44px;
        }
        .selected-categories-preview {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
        }
        .placeholder-text {
          color: rgba(0, 0, 0, 0.35);
        }
        .selected-preview-chip {
          background: #7c3aed;
          color: #ffffff;
          padding: 2px 10px;
          border-radius: 99px;
          font-size: 0.78rem;
          font-weight: 600;
          display: inline-flex;
          align-items: center;
          gap: 6px;
        }
        .chip-close-x {
          font-size: 1rem;
          cursor: pointer;
          opacity: 0.8;
        }
        .chip-close-x:hover {
          opacity: 1;
        }
        .dropdown-chevron-arrow {
          font-size: 0.65rem;
          color: hsl(var(--text-muted));
        }
        .dropdown-options-menu {
          position: absolute;
          top: 105%;
          left: 0;
          right: 0;
          z-index: 100;
          border: 1px solid rgba(0,0,0,0.08);
          border-radius: 12px;
          background: rgba(255, 255, 255, 0.98);
          box-shadow: 0 10px 30px rgba(0,0,0,0.08);
          overflow: hidden;
          padding: 6px 0;
        }
        .dropdown-option-item {
          display: flex;
          align-items: center;
          padding: 10px 16px;
          cursor: pointer;
          transition: var(--transition-fast);
          font-size: 0.9rem;
          color: #1e293b;
        }
        .dropdown-option-item:hover {
          background: rgba(168, 85, 247, 0.05);
          color: #7c3aed;
        }
        .dropdown-option-item.selected {
          font-weight: 600;
          color: #6d28d9;
          background: rgba(168, 85, 247, 0.08);
        }
        .checkbox-indicator {
          width: 18px;
          font-weight: 700;
          color: #7c3aed;
          margin-right: 8px;
        }
      `}</style>
    </div>
  );
}
