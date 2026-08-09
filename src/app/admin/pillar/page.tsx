"use client";

import React, { useState, useEffect } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { 
  Plus, Trash2, Edit2, Eye, Compass, MoveUp, MoveDown, 
  BookOpen, ExternalLink, RefreshCw, AlertCircle, Save, X 
} from "lucide-react";

interface SubArticleInput {
  title: string;
  link: string;
  readTime: string;
}

interface PillarGuide {
  id: string;
  title: string;
  description: string;
  category: string;
  readTime: string;
  image: string;
  articles: SubArticleInput[];
}

export default function AdminPillarPage() {
  const [guides, setGuides] = useState<PillarGuide[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editGuideId, setEditGuideId] = useState<string | null>(null);

  // Form State
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [image, setImage] = useState("");
  const [articles, setArticles] = useState<SubArticleInput[]>([]);

  // Image Uploading State
  const [uploadingImage, setUploadingImage] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/pillar-guides");
      const json = await res.json();
      if (json.success) {
        setGuides(json.data || []);
      }
    } catch (err) {
      console.error("Failed to load admin pillar guides:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setImage("");
    setArticles([]);
    setEditMode(false);
    setEditGuideId(null);
  };

  const handleOpenCreateModal = () => {
    resetForm();
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (guide: PillarGuide) => {
    resetForm();
    setEditMode(true);
    setEditGuideId(guide.id);
    setTitle(guide.title);
    setDescription(guide.description);
    setImage(guide.image || "");
    setArticles(
      (guide.articles || []).map((art) => ({
        title: art.title || "",
        link: art.link || "",
        readTime: art.readTime || "5 Min Read"
      }))
    );
    setIsModalOpen(true);
  };

  // Image Uploader
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);
    setUploadingImage(true);

    try {
      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData
      });
      const json = await res.json();
      if (json.success) {
        setImage(json.url);
      } else {
        alert("Upload failed: " + json.error);
      }
    } catch (err) {
      console.error(err);
      alert("An error occurred during file upload.");
    } finally {
      setUploadingImage(false);
    }
  };

  // Sub-articles helpers
  const handleAddSubArticle = () => {
    setArticles([...articles, { title: "", link: "/blog/", readTime: "5 Min Read" }]);
  };

  const handleUpdateSubArticle = (index: number, field: keyof SubArticleInput, value: string) => {
    const updated = [...articles];
    updated[index] = { ...updated[index], [field]: value };
    setArticles(updated);
  };

  const handleRemoveSubArticle = (index: number) => {
    setArticles(articles.filter((_, idx) => idx !== index));
  };

  const handleMoveSubArticle = (index: number, direction: "up" | "down") => {
    if (direction === "up" && index === 0) return;
    if (direction === "down" && index === articles.length - 1) return;

    const targetIdx = direction === "up" ? index - 1 : index + 1;
    const nextArticles = [...articles];
    const temp = nextArticles[index];
    nextArticles[index] = nextArticles[targetIdx];
    nextArticles[targetIdx] = temp;
    setArticles(nextArticles);
  };

  const handleSaveGuide = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim() || !description.trim()) {
      alert("Please fill in all required fields (Title and Description).");
      return;
    }

    const payload = {
      title: title.trim(),
      description: description.trim(),
      category: "General",
      image: image.trim(),
      articles: articles.filter(art => art.title.trim() !== "")
    };

    try {
      let res;
      if (editMode && editGuideId) {
        res = await fetch("/api/pillar-guides", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: editGuideId, ...payload })
        });
      } else {
        res = await fetch("/api/pillar-guides", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });
      }

      const json = await res.json();
      if (json.success) {
        setIsModalOpen(false);
        resetForm();
        alert(editMode ? "Pillar Guide updated successfully!" : "Pillar Guide created successfully!");
        loadData();
      } else {
        alert("Operation failed: " + json.error);
      }
    } catch (err) {
      console.error(err);
      alert("An error occurred while saving the Pillar Guide.");
    }
  };

  const handleDeleteGuide = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to permanently delete the Pillar Guide: "${name}"?`)) return;
    try {
      const res = await fetch(`/api/pillar-guides?id=${id}`, { method: "DELETE" });
      const json = await res.json();
      if (json.success) {
        loadData();
      } else {
        alert("Failed to delete guide: " + json.error);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const filteredGuides = guides.filter(g =>
    g.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    g.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
    g.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="dashboard-content">
      {/* Overview stats header */}
      <div className="stats-dashboard-container" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
        <div>
          <h2 style={{ margin: 0, fontFamily: "var(--font-sans)", fontWeight: 700, fontSize: "1.4rem" }}>Manage Pillar Guides</h2>
          <p style={{ margin: "4px 0 0", fontSize: "0.85rem", color: "#6c757d" }}>Create, edit, and organize core guides separate from general blog posts.</p>
        </div>
        <div style={{ display: "flex", gap: "8px" }}>
          <button className="sync-btn" onClick={loadData} style={{ display: "flex", alignItems: "center", gap: "6px", padding: "8px 12px", border: "1px solid #ced4da", borderRadius: "8px", background: "#fff", fontSize: "0.82rem", cursor: "pointer" }}>
            <RefreshCw size={14} /> Refresh
          </button>
          <Button variant="gold" onClick={handleOpenCreateModal} style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <Plus size={16} /> Add Pillar Guide
          </Button>
        </div>
      </div>

      {/* Search inputs */}
      <div className="search-bar-row" style={{ marginBottom: "20px" }}>
        <input
          type="text"
          placeholder="Search pillar guides by title, category, description..."
          className="form-control"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{ width: "100%", padding: "12px 16px", borderRadius: "10px", border: "1px solid #ced4da" }}
        />
      </div>

      {/* Main Listing Table */}
      {loading ? (
        <p className="admin-loading" style={{ textAlign: "center", padding: "40px" }}>Loading guides database...</p>
      ) : (
        <Card variant="glass" className="card-primary" style={{ padding: 0 }}>
          <div style={{ borderBottom: "1px solid #dee2e6", padding: "12px 20px", background: "#f8f9fa", fontWeight: "700" }}>
            Guides Count ({filteredGuides.length})
          </div>
          <div className="table-responsive-container">
            <table className="admin-glass-table">
              <thead>
                <tr>
                  <th style={{ width: "80px" }}>Cover</th>
                  <th>Guide Details</th>
                  <th>Total Articles</th>
                  <th className="text-right" style={{ width: "240px" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredGuides.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="admin-empty-cell text-center" style={{ padding: "30px" }}>
                      No pillar guides found matching search queries.
                    </td>
                  </tr>
                ) : (
                  filteredGuides.map(g => (
                    <tr key={g.id}>
                      <td>
                        {g.image ? (
                          <img src={g.image} alt={g.title} style={{ width: "60px", height: "45px", objectFit: "cover", borderRadius: "6px" }} />
                        ) : (
                          <div style={{ width: "60px", height: "45px", background: "#e9ecef", borderRadius: "6px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                            <Compass size={20} color="#adb5bd" />
                          </div>
                        )}
                      </td>
                      <td>
                        <div className="table-service-info">
                          <span className="service-name"><strong>{g.title}</strong></span>
                          <div style={{ fontSize: "0.78rem", color: "#6c757d", maxWidth: "450px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {g.description}
                          </div>
                        </div>
                      </td>
                      <td>
                        <span style={{ fontSize: "0.85rem", fontWeight: 700, color: "#1e1b4b" }}>
                          📖 {g.articles ? g.articles.length : 0} Articles
                        </span>
                      </td>
                      <td className="text-right">
                        <div style={{ display: "flex", gap: "6px", justifyContent: "flex-end" }}>
                          <button className="btn btn-primary btn-sm" onClick={() => window.open("/blog/pillar", "_blank")} style={{ padding: "6px 12px", fontSize: "0.78rem", display: "flex", alignItems: "center", gap: "4px" }}>
                            <Eye size={12} /> View Page
                          </button>
                          <button className="btn btn-secondary btn-sm" onClick={() => handleOpenEditModal(g)} style={{ padding: "6px 12px", fontSize: "0.78rem", display: "flex", alignItems: "center", gap: "4px" }}>
                            <Edit2 size={12} /> Edit
                          </button>
                          <button className="btn btn-danger btn-sm" onClick={() => handleDeleteGuide(g.id, g.title)} style={{ padding: "6px 12px", fontSize: "0.78rem", display: "flex", alignItems: "center", gap: "4px" }}>
                            <Trash2 size={12} /> Delete
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
      )}

      {/* Create & Edit Modal */}
      {isModalOpen && (
        <div className="admin-modal-backdrop" style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.5)", zIndex: 1050, display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}>
          <div className="admin-modal-card" style={{ background: "#fff", borderRadius: "16px", width: "100%", maxWidth: "800px", maxHeight: "90vh", display: "flex", flexDirection: "column", boxShadow: "0 10px 25px rgba(0,0,0,0.15)", overflow: "hidden" }}>
            
            {/* Modal Header */}
            <div style={{ padding: "16px 24px", borderBottom: "1px solid #dee2e6", display: "flex", justifyContent: "space-between", alignItems: "center", background: "#f8f9fa" }}>
              <h3 style={{ margin: 0, fontSize: "1.15rem", fontWeight: 700 }}>
                {editMode ? "✎ Edit Pillar Guide" : "➕ Create New Pillar Guide"}
              </h3>
              <button onClick={() => setIsModalOpen(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "#6c757d" }}>
                <X size={20} />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSaveGuide} style={{ display: "flex", flexDirection: "column", overflow: "hidden", flex: 1 }}>
              <div style={{ padding: "24px", overflowY: "auto", display: "flex", flexDirection: "column", gap: "16px" }}>
                
                {/* Title */}
                <div className="form-group">
                  <label style={{ display: "block", marginBottom: "6px", fontWeight: "600", fontSize: "0.85rem" }}>Title <span style={{ color: "red" }}>*</span></label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Energy Healing & Chakras"
                    className="form-control"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #ced4da" }}
                  />
                </div>

                {/* Description */}
                <div className="form-group">
                  <label style={{ display: "block", marginBottom: "6px", fontWeight: "600", fontSize: "0.85rem" }}>Description <span style={{ color: "red" }}>*</span></label>
                  <textarea
                    required
                    rows={3}
                    placeholder="Write a brief, high-level summary overview of this healing pillar..."
                    className="form-control"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #ced4da", fontFamily: "inherit" }}
                  />
                </div>

                {/* Cover Image Row (Category Removed) */}
                <div className="form-group">
                  <label style={{ display: "block", marginBottom: "6px", fontWeight: "600", fontSize: "0.85rem" }}>Cover Image URL</label>
                  <div style={{ display: "flex", gap: "8px" }}>
                    <input
                      type="text"
                      placeholder="Image URL or upload a file (e.g. https://...)"
                      className="form-control"
                      value={image}
                      onChange={(e) => setImage(e.target.value)}
                      style={{ flex: 1, padding: "10px", borderRadius: "8px", border: "1px solid #ced4da" }}
                    />
                    <label style={{ cursor: "pointer", background: "#e9ecef", border: "1px solid #ced4da", borderRadius: "8px", padding: "10px 14px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.8rem", fontWeight: "600" }}>
                      {uploadingImage ? "Uploading..." : "Upload File"}
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        style={{ display: "none" }}
                        disabled={uploadingImage}
                      />
                    </label>
                  </div>
                </div>

                {/* Sub-articles List Builder */}
                <div style={{ marginTop: "10px", borderTop: "1px solid #eee", paddingTop: "20px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                      <BookOpen size={16} color="#7c3aed" />
                      <h4 style={{ margin: 0, fontSize: "0.95rem", fontWeight: 700 }}>Sub-Articles Redirect List ({articles.length})</h4>
                    </div>
                    <button
                      type="button"
                      onClick={handleAddSubArticle}
                      style={{ display: "flex", alignItems: "center", gap: "4px", padding: "6px 12px", border: "1px solid #7c3aed", borderRadius: "8px", background: "#fdf4ff", color: "#7c3aed", fontSize: "0.8rem", fontWeight: "700", cursor: "pointer" }}
                    >
                      <Plus size={14} /> Add Sub-article
                    </button>
                  </div>

                  {articles.length === 0 ? (
                    <div style={{ border: "1px dashed #dee2e6", padding: "20px", borderRadius: "8px", textAlign: "center", color: "#6c757d", fontSize: "0.8rem" }}>
                      <AlertCircle size={20} style={{ margin: "0 auto 8px", display: "block" }} />
                      No sub-articles added yet. Click "Add Sub-article" to link some redirect items.
                    </div>
                  ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: "12px", maxHeight: "280px", overflowY: "auto" }}>
                      {articles.map((article, idx) => (
                        <div key={idx} style={{ display: "flex", gap: "12px", alignItems: "center", background: "#f8f9fa", padding: "12px 16px", borderRadius: "10px", border: "1px solid #e9ecef", flexWrap: "wrap", width: "100%" }}>
                          
                          {/* Order actions */}
                          <div style={{ display: "flex", gap: "4px" }}>
                            <button type="button" onClick={() => handleMoveSubArticle(idx, "up")} disabled={idx === 0} style={{ background: "none", border: "none", cursor: "pointer", opacity: idx === 0 ? 0.3 : 0.8, padding: "4px" }}>
                              <MoveUp size={16} />
                            </button>
                            <button type="button" onClick={() => handleMoveSubArticle(idx, "down")} disabled={idx === articles.length - 1} style={{ background: "none", border: "none", cursor: "pointer", opacity: idx === articles.length - 1 ? 0.3 : 0.8, padding: "4px" }}>
                              <MoveDown size={16} />
                            </button>
                          </div>

                          {/* Title input */}
                          <div style={{ flex: "2 1 180px", minWidth: "150px" }}>
                            <input
                              type="text"
                              required
                              placeholder="Article Title (e.g. Reiki Guide)"
                              value={article.title}
                              onChange={(e) => handleUpdateSubArticle(idx, "title", e.target.value)}
                              style={{ width: "100%", padding: "8px 12px", borderRadius: "8px", border: "1px solid #ced4da", fontSize: "0.85rem", background: "#ffffff" }}
                            />
                          </div>

                          {/* Redirect Link input */}
                          <div style={{ flex: "2 1 200px", minWidth: "180px" }}>
                            <input
                              type="text"
                              required
                              placeholder="Redirect Link (e.g. /blog/reiki-guide)"
                              value={article.link}
                              onChange={(e) => handleUpdateSubArticle(idx, "link", e.target.value)}
                              style={{ width: "100%", padding: "8px 12px", borderRadius: "8px", border: "1px solid #ced4da", fontSize: "0.85rem", background: "#ffffff" }}
                            />
                          </div>

                          {/* Read Time input */}
                          <div style={{ flex: "1 1 100px", minWidth: "90px" }}>
                            <input
                              type="text"
                              placeholder="Read Time"
                              value={article.readTime}
                              onChange={(e) => handleUpdateSubArticle(idx, "readTime", e.target.value)}
                              style={{ width: "100%", padding: "8px 12px", borderRadius: "8px", border: "1px solid #ced4da", fontSize: "0.85rem", background: "#ffffff" }}
                            />
                          </div>

                          {/* Delete */}
                          <button
                            type="button"
                            onClick={() => handleRemoveSubArticle(idx)}
                            style={{ background: "none", border: "none", cursor: "pointer", color: "#dc3545", padding: "6px" }}
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

              </div>

              {/* Modal Footer */}
              <div style={{ padding: "16px 24px", borderTop: "1px solid #dee2e6", display: "flex", justifyContent: "flex-end", gap: "10px", background: "#f8f9fa" }}>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  style={{ padding: "8px 16px", border: "1px solid #ced4da", borderRadius: "8px", background: "#fff", fontSize: "0.85rem", cursor: "pointer" }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{ display: "flex", alignItems: "center", gap: "6px", padding: "8px 20px", border: "none", borderRadius: "8px", background: "#d97706", color: "#fff", fontSize: "0.85rem", fontWeight: "750", cursor: "pointer" }}
                >
                  <Save size={16} /> Save Guide
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      <style jsx>{`
        .category-badge {
          display: inline-block;
        }
        .admin-glass-table img {
          display: block;
        }
      `}</style>
    </div>
  );
}
