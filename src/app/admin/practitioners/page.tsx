"use client";

import React, { useState, useEffect } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Practitioner, Expertise } from "@/types/database";

export default function AdminPractitionersPage() {
  const [practitioners, setPractitioners] = useState<Practitioner[]>([]);
  const [expertiseOptions, setExpertiseOptions] = useState<Expertise[]>([]);
  const [loading, setLoading] = useState(true);

  // Form states
  const [editingId, setEditingId] = useState<string | null>(null);
  const [pracName, setPracName] = useState("");
  const [pracSpecialty, setPracSpecialty] = useState("");
  const [pracBio, setPracBio] = useState("");
  const [pracImage, setPracImage] = useState("");
  const [pracVideo, setPracVideo] = useState("");
  const [pracCertifications, setPracCertifications] = useState<string[]>([]);
  const [pracExpertise, setPracExpertise] = useState<string[]>([]);

  // Inline expertise creation state
  const [newExpertiseName, setNewExpertiseName] = useState("");

  // Uploading states
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [uploadingVideo, setUploadingVideo] = useState(false);
  const [uploadingCert, setUploadingCert] = useState(false);

  const loadPractitioners = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/practitioners");
      const json = await res.json();
      if (json.success) {
        setPractitioners(json.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadExpertiseOptions = async () => {
    try {
      const res = await fetch("/api/expertise");
      const json = await res.json();
      if (json.success) {
        setExpertiseOptions(json.data);
      }
    } catch (err) {
      console.error("Failed to load expertise options", err);
    }
  };

  useEffect(() => {
    loadPractitioners();
    loadExpertiseOptions();
  }, []);

  const handleEditClick = (p: Practitioner) => {
    setEditingId(p.id);
    setPracName(p.name);
    setPracSpecialty(p.specialty);
    setPracBio(p.bio);
    setPracImage(p.image || "");
    setPracVideo(p.video_url || "");
    setPracCertifications(p.certifications || []);
    setPracExpertise(p.expertise || []);
    
    // Scroll to form on mobile/small screen
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setPracName("");
    setPracSpecialty("");
    setPracBio("");
    setPracImage("");
    setPracVideo("");
    setPracCertifications([]);
    setPracExpertise([]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pracName || !pracSpecialty || !pracBio) {
      alert("Please fill out healer name, specialty, and bio.");
      return;
    }

    const payload = {
      name: pracName,
      specialty: pracSpecialty,
      bio: pracBio,
      image: pracImage,
      video_url: pracVideo,
      certifications: pracCertifications,
      expertise: pracExpertise,
    };

    try {
      if (editingId) {
        // Edit Mode
        const res = await fetch("/api/practitioners", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: editingId, ...payload }),
        });
        const json = await res.json();
        if (json.success) {
          alert("Healer updated successfully!");
          handleCancelEdit();
          loadPractitioners();
        } else {
          alert("Error: " + json.error);
        }
      } else {
        // Add Mode
        const res = await fetch("/api/practitioners", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const json = await res.json();
        if (json.success) {
          alert("Healer registered successfully!");
          handleCancelEdit();
          loadPractitioners();
        } else {
          alert("Error: " + json.error);
        }
      }
    } catch (err) {
      console.error(err);
      alert("An error occurred during submission.");
    }
  };

  const handleDeletePractitioner = async (id: string) => {
    if (!confirm("Are you sure you want to delete this practitioner from registry?")) return;
    try {
      const res = await fetch(`/api/practitioners?id=${id}`, { method: "DELETE" });
      const json = await res.json();
      if (json.success) {
        if (editingId === id) handleCancelEdit();
        loadPractitioners();
      } else {
        alert("Error: " + json.error);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Upload file utility
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

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingPhoto(true);
    const url = await uploadFile(file);
    if (url) {
      setPracImage(url);
    }
    setUploadingPhoto(false);
  };

  const handleVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingVideo(true);
    const url = await uploadFile(file);
    if (url) {
      setPracVideo(url);
    }
    setUploadingVideo(false);
  };

  const handleCertUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingCert(true);
    const url = await uploadFile(file);
    if (url) {
      setPracCertifications(prev => [...prev, url]);
    }
    setUploadingCert(false);
    e.target.value = ""; // Clear input
  };

  const handleRemoveCert = (urlToRemove: string) => {
    setPracCertifications(prev => prev.filter(url => url !== urlToRemove));
  };

  const handleExpertiseChange = (name: string) => {
    setPracExpertise(prev => 
      prev.includes(name) ? prev.filter(x => x !== name) : [...prev, name]
    );
  };

  const handleAddCustomExpertise = async (e: React.MouseEvent) => {
    e.preventDefault();
    const cleanName = newExpertiseName.trim();
    if (!cleanName) return;

    if (expertiseOptions.some(opt => opt.name.toLowerCase() === cleanName.toLowerCase())) {
      alert("This expertise option already exists.");
      return;
    }

    try {
      const res = await fetch("/api/expertise", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: cleanName })
      });
      const json = await res.json();
      if (json.success) {
        setExpertiseOptions(prev => [...prev, json.data].sort((a, b) => a.name.localeCompare(b.name)));
        setPracExpertise(prev => [...prev, json.data.name]);
        setNewExpertiseName("");
      } else {
        alert("Failed to save expertise: " + json.error);
      }
    } catch (err) {
      console.error(err);
      alert("An error occurred while adding expertise.");
    }
  };

  const getFileName = (url: string) => {
    return url.split("/").pop() || "File";
  };

  return (
    <div className="dashboard-content">
      <div className="dashboard-header-row">
        <div>
          <h2>Practitioners Registry</h2>
          <p style={{ color: "hsl(var(--text-muted))", fontSize: "0.9rem", marginTop: "4px" }}>
            Maintain professional directories, register new healers, update credentials, upload certifications, and verify qualifications.
          </p>
        </div>
        <button className="sync-btn" onClick={loadPractitioners}>
          🔄 Refresh Healers
        </button>
      </div>

      {loading ? (
        <p style={{ color: "hsl(var(--text-muted))", marginTop: "40px" }}>Loading directory...</p>
      ) : (
        <div className="admin-split-layout">
          {/* List */}
          <div className="split-list-col">
            <h3 className="column-title">Certified Healers Registry ({practitioners.length})</h3>
            <div className="list-cards-vertical">
              {practitioners.length === 0 ? (
                <p style={{ color: "hsl(var(--text-muted))", fontStyle: "italic" }}>No healers registered yet.</p>
              ) : (
                practitioners.map(p => (
                  <Card key={p.id} variant="glass" className="admin-list-item-card">
                    <div className="item-card-row">
                      {/* Avatar preview */}
                      <div className="prac-avatar-preview">
                        {p.image && p.image.startsWith("/") ? (
                          <img src={p.image} alt={p.name} className="avatar-img" />
                        ) : (
                          <div className="prac-placeholder-avatar">
                            {p.name.split(" ").map(n => n[0]).join("")}
                          </div>
                        )}
                      </div>
                      
                      <div className="item-card-details">
                        <h4>{p.name}</h4>
                        <span className="badge-span">{p.specialty}</span>
                        <div className="rating-row" style={{ fontSize: "0.8rem", color: "#d4af37", marginTop: "4px" }}>
                          ★ {p.rating.toFixed(1)} ({p.reviewsCount} Reviews)
                        </div>
                        
                        {/* Expertise display */}
                        {p.expertise && p.expertise.length > 0 && (
                          <div className="card-expertise-list">
                            {p.expertise.map(exp => (
                              <span key={exp} className="card-expertise-tag">{exp}</span>
                            ))}
                          </div>
                        )}

                        <p className="item-desc" style={{ marginTop: "8px" }}>{p.bio}</p>
                        
                        {/* Media markers */}
                        <div className="media-markers-row">
                          {p.video_url && <span className="media-marker">📺 Video Bio</span>}
                          {p.certifications && p.certifications.length > 0 && (
                            <span className="media-marker">📜 {p.certifications.length} Certifications</span>
                          )}
                        </div>
                      </div>

                      <div className="action-buttons-col">
                        <button className="edit-row-btn" onClick={() => handleEditClick(p)}>
                          ✏️ Edit Profile
                        </button>
                        <button className="delete-row-btn" onClick={() => handleDeletePractitioner(p.id)}>
                          ✕ Delete Healer
                        </button>
                      </div>
                    </div>
                  </Card>
                ))
              )}
            </div>
          </div>

          {/* Form */}
          <div className="split-form-col">
            <Card variant="glass" style={{ padding: "28px" }}>
              <div className="form-header-row">
                <h3 className="column-title">
                  {editingId ? "Edit Healer Profile" : "Register Healer"}
                </h3>
                {editingId && (
                  <button className="cancel-edit-btn" onClick={handleCancelEdit}>
                    Cancel Edit
                  </button>
                )}
              </div>

              <form onSubmit={handleSubmit} className="admin-catalog-form">
                
                <div className="form-group">
                  <label>Healer Name</label>
                  <input 
                    type="text" 
                    className="glass-input" 
                    required 
                    placeholder="e.g. Master Sumeet"
                    value={pracName}
                    onChange={(e) => setPracName(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label>Specialty Specialty</label>
                  <input 
                    type="text" 
                    className="glass-input" 
                    required 
                    placeholder="e.g. Reiki Master & Sound Therapist"
                    value={pracSpecialty}
                    onChange={(e) => setPracSpecialty(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label>Professional Bio</label>
                  <textarea
                    className="glass-input desc-area"
                    required
                    placeholder="Detail healer background, education levels, and reiki studies..."
                    value={pracBio}
                    onChange={(e) => setPracBio(e.target.value)}
                  />
                </div>

                {/* PHOTO UPLOAD */}
                <div className="form-group">
                  <label>Profile Photo</label>
                  <div className="file-upload-row">
                    <input 
                      type="text" 
                      className="glass-input" 
                      placeholder="URL or Upload picture..."
                      value={pracImage}
                      onChange={(e) => setPracImage(e.target.value)}
                    />
                    <label className="upload-file-btn">
                      {uploadingPhoto ? "..." : "Upload File"}
                      <input 
                        type="file" 
                        accept="image/*" 
                        style={{ display: "none" }} 
                        onChange={handlePhotoUpload}
                        disabled={uploadingPhoto}
                      />
                    </label>
                  </div>
                  {pracImage && (
                    <div className="image-preview-thumbnail">
                      <img src={pracImage} alt="Preview" />
                      <button type="button" className="remove-thumbnail-btn" onClick={() => setPracImage("")}>✕ Clear</button>
                    </div>
                  )}
                </div>

                {/* VIDEO UPLOAD */}
                <div className="form-group">
                  <label>Introductory Video Bio</label>
                  <div className="file-upload-row">
                    <input 
                      type="text" 
                      className="glass-input" 
                      placeholder="Direct video URL or Upload MP4..."
                      value={pracVideo}
                      onChange={(e) => setPracVideo(e.target.value)}
                    />
                    <label className="upload-file-btn">
                      {uploadingVideo ? "..." : "Upload Video"}
                      <input 
                        type="file" 
                        accept="video/*" 
                        style={{ display: "none" }} 
                        onChange={handleVideoUpload}
                        disabled={uploadingVideo}
                      />
                    </label>
                  </div>
                  {pracVideo && (
                    <div className="video-preview-row">
                      <video src={pracVideo} controls className="thumbnail-video" />
                      <button type="button" className="remove-thumbnail-btn" onClick={() => setPracVideo("")}>✕ Remove</button>
                    </div>
                  )}
                </div>

                {/* CERTIFICATIONS UPLOAD */}
                <div className="form-group">
                  <label>Certifications (Multiple Uploads)</label>
                  <label className="upload-block-btn">
                    {uploadingCert ? "Uploading Certification File..." : "➕ Add Certification File"}
                    <input 
                      type="file" 
                      accept="image/*,application/pdf" 
                      style={{ display: "none" }} 
                      onChange={handleCertUpload}
                      disabled={uploadingCert}
                    />
                  </label>
                  {pracCertifications.length > 0 && (
                    <div className="certifications-pills-list">
                      {pracCertifications.map((url, idx) => (
                        <div key={idx} className="cert-pill">
                          <span className="cert-name" title={getFileName(url)}>📜 {getFileName(url)}</span>
                          <button type="button" className="cert-remove" onClick={() => handleRemoveCert(url)}>✕</button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* AREAS OF EXPERTISE & DYNAMIC ADDITION */}
                <div className="form-group">
                  <label>Areas of Expertise</label>
                  <div className="expertise-checklist-grid">
                    {expertiseOptions.map(opt => (
                      <label key={opt.id} className="checkbox-item-label">
                        <input
                          type="checkbox"
                          checked={pracExpertise.includes(opt.name)}
                          onChange={() => handleExpertiseChange(opt.name)}
                        />
                        <span>{opt.name}</span>
                      </label>
                    ))}
                  </div>

                  {/* Dynamic option insertion */}
                  <div className="add-expertise-subform" style={{ marginTop: "12px" }}>
                    <input
                      type="text"
                      className="glass-input small-input"
                      placeholder="Add custom service expertise..."
                      value={newExpertiseName}
                      onChange={(e) => setNewExpertiseName(e.target.value)}
                    />
                    <button type="button" className="add-expertise-btn" onClick={handleAddCustomExpertise}>
                      ➕ Add Option
                    </button>
                  </div>
                </div>

                <Button variant="gold" type="submit" style={{ width: "100%", marginTop: "16px" }}>
                  {editingId ? "Update Healer Profile" : "Register Healer"}
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
          color: #7c3aed;
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
        }
        .admin-split-layout {
          display: grid;
          grid-template-columns: 1.4fr 1.1fr;
          gap: 32px;
        }
        .split-list-col {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        .column-title {
          font-family: var(--font-serif);
          font-size: 1.35rem;
          color: #4c1d95;
        }
        .list-cards-vertical {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }
        .admin-list-item-card {
          padding: 24px;
        }
        .item-card-row {
          display: flex;
          align-items: flex-start;
          gap: 20px;
        }
        .prac-avatar-preview {
          flex-shrink: 0;
        }
        .avatar-img {
          width: 70px;
          height: 70px;
          border-radius: 50%;
          object-fit: cover;
          border: 2px solid var(--gold-border);
          box-shadow: 0 4px 10px rgba(0,0,0,0.05);
        }
        .prac-placeholder-avatar {
          width: 70px;
          height: 70px;
          border-radius: 50%;
          background: var(--btn-gold-bg);
          border: 2px solid var(--gold-border);
          display: flex;
          align-items: center;
          justify-content: center;
          font-family: var(--font-serif);
          font-weight: 700;
          color: #4c1d95;
          font-size: 1.3rem;
        }
        .item-card-details {
          display: flex;
          flex-direction: column;
          gap: 4px;
          flex-grow: 1;
        }
        .item-card-details h4 {
          font-size: 1.25rem;
          color: #1e1b4b;
        }
        .badge-span {
          font-size: 0.8rem;
          color: #0d9488;
          font-weight: 600;
        }
        .card-expertise-list {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
          margin-top: 6px;
        }
        .card-expertise-tag {
          font-size: 0.7rem;
          background: rgba(124, 58, 237, 0.08);
          color: #6d28d9;
          border: 1px solid rgba(124, 58, 237, 0.15);
          padding: 2px 8px;
          border-radius: 4px;
          font-weight: 600;
        }
        .item-desc {
          font-size: 0.85rem;
          line-height: 1.5;
          color: #475569;
        }
        .media-markers-row {
          display: flex;
          gap: 12px;
          margin-top: 8px;
        }
        .media-marker {
          font-size: 0.72rem;
          color: #0891b2;
          background: rgba(8, 145, 178, 0.06);
          border: 1px solid rgba(8, 145, 178, 0.15);
          padding: 2px 8px;
          border-radius: 99px;
          font-weight: 500;
        }
        .action-buttons-col {
          display: flex;
          flex-direction: column;
          gap: 8px;
          flex-shrink: 0;
        }
        .edit-row-btn {
          background: transparent;
          border: 1px solid rgba(124, 58, 237, 0.3);
          color: #7c3aed;
          padding: 6px 12px;
          border-radius: 6px;
          cursor: pointer;
          font-size: 0.75rem;
          font-weight: 600;
          transition: var(--transition-fast);
        }
        .edit-row-btn:hover {
          background: rgba(124, 58, 237, 0.05);
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
          gap: 16px;
        }
        .form-header-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
        }
        .cancel-edit-btn {
          background: rgba(239, 68, 68, 0.08);
          border: 1px solid rgba(239, 68, 68, 0.3);
          color: #ef4444;
          padding: 6px 12px;
          border-radius: 6px;
          cursor: pointer;
          font-size: 0.75rem;
          font-weight: 600;
        }
        .cancel-edit-btn:hover {
          background: rgba(239, 68, 68, 0.15);
        }
        .form-group {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        .form-group label {
          font-size: 0.75rem;
          color: hsl(var(--text-muted));
          text-transform: uppercase;
          letter-spacing: 0.05em;
          font-weight: 600;
        }
        .desc-area {
          height: 100px;
          resize: none;
        }
        
        /* File uploads */
        .file-upload-row {
          display: flex;
          gap: 8px;
        }
        .upload-file-btn {
          background: rgba(124, 58, 237, 0.08);
          border: 1px solid rgba(124, 58, 237, 0.25);
          color: #7c3aed;
          padding: 10px 14px;
          border-radius: 8px;
          cursor: pointer;
          font-size: 0.8rem;
          font-weight: 600;
          white-space: nowrap;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .upload-file-btn:hover {
          background: rgba(124, 58, 237, 0.15);
        }
        .image-preview-thumbnail {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-top: 8px;
          background: rgba(0,0,0,0.02);
          padding: 8px;
          border-radius: 6px;
          border: 1px dashed rgba(0,0,0,0.1);
        }
        .image-preview-thumbnail img {
          width: 50px;
          height: 50px;
          object-fit: cover;
          border-radius: 4px;
          border: 1px solid rgba(0,0,0,0.1);
        }
        .video-preview-row {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-top: 8px;
          background: rgba(0,0,0,0.02);
          padding: 8px;
          border-radius: 6px;
          border: 1px dashed rgba(0,0,0,0.1);
        }
        .thumbnail-video {
          width: 120px;
          height: 68px;
          object-fit: cover;
          border-radius: 4px;
        }
        .remove-thumbnail-btn {
          background: transparent;
          border: none;
          color: #ef4444;
          cursor: pointer;
          font-size: 0.8rem;
          font-weight: 600;
        }
        .remove-thumbnail-btn:hover {
          text-decoration: underline;
        }

        .upload-block-btn {
          display: block;
          text-align: center;
          padding: 14px;
          border: 1.5px dashed rgba(124, 58, 237, 0.3);
          border-radius: 8px;
          color: #7c3aed;
          font-weight: 600;
          font-size: 0.8rem;
          cursor: pointer;
          transition: background-color 0.2s;
          background: rgba(124, 58, 237, 0.02);
        }
        .upload-block-btn:hover {
          background: rgba(124, 58, 237, 0.06);
          border-color: #7c3aed;
        }
        
        .certifications-pills-list {
          display: flex;
          flex-direction: column;
          gap: 6px;
          margin-top: 8px;
        }
        .cert-pill {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 8px 12px;
          background: rgba(0,0,0,0.03);
          border: 1px solid rgba(0,0,0,0.08);
          border-radius: 6px;
          font-size: 0.8rem;
        }
        .cert-name {
          color: #334155;
          text-overflow: ellipsis;
          overflow: hidden;
          white-space: nowrap;
          max-width: 80%;
          font-weight: 500;
        }
        .cert-remove {
          background: transparent;
          border: none;
          color: #94a3b8;
          cursor: pointer;
          font-size: 0.9rem;
          padding: 0 4px;
        }
        .cert-remove:hover {
          color: #ef4444;
        }

        /* Expertise checkboxes */
        .expertise-checklist-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 8px;
          max-height: 150px;
          overflow-y: auto;
          background: rgba(0,0,0,0.01);
          border: 1px solid rgba(0,0,0,0.05);
          padding: 10px;
          border-radius: 8px;
        }
        .checkbox-item-label {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 0.85rem;
          color: #334155;
          cursor: pointer;
        }
        .checkbox-item-label input {
          cursor: pointer;
        }
        .add-expertise-subform {
          display: flex;
          gap: 8px;
        }
        .small-input {
          flex-grow: 1;
          padding: 8px 12px;
          font-size: 0.8rem;
        }
        .add-expertise-btn {
          background: transparent;
          border: 1px solid rgba(13, 148, 136, 0.4);
          color: #0d9488;
          padding: 8px 14px;
          border-radius: 8px;
          cursor: pointer;
          font-size: 0.8rem;
          font-weight: 600;
          white-space: nowrap;
        }
        .add-expertise-btn:hover {
          background: rgba(13, 148, 136, 0.05);
          border-color: #0d9488;
        }

        @media (max-width: 1024px) {
          .admin-split-layout {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
}
