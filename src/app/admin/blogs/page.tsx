"use client";

import React, { useState, useEffect } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Blog, Practitioner } from "@/types/database";

export default function AdminBlogsPage() {
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [practitioners, setPractitioners] = useState<Practitioner[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  
  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editBlogId, setEditBlogId] = useState<string | null>(null);

  // Form states
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("Crystals");
  const [customCategory, setCustomCategory] = useState("");
  const [showCustomCategory, setShowCustomCategory] = useState(false);
  
  const [authorType, setAuthorType] = useState<"practitioner" | "custom">("practitioner");
  const [selectedPractitioner, setSelectedPractitioner] = useState("");
  const [customAuthor, setCustomAuthor] = useState("");
  
  const [content, setContent] = useState("");
  const [date, setDate] = useState("");
  const [readTime, setReadTime] = useState("");
  const [image, setImage] = useState("");
  const [uploadingImage, setUploadingImage] = useState(false);

  // Multiple media states
  const [galleryImages, setGalleryImages] = useState<string[]>([]);
  const [blogVideos, setBlogVideos] = useState<string[]>([]);
  const [uploadingGalleryIdx, setUploadingGalleryIdx] = useState<number | null>(null);
  const [uploadingVideoIdx, setUploadingVideoIdx] = useState<number | null>(null);

  const categories = ["Crystals", "Energy Healing", "Mindfulness", "Other"];

  const loadData = async () => {
    try {
      setLoading(true);
      const [bRes, pRes] = await Promise.all([
        fetch("/api/blogs"),
        fetch("/api/practitioners")
      ]);

      const bJson = await bRes.json();
      const pJson = await pRes.json();

      if (bJson.success && pJson.success) {
        setBlogs(bJson.data);
        setPractitioners(pJson.data);
        if (pJson.data.length > 0) {
          setSelectedPractitioner(pJson.data[0].name);
        }
      }
    } catch (err) {
      console.error("Failed to load admin blogs data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const resetForm = () => {
    setTitle("");
    setCategory("Crystals");
    setCustomCategory("");
    setShowCustomCategory(false);
    
    setAuthorType("practitioner");
    if (practitioners.length > 0) {
      setSelectedPractitioner(practitioners[0].name);
    } else {
      setSelectedPractitioner("");
    }
    setCustomAuthor("");
    
    setContent("");
    setDate(new Date().toISOString().split("T")[0]);
    setReadTime("");
    setImage("");
    setGalleryImages([]);
    setBlogVideos([]);
    setEditMode(false);
    setEditBlogId(null);
  };

  const handleOpenCreateModal = () => {
    resetForm();
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (blog: Blog) => {
    resetForm();
    setEditMode(true);
    setEditBlogId(blog.id);
    setTitle(blog.title);
    
    const isStandardCategory = ["crystals", "energy healing", "mindfulness"].includes(blog.category.toLowerCase());
    if (isStandardCategory) {
      const matched = categories.find(c => c.toLowerCase() === blog.category.toLowerCase()) || blog.category;
      setCategory(matched);
      setShowCustomCategory(false);
    } else {
      setCategory("Other");
      setCustomCategory(blog.category);
      setShowCustomCategory(true);
    }

    const pracExists = practitioners.some(p => p.name.toLowerCase() === blog.author.toLowerCase());
    if (pracExists) {
      setAuthorType("practitioner");
      const matchedPrac = practitioners.find(p => p.name.toLowerCase() === blog.author.toLowerCase());
      setSelectedPractitioner(matchedPrac?.name || blog.author);
    } else {
      setAuthorType("custom");
      setCustomAuthor(blog.author);
    }

    setContent(blog.content);
    setDate(blog.date);
    setReadTime(blog.readTime);
    setImage(blog.image || "");
    setGalleryImages(blog.images || []);
    setBlogVideos(blog.videos || []);
    setIsModalOpen(true);
  };

  const handleContentChange = (val: string) => {
    setContent(val);
    const words = val.trim().split(/\s+/).filter(Boolean).length;
    const computed = Math.max(1, Math.ceil(words / 200)) + " Min Read";
    setReadTime(computed);
  };

  const handleCategoryChange = (val: string) => {
    setCategory(val);
    setShowCustomCategory(val === "Other");
  };

  // Main Cover Image Upload
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
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

  // Multiple Gallery Images Helpers
  const handleAddGalleryImage = () => {
    setGalleryImages([...galleryImages, ""]);
  };

  const handleUpdateGalleryImage = (idx: number, val: string) => {
    const next = [...galleryImages];
    next[idx] = val;
    setGalleryImages(next);
  };

  const handleRemoveGalleryImage = (idx: number) => {
    setGalleryImages(galleryImages.filter((_, i) => i !== idx));
  };

  const handleGalleryUpload = async (e: React.ChangeEvent<HTMLInputElement>, idx: number) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);
    setUploadingGalleryIdx(idx);

    try {
      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData
      });
      const json = await res.json();
      if (json.success) {
        handleUpdateGalleryImage(idx, json.url);
      } else {
        alert("Upload failed: " + json.error);
      }
    } catch (err) {
      console.error(err);
      alert("An error occurred during file upload.");
    } finally {
      setUploadingGalleryIdx(null);
    }
  };

  // Multiple Blog Videos Helpers
  const handleAddBlogVideo = () => {
    setBlogVideos([...blogVideos, ""]);
  };

  const handleUpdateBlogVideo = (idx: number, val: string) => {
    const next = [...blogVideos];
    next[idx] = val;
    setBlogVideos(next);
  };

  const handleRemoveBlogVideo = (idx: number) => {
    setBlogVideos(blogVideos.filter((_, i) => i !== idx));
  };

  const handleVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>, idx: number) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);
    setUploadingVideoIdx(idx);

    try {
      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData
      });
      const json = await res.json();
      if (json.success) {
        handleUpdateBlogVideo(idx, json.url);
      } else {
        alert("Upload failed: " + json.error);
      }
    } catch (err) {
      console.error(err);
      alert("An error occurred during file upload.");
    } finally {
      setUploadingVideoIdx(null);
    }
  };

  const handleSaveBlog = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const finalCategory = category === "Other" ? customCategory.trim() : category;
    const finalAuthor = authorType === "practitioner" ? selectedPractitioner : customAuthor.trim();
    
    if (!title.trim() || !finalCategory || !finalAuthor || !content.trim() || !date || !readTime) {
      alert("Please fill in all required fields.");
      return;
    }

    const payload = {
      title: title.trim(),
      category: finalCategory,
      author: finalAuthor,
      content: content.trim(),
      date,
      readTime,
      image: image.trim(),
      images: galleryImages.filter(img => img.trim() !== ""),
      videos: blogVideos.filter(vid => vid.trim() !== "")
    };

    try {
      let res;
      if (editMode && editBlogId) {
        res = await fetch("/api/blogs", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: editBlogId, ...payload })
        });
      } else {
        res = await fetch("/api/blogs", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });
      }

      const json = await res.json();
      if (json.success) {
        setIsModalOpen(false);
        resetForm();
        alert(editMode ? "Blog details updated successfully!" : "Blog successfully added to publication catalog!");
        loadData();
      } else {
        alert("Operation failed: " + json.error);
      }
    } catch (err) {
      console.error(err);
      alert("An error occurred while saving the blog.");
    }
  };

  const handleDeleteBlog = async (id: string) => {
    if (!confirm("Are you sure you want to permanently delete this blog post?")) return;
    try {
      const res = await fetch(`/api/blogs?id=${id}`, { method: "DELETE" });
      const json = await res.json();
      if (json.success) {
        loadData();
      } else {
        alert("Failed to delete blog: " + json.error);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const filteredBlogs = blogs.filter(b => 
    b.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    b.author.toLowerCase().includes(searchQuery.toLowerCase()) ||
    b.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="dashboard-content">
      <div className="dashboard-header-row">
        <div>
          <h2>Publication & Blogs Control</h2>
          <p style={{ color: "hsl(var(--text-muted))", fontSize: "0.9rem", marginTop: "4px" }}>
            Create and edit dynamic articles, manage publications, classify guidance categories, and coordinate authors.
          </p>
        </div>
        <div className="header-actions">
          <button className="sync-btn" onClick={loadData}>
            🔄 Refresh Publications
          </button>
          <Button variant="gold" onClick={handleOpenCreateModal}>
            ➕ Add Article
          </Button>
        </div>
      </div>

      <div className="search-bar-row">
        <input
          type="text"
          placeholder="Search articles by title, author, category..."
          className="glass-input search-blogs-input"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {loading ? (
        <p style={{ color: "hsl(var(--text-muted))", marginTop: "40px" }}>Loading publication catalog...</p>
      ) : (
        <div className="admin-split-layout">
          <div className="split-list-col">
            <h3 className="column-title">Articles List ({filteredBlogs.length})</h3>
            <div className="table-responsive-container">
              <table className="admin-glass-table">
                <thead>
                  <tr>
                    <th>Article Details</th>
                    <th>Category</th>
                    <th>Author</th>
                    <th>Read Estimate</th>
                    <th>Date</th>
                    <th style={{ textAlign: "right" }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredBlogs.length === 0 ? (
                    <tr>
                      <td colSpan={6} style={{ textAlign: "center", color: "hsl(var(--text-muted))", padding: "24px" }}>
                        No matching articles found in catalog.
                      </td>
                    </tr>
                  ) : (
                    filteredBlogs.map(b => (
                      <tr key={b.id}>
                        <td>
                          <div className="table-service-info">
                            <span className="service-name">{b.title}</span>
                            <span className="service-desc-tooltip">
                              {b.content.length > 80 ? `${b.content.substring(0, 77)}...` : b.content}
                            </span>
                          </div>
                        </td>
                        <td>
                          <span className="category-chip">{b.category}</span>
                        </td>
                        <td>
                          <span className="duration-text">{b.author}</span>
                        </td>
                        <td>
                          <span className="readtime-text">⏱️ {b.readTime}</span>
                        </td>
                        <td>
                          <span className="date-text">{b.date}</span>
                        </td>
                        <td style={{ textAlign: "right" }}>
                          <div className="action-buttons-cell">
                            <button className="edit-row-btn" onClick={() => handleOpenEditModal(b)}>
                              ✎ Edit
                            </button>
                            <button className="delete-row-btn" onClick={() => handleDeleteBlog(b.id)}>
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

      {/* Modal Popup for Creating/Editing Blog */}
      {isModalOpen && (
        <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div className="modal-content-wrapper" onClick={(e) => e.stopPropagation()}>
            <Card variant="glass" className="modal-inner-card">
              <button className="close-modal-btn" onClick={() => setIsModalOpen(false)}>
                ✕
              </button>
              <h3 className="column-title" style={{ marginBottom: "20px" }}>
                {editMode ? "Edit Publication Details" : "Publish New Article"}
              </h3>
              
              <form onSubmit={handleSaveBlog} className="admin-catalog-form">
                <div className="form-group">
                  <label>Article Title *</label>
                  <input
                    type="text"
                    className="glass-input"
                    required
                    placeholder="e.g. Cleansing the Mind: Somatic Breath Patterns"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                  />
                </div>

                <div className="form-row">
                  <div className="form-group" style={{ flex: 1 }}>
                    <label>Category *</label>
                    <select
                      className="glass-input"
                      value={category}
                      onChange={(e) => handleCategoryChange(e.target.value)}
                    >
                      {categories.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>
                  {showCustomCategory && (
                    <div className="form-group" style={{ flex: 1 }}>
                      <label>Custom Category Name *</label>
                      <input
                        type="text"
                        className="glass-input"
                        required
                        placeholder="e.g. Sound Therapy"
                        value={customCategory}
                        onChange={(e) => setCustomCategory(e.target.value)}
                      />
                    </div>
                  )}
                </div>

                <div className="form-row">
                  <div className="form-group" style={{ flex: 1 }}>
                    <label>Author Source *</label>
                    <div style={{ display: "flex", gap: "16px", marginTop: "8px" }}>
                      <label style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "0.85rem", cursor: "pointer" }}>
                        <input
                          type="radio"
                          name="authorType"
                          checked={authorType === "practitioner"}
                          onChange={() => setAuthorType("practitioner")}
                        />
                        Practitioner
                      </label>
                      <label style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "0.85rem", cursor: "pointer" }}>
                        <input
                          type="radio"
                          name="authorType"
                          checked={authorType === "custom"}
                          onChange={() => setAuthorType("custom")}
                        />
                        Custom Name
                      </label>
                    </div>
                  </div>

                  <div className="form-group" style={{ flex: 1.2 }}>
                    {authorType === "practitioner" ? (
                      <>
                        <label>Select Author Practitioner *</label>
                        {practitioners.length > 0 ? (
                          <select
                            className="glass-input"
                            value={selectedPractitioner}
                            onChange={(e) => setSelectedPractitioner(e.target.value)}
                          >
                            {practitioners.map(p => (
                              <option key={p.id} value={p.name}>{p.name}</option>
                            ))}
                          </select>
                        ) : (
                          <input
                            type="text"
                            className="glass-input"
                            disabled
                            placeholder="No practitioners found. Use Custom Name."
                          />
                        )}
                      </>
                    ) : (
                      <>
                        <label>Author Name *</label>
                        <input
                          type="text"
                          className="glass-input"
                          required
                          placeholder="e.g. Master Sage"
                          value={customAuthor}
                          onChange={(e) => setCustomAuthor(e.target.value)}
                        />
                      </>
                    )}
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group" style={{ flex: 1 }}>
                    <label>Release Date *</label>
                    <input
                      type="date"
                      className="glass-input"
                      required
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                    />
                  </div>
                  <div className="form-group" style={{ flex: 1 }}>
                    <label>Read Time Estimate *</label>
                    <input
                      type="text"
                      className="glass-input"
                      required
                      placeholder="e.g. 5 Min Read"
                      value={readTime}
                      onChange={(e) => setReadTime(e.target.value)}
                    />
                  </div>
                </div>

                {/* Main Cover Image */}
                <div className="form-group">
                  <label>Article Cover Image URL (Featured Layout)</label>
                  <div className="media-input-row">
                    <input
                      type="text"
                      className="glass-input"
                      placeholder="Enter Image URL or Upload File"
                      value={image}
                      onChange={(e) => setImage(e.target.value)}
                    />
                    <label className="upload-media-btn">
                      {uploadingImage ? "⌛ Uplo..." : "⬆️ Image"}
                      <input 
                        type="file" 
                        accept="image/*" 
                        onChange={handleFileUpload}
                        style={{ display: "none" }}
                        disabled={uploadingImage}
                      />
                    </label>
                  </div>
                  {image && (
                    <div className="media-preview-container">
                      <img src={image} alt="Article cover preview" className="media-preview-img" />
                    </div>
                  )}
                </div>

                {/* Multiple Gallery Images */}
                <div className="form-group">
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <label>Gallery Images (Additional Photos Showcase)</label>
                    <button type="button" className="add-list-item-btn" onClick={handleAddGalleryImage}>
                      ＋ Add Photo
                    </button>
                  </div>
                  <div className="dynamic-inputs-list">
                    {galleryImages.map((imgUrl, idx) => (
                      <div key={idx} className="dynamic-media-row-wrapper">
                        <div className="dynamic-item-row">
                          <input
                            type="text"
                            className="glass-input"
                            placeholder="Enter Photo URL or Upload File"
                            value={imgUrl}
                            onChange={(e) => handleUpdateGalleryImage(idx, e.target.value)}
                          />
                          <label className="upload-media-btn">
                            {uploadingGalleryIdx === idx ? "⌛ Uplo..." : "⬆️ Image"}
                            <input 
                              type="file" 
                              accept="image/*" 
                              onChange={(e) => handleGalleryUpload(e, idx)}
                              style={{ display: "none" }}
                              disabled={uploadingGalleryIdx !== null}
                            />
                          </label>
                          <button type="button" className="remove-item-btn" onClick={() => handleRemoveGalleryImage(idx)}>
                            ✕
                          </button>
                        </div>
                        {imgUrl && (
                          <div className="media-preview-container mini">
                            <img src={imgUrl} alt={`Gallery index ${idx}`} className="media-preview-img mini" />
                          </div>
                        )}
                      </div>
                    ))}
                    {galleryImages.length === 0 && (
                      <span className="list-empty-label">No additional gallery photos added yet.</span>
                    )}
                  </div>
                </div>

                {/* Multiple Blog Videos */}
                <div className="form-group">
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <label>Blog Videos (Additional Video Playbacks)</label>
                    <button type="button" className="add-list-item-btn" onClick={handleAddBlogVideo}>
                      ＋ Add Video
                    </button>
                  </div>
                  <div className="dynamic-inputs-list">
                    {blogVideos.map((vidUrl, idx) => (
                      <div key={idx} className="dynamic-media-row-wrapper">
                        <div className="dynamic-item-row">
                          <input
                            type="text"
                            className="glass-input"
                            placeholder="Enter Video URL or Upload File"
                            value={vidUrl}
                            onChange={(e) => handleUpdateBlogVideo(idx, e.target.value)}
                          />
                          <label className="upload-media-btn">
                            {uploadingVideoIdx === idx ? "⌛ Uplo..." : "⬆️ Video"}
                            <input 
                              type="file" 
                              accept="video/*" 
                              onChange={(e) => handleVideoUpload(e, idx)}
                              style={{ display: "none" }}
                              disabled={uploadingVideoIdx !== null}
                            />
                          </label>
                          <button type="button" className="remove-item-btn" onClick={() => handleRemoveBlogVideo(idx)}>
                            ✕
                          </button>
                        </div>
                        {vidUrl && (
                          <div className="media-preview-container mini video">
                            <span className="media-preview-badge">Video Attached</span>
                            <span className="media-preview-text">{vidUrl.substring(0, 60)}...</span>
                          </div>
                        )}
                      </div>
                    ))}
                    {blogVideos.length === 0 && (
                      <span className="list-empty-label">No additional videos added yet.</span>
                    )}
                  </div>
                </div>

                <div className="form-group">
                  <label>Article Content *</label>
                  <textarea
                    className="glass-input desc-area"
                    required
                    rows={12}
                    placeholder="Draft the article text. Use double-newlines to separate paragraphs..."
                    value={content}
                    onChange={(e) => handleContentChange(e.target.value)}
                    style={{ minHeight: "220px", height: "auto" }}
                  />
                  <small style={{ display: "block", color: "hsl(var(--text-muted))", fontSize: "0.75rem", marginTop: "4px" }}>
                    Word Count: {content.trim().split(/\s+/).filter(Boolean).length} words
                  </small>
                </div>

                <Button variant="gold" type="submit" style={{ width: "100%", marginTop: "12px", padding: "14px" }}>
                  {editMode ? "Save Changes" : "Publish Article"}
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
        .search-bar-row {
          width: 100%;
        }
        .search-blogs-input {
          width: 100%;
          padding: 14px 20px;
          border-radius: 12px;
          font-size: 0.95rem;
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
          max-width: 680px;
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
        .table-service-info {
          display: flex;
          flex-direction: column;
          gap: 4px;
          max-width: 320px;
        }
        .service-name {
          font-weight: 600;
          color: hsl(var(--text-cream));
        }
        .service-desc-tooltip {
          font-size: 0.75rem;
          color: hsl(var(--text-muted));
          line-height: 1.4;
        }
        .category-chip {
          background: rgba(168, 85, 247, 0.08);
          border: 1px solid rgba(168, 85, 247, 0.2);
          color: #7c3aed;
          padding: 3px 8px;
          border-radius: 99px;
          font-size: 0.75rem;
          font-weight: 500;
          white-space: nowrap;
        }
        .duration-text {
          font-weight: 500;
          color: hsl(var(--text-cream));
        }
        .readtime-text {
          font-size: 0.85rem;
          color: hsl(var(--text-muted));
        }
        .date-text {
          color: hsl(var(--text-muted));
          font-size: 0.85rem;
        }
        .action-buttons-cell {
          display: flex;
          gap: 8px;
          justify-content: flex-end;
        }
        .edit-row-btn {
          background: rgba(124, 58, 237, 0.06);
          border: 1px solid rgba(124, 58, 237, 0.2);
          color: #7c3aed;
          padding: 6px 12px;
          border-radius: 6px;
          cursor: pointer;
          font-size: 0.8rem;
          font-weight: 600;
          transition: var(--transition-fast);
        }
        .edit-row-btn:hover {
          background: rgba(124, 58, 237, 0.12);
        }
        .delete-row-btn {
          background: rgba(239, 68, 68, 0.06);
          border: 1px solid rgba(239, 68, 68, 0.2);
          color: #ef4444;
          padding: 6px 12px;
          border-radius: 6px;
          cursor: pointer;
          font-size: 0.8rem;
          font-weight: 600;
          transition: var(--transition-fast);
        }
        .delete-row-btn:hover {
          background: rgba(239, 68, 68, 0.12);
        }
        .admin-catalog-form {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }
        .form-row {
          display: flex;
          gap: 16px;
        }
        .form-group {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        .form-group label {
          font-size: 0.85rem;
          font-weight: 600;
          color: #334155;
        }
        .glass-input {
          padding: 10px 14px;
          border-radius: 8px;
          border: 1px solid var(--border-glass);
          background: rgba(255, 255, 255, 0.8);
          font-size: 0.9rem;
          outline: none;
          color: #1e293b;
          font-family: inherit;
          transition: var(--transition-fast);
          width: 100%;
        }
        .glass-input:focus {
          border-color: #7c3aed;
          background: #ffffff;
          box-shadow: 0 0 8px rgba(124, 58, 237, 0.1);
        }
        .desc-area {
          resize: vertical;
          min-height: 120px;
        }
        .media-input-row {
          display: flex;
          gap: 12px;
        }
        .media-input-row .glass-input {
          flex: 1;
        }
        .upload-media-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(135deg, rgba(251, 207, 232, 0.2) 0%, rgba(233, 213, 255, 0.2) 100%);
          border: 1px solid rgba(168, 85, 247, 0.2);
          color: #7c3aed;
          padding: 10px 16px;
          border-radius: 8px;
          cursor: pointer;
          font-size: 0.85rem;
          font-weight: 600;
          transition: var(--transition-fast);
          white-space: nowrap;
        }
        .upload-media-btn:hover {
          background: rgba(168, 85, 247, 0.08);
          border-color: #7c3aed;
        }
        .media-preview-container {
          margin-top: 8px;
          border-radius: 12px;
          overflow: hidden;
          max-height: 200px;
          border: 1px solid var(--border-glass);
          background: rgba(0,0,0,0.02);
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .media-preview-container.mini {
          max-height: 100px;
          justify-content: flex-start;
          padding: 6px;
          border-radius: 8px;
        }
        .media-preview-img {
          max-width: 100%;
          max-height: 200px;
          object-fit: contain;
        }
        .media-preview-img.mini {
          max-height: 80px;
          border-radius: 4px;
        }
        .add-list-item-btn {
          background: transparent;
          border: none;
          color: #7c3aed;
          font-size: 0.8rem;
          font-weight: 600;
          cursor: pointer;
          transition: var(--transition-fast);
        }
        .add-list-item-btn:hover {
          color: #4c1d95;
          text-decoration: underline;
        }
        .dynamic-inputs-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
          margin-top: 6px;
          background: rgba(0,0,0,0.01);
          border: 1px dashed rgba(0,0,0,0.08);
          padding: 16px;
          border-radius: 12px;
        }
        .dynamic-media-row-wrapper {
          display: flex;
          flex-direction: column;
          gap: 6px;
          border-bottom: 1px solid rgba(0,0,0,0.03);
          padding-bottom: 12px;
        }
        .dynamic-media-row-wrapper:last-child {
          border-bottom: none;
          padding-bottom: 0;
        }
        .dynamic-item-row {
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .remove-item-btn {
          background: transparent;
          border: none;
          color: hsl(var(--text-muted));
          cursor: pointer;
          font-size: 1rem;
          padding: 8px;
          transition: var(--transition-fast);
        }
        .remove-item-btn:hover {
          color: #ef4444;
        }
        .media-preview-badge {
          background: rgba(59, 130, 246, 0.08);
          color: #2563eb;
          border: 1px solid rgba(59, 130, 246, 0.2);
          font-size: 0.7rem;
          font-weight: 700;
          padding: 2px 6px;
          border-radius: 4px;
          text-transform: uppercase;
        }
        .media-preview-text {
          font-size: 0.8rem;
          color: hsl(var(--text-muted));
          font-family: var(--font-sans);
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .list-empty-label {
          font-size: 0.8rem;
          color: hsl(var(--text-muted));
          font-style: italic;
          text-align: center;
        }
        @media (max-width: 640px) {
          .form-row {
            flex-direction: column;
            gap: 16px;
          }
        }
      `}</style>
    </div>
  );
}
