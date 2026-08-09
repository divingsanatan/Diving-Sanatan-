"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Blog, Practitioner, BlogCategory } from "@/types/database";
import { ImageCropperModal } from "@/components/ui/ImageCropperModal";
import StatsDashboard from "@/components/admin/StatsDashboard";

export default function AdminBlogsPage() {
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [practitioners, setPractitioners] = useState<Practitioner[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editBlogId, setEditBlogId] = useState<string | null>(null);

  // Tab state
  const [activeTab, setActiveTab] = useState<"articles" | "categories">("articles");

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
  const [section, setSection] = useState("");
  const [isShowFeaturedPage, setIsShowFeaturedPage] = useState(true);

  // Expanded SEO, E-E-A-T, Schema & Media states
  const [metaTitle, setMetaTitle] = useState("");
  const [metaDescription, setMetaDescription] = useState("");
  const [focusKeyword, setFocusKeyword] = useState("");
  const [canonicalUrl, setCanonicalUrl] = useState("");
  const [robotsDirective, setRobotsDirective] = useState("index, follow");
  const [slugInput, setSlugInput] = useState("");
  const [authorBio, setAuthorBio] = useState("");
  const [reviewedBy, setReviewedBy] = useState("");
  const [schemaType, setSchemaType] = useState<"Article" | "BlogPosting" | "FAQPage" | "HowTo">("Article");
  const [faqPairs, setFaqPairs] = useState<{ question: string; answer: string }[]>([]);
  const [tldr, setTldr] = useState("");
  const [featuredImageAlt, setFeaturedImageAlt] = useState("");
  const [ogImageOverride, setOgImageOverride] = useState("");
  const [videoEmbedUrl, setVideoEmbedUrl] = useState("");
  const [videoTranscript, setVideoTranscript] = useState("");
  const [tagsInput, setTagsInput] = useState("");
  const [pillarCluster, setPillarCluster] = useState("");
  const [pinnedArticlesInput, setPinnedArticlesInput] = useState("");
  const [status, setStatus] = useState<"draft" | "scheduled" | "published">("published");

  // Multiple media states
  const [galleryImages, setGalleryImages] = useState<string[]>([]);
  const [blogVideos, setBlogVideos] = useState<string[]>([]);
  const [uploadingGalleryIdx, setUploadingGalleryIdx] = useState<number | null>(null);
  const [uploadingVideoIdx, setUploadingVideoIdx] = useState<number | null>(null);

  // Cropping states
  const [cropImageSrc, setCropImageSrc] = useState<string | null>(null);
  const [cropType, setCropType] = useState<"cover" | "gallery" | null>(null);
  const [cropGalleryIdx, setCropGalleryIdx] = useState<number | null>(null);

  // Rich text editor ref
  const editorRef = useRef<HTMLDivElement>(null);
  const [editorReady, setEditorReady] = useState(false);
  const [isHtmlMode, setIsHtmlMode] = useState(false);

  // Blog Category states
  const [categories, setCategories] = useState<BlogCategory[]>([]);
  const [categoryName, setCategoryName] = useState("");
  const [editCategoryMode, setEditCategoryMode] = useState(false);
  const [editCategoryId, setEditCategoryId] = useState<string | null>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      const [bRes, pRes, cRes] = await Promise.all([
        fetch("/api/blogs"),
        fetch("/api/practitioners"),
        fetch("/api/blogs/categories")
      ]);

      const bJson = await bRes.json();
      const pJson = await pRes.json();
      const cJson = await cRes.json();

      if (bJson.success && pJson.success) {
        setBlogs(bJson.data);
        setPractitioners(pJson.data);
        setCurrentPage(1);
        if (pJson.data.length > 0 && !selectedPractitioner) {
          setSelectedPractitioner(pJson.data[0].name);
        }
      }

      if (cJson.success) {
        setCategories(cJson.data || []);
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

  const resetCategoryForm = () => {
    setCategoryName("");
    setEditCategoryMode(false);
    setEditCategoryId(null);
  };

  const handleEditCategory = (cat: BlogCategory) => {
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
      const url = "/api/blogs/categories";
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
        loadData();
      } else {
        alert(json.error || "Operation failed.");
      }
    } catch (err) {
      console.error(err);
      alert("Something went wrong. Please try again.");
    }
  };

  const handleDeleteCategory = async (id: string, name: string) => {
    if (!confirm(`Delete blog category "${name}"? This will set all matching blogs to category "Other".`)) return;
    try {
      const res = await fetch(`/api/blogs/categories?id=${encodeURIComponent(id)}`, { method: "DELETE" });
      const json = await res.json();
      if (json.success) {
        resetCategoryForm();
        loadData();
      } else {
        alert(json.error || "Failed to delete category.");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const resetForm = () => {
    setTitle("");
    setCategory(categories[0]?.name || "Other");
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
    setSection("");
    setIsShowFeaturedPage(true);

    setMetaTitle("");
    setMetaDescription("");
    setFocusKeyword("");
    setCanonicalUrl("");
    setRobotsDirective("index, follow");
    setSlugInput("");
    setAuthorBio("");
    setReviewedBy("");
    setSchemaType("Article");
    setFaqPairs([]);
    setTldr("");
    setFeaturedImageAlt("");
    setOgImageOverride("");
    setVideoEmbedUrl("");
    setVideoTranscript("");
    setTagsInput("");
    setPillarCluster("");
    setPinnedArticlesInput("");
    setStatus("published");

    setEditMode(false);
    setEditBlogId(null);
  };

  const [rewritingBlogId, setRewritingBlogId] = useState<string | null>(null);

  const handleSuggestRewrite = async (blogId: string) => {
    setRewritingBlogId(blogId);
    try {
      const res = await fetch("/api/seo/rewrite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ blogId })
      });
      const json = await res.json();
      if (json.success) {
        alert("✨ Rewrite suggestion generated! View and approve it in the SEO Command Center (/admin/seo-command).");
      } else {
        alert(json.error || "Failed to generate rewrite suggestion.");
      }
    } catch (err: any) {
      alert(err.message || "Failed to call rewrite API.");
    } finally {
      setRewritingBlogId(null);
    }
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

    const isStandardCategory = categories.some(c => c.name.toLowerCase() === blog.category.toLowerCase());
    if (isStandardCategory) {
      const matched = categories.find(c => c.name.toLowerCase() === blog.category.toLowerCase())?.name || blog.category;
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
    setSection(blog.section || "");
    setIsShowFeaturedPage(blog.is_show_featured_page !== false);

    setMetaTitle(blog.meta_title || "");
    setMetaDescription(blog.meta_description || "");
    setFocusKeyword(blog.focus_keyword || "");
    setCanonicalUrl(blog.canonical_url || "");
    setRobotsDirective(blog.robots_directive || "index, follow");
    setSlugInput(blog.slug || "");
    setAuthorBio(blog.author_bio || "");
    setReviewedBy(blog.reviewed_by || "");
    setSchemaType(blog.schema_type || "Article");
    setFaqPairs(Array.isArray(blog.faq_pairs) ? blog.faq_pairs : []);
    setTldr(blog.tldr || "");
    setFeaturedImageAlt(blog.featured_image_alt || "");
    setOgImageOverride(blog.og_image_override || "");
    setVideoEmbedUrl(blog.video_embed_url || "");
    setVideoTranscript(blog.video_transcript || "");
    setTagsInput(Array.isArray(blog.tags) ? blog.tags.join(", ") : "");
    setPillarCluster(blog.pillar_cluster || "");
    setPinnedArticlesInput(Array.isArray(blog.pinned_related_articles) ? blog.pinned_related_articles.join(", ") : "");
    setStatus(blog.status || "published");

    setIsModalOpen(true);
  };

  const handleContentChange = (val: string) => {
    setContent(val);
    const words = val.replace(/<[^>]*>/g, " ").trim().split(/\s+/).filter(Boolean).length;
    const computed = Math.max(1, Math.ceil(words / 200)) + " Min Read";
    setReadTime(computed);
  };

  // Sync editor innerHTML → content state
  const syncEditorContent = useCallback(() => {
    if (editorRef.current) {
      handleContentChange(editorRef.current.innerHTML);
    }
  }, []);

  // Populate editor when modal opens or toggles HTML mode
  useEffect(() => {
    if (isModalOpen && !isHtmlMode && editorRef.current) {
      editorRef.current.innerHTML = content || "";
      setEditorReady(true);
    }
    if (!isModalOpen) {
      setEditorReady(false);
      setIsHtmlMode(false);
    }
  }, [isModalOpen, isHtmlMode]);

  // RTE exec helper
  const execCmd = (cmd: string, value?: string) => {
    document.execCommand(cmd, false, value);
    editorRef.current?.focus();
    syncEditorContent();
  };

  const insertLink = () => {
    const url = window.prompt("Enter URL:", "https://");
    if (url) execCmd("createLink", url);
  };

  const handleCategoryChange = (val: string) => {
    setCategory(val);
    setShowCustomCategory(val === "Other");
  };

  // Main Cover Image Select & Crop Handlers
  const handleCoverImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      setCropImageSrc(reader.result as string);
      setCropType("cover");
      setCropGalleryIdx(null);
    };
    reader.readAsDataURL(file);
    e.target.value = "";
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

  const handleGalleryImageSelect = (e: React.ChangeEvent<HTMLInputElement>, idx: number) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      setCropImageSrc(reader.result as string);
      setCropType("gallery");
      setCropGalleryIdx(idx);
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const handleCropComplete = async (croppedFile: File) => {
    if (!cropType) return;

    const formData = new FormData();
    formData.append("file", croppedFile);

    if (cropType === "cover") {
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
        setCropImageSrc(null);
        setCropType(null);
      }
    } else if (cropType === "gallery" && cropGalleryIdx !== null) {
      setUploadingGalleryIdx(cropGalleryIdx);
      try {
        const res = await fetch("/api/upload", {
          method: "POST",
          body: formData
        });
        const json = await res.json();
        if (json.success) {
          handleUpdateGalleryImage(cropGalleryIdx, json.url);
        } else {
          alert("Upload failed: " + json.error);
        }
      } catch (err) {
        console.error(err);
        alert("An error occurred during file upload.");
      } finally {
        setUploadingGalleryIdx(null);
        setCropImageSrc(null);
        setCropType(null);
        setCropGalleryIdx(null);
      }
    }
  };

  const handleCropCancel = () => {
    setCropImageSrc(null);
    setCropType(null);
    setCropGalleryIdx(null);
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
      slug: slugInput.trim(),
      category: finalCategory,
      author: finalAuthor,
      content: content.trim(),
      date,
      readTime,
      image: image.trim(),
      images: galleryImages.filter(img => img.trim() !== ""),
      videos: blogVideos.filter(vid => vid.trim() !== ""),
      section: section || null,
      is_show_featured_page: isShowFeaturedPage,
      meta_title: metaTitle.trim(),
      meta_description: metaDescription.trim(),
      focus_keyword: focusKeyword.trim(),
      canonical_url: canonicalUrl.trim(),
      robots_directive: robotsDirective,
      author_bio: authorBio.trim(),
      reviewed_by: reviewedBy.trim(),
      schema_type: schemaType,
      faq_pairs: faqPairs,
      tldr: tldr.trim(),
      featured_image_alt: featuredImageAlt.trim(),
      og_image_override: ogImageOverride.trim(),
      video_embed_url: videoEmbedUrl.trim(),
      video_transcript: videoTranscript.trim(),
      tags: tagsInput.split(",").map(t => t.trim()).filter(Boolean),
      pillar_cluster: pillarCluster.trim(),
      pinned_related_articles: pinnedArticlesInput.split(",").map(p => p.trim()).filter(Boolean),
      status
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
      <StatsDashboard
        pageType="blogs"
        actions={
          <div className="header-actions">
            {activeTab === "articles" ? (
              <>
                <button className="sync-btn" onClick={loadData}>
                  🔄 Refresh Publications
                </button>
                <Button variant="gold" onClick={handleOpenCreateModal}>
                  ➕ Add Article
                </Button>
              </>
            ) : (
              <button className="sync-btn" onClick={loadData}>
                🔄 Refresh Categories
              </button>
            )}
          </div>
        }
      />

      <div className="tabs-header">
        <button
          type="button"
          className={`tab-btn ${activeTab === "articles" ? "active" : ""}`}
          onClick={() => {
            setActiveTab("articles");
            setCurrentPage(1);
          }}
        >
          Articles ({filteredBlogs.length})
        </button>
        <button
          type="button"
          className={`tab-btn ${activeTab === "categories" ? "active" : ""}`}
          onClick={() => setActiveTab("categories")}
        >
          Categories ({categories.length})
        </button>
      </div>

      {activeTab === "articles" ? (
        <>
          <div className="search-bar-row">
            <input
              type="text"
              placeholder="Search articles by title, author, category..."
              className="form-control search-blogs-input"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
            />
          </div>

          {loading ? (
            <p className="admin-loading">Loading publication catalog...</p>
          ) : (() => {
            const totalPages = Math.ceil(filteredBlogs.length / itemsPerPage);
            const paginatedBlogs = filteredBlogs.slice(
              (currentPage - 1) * itemsPerPage,
              currentPage * itemsPerPage
            );
            return (
              <div className="admin-split-layout">
                <div className="split-list-col">
                  <Card variant="glass" className="card-primary" style={{ padding: "0 !important" }}>
                    <div style={{ borderBottom: "1px solid #dee2e6", padding: "12px 20px", background: "#f8f9fa", fontWeight: "700" }}>
                      Articles List ({filteredBlogs.length})
                    </div>
                    <div className="table-responsive-container">
                      <table className="admin-glass-table">
                        <thead>
                          <tr>
                            <th>Article Details</th>
                            <th>Category</th>
                            <th>Featured Section</th>
                            <th>Author</th>
                            <th>Read Estimate</th>
                            <th>Date</th>
                            <th className="text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {paginatedBlogs.length === 0 ? (
                            <tr>
                              <td colSpan={7} className="admin-empty-cell text-center" style={{ padding: "20px" }}>
                                No matching articles found in catalog.
                              </td>
                            </tr>
                          ) : (
                            paginatedBlogs.map(b => (
                              <tr key={b.id}>
                                <td>
                                  <div className="table-service-info">
                                    <span className="service-name"><strong>{b.title}</strong></span>
                                    <div className="service-desc-tooltip" title={b.content} style={{ fontSize: "0.78rem", color: "#6c757d", maxWidth: "250px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                      {b.content.replace(/<[^>]*>/g, " ").substring(0, 80)}...
                                    </div>
                                  </div>
                                </td>
                                <td>
                                  <span className="category-badge">{b.category}</span>
                                </td>
                                <td>
                                  {b.section ? (
                                    <span className="category-badge" style={{ background: "#cce5ff", color: "#004085", borderColor: "#b8daff" }}>{b.section}</span>
                                  ) : (
                                    <span style={{ fontSize: "0.8rem", color: "#adb5bd", fontStyle: "italic" }}>Regular Feed</span>
                                  )}
                                </td>
                                <td>
                                  <span>{b.author}</span>
                                </td>
                                <td>
                                  <span>⏱️ {b.readTime}</span>
                                </td>
                                <td style={{ whiteSpace: "nowrap" }}>
                                  <span>{b.date}</span>
                                </td>
                                <td className="text-right">
                                  <div className="action-buttons-cell" style={{ display: "flex", gap: "4px", justifyContent: "flex-end" }}>
                                    <button className="btn btn-primary btn-sm" onClick={() => window.open(`/blog/${b.id}`, '_blank')}>
                                      👁 View
                                    </button>
                                    <button
                                      className="btn btn-sm"
                                      style={{ background: "#6366f1", color: "#fff", border: "none" }}
                                      disabled={rewritingBlogId === b.id}
                                      onClick={() => handleSuggestRewrite(b.id)}
                                      title="Ask native AI agent to analyze and suggest an E-E-A-T optimized rewrite"
                                    >
                                      {rewritingBlogId === b.id ? "…" : "✨ Rewrite"}
                                    </button>
                                    <button className="btn btn-secondary btn-sm" onClick={() => handleOpenEditModal(b)}>
                                      ✎ Edit
                                    </button>
                                    <button className="btn btn-danger btn-sm" onClick={() => handleDeleteBlog(b.id)}>
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

                    {/* Pagination Controls */}
                    {totalPages > 1 && (
                      <div className="admin-pagination-wrapper">
                        <span className="pagination-info">
                          Showing {filteredBlogs.length === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1} to {Math.min(filteredBlogs.length, currentPage * itemsPerPage)} of {filteredBlogs.length} entries
                        </span>
                        <ul className="admin-pagination">
                          <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
                            <button onClick={() => setCurrentPage(1)} disabled={currentPage === 1}>«</button>
                          </li>
                          <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
                            <button onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))} disabled={currentPage === 1}>Prev</button>
                          </li>
                          {Array.from({ length: totalPages }, (_, i) => i + 1).map(pageNum => (
                            <li key={pageNum} className={`page-item ${currentPage === pageNum ? 'active' : ''}`}>
                              <button onClick={() => setCurrentPage(pageNum)}>{pageNum}</button>
                            </li>
                          ))}
                          <li className={`page-item ${currentPage === totalPages ? 'disabled' : ''}`}>
                            <button onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))} disabled={currentPage === totalPages}>Next</button>
                          </li>
                          <li className={`page-item ${currentPage === totalPages ? 'disabled' : ''}`}>
                            <button onClick={() => setCurrentPage(totalPages)} disabled={currentPage === totalPages}>»</button>
                          </li>
                        </ul>
                      </div>
                    )}
                  </Card>
                </div>
              </div>
            );
          })()}
        </>
      ) : (
        <div className="admin-split-layout">
          {/* List Table */}
          <div className="split-list-col">
            <Card variant="glass" className="card-primary" style={{ padding: "0 !important" }}>
              <div style={{ borderBottom: "1px solid #dee2e6", padding: "12px 20px", background: "#f8f9fa", fontWeight: "700" }}>
                Categories List ({categories.length})
              </div>
              <div className="table-responsive-container">
                <table className="admin-glass-table">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Category Name</th>
                      <th className="text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {categories.length === 0 ? (
                      <tr>
                        <td colSpan={3} className="text-center" style={{ padding: "20px" }}>No categories created yet.</td>
                      </tr>
                    ) : (
                      categories.map(cat => (
                        <tr key={cat.id}>
                          <td style={{ fontFamily: "monospace", fontSize: "0.85rem" }}>{cat.id}</td>
                          <td><strong>{cat.name}</strong></td>
                          <td className="text-right">
                            <div className="action-buttons-cell" style={{ display: "flex", gap: "4px", justifyContent: "flex-end" }}>
                              <button
                                className="btn btn-secondary btn-sm"
                                onClick={() => handleEditCategory(cat)}
                              >
                                ✎ Edit
                              </button>
                              <button
                                className="btn btn-danger btn-sm"
                                onClick={() => handleDeleteCategory(cat.id, cat.name)}
                              >
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
            </Card>
          </div>

          {/* Form */}
          <div className="split-form-col">
            <Card variant="glass" className="card-success" style={{ padding: "0 !important" }}>
              <div style={{ borderBottom: "1px solid #dee2e6", padding: "12px 20px", background: "#f8f9fa", fontWeight: "700" }}>
                {editCategoryMode ? "Edit Category" : "Create Category"}
              </div>
              <div style={{ padding: "20px" }}>
                <form onSubmit={handleCategorySubmit} className="admin-catalog-form">
                  <div className="form-group">
                    <label>Category Name *</label>
                    <input
                      type="text"
                      className="glass-input"
                      required
                      placeholder="e.g. Breathwork"
                      value={categoryName}
                      onChange={(e) => setCategoryName(e.target.value)}
                    />
                  </div>

                  <div style={{ display: "flex", gap: "10px", marginTop: "1.5rem" }}>
                    {editCategoryMode && (
                      <button
                        type="button"
                        className="btn btn-secondary"
                        onClick={resetCategoryForm}
                        style={{ flex: 1 }}
                      >
                        Cancel
                      </button>
                    )}
                    <Button variant="gold" type="submit" style={{ flex: 2, width: "100%" }}>
                      {editCategoryMode ? "Update Category" : "Create Category"}
                    </Button>
                  </div>
                </form>
              </div>
            </Card>
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
              <h3 className="column-title column-title-spaced">
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
                  <div className="form-group form-group-flex">
                    <label>Category *</label>
                    <select
                      className="glass-input"
                      value={category}
                      onChange={(e) => handleCategoryChange(e.target.value)}
                    >
                      {categories.map(cat => (
                        <option key={cat.id} value={cat.name}>{cat.name}</option>
                      ))}
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  {showCustomCategory && (
                    <div className="form-group form-group-flex">
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
                  <div className="form-group form-group-flex">
                    <label>Author Source *</label>
                    <div className="flex-row-gap">
                      <label className="radio-label">
                        <input
                          type="radio"
                          name="authorType"
                          checked={authorType === "practitioner"}
                          onChange={() => setAuthorType("practitioner")}
                        />
                        Practitioner
                      </label>
                      <label className="radio-label">
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

                  <div className="form-group form-group-flex-wide">
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
                  <div className="form-group form-group-flex">
                    <label>Release Date *</label>
                    <input
                      type="date"
                      className="glass-input"
                      required
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                    />
                  </div>
                  <div className="form-group form-group-flex">
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

                <div className="form-group">
                  <label>Featured Section (Homepage Layout Placement)</label>
                  <select
                    className="glass-input"
                    value={section}
                    onChange={(e) => setSection(e.target.value)}
                  >
                    <option value="">None (Regular Feed)</option>
                    <option value="recommended">Recommended Blogs</option>
                    <option value="practice">"Practice with us" Carousel</option>
                    <option value="discuss">"Discuss with us" Carousel</option>
                  </select>
                </div>

                <div className="form-group" style={{ width: "100%" }}>
                  <label
                    className="toggle-row"
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      width: "100%",
                      padding: "10px 14px",
                      background: "rgba(255, 255, 255, 0.8)",
                      border: "1px solid rgba(0, 0, 0, 0.05)",
                      borderRadius: "8px",
                      cursor: "pointer",
                      marginTop: "4px"
                    }}
                  >
                    <span className="toggle-label-text" style={{ fontSize: "0.85rem", fontWeight: 600, color: "#334155", userSelect: "none" }}>
                      Show Article Cover Image on Details/Description Page
                    </span>
                    <div className="toggle-switch" style={{ position: "relative", display: "inline-block", width: "40px", height: "22px", flexShrink: 0 }}>
                      <input
                        type="checkbox"
                        checked={isShowFeaturedPage}
                        onChange={(e) => setIsShowFeaturedPage(e.target.checked)}
                        style={{ opacity: 0, width: 0, height: 0, position: "absolute" }}
                      />
                      <span className="toggle-slider"></span>
                    </div>
                  </label>
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
                        onChange={handleCoverImageSelect}
                        className="hidden-file-input"
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
                  <div className="flex-between">
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
                              onChange={(e) => handleGalleryImageSelect(e, idx)}
                              className="hidden-file-input"
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
                  <div className="flex-between">
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
                              className="hidden-file-input"
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

                  {/* ── Rich Text Editor ── */}
                  <div className="rte-wrapper">

                    {/* Toolbar */}
                    <div className="rte-toolbar">
                      <div className="rte-toolbar-group">
                        <button type="button" className="rte-btn" disabled={isHtmlMode} title="Bold" onMouseDown={(e) => { e.preventDefault(); if (!isHtmlMode) execCmd("bold"); }}><b>B</b></button>
                        <button type="button" className="rte-btn" disabled={isHtmlMode} title="Italic" onMouseDown={(e) => { e.preventDefault(); if (!isHtmlMode) execCmd("italic"); }}><i>I</i></button>
                        <button type="button" className="rte-btn" disabled={isHtmlMode} title="Underline" onMouseDown={(e) => { e.preventDefault(); if (!isHtmlMode) execCmd("underline"); }}><u>U</u></button>
                        <button type="button" className="rte-btn" disabled={isHtmlMode} title="Strikethrough" onMouseDown={(e) => { e.preventDefault(); if (!isHtmlMode) execCmd("strikeThrough"); }}><s>S</s></button>
                      </div>
                      <div className="rte-toolbar-divider" />
                      <div className="rte-toolbar-group">
                        <button type="button" className="rte-btn rte-btn-text" disabled={isHtmlMode} title="Heading 2" onMouseDown={(e) => { e.preventDefault(); if (!isHtmlMode) execCmd("formatBlock", "H2"); }}>H2</button>
                        <button type="button" className="rte-btn rte-btn-text" disabled={isHtmlMode} title="Heading 3" onMouseDown={(e) => { e.preventDefault(); if (!isHtmlMode) execCmd("formatBlock", "H3"); }}>H3</button>
                        <button type="button" className="rte-btn rte-btn-text" disabled={isHtmlMode} title="Paragraph" onMouseDown={(e) => { e.preventDefault(); if (!isHtmlMode) execCmd("formatBlock", "P"); }}>¶</button>
                      </div>
                      <div className="rte-toolbar-divider" />
                      <div className="rte-toolbar-group">
                        <button type="button" className="rte-btn" disabled={isHtmlMode} title="Bullet List" onMouseDown={(e) => { e.preventDefault(); if (!isHtmlMode) execCmd("insertUnorderedList"); }}>≡</button>
                        <button type="button" className="rte-btn" disabled={isHtmlMode} title="Numbered List" onMouseDown={(e) => { e.preventDefault(); if (!isHtmlMode) execCmd("insertOrderedList"); }}>1.</button>
                        <button type="button" className="rte-btn" disabled={isHtmlMode} title="Blockquote" onMouseDown={(e) => { e.preventDefault(); if (!isHtmlMode) execCmd("formatBlock", "BLOCKQUOTE"); }}>"</button>
                      </div>
                      <div className="rte-toolbar-divider" />
                      <div className="rte-toolbar-group">
                        <button type="button" className="rte-btn" disabled={isHtmlMode} title="Insert Link" onMouseDown={(e) => { e.preventDefault(); if (!isHtmlMode) insertLink(); }}>🔗</button>
                        <button type="button" className="rte-btn" disabled={isHtmlMode} title="Unlink" onMouseDown={(e) => { e.preventDefault(); if (!isHtmlMode) execCmd("unlink"); }}>🚫</button>
                        <button type="button" className="rte-btn rte-btn-danger" disabled={isHtmlMode} title="Clear Formatting" onMouseDown={(e) => { e.preventDefault(); if (!isHtmlMode) execCmd("removeFormat"); }}>✕</button>
                      </div>
                      <div className="rte-toolbar-divider" />
                      <div className="rte-toolbar-group" style={{ marginLeft: "auto" }}>
                        <button
                          type="button"
                          className={`rte-btn rte-btn-text ${isHtmlMode ? "rte-btn-active" : ""}`}
                          style={{
                            width: "auto",
                            padding: "0 10px",
                            height: "28px",
                            background: isHtmlMode ? "rgba(124, 58, 237, 0.12)" : "transparent",
                            border: "1px solid",
                            borderColor: isHtmlMode ? "rgba(124, 58, 237, 0.3)" : "rgba(0, 0, 0, 0.08)",
                            borderRadius: "6px",
                            color: isHtmlMode ? "#7c3aed" : "#475569",
                            fontWeight: 600,
                            display: "flex",
                            alignItems: "center",
                            gap: "4px"
                          }}
                          onClick={() => setIsHtmlMode(!isHtmlMode)}
                          title="Switch between Rich Text and Raw HTML"
                        >
                          {isHtmlMode ? "✍️ Visual Editor" : "HTML Mode"}
                        </button>
                      </div>
                    </div>

                    {/* Editable area */}
                    {isHtmlMode ? (
                      <textarea
                        className="rte-editable rte-html-textarea"
                        value={content}
                        onChange={(e) => handleContentChange(e.target.value)}
                        placeholder="Draft the article HTML here..."
                      />
                    ) : (
                      <div
                        ref={editorRef}
                        className="rte-editable"
                        contentEditable
                        suppressContentEditableWarning
                        onInput={syncEditorContent}
                        onBlur={syncEditorContent}
                        data-placeholder="Draft the article content here — use the toolbar above for formatting..."
                      />
                    )}

                    {/* Hidden input to satisfy required validation */}
                    <input
                      type="text"
                      required
                      value={content}
                      onChange={() => { }}
                      tabIndex={-1}
                      className="visually-hidden-input"
                    />
                  </div>

                  <small className="form-hint">
                    Word Count: {content.replace(/<[^>]*>/g, " ").trim().split(/\s+/).filter(Boolean).length} words
                  </small>
                </div>

                {/* ════ SEO & E-E-A-T METADATA SECTION ════ */}
                <div style={{ marginTop: 24, paddingTop: 20, borderTop: "2px dashed rgba(203, 213, 225, 0.6)" }}>
                  <h4 style={{ margin: "0 0 16px", color: "#6366f1", fontSize: "0.98rem", fontWeight: 700, display: "flex", alignItems: "center", gap: 6 }}>
                    🎯 SEO, E-E-A-T & Structured Data (Search Engine Optimization)
                  </h4>

                  {/* SEO Meta */}
                  <div className="form-group">
                    <label>Meta Title (Search Result Title)</label>
                    <input
                      type="text"
                      className="glass-input"
                      placeholder="e.g. Complete Guide to Root Chakra Balancing | Diving Sanatan"
                      value={metaTitle}
                      onChange={(e) => setMetaTitle(e.target.value)}
                    />
                  </div>

                  <div className="form-group">
                    <label>Meta Description (Snippet Summary)</label>
                    <textarea
                      className="glass-input"
                      rows={2}
                      placeholder="e.g. Discover authentic chakra balancing techniques to release stress and align your energy centers."
                      value={metaDescription}
                      onChange={(e) => setMetaDescription(e.target.value)}
                    />
                  </div>

                  <div className="form-row">
                    <div className="form-group form-group-flex">
                      <label>Focus Keyword</label>
                      <input
                        type="text"
                        className="glass-input"
                        placeholder="e.g. chakra healing Bhopal"
                        value={focusKeyword}
                        onChange={(e) => setFocusKeyword(e.target.value)}
                      />
                    </div>
                    <div className="form-group form-group-flex">
                      <label>Robots Directive</label>
                      <select
                        className="glass-input"
                        value={robotsDirective}
                        onChange={(e) => setRobotsDirective(e.target.value)}
                      >
                        <option value="index, follow">index, follow (Default)</option>
                        <option value="noindex, follow">noindex, follow</option>
                        <option value="index, nofollow">index, nofollow</option>
                        <option value="noindex, nofollow">noindex, nofollow</option>
                      </select>
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group form-group-flex">
                      <label>URL Slug (Editable)</label>
                      <input
                        type="text"
                        className="glass-input"
                        placeholder="e.g. root-chakra-healing-guide"
                        value={slugInput}
                        onChange={(e) => setSlugInput(e.target.value)}
                      />
                      <small style={{ fontSize: "0.7rem", color: "#64748b" }}>
                        Note: Changing slug automatically logs a 301 redirect from the old slug.
                      </small>
                    </div>
                    <div className="form-group form-group-flex">
                      <label>Canonical URL Override</label>
                      <input
                        type="text"
                        className="glass-input"
                        placeholder="https://divingsanatan.online/blog/..."
                        value={canonicalUrl}
                        onChange={(e) => setCanonicalUrl(e.target.value)}
                      />
                    </div>
                  </div>

                  {/* Trust & E-E-A-T */}
                  <div className="form-row">
                    <div className="form-group form-group-flex">
                      <label>Author Bio & Credentials (E-E-A-T)</label>
                      <input
                        type="text"
                        className="glass-input"
                        placeholder="e.g. Somatic energy healer with 12+ years experience in Bhopal"
                        value={authorBio}
                        onChange={(e) => setAuthorBio(e.target.value)}
                      />
                    </div>
                    <div className="form-group form-group-flex">
                      <label>Reviewed By (Medical / Holistic Expert)</label>
                      <input
                        type="text"
                        className="glass-input"
                        placeholder="e.g. Dr. Elara Vance, Senior Holistics Specialist"
                        value={reviewedBy}
                        onChange={(e) => setReviewedBy(e.target.value)}
                      />
                    </div>
                  </div>

                  {/* Structured Data & TL;DR */}
                  <div className="form-row">
                    <div className="form-group form-group-flex">
                      <label>Schema Type Selector</label>
                      <select
                        className="glass-input"
                        value={schemaType}
                        onChange={(e: any) => setSchemaType(e.target.value)}
                      >
                        <option value="Article">Article</option>
                        <option value="BlogPosting">BlogPosting</option>
                        <option value="FAQPage">FAQPage</option>
                        <option value="HowTo">HowTo</option>
                      </select>
                    </div>
                    <div className="form-group form-group-flex">
                      <label>Publish Status</label>
                      <select
                        className="glass-input"
                        value={status}
                        onChange={(e: any) => setStatus(e.target.value)}
                      >
                        <option value="published">Published</option>
                        <option value="scheduled">Scheduled</option>
                        <option value="draft">Draft</option>
                      </select>
                    </div>
                  </div>

                  <div className="form-group">
                    <label>Direct Answer / TL;DR Block (Quoted by AI Models)</label>
                    <textarea
                      className="glass-input"
                      rows={2}
                      placeholder="A short 2-3 sentence key takeaway summary placed at top of article."
                      value={tldr}
                      onChange={(e) => setTldr(e.target.value)}
                    />
                  </div>

                  {/* Media Alt & Video Embed */}
                  <div className="form-row">
                    <div className="form-group form-group-flex">
                      <label>Featured Image Alt Text (Required for Accessibility)</label>
                      <input
                        type="text"
                        className="glass-input"
                        placeholder="Descriptive alt text for search crawlers"
                        value={featuredImageAlt}
                        onChange={(e) => setFeaturedImageAlt(e.target.value)}
                      />
                    </div>
                    <div className="form-group form-group-flex">
                      <label>OG Social Image Preview URL</label>
                      <input
                        type="text"
                        className="glass-input"
                        placeholder="Defaults to cover image if empty"
                        value={ogImageOverride}
                        onChange={(e) => setOgImageOverride(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label>Video Embed URL</label>
                    <input
                      type="text"
                      className="glass-input"
                      placeholder="e.g. https://www.youtube.com/embed/..."
                      value={videoEmbedUrl}
                      onChange={(e) => setVideoEmbedUrl(e.target.value)}
                    />
                  </div>

                  <div className="form-group">
                    <label>Video Transcript (SEO Indexing)</label>
                    <textarea
                      className="glass-input"
                      rows={2}
                      placeholder="Full text transcript of embedded video for search indexing..."
                      value={videoTranscript}
                      onChange={(e) => setVideoTranscript(e.target.value)}
                    />
                  </div>

                  {/* Taxonomy & Pillars */}
                  <div className="form-row">
                    <div className="form-group form-group-flex">
                      <label>Tags (Comma Separated)</label>
                      <input
                        type="text"
                        className="glass-input"
                        placeholder="e.g. chakras, meditation, reiki, wellness"
                        value={tagsInput}
                        onChange={(e) => setTagsInput(e.target.value)}
                      />
                    </div>
                    <div className="form-group form-group-flex">
                      <label>Topic Cluster / Pillar Association</label>
                      <input
                        type="text"
                        className="glass-input"
                        placeholder="e.g. Anxiety & Overthinking Cluster"
                        value={pillarCluster}
                        onChange={(e) => setPillarCluster(e.target.value)}
                      />
                    </div>
                  </div>
                </div>

                <Button variant="gold" type="submit" className="btn-full-mt">
                  {editMode ? "Save Changes" : "Publish Article"}
                </Button>
              </form>
            </Card>
          </div>
        </div>
      )}

      {cropImageSrc && (
        <ImageCropperModal
          imageSrc={cropImageSrc}
          aspectRatio={cropType === "cover" ? "16:9" : "1:1"}
          title={cropType === "cover" ? "Crop Cover Image (16:9)" : "Crop Gallery Image (1:1)"}
          onCropComplete={handleCropComplete}
          onCancel={handleCropCancel}
        />
      )}

      <style jsx>{`
        .dashboard-content {
          display: flex;
          flex-direction: column;
          gap: 32px;
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
        .section-badge {
          background: rgba(217, 119, 6, 0.08);
          border: 1px solid rgba(217, 119, 6, 0.2);
          color: #d97706;
          padding: 3px 8px;
          border-radius: 99px;
          font-size: 0.75rem;
          font-weight: 600;
          white-space: nowrap;
          text-transform: capitalize;
          display: inline-block;
        }
        @media (max-width: 640px) {
          .form-row {
            flex-direction: column;
            gap: 16px;
          }
        }

        /* ── Toggle Switch ── */
        :global(.admin-lte-theme .form-group label.toggle-row) {
          display: flex !important;
          align-items: center !important;
          justify-content: space-between !important;
          width: 100% !important;
          padding: 10px 14px !important;
          background: rgba(255, 255, 255, 0.8) !important;
          border: 1px solid var(--border-glass) !important;
          border-radius: 8px !important;
          cursor: pointer !important;
          transition: var(--transition-fast) !important;
          margin-top: 4px !important;
        }
        :global(.admin-lte-theme .form-group label.toggle-row:hover) {
          background: #ffffff !important;
          border-color: #7c3aed !important;
          box-shadow: 0 0 8px rgba(124, 58, 237, 0.05) !important;
        }
        :global(.toggle-label-text) {
          font-size: 0.85rem !important;
          font-weight: 600 !important;
          color: #334155 !important;
          user-select: none !important;
        }
        :global(.toggle-switch) {
          position: relative !important;
          display: inline-block !important;
          width: 40px !important;
          height: 22px !important;
          flex-shrink: 0 !important;
        }
        :global(.toggle-switch input) {
          opacity: 0 !important;
          width: 0 !important;
          height: 0 !important;
          position: absolute !important;
        }
        :global(.toggle-slider) {
          position: absolute !important;
          cursor: pointer !important;
          top: 0 !important;
          left: 0 !important;
          right: 0 !important;
          bottom: 0 !important;
          background-color: #cbd5e1 !important;
          transition: .25s ease-in-out !important;
          border-radius: 22px !important;
        }
        :global(.toggle-slider:before) {
          position: absolute !important;
          content: "" !important;
          height: 16px !important;
          width: 16px !important;
          left: 3px !important;
          bottom: 3px !important;
          background-color: white !important;
          transition: .25s ease-in-out !important;
          border-radius: 50% !important;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.15) !important;
        }
        :global(.toggle-switch input:checked + .toggle-slider) {
          background-color: #7c3aed !important;
        }
        :global(.toggle-switch input:checked + .toggle-slider:before) {
          transform: translateX(18px) !important;
        }

        /* ── Rich Text Editor ── */
        .rte-wrapper {
          border: 1.5px solid var(--border-glass);
          border-radius: 12px;
          overflow: hidden;
          background: rgba(255, 255, 255, 0.85);
          box-shadow: 0 2px 12px rgba(0,0,0,0.04);
          transition: border-color 0.2s ease, box-shadow 0.2s ease;
        }
        .rte-wrapper:focus-within {
          border-color: #a855f7;
          box-shadow: 0 0 0 3px rgba(168, 85, 247, 0.1);
        }
        .rte-toolbar {
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          gap: 2px;
          padding: 8px 10px;
          background: rgba(248, 245, 255, 0.9);
          border-bottom: 1.5px solid rgba(168, 85, 247, 0.1);
        }
        .rte-toolbar-group {
          display: flex;
          align-items: center;
          gap: 2px;
        }
        .rte-toolbar-divider {
          width: 1px;
          height: 20px;
          background: rgba(0,0,0,0.1);
          margin: 0 6px;
          flex-shrink: 0;
        }
        .rte-btn {
          background: transparent;
          border: 1px solid transparent;
          border-radius: 6px;
          width: 30px;
          height: 28px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 0.85rem;
          color: #475569;
          cursor: pointer;
          transition: all 0.15s ease;
          padding: 0;
          line-height: 1;
        }
        .rte-btn-text {
          width: auto;
          padding: 0 7px;
          font-size: 0.75rem;
          font-weight: 700;
          letter-spacing: 0.02em;
        }
        .rte-btn:hover {
          background: rgba(124, 58, 237, 0.08);
          border-color: rgba(124, 58, 237, 0.2);
          color: #7c3aed;
        }
        .rte-btn-danger:hover {
          background: rgba(239, 68, 68, 0.08);
          border-color: rgba(239, 68, 68, 0.2);
          color: #ef4444;
        }
        .rte-btn:disabled {
          opacity: 0.4;
          cursor: not-allowed;
          pointer-events: none;
        }
        .rte-html-textarea {
          border: none;
          resize: vertical;
          font-family: 'Fira Code', 'Courier New', Courier, monospace;
          font-size: 0.85rem;
          background: #f8fafc;
          color: #0f172a;
          line-height: 1.6;
          white-space: pre-wrap;
        }
        .rte-editable {
          min-height: 260px;
          max-height: 500px;
          overflow-y: auto;
          padding: 16px 18px;
          font-family: var(--font-sans);
          font-size: 0.92rem;
          line-height: 1.8;
          color: #1e293b;
          outline: none;
          word-break: break-word;
        }
        .rte-editable:empty:before {
          content: attr(data-placeholder);
          color: #94a3b8;
          pointer-events: none;
          font-style: italic;
        }
        /* Typography inside editor */
        .rte-editable h2 {
          font-size: 1.35rem;
          font-weight: 700;
          color: #4c1d95;
          margin: 14px 0 6px;
          font-family: var(--font-serif);
        }
        .rte-editable h3 {
          font-size: 1.1rem;
          font-weight: 700;
          color: #5b21b6;
          margin: 12px 0 4px;
        }
        .rte-editable blockquote {
          border-left: 3px solid #7c3aed;
          margin: 10px 0;
          padding: 8px 16px;
          background: rgba(168, 85, 247, 0.04);
          border-radius: 0 8px 8px 0;
          color: #4c1d95;
          font-style: italic;
        }
        .rte-editable ul {
          list-style: disc;
          padding-left: 24px;
          margin: 8px 0;
        }
        .rte-editable ol {
          list-style: decimal;
          padding-left: 24px;
          margin: 8px 0;
        }
        .rte-editable a {
          color: #7c3aed;
          text-decoration: underline;
        }
        .rte-editable b, .rte-editable strong { font-weight: 700; }
        .rte-editable i, .rte-editable em { font-style: italic; }
        .rte-editable u { text-decoration: underline; }
        .rte-editable s { text-decoration: line-through; }
      `}</style>
    </div>
  );
}
