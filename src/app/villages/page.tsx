"use client";
import { useState, useEffect } from "react";
import AppLayout from "@/components/AppLayout";

interface Village {
  id: number;
  name: string;
  description: string;
  population: number;
  latitude: number;
  longitude: number;
  incident_count: number;
  created_at: string;
}

export default function VillagesPage() {
  const [villages, setVillages] = useState<Village[]>([]);
  const [loading, setLoading] = useState(true);
  const [userRole] = useState(() => {
    if (typeof window === "undefined") return "";
    return JSON.parse(localStorage.getItem("user") || "{}").role || "";
  });
  const [showModal, setShowModal] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [form, setForm] = useState({
    name: "", description: "", population: "", latitude: "", longitude: "",
  });

  const fetchVillages = async () => {
    const token = localStorage.getItem("auth_token");
    const res = await fetch("/api/villages", {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    setVillages(data.villages || []);
    setLoading(false);
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchVillages();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    const token = localStorage.getItem("auth_token");
    const res = await fetch("/api/villages", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "Failed to add village");
      return;
    }
    setSuccess("Village added successfully!");
    setShowModal(false);
    setForm({ name: "", description: "", population: "", latitude: "", longitude: "" });
    fetchVillages();
    setTimeout(() => setSuccess(""), 3000);
  };

  const getRiskLevel = (count: number) => {
    if (count >= 5) return { label: "High Risk", color: "danger" };
    if (count >= 3) return { label: "Medium Risk", color: "warning" };
    return { label: "Low Risk", color: "success" };
  };

  return (
    <AppLayout>
      <div className="d-flex align-items-center justify-content-between mb-4">
        <div>
          <h4 className="fw-bold mb-1">
            <i className="bi bi-houses me-2 text-primary"></i>
            Villages
          </h4>
          <p className="text-muted small mb-0">{villages.length} villages in Ganda Ward</p>
        </div>
        {userRole === "admin" && (
          <button className="btn btn-primary btn-sm" onClick={() => setShowModal(true)}>
            <i className="bi bi-plus-circle me-1"></i>Add Village
          </button>
        )}
      </div>

      {success && (
        <div className="alert alert-success alert-dismissible">
          <i className="bi bi-check-circle me-2"></i>{success}
        </div>
      )}

      {loading ? (
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status"></div>
        </div>
      ) : (
        <div className="row g-3">
          {villages.map((village) => {
            const risk = getRiskLevel(village.incident_count);
            return (
              <div key={village.id} className="col-md-6 col-lg-4">
                <div className="card border-0 shadow-sm h-100">
                  <div className="card-body">
                    <div className="d-flex align-items-start justify-content-between mb-3">
                      <div>
                        <h6 className="fw-bold mb-1">{village.name}</h6>
                        {village.description && (
                          <p className="text-muted small mb-0">{village.description}</p>
                        )}
                      </div>
                      <span className={`badge bg-${risk.color}`}>{risk.label}</span>
                    </div>

                    <div className="row g-2 mb-3">
                      <div className="col-6">
                        <div className="bg-light rounded p-2 text-center">
                          <div className="fw-bold text-danger">{village.incident_count}</div>
                          <div className="text-muted" style={{ fontSize: "0.7rem" }}>Incidents</div>
                        </div>
                      </div>
                      <div className="col-6">
                        <div className="bg-light rounded p-2 text-center">
                          <div className="fw-bold">{village.population?.toLocaleString() || "N/A"}</div>
                          <div className="text-muted" style={{ fontSize: "0.7rem" }}>Population</div>
                        </div>
                      </div>
                    </div>

                    {village.latitude && village.longitude && (
                      <div className="d-flex align-items-center text-muted small">
                        <i className="bi bi-geo-alt me-1"></i>
                        {village.latitude.toFixed(4)}, {village.longitude.toFixed(4)}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add Village Modal */}
      {showModal && (
        <div className="modal show d-block" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title fw-bold">Add New Village</h5>
                <button className="btn-close" onClick={() => setShowModal(false)}></button>
              </div>
              <form onSubmit={handleSubmit}>
                <div className="modal-body">
                  {error && <div className="alert alert-danger small">{error}</div>}
                  <div className="mb-3">
                    <label className="form-label fw-semibold small">Village Name <span className="text-danger">*</span></label>
                    <input type="text" className="form-control" value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })} required maxLength={100} />
                  </div>
                  <div className="mb-3">
                    <label className="form-label fw-semibold small">Description</label>
                    <textarea className="form-control" rows={2} value={form.description}
                      onChange={(e) => setForm({ ...form, description: e.target.value })} maxLength={500} />
                  </div>
                  <div className="row g-2">
                    <div className="col-4">
                      <label className="form-label fw-semibold small">Population</label>
                      <input type="number" className="form-control" value={form.population}
                        onChange={(e) => setForm({ ...form, population: e.target.value })} min="0" />
                    </div>
                    <div className="col-4">
                      <label className="form-label fw-semibold small">Latitude</label>
                      <input type="number" className="form-control" step="0.0001" value={form.latitude}
                        onChange={(e) => setForm({ ...form, latitude: e.target.value })} />
                    </div>
                    <div className="col-4">
                      <label className="form-label fw-semibold small">Longitude</label>
                      <input type="number" className="form-control" step="0.0001" value={form.longitude}
                        onChange={(e) => setForm({ ...form, longitude: e.target.value })} />
                    </div>
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-outline-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                  <button type="submit" className="btn btn-primary">Add Village</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  );
}
