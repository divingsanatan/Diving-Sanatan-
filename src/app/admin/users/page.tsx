"use client";

import React, { useState, useEffect } from "react";
import { Card } from "@/components/ui/Card";
import { RefreshCw } from "lucide-react";
import StatsDashboard from "@/components/admin/StatsDashboard";

export default function AdminUsersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);

  // Form states
  const [newName, setNewName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [newGender, setNewGender] = useState("Female");
  const [newDob, setNewDob] = useState("");
  const [newRole, setNewRole] = useState("user");
  const [newCategory, setNewCategory] = useState("None");
  
  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const loadUsers = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/users");
      const json = await res.json();
      if (json.success) {
        setUsers(json.data);
        setCurrentPage(1);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || !newEmail.trim() || !newPassword.trim()) {
      alert("Name, Email, and Password are required.");
      return;
    }

    try {
      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newName.trim(),
          email: newEmail.trim(),
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
        setNewRole("user");
        setNewCategory("None");
        alert("User successfully created!");
        setShowAddForm(false);
        loadUsers();
      } else {
        alert(json.error || "Failed to create user.");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteUser = async (id: string, role: string) => {
    if (role === 'super_admin') {
      alert("Cannot delete the super_admin account.");
      return;
    }
    if (!confirm("Are you sure you want to delete this user?")) return;
    try {
      const res = await fetch(`/api/users?id=${id}`, { method: "DELETE" });
      const json = await res.json();
      if (json.success) {
        loadUsers();
      } else {
        alert(json.error || "Failed to delete user.");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleRoleChange = async (id: string, currentRole: string, newRole: string) => {
    if (currentRole === 'super_admin') {
      alert("Cannot change role of super_admin.");
      return;
    }
    if (!confirm(`Change role to ${newRole}?`)) return;
    try {
      const res = await fetch(`/api/users`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, role: newRole })
      });
      const json = await res.json();
      if (json.success) {
        loadUsers();
      } else {
        alert(json.error || "Failed to update role.");
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Pagination Logic
  const filteredUsers = users.filter(user => user.role !== 'super_admin');
  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);
  const paginatedUsers = filteredUsers.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

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

      {loading ? (
        <p className="text-center" style={{ padding: "40px", color: "#6c757d" }}>Loading users...</p>
      ) : (
        <div className={`admin-split-layout ${showAddForm ? 'with-form' : ''}`}>
          {/* List Table */}
          <div className="split-list-col">
            <Card variant="glass" className="card-primary" style={{ padding: "0 !important" }}>
              <div style={{ borderBottom: "1px solid #dee2e6", padding: "12px 20px", background: "#f8f9fa", fontWeight: "700", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span>Users List ({filteredUsers.length})</span>
                <button className="btn btn-primary btn-sm" onClick={() => setShowAddForm(!showAddForm)}>
                  {showAddForm ? 'Close Form' : '+ Add New User'}
                </button>
              </div>
              <div className="table-responsive">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Email</th>
                      <th>Role</th>
                      <th className="text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedUsers.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="text-center" style={{ padding: "20px" }}>No users found.</td>
                      </tr>
                    ) : (
                      paginatedUsers.map(user => (
                        <tr key={user.id}>
                          <td><strong>{user.name}</strong></td>
                          <td>{user.email}</td>
                          <td>
                            <select 
                              className="form-control" 
                              style={{ width: "auto", display: "inline-block", padding: "2px 8px", height: "auto" }}
                              value={user.role}
                              onChange={(e) => handleRoleChange(user.id, user.role, e.target.value)}
                              disabled={user.role === 'super_admin'}
                            >
                              <option value="user">User</option>
                              <option value="guru">Guru</option>
                              <option value="admin">Admin</option>
                              {user.role === 'super_admin' && <option value="super_admin">Super Admin</option>}
                            </select>
                          </td>
                          <td className="text-right">
                            <button 
                              className="btn btn-danger btn-sm"
                              onClick={() => handleDeleteUser(user.id, user.role)}
                              disabled={user.role === 'super_admin'}
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
                    Showing {filteredUsers.length === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1} to {Math.min(filteredUsers.length, currentPage * itemsPerPage)} of {filteredUsers.length} entries
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
          {showAddForm && (
            <div className="split-form-col">
              <Card variant="glass" className="card-success" style={{ padding: "0 !important" }}>
              <div style={{ borderBottom: "1px solid #dee2e6", padding: "12px 20px", background: "#f8f9fa", fontWeight: "700" }}>
                Add New User / Admin
              </div>
              <div style={{ padding: "20px" }}>
                <form onSubmit={handleAddUser} className="admin-catalog-form">
                  <div className="form-group mb-3">
                    <label>Name</label>
                    <input 
                      type="text" 
                      className="form-control" 
                      required 
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                    />
                  </div>
                  <div className="form-group mb-3">
                    <label>Email</label>
                    <input 
                      type="email" 
                      className="form-control" 
                      required 
                      value={newEmail}
                      onChange={(e) => setNewEmail(e.target.value)}
                    />
                  </div>
                  <div className="form-group mb-3">
                    <label>Password</label>
                    <input 
                      type="password" 
                      className="form-control" 
                      required 
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                    />
                  </div>
                  <div className="form-group mb-3">
                    <label>Role</label>
                    <select 
                      className="form-control" 
                      value={newRole}
                      onChange={(e) => setNewRole(e.target.value)}
                    >
                      <option value="user">User</option>
                      <option value="guru">Guru</option>
                      <option value="admin">Admin</option>
                    </select>
                  </div>
                  
                  {/* Additional details for gurus/users */}
                  <div className="form-group mb-3">
                    <label>Phone</label>
                    <input 
                      type="tel" 
                      className="form-control" 
                      value={newPhone}
                      onChange={(e) => setNewPhone(e.target.value)}
                    />
                  </div>
                  <div className="form-row" style={{ display: 'flex', gap: '10px' }}>
                    <div className="form-group mb-3" style={{ flex: 1 }}>
                      <label>Gender</label>
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
                      <label>DOB</label>
                      <input 
                        type="date" 
                        className="form-control" 
                        value={newDob}
                        onChange={(e) => setNewDob(e.target.value)}
                      />
                    </div>
                  </div>

                  <button type="submit" className="btn btn-success btn-block mt-3" style={{ width: "100%" }}>
                    Create Account
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
