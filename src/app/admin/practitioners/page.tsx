"use client";

import React, { useState, useEffect } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Practitioner, Expertise } from "@/types/database";
import { ImageCropperModal } from "@/components/ui/ImageCropperModal";
import { RefreshCw, Edit, Trash2 } from "lucide-react";
import StatsDashboard from "@/components/admin/StatsDashboard";

export default function AdminPractitionersPage() {
  const [practitioners, setPractitioners] = useState<Practitioner[]>([]);
  const [expertiseOptions, setExpertiseOptions] = useState<Expertise[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form states
  const [editingId, setEditingId] = useState<string | null>(null);
  const [pracName, setPracName] = useState("");
  const [pracSpecialty, setPracSpecialty] = useState("");
  const [pracBio, setPracBio] = useState("");
  const [pracImage, setPracImage] = useState("");
  const [pracVideo, setPracVideo] = useState("");
  const [pracCertifications, setPracCertifications] = useState<string[]>([]);
  const [pracExpertise, setPracExpertise] = useState<string[]>([]);

  // Social Links States
  const [socialFacebook, setSocialFacebook] = useState("");
  const [socialInstagram, setSocialInstagram] = useState("");
  const [socialLinkedin, setSocialLinkedin] = useState("");
  const [socialYoutube, setSocialYoutube] = useState("");

  // Crop State
  const [cropImageSrc, setCropImageSrc] = useState<string | null>(null);

  // Inline expertise creation state
  const [newExpertiseName, setNewExpertiseName] = useState("");

  // Uploading states
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [uploadingVideo, setUploadingVideo] = useState(false);
  const [uploadingCert, setUploadingCert] = useState(false);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  const loadPractitioners = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/practitioners");
      const json = await res.json();
      if (json.success) {
        setPractitioners(json.data);
        setCurrentPage(1);
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
    setSocialFacebook(p.social_links?.facebook || "");
    setSocialInstagram(p.social_links?.instagram || "");
    setSocialLinkedin(p.social_links?.linkedin || "");
    setSocialYoutube(p.social_links?.youtube || "");
    setIsModalOpen(true);
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
    setSocialFacebook("");
    setSocialInstagram("");
    setSocialLinkedin("");
    setSocialYoutube("");
    setIsModalOpen(false);
  };

  const handleOpenCreateModal = () => {
    handleCancelEdit();
    setIsModalOpen(true);
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
      social_links: {
        facebook: socialFacebook,
        instagram: socialInstagram,
        linkedin: socialLinkedin,
        youtube: socialYoutube,
      },
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
      setPracImage(url);
    }
    setUploadingPhoto(false);
  };

  const handleCropCancel = () => {
    setCropImageSrc(null);
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

  // Pagination Logic
  const totalPages = Math.ceil(practitioners.length / itemsPerPage);
  const paginatedPractitioners = practitioners.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <div className="dashboard-content">
      <StatsDashboard
        pageType="practitioners"
        actions={
          <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
            <button className="btn btn-secondary btn-sm" onClick={loadPractitioners}>
              <RefreshCw size={12} style={{ marginRight: "6px" }} />
              Refresh Healers
            </button>
            <Button variant="gold" size="sm" onClick={handleOpenCreateModal}>
              ➕ Add Healer
            </Button>
          </div>
        }
      />


      {loading ? (
        <p className="text-center" style={{ padding: "40px", color: "#6c757d" }}>Loading directory...</p>
      ) : (
        <div className="admin-full-layout">
          {/* List Table */}
          <div className="split-list-col" style={{ width: "100%" }}>
            <Card variant="glass" className="card-primary" style={{ padding: "0 !important" }}>
              <div style={{ borderBottom: "1px solid #dee2e6", padding: "12px 20px", background: "#f8f9fa", fontWeight: "700" }}>
                Certified Healers Registry ({practitioners.length})
              </div>
              <div className="table-responsive">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Photo</th>
                      <th>Healer Details</th>
                      <th>Ratings</th>
                      <th>Expertise</th>
                      <th>Media / Attachments</th>
                      <th className="text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedPractitioners.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="text-center" style={{ padding: "20px" }}>No healers registered yet.</td>
                      </tr>
                    ) : (
                      paginatedPractitioners.map(p => (
                        <tr key={p.id}>
                          <td>
                            {p.image && p.image.startsWith("/") ? (
                              <img src={p.image} alt={p.name} style={{ width: "45px", height: "45px", borderRadius: "50%", objectFit: "cover", border: "1px solid #dee2e6" }} />
                            ) : (
                              <div style={{ width: "45px", height: "45px", borderRadius: "50%", background: "#007bff", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "bold", fontSize: "0.9rem" }}>
                                {p.name.split(" ").map(n => n[0]).join("")}
                              </div>
                            )}
                          </td>
                          <td>
                            <strong>{p.name}</strong>
                            <div style={{ fontSize: "0.8rem", color: "#28a745", fontWeight: "600" }}>{p.specialty}</div>
                            <div style={{ fontSize: "0.78rem", color: "#6c757d", maxWidth: "220px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={p.bio}>{p.bio}</div>
                          </td>
                          <td style={{ whiteSpace: "nowrap" }}>
                            <span style={{ color: "#ffc107", fontWeight: "bold" }}>★ {p.rating.toFixed(1)}</span>
                            <span style={{ fontSize: "0.75rem", color: "#6c757d", marginLeft: "4px" }}>({p.reviewsCount})</span>
                          </td>
                          <td>
                            <div style={{ display: "flex", flexWrap: "wrap", gap: "3px" }}>
                              {p.expertise && p.expertise.map(exp => (
                                <span key={exp} className="category-badge" style={{ fontSize: "0.7rem", padding: "2px 5px" }}>{exp}</span>
                              ))}
                            </div>
                          </td>
                          <td>
                            <div style={{ display: "flex", flexDirection: "column", gap: "2px", fontSize: "0.72rem" }}>
                              {p.video_url && <span style={{ color: "#17a2b8" }}>📺 Video Intro</span>}
                              {p.certifications && p.certifications.length > 0 && <span style={{ color: "#28a745" }}>📜 {p.certifications.length} Certs</span>}
                              {p.social_links && Object.values(p.social_links).some(link => !!link) && <span style={{ color: "#6c757d" }}>🌐 Socials Linked</span>}
                            </div>
                          </td>
                          <td className="text-right">
                            <div style={{ display: "flex", gap: "4px", justifyContent: "flex-end" }}>
                              <button className="btn btn-secondary btn-sm" onClick={() => handleEditClick(p)}>
                                <Edit size={12} />
                              </button>
                              <button className="btn btn-danger btn-sm" onClick={() => handleDeletePractitioner(p.id)}>
                                <Trash2 size={12} />
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
                    Showing {practitioners.length === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1} to {Math.min(practitioners.length, currentPage * itemsPerPage)} of {practitioners.length} entries
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
      )}

      {isModalOpen && (
        <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div className="modal-content-wrapper" onClick={(e) => e.stopPropagation()}>
            <Card variant="glass" className="modal-inner-card">
              <button className="close-modal-btn" onClick={() => setIsModalOpen(false)}>
                ✕
              </button>
              <h3 className="column-title modal-title-bar">
                {editingId ? "Edit Healer Profile" : "Register Healer"}
              </h3>
              
              <form onSubmit={handleSubmit} className="admin-catalog-form">
                <div className="modal-form-scroll">
                  <div className="form-group">
                    <label>Healer Name</label>
                    <input
                      type="text"
                      className="form-control"
                      required
                      placeholder="e.g. Master Sumeet"
                      value={pracName}
                      onChange={(e) => setPracName(e.target.value)}
                    />
                  </div>

                  <div className="form-group">
                    <label>Specialty</label>
                    <input
                      type="text"
                      className="form-control"
                      required
                      placeholder="e.g. Reiki Master & Sound Therapist"
                      value={pracSpecialty}
                      onChange={(e) => setPracSpecialty(e.target.value)}
                    />
                  </div>

                  <div className="form-group">
                    <label>Professional Bio</label>
                    <textarea
                      className="form-control"
                      required
                      rows={3}
                      placeholder="Detail healer background, education levels, and reiki studies..."
                      value={pracBio}
                      onChange={(e) => setPracBio(e.target.value)}
                    />
                  </div>

                  {/* PHOTO UPLOAD */}
                  <div className="form-group">
                    <label>Profile Photo</label>
                    <div style={{ display: "flex", gap: "6px" }}>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="URL or Upload..."
                        value={pracImage}
                        onChange={(e) => setPracImage(e.target.value)}
                      />
                      <label className="btn btn-secondary btn-sm" style={{ whiteSpace: "nowrap" }}>
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
                      <div style={{ marginTop: "5px", display: "flex", alignItems: "center", gap: "10px" }}>
                        <img src={pracImage} alt="Preview" style={{ width: "40px", height: "40px", borderRadius: "50%", objectFit: "cover" }} />
                        <button type="button" className="btn btn-danger btn-sm" style={{ padding: "2px 6px" }} onClick={() => setPracImage("")}>✕ Clear</button>
                      </div>
                    )}
                  </div>

                  {/* VIDEO UPLOAD */}
                  <div className="form-group">
                    <label>Introductory Video Bio</label>
                    <div style={{ display: "flex", gap: "6px" }}>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="Direct video URL or Upload..."
                        value={pracVideo}
                        onChange={(e) => setPracVideo(e.target.value)}
                      />
                      <label className="btn btn-secondary btn-sm" style={{ whiteSpace: "nowrap" }}>
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
                      <div style={{ marginTop: "5px" }}>
                        <video src={pracVideo} controls style={{ width: "100%", maxHeight: "120px", borderRadius: "4px" }} />
                      </div>
                    )}
                  </div>

                  {/* CERTIFICATIONS UPLOAD */}
                  <div className="form-group">
                    <label>Certifications (Multiple Uploads)</label>
                    <label className="btn btn-secondary btn-sm btn-block" style={{ width: "100%", padding: "8px 10px" }}>
                      {uploadingCert ? "Uploading Certification..." : "➕ Add Certification File"}
                      <input
                        type="file"
                        accept="image/*,application/pdf"
                        style={{ display: "none" }}
                        onChange={handleCertUpload}
                        disabled={uploadingCert}
                      />
                    </label>
                    {pracCertifications.length > 0 && (
                      <div style={{ display: "flex", flexWrap: "wrap", gap: "5px", marginTop: "8px" }}>
                        {pracCertifications.map((url, idx) => (
                          <div key={idx} style={{ background: "#e9ecef", border: "1px solid #ced4da", borderRadius: "4px", padding: "4px 8px", display: "flex", alignItems: "center", gap: "6px", fontSize: "0.75rem" }}>
                            <span style={{ maxWidth: "120px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={getFileName(url)}>📜 {getFileName(url)}</span>
                            <button type="button" style={{ border: "none", background: "none", color: "#dc3545", cursor: "pointer", fontWeight: "bold" }} onClick={() => handleRemoveCert(url)}>✕</button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* SOCIAL LINKS */}
                  <div className="form-group">
                    <label>Social Media Links</label>
                    <div style={{ display: "flex", flexDirection: "column", gap: "6px", padding: "10px", background: "#f8f9fa", borderRadius: "4px", border: "1px solid #ced4da" }}>
                      <input 
                        type="text" 
                        className="form-control" 
                        placeholder="Facebook URL"
                        value={socialFacebook}
                        onChange={(e) => setSocialFacebook(e.target.value)}
                      />
                      <input 
                        type="text" 
                        className="form-control" 
                        placeholder="Instagram URL"
                        value={socialInstagram}
                        onChange={(e) => setSocialInstagram(e.target.value)}
                      />
                      <input 
                        type="text" 
                        className="form-control" 
                        placeholder="LinkedIn URL"
                        value={socialLinkedin}
                        onChange={(e) => setSocialLinkedin(e.target.value)}
                      />
                      <input 
                        type="text" 
                        className="form-control" 
                        placeholder="YouTube URL"
                        value={socialYoutube}
                        onChange={(e) => setSocialYoutube(e.target.value)}
                      />
                    </div>
                  </div>

                  {/* AREAS OF EXPERTISE & DYNAMIC ADDITION */}
                  <div className="form-group">
                    <label>Areas of Expertise</label>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "8px", maxHeight: "150px", overflowY: "auto", border: "1px solid #ced4da", padding: "8px", borderRadius: "4px", background: "#fff" }}>
                      {expertiseOptions.map(opt => (
                        <label key={opt.id} style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "0.85rem", cursor: "pointer", fontWeight: "normal" }}>
                          <input
                            type="checkbox"
                            checked={pracExpertise.includes(opt.name)}
                            onChange={() => handleExpertiseChange(opt.name)}
                          />
                          <span>{opt.name}</span>
                        </label>
                      ))}
                    </div>

                    <div style={{ display: "flex", gap: "6px", marginTop: "8px" }}>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="Add custom expertise..."
                        value={newExpertiseName}
                        onChange={(e) => setNewExpertiseName(e.target.value)}
                      />
                      <button type="button" className="btn btn-secondary btn-sm" onClick={handleAddCustomExpertise}>
                        ➕ Add
                      </button>
                    </div>
                  </div>
                </div>

                <div className="modal-form-footer">
                  <button
                    type="button"
                    className="modal-cancel-btn"
                    onClick={() => {
                      setIsModalOpen(false);
                      handleCancelEdit();
                    }}
                  >
                    Cancel
                  </button>
                  <button type="submit" className={`btn ${editingId ? 'btn-warning' : 'btn-success'}`}>
                    {editingId ? "Update Healer Profile" : "Register Healer"}
                  </button>
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
        />
      )}

      <style jsx>{`
        .admin-full-layout {
          width: 100%;
        }
        .split-list-col {
          display: flex;
          flex-direction: column;
        }
        .mb-3 {
          margin-bottom: 1rem;
        }
        .mt-3 {
          margin-top: 1rem;
        }
        .table-responsive {
          width: 100%;
          overflow-x: auto;
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
          max-width: 650px;
          max-height: 90vh;
          border-radius: 20px;
          box-shadow: 0 20px 50px rgba(0,0,0,0.15);
          animation: scaleUp 0.3s cubic-bezier(0.16, 1, 0.3, 1);
          overflow: hidden;
        }
        :global(.modal-inner-card) {
          padding: 0 !important;
          position: relative !important;
          display: flex;
          flex-direction: column;
          max-height: 90vh;
          background: rgba(255, 255, 255, 0.95);
          backdrop-filter: blur(12px);
          border: 1px solid rgba(255, 255, 255, 0.2);
        }
        .modal-title-bar {
          padding: 24px 24px 0;
          margin-bottom: 0 !important;
          font-family: var(--font-serif);
          font-size: 1.35rem;
          color: #4c1d95;
          font-weight: 700;
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
          gap: 20px;
          overflow-y: auto;
          padding: 20px 24px 24px;
          flex: 1;
        }
        .modal-form-footer {
          display: flex;
          justify-content: flex-end;
          gap: 12px;
          padding: 16px 24px 24px;
          border-top: 1px solid rgba(0, 0, 0, 0.08);
          background: rgba(255, 255, 255, 0.98);
          position: sticky;
          bottom: 0;
          z-index: 5;
        }
        .modal-cancel-btn {
          background: transparent;
          border: 1px solid rgba(0, 0, 0, 0.12);
          color: #64748b;
          padding: 10px 20px;
          border-radius: 12px;
          font-size: 0.85rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
          white-space: nowrap;
        }
        .modal-cancel-btn:hover {
          border-color: rgba(0, 0, 0, 0.2);
          color: #1e293b;
        }
        .close-modal-btn {
          position: absolute;
          top: 20px;
          right: 20px;
          background: transparent;
          border: none;
          color: #64748b;
          font-size: 1.2rem;
          cursor: pointer;
          transition: all 0.2s;
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
      `}</style>
    </div>
  );
}
