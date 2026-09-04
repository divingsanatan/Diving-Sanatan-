"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { ImageCropperModal } from "@/components/ui/ImageCropperModal";
import { Blog, Practitioner } from "@/types/database";
import RichTextEditor from "@/components/ui/RichTextEditor";

interface VideoBlogFormProps {
  initialData?: Blog | null;
  isEdit?: boolean;
}

export default function VideoBlogForm({ initialData, isEdit = false }: VideoBlogFormProps) {
  const router = useRouter();

  const [practitioners, setPractitioners] = useState<Practitioner[]>([]);
  const [loadingPractitioners, setLoadingPractitioners] = useState(true);
  const [saving, setSaving] = useState(false);

  // Form states
  const [title, setTitle] = useState(initialData?.title || "");
  const [slugInput, setSlugInput] = useState(initialData?.slug || "");
  const [category, setCategory] = useState(initialData?.category || "Video Transcripts");
  const [customCategory, setCustomCategory] = useState("");
  const [showCustomCategory, setShowCustomCategory] = useState(false);

  const [authorType, setAuthorType] = useState<"practitioner" | "custom">("practitioner");
  const [selectedPractitioner, setSelectedPractitioner] = useState(initialData?.author || "");
  const [customAuthor, setCustomAuthor] = useState("");

  const [videoEmbedUrl, setVideoEmbedUrl] = useState(
    initialData?.video_embed_url || (initialData?.videos?.[0] ?? "")
  );
  const [videoTranscript, setVideoTranscript] = useState(initialData?.video_transcript || "");
  const [content, setContent] = useState(initialData?.content || "");
  const [date, setDate] = useState(
    initialData?.date || new Date().toISOString().split("T")[0]
  );
  const [readTime, setReadTime] = useState(initialData?.readTime || "5 Min Watch");
  const [image, setImage] = useState(initialData?.image || "/images/insight_video.png");
  const [status, setStatus] = useState<"published" | "draft">(
    (initialData?.status as "published" | "draft") || "published"
  );

  // Cropping and Video upload states
  const [cropImageSrc, setCropImageSrc] = useState<string | null>(null);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [uploadingVideoFile, setUploadingVideoFile] = useState(false);

  useEffect(() => {
    const fetchPractitioners = async () => {
      try {
        const res = await fetch("/api/practitioners");
        const json = await res.json();
        if (json.success && Array.isArray(json.data)) {
          setPractitioners(json.data);
          if (json.data.length > 0 && !selectedPractitioner && !initialData?.author) {
            setSelectedPractitioner(json.data[0].name);
          }
          if (initialData?.author) {
            const exists = json.data.some(
              (p: Practitioner) => p.name.toLowerCase() === initialData.author.toLowerCase()
            );
            if (exists) {
              setAuthorType("practitioner");
              setSelectedPractitioner(
                json.data.find(
                  (p: Practitioner) => p.name.toLowerCase() === initialData.author.toLowerCase()
                )?.name || initialData.author
              );
            } else {
              setAuthorType("custom");
              setCustomAuthor(initialData.author);
            }
          }
        }
      } catch (err) {
        console.error("Failed to load practitioners:", err);
      } finally {
        setLoadingPractitioners(false);
      }
    };

    fetchPractitioners();
  }, [initialData]);

  // Set initial category check
  useEffect(() => {
    if (initialData?.category) {
      const standardCategories = [
        "Video Transcripts",
        "Chakra Shorts",
        "Aura Alignment",
        "Guided Sessions",
        "Sound Therapy",
      ];
      if (standardCategories.includes(initialData.category)) {
        setCategory(initialData.category);
        setShowCustomCategory(false);
      } else {
        setCategory("Other");
        setCustomCategory(initialData.category);
        setShowCustomCategory(true);
      }
    }
  }, [initialData]);

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

  const isDirectVideoFile = (url: string) => {
    if (!url) return false;
    const clean = url.trim().toLowerCase();
    return (
      clean.endsWith(".mp4") ||
      clean.endsWith(".webm") ||
      clean.endsWith(".mov") ||
      clean.endsWith(".ogg") ||
      clean.includes("/storage/v1/object/public/uploads/") ||
      clean.includes("video/upload")
    );
  };

  const handleCategorySelectChange = (val: string) => {
    setCategory(val);
    setShowCustomCategory(val === "Other");
  };

  // Image Cropper Handlers
  const handleCoverFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
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
    const formData = new FormData();
    formData.append("file", croppedFile);
    setUploadingCover(true);

    try {
      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });
      const json = await res.json();
      if (json.success) {
        setImage(json.url);
      } else {
        alert("Image upload failed: " + json.error);
      }
    } catch (err) {
      console.error("Cover image upload error:", err);
      alert("An error occurred during image upload.");
    } finally {
      setUploadingCover(false);
      setCropImageSrc(null);
    }
  };

  // Video File Upload Handler
  const handleVideoFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);
    setUploadingVideoFile(true);

    try {
      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });
      const json = await res.json();
      if (json.success) {
        setVideoEmbedUrl(json.url);
      } else {
        alert("Video upload failed: " + json.error);
      }
    } catch (err) {
      console.error("Video file upload error:", err);
      alert("An error occurred during video upload.");
    } finally {
      setUploadingVideoFile(false);
      e.target.value = "";
    }
  };

  const handleInsertTimestamp = (timestamp: string) => {
    const textToAdd = `${timestamp} - Section Notes\n`;
    setVideoTranscript((prev) => (prev ? `${prev}\n${textToAdd}` : textToAdd));
  };

  const countTranscriptLines = (text?: string) => {
    if (!text) return 0;
    return text.split("\n").filter((line) => line.trim().length > 0).length;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const finalCategory = category === "Other" ? customCategory.trim() : category;
    const finalAuthor =
      authorType === "practitioner" ? selectedPractitioner : customAuthor.trim();

    if (!title.trim() || !videoEmbedUrl.trim() || !finalAuthor || !content.trim()) {
      alert(
        "Please fill in all required fields: Title, Video Link/Upload, Author, and Summary."
      );
      return;
    }

    const normalizedEmbedUrl = getEmbeddableUrl(videoEmbedUrl.trim());

    const payload = {
      title: title.trim(),
      slug: slugInput.trim(),
      category: finalCategory || "Video Transcripts",
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
      status: status,
    };

    try {
      setSaving(true);
      let res;
      if (isEdit && initialData?.id) {
        res = await fetch("/api/blogs", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: initialData.id, ...payload }),
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
        alert(
          isEdit
            ? "Video blog details updated successfully!"
            : "Video blog successfully published!"
        );
        router.push("/admin/video-blogs");
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

  return (
    <div style={{ maxWidth: "900px", margin: "0 auto", paddingBottom: "40px" }}>
      {/* Top Bar with Back Navigation */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "24px",
        }}
      >
        <button
          type="button"
          onClick={() => router.push("/admin/video-blogs")}
          style={{
            background: "#ffffff",
            border: "1px solid #cbd5e1",
            padding: "8px 16px",
            borderRadius: "10px",
            fontSize: "0.88rem",
            fontWeight: 600,
            color: "#475569",
            cursor: "pointer",
            display: "inline-flex",
            alignItems: "center",
            gap: "6px",
          }}
        >
          ← Back to Video Catalog
        </button>

        <h2 style={{ fontSize: "1.4rem", color: "#3b0764", margin: 0, fontWeight: 700 }}>
          {isEdit ? "✎ Edit Video Blog Post" : "🎥 Create New Video Blog Post"}
        </h2>
      </div>

      <Card variant="glass" style={{ padding: "32px" }}>
        <form onSubmit={handleSubmit} className="admin-form-page">
          {/* Title & Slug */}
          <div className="form-group" style={{ marginBottom: "20px" }}>
            <label style={{ fontWeight: 700, display: "block", marginBottom: "6px" }}>
              Video Blog Title *
            </label>
            <input
              type="text"
              className="glass-input"
              required
              placeholder="e.g. Chakra Shorts: Awakening the Heart Node"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              style={{ width: "100%", padding: "12px 16px", borderRadius: "10px" }}
            />
          </div>

          <div
            className="form-row"
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "20px",
              marginBottom: "20px",
            }}
          >
            <div className="form-group">
              <label style={{ fontWeight: 700, display: "block", marginBottom: "6px" }}>
                URL Slug (Optional)
              </label>
              <input
                type="text"
                className="glass-input"
                placeholder="e.g. chakra-shorts-awakening-heart-node"
                value={slugInput}
                onChange={(e) => setSlugInput(e.target.value)}
                style={{ width: "100%", padding: "12px 16px", borderRadius: "10px" }}
              />
            </div>

            <div className="form-group">
              <label style={{ fontWeight: 700, display: "block", marginBottom: "6px" }}>
                Category / Playlist
              </label>
              <select
                className="glass-input"
                value={category}
                onChange={(e) => handleCategorySelectChange(e.target.value)}
                style={{ width: "100%", padding: "12px 16px", borderRadius: "10px" }}
              >
                <option value="Video Transcripts">Video Transcripts</option>
                <option value="Chakra Shorts">Chakra Shorts</option>
                <option value="Aura Alignment">Aura Alignment</option>
                <option value="Guided Sessions">Guided Sessions</option>
                <option value="Sound Therapy">Sound Therapy</option>
                <option value="Other">Custom Category...</option>
              </select>
            </div>
          </div>

          {showCustomCategory && (
            <div className="form-group" style={{ marginBottom: "20px" }}>
              <label style={{ fontWeight: 700, display: "block", marginBottom: "6px" }}>
                Custom Category Name *
              </label>
              <input
                type="text"
                className="glass-input"
                required
                placeholder="e.g. Kundalini Series"
                value={customCategory}
                onChange={(e) => setCustomCategory(e.target.value)}
                style={{ width: "100%", padding: "12px 16px", borderRadius: "10px" }}
              />
            </div>
          )}

          {/* Cover Image / Thumbnail Selection with Cropper */}
          <div className="form-group" style={{ marginBottom: "24px" }}>
            <label style={{ color: "#4f46e5", fontWeight: 700, display: "block", marginBottom: "6px" }}>
              🖼 Cover Image Thumbnail (16:9 Aspect Ratio)
            </label>
            <div
              style={{
                display: "flex",
                gap: "12px",
                alignItems: "center",
                marginBottom: "10px",
              }}
            >
              <input
                type="text"
                className="glass-input"
                style={{ flex: 1, padding: "12px 16px", borderRadius: "10px" }}
                placeholder="Image URL or upload custom thumbnail below..."
                value={image}
                onChange={(e) => setImage(e.target.value)}
              />
              <label
                style={{
                  background: "#4f46e5",
                  color: "#fff",
                  padding: "10px 16px",
                  borderRadius: "10px",
                  fontSize: "0.85rem",
                  fontWeight: 600,
                  cursor: "pointer",
                  whiteSpace: "nowrap",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  margin: 0,
                }}
              >
                {uploadingCover ? "Uploading..." : "📷 Upload & Crop Cover"}
                <input
                  type="file"
                  accept="image/*"
                  style={{ display: "none" }}
                  onChange={handleCoverFileSelect}
                  disabled={uploadingCover}
                />
              </label>
            </div>

            {image && (
              <div
                style={{
                  width: "200px",
                  height: "112px",
                  borderRadius: "10px",
                  overflow: "hidden",
                  border: "1px solid #cbd5e1",
                  position: "relative",
                  background: "#000",
                }}
              >
                <img
                  src={image}
                  alt="Thumbnail Preview"
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                />
              </div>
            )}
          </div>

          {/* Author Selection */}
          <div
            className="form-row"
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "20px",
              marginBottom: "24px",
            }}
          >
            <div className="form-group">
              <label style={{ fontWeight: 700, display: "block", marginBottom: "6px" }}>
                Author Type
              </label>
              <select
                className="glass-input"
                value={authorType}
                onChange={(e: any) => setAuthorType(e.target.value)}
                style={{ width: "100%", padding: "12px 16px", borderRadius: "10px" }}
              >
                <option value="practitioner">Registered Practitioner</option>
                <option value="custom">Custom Author Name</option>
              </select>
            </div>

            <div className="form-group">
              <label style={{ fontWeight: 700, display: "block", marginBottom: "6px" }}>
                Author Name *
              </label>
              {authorType === "practitioner" ? (
                <select
                  className="glass-input"
                  value={selectedPractitioner}
                  onChange={(e) => setSelectedPractitioner(e.target.value)}
                  style={{ width: "100%", padding: "12px 16px", borderRadius: "10px" }}
                  disabled={loadingPractitioners}
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
                  style={{ width: "100%", padding: "12px 16px", borderRadius: "10px" }}
                />
              )}
            </div>
          </div>

          {/* Video File Upload / YouTube Link / Shorts / Iframe */}
          <div className="form-group" style={{ marginBottom: "24px" }}>
            <label style={{ color: "#4f46e5", fontWeight: 700, display: "block", marginBottom: "6px" }}>
              ▶ Video File Upload / YouTube Link / Embed URL *
            </label>
            <div
              style={{
                display: "flex",
                gap: "12px",
                alignItems: "center",
                marginBottom: "6px",
              }}
            >
              <input
                type="text"
                className="glass-input"
                style={{ flex: 1, padding: "12px 16px", borderRadius: "10px" }}
                required
                placeholder="https://www.youtube.com/watch?v=... or upload video file"
                value={videoEmbedUrl}
                onChange={(e) => setVideoEmbedUrl(e.target.value)}
              />
              <label
                style={{
                  background: "#0284c7",
                  color: "#fff",
                  padding: "10px 16px",
                  borderRadius: "10px",
                  fontSize: "0.85rem",
                  fontWeight: 600,
                  cursor: "pointer",
                  whiteSpace: "nowrap",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  margin: 0,
                }}
              >
                {uploadingVideoFile ? "Uploading Video..." : "🎬 Upload Video File"}
                <input
                  type="file"
                  accept="video/mp4,video/webm,video/ogg,video/quicktime,video/*"
                  style={{ display: "none" }}
                  onChange={handleVideoFileUpload}
                  disabled={uploadingVideoFile}
                />
              </label>
            </div>
            <small style={{ color: "#64748b", fontSize: "0.78rem" }}>
              Upload an MP4/WEBM video file directly from your computer, or paste a YouTube / Shorts / Vimeo link.
            </small>
          </div>

          {/* Live Video Player Preview */}
          {videoEmbedUrl && (
            <div
              style={{
                background: "#0f172a",
                padding: "16px",
                borderRadius: "14px",
                marginBottom: "24px",
              }}
            >
              <p style={{ color: "#94a3b8", fontSize: "0.82rem", margin: "0 0 10px", fontWeight: 600 }}>
                🎬 Live Video Player Preview:
              </p>
              {isDirectVideoFile(videoEmbedUrl) ? (
                <video
                  src={getEmbeddableUrl(videoEmbedUrl)}
                  controls
                  style={{
                    width: "100%",
                    maxHeight: "400px",
                    borderRadius: "10px",
                    background: "#000",
                  }}
                />
              ) : (
                <div
                  style={{
                    position: "relative",
                    paddingTop: "56.25%",
                    borderRadius: "10px",
                    overflow: "hidden",
                  }}
                >
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
              )}
            </div>
          )}

          {/* Timestamped Video Transcript */}
          <div className="form-group" style={{ marginBottom: "24px" }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "8px",
              }}
            >
              <label style={{ color: "#4f46e5", fontWeight: 700, margin: 0 }}>
                📜 Timestamped Video Transcript Notes
              </label>
              <div style={{ display: "flex", gap: "8px" }}>
                <button
                  type="button"
                  style={{
                    padding: "4px 10px",
                    fontSize: "0.75rem",
                    borderRadius: "6px",
                    background: "#e0e7ff",
                    color: "#4338ca",
                    border: "none",
                    cursor: "pointer",
                    fontWeight: 600,
                  }}
                  onClick={() => handleInsertTimestamp("00:00")}
                >
                  + 00:00
                </button>
                <button
                  type="button"
                  style={{
                    padding: "4px 10px",
                    fontSize: "0.75rem",
                    borderRadius: "6px",
                    background: "#e0e7ff",
                    color: "#4338ca",
                    border: "none",
                    cursor: "pointer",
                    fontWeight: 600,
                  }}
                  onClick={() => handleInsertTimestamp("01:00")}
                >
                  + 01:00
                </button>
                <button
                  type="button"
                  style={{
                    padding: "4px 10px",
                    fontSize: "0.75rem",
                    borderRadius: "6px",
                    background: "#e0e7ff",
                    color: "#4338ca",
                    border: "none",
                    cursor: "pointer",
                    fontWeight: 600,
                  }}
                  onClick={() => handleInsertTimestamp("02:30")}
                >
                  + 02:30
                </button>
              </div>
            </div>
            <textarea
              className="glass-input"
              rows={6}
              placeholder={`00:00 Introduction to 528Hz Sound Bowl Therapy\n00:06 Sound vibrations target cellular water crystals\n00:14 Somatic tension stored in chakra nodes\n00:22 Practical steps to dissolve localized anxiety`}
              value={videoTranscript}
              onChange={(e) => setVideoTranscript(e.target.value)}
              style={{ width: "100%", padding: "12px 16px", borderRadius: "10px" }}
            />
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginTop: "6px",
              }}
            >
              <small style={{ color: "#64748b", fontSize: "0.78rem" }}>
                Lines formatted as <strong>00:00 Text</strong> generate interactive timestamp buttons on the frontend player!
              </small>
              <small style={{ color: "#4f46e5", fontWeight: 700, fontSize: "0.78rem" }}>
                📜 {countTranscriptLines(videoTranscript)} Timed Lines Detected
              </small>
            </div>
          </div>

          {/* Video Description / Summary Content */}
          <div className="form-group" style={{ marginBottom: "24px" }}>
            <label style={{ fontWeight: 700, display: "block", marginBottom: "6px" }}>
              Video Summary &amp; Transition Notes *
            </label>
            <RichTextEditor
              value={content}
              onChange={setContent}
              placeholder="Explain the background of this video, key takeaways, or healing exercises... use the toolbar above for formatting..."
              required
            />
          </div>

          {/* Date, Watch Time & Status */}
          <div
            className="form-row"
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr 1fr",
              gap: "20px",
              marginBottom: "32px",
            }}
          >
            <div className="form-group">
              <label style={{ fontWeight: 700, display: "block", marginBottom: "6px" }}>
                Publish Date
              </label>
              <input
                type="date"
                className="glass-input"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                style={{ width: "100%", padding: "12px 16px", borderRadius: "10px" }}
              />
            </div>

            <div className="form-group">
              <label style={{ fontWeight: 700, display: "block", marginBottom: "6px" }}>
                Duration / Watch Estimate
              </label>
              <input
                type="text"
                className="glass-input"
                placeholder="e.g. 5 Min Watch"
                value={readTime}
                onChange={(e) => setReadTime(e.target.value)}
                style={{ width: "100%", padding: "12px 16px", borderRadius: "10px" }}
              />
            </div>

            <div className="form-group">
              <label style={{ fontWeight: 700, display: "block", marginBottom: "6px" }}>
                Status
              </label>
              <select
                className="glass-input"
                value={status}
                onChange={(e: any) => setStatus(e.target.value)}
                style={{ width: "100%", padding: "12px 16px", borderRadius: "10px" }}
              >
                <option value="published">🟢 Published</option>
                <option value="draft">🟡 Draft</option>
              </select>
            </div>
          </div>

          {/* Submit Actions */}
          <div
            style={{
              display: "flex",
              gap: "12px",
              justifyContent: "flex-end",
              borderTop: "1px solid #e2e8f0",
              paddingTop: "24px",
            }}
          >
            <Button
              type="button"
              variant="glass"
              onClick={() => router.push("/admin/video-blogs")}
            >
              Cancel
            </Button>
            <Button type="submit" variant="gold" disabled={saving}>
              {saving
                ? "Saving..."
                : isEdit
                ? "Update Video Blog"
                : "Publish Video Blog"}
            </Button>
          </div>
        </form>
      </Card>

      {/* Image Cropper Modal */}
      {cropImageSrc && (
        <ImageCropperModal
          imageSrc={cropImageSrc}
          aspectRatio="16:9"
          title="Crop Video Blog Thumbnail (16:9)"
          onCropComplete={handleCropComplete}
          onCancel={() => setCropImageSrc(null)}
        />
      )}
    </div>
  );
}
