"use client";

import React, { useState, useEffect } from "react";
import { Card } from "@/components/ui/Card";
import { RefreshCw, Shield, ShieldCheck, UserCheck, Search, Plus, Trash2 } from "lucide-react";
import StatsDashboard from "@/components/admin/StatsDashboard";

export default function AdminUsersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [userRole, setUserRole] = useState("checking");
  const [currentUserId, setCurrentUserId] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [actionMessage, setActionMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Form states
  const [newName, setNewName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [newGender, setNewGender] = useState("Female");
  const [newDob, setNewDob] = useState("");
  const [newRole, setNewRole] = useState("admin");
  const [newCategory, setNewCategory] = useState("None");
  const [submitting, setSubmitting] = useState(false);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const loadUsers = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/users");
      const json = await res.json();
      if (json.success) {
        setUsers(json.data || []);
      }
    } catch (err) {
      console.error("Failed to load users:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let activeRole = "unknown";
    let activeId = "";

    // 1. Check sessionStorage
    try {
      const userStr = window.sessionStorage.getItem("divingsanatan_admin_user");
      if (userStr) {
        const userObj = JSON.parse(userStr);
        if (userObj?.role) {
          activeRole = userObj.role;
          activeId = userObj.id || "";
        }
      }
    } catch (e) {}

    // 2. Check localStorage session if sessionStorage is missing or empty
    if ((activeRole === "unknown" || !activeRole) && typeof window !== "undefined") {
      try {
        const sessionStr = window.localStorage.getItem("divingsanatan_user_session");
        if (sessionStr) {
          const userObj = JSON.parse(sessionStr);
          if (userObj?.role) {
            activeRole = userObj.role;
            activeId = userObj.id || "";
            // Sync to sessionStorage
            window.sessionStorage.setItem("divingsanatan_admin_user", JSON.stringify(userObj));
            window.sessionStorage.setItem("divingsanatan_admin_auth", "true");
          }
        }
      } catch (e) {}
    }

    setUserRole(activeRole);
    setCurrentUserId(activeId);
    loadUsers();
  }, []);

  const showNotification = (type: "success" | "error", text: string) => {
    setActionMessage({ type, text });
    setTimeout(() => {
      setActionMessage(null);
    }, 4000);
  };

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || !newEmail.trim() || !newPassword.trim()) {
      alert("Name, Email, and Password are required.");
      return;
    }

    try {
      setSubmitting(true);
      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newName.trim(),
          email: newEmail.trim().toLowerCase(),
          password: newPassword.trim(),
          phone: newPhone.trim(),
          gender: newGender,
          dob: newDob,
          role: newRole,
          category: newCategory
        })
      });
      const json = await res.json();
      if (json.success) {
        setNewName("");
        setNewEmail("");
        setNewPassword("");
        setNewPhone("");
        setNewDob("");
        setNewRole("admin");
        setNewCategory("None");
        showNotification("success", json.message || `User assigned role "${newRole}" successfully!`);
        setShowAddForm(false);
        await loadUsers();
      } else {
        alert(json.error || "Failed to create or update user.");
      }
    } catch (err) {
      console.error(err);
      alert("Network error while creating account.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteUser = async (id: string, role: string, name: string) => {
    if (role === 'super_admin' && userRole !== 'super_admin') {
      alert("Only a Super Admin can delete super_admin accounts.");
      return;
    }
    if (id === currentUserId) {
      alert("You cannot delete your own logged-in account.");
      return;
    }
    if (!confirm(`Are you sure you want to delete user "${name}"? This action cannot be undone.`)) return;
    try {
      const res = await fetch(`/api/users?id=${id}`, { method: "DELETE" });
      const json = await res.json();
      if (json.success) {
        showNotification("success", `User "${name}" has been deleted.`);
        loadUsers();
      } else {
        alert(json.error || "Failed to delete user.");
      }
    } catch (err) {
      console.error(err);
      alert("Error deleting user.");
    }
  };

  const handleRoleChange = async (id: string, currentRole: string, targetRole: string, userName: string) => {
    if (currentRole === targetRole) return;

    if (currentRole === 'super_admin' && userRole !== 'super_admin') {
      alert("Cannot change role of a Super Admin.");
      return;
    }

    if (!confirm(`Are you sure you want to change "${userName}" from [${currentRole}] to [${targetRole}]?`)) {
      return;
    }

    try {
      const res = await fetch(`/api/users`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, role: targetRole })
      });
      const json = await res.json();
      if (json.success) {
        // Sync active session if the updated user is currently logged in
        if (typeof window !== "undefined") {
          const sessionStr = window.localStorage.getItem("divingsanatan_user_session");
          if (sessionStr) {
            try {
              const sessionUserObj = JSON.parse(sessionStr);
              if (sessionUserObj.id === id) {
                sessionUserObj.role = targetRole;
                window.localStorage.setItem("divingsanatan_user_session", JSON.stringify(sessionUserObj));
                window.sessionStorage.setItem("divingsanatan_admin_user", JSON.stringify(sessionUserObj));
              }
            } catch (e) {}
          }
        }
        showNotification("success", `Successfully updated ${userName}'s role to "${targetRole}"!`);
        await loadUsers();
      } else {
        alert(json.error || "Failed to update role.");
      }
    } catch (err) {
      console.error(err);
      alert("Network error updating role.");
    }
  };

  // Auth gate check
  if (userRole !== "checking" && userRole !== "super_admin" && userRole !== "admin") {
    return (
      <div style={{ padding: "60px", textAlign: "center" }}>
        <h2 style={{ color: "#dc3545" }}>Unauthorized Access</h2>
        <p style={{ fontSize: "1.1rem", color: "#6c757d" }}>
          You must be an administrator or Super Admin to view User Management.
        </p>
      </div>
    );
  }

  // Filter Logic
  const filteredUsers = users.filter(user => {
    if (roleFilter !== "all") {
      if (roleFilter === "admin") {
        if (user.role !== "admin" && user.role !== "super_admin" && user.role !== "subadmin") return false;
      } else if (roleFilter === "healer") {
        if (user.role !== "healer" && user.role !== "guru") return false;
      } else if (roleFilter === "user") {
        if (user.role !== "user") return false;
      }
    }
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        user.name?.toLowerCase().includes(q) ||
        user.email?.toLowerCase().includes(q) ||
        user.role?.toLowerCase().includes(q) ||
        user.phone?.includes(searchQuery)
      );
    }
    return true;
  });

  const totalPages = Math.max(1, Math.ceil(filteredUsers.length / itemsPerPage));
  const safePage = Math.min(currentPage, totalPages);
  const paginatedUsers = filteredUsers.slice(
    (safePage - 1) * itemsPerPage,
    safePage * itemsPerPage
  );

  const adminCount = users.filter(u => u.role === "admin" || u.role === "super_admin" || u.role === "subadmin").length;
  const healerCount = users.filter(u => u.role === "healer" || u.role === "guru").length;
  const standardUserCount = users.filter(u => u.role === "user").length;

  const getRoleBadgeStyle = (role: string) => {
    switch (role) {
      case "super_admin":
        return { background: "#6f42c1", color: "#fff", border: "1px solid #59359a" };
      case "admin":
        return { background: "#0d6efd", color: "#fff", border: "1px solid #0b5ed7" };
      case "subadmin":
        return { background: "#0dcaf0", color: "#000", border: "1px solid #0aa2c0" };
      case "guru":
      case "healer":
        return { background: "#198754", color: "#fff", border: "1px solid #157347" };
      default:
        return { background: "#6c757d", color: "#fff", border: "1px solid #565e64" };
    }
  };

  const formatRoleLabel = (role: string) => {
    switch (role) {
      case "super_admin": return "Super Admin";
      case "admin": return "Admin";
      case "subadmin": return "Sub Admin";
      case "guru": return "Guru / Healer";
      case "healer": return "Healer";
      default: return "User";
    }
  };

  return (
    <div className="dashboard-content">
      <StatsDashboard
        pageType="users"
        actions={
          <button className="btn btn-secondary btn-sm" onClick={loadUsers}>
            <RefreshCw size={12} style={{ marginRight: "6px" }} />
            Refresh Users
          </button>
        }
      />

      {actionMessage && (
        <div style={{
          padding: "12px 18px",
          borderRadius: "6px",
          fontWeight: "600",
          fontSize: "0.9rem",
          display: "flex",
          alignItems: "center",
          gap: "8px",
          background: actionMessage.type === "success" ? "#d1e7dd" : "#f8d7da",
          color: actionMessage.type === "success" ? "#0f5132" : "#842029",
          border: `1px solid ${actionMessage.type === "success" ? "#badbcc" : "#f5c2c7"}`
        }}>
          {actionMessage.type === "success" ? "✓" : "⚠"} {actionMessage.text}
        </div>
      )}

      {loading ? (
        <p className="text-center" style={{ padding: "40px", color: "#6c757d" }}>Loading users & admins...</p>
      ) : (
        <div className={`admin-split-layout ${showAddForm ? 'with-form' : ''}`}>
          {/* List Table */}
          <div className="split-list-col">
            <Card variant="glass" className="card-primary" style={{ padding: "0 !important" }}>
              <div style={{ borderBottom: "1px solid #dee2e6", padding: "14px 20px", background: "#f8f9fa", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "10px" }}>
                <div>
                  <span style={{ fontWeight: "700", fontSize: "1rem" }}>
                    Platform Accounts ({filteredUsers.length})
                  </span>
                  <span style={{ fontSize: "0.85rem", color: "#6c757d", marginLeft: "10px" }}>
                    Logged in as <strong>{userRole === "super_admin" ? "Super Admin" : "Admin"}</strong>
                  </span>
                </div>

                <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
                  <input
                    type="text"
                    placeholder="Search name, email, role..."
                    className="form-control form-control-sm"
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setCurrentPage(1);
                    }}
                    style={{ width: '220px' }}
                  />
                  <button
                    className="btn btn-primary btn-sm"
                    onClick={() => {
                      setShowAddForm(!showAddForm);
                      if (!showAddForm) setNewRole("admin");
                    }}
                    style={{ display: "flex", alignItems: "center", gap: "5px" }}
                  >
                    <Plus size={14} />
                    {showAddForm ? 'Close Form' : 'Make / Add Admin'}
                  </button>
                </div>
              </div>

              {/* Role filter tabs */}
              <div style={{ padding: "8px 20px", background: "#fdfdfd", borderBottom: "1px solid #eee", display: "flex", gap: "8px", flexWrap: "wrap" }}>
                <button
                  className={`btn btn-sm ${roleFilter === "all" ? "btn-dark" : "btn-outline-secondary"}`}
                  onClick={() => { setRoleFilter("all"); setCurrentPage(1); }}
                >
                  All ({users.length})
                </button>
                <button
                  className={`btn btn-sm ${roleFilter === "admin" ? "btn-primary" : "btn-outline-primary"}`}
                  onClick={() => { setRoleFilter("admin"); setCurrentPage(1); }}
                >
                  🛡️ Admins ({adminCount})
                </button>
                <button
                  className={`btn btn-sm ${roleFilter === "healer" ? "btn-success" : "btn-outline-success"}`}
                  onClick={() => { setRoleFilter("healer"); setCurrentPage(1); }}
                >
                  🌿 Healers ({healerCount})
                </button>
                <button
                  className={`btn btn-sm ${roleFilter === "user" ? "btn-secondary" : "btn-outline-secondary"}`}
                  onClick={() => { setRoleFilter("user"); setCurrentPage(1); }}
                >
                  👤 Users ({standardUserCount})
                </button>
              </div>

              <div className="table-responsive">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Account Name</th>
                      <th>Email Address</th>
                      <th>Current Role</th>
                      <th>Assign Role</th>
                      <th className="text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedUsers.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="text-center" style={{ padding: "30px", color: "#6c757d" }}>
                          No accounts match your search or filter.
                        </td>
                      </tr>
                    ) : (
                      paginatedUsers.map(user => {
                        const isSelf = user.id === currentUserId;
                        const isTargetSuper = user.role === 'super_admin';
                        const badgeStyle = getRoleBadgeStyle(user.role);

                        return (
                          <tr key={user.id} style={{ background: isTargetSuper ? "#faf5ff" : undefined }}>
                            <td>
                              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                <div style={{
                                  width: "28px",
                                  height: "28px",
                                  borderRadius: "50%",
                                  background: isTargetSuper ? "#6f42c1" : (user.role === 'admin' ? '#0d6efd' : '#e9ecef'),
                                  color: (isTargetSuper || user.role === 'admin') ? '#fff' : '#495057',
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  fontSize: "0.75rem",
                                  fontWeight: "700"
                                }}>
                                  {user.name ? user.name.charAt(0).toUpperCase() : "U"}
                                </div>
                                <div>
                                  <strong>{user.name || "Unnamed User"}</strong>
                                  {isSelf && (
                                    <span style={{ marginLeft: "6px", fontSize: "0.75rem", background: "#e2e3e5", padding: "2px 6px", borderRadius: "4px" }}>
                                      You
                                    </span>
                                  )}
                                </div>
                              </div>
                            </td>
                            <td>
                              <span style={{ fontSize: "0.9rem", color: "#333" }}>{user.email}</span>
                              {user.phone && user.phone !== "0000000000" && (
                                <div style={{ fontSize: "0.75rem", color: "#888" }}>{user.phone}</div>
                              )}
                            </td>
                            <td>
                              <span style={{
                                display: "inline-block",
                                padding: "3px 8px",
                                borderRadius: "12px",
                                fontSize: "0.75rem",
                                fontWeight: "600",
                                ...badgeStyle
                              }}>
                                {formatRoleLabel(user.role)}
                              </span>
                            </td>
                            <td>
                              <select 
                                className="form-control form-control-sm" 
                                style={{ width: "auto", display: "inline-block", padding: "3px 8px", height: "auto", fontWeight: "600" }}
                                value={user.role}
                                onChange={(e) => handleRoleChange(user.id, user.role, e.target.value, user.name || user.email)}
                                disabled={isTargetSuper && userRole !== 'super_admin'}
                              >
                                <option value="user">User</option>
                                <option value="healer">Healer</option>
                                <option value="guru">Guru / Healer</option>
                                <option value="subadmin">Sub Admin</option>
                                <option value="admin">Admin</option>
                                {userRole === 'super_admin' && (
                                  <option value="super_admin">Super Admin</option>
                                )}
                              </select>
                            </td>
                            <td className="text-right">
                              <button 
                                className="btn btn-outline-danger btn-sm"
                                onClick={() => handleDeleteUser(user.id, user.role, user.name || user.email)}
                                disabled={(isTargetSuper && userRole !== 'super_admin') || isSelf}
                                title={isSelf ? "Cannot delete yourself" : "Delete user account"}
                                style={{ padding: "2px 8px", fontSize: "0.8rem" }}
                              >
                                <Trash2 size={12} style={{ marginRight: "4px", verticalAlign: "middle" }} />
                                Delete
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination Controls */}
              {totalPages > 1 && (
                <div className="admin-pagination-wrapper">
                  <span className="pagination-info">
                    Showing {filteredUsers.length === 0 ? 0 : (safePage - 1) * itemsPerPage + 1} to {Math.min(filteredUsers.length, safePage * itemsPerPage)} of {filteredUsers.length} entries
                  </span>
                  <ul className="admin-pagination">
                    <li className={`page-item ${safePage === 1 ? 'disabled' : ''}`}>
                      <button onClick={() => setCurrentPage(1)} disabled={safePage === 1}>«</button>
                    </li>
                    <li className={`page-item ${safePage === 1 ? 'disabled' : ''}`}>
                      <button onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))} disabled={safePage === 1}>Prev</button>
                    </li>
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(pageNum => (
                      <li key={pageNum} className={`page-item ${safePage === pageNum ? 'active' : ''}`}>
                        <button onClick={() => setCurrentPage(pageNum)}>{pageNum}</button>
                      </li>
                    ))}
                    <li className={`page-item ${safePage === totalPages ? 'disabled' : ''}`}>
                      <button onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))} disabled={safePage === totalPages}>Next</button>
                    </li>
                    <li className={`page-item ${safePage === totalPages ? 'disabled' : ''}`}>
                      <button onClick={() => setCurrentPage(totalPages)} disabled={safePage === totalPages}>»</button>
                    </li>
                  </ul>
                </div>
              )}
            </Card>
          </div>

          {/* Form */}
          {showAddForm && (
            <div className="split-form-col">
              <Card variant="glass" className="card-success" style={{ padding: "0 !important" }}>
                <div style={{ borderBottom: "1px solid #dee2e6", padding: "12px 20px", background: "#f8f9fa", fontWeight: "700" }}>
                  Create or Promote User / Admin
                </div>
                <div style={{ padding: "20px" }}>
                  <p style={{ fontSize: "0.85rem", color: "#6c757d", marginBottom: "15px" }}>
                    Enter user details. If this email already exists, their account role will be updated immediately.
                  </p>
                  <form onSubmit={handleAddUser} className="admin-catalog-form">
                    <div className="form-group mb-3">
                      <label style={{ fontWeight: "600", fontSize: "0.85rem" }}>Full Name</label>
                      <input 
                        type="text" 
                        className="form-control" 
                        required 
                        placeholder="e.g. John Doe"
                        value={newName}
                        onChange={(e) => setNewName(e.target.value)}
                      />
                    </div>
                    <div className="form-group mb-3">
                      <label style={{ fontWeight: "600", fontSize: "0.85rem" }}>Email Address</label>
                      <input 
                        type="email" 
                        className="form-control" 
                        required 
                        placeholder="e.g. john@example.com"
                        value={newEmail}
                        onChange={(e) => setNewEmail(e.target.value)}
                      />
                    </div>
                    <div className="form-group mb-3">
                      <label style={{ fontWeight: "600", fontSize: "0.85rem" }}>Password</label>
                      <input 
                        type="password" 
                        className="form-control" 
                        required 
                        placeholder="Account password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                      />
                    </div>
                    <div className="form-group mb-3">
                      <label style={{ fontWeight: "600", fontSize: "0.85rem" }}>Assigned Role</label>
                      <select 
                        className="form-control" 
                        value={newRole}
                        onChange={(e) => setNewRole(e.target.value)}
                        style={{ fontWeight: "600" }}
                      >
                        <option value="admin">🛡️ Admin (Platform Administrator)</option>
                        {userRole === 'super_admin' && (
                          <option value="super_admin">👑 Super Admin (Full System Control)</option>
                        )}
                        <option value="subadmin">Sub Admin</option>
                        <option value="healer">Healer</option>
                        <option value="guru">Guru / Healer</option>
                        <option value="user">User (Standard Seeker)</option>
                      </select>
                    </div>
                    
                    <div className="form-group mb-3">
                      <label style={{ fontWeight: "600", fontSize: "0.85rem" }}>Phone (Optional)</label>
                      <input 
                        type="tel" 
                        className="form-control" 
                        placeholder="+91 9999999999"
                        value={newPhone}
                        onChange={(e) => setNewPhone(e.target.value)}
                      />
                    </div>
                    <div className="form-row" style={{ display: 'flex', gap: '10px' }}>
                      <div className="form-group mb-3" style={{ flex: 1 }}>
                        <label style={{ fontWeight: "600", fontSize: "0.85rem" }}>Gender</label>
                        <select 
                          className="form-control" 
                          value={newGender}
                          onChange={(e) => setNewGender(e.target.value)}
                        >
                          <option value="Female">Female</option>
                          <option value="Male">Male</option>
                          <option value="Other">Other</option>
                        </select>
                      </div>
                      <div className="form-group mb-3" style={{ flex: 1 }}>
                        <label style={{ fontWeight: "600", fontSize: "0.85rem" }}>DOB</label>
                        <input 
                          type="date" 
                          className="form-control" 
                          value={newDob}
                          onChange={(e) => setNewDob(e.target.value)}
                        />
                      </div>
                    </div>

                    <button 
                      type="submit" 
                      className="btn btn-primary btn-block mt-3" 
                      style={{ width: "100%", fontWeight: "600" }}
                      disabled={submitting}
                    >
                      {submitting ? "Processing..." : `Save & Assign Role [${formatRoleLabel(newRole)}]`}
                    </button>
                  </form>
                </div>
              </Card>
            </div>
          )}
        </div>
      )}

      <style jsx>{`
        .admin-split-layout {
          display: grid;
          grid-template-columns: 1fr;
          gap: 20px;
        }
        .admin-split-layout.with-form {
          grid-template-columns: 2fr 1fr;
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
