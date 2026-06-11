"use client";

import React, { useState, useEffect } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Practitioner } from "@/types/database";

export default function AdminPractitionersPage() {
  const [practitioners, setPractitioners] = useState<Practitioner[]>([]);
  const [loading, setLoading] = useState(true);

  // Form states
  const [pracName, setPracName] = useState("");
  const [pracSpecialty, setPracSpecialty] = useState("");
  const [pracBio, setPracBio] = useState("");

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

  useEffect(() => {
    loadPractitioners();
  }, []);

  const handleAddPractitioner = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pracName || !pracSpecialty || !pracBio) {
      alert("Please fill out healer name, specialty, and bio.");
      return;
    }

    try {
      const res = await fetch("/api/practitioners", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: pracName,
          specialty: pracSpecialty,
          bio: pracBio
        })
      });
      const json = await res.json();
      if (json.success) {
        setPracName("");
        setPracSpecialty("");
        setPracBio("");
        alert("Healer successfully added to register!");
        loadPractitioners();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeletePractitioner = async (id: string) => {
    if (!confirm("Are you sure you want to delete this practitioner from registry?")) return;
    try {
      const res = await fetch(`/api/practitioners?id=${id}`, { method: "DELETE" });
      const json = await res.json();
      if (json.success) {
        loadPractitioners();
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="dashboard-content">
      <div className="dashboard-header-row">
        <div>
          <h2>Practitioners Registry</h2>
          <p style={{ color: "hsl(var(--text-muted))", fontSize: "0.9rem", marginTop: "4px" }}>
            Maintain professional directories, register new healers, update credentials, and verify rating systems.
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
              {practitioners.map(p => (
                <Card key={p.id} variant="glass" className="admin-list-item-card">
                  <div className="item-card-row">
                    <div className="item-card-details">
                      <h4>{p.name}</h4>
                      <span className="badge-span">{p.specialty}</span>
                      <div className="rating-row" style={{ fontSize: "0.8rem", color: "#d4af37", marginTop: "6px" }}>
                        ★ {p.rating} ({p.reviewsCount} Reviews)
                      </div>
                      <p className="item-desc" style={{ marginTop: "8px" }}>{p.bio}</p>
                    </div>
                    <button className="delete-row-btn" onClick={() => handleDeletePractitioner(p.id)}>
                      ✕ Delete Healer
                    </button>
                  </div>
                </Card>
              ))}
            </div>
          </div>

          {/* Form */}
          <div className="split-form-col">
            <Card variant="glass" style={{ padding: "28px" }}>
              <h3 className="column-title" style={{ marginBottom: "20px" }}>Register Healer</h3>
              <form onSubmit={handleAddPractitioner} className="admin-catalog-form">
                
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

                <Button variant="gold" type="submit" style={{ width: "100%", marginTop: "8px" }}>
                  Register Healer
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
          display: grid;
          grid-template-columns: 1.5fr 1fr;
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
          justify-content: space-between;
          align-items: flex-start;
          gap: 20px;
        }
        .item-card-details {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        .item-card-details h4 {
          font-size: 1.2rem;
          color: hsl(var(--text-cream));
        }
        .badge-span {
          font-size: 0.8rem;
          color: #0d9488;
          font-weight: 600;
        }
        .item-desc {
          font-size: 0.85rem;
          line-height: 1.5;
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
          gap: 8px;
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
        @media (max-width: 1024px) {
          .admin-split-layout {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
}
