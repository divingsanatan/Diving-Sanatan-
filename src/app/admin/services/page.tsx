"use client";

import React, { useState, useEffect, useRef } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { formatCurrency } from "@/utils/formatters";
import { Service, Practitioner, Category } from "@/types/database";

export default function AdminServicesPage() {
  const [services, setServices] = useState<Service[]>([]);
  const [practitioners, setPractitioners] = useState<Practitioner[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editServiceId, setEditServiceId] = useState<string | null>(null);

  // Form states
  const [serviceName, setServiceName] = useState("");
  const [servicePrice, setServicePrice] = useState("");
  const [serviceDuration, setServiceDuration] = useState("");
  const [servicePractitioner, setServicePractitioner] = useState("");
  const [servicePractitionerId, setServicePractitionerId] = useState("");
  const [selectedServiceCategories, setSelectedServiceCategories] = useState<string[]>([]);
  const [serviceDesc, setServiceDesc] = useState("");
  const [serviceImage, setServiceImage] = useState("");
  const [serviceVideoUrl, setServiceVideoUrl] = useState("");
  const [benefits, setBenefits] = useState<string[]>([]);
  const [processSteps, setProcessSteps] = useState<string[]>([]);

  // UI state
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadingVideo, setUploadingVideo] = useState(false);
  const [saving, setSaving] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const getServiceImagePreview = (imgName: string) => {
    if (!imgName) return "";
    if (imgName.startsWith("http") || imgName.startsWith("/")) return imgName;
    const mappings: Record<string, string> = {
      aura_balancing: "/images/service_chakra.png",
      crystal_healing: "/images/service_regression.png",
      chakra_clearing: "/images/service_akashic.png",
      mindfulness_meditation: "/images/service_chakra.png",
      anxiety_release: "/images/service_regression.png",
      spiritual_counseling: "/images/service_akashic.png",
    };
    return mappings[imgName] || "";
  };

  const loadData = async () => {
    try {
      setLoading(true);
      const [sRes, pRes, cRes] = await Promise.all([
        fetch("/api/services"),
        fetch("/api/practitioners"),
        fetch("/api/categories")
      ]);

      const sJson = await sRes.json();
      const pJson = await pRes.json();
      const cJson = await cRes.json();

      if (sJson.success && pJson.success && cJson.success) {
        setServices(sJson.data);
        setPractitioners(pJson.data);
        setCategories(cJson.data);
        if (pJson.data.length > 0 && !servicePractitioner) {
          setServicePractitioner(pJson.data[0].name);
          setServicePractitionerId(pJson.data[0].id);
        }
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

  useEffect(() => {
    if (!servicePractitioner || servicePractitionerId) return;
    const match = practitioners.find((p) => p.name === servicePractitioner);
    if (match) setServicePractitionerId(match.id);
  }, [practitioners, servicePractitioner, servicePractitionerId]);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const resetForm = () => {
    setServiceName("");
    setServicePrice("");
    setServiceDuration("");
    if (practitioners.length > 0) {
      setServicePractitioner(practitioners[0].name);
      setServicePractitionerId(practitioners[0].id);
    } else {
      setServicePractitioner("");
      setServicePractitionerId("");
    }
    setSelectedServiceCategories([]);
    setServiceDesc("");
    setServiceImage("");
    setServiceVideoUrl("");
    setBenefits([]);
    setProcessSteps([]);
    setEditMode(false);
    setEditServiceId(null);
  };

  const handleOpenCreateModal = () => {
    resetForm();
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (service: Service) => {
    setEditMode(true);
    setEditServiceId(service.id);
    setServiceName(service.name);
    setServicePrice(service.price.toString());
    setServiceDuration(service.duration);
    const matchedPractitioner = practitioners.find((p) => p.name === service.practitioner);
    setServicePractitioner(matchedPractitioner?.name || service.practitioner);
    setServicePractitionerId(matchedPractitioner?.id || "");
    let categoryIds = service.categoryIds || [];
    if (categoryIds.length === 0 && service.categories?.length) {
      categoryIds = service.categories
        .map(name => categories.find(c => c.name === name)?.id)
        .filter((id): id is string => Boolean(id));
    }
    setSelectedServiceCategories(categoryIds);
    setServiceDesc(service.description);
    setServiceImage(service.image || "");
    setServiceVideoUrl(service.video_url || "");
    setBenefits(service.benefits || []);
    setProcessSteps(service.process || []);
    setIsModalOpen(true);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: "image" | "video") => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);

    if (type === "image") setUploadingImage(true);
    else setUploadingVideo(true);

    try {
      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData
      });
      const json = await res.json();
      if (json.success) {
        if (type === "image") setServiceImage(json.url);
        else setServiceVideoUrl(json.url);
      } else {
        alert("Upload failed: " + json.error);
      }
    } catch (err) {
      console.error(err);
      alert("An error occurred during file upload.");
    } finally {
      if (type === "image") setUploadingImage(false);
      else setUploadingVideo(false);
    }
  };

  const handleSaveService = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!serviceName || !servicePrice || !serviceDuration || !serviceDesc) {
      alert("Please enter all required fields.");
      return;
    }
    if (selectedServiceCategories.length === 0) {
      alert("Please select at least one category.");
      return;
    }
    if (!servicePractitionerId || !servicePractitioner.trim()) {
      alert("Please assign a practitioner.");
      return;
    }

    const payload = {
      name: serviceName,
      price: Number(servicePrice),
      duration: serviceDuration,
      practitioner: servicePractitioner,
      categoryIds: selectedServiceCategories,
      description: serviceDesc,
      image: serviceImage || "aura_balancing",
      video_url: serviceVideoUrl,
      benefits: benefits.filter(b => b.trim() !== ""),
      process: processSteps.filter(p => p.trim() !== "")
    };

    try {
      setSaving(true);
      let res;
      if (editMode && editServiceId) {
        res = await fetch("/api/services", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: editServiceId, ...payload })
        });
      } else {
        res = await fetch("/api/services", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });
      }

      const json = await res.json();
      if (json.success) {
        setIsModalOpen(false);
        resetForm();
        alert(editMode ? "Service details updated successfully!" : "Service successfully added to catalog!");
        loadData();
      } else {
        alert(json.error || "Operation failed. Please try again.");
      }
    } catch (err) {
      console.error(err);
      alert("Network error while saving. Please check your connection and try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteService = async (id: string) => {
    if (!confirm("Are you sure you want to remove this service from catalog?")) return;
    try {
      const res = await fetch(`/api/services?id=${id}`, { method: "DELETE" });
      const json = await res.json();
      if (json.success) {
        loadData();
      } else {
        alert("Failed to delete service: " + json.error);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddBenefit = () => setBenefits([...benefits, ""]);
  const handleUpdateBenefit = (index: number, val: string) => {
    const next = [...benefits];
    next[index] = val;
    setBenefits(next);
  };
  const handleRemoveBenefit = (index: number) => {
    setBenefits(benefits.filter((_, idx) => idx !== index));
  };

  const handleAddProcessStep = () => setProcessSteps([...processSteps, ""]);
  const handleUpdateProcessStep = (index: number, val: string) => {
    const next = [...processSteps];
    next[index] = val;
    setProcessSteps(next);
  };
  const handleRemoveProcessStep = (index: number) => {
    setProcessSteps(processSteps.filter((_, idx) => idx !== index));
  };

  const toggleCategorySelection = (catId: string) => {
    if (selectedServiceCategories.includes(catId)) {
      setSelectedServiceCategories(selectedServiceCategories.filter(id => id !== catId));
    } else {
      setSelectedServiceCategories([...selectedServiceCategories, catId]);
    }
  };

  const getCategoryNamesSelected = () => {
    return selectedServiceCategories
      .map(id => categories.find(c => c.id === id)?.name)
      .filter(Boolean) as string[];
  };

  return (
    <div className="dashboard-content">
      <div className="dashboard-header-row">
        <div>
          <h2>Services Catalog</h2>
          <p className="admin-header-desc">
            Add new treatments, edit specifications, classify under disciplines, and allocate certified healers.
          </p>
        </div>
        <div className="header-actions">
          <button className="sync-btn" onClick={loadData}>
            🔄 Refresh Services
          </button>
          <Button variant="gold" onClick={handleOpenCreateModal}>
            ➕ Add Service
          </Button>
        </div>
      </div>

      {loading ? (
        <p className="admin-loading">Loading catalog data...</p>
      ) : (
        <div className="admin-split-layout">
          <div className="split-list-col">
            <h3 className="column-title">Services List ({services.length})</h3>
            <div className="table-responsive-container">
              <table className="admin-glass-table">
                <thead>
                  <tr>
                    <th>Service</th>
                    <th>Categories</th>
                    <th>Duration</th>
                    <th>Price</th>
                    <th>Practitioner</th>
                    <th className="text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {services.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="admin-empty-cell">
                        No services in catalog.
                      </td>
                    </tr>
                  ) : (
                    services.map(s => (
                      <tr key={s.id}>
                        <td>
                          <div className="table-service-info">
                            <span className="service-name">{s.name}</span>
                            <span className="service-desc-tooltip" title={s.description}>
                              {s.description.length > 60 ? `${s.description.substring(0, 57)}...` : s.description}
                            </span>
                          </div>
                        </td>
                        <td>
                          <div className="categories-chips-container">
                            {s.categories && s.categories.length > 0 ? (
                              s.categories.map((catName, idx) => (
                                <span key={idx} className="category-chip">
                                  {catName}
                                </span>
                              ))
                            ) : (
                              <span className="category-chip muted">Uncategorized</span>
                            )}
                          </div>
                        </td>
                        <td>
                          <span className="duration-text">{s.duration}</span>
                        </td>
                        <td>
                          <span className="price-text">{formatCurrency(s.price)}</span>
                        </td>
                        <td>
                          <span className="practitioner-text">{s.practitioner}</span>
                        </td>
                        <td className="text-right">
                          <div className="action-buttons-cell">
                            <button className="edit-row-btn" onClick={() => handleOpenEditModal(s)}>
                              ✎ Edit
                            </button>
                            <button className="delete-row-btn" onClick={() => handleDeleteService(s.id)}>
                              ✕ Remove
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

      {/* Modal Popup for Creating/Editing Service */}
      {isModalOpen && (
        <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div className="modal-content-wrapper" onClick={(e) => e.stopPropagation()}>
            <Card variant="glass" className="modal-inner-card">
              <button className="close-modal-btn" onClick={() => setIsModalOpen(false)}>
                ✕
              </button>
              <h3 className="column-title modal-title-bar">
                {editMode ? "Edit Service details" : "Create Service"}
              </h3>
              
              <form onSubmit={handleSaveService} className="admin-catalog-form">
                <div className="modal-form-scroll">
                <div className="form-group">
                  <label>Service Name *</label>
                  <input
                    type="text"
                    className="glass-input"
                    required
                    placeholder="e.g. Reiki Infusion"
                    value={serviceName}
                    onChange={(e) => setServiceName(e.target.value)}
                  />
                </div>

                <div className="form-row">
                  <div className="form-group form-group-flex">
                    <label>Price ($) *</label>
                    <input
                      type="number"
                      className="glass-input"
                      required
                      placeholder="e.g. 100"
                      value={servicePrice}
                      onChange={(e) => setServicePrice(e.target.value)}
                    />
                  </div>
                  <div className="form-group form-group-flex">
                    <label>Duration *</label>
                    <input
                      type="text"
                      className="glass-input"
                      required
                      placeholder="e.g. 1 Hour"
                      value={serviceDuration}
                      onChange={(e) => setServiceDuration(e.target.value)}
                    />
                  </div>
                </div>

                {/* Custom Multi-select Dropdown instead of checkboxes */}
                <div className="form-group" ref={dropdownRef}>
                  <label>Categories *</label>
                  <div className="dropdown-selector-wrapper">
                    <div 
                      className="dropdown-trigger-box glass-input"
                      onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                    >
                      <div className="selected-categories-preview">
                        {getCategoryNamesSelected().length === 0 ? (
                          <span className="placeholder-text">Select Categories...</span>
                        ) : (
                          getCategoryNamesSelected().map(name => (
                            <span 
                              key={name} 
                              className="selected-preview-chip"
                              onClick={(e) => {
                                e.stopPropagation();
                                const cat = categories.find(c => c.name === name);
                                if (cat) toggleCategorySelection(cat.id);
                              }}
                            >
                              {name} <span className="chip-close-x">×</span>
                            </span>
                          ))
                        )}
                      </div>
                      <span className="dropdown-chevron-arrow">▼</span>
                    </div>

                    {isDropdownOpen && (
                      <div className="dropdown-options-menu glass-panel">
                        {categories.map(cat => {
                          const isSelected = selectedServiceCategories.includes(cat.id);
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

                <div className="form-group">
                    <label>Assign Practitioner *</label>
                  <select
                    className="glass-input"
                      required
                      value={servicePractitionerId}
                      onChange={(e) => {
                        const prac = practitioners.find((p) => p.id === e.target.value);
                        setServicePractitionerId(e.target.value);
                        setServicePractitioner(prac?.name || "");
                      }}
                  >
                      <option value="">Select practitioner...</option>
                    {practitioners.map(p => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>Description *</label>
                  <textarea
                    className="glass-input desc-area"
                    required
                    placeholder="Write detailed healing session descriptions..."
                    value={serviceDesc}
                    onChange={(e) => setServiceDesc(e.target.value)}
                  />
                </div>

                {/* Image upload field */}
                <div className="form-group">
                  <label>Service Image Asset URL</label>
                  <div className="media-input-row">
                    <input
                      type="text"
                      className="glass-input"
                      placeholder="Enter Image URL or Upload File"
                      value={serviceImage}
                      onChange={(e) => setServiceImage(e.target.value)}
                    />
                    <label className="upload-media-btn">
                      {uploadingImage ? "⌛ Uplo..." : "⬆️ Image"}
                      <input 
                        type="file" 
                        accept="image/*" 
                        onChange={(e) => handleFileUpload(e, "image")}
                        className="hidden-file-input"
                        disabled={uploadingImage}
                      />
                    </label>
                  </div>
                    {serviceImage && getServiceImagePreview(serviceImage) && (
                    <div className="media-preview-container">
                        <img src={getServiceImagePreview(serviceImage)} alt="Service preview" className="media-preview-img" />
                    </div>
                  )}
                </div>

                {/* Video upload field */}
                <div className="form-group">
                  <label>Service Video (Upload MP4 or paste video link)</label>
                  <div className="media-input-row">
                    <input
                      type="text"
                      className="glass-input"
                      placeholder="Enter Video URL or Upload File"
                      value={serviceVideoUrl}
                      onChange={(e) => setServiceVideoUrl(e.target.value)}
                    />
                    <label className="upload-media-btn">
                      {uploadingVideo ? "⌛ Uplo..." : "⬆️ Video"}
                      <input 
                        type="file" 
                        accept="video/*" 
                        onChange={(e) => handleFileUpload(e, "video")}
                        className="hidden-file-input"
                        disabled={uploadingVideo}
                      />
                    </label>
                  </div>
                  {serviceVideoUrl && (
                    <div className="media-preview-container">
                      <span className="media-preview-badge">Video Attached</span>
                      <span className="media-preview-text">{serviceVideoUrl}</span>
                    </div>
                  )}
                </div>

                {/* Somatic Benefits lists */}
                <div className="form-group">
                  <div className="list-header-row">
                    <label>Somatic Benefits</label>
                    <button type="button" className="add-list-item-btn" onClick={handleAddBenefit}>
                      ＋ Add Benefit
                    </button>
                  </div>
                  <div className="dynamic-inputs-list">
                    {benefits.map((benefit, idx) => (
                      <div key={idx} className="dynamic-item-row">
                        <input
                          type="text"
                          className="glass-input"
                          placeholder="e.g. Clears cognitive fatigue"
                          value={benefit}
                          onChange={(e) => handleUpdateBenefit(idx, e.target.value)}
                        />
                        <button type="button" className="remove-item-btn" onClick={() => handleRemoveBenefit(idx)}>
                          ✕
                        </button>
                      </div>
                    ))}
                    {benefits.length === 0 && (
                      <span className="list-empty-label">No benefits listed yet. Click button to add benefits.</span>
                    )}
                  </div>
                </div>

                {/* Process Steps lists */}
                <div className="form-group">
                  <div className="list-header-row">
                    <label>Therapeutic Process Steps</label>
                    <button type="button" className="add-list-item-btn" onClick={handleAddProcessStep}>
                      ＋ Add Step
                    </button>
                  </div>
                  <div className="dynamic-inputs-list">
                    {processSteps.map((step, idx) => (
                      <div key={idx} className="dynamic-item-row">
                        <span className="step-number-indicator">{idx + 1}</span>
                        <input
                          type="text"
                          className="glass-input"
                          placeholder="e.g. Initial acoustic tuning bowl resonance scan"
                          value={step}
                          onChange={(e) => handleUpdateProcessStep(idx, e.target.value)}
                        />
                        <button type="button" className="remove-item-btn" onClick={() => handleRemoveProcessStep(idx)}>
                          ✕
                        </button>
                      </div>
                    ))}
                    {processSteps.length === 0 && (
                      <span className="list-empty-label">No process steps listed yet. Click button to add steps.</span>
                    )}
                  </div>
                </div>
                </div>

                <div className="modal-form-footer">
                  <button
                    type="button"
                    className="modal-cancel-btn"
                    onClick={() => {
                      setIsModalOpen(false);
                      resetForm();
                    }}
                  >
                    Cancel
                  </button>
                  <Button variant="gold" type="submit" disabled={saving} >
                    {saving ? "Saving..." : editMode ? "Save Changes" : "Create Service"}
                  </Button>
                </div>
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
          max-width: 620px;
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
        }
        .modal-title-bar {
          padding: 32px 32px 0;
          margin-bottom: 0 !important;
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
          padding: 20px 32px 24px;
          flex: 1;
        }
        .modal-form-footer {
          display: flex;
          gap: 12px;
          padding: 16px 32px 24px;
          border-top: 1px solid rgba(0, 0, 0, 0.08);
          background: rgba(255, 255, 255, 0.98);
          position: sticky;
          bottom: 0;
          z-index: 5;
        }
        .modal-cancel-btn {
          background: transparent;
          border: 1px solid rgba(0, 0, 0, 0.12);
          color: hsl(var(--text-muted));
          padding: 14px 20px;
          border-radius: 12px;
          font-size: 0.85rem;
          font-weight: 600;
          cursor: pointer;
          transition: var(--transition-fast);
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
          max-width: 250px;
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
        .categories-chips-container {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
          max-width: 200px;
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
        .duration-text {
          font-weight: 500;
          color: hsl(var(--text-cream));
        }
        .price-text {
          font-weight: 600;
          color: #db2777;
        }
        .practitioner-text {
          color: hsl(var(--text-muted));
          font-size: 0.85rem;
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
        .form-row {
          display: flex;
          gap: 16px;
        }
        .desc-area {
          height: 100px;
          resize: none;
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

        /* Media file upload & dynamic lists design */
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
          transition: var(--transition-fast);
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
        .media-preview-badge {
          background: rgba(34, 197, 94, 0.08);
          border: 1px solid rgba(34, 197, 94, 0.2);
          color: #15803d;
          font-size: 0.7rem;
          font-weight: 700;
          padding: 3px 8px;
          border-radius: 6px;
          text-transform: uppercase;
        }
        .media-preview-text {
          font-size: 0.8rem;
          color: hsl(var(--text-muted));
          word-break: break-all;
        }
        
        .list-header-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 4px;
        }
        .add-list-item-btn {
          background: transparent;
          border: none;
          color: #7c3aed;
          font-size: 0.82rem;
          font-weight: 700;
          cursor: pointer;
          transition: var(--transition-fast);
        }
        .add-list-item-btn:hover {
          color: #6d28d9;
          transform: translateY(-1px);
        }
        .dynamic-inputs-list {
          display: flex;
          flex-direction: column;
          gap: 8px;
          background: rgba(0,0,0,0.01);
          border: 1px solid rgba(0,0,0,0.04);
          padding: 12px;
          border-radius: 10px;
        }
        .dynamic-item-row {
          display: flex;
          gap: 10px;
          align-items: center;
        }
        .dynamic-item-row input {
          flex: 1;
        }
        .step-number-indicator {
          width: 24px;
          height: 24px;
          background: rgba(168, 85, 247, 0.1);
          color: #7c3aed;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 0.78rem;
          font-weight: 700;
          flex-shrink: 0;
        }
        .remove-item-btn {
          background: transparent;
          border: none;
          color: rgba(0, 0, 0, 0.3);
          font-size: 1rem;
          cursor: pointer;
          padding: 4px 8px;
          transition: var(--transition-fast);
        }
        .remove-item-btn:hover {
          color: #ef4444;
        }
        .list-empty-label {
          font-size: 0.78rem;
          color: rgba(0, 0, 0, 0.4);
          font-style: italic;
          text-align: center;
          padding: 8px 0;
        }
      `}</style>
    </div>
  );
}
