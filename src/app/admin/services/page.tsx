"use client";

import React, { useState, useEffect } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { formatCurrency } from "@/utils/formatters";
import { Service, Practitioner, Category } from "@/types/database";

export default function AdminServicesPage() {
  const [services, setServices] = useState<Service[]>([]);
  const [practitioners, setPractitioners] = useState<Practitioner[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form states
  const [serviceName, setServiceName] = useState("");
  const [servicePrice, setServicePrice] = useState("");
  const [serviceDuration, setServiceDuration] = useState("");
  const [servicePractitioner, setServicePractitioner] = useState("");
  const [selectedServiceCategories, setSelectedServiceCategories] = useState<string[]>([]);
  const [serviceDesc, setServiceDesc] = useState("");

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
        if (pJson.data.length > 0) {
          setServicePractitioner(pJson.data[0].name);
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

  const handleAddService = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!serviceName || !servicePrice || !serviceDuration || !serviceDesc) {
      alert("Please enter all service fields.");
      return;
    }
    if (selectedServiceCategories.length === 0) {
      alert("Please select at least one category.");
      return;
    }

    try {
      const res = await fetch("/api/services", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: serviceName,
          price: Number(servicePrice),
          duration: serviceDuration,
          practitioner: servicePractitioner,
          categoryIds: selectedServiceCategories,
          description: serviceDesc
        })
      });
      const json = await res.json();
      if (json.success) {
        setServiceName("");
        setServicePrice("");
        setServiceDuration("");
        setServiceDesc("");
        setSelectedServiceCategories([]);
        setIsModalOpen(false);
        alert("Service successfully added to catalog!");
        loadData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteService = async (id: string) => {
    if (!confirm("Are you sure you want to remove this service from catalog?")) return;
    try {
      const res = await fetch(`/api/services?id=${id}`, { method: "DELETE" });
      const json = await res.json();
      if (json.success) {
        loadData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="dashboard-content">
      <div className="dashboard-header-row">
        <div>
          <h2>Services Catalog</h2>
          <p style={{ color: "hsl(var(--text-muted))", fontSize: "0.9rem", marginTop: "4px" }}>
            Add new treatments, edit specifications, classify under disciplines, and allocate certified healers.
          </p>
        </div>
        <div className="header-actions">
          <button className="sync-btn" onClick={loadData}>
            🔄 Refresh Services
          </button>
          <Button variant="gold" onClick={() => setIsModalOpen(true)}>
            ➕ Add Service
          </Button>
        </div>
      </div>

      {loading ? (
        <p style={{ color: "hsl(var(--text-muted))", marginTop: "40px" }}>Loading catalog data...</p>
      ) : (
        <div className="admin-split-layout">
          {/* List */}
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
                    <th style={{ textAlign: "right" }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {services.length === 0 ? (
                    <tr>
                      <td colSpan={6} style={{ textAlign: "center", color: "hsl(var(--text-muted))", padding: "24px" }}>
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
                        <td style={{ textAlign: "right" }}>
                          <button className="delete-row-btn" onClick={() => handleDeleteService(s.id)}>
                            ✕ Remove
                          </button>
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

      {/* Modal Popup for Creating Service */}
      {isModalOpen && (
        <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div className="modal-content-wrapper" onClick={(e) => e.stopPropagation()}>
            <Card variant="glass" style={{ padding: "28px", position: "relative" }}>
              <button className="close-modal-btn" onClick={() => setIsModalOpen(false)}>
                ✕
              </button>
              <h3 className="column-title" style={{ marginBottom: "20px" }}>Create Service</h3>
              <form onSubmit={handleAddService} className="admin-catalog-form">

                <div className="form-group">
                  <label>Service Name</label>
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
                  <div className="form-group" style={{ flex: 1 }}>
                    <label>Price ($)</label>
                    <input
                      type="number"
                      className="glass-input"
                      required
                      placeholder="e.g. 100"
                      value={servicePrice}
                      onChange={(e) => setServicePrice(e.target.value)}
                    />
                  </div>
                  <div className="form-group" style={{ flex: 1 }}>
                    <label>Duration</label>
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

                <div className="form-group">
                  <label>Categories (Select all that apply)</label>
                  <div className="checkbox-grid">
                    {categories.map(cat => (
                      <label key={cat.id} className="checkbox-label">
                        <input
                          type="checkbox"
                          checked={selectedServiceCategories.includes(cat.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedServiceCategories([...selectedServiceCategories, cat.id]);
                            } else {
                              setSelectedServiceCategories(selectedServiceCategories.filter(id => id !== cat.id));
                            }
                          }}
                        />
                        {cat.name}
                      </label>
                    ))}
                  </div>
                </div>

                <div className="form-group">
                  <label>Assign Practitioner</label>
                  <select
                    className="glass-input"
                    value={servicePractitioner}
                    onChange={(e) => setServicePractitioner(e.target.value)}
                  >
                    {practitioners.map(p => (
                      <option key={p.id} value={p.name}>{p.name}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>Description</label>
                  <textarea
                    className="glass-input desc-area"
                    required
                    placeholder="Write detailed healing session descriptions..."
                    value={serviceDesc}
                    onChange={(e) => setServiceDesc(e.target.value)}
                  />
                </div>

                <Button variant="gold" type="submit" style={{ width: "100%", marginTop: "8px" }}>
                  Create Service
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
          max-width: 550px;
          animation: scaleUp 0.3s cubic-bezier(0.16, 1, 0.3, 1);
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
        }
        .close-modal-btn:hover {
          color: #ef4444;
        }
        .modal-actions-row {
          display: flex;
          gap: 12px;
          margin-top: 8px;
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
          flex-shrink: 0;
        }
        .delete-row-btn:hover {
          background: rgba(239, 68, 68, 0.08);
        }
        .admin-catalog-form {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        .form-group {
          display: flex;
          flex-direction: column;
          gap: 16px;
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
        .checkbox-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(130px, 1fr));
          gap: 12px;
          background: rgba(0, 0, 0, 0.02);
          border: 1px solid rgba(0, 0, 0, 0.08);
          padding: 16px;
          border-radius: 8px;
          margin-top: 4px;
        }
        .checkbox-label {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 0.85rem;
          color: hsl(var(--text-cream));
          cursor: pointer;
        }
        .checkbox-label input {
          accent-color: #7c3aed;
          cursor: pointer;
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
