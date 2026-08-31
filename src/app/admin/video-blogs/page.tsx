"use client";

import React, { useState, useEffect } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import StatsDashboard from "@/components/admin/StatsDashboard";
import { Blog, Practitioner } from "@/types/database";

export default function AdminVideoBlogsPage() {
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
  const [slugInput, setSlugInput] = useState("");
  const [category, setCategory] = useState("Video Transcripts");
  const [authorType, setAuthorType] = useState<"practitioner" | "custom">("practitioner");
  const [selectedPractitioner, setSelectedPractitioner] = useState("");
  const [customAuthor, setCustomAuthor] = useState("");
  const [videoEmbedUrl, setVideoEmbedUrl] = useState("");
  const [videoTranscript, setVideoTranscript] = useState("");
  const [content, setContent] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [readTime, setReadTime] = useState("5 Min Watch");
  const [image, setImage] = useState("");
  const [saving, setSaving] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      const [bRes, pRes] = await Promise.all([
        fetch("/api/blogs?admin_view=true"),
        fetch("/api/practitioners"),
      ]);

      const bJson = await bRes.json();
      const pJson = await pRes.json();

      if (bJson.success) {
        setBlogs(bJson.data || []);
      }
      if (pJson.success) {
        setPractitioners(pJson.data || []);
        if (pJson.data.length > 0 && !selectedPractitioner) {
          setSelectedPractitioner(pJson.data[0].name);
        }
      }
    } catch (err) {
      console.error("Failed to load video blogs data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const videoBlogs = blogs.filter((b) => {
    const isVid =
      b.content_type === "video" ||
      Boolean(b.video_embed_url) ||
      b.category?.toLowerCase().includes("video") ||
      b.section?.toLowerCase().includes("video");
    return isVid;
  });

  const filteredVideoBlogs = videoBlogs.filter(
    (b) =>
      b.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.author.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const resetForm = () => {
    setTitle("");
    setSlugInput("");
    setCategory("Video Transcripts");
    setAuthorType("practitioner");
    if (practitioners.length > 0) {
      setSelectedPractitioner(practitioners[0].name);
    } else {
      setSelectedPractitioner("");
    }
    setCustomAuthor("");
    setVideoEmbedUrl("");
    setVideoTranscript("");
    setContent("");
    setDate(new Date().toISOString().split("T")[0]);
    setReadTime("5 Min Watch");
    setImage("/images/insight_video.png");
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
    setSlugInput(blog.slug || "");
    setCategory(blog.category || "Video Transcripts");

    const pracExists = practitioners.some(
      (p) => p.name.toLowerCase() === blog.author.toLowerCase()
    );
    if (pracExists) {
      setAuthorType("practitioner");
      const matched = practitioners.find(
        (p) => p.name.toLowerCase() === blog.author.toLowerCase()
      );
      setSelectedPractitioner(matched?.name || blog.author);
    } else {
      setAuthorType("custom");
      setCustomAuthor(blog.author);
    }

    setVideoEmbedUrl(blog.video_embed_url || (blog.videos?.[0] ?? ""));
    setVideoTranscript(blog.video_transcript || "");
    setContent(blog.content || "");
    setDate(blog.date || new Date().toISOString().split("T")[0]);
    setReadTime(blog.readTime || "5 Min Watch");
    setImage(blog.image || "/images/insight_video.png");

    setIsModalOpen(true);
  };

  const getEmbeddableUrl = (url: string) => {
    if (!url) return "";
    if (url.includes("youtube.com/watch")) {
      const videoId = url.split("v=")[1]?.split("&")[0];
      return `https://www.youtube.com/embed/${videoId}`;
    }
    if (url.includes("youtu.be/")) {
      const videoId = url.split("youtu.be/")[1]?.split("?")[0];
      return `https://www.youtube.com/embed/${videoId}`;
    }
    if (url.includes("youtube.com/embed/")) {
      return url;
    }
    return url;
  };

  const handleSaveVideoBlog = async (e: React.FormEvent) => {
    e.preventDefault();
    const finalAuthor =
      authorType === "practitioner" ? selectedPractitioner : customAuthor.trim();

    if (!title.trim() || !videoEmbedUrl.trim() || !finalAuthor || !content.trim()) {
      alert("Please fill in required fields: Title, YouTube Video Link, Author, and Video Description.");
      return;
    }

    const normalizedEmbedUrl = getEmbeddableUrl(videoEmbedUrl.trim());

    const payload = {
      title: title.trim(),
      slug: slugInput.trim(),
      category: category.trim() || "Video Transcripts",
      author: finalAuthor,
      content: content.trim(),
      date,
      readTime: readTime.trim() || "5 Min Watch",
      image: image.trim() || "/images/insight_video.png",
      content_type: "video",
      section: "video-transcripts",
      video_embed_url: normalizedEmbedUrl,
      video_transcript: videoTranscript.trim(),
      videos: [normalizedEmbedUrl],
      approval_status: "published",
      status: "published",
    };

    try {
      setSaving(true);
      let res;
      if (editMode && editBlogId) {
        res = await fetch("/api/blogs", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: editBlogId, ...payload }),
        });
      } else {
        res = await fetch("/api/blogs", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      }

      const json = await res.json();
      if (json.success) {
        setIsModalOpen(false);
        resetForm();
        alert(
          editMode
            ? "Video blog updated successfully!"
            : "Video blog successfully published!"
        );
        loadData();
      } else {
        alert("Operation failed: " + json.error);
      }
    } catch (err: any) {
      console.error(err);
      alert("An error occurred while saving the video blog: " + (err.message || err));
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteVideoBlog = async (id: string, blogTitle: string) => {
    if (!confirm(`Are you sure you want to delete video blog "${blogTitle}"?`)) return;
    try {
      const res = await fetch(`/api/blogs?id=${id}`, { method: "DELETE" });
      const json = await res.json();
      if (json.success) {
        loadData();
      } else {
        alert("Failed to delete video blog: " + json.error);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const countTranscriptLines = (text?: string) => {
    if (!text) return 0;
    return text.split("\n").filter((line) => line.trim().length > 0).length;
  };

  return (
    <div className="dashboard-content">
      <StatsDashboard
        pageType="blogs"
        actions={
          <div className="header-actions">
            <button className="sync-btn" onClick={loadData}>
              🔄 Refresh Video Catalog
            </button>
            <Button variant="gold" onClick={handleOpenCreateModal}>
              🎥 + Add Video Blog
            </Button>
          </div>
        }
      />

      {/* Search Bar */}
      <div className="search-bar-row" style={{ margin: "20px 0" }}>
        <input
          type="text"
          placeholder="Search video blogs by title, author, category..."
          className="form-control search-blogs-input"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {loading ? (
        <p className="admin-loading">Loading video blogs catalog...</p>
      ) : (
        <Card variant="glass" className="card-primary" style={{ padding: "0 !important" }}>
          <div
            style={{
              borderBottom: "1px solid #dee2e6",
              padding: "14px 20px",
              background: "#f8f9fa",
              fontWeight: "700",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <span>🎥 Dynamic Video Blogs ({filteredVideoBlogs.length})</span>
            <span style={{ fontSize: "0.82rem", color: "#6c757d", fontWeight: "normal" }}>
              Dynamic Backend Management
            </span>
          </div>

          <div className="table-responsive-container">
            <table className="admin-glass-table">
              <thead>
                <tr>
                  <th>Video Blog Title</th>
                  <th>YouTube Link</th>
                  <th>Transcript Notes</th>
                  <th>Author</th>
                  <th>Date</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredVideoBlogs.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="admin-empty-cell text-center" style={{ padding: "30px" }}>
                      No video blogs found in catalog. Click <strong>+ Add Video Blog</strong> to create one!
                    </td>
                  </tr>
                ) : (
                  filteredVideoBlogs.map((b) => {
                    const embedUrl = getEmbeddableUrl(b.video_embed_url || (b.videos?.[0] ?? ""));
                    const lineCount = countTranscriptLines(b.video_transcript);

                    return (
                      <tr key={b.id}>
                        <td>
                          <div className="table-service-info">
                            <span className="service-name">
                              <strong>{b.title}</strong>
                            </span>
                            <div
                              style={{
                                fontSize: "0.78rem",
                                color: "#6c757d",
                                maxWidth: "260px",
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                whiteSpace: "nowrap",
                              }}
                            >
                              {b.content}
                            </div>
                          </div>
                        </td>
                        <td>
                          {embedUrl ? (
                            <a
                              href={embedUrl}
                              target="_blank"
                              rel="noreferrer"
                              style={{
                                fontSize: "0.82rem",
                                color: "#6366f1",
                                textDecoration: "underline",
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "4px",
                              }}
                            >
                              ▶ Play Link
                            </a>
                          ) : (
                            <span style={{ color: "#dc3545", fontSize: "0.8rem" }}>No Link</span>
                          )}
                        </td>
                        <td>
                          <span
                            className="category-badge"
                            style={{
                              background: lineCount > 0 ? "#e0e7ff" : "#f1f5f9",
                              color: lineCount > 0 ? "#4338ca" : "#64748b",
                            }}
                          >
                            {lineCount > 0 ? `📜 ${lineCount} Timed Lines` : "No Transcript"}
                          </span>
                        </td>
                        <td>
                          <span>{b.author}</span>
                        </td>
                        <td style={{ whiteSpace: "nowrap" }}>
                          <span>{b.date}</span>
                        </td>
                        <td className="text-right">
                          <div
                            className="action-buttons-cell"
                            style={{ display: "flex", gap: "6px", justifyContent: "flex-end" }}
                          >
                            <button
                              className="btn btn-primary btn-sm"
                              onClick={() => window.open(`/blog/${b.slug || b.id}`, "_blank")}
                            >
                              👁 View
                            </button>
                            <button
                              className="btn btn-secondary btn-sm"
                              onClick={() => handleOpenEditModal(b)}
                            >
                              ✎ Edit
                            </button>
                            <button
                              className="btn btn-danger btn-sm"
                              onClick={() => handleDeleteVideoBlog(b.id, b.title)}
                            >
                              ✕ Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Modal for Add/Edit Video Blog */}
      {isModalOpen && (
        <div className="admin-modal-overlay">
          <div
            className="admin-modal-content"
            style={{ maxWidth: "750px", width: "90%", maxHeight: "90vh", overflowY: "auto" }}
          >
            <div className="modal-header">
              <h3>{editMode ? "✎ Edit Video Blog" : "🎥 Create New Video Blog"}</h3>
              <button className="close-btn" onClick={() => setIsModalOpen(false)}>
                ×
              </button>
            </div>

            <form onSubmit={handleSaveVideoBlog} className="modal-body">
              {/* Title & Slug */}
              <div className="form-group">
                <label>Video Blog Title *</label>
                <input
                  type="text"
                  className="glass-input"
                  required
                  placeholder="e.g. Chakra Shorts: Awakening the Heart Node"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>

              <div className="form-row">
                <div className="form-group form-group-flex">
                  <label>URL Slug (Optional)</label>
                  <input
                    type="text"
                    className="glass-input"
                    placeholder="e.g. chakra-shorts-awakening-heart-node"
                    value={slugInput}
                    onChange={(e) => setSlugInput(e.target.value)}
                  />
                </div>

                <div className="form-group form-group-flex">
                  <label>Category / Playlist</label>
                  <select
                    className="glass-input"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                  >
                    <option value="Video Transcripts">Video Transcripts</option>
                    <option value="Chakra Shorts">Chakra Shorts</option>
                    <option value="Aura Alignment">Aura Alignment</option>
                    <option value="Guided Sessions">Guided Sessions</option>
                    <option value="Sound Therapy">Sound Therapy</option>
                  </select>
                </div>
              </div>

              {/* Author Selection */}
              <div className="form-row">
                <div className="form-group form-group-flex">
                  <label>Author Type</label>
                  <select
                    className="glass-input"
                    value={authorType}
                    onChange={(e: any) => setAuthorType(e.target.value)}
                  >
                    <option value="practitioner">Registered Practitioner</option>
                    <option value="custom">Custom Author Name</option>
                  </select>
                </div>

                <div className="form-group form-group-flex">
                  <label>Author Name *</label>
                  {authorType === "practitioner" ? (
                    <select
                      className="glass-input"
                      value={selectedPractitioner}
                      onChange={(e) => setSelectedPractitioner(e.target.value)}
                    >
                      {practitioners.map((p) => (
                        <option key={p.id} value={p.name}>
                          {p.name} ({p.specialty})
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type="text"
                      className="glass-input"
                      required
                      placeholder="e.g. Master Zephyr"
                      value={customAuthor}
                      onChange={(e) => setCustomAuthor(e.target.value)}
                    />
                  )}
                </div>
              </div>

              {/* YouTube Link */}
              <div className="form-group">
                <label style={{ color: "#4f46e5", fontWeight: 700 }}>
                  ▶ YouTube Video Link / Embed URL *
                </label>
                <input
                  type="text"
                  className="glass-input"
                  required
                  placeholder="https://www.youtube.com/watch?v=... or https://youtu.be/..."
                  value={videoEmbedUrl}
                  onChange={(e) => setVideoEmbedUrl(e.target.value)}
                />
                <small style={{ color: "#64748b", fontSize: "0.78rem" }}>
                  Paste any YouTube URL. It will automatically convert into a responsive embedded video player.
                </small>
              </div>

              {/* Live Preview Box */}
              {videoEmbedUrl && (
                <div
                  style={{
                    background: "#0f172a",
                    padding: "12px",
                    borderRadius: "12px",
                    marginBottom: "18px",
                  }}
                >
                  <p style={{ color: "#94a3b8", fontSize: "0.8rem", margin: "0 0 8px" }}>
                    🎬 Live Player Preview:
                  </p>
                  <div style={{ position: "relative", paddingTop: "56.25%", borderRadius: "8px", overflow: "hidden" }}>
                    <iframe
                      src={getEmbeddableUrl(videoEmbedUrl)}
                      style={{
                        position: "absolute",
                        top: 0,
                        left: 0,
                        width: "100%",
                        height: "100%",
                        border: "none",
                      }}
                      allowFullScreen
                      title="Preview"
                    />
                  </div>
                </div>
              )}

              {/* Timestamped Video Transcript */}
              <div className="form-group">
                <label style={{ color: "#4f46e5", fontWeight: 700 }}>
                  📜 Timestamped Video Transcript Notes
                </label>
                <textarea
                  className="glass-input"
                  rows={6}
                  placeholder={`00:00 Introduction to 528Hz Sound Bowl Therapy\n00:06 Sound vibrations target cellular water crystals\n00:14 Somatic tension stored in chakra nodes\n00:22 Practical steps to dissolve localized anxiety`}
                  value={videoTranscript}
                  onChange={(e) => setVideoTranscript(e.target.value)}
                />
                <small style={{ color: "#64748b", fontSize: "0.78rem" }}>
                  Enter lines in <strong>00:00 Text</strong> format. The app automatically creates interactive clickable timestamps on the frontend!
                </small>
              </div>

              {/* Video Description / Article Content */}
              <div className="form-group">
                <label>Video Summary & Transition Notes *</label>
                <textarea
                  className="glass-input"
                  rows={4}
                  required
                  placeholder="Explain the background of this video, key takeaways, or healing exercises..."
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                />
              </div>

              {/* Date & Watch Time */}
              <div className="form-row">
                <div className="form-group form-group-flex">
                  <label>Publish Date</label>
                  <input
                    type="date"
                    className="glass-input"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                  />
                </div>

                <div className="form-group form-group-flex">
                  <label>Duration / Watch Estimate</label>
                  <input
                    type="text"
                    className="glass-input"
                    placeholder="e.g. 5 Min Watch"
                    value={readTime}
                    onChange={(e) => setReadTime(e.target.value)}
                  />
                </div>
              </div>

              <div className="modal-footer" style={{ marginTop: "20px", display: "flex", gap: "10px", justifyContent: "flex-end" }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setIsModalOpen(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-gold" disabled={saving}>
                  {saving ? "Saving..." : editMode ? "Update Video Blog" : "Publish Video Blog"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
