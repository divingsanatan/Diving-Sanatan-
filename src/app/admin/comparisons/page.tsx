"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import {
  ComparisonPage,
  ComparisonRowItem,
  ComparisonMediaItem,
  Service,
} from "@/types/database";

const emptyRow = (): ComparisonRowItem => ({ label: "", valueA: "", valueB: "" });

export default function AdminComparisonsPage() {
  const [pages, setPages] = useState<ComparisonPage[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [title, setTitle] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [slug, setSlug] = useState("");
  const [modalityAName, setModalityAName] = useState("");
  const [modalityAPrice, setModalityAPrice] = useState("");
  const [modalityAServiceId, setModalityAServiceId] = useState("");
  const [modalityBName, setModalityBName] = useState("");
  const [modalityBPrice, setModalityBPrice] = useState("");
  const [modalityBServiceId, setModalityBServiceId] = useState("");
  const [rows, setRows] = useState<ComparisonRowItem[]>([emptyRow()]);
  const [media, setMedia] = useState<ComparisonMediaItem[]>([]);
  const [serviceIds, setServiceIds] = useState<string[]>([]);
  const [uploadingMediaIdx, setUploadingMediaIdx] = useState<number | null>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      const [cRes, sRes] = await Promise.all([
        fetch("/api/comparisons"),
        fetch("/api/services"),
      ]);
      const cJson = await cRes.json();
      const sJson = await sRes.json();
      if (cJson.success) setPages(cJson.data);
      if (sJson.success) setServices(sJson.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const resetForm = () => {
    setTitle("");
    setSubtitle("");
    setSlug("");
    setModalityAName("");
    setModalityAPrice("");
    setModalityAServiceId("");
    setModalityBName("");
    setModalityBPrice("");
    setModalityBServiceId("");
    setRows([emptyRow()]);
    setMedia([]);
    setServiceIds([]);
    setEditMode(false);
    setEditId(null);
  };

  const handleOpenCreate = () => {
    resetForm();
    setIsModalOpen(true);
  };

  const handleOpenEdit = (page: ComparisonPage) => {
    setEditMode(true);
    setEditId(page.id);
    setTitle(page.title);
    setSubtitle(page.subtitle);
    setSlug(page.slug);
    setModalityAName(page.modalityAName);
    setModalityAPrice(page.modalityAPrice);
    setModalityAServiceId(page.modalityAServiceId || "");
    setModalityBName(page.modalityBName);
    setModalityBPrice(page.modalityBPrice);
    setModalityBServiceId(page.modalityBServiceId || "");
    setRows(page.rows.length > 0 ? page.rows : [emptyRow()]);
    setMedia(page.media || []);
    setServiceIds(page.serviceIds || []);
    setIsModalOpen(true);
  };

  const handleAddRow = () => setRows([...rows, emptyRow()]);

  const handleUpdateRow = (idx: number, field: keyof ComparisonRowItem, val: string) => {
    const next = [...rows];
    next[idx] = { ...next[idx], [field]: val };
    setRows(next);
  };

  const handleRemoveRow = (idx: number) => {
    if (rows.length <= 1) return;
    setRows(rows.filter((_, i) => i !== idx));
  };

  const handleAddImage = () => setMedia([...media, { type: "image", src: "" }]);
  const handleAddVideo = () => setMedia([...media, { type: "video", src: "" }]);

  const handleUpdateMedia = (idx: number, src: string) => {
    const next = [...media];
    next[idx] = { ...next[idx], src };
    setMedia(next);
  };

  const handleRemoveMedia = (idx: number) => setMedia(media.filter((_, i) => i !== idx));

  const handleMediaUpload = async (e: React.ChangeEvent<HTMLInputElement>, idx: number) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const formData = new FormData();
    formData.append("file", file);
    setUploadingMediaIdx(idx);
    try {
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      const json = await res.json();
      if (json.success) handleUpdateMedia(idx, json.url);
      else alert("Upload failed: " + json.error);
    } catch {
      alert("Upload error occurred.");
    } finally {
      setUploadingMediaIdx(null);
    }
  };

  const toggleServiceId = (id: string) => {
    setServiceIds(prev =>
      prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]
    );
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !slug.trim()) {
      alert("Title and slug are required.");
      return;
    }
    setSaving(true);
    const payload = {
      title: title.trim(),
      subtitle: subtitle.trim(),
      slug: slug.trim().toLowerCase().replace(/\s+/g, "-"),
      modalityAName,
      modalityAPrice,
      modalityAServiceId: modalityAServiceId || null,
      modalityBName,
      modalityBPrice,
      modalityBServiceId: modalityBServiceId || null,
      rows: rows.filter(r => r.label.trim() || r.valueA.trim() || r.valueB.trim()),
      media: media.filter(m => m.src.trim()),
      serviceIds,
    };
    try {
      const res = await fetch("/api/comparisons", {
        method: editMode ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editMode ? { id: editId, ...payload } : payload),
      });
      const json = await res.json();
      if (json.success) {
        setIsModalOpen(false);
        resetForm();
        loadData();
      } else {
        alert("Save failed: " + json.error);
      }
    } catch {
      alert("An error occurred while saving.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this comparison page?")) return;
    try {
      const res = await fetch(`/api/comparisons?id=${id}`, { method: "DELETE" });
      const json = await res.json();
      if (json.success) loadData();
      else alert("Delete failed: " + json.error);
    } catch {
      alert("Delete error occurred.");
    }
  };

  return (
    <div className="dashboard-content">
      <div className="dashboard-header-row">
        <h2>Comparison Pages</h2>
        <div className="header-actions">
          <button type="button" className="sync-btn" onClick={loadData}>↻ Refresh</button>
          <Button variant="gold" onClick={handleOpenCreate}>+ New Comparison</Button>
        </div>
      </div>

      <Card variant="glass" className="admin-card-flush">
        {loading ? (
          <p className="admin-padding-msg">Loading...</p>
        ) : pages.length === 0 ? (
          <p className="admin-padding-msg">
            No comparison pages yet. Click &quot;+ New Comparison&quot; to create one.
          </p>
        ) : (
          <table className="admin-glass-table">
            <thead>
              <tr>
                <th>Title</th>
                <th>Slug</th>
                <th>Rows</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {pages.map(page => (
                <tr key={page.id}>
                  <td>{page.title}</td>
                  <td>
                    <Link href={`/blog/comparison/${page.slug}`} target="_blank" className="slug-link">
                      /blog/comparison/{page.slug}
                    </Link>
                  </td>
                  <td>{page.rows.length}</td>
                  <td>
                    <div className="action-btns">
                      <button type="button" className="edit-btn" onClick={() => handleOpenEdit(page)}>Edit</button>
                      <button type="button" className="remove-btn" onClick={() => handleDelete(page.id)}>Remove</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>

      {isModalOpen && (
        <div className="modal-overlay" onClick={() => { setIsModalOpen(false); resetForm(); }}>
          <div className="modal-content-wrapper" onClick={e => e.stopPropagation()}>
            <Card variant="glass" className="modal-inner-card">
              <h3 className="modal-title-bar">{editMode ? "Edit Comparison Page" : "Create Comparison Page"}</h3>
              <form className="admin-catalog-form" onSubmit={handleSave}>
                <div className="modal-form-scroll">
                  <div className="form-group">
                    <label>Page Title</label>
                    <input type="text" className="glass-input" value={title} onChange={e => setTitle(e.target.value)} placeholder="Healing Modal Comparison" required />
                  </div>
                  <div className="form-group">
                    <label>Subtitle</label>
                    <textarea className="glass-input" rows={2} value={subtitle} onChange={e => setSubtitle(e.target.value)} placeholder="Compare our signature spiritual practices..." />
                  </div>
                  <div className="form-group">
                    <label>URL Slug</label>
                    <input type="text" className="glass-input" value={slug} onChange={e => setSlug(e.target.value)} placeholder="healing-modal" required />
                  </div>

                  <div className="form-section-label">Modality A (Left Column)</div>
                  <div className="form-row-2">
                    <div className="form-group">
                      <label>Name</label>
                      <input type="text" className="glass-input" value={modalityAName} onChange={e => setModalityAName(e.target.value)} placeholder="Aura Scanning" />
                    </div>
                    <div className="form-group">
                      <label>Price Label</label>
                      <input type="text" className="glass-input" value={modalityAPrice} onChange={e => setModalityAPrice(e.target.value)} placeholder="₹1,500 / SESSION" />
                    </div>
                  </div>
                  <div className="form-group">
                    <label>Link to Service (optional)</label>
                    <select className="glass-input" value={modalityAServiceId} onChange={e => setModalityAServiceId(e.target.value)}>
                      <option value="">— None —</option>
                      {services.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                  </div>

                  <div className="form-section-label">Modality B (Right Column)</div>
                  <div className="form-row-2">
                    <div className="form-group">
                      <label>Name</label>
                      <input type="text" className="glass-input" value={modalityBName} onChange={e => setModalityBName(e.target.value)} placeholder="Chakra Healing" />
                    </div>
                    <div className="form-group">
                      <label>Price Label</label>
                      <input type="text" className="glass-input" value={modalityBPrice} onChange={e => setModalityBPrice(e.target.value)} placeholder="₹2,500 / SESSION" />
                    </div>
                  </div>
                  <div className="form-group">
                    <label>Link to Service (optional)</label>
                    <select className="glass-input" value={modalityBServiceId} onChange={e => setModalityBServiceId(e.target.value)}>
                      <option value="">— None —</option>
                      {services.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                  </div>

                  <div className="form-section-label">
                    <span>Comparison Rows</span>
                    <button type="button" className="add-row-plus-btn" onClick={handleAddRow} title="Add row">
                      ＋
                    </button>
                  </div>
                  <div className="comparison-rows-editor">
                    {rows.map((row, idx) => (
                      <div key={idx} className="comparison-row-block">
                        <div className="row-block-header">
                          <span>Row {idx + 1}</span>
                          {rows.length > 1 && (
                            <button type="button" className="remove-item-btn" onClick={() => handleRemoveRow(idx)}>✕</button>
                          )}
                        </div>
                        <input type="text" className="glass-input" placeholder="Label (e.g. Primary Purpose)" value={row.label} onChange={e => handleUpdateRow(idx, "label", e.target.value)} />
                        <input type="text" className="glass-input" placeholder={`${modalityAName || "Modality A"} value`} value={row.valueA} onChange={e => handleUpdateRow(idx, "valueA", e.target.value)} />
                        <input type="text" className="glass-input" placeholder={`${modalityBName || "Modality B"} value`} value={row.valueB} onChange={e => handleUpdateRow(idx, "valueB", e.target.value)} />
                      </div>
                    ))}
                  </div>

                  <div className="form-section-label">Media Carousel (Images & Videos)</div>
                  <div className="media-actions-row">
                    <button type="button" className="add-list-item-btn" onClick={handleAddImage}>＋ Add Image</button>
                    <button type="button" className="add-list-item-btn" onClick={handleAddVideo}>＋ Add Video</button>
                  </div>
                  {media.map((item, idx) => (
                    <div key={idx} className="dynamic-item-row">
                      <span className="media-type-badge">{item.type === "video" ? "🎥" : "🖼"}</span>
                      <input type="text" className="glass-input" placeholder="URL or upload below" value={item.src} onChange={e => handleUpdateMedia(idx, e.target.value)} />
                      <label className="upload-mini-btn">
                        {uploadingMediaIdx === idx ? "..." : "Upload"}
                        <input type="file" accept={item.type === "video" ? "video/*" : "image/*"} className="hidden-file-input" onChange={e => handleMediaUpload(e, idx)} disabled={uploadingMediaIdx === idx} />
                      </label>
                      <button type="button" className="remove-item-btn" onClick={() => handleRemoveMedia(idx)}>✕</button>
                    </div>
                  ))}

                  <div className="form-section-label">Services Carousel (select therapies to show below)</div>
                  <div className="service-checkboxes">
                    {services.map(s => (
                      <label key={s.id} className={`service-check-pill ${serviceIds.includes(s.id) ? "selected" : ""}`}>
                        <input type="checkbox" checked={serviceIds.includes(s.id)} onChange={() => toggleServiceId(s.id)} />
                        {s.name}
                      </label>
                    ))}
                    {services.length === 0 && <span className="list-empty-label">No services available.</span>}
                  </div>
                </div>

                <div className="modal-form-footer">
                  <button type="button" className="modal-cancel-btn" onClick={() => { setIsModalOpen(false); resetForm(); }}>Cancel</button>
                  <Button variant="gold" type="submit" disabled={saving} >
                    {saving ? "Saving..." : editMode ? "Save Changes" : "Create Page"}
                  </Button>
                </div>
              </form>
            </Card>
          </div>
        </div>
      )}

      <style jsx>{`
        .dashboard-content { display: flex; flex-direction: column; gap: 32px; }
        .dashboard-header-row { display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 16px; }
        .dashboard-header-row h2 { font-family: var(--font-serif); color: #4c1d95; font-size: 1.8rem; }
        .header-actions { display: flex; gap: 12px; align-items: center; }
        .sync-btn { background: rgba(0,0,0,0.02); border: 1px solid rgba(0,0,0,0.08); color: hsl(var(--text-cream)); padding: 10px 18px; border-radius: 8px; cursor: pointer; font-size: 0.85rem; font-weight: 600; }
        .sync-btn:hover { background: rgba(168, 85, 247, 0.08); border-color: #7c3aed; color: #7c3aed; }
        :global(.slug-link) { color: #7c3aed; font-size: 0.85rem; text-decoration: none; }
        :global(.slug-link:hover) { text-decoration: underline; }
        .action-btns { display: flex; gap: 8px; }
        .edit-btn, .remove-btn { padding: 6px 12px; border-radius: 6px; font-size: 0.78rem; font-weight: 600; cursor: pointer; border: 1px solid; }
        .edit-btn { background: rgba(168, 85, 247, 0.06); border-color: rgba(168, 85, 247, 0.25); color: #6d28d9; }
        .remove-btn { background: rgba(239, 68, 68, 0.06); border-color: rgba(239, 68, 68, 0.25); color: #ef4444; }
        .modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.45); backdrop-filter: blur(8px); z-index: 1000; display: flex; align-items: center; justify-content: center; padding: 20px; }
        .modal-content-wrapper { width: 100%; max-width: 680px; max-height: 90vh; border-radius: 20px; overflow: hidden; }
        :global(.modal-inner-card) { padding: 0 !important; display: flex; flex-direction: column; max-height: 90vh; }
        .modal-title-bar { padding: 28px 28px 0; font-family: var(--font-serif); color: #4c1d95; font-size: 1.4rem; }
        .admin-catalog-form { display: flex; flex-direction: column; flex: 1; min-height: 0; }
        .modal-form-scroll { display: flex; flex-direction: column; gap: 16px; overflow-y: auto; padding: 20px 28px 24px; flex: 1; }
        .modal-form-footer { display: flex; gap: 12px; padding: 16px 28px 24px; border-top: 1px solid rgba(0,0,0,0.08); }
        .modal-cancel-btn { background: transparent; border: 1px solid rgba(0,0,0,0.12); color: hsl(var(--text-muted)); padding: 14px 20px; border-radius: 12px; font-size: 0.85rem; font-weight: 600; cursor: pointer; }
        .form-group { display: flex; flex-direction: column; gap: 6px; }
        .form-group label { font-size: 0.78rem; font-weight: 700; color: #4c1d95; text-transform: uppercase; letter-spacing: 0.05em; }
        .form-row-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
        .form-section-label { display: flex; align-items: center; justify-content: space-between; font-family: var(--font-serif); font-size: 1.05rem; color: #4c1d95; margin-top: 8px; padding-top: 12px; border-top: 1px solid rgba(0,0,0,0.06); }
        .add-row-plus-btn { width: 36px; height: 36px; border-radius: 50%; border: 2px solid #7c3aed; background: rgba(124, 58, 237, 0.08); color: #7c3aed; font-size: 1.4rem; line-height: 1; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: var(--transition-fast); }
        .add-row-plus-btn:hover { background: #7c3aed; color: #fff; transform: scale(1.08); }
        .comparison-rows-editor { display: flex; flex-direction: column; gap: 12px; }
        .comparison-row-block { display: flex; flex-direction: column; gap: 8px; padding: 14px; border-radius: 12px; background: rgba(168, 85, 247, 0.03); border: 1px solid rgba(168, 85, 247, 0.12); }
        .row-block-header { display: flex; justify-content: space-between; align-items: center; font-size: 0.75rem; font-weight: 700; color: #6d28d9; text-transform: uppercase; }
        .remove-item-btn { background: transparent; border: none; color: #ef4444; cursor: pointer; font-size: 1rem; }
        .add-list-item-btn { background: rgba(168, 85, 247, 0.06); border: 1px solid rgba(168, 85, 247, 0.25); color: #6d28d9; padding: 8px 14px; border-radius: 8px; font-size: 0.8rem; font-weight: 600; cursor: pointer; }
        .media-actions-row { display: flex; gap: 10px; }
        .dynamic-item-row { display: flex; align-items: center; gap: 8px; }
        .media-type-badge { font-size: 1.1rem; flex-shrink: 0; }
        .upload-mini-btn { background: rgba(0,0,0,0.04); border: 1px solid rgba(0,0,0,0.1); padding: 8px 12px; border-radius: 8px; font-size: 0.75rem; font-weight: 600; cursor: pointer; white-space: nowrap; flex-shrink: 0; }
        .service-checkboxes { display: flex; flex-wrap: wrap; gap: 8px; }
        .service-check-pill { display: inline-flex; align-items: center; gap: 6px; padding: 8px 14px; border-radius: 99px; border: 1px solid rgba(0,0,0,0.1); font-size: 0.8rem; cursor: pointer; transition: var(--transition-fast); }
        .service-check-pill.selected { background: rgba(124, 58, 237, 0.1); border-color: #7c3aed; color: #6d28d9; }
        .service-check-pill input { display: none; }
        .list-empty-label { font-size: 0.82rem; color: hsl(var(--text-muted)); }
        :global(.glass-input) { width: 100%; padding: 10px 14px; border-radius: 10px; border: 1px solid rgba(0,0,0,0.1); background: rgba(255,255,255,0.8); font-size: 0.9rem; outline: none; font-family: var(--font-sans); }
        :global(.glass-input:focus) { border-color: #7c3aed; box-shadow: 0 0 0 3px rgba(124, 58, 237, 0.1); }
        .admin-glass-table { width: 100%; border-collapse: collapse; text-align: left; }
        .admin-glass-table th { padding: 16px 20px; font-size: 0.75rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; color: hsl(var(--text-muted)); border-bottom: 1px solid rgba(0,0,0,0.08); background: rgba(0,0,0,0.01); }
        .admin-glass-table td { padding: 16px 20px; font-size: 0.9rem; color: hsl(var(--text-cream)); border-bottom: 1px solid rgba(0,0,0,0.05); vertical-align: middle; }
        .admin-glass-table tbody tr:hover { background: rgba(0,0,0,0.02); }
        .admin-glass-table tbody tr:last-child td { border-bottom: none; }
        @media (max-width: 600px) { .form-row-2 { grid-template-columns: 1fr; } }
      `}</style>
    </div>
  );
}
