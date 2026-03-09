"use client";
import { useState, useEffect } from "react";
import AppLayout from "@/components/AppLayout";
import { useRouter } from "next/navigation";

interface Village { id: number; name: string; latitude: number; longitude: number; }
interface CrimeType { id: number; name: string; severity: string; }
interface Officer { id: number; full_name: string; badge_number: string; rank: string; }

export default function NewIncidentPage() {
  const router = useRouter();
  const [villages, setVillages] = useState<Village[]>([]);
  const [crimeTypes, setCrimeTypes] = useState<CrimeType[]>([]);
  const [officers, setOfficers] = useState<Officer[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [form, setForm] = useState({
    date_time: new Date().toISOString().slice(0, 16),
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
  });

  useEffect(() => {
    const token = localStorage.getItem("auth_token");
    const headers = { Authorization: `Bearer ${token}` };

    Promise.all([
      fetch("/api/villages", { headers }).then((r) => r.json()),
      fetch("/api/crime-types", { headers }).then((r) => r.json()),
      fetch("/api/officers", { headers }).then((r) => r.json()),
    ]).then(([v, ct, o]) => {
      setVillages(v.villages || []);
      setCrimeTypes(ct.crimeTypes || []);
      setOfficers(o.officers || []);
    });
  }, []);

  // Auto-fill coordinates when village is selected
  const handleVillageChange = (villageId: string) => {
    const village = villages.find((v) => v.id === parseInt(villageId));
    setForm({
      ...form,
      village_id: villageId,
      latitude: village?.latitude?.toString() || "",
      longitude: village?.longitude?.toString() || "",
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    const token = localStorage.getItem("auth_token");
    try {
      const res = await fetch("/api/incidents", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(form),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to create incident");
        return;
      }

      setSuccess(`Incident ${data.incident_number} reported successfully!`);
      setTimeout(() => router.push("/incidents"), 2000);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const getSeverityColor = (severity: string) => {
    const colors: Record<string, string> = {
      critical: "text-danger fw-bold",
      high: "text-danger",
      medium: "text-warning",
      low: "text-success",
    };
    return colors[severity] || "";
  };

  return (
    <AppLayout>
      <div className="d-flex align-items-center justify-content-between mb-4">
        <div>
          <h4 className="fw-bold mb-1">
            <i className="bi bi-plus-circle me-2 text-danger"></i>
            Report New Incident
          </h4>
          <p className="text-muted small mb-0">Record a new crime incident in Ganda Ward</p>
        </div>
        <button className="btn btn-outline-secondary btn-sm" onClick={() => router.back()}>
          <i className="bi bi-arrow-left me-1"></i>Back
        </button>
      </div>

      {error && (
        <div className="alert alert-danger d-flex align-items-center">
          <i className="bi bi-exclamation-triangle-fill me-2"></i>
          {error}
        </div>
      )}
      {success && (
        <div className="alert alert-success d-flex align-items-center">
          <i className="bi bi-check-circle-fill me-2"></i>
          {success}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="row g-4">
          {/* Basic Information */}
          <div className="col-md-8">
            <div className="card border-0 shadow-sm">
              <div className="card-header bg-white border-0">
                <h6 className="fw-bold mb-0">
                  <i className="bi bi-info-circle me-2 text-primary"></i>
                  Incident Details
                </h6>
              </div>
              <div className="card-body">
                <div className="row g-3">
                  <div className="col-md-6">
                    <label className="form-label fw-semibold small">Date & Time <span className="text-danger">*</span></label>
                    <input
                      type="datetime-local"
                      className="form-control"
                      value={form.date_time}
                      onChange={(e) => setForm({ ...form, date_time: e.target.value })}
                      required
                      max={new Date().toISOString().slice(0, 16)}
                    />
                  </div>

                  <div className="col-md-6">
                    <label className="form-label fw-semibold small">Sub-location <span className="text-danger">*</span></label>
                    <select
                      className="form-select"
                      value={form.village_id}
                      onChange={(e) => handleVillageChange(e.target.value)}
                      required
                    >
                      <option value="">Select sub-location...</option>
                      {villages.map((v) => (
                        <option key={v.id} value={v.id}>{v.name}</option>
                      ))}
                    </select>
                  </div>

                  <div className="col-md-6">
                    <label className="form-label fw-semibold small">Crime Type <span className="text-danger">*</span></label>
                    <select
                      className="form-select"
                      value={form.crime_type_id}
                      onChange={(e) => setForm({ ...form, crime_type_id: e.target.value })}
                      required
                    >
                      <option value="">Select crime type...</option>
                      {crimeTypes.map((ct) => (
                        <option key={ct.id} value={ct.id}>
                          {ct.name} ({ct.severity})
                        </option>
                      ))}
                    </select>
                    {form.crime_type_id && (
                      <small className={getSeverityColor(crimeTypes.find((ct) => ct.id === parseInt(form.crime_type_id))?.severity || "")}>
                        Severity: {crimeTypes.find((ct) => ct.id === parseInt(form.crime_type_id))?.severity?.toUpperCase()}
                      </small>
                    )}
                  </div>

                  <div className="col-md-6">
                    <label className="form-label fw-semibold small">Suspect Status</label>
                    <select
                      className="form-select"
                      value={form.suspect_status}
                      onChange={(e) => setForm({ ...form, suspect_status: e.target.value })}
                    >
                      <option value="unknown">Unknown</option>
                      <option value="arrested">Arrested</option>
                      <option value="under_investigation">Under Investigation</option>
                      <option value="at_large">At Large</option>
                    </select>
                  </div>

                  <div className="col-12">
                    <label className="form-label fw-semibold small">Location / Address <span className="text-danger">*</span></label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="e.g., Near Ganda Central Market, opposite the school..."
                      value={form.location}
                      onChange={(e) => setForm({ ...form, location: e.target.value })}
                      required
                      maxLength={500}
                    />
                  </div>

                  <div className="col-12">
                    <label className="form-label fw-semibold small">Description <span className="text-danger">*</span></label>
                    <textarea
                      className="form-control"
                      rows={4}
                      placeholder="Provide a detailed description of the incident..."
                      value={form.description}
                      onChange={(e) => setForm({ ...form, description: e.target.value })}
                      required
                      maxLength={2000}
                    />
                    <small className="text-muted">{form.description.length}/2000 characters</small>
                  </div>
                </div>
              </div>
            </div>

            {/* Additional Details */}
            <div className="card border-0 shadow-sm mt-4">
              <div className="card-header bg-white border-0">
                <h6 className="fw-bold mb-0">
                  <i className="bi bi-clipboard-data me-2 text-secondary"></i>
                  Additional Information
                </h6>
              </div>
              <div className="card-body">
                <div className="row g-3">
                  <div className="col-md-6">
                    <label className="form-label fw-semibold small">Number of Victims</label>
                    <input
                      type="number"
                      className="form-control"
                      min="0"
                      max="999"
                      value={form.victims_count}
                      onChange={(e) => setForm({ ...form, victims_count: e.target.value })}
                    />
                  </div>

                  <div className="col-md-6">
                    <label className="form-label fw-semibold small">Officer in Charge</label>
                    <select
                      className="form-select"
                      value={form.officer_id}
                      onChange={(e) => setForm({ ...form, officer_id: e.target.value })}
                    >
                      <option value="">Select officer...</option>
                      {officers.map((o) => (
                        <option key={o.id} value={o.id}>
                          {o.rank} {o.full_name} ({o.badge_number})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="col-12">
                    <label className="form-label fw-semibold small">Property Damage</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Describe any property damage..."
                      value={form.property_damage}
                      onChange={(e) => setForm({ ...form, property_damage: e.target.value })}
                      maxLength={500}
                    />
                  </div>

                  <div className="col-12">
                    <label className="form-label fw-semibold small">Evidence Collected</label>
                    <textarea
                      className="form-control"
                      rows={2}
                      placeholder="List any evidence collected at the scene..."
                      value={form.evidence_collected}
                      onChange={(e) => setForm({ ...form, evidence_collected: e.target.value })}
                      maxLength={1000}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* GPS Coordinates */}
          <div className="col-md-4">
            <div className="card border-0 shadow-sm">
              <div className="card-header bg-white border-0">
                <h6 className="fw-bold mb-0">
                  <i className="bi bi-geo-alt me-2 text-success"></i>
                  GPS Coordinates
                </h6>
              </div>
              <div className="card-body">
                <p className="text-muted small mb-3">
                  Coordinates are auto-filled from the selected sub-location. You can adjust them for precise location.
                </p>
                <div className="mb-3">
                  <label className="form-label fw-semibold small">Latitude</label>
                  <input
                    type="number"
                    className="form-control"
                    step="0.0001"
                    placeholder="-3.2197"
                    value={form.latitude}
                    onChange={(e) => setForm({ ...form, latitude: e.target.value })}
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label fw-semibold small">Longitude</label>
                  <input
                    type="number"
                    className="form-control"
                    step="0.0001"
                    placeholder="40.1169"
                    value={form.longitude}
                    onChange={(e) => setForm({ ...form, longitude: e.target.value })}
                  />
                </div>
                {form.latitude && form.longitude && (
                  <div className="alert alert-success py-2 small">
                    <i className="bi bi-check-circle me-1"></i>
                    Location: {parseFloat(form.latitude).toFixed(4)}, {parseFloat(form.longitude).toFixed(4)}
                  </div>
                )}
              </div>
            </div>

            {/* Quick Reference */}
            <div className="card border-0 shadow-sm mt-4">
              <div className="card-header bg-white border-0">
                <h6 className="fw-bold mb-0">
                  <i className="bi bi-lightbulb me-2 text-warning"></i>
                  Quick Reference
                </h6>
              </div>
              <div className="card-body">
                <p className="small text-muted mb-2">Crime Severity Levels:</p>
                <div className="d-flex flex-column gap-1">
                  <span className="badge badge-critical text-white small">CRITICAL - Murder, Kidnapping, Sexual Assault</span>
                  <span className="badge badge-high text-white small">HIGH - Assault, Burglary, Robbery</span>
                  <span className="badge badge-medium text-white small">MEDIUM - Theft, Fraud</span>
                  <span className="badge badge-low text-white small">LOW - Vandalism, Trespassing</span>
                </div>
              </div>
            </div>

            {/* Submit */}
            <div className="mt-4 d-grid gap-2">
              <button
                type="submit"
                className="btn btn-danger py-2 fw-semibold"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2"></span>
                    Submitting...
                  </>
                ) : (
                  <>
                    <i className="bi bi-send me-2"></i>
                    Submit Incident Report
                  </>
                )}
              </button>
              <button
                type="button"
                className="btn btn-outline-secondary"
                onClick={() => router.back()}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      </form>
    </AppLayout>
  );
}
