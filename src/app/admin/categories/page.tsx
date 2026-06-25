"use client";

import React, { useState, useEffect } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Category } from "@/types/database";

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  // Form states
  const [newCatName, setNewCatName] = useState("");

  const loadCategories = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/categories");
      const json = await res.json();
      if (json.success) {
        setCategories(json.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCategories();
  }, []);

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) {
      alert("Please enter a category name.");
      return;
    }

    try {
      const res = await fetch("/api/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newCatName.trim() })
      });
      const json = await res.json();
      if (json.success) {
        setNewCatName("");
        alert("Category successfully created!");
        loadCategories();
      } else {
        alert(json.error || "Failed to create category.");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteCategory = async (id: string) => {
    if (!confirm("Are you sure you want to delete this category? This will unlink it from all services.")) return;
    try {
      const res = await fetch(`/api/categories?id=${id}`, { method: "DELETE" });
      const json = await res.json();
      if (json.success) {
        loadCategories();
      } else {
        alert(json.error || "Failed to delete category.");
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="dashboard-content">
      <div className="dashboard-header-row">
        <div>
          <h2>Categories Manager</h2>
          <p className="admin-header-desc">
            Add, update, or remove healing disciplines. These categories are dynamically linked to services on storefront catalogs.
          </p>
        </div>
        <button className="sync-btn" onClick={loadCategories}>
          🔄 Refresh Categories
        </button>
      </div>

      {loading ? (
        <p className="admin-loading">Loading categories...</p>
      ) : (
        <div className="admin-split-layout">
          {/* List */}
          <div className="split-list-col">
            <h3 className="column-title">Categories List ({categories.length})</h3>
            <div className="list-cards-vertical">
              {categories.map(cat => (
                <Card key={cat.id} variant="glass" className="admin-list-item-card">
                  <div className="item-card-row">
                    <div className="item-card-details">
                      <h4>{cat.name}</h4>
                      <span className="muted-id">ID: {cat.id}</span>
                    </div>
                    <button 
                      className={`delete-row-btn${["cat-1", "cat-2", "cat-3"].includes(cat.id) ? " btn-protected" : ""}`}
                      onClick={() => handleDeleteCategory(cat.id)}
                      disabled={["cat-1", "cat-2", "cat-3"].includes(cat.id)}
                    >
                      ✕ Delete Category
                    </button>
                  </div>
                </Card>
              ))}
            </div>
          </div>

          {/* Form */}
          <div className="split-form-col">
            <Card variant="glass" className="admin-form-padding">
              <h3 className="column-title column-title-spaced">Create Category</h3>
              <form onSubmit={handleAddCategory} className="admin-catalog-form">
                
                <div className="form-group">
                  <label>Category Name</label>
                  <input 
                    type="text" 
                    className="glass-input" 
                    required 
                    placeholder="e.g. Sound Healing"
                    value={newCatName}
                    onChange={(e) => setNewCatName(e.target.value)}
                  />
                </div>

                <Button variant="gold" type="submit" className="btn-full-spaced">
                  Create Category
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
        @media (max-width: 1024px) {
          .admin-split-layout {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
}
