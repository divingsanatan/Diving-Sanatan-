"use client";

import React, { useState, useEffect } from "react";
import { Card } from "@/components/ui/Card";
import { TeamMember } from "@/types/database";
import { RefreshCw, Plus, Edit2, Trash2, Search, UserCheck, X, Image as ImageIcon } from "lucide-react";
import StatsDashboard from "@/components/admin/StatsDashboard";

const AVATAR_PRESETS = [
  "https://i.pravatar.cc/100?img=49",
  "https://i.pravatar.cc/100?img=15",
  "https://i.pravatar.cc/100?img=45",
  "https://i.pravatar.cc/100?img=13",
  "https://i.pravatar.cc/100?img=20",
  "https://i.pravatar.cc/100?img=33",
  "https://i.pravatar.cc/100?img=44",
  "https://i.pravatar.cc/100?img=47"
];

export default function AdminTeamPage() {
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  // Modal / Form state
  const [showModal, setShowModal] = useState(false);
  const [editingMember, setEditingMember] = useState<TeamMember | null>(null);

  // Form Fields
  const [name, setName] = useState("");
  const [role, setRole] = useState("");
  const [image, setImage] = useState("");
  const [bio, setBio] = useState("");
  const [orderIndex, setOrderIndex] = useState<number>(1);
  const [saving, setSaving] = useState(false);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  const fetchTeamMembers = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/team");
      const json = await res.json();
      if (json.success) {
        setTeamMembers(json.data);
      }
    } catch (err) {
      console.error("Failed to load team members:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTeamMembers();
  }, []);

  const handleOpenAddModal = () => {
    setEditingMember(null);
    setName("");
    setRole("");
    setImage("https://i.pravatar.cc/100?img=49");
    setBio("");
    setOrderIndex(teamMembers.length + 1);
    setShowModal(true);
  };

  const handleOpenEditModal = (member: TeamMember) => {
    setEditingMember(member);
    setName(member.name);
    setRole(member.role);
    setImage(member.image || "https://i.pravatar.cc/100?img=49");
    setBio(member.bio || "");
    setOrderIndex(member.order_index || 1);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingMember(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !role.trim()) {
      alert("Name and Role are required.");
      return;
    }

    try {
      setSaving(true);
      const isEdit = Boolean(editingMember);
      const url = "/api/team";
      const method = isEdit ? "PUT" : "POST";
      const payload = isEdit
        ? { id: editingMember!.id, name, role, image, bio, order_index: orderIndex }
        : { name, role, image, bio, order_index: orderIndex };

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (json.success) {
        alert(isEdit ? "Team member updated successfully!" : "New team member added successfully!");
        handleCloseModal();
        fetchTeamMembers();
      } else {
        alert(json.error || "Failed to save team member.");
      }
    } catch (err) {
      console.error(err);
      alert("An unexpected error occurred.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string, memberName: string) => {
    if (!confirm(`Are you sure you want to delete ${memberName}?`)) return;

    try {
      const res = await fetch(`/api/team?id=${id}`, { method: "DELETE" });
      const json = await res.json();
      if (json.success) {
        fetchTeamMembers();
      } else {
        alert(json.error || "Failed to delete team member.");
      }
    } catch (err) {
      console.error(err);
      alert("Failed to delete team member.");
    }
  };

  // Search & Filter
  const filteredTeam = teamMembers.filter((m) => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return m.name.toLowerCase().includes(q) || m.role.toLowerCase().includes(q) || (m.bio && m.bio.toLowerCase().includes(q));
  });

  // Pagination logic
  const totalPages = Math.ceil(filteredTeam.length / itemsPerPage);
  const paginatedTeam = filteredTeam.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  return (
    <div className="dashboard-content">
      <StatsDashboard
        pageType="team"
        actions={
          <div style={{ display: "flex", gap: "10px" }}>
            <button className="btn btn-secondary btn-sm" onClick={fetchTeamMembers}>
              <RefreshCw size={14} style={{ marginRight: "6px" }} />
              Refresh
            </button>
            <button className="btn btn-success btn-sm" onClick={handleOpenAddModal}>
              <Plus size={14} style={{ marginRight: "6px" }} />
              Add Team Member
            </button>
          </div>
        }
      />

      {/* Main Card Wrapper */}
      <Card variant="glass" className="card-primary" style={{ padding: "0 !important", marginTop: "20px" }}>
        {/* Table Toolbar */}
        <div style={{ padding: "16px 20px", borderBottom: "1px solid #dee2e6", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px", background: "#f8f9fa" }}>
          <div style={{ fontWeight: "700", color: "#333", fontSize: "1.05rem" }}>
            Team Roster ({filteredTeam.length})
          </div>

          <div style={{ position: "relative", minWidth: "260px" }}>
            <input
              type="text"
              className="form-control form-control-sm"
              placeholder="Search team member or role..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              style={{ paddingLeft: "32px", borderRadius: "20px" }}
            />
            <Search size={14} style={{ position: "absolute", left: "10px", top: "50%", transform: "translateY(-50%)", color: "#6c757d" }} />
          </div>
        </div>

        {/* Table Content */}
        {loading ? (
          <div style={{ padding: "40px", textAlign: "center", color: "#6c757d" }}>Loading team members...</div>
        ) : (
          <div className="table-responsive">
            <table className="admin-table">
              <thead>
                <tr>
                  <th style={{ width: "70px" }}>Avatar</th>
                  <th>Member Name</th>
                  <th>Role / Designation</th>
                  <th>Bio / Overview</th>
                  <th style={{ width: "80px" }}>Order</th>
                  <th className="text-right" style={{ width: "150px" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedTeam.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ textAlign: "center", padding: "30px", color: "#6c757d" }}>
                      No team members found matching "{searchQuery}".
                    </td>
                  </tr>
                ) : (
                  paginatedTeam.map((member) => (
                    <tr key={member.id}>
                      <td>
                        <img
                          src={member.image || "https://i.pravatar.cc/100?img=49"}
                          alt={member.name}
                          style={{ width: "44px", height: "44px", borderRadius: "50%", objectFit: "cover", border: "2px solid #8b5cf6" }}
                        />
                      </td>
                      <td>
                        <div style={{ fontWeight: "600", color: "#1f2937" }}>{member.name}</div>
                        <div style={{ fontSize: "0.75rem", color: "#9ca3af" }}>ID: {member.id}</div>
                      </td>
                      <td>
                        <span className="badge badge-purple" style={{ background: "#ede9fe", color: "#6d28d9", padding: "4px 10px", borderRadius: "12px", fontSize: "0.82rem", fontWeight: "600" }}>
                          {member.role}
                        </span>
                      </td>
                      <td>
                        <div style={{ fontSize: "0.85rem", color: "#4b5563", maxWidth: "280px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                          {member.bio || "No biography added."}
                        </div>
                      </td>
                      <td>
                        <span style={{ fontWeight: "600", color: "#374151" }}>#{member.order_index ?? 1}</span>
                      </td>
                      <td className="text-right">
                        <button
                          className="btn btn-secondary btn-sm"
                          style={{ marginRight: "6px", padding: "4px 8px" }}
                          onClick={() => handleOpenEditModal(member)}
                        >
                          <Edit2 size={13} style={{ marginRight: "4px" }} /> Edit
                        </button>
                        <button
                          className="btn btn-danger btn-sm"
                          style={{ padding: "4px 8px" }}
                          onClick={() => handleDelete(member.id, member.name)}
                        >
                          <Trash2 size={13} style={{ marginRight: "4px" }} /> Delete
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Footer */}
        {totalPages > 1 && (
          <div className="admin-pagination-wrapper" style={{ padding: "12px 20px" }}>
            <span className="pagination-info">
              Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(filteredTeam.length, currentPage * itemsPerPage)} of {filteredTeam.length} members
            </span>
            <ul className="admin-pagination">
              <li className={`page-item ${currentPage === 1 ? "disabled" : ""}`}>
                <button onClick={() => setCurrentPage(1)} disabled={currentPage === 1}>«</button>
              </li>
              <li className={`page-item ${currentPage === 1 ? "disabled" : ""}`}>
                <button onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))} disabled={currentPage === 1}>Prev</button>
              </li>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                <li key={pageNum} className={`page-item ${currentPage === pageNum ? "active" : ""}`}>
                  <button onClick={() => setCurrentPage(pageNum)}>{pageNum}</button>
                </li>
              ))}
              <li className={`page-item ${currentPage === totalPages ? "disabled" : ""}`}>
                <button onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))} disabled={currentPage === totalPages}>Next</button>
              </li>
              <li className={`page-item ${currentPage === totalPages ? "disabled" : ""}`}>
                <button onClick={() => setCurrentPage(totalPages)} disabled={currentPage === totalPages}>»</button>
              </li>
            </ul>
          </div>
        )}
      </Card>

      {/* CREATE / EDIT MODAL */}
      {showModal && (
        <div className="admin-modal-overlay">
          <div className="admin-modal-container" style={{ maxWidth: "540px" }}>
            <div className="admin-modal-header">
              <h5 style={{ margin: 0, fontWeight: "700" }}>
                {editingMember ? "Edit Team Member" : "Add New Team Member"}
              </h5>
              <button className="modal-close-btn" onClick={handleCloseModal}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="admin-modal-body" style={{ padding: "20px" }}>
                {/* Name */}
                <div className="form-group mb-3">
                  <label className="form-label">Full Name *</label>
                  <input
                    type="text"
                    className="form-control"
                    required
                    placeholder="e.g. Priya Sharma"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>

                {/* Role */}
                <div className="form-group mb-3">
                  <label className="form-label">Role / Designation *</label>
                  <input
                    type="text"
                    className="form-control"
                    required
                    placeholder="e.g. Founder & CEO"
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                  />
                </div>

                {/* Avatar Preview & URL */}
                <div className="form-group mb-3">
                  <label className="form-label">Avatar Image URL</label>
                  <div style={{ display: "flex", gap: "12px", alignItems: "center", marginBottom: "8px" }}>
                    <img
                      src={image || "https://i.pravatar.cc/100?img=49"}
                      alt="Avatar Preview"
                      style={{ width: "50px", height: "50px", borderRadius: "50%", objectFit: "cover", border: "2px solid #8b5cf6" }}
                    />
                    <input
                      type="text"
                      className="form-control"
                      placeholder="https://..."
                      value={image}
                      onChange={(e) => setImage(e.target.value)}
                    />
                  </div>

                  {/* Avatar Quick Presets */}
                  <div style={{ fontSize: "0.8rem", color: "#6c757d", marginBottom: "6px" }}>Or pick a preset avatar:</div>
                  <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                    {AVATAR_PRESETS.map((preset, idx) => (
                      <img
                        key={idx}
                        src={preset}
                        alt={`Preset ${idx + 1}`}
                        style={{
                          width: "32px",
                          height: "32px",
                          borderRadius: "50%",
                          cursor: "pointer",
                          border: image === preset ? "2px solid #8b5cf6" : "1px solid #ddd",
                          opacity: image === preset ? 1 : 0.7
                        }}
                        onClick={() => setImage(preset)}
                      />
                    ))}
                  </div>
                </div>

                {/* Bio */}
                <div className="form-group mb-3">
                  <label className="form-label">Biography / Summary</label>
                  <textarea
                    className="form-control"
                    rows={3}
                    placeholder="Brief description of experience and responsibilities..."
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                  />
                </div>

                {/* Order Index */}
                <div className="form-group mb-3">
                  <label className="form-label">Display Order Index</label>
                  <input
                    type="number"
                    className="form-control"
                    min={1}
                    value={orderIndex}
                    onChange={(e) => setOrderIndex(Number(e.target.value))}
                  />
                </div>
              </div>

              <div className="admin-modal-footer" style={{ padding: "14px 20px", borderTop: "1px solid #dee2e6", display: "flex", justifyContent: "flex-end", gap: "10px", background: "#f8f9fa" }}>
                <button type="button" className="btn btn-secondary" onClick={handleCloseModal} disabled={saving}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-success" disabled={saving}>
                  {saving ? "Saving..." : editingMember ? "Save Changes" : "Create Member"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style jsx>{`
        .mb-3 {
          margin-bottom: 1rem;
        }
        .form-label {
          font-size: 0.85rem;
          font-weight: 600;
          color: #374151;
          margin-bottom: 4px;
          display: block;
        }
        .table-responsive {
          width: 100%;
          overflow-x: auto;
        }
        .admin-modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.45);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1050;
          padding: 20px;
        }
        .admin-modal-container {
          background: #ffffff;
          border-radius: 12px;
          width: 100%;
          box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
          overflow: hidden;
        }
        .admin-modal-header {
          padding: 16px 20px;
          border-bottom: 1px solid #dee2e6;
          display: flex;
          justify-content: space-between;
          align-items: center;
          background: #f8f9fa;
        }
        .modal-close-btn {
          background: none;
          border: none;
          font-size: 1.2rem;
          cursor: pointer;
          color: #6c757d;
        }
        .modal-close-btn:hover {
          color: #111;
        }
      `}</style>
    </div>
  );
}
