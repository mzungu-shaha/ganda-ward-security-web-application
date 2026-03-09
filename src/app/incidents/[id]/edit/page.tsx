"use client";
import { useState, useEffect } from "react";
import AppLayout from "@/components/AppLayout";
import { useRouter, useParams } from "next/navigation";

interface Village { id: number; name: string; latitude: number; longitude: number; }
interface CrimeType { id: number; name: string; severity: string; }
interface Officer { id: number; full_name: string; badge_number: string; rank: string; }

export default function EditIncidentPage() {
  const router = useRouter();
  const params = useParams();
  const [villages, setVillages] = useState<Village[]>([]);
  const [crimeTypes, setCrimeTypes] = useState<CrimeType[]>([]);
  const [officers, setOfficers] = useState<Officer[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [form, setForm] = useState({
    date_time: "",
    village_id: "",
    crime_type_id: "",
    description: "",
    location: "",
    latitude: "",
    longitude: "",
    suspect_status: "unknown",
    officer_id: "",
    victims_count: "0",
    property_damage: "",
    evidence_collected: "",
    status: "open",
  });

  useEffect(() => {
    const token = localStorage.getItem("auth_token");
    const headers = { Authorization: `Bearer ${token}` };

    Promise.all([
      fetch("/api/villages", { headers }).then((r) => r.json()),
      fetch("/api/crime-types", { headers }).then((r) => r.json()),
      fetch("/api/officers", { headers }).then((r) => r.json()),
      fetch(`/api/incidents/${params.id}`, { headers }).then((r) => r.json()),
    ]).then(([v, ct, o, inc]) => {
      setVillages(v.villages || []);
      setCrimeTypes(ct.crimeTypes || []);
      setOfficers(o.officers || []);
      if (inc.incident) {
        const i = inc.incident;
        setForm({
          date_time: i.date_time?.slice(0, 16) || "",
          village_id: String(i.village_id || ""),
          crime_type_id: String(i.crime_type_id || ""),
          description: i.description || "",
          location: i.location || "",
          latitude: String(i.latitude || ""),
          longitude: String(i.longitude || ""),
          suspect_status: i.suspect_status || "unknown",
          officer_id: String(i.officer_id || ""),
          victims_count: String(i.victims_count || "0"),
          property_damage: i.property_damage || "",
          evidence_collected: i.evidence_collected || "",
          status: i.status || "open",
        });
      }
      setFetchLoading(false);
    });
  }, [params.id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    const token = localStorage.getItem("auth_token");
    try {
      const res = await fetch(`/api/incidents/${params.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(form),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to update incident");
        return;
      }

      setSuccess("Incident updated successfully!");
      setTimeout(() => router.push(`/incidents/${params.id}`), 1500);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (fetchLoading) {
    return (
      <AppLayout>
        <div className="d-flex align-items-center justify-content-center" style={{ minHeight: "400px" }}>
          <div className="spinner-border text-primary" role="status"></div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="d-flex align-items-center justify-content-between mb-4">
        <div>
          <h4 className="fw-bold mb-1">
            <i className="bi bi-pencil me-2 text-primary"></i>
            Edit Incident
          </h4>
          <p className="text-muted small mb-0">Update incident report details</p>
        </div>
        <button className="btn btn-outline-secondary btn-sm" onClick={() => router.back()}>
          <i className="bi bi-arrow-left me-1"></i>Back
        </button>
      </div>

      {error && (
        <div className="alert alert-danger d-flex align-items-center">
          <i className="bi bi-exclamation-triangle-fill me-2"></i>{error}
        </div>
      )}
      {success && (
        <div className="alert alert-success d-flex align-items-center">
          <i className="bi bi-check-circle-fill me-2"></i>{success}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="row g-4">
          <div className="col-md-8">
            <div className="card border-0 shadow-sm">
              <div className="card-header bg-white border-0">
                <h6 className="fw-bold mb-0">Incident Details</h6>
              </div>
              <div className="card-body">
                <div className="row g-3">
                  <div className="col-md-6">
                    <label className="form-label fw-semibold small">Date & Time</label>
                    <input type="datetime-local" className="form-control"
                      value={form.date_time}
                      onChange={(e) => setForm({ ...form, date_time: e.target.value })} required />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label fw-semibold small">Village</label>
                    <select className="form-select" value={form.village_id}
                      onChange={(e) => setForm({ ...form, village_id: e.target.value })} required>
                      <option value="">Select village...</option>
                      {villages.map((v) => <option key={v.id} value={v.id}>{v.name}</option>)}
                    </select>
                  </div>
                  <div className="col-md-6">
                    <label className="form-label fw-semibold small">Crime Type</label>
                    <select className="form-select" value={form.crime_type_id}
                      onChange={(e) => setForm({ ...form, crime_type_id: e.target.value })} required>
                      <option value="">Select crime type...</option>
                      {crimeTypes.map((ct) => <option key={ct.id} value={ct.id}>{ct.name}</option>)}
                    </select>
                  </div>
                  <div className="col-md-6">
                    <label className="form-label fw-semibold small">Suspect Status</label>
                    <select className="form-select" value={form.suspect_status}
                      onChange={(e) => setForm({ ...form, suspect_status: e.target.value })}>
                      <option value="unknown">Unknown</option>
                      <option value="arrested">Arrested</option>
                      <option value="under_investigation">Under Investigation</option>
                      <option value="at_large">At Large</option>
                    </select>
                  </div>
                  <div className="col-md-6">
                    <label className="form-label fw-semibold small">Case Status</label>
                    <select className="form-select" value={form.status}
                      onChange={(e) => setForm({ ...form, status: e.target.value })}>
                      <option value="open">Open</option>
                      <option value="under_investigation">Under Investigation</option>
                      <option value="closed">Closed</option>
                      <option value="referred">Referred</option>
                    </select>
                  </div>
                  <div className="col-md-6">
                    <label className="form-label fw-semibold small">Officer in Charge</label>
                    <select className="form-select" value={form.officer_id}
                      onChange={(e) => setForm({ ...form, officer_id: e.target.value })}>
                      <option value="">Select officer...</option>
                      {officers.map((o) => (
                        <option key={o.id} value={o.id}>{o.rank} {o.full_name} ({o.badge_number})</option>
                      ))}
                    </select>
                  </div>
                  <div className="col-12">
                    <label className="form-label fw-semibold small">Location</label>
                    <input type="text" className="form-control" value={form.location}
                      onChange={(e) => setForm({ ...form, location: e.target.value })} required maxLength={500} />
                  </div>
                  <div className="col-12">
                    <label className="form-label fw-semibold small">Description</label>
                    <textarea className="form-control" rows={4} value={form.description}
                      onChange={(e) => setForm({ ...form, description: e.target.value })} required maxLength={2000} />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label fw-semibold small">Victims Count</label>
                    <input type="number" className="form-control" min="0" value={form.victims_count}
                      onChange={(e) => setForm({ ...form, victims_count: e.target.value })} />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label fw-semibold small">Latitude</label>
                    <input type="number" className="form-control" step="0.0001" value={form.latitude}
                      onChange={(e) => setForm({ ...form, latitude: e.target.value })} />
                  </div>
                  <div className="col-12">
                    <label className="form-label fw-semibold small">Property Damage</label>
                    <input type="text" className="form-control" value={form.property_damage}
                      onChange={(e) => setForm({ ...form, property_damage: e.target.value })} maxLength={500} />
                  </div>
                  <div className="col-12">
                    <label className="form-label fw-semibold small">Evidence Collected</label>
                    <textarea className="form-control" rows={2} value={form.evidence_collected}
                      onChange={(e) => setForm({ ...form, evidence_collected: e.target.value })} maxLength={1000} />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="col-md-4">
            <div className="card border-0 shadow-sm">
              <div className="card-body">
                <div className="d-grid gap-2">
                  <button type="submit" className="btn btn-primary py-2 fw-semibold" disabled={loading}>
                    {loading ? (
                      <><span className="spinner-border spinner-border-sm me-2"></span>Saving...</>
                    ) : (
                      <><i className="bi bi-check-circle me-2"></i>Save Changes</>
                    )}
                  </button>
                  <button type="button" className="btn btn-outline-secondary" onClick={() => router.back()}>
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </form>
    </AppLayout>
  );
}
