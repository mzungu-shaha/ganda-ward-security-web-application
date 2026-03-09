"use client";
import { useState, useEffect, useCallback } from "react";
import AppLayout from "@/components/AppLayout";
import { useRouter } from "next/navigation";

interface User {
  id: number;
  username: string;
  email: string;
  full_name: string;
  role: string;
  badge_number: string;
  phone: string;
  is_active: number;
  created_at: string;
  last_login: string;
}

export default function UsersPage() {
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [form, setForm] = useState({
    username: "", email: "", password: "", full_name: "",
    role: "police_officer", badge_number: "", phone: "",
  });

  const fetchUsers = useCallback(async () => {
    const token = localStorage.getItem("auth_token");
    const res = await fetch("/api/users", {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.status === 403) {
      router.replace("/dashboard");
      return;
    }
    const data = await res.json();
    setUsers(data.users || []);
    setLoading(false);
  }, [router]);

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    if (user.role !== "admin") {
      router.replace("/dashboard");
      return;
    }
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchUsers();
  }, [router, fetchUsers]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    const token = localStorage.getItem("auth_token");
    const res = await fetch("/api/users", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "Failed to create user");
      return;
    }
    setSuccess("User created successfully!");
    setShowModal(false);
    setForm({ username: "", email: "", password: "", full_name: "", role: "police_officer", badge_number: "", phone: "" });
    fetchUsers();
    setTimeout(() => setSuccess(""), 3000);
  };

  const handleDelete = async (userId: number) => {
    if (!confirm("Are you sure you want to delete this user? This action cannot be undone.")) {
      return;
    }
    setError("");
    const token = localStorage.getItem("auth_token");
    const res = await fetch(`/api/users?id=${userId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "Failed to delete user");
      return;
    }
    setSuccess("User deleted successfully!");
    fetchUsers();
    setTimeout(() => setSuccess(""), 3000);
  };

  const getRoleBadge = (role: string) => {
    const badges: Record<string, string> = {
      admin: "danger", police_officer: "primary", assistant_chief: "success",
    };
    return badges[role] || "secondary";
  };

  const getRoleLabel = (role: string) => {
    const labels: Record<string, string> = {
      admin: "Administrator", police_officer: "Police Officer",
      assistant_chief: "Assistant Chief",
    };
    return labels[role] || role;
  };

  return (
    <AppLayout>
      <div className="d-flex align-items-center justify-content-between mb-4">
        <div>
          <h4 className="fw-bold mb-1">
            <i className="bi bi-people me-2 text-primary"></i>
            User Management
          </h4>
          <p className="text-muted small mb-0">{users.length} registered users</p>
        </div>
        <button className="btn btn-primary btn-sm" onClick={() => setShowModal(true)}>
          <i className="bi bi-person-plus me-1"></i>Add User
        </button>
      </div>

      {success && (
        <div className="alert alert-success">
          <i className="bi bi-check-circle me-2"></i>{success}
        </div>
      )}

      {loading ? (
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status"></div>
        </div>
      ) : (
        <div className="card border-0 shadow-sm">
          <div className="card-body p-0">
            <div className="table-responsive">
              <table className="table table-hover mb-0">
                <thead className="table-light">
                  <tr>
                    <th className="small fw-semibold">User</th>
                    <th className="small fw-semibold">Role</th>
                    <th className="small fw-semibold">Contact</th>
                    <th className="small fw-semibold">Badge #</th>
                    <th className="small fw-semibold">Status</th>
                    <th className="small fw-semibold">Last Login</th>
                    <th className="small fw-semibold">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr key={user.id}>
                      <td>
                        <div className="d-flex align-items-center">
                          <div
                            className={`rounded-circle d-flex align-items-center justify-content-center me-2 bg-${getRoleBadge(user.role)} bg-opacity-10 flex-shrink-0`}
                            style={{ width: "36px", height: "36px" }}
                          >
                            <i className={`bi bi-person text-${getRoleBadge(user.role)}`}></i>
                          </div>
                          <div>
                            <div className="fw-semibold small">{user.full_name}</div>
                            <div className="text-muted" style={{ fontSize: "0.75rem" }}>@{user.username}</div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className={`badge bg-${getRoleBadge(user.role)}`} style={{ fontSize: "0.7rem" }}>
                          {getRoleLabel(user.role)}
                        </span>
                      </td>
                      <td>
                        <div className="small">{user.email}</div>
                        {user.phone && <div className="text-muted" style={{ fontSize: "0.75rem" }}>{user.phone}</div>}
                      </td>
                      <td className="small">{user.badge_number || <span className="text-muted">—</span>}</td>
                      <td>
                        <span className={`badge ${user.is_active ? "bg-success" : "bg-secondary"}`} style={{ fontSize: "0.7rem" }}>
                          {user.is_active ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td className="small text-muted">
                        {user.last_login
                          ? new Date(user.last_login).toLocaleDateString("en-KE", { day: "2-digit", month: "short", year: "numeric" })
                          : "Never"}
                      </td>
                      <td>
                        {user.role !== 'admin' && (
                          <button
                            className="btn btn-sm btn-outline-danger"
                            onClick={() => handleDelete(user.id)}
                            title="Delete user"
                          >
                            <i className="bi bi-trash"></i>
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Add User Modal */}
      {showModal && (
        <div className="modal show d-block" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
          <div className="modal-dialog modal-lg">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title fw-bold">
                  <i className="bi bi-person-plus me-2"></i>Add New User
                </h5>
                <button className="btn-close" onClick={() => setShowModal(false)}></button>
              </div>
              <form onSubmit={handleSubmit}>
                <div className="modal-body">
                  {error && <div className="alert alert-danger small">{error}</div>}
                  <div className="row g-3">
                    <div className="col-md-6">
                      <label className="form-label fw-semibold small">Full Name <span className="text-danger">*</span></label>
                      <input type="text" className="form-control" value={form.full_name}
                        onChange={(e) => setForm({ ...form, full_name: e.target.value })} required maxLength={100} />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label fw-semibold small">Username <span className="text-danger">*</span></label>
                      <input type="text" className="form-control" value={form.username}
                        onChange={(e) => setForm({ ...form, username: e.target.value })} required maxLength={50}
                        pattern="[a-zA-Z0-9_]+" title="Only letters, numbers, and underscores" />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label fw-semibold small">Email <span className="text-danger">*</span></label>
                      <input type="email" className="form-control" value={form.email}
                        onChange={(e) => setForm({ ...form, email: e.target.value })} required maxLength={100} />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label fw-semibold small">Password <span className="text-danger">*</span></label>
                      <input type="password" className="form-control" value={form.password}
                        onChange={(e) => setForm({ ...form, password: e.target.value })} required minLength={6} maxLength={100} />
                      <small className="text-muted">Minimum 6 characters</small>
                    </div>
                    <div className="col-md-4">
                      <label className="form-label fw-semibold small">Role <span className="text-danger">*</span></label>
                      <select className="form-select" value={form.role}
                        onChange={(e) => setForm({ ...form, role: e.target.value })}>
                        <option value="admin">Administrator</option>
                        <option value="police_officer">Police Officer</option>
                        <option value="assistant_chief">Assistant Chief</option>
                      </select>
                    </div>
                    <div className="col-md-4">
                      <label className="form-label fw-semibold small">Badge Number</label>
                      <input type="text" className="form-control" value={form.badge_number}
                        onChange={(e) => setForm({ ...form, badge_number: e.target.value })} maxLength={20} />
                    </div>
                    <div className="col-md-4">
                      <label className="form-label fw-semibold small">Phone</label>
                      <input type="tel" className="form-control" value={form.phone}
                        onChange={(e) => setForm({ ...form, phone: e.target.value })} maxLength={20} />
                    </div>
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-outline-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                  <button type="submit" className="btn btn-primary">
                    <i className="bi bi-person-check me-1"></i>Create User
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  );
}
