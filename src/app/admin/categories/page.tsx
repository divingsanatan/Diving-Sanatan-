"use client";

import React, { useState, useEffect } from "react";
import { Card } from "@/components/ui/Card";
import { Category } from "@/types/database";
import { RefreshCw } from "lucide-react";
import StatsDashboard from "@/components/admin/StatsDashboard";

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  // Form states
  const [newCatName, setNewCatName] = useState("");
  
  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  const loadCategories = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/categories");
      const json = await res.json();
      if (json.success) {
        setCategories(json.data);
        setCurrentPage(1);
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

  // Pagination Logic
  const totalPages = Math.ceil(categories.length / itemsPerPage);
  const paginatedCategories = categories.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <div className="dashboard-content">
      <StatsDashboard
        pageType="categories"
        actions={
          <button className="btn btn-secondary btn-sm" onClick={loadCategories}>
            <RefreshCw size={12} style={{ marginRight: "6px" }} />
            Refresh Categories
          </button>
        }
      />


      {loading ? (
        <p className="text-center" style={{ padding: "40px", color: "#6c757d" }}>Loading categories...</p>
      ) : (
        <div className="admin-split-layout">
          {/* List Table */}
          <div className="split-list-col">
            <Card variant="glass" className="card-primary" style={{ padding: "0 !important" }}>
              <div style={{ borderBottom: "1px solid #dee2e6", padding: "12px 20px", background: "#f8f9fa", fontWeight: "700" }}>
                Categories List ({categories.length})
              </div>
              <div className="table-responsive">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Category Name</th>
                      <th className="text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedCategories.length === 0 ? (
                      <tr>
                        <td colSpan={3} className="text-center" style={{ padding: "20px" }}>No categories created yet.</td>
                      </tr>
                    ) : (
                      paginatedCategories.map(cat => (
                        <tr key={cat.id}>
                          <td style={{ fontFamily: "monospace", fontSize: "0.85rem" }}>{cat.id}</td>
                          <td><strong>{cat.name}</strong></td>
                          <td className="text-right">
                            <button 
                              className="btn btn-danger btn-sm"
                              onClick={() => handleDeleteCategory(cat.id)}
                              disabled={["cat-1", "cat-2", "cat-3"].includes(cat.id)}
                            >
                              ✕ Delete
                            </button>
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
                    Showing {categories.length === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1} to {Math.min(categories.length, currentPage * itemsPerPage)} of {categories.length} entries
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

          {/* Form */}
          <div className="split-form-col">
            <Card variant="glass" className="card-success" style={{ padding: "0 !important" }}>
              <div style={{ borderBottom: "1px solid #dee2e6", padding: "12px 20px", background: "#f8f9fa", fontWeight: "700" }}>
                Create Category
              </div>
              <div style={{ padding: "20px" }}>
                <form onSubmit={handleAddCategory} className="admin-catalog-form">
                  <div className="form-group">
                    <label>Category Name</label>
                    <input 
                      type="text" 
                      className="form-control" 
                      required 
                      placeholder="e.g. Sound Healing"
                      value={newCatName}
                      onChange={(e) => setNewCatName(e.target.value)}
                    />
                  </div>

                  <button type="submit" className="btn btn-success btn-block mt-3" style={{ width: "100%" }}>
                    Create Category
                  </button>
                </form>
              </div>
            </Card>
          </div>
        </div>
      )}

      <style jsx>{`
        .admin-split-layout {
          display: grid;
          grid-template-columns: 1.5fr 1fr;
          gap: 20px;
        }
        .split-list-col, .split-form-col {
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
        @media (max-width: 992px) {
          .admin-split-layout {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
}
