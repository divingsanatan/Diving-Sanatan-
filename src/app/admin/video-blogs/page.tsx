"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import StatsDashboard from "@/components/admin/StatsDashboard";
import { Blog } from "@/types/database";

export default function AdminVideoBlogsPage() {
  const router = useRouter();
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  const loadData = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/blogs?admin_view=true");
      const json = await res.json();
      if (json.success) {
        setBlogs(json.data || []);
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

  // Filter video blogs
  const videoBlogs = blogs.filter((b) => {
    const isVid =
      b.content_type === "video" ||
      Boolean(b.video_embed_url) ||
      b.category?.toLowerCase().includes("video") ||
      b.section?.toLowerCase().includes("video");
    return isVid;
  });

  // Extract unique category names for filter dropdown
  const categoryOptions = Array.from(
    new Set(
      ["Video Transcripts", "Chakra Shorts", "Aura Alignment", "Guided Sessions", "Sound Therapy"].concat(
        videoBlogs.map((b) => b.category).filter(Boolean)
      )
    )
  );

  const filteredVideoBlogs = videoBlogs.filter((b) => {
    const matchesSearch =
      b.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.author.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (b.video_transcript && b.video_transcript.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesCategory = categoryFilter === "all" || b.category === categoryFilter;

    return matchesSearch && matchesCategory;
  });

  const totalPages = Math.max(1, Math.ceil(filteredVideoBlogs.length / itemsPerPage));
  const paginatedVideoBlogs = filteredVideoBlogs.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const getEmbeddableUrl = (url: string) => {
    if (!url) return "";
    let cleanUrl = url.trim();

    if (
      cleanUrl.match(/\.(mp4|webm|mov|ogg)($|\?)/i) ||
      cleanUrl.includes("/storage/v1/object/public/uploads/") ||
      cleanUrl.includes("video/upload")
    ) {
      return cleanUrl;
    }

    if (cleanUrl.toLowerCase().includes("<iframe")) {
      const srcMatch = cleanUrl.match(/src=["']([^"']+)["']/i);
      if (srcMatch && srcMatch[1]) {
        cleanUrl = srcMatch[1];
      }
    }

    if (cleanUrl.includes("youtube.com/shorts/")) {
      const videoId = cleanUrl.split("youtube.com/shorts/")[1]?.split("?")[0]?.split("/")[0];
      if (videoId) return `https://www.youtube.com/embed/${videoId}`;
    }

    if (cleanUrl.includes("youtube.com/watch")) {
      const videoId = cleanUrl.split("v=")[1]?.split("&")[0];
      if (videoId) return `https://www.youtube.com/embed/${videoId}`;
    }

    if (cleanUrl.includes("youtu.be/")) {
      const videoId = cleanUrl.split("youtu.be/")[1]?.split("?")[0]?.split("/")[0];
      if (videoId) return `https://www.youtube.com/embed/${videoId}`;
    }

    if (cleanUrl.includes("youtube.com/embed/")) {
      return cleanUrl;
    }

    if (cleanUrl.includes("vimeo.com/") && !cleanUrl.includes("player.vimeo.com")) {
      const videoId = cleanUrl.split("vimeo.com/")[1]?.split("?")[0]?.split("/")[0];
      if (videoId) return `https://player.vimeo.com/video/${videoId}`;
    }

    return cleanUrl;
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
        pageType="video-blogs"
        actions={
          <div className="header-actions">
            <button className="sync-btn" onClick={loadData}>
              🔄 Refresh Video Catalog
            </button>
            <Button variant="gold" onClick={() => router.push("/admin/video-blogs/new")}>
              🎥 + Add Video Blog
            </Button>
          </div>
        }
      />

      {/* Search & Filter Row */}
      <div
        className="search-bar-row flex-between"
        style={{ margin: "20px 0", gap: "15px", flexWrap: "wrap" }}
      >
        <div style={{ flex: 1, minWidth: "280px" }}>
          <input
            type="text"
            placeholder="Search video blogs by title, author, transcript..."
            className="form-control search-blogs-input"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
          />
        </div>

        <div style={{ width: "220px" }}>
          <select
            className="form-control"
            value={categoryFilter}
            onChange={(e) => {
              setCategoryFilter(e.target.value);
              setCurrentPage(1);
            }}
          >
            <option value="all">All Playlists / Categories</option>
            {categoryOptions.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>
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
            <span>🎥 Dynamic Video Catalog ({filteredVideoBlogs.length})</span>
            <span style={{ fontSize: "0.82rem", color: "#6c757d", fontWeight: "normal" }}>
              Backend Managed Videos &amp; Interactive Transcripts
            </span>
          </div>

          <div className="table-responsive-container">
            <table className="admin-glass-table">
              <thead>
                <tr>
                  <th>Video Title &amp; Excerpt</th>
                  <th>YouTube / Player Link</th>
                  <th>Playlist / Category</th>
                  <th>Transcript Notes</th>
                  <th>Author</th>
                  <th>Status</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedVideoBlogs.length === 0 ? (
                  <tr>
                    <td
                      colSpan={7}
                      className="admin-empty-cell text-center"
                      style={{ padding: "35px" }}
                    >
                      No video blogs found matching your criteria. Click{" "}
                      <strong>+ Add Video Blog</strong> to create one!
                    </td>
                  </tr>
                ) : (
                  paginatedVideoBlogs.map((b) => {
                    const embedUrl = getEmbeddableUrl(
                      b.video_embed_url || (b.videos?.[0] ?? "")
                    );
                    const lineCount = countTranscriptLines(b.video_transcript);

                    return (
                      <tr key={b.id}>
                        <td>
                          <div
                            className="table-service-info"
                            style={{ display: "flex", gap: "12px", alignItems: "center" }}
                          >
                            <div
                              style={{
                                width: "64px",
                                height: "36px",
                                borderRadius: "6px",
                                overflow: "hidden",
                                background: "#1e293b",
                                flexShrink: 0,
                                position: "relative",
                                border: "1px solid #e2e8f0",
                              }}
                            >
                              <img
                                src={b.image || "/images/insight_video.png"}
                                alt={b.title}
                                style={{
                                  width: "100%",
                                  height: "100%",
                                  objectFit: "cover",
                                }}
                                onError={(e) => {
                                  (e.target as HTMLElement).setAttribute(
                                    "src",
                                    "/images/insight_video.png"
                                  );
                                }}
                              />
                              <div
                                style={{
                                  position: "absolute",
                                  inset: 0,
                                  background: "rgba(0,0,0,0.3)",
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  color: "#fff",
                                  fontSize: "12px",
                                }}
                              >
                                ▶
                              </div>
                            </div>
                            <div>
                              <span className="service-name">
                                <strong>{b.title}</strong>
                              </span>
                              <div
                                style={{
                                  fontSize: "0.78rem",
                                  color: "#6c757d",
                                  maxWidth: "240px",
                                  overflow: "hidden",
                                  textOverflow: "ellipsis",
                                  whiteSpace: "nowrap",
                                }}
                              >
                                {b.content}
                              </div>
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
                                color: "#4f46e5",
                                textDecoration: "none",
                                fontWeight: "600",
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "4px",
                                background: "#eef2ff",
                                padding: "4px 8px",
                                borderRadius: "6px",
                              }}
                            >
                              ▶ Play Link
                            </a>
                          ) : (
                            <span style={{ color: "#dc3545", fontSize: "0.8rem" }}>
                              No Link
                            </span>
                          )}
                        </td>
                        <td>
                          <span
                            className="category-badge"
                            style={{
                              background: "#f3e8ff",
                              color: "#6b21a8",
                              borderColor: "#e9d5ff",
                            }}
                          >
                            {b.category || "Video Transcripts"}
                          </span>
                        </td>
                        <td>
                          <span
                            className="category-badge"
                            style={{
                              background: lineCount > 0 ? "#e0e7ff" : "#f1f5f9",
                              color: lineCount > 0 ? "#4338ca" : "#64748b",
                            }}
                          >
                            {lineCount > 0
                              ? `📜 ${lineCount} Timed Lines`
                              : "No Transcript"}
                          </span>
                        </td>
                        <td>
                          <div style={{ fontSize: "0.85rem" }}>
                            <strong>{b.author}</strong>
                            <div style={{ fontSize: "0.75rem", color: "#6c757d" }}>
                              {b.date}
                            </div>
                          </div>
                        </td>
                        <td>
                          <span
                            style={{
                              padding: "3px 8px",
                              borderRadius: "12px",
                              fontSize: "0.75rem",
                              fontWeight: "600",
                              background:
                                b.status === "draft" ? "#fef3c7" : "#dcfce7",
                              color:
                                b.status === "draft" ? "#92400e" : "#166534",
                            }}
                          >
                            {b.status === "draft" ? "🟡 Draft" : "🟢 Published"}
                          </span>
                        </td>
                        <td className="text-right">
                          <div
                            className="action-buttons-cell"
                            style={{
                              display: "flex",
                              gap: "4px",
                              justifyContent: "flex-end",
                            }}
                          >
                            <button
                              className="btn btn-primary btn-sm"
                              onClick={() =>
                                window.open(
                                  `/blog/${b.slug || b.id}`,
                                  "_blank"
                                )
                              }
                            >
                              👁 View
                            </button>
                            <button
                              className="btn btn-secondary btn-sm"
                              onClick={() => router.push(`/admin/video-blogs/edit/${b.id}`)}
                            >
                              ✎ Edit
                            </button>
                            <button
                              className="btn btn-danger btn-sm"
                              onClick={() =>
                                handleDeleteVideoBlog(b.id, b.title)
                              }
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

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="admin-pagination-wrapper">
              <span className="pagination-info">
                Showing{" "}
                {filteredVideoBlogs.length === 0
                  ? 0
                  : (currentPage - 1) * itemsPerPage + 1}{" "}
                to {Math.min(filteredVideoBlogs.length, currentPage * itemsPerPage)}{" "}
                of {filteredVideoBlogs.length} entries
              </span>
              <ul className="admin-pagination">
                <li className={`page-item ${currentPage === 1 ? "disabled" : ""}`}>
                  <button onClick={() => setCurrentPage(1)} disabled={currentPage === 1}>
                    «
                  </button>
                </li>
                <li className={`page-item ${currentPage === 1 ? "disabled" : ""}`}>
                  <button
                    onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                  >
                    Prev
                  </button>
                </li>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                  <li
                    key={pageNum}
                    className={`page-item ${currentPage === pageNum ? "active" : ""}`}
                  >
                    <button onClick={() => setCurrentPage(pageNum)}>{pageNum}</button>
                  </li>
                ))}
                <li
                  className={`page-item ${
                    currentPage === totalPages ? "disabled" : ""
                  }`}
                >
                  <button
                    onClick={() =>
                      setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                    }
                    disabled={currentPage === totalPages}
                  >
                    Next
                  </button>
                </li>
                <li
                  className={`page-item ${
                    currentPage === totalPages ? "disabled" : ""
                  }`}
                >
                  <button
                    onClick={() => setCurrentPage(totalPages)}
                    disabled={currentPage === totalPages}
                  >
                    »
                  </button>
                </li>
              </ul>
            </div>
          )}
        </Card>
      )}
    </div>
  );
}
