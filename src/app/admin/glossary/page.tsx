"use client";

import React, { useState, useEffect, useRef } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { GlossaryTerm, GlossaryIllustration, GlossaryCategory } from "@/types/database";
import { ImageCropperModal } from "@/components/ui/ImageCropperModal";
import StatsDashboard from "@/components/admin/StatsDashboard";

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

  // Tab & Category states
  const [activeTab, setActiveTab] = useState<"terms" | "categories">("terms");
  const [categories, setCategories] = useState<GlossaryCategory[]>([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);

  // Category form states
  const [categoryName, setCategoryName] = useState("");
  const [editCategoryMode, setEditCategoryMode] = useState(false);
  const [editCategoryId, setEditCategoryId] = useState<string | null>(null);

  // Form states
  const [word, setWord] = useState("");
  const [phonetic, setPhonetic] = useState("");
  const [category, setCategory] = useState("");
  const [definition, setDefinition] = useState("");
  const [illustration, setIllustration] = useState("");
  const [cropImageSrc, setCropImageSrc] = useState<string | null>(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  // Modal and pagination state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");

  const definitionRef = useRef<HTMLTextAreaElement>(null);

  const insertLink = () => {
    const url = prompt("Enter link URL:");
    if (!url) return;
    const textarea = definitionRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = definition.substring(start, end) || "link text";
    const linkHTML = `<a href="${url}" target="_blank" rel="noopener noreferrer">${selectedText}</a>`;

    const newDef = definition.substring(0, start) + linkHTML + definition.substring(end);
    setDefinition(newDef);

    setTimeout(() => {
      textarea.focus();
      const newPos = start + linkHTML.length;
      textarea.setSelectionRange(newPos, newPos);
    }, 0);
  };

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

  const loadCategories = async () => {
    try {
      setCategoriesLoading(true);
      const res = await fetch("/api/glossary/categories");
      const json = await res.json();
      if (json.success) {
        setCategories(json.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setCategoriesLoading(false);
    }
  };

  useEffect(() => {
    loadTerms();
    loadCategories();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  const resetCategoryForm = () => {
    setCategoryName("");
    setEditCategoryMode(false);
    setEditCategoryId(null);
  };

  const handleEditCategory = (cat: GlossaryCategory) => {
    setEditCategoryMode(true);
    setEditCategoryId(cat.id);
    setCategoryName(cat.name);
  };

  const handleCategorySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!categoryName.trim()) {
      alert("Category name is required.");
      return;
    }

    const payload = {
      name: categoryName.trim(),
    };

    try {
      const url = "/api/glossary/categories";
      const method = editCategoryMode && editCategoryId ? "PUT" : "POST";
      const body = editCategoryMode && editCategoryId ? { id: editCategoryId, ...payload } : payload;

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const json = await res.json();
      if (json.success) {
        alert(editCategoryMode ? "Category updated successfully!" : "Category created successfully!");
        resetCategoryForm();
        loadCategories();
        loadTerms();
      } else {
        alert(json.error || "Operation failed.");
      }
    } catch (err) {
      console.error(err);
      alert("Something went wrong. Please try again.");
    }
  };

  const handleDeleteCategory = async (id: string, name: string) => {
    if (!confirm(`Delete glossary category "${name}"? This will unlink it from all associated glossary terms.`)) return;
    try {
      const res = await fetch(`/api/glossary/categories?id=${encodeURIComponent(id)}`, { method: "DELETE" });
      const json = await res.json();
      if (json.success) {
        resetCategoryForm();
        loadCategories();
        loadTerms();
      } else {
        alert(json.error || "Failed to delete category.");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const resetForm = () => {
    setWord("");
    setPhonetic("");
    setCategory("");
    setDefinition("");
    setIllustration("");
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
    setIllustration("");
    setIsModalOpen(true);
  };

  const handleEdit = (term: GlossaryTerm) => {
    setEditMode(true);
    setEditId(term.id);
    setWord(term.word);
    setPhonetic(term.phonetic);
    setCategory(term.category);
    setDefinition(term.definition);
    setIllustration(term.illustration ?? "");
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
      illustration: illustration.trim() || null,
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

  // File upload and cropping helpers
  const uploadFile = async (file: File): Promise<string | null> => {
    const formData = new FormData();
    formData.append("file", file);
    try {
      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });
      const json = await res.json();
      if (json.success) {
        return json.url;
      } else {
        alert("Upload failed: " + json.error);
        return null;
      }
    } catch (err) {
      console.error("Upload error", err);
      alert("An error occurred during file upload.");
      return null;
    }
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      setCropImageSrc(reader.result as string);
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const handleCropComplete = async (croppedFile: File) => {
    setCropImageSrc(null);
    setUploadingPhoto(true);
    const url = await uploadFile(croppedFile);
    if (url) {
      setIllustration(url);
    }
    setUploadingPhoto(false);
  };

  const handleCropCancel = () => {
    setCropImageSrc(null);
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

  // Filter and Pagination calculation
  const filteredTerms = terms.filter(t => 
    t.word.toLowerCase().includes(searchTerm.toLowerCase()) || 
    t.definition.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (t.category && t.category.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const totalPages = Math.ceil(filteredTerms.length / PAGE_SIZE) || 1;
  const safePage = Math.min(currentPage, totalPages);
  const paginatedTerms = filteredTerms.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  return (
    <div className="dashboard-content">
      <StatsDashboard
        pageType="glossary"
        actions={
          <div className="header-actions">
            {activeTab === "terms" ? (
              <>
                <button type="button" className="sync-btn" onClick={loadTerms}>
                  Refresh Terms
                </button>
                <Button variant="gold" onClick={handleOpenCreate}>
                  + New Term
                </Button>
              </>
            ) : (
              <button type="button" className="sync-btn" onClick={loadCategories}>
                Refresh Categories
              </button>
            )}
          </div>
        }
      />


      <div className="tabs-header">
        <button
          type="button"
          className={`tab-btn ${activeTab === "terms" ? "active" : ""}`}
          onClick={() => setActiveTab("terms")}
        >
          Terms ({terms.length})
        </button>
        <button
          type="button"
          className={`tab-btn ${activeTab === "categories" ? "active" : ""}`}
          onClick={() => setActiveTab("categories")}
        >
          Categories ({categories.length})
        </button>
      </div>

      {activeTab === "terms" ? (
        loading ? (
          <p className="admin-loading">Loading glossary terms...</p>
        ) : (
          <div className="admin-full-layout">
            <Card variant="glass" className="admin-table-card">
              <div className="table-header-bar" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "16px" }}>
                <h3 className="column-title">Terms Index ({filteredTerms.length})</h3>
                <div className="search-bar" style={{ flex: "1", maxWidth: "300px" }}>
                  <input
                    type="text"
                    placeholder="Search terms, definitions..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="glass-input"
                    style={{ width: "100%", padding: "8px 12px", borderRadius: "8px", border: "1px solid rgba(168, 85, 247, 0.2)", background: "rgba(255, 255, 255, 0.6)" }}
                  />
                </div>
              </div>
              
              <div className="table-wrapper">
                {filteredTerms.length === 0 ? (
                  <div className="empty-state-padding">
                    <p className="empty-list-msg">No glossary terms found matching your search.</p>
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
                              term.illustration.startsWith("http") || term.illustration.startsWith("/") ? (
                                <div className="table-illustration-wrapper">
                                  <a
                                    href={term.illustration}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    title="View original image"
                                  >
                                    <img
                                      src={term.illustration}
                                      alt="Illustration preview"
                                      className="table-illustration-thumb"
                                    />
                                  </a>
                                  <span className="illustration-badge upload-badge" title={term.illustration}>
                                    Image
                                  </span>
                                </div>
                              ) : (
                                <span className="illustration-badge">{term.illustration}</span>
                              )
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

              {filteredTerms.length > 0 && (
                <div className="admin-pagination-wrapper">
                  <span className="pagination-info">
                    Showing {(safePage - 1) * PAGE_SIZE + 1} to {Math.min(safePage * PAGE_SIZE, filteredTerms.length)} of {filteredTerms.length} entries
                  </span>
                  <ul className="admin-pagination">
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
            </Card>
          </div>
        )
      ) : (
        categoriesLoading ? (
          <p className="admin-loading">Loading categories...</p>
        ) : (
          <div className="admin-split-layout">
            <div className="split-list-col">
              <Card variant="glass" className="admin-table-card">
                <div className="table-header-bar">
                  <h3 className="column-title">Categories List ({categories.length})</h3>
                </div>
                <div className="table-wrapper">
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>ID</th>
                        <th>Category Name</th>
                        <th style={{ textAlign: "right" }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {categories.length === 0 ? (
                        <tr>
                          <td colSpan={3} className="text-center" style={{ padding: "24px", color: "hsl(var(--text-muted))" }}>
                            No categories found. Create one to get started.
                          </td>
                        </tr>
                      ) : (
                        categories.map((cat) => (
                          <tr key={cat.id}>
                            <td style={{ fontFamily: "monospace", fontSize: "0.82rem" }}>{cat.id}</td>
                            <td><strong>{cat.name}</strong></td>
                            <td>
                              <div className="action-btns-row">
                                <button
                                  type="button"
                                  className="edit-row-btn"
                                  onClick={() => handleEditCategory(cat)}
                                >
                                  Edit
                                </button>
                                <button
                                  type="button"
                                  className="delete-row-btn"
                                  onClick={() => handleDeleteCategory(cat.id, cat.name)}
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
              </Card>
            </div>
            
            <div className="split-form-col">
              <Card variant="glass" className="category-form-card" style={{ padding: "24px" }}>
                <h3 style={{ fontFamily: "var(--font-serif)", color: "#4c1d95", fontSize: "1.2rem", marginBottom: "16px" }}>
                  {editCategoryMode ? "Edit Category" : "Create Category"}
                </h3>
                <form onSubmit={handleCategorySubmit} className="admin-catalog-form">
                  <div className="form-group" style={{ marginBottom: "16px" }}>
                    <label>Category Name *</label>
                    <input
                      type="text"
                      className="glass-input"
                      required
                      placeholder="e.g. Ritual Practice"
                      value={categoryName}
                      onChange={(e) => setCategoryName(e.target.value)}
                    />
                  </div>
                  <div style={{ display: "flex", gap: "10px" }}>
                    {editCategoryMode && (
                      <button
                        type="button"
                        className="modal-cancel-btn"
                        onClick={resetCategoryForm}
                        style={{ flex: 1 }}
                      >
                        Cancel
                      </button>
                    )}
                    <Button variant="gold" type="submit" style={{ flex: 2 }}>
                      {editCategoryMode ? "Update Category" : "Create Category"}
                    </Button>
                  </div>
                </form>
              </Card>
            </div>
          </div>
        )
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
                    <select
                      className="glass-input"
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                    >
                      <option value="">Select a Category...</option>
                      {categories.map((cat) => (
                        <option key={cat.id} value={cat.name}>
                          {cat.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                      <label style={{ margin: 0 }}>Definition *</label>
                      <button 
                        type="button"
                        onClick={insertLink}
                        style={{
                          fontSize: '0.8rem',
                          padding: '4px 8px',
                          background: 'rgba(168, 85, 247, 0.1)',
                          border: '1px solid #7c3aed',
                          borderRadius: '4px',
                          color: '#7c3aed',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}
                      >
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path></svg>
                        Insert Link
                      </button>
                    </div>
                    <textarea
                      ref={definitionRef}
                      className="glass-input textarea-input"
                      required
                      rows={5}
                      placeholder="Full definition text... You can use the Insert Link button above."
                      value={definition}
                      onChange={(e) => setDefinition(e.target.value)}
                    />
                  </div>

                  <div className="form-group">
                    <label>Illustration Image</label>
                    <div className="media-input-row">
                      <input
                        type="text"
                        className="glass-input"
                        placeholder="Image URL or upload a file..."
                        value={illustration}
                        onChange={(e) => setIllustration(e.target.value)}
                      />
                      <label className="upload-media-btn">
                        {uploadingPhoto ? "⌛ Uplo..." : "⬆️ Image"}
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handlePhotoUpload}
                          className="hidden-file-input"
                          style={{ display: "none" }}
                          disabled={uploadingPhoto}
                        />
                      </label>
                    </div>
                    {illustration && (
                      <div className="media-preview-container">
                        <img
                          src={illustration}
                          alt="Illustration Preview"
                          className="media-preview-img"
                          style={{ width: "80px", height: "80px", objectFit: "contain", borderRadius: "6px", border: "1px solid rgba(0,0,0,0.1)" }}
                        />
                        <button
                          type="button"
                          className="delete-row-btn"
                          style={{ padding: "4px 8px", fontSize: "0.72rem" }}
                          onClick={() => setIllustration("")}
                        >
                          ✕ Clear
                        </button>
                      </div>
                    )}
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

      {cropImageSrc && (
        <ImageCropperModal
          imageSrc={cropImageSrc}
          onCropComplete={handleCropComplete}
          onCancel={handleCropCancel}
          aspectRatio="1:1"
        />
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
          max-width: 180px;
          overflow: hidden;
          text-overflow: ellipsis;
          display: inline-block;
          vertical-align: middle;
        }
        .table-illustration-wrapper {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .table-illustration-thumb {
          width: 36px;
          height: 36px;
          object-fit: cover;
          border-radius: 6px;
          border: 1px solid rgba(168, 85, 247, 0.2);
          cursor: pointer;
          transition: transform 0.2s ease, border-color 0.2s ease;
        }
        .table-illustration-thumb:hover {
          transform: scale(1.1);
          border-color: #7c3aed;
        }
        .illustration-badge.upload-badge {
          background: rgba(168, 85, 247, 0.04);
          border: 1px solid rgba(168, 85, 247, 0.15);
          color: #7c3aed;
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
        .media-input-row {
          display: flex;
          gap: 12px;
        }
        .media-input-row input {
          flex: 1;
        }
        .upload-media-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(168, 85, 247, 0.08);
          border: 1.5px dashed rgba(168, 85, 247, 0.4);
          color: #7c3aed;
          padding: 0 18px;
          font-size: 0.85rem;
          font-weight: 600;
          border-radius: 10px;
          cursor: pointer;
          white-space: nowrap;
          transition: all 0.2s ease;
        }
        .upload-media-btn:hover {
          background: rgba(168, 85, 247, 0.12);
          border-color: #7c3aed;
        }
        .media-preview-container {
          margin-top: 6px;
          background: rgba(0, 0, 0, 0.02);
          border: 1px solid rgba(0, 0, 0, 0.06);
          border-radius: 10px;
          padding: 10px;
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .media-preview-img {
          width: 80px;
          height: 60px;
          object-fit: cover;
          border-radius: 6px;
        }
        .tabs-header {
          display: flex;
          gap: 16px;
          border-bottom: 2px solid rgba(168, 85, 247, 0.08);
          margin-bottom: 24px;
        }
        .tab-btn {
          background: transparent;
          border: none;
          border-bottom: 3px solid transparent;
          padding: 12px 16px;
          font-family: var(--font-serif);
          font-size: 1.1rem;
          font-weight: 600;
          color: hsl(var(--text-muted));
          cursor: pointer;
          transition: all 0.2s ease;
          margin-bottom: -2px;
        }
        .tab-btn:hover {
          color: #7c3aed;
        }
        .tab-btn.active {
          color: #4c1d95;
          border-bottom-color: #7c3aed;
        }
        .admin-split-layout {
          display: grid;
          grid-template-columns: 1.5fr 1fr;
          gap: 24px;
          width: 100%;
        }
        .split-list-col, .split-form-col {
          display: flex;
          flex-direction: column;
        }
        @media (max-width: 992px) {
          .admin-split-layout {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
}
