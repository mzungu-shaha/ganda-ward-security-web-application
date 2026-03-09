"use client";
import { useState, useEffect, useCallback } from "react";
import AppLayout from "@/components/AppLayout";
import Link from "next/link";

interface Incident {
  id: number;
  incident_number: string;
  date_time: string;
  village_name: string;
  crime_type_name: string;
  crime_severity: string;
  description: string;
  location: string;
  suspect_status: string;
  officer_name: string;
  status: string;
}

interface Village { id: number; name: string; }
interface CrimeType { id: number; name: string; }
interface Officer { id: number; full_name: string; badge_number: string; }

export default function IncidentsPage() {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, total: 0, pages: 1 });
  const [villages, setVillages] = useState<Village[]>([]);
  const [crimeTypes, setCrimeTypes] = useState<CrimeType[]>([]);
  const [officers, setOfficers] = useState<Officer[]>([]);
  const [userRole] = useState(() => {
    if (typeof window === "undefined") return "";
    return JSON.parse(localStorage.getItem("user") || "{}").role || "";
  });

  // Filters
  const [filters, setFilters] = useState({
    village: "",
    crime_type: "",
    officer: "",
    date_from: "",
    date_to: "",
    status: "",
    search: "",
  });
  const [page, setPage] = useState(1);

  const fetchIncidents = useCallback(async () => {
    setLoading(true);
    const token = localStorage.getItem("auth_token");
    const params = new URLSearchParams({ page: String(page), limit: "15" });
    Object.entries(filters).forEach(([k, v]) => { if (v) params.set(k, v); });

    const res = await fetch(`/api/incidents?${params}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    setIncidents(data.incidents || []);
    setPagination(data.pagination || { page: 1, total: 0, pages: 1 });
    setLoading(false);
  }, [filters, page]);

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

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchIncidents();
  }, [fetchIncidents]);

  const handleDelete = async (id: number, incNum: string) => {
    if (!confirm(`Delete incident ${incNum}? This cannot be undone.`)) return;
    const token = localStorage.getItem("auth_token");
    const res = await fetch(`/api/incidents/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) fetchIncidents();
    else alert("Failed to delete incident");
  };

  const getSeverityBadge = (severity: string) => {
    const classes: Record<string, string> = {
      critical: "badge-critical", high: "badge-high", medium: "badge-medium", low: "badge-low",
    };
    return `badge ${classes[severity] || "bg-secondary"} text-white`;
  };

  const getSuspectBadge = (status: string) => {
    const classes: Record<string, string> = {
      unknown: "suspect-unknown", arrested: "suspect-arrested",
      under_investigation: "suspect-under_investigation", at_large: "suspect-at_large",
    };
    return `badge ${classes[status] || "bg-secondary"} text-white`;
  };

  const exportCSV = () => {
    const headers = ["Incident #", "Date/Time", "Sub-location", "Crime Type", "Location", "Suspect Status", "Officer", "Status"];
    const rows = incidents.map((i) => [
      i.incident_number,
      new Date(i.date_time).toLocaleString("en-KE"),
      i.village_name,
      i.crime_type_name,
      i.location,
      i.suspect_status,
      i.officer_name || "N/A",
      i.status,
    ]);
    const csv = [headers, ...rows].map((r) => r.map((c) => `"${c}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `ganda-ward-incidents-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
  };

  return (
    <AppLayout>
      <div className="d-flex align-items-center justify-content-between mb-4">
        <div>
          <h4 className="fw-bold mb-1">
            <i className="bi bi-exclamation-triangle me-2 text-danger"></i>
            Crime Incidents
          </h4>
          <p className="text-muted small mb-0">{pagination.total} total incidents recorded</p>
        </div>
        <div className="d-flex gap-2">
          {["admin", "police_officer"].includes(userRole) && (
            <Link href="/incidents/new" className="btn btn-danger btn-sm">
              <i className="bi bi-plus-circle me-1"></i>
              Report Incident
            </Link>
          )}
          <button className="btn btn-outline-secondary btn-sm" onClick={exportCSV}>
            <i className="bi bi-download me-1"></i>
            Export CSV
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="card border-0 shadow-sm mb-4">
        <div className="card-body">
          <h6 className="fw-semibold mb-3">
            <i className="bi bi-funnel me-2"></i>Filter Incidents
          </h6>
          <div className="row g-2">
            <div className="col-md-3">
              <input
                type="text"
                className="form-control form-control-sm"
                placeholder="Search incidents..."
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              />
            </div>
            <div className="col-md-2">
              <select
                className="form-select form-select-sm"
                value={filters.village}
                onChange={(e) => setFilters({ ...filters, village: e.target.value })}
              >
                <option value="">All Sub-locations</option>
                {villages.map((v) => <option key={v.id} value={v.id}>{v.name}</option>)}
              </select>
            </div>
            <div className="col-md-2">
              <select
                className="form-select form-select-sm"
                value={filters.crime_type}
                onChange={(e) => setFilters({ ...filters, crime_type: e.target.value })}
              >
                <option value="">All Crime Types</option>
                {crimeTypes.map((ct) => <option key={ct.id} value={ct.id}>{ct.name}</option>)}
              </select>
            </div>
            <div className="col-md-2">
              <select
                className="form-select form-select-sm"
                value={filters.officer}
                onChange={(e) => setFilters({ ...filters, officer: e.target.value })}
              >
                <option value="">All Officers</option>
                {officers.map((o) => <option key={o.id} value={o.id}>{o.full_name}</option>)}
              </select>
            </div>
            <div className="col-md-1">
              <select
                className="form-select form-select-sm"
                value={filters.status}
                onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              >
                <option value="">All Status</option>
                <option value="open">Open</option>
                <option value="under_investigation">Under Investigation</option>
                <option value="closed">Closed</option>
                <option value="referred">Referred</option>
              </select>
            </div>
            <div className="col-md-1">
              <input
                type="date"
                className="form-control form-control-sm"
                value={filters.date_from}
                onChange={(e) => setFilters({ ...filters, date_from: e.target.value })}
                title="From date"
              />
            </div>
            <div className="col-md-1">
              <input
                type="date"
                className="form-control form-control-sm"
                value={filters.date_to}
                onChange={(e) => setFilters({ ...filters, date_to: e.target.value })}
                title="To date"
              />
            </div>
          </div>
          <div className="mt-2 d-flex gap-2">
            <button
              className="btn btn-primary btn-sm"
              onClick={() => { setPage(1); fetchIncidents(); }}
            >
              <i className="bi bi-search me-1"></i>Search
            </button>
            <button
              className="btn btn-outline-secondary btn-sm"
              onClick={() => {
                setFilters({ village: "", crime_type: "", officer: "", date_from: "", date_to: "", status: "", search: "" });
                setPage(1);
              }}
            >
              <i className="bi bi-x-circle me-1"></i>Clear
            </button>
          </div>
        </div>
      </div>

      {/* Incidents Table */}
      <div className="card border-0 shadow-sm">
        <div className="card-body p-0">
          {loading ? (
            <div className="text-center py-5">
              <div className="spinner-border text-primary" role="status"></div>
              <p className="text-muted mt-2">Loading incidents...</p>
            </div>
          ) : incidents.length === 0 ? (
            <div className="text-center py-5">
              <i className="bi bi-inbox text-muted" style={{ fontSize: "3rem" }}></i>
              <p className="text-muted mt-2">No incidents found</p>
              {["admin", "police_officer"].includes(userRole) && (
                <Link href="/incidents/new" className="btn btn-primary btn-sm">
                  Report First Incident
                </Link>
              )}
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover mb-0">
                <thead className="table-light">
                  <tr>
                    <th className="small fw-semibold">Incident #</th>
                    <th className="small fw-semibold">Date & Time</th>
                    <th className="small fw-semibold">Sub-location</th>
                    <th className="small fw-semibold">Crime Type</th>
                    <th className="small fw-semibold">Location</th>
                    <th className="small fw-semibold">Suspect</th>
                    <th className="small fw-semibold">Officer</th>
                    <th className="small fw-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {incidents.map((inc) => (
                    <tr key={inc.id}>
                      <td>
                        <span className="fw-semibold small text-primary">{inc.incident_number}</span>
                      </td>
                      <td className="small text-muted">
                        {new Date(inc.date_time).toLocaleDateString("en-KE", {
                          day: "2-digit", month: "short", year: "numeric"
                        })}
                        <br />
                        <small>{new Date(inc.date_time).toLocaleTimeString("en-KE", { hour: "2-digit", minute: "2-digit" })}</small>
                      </td>
                      <td className="small">{inc.village_name}</td>
                      <td>
                        <span className={getSeverityBadge(inc.crime_severity)} style={{ fontSize: "0.7rem" }}>
                          {inc.crime_type_name}
                        </span>
                      </td>
                      <td className="small text-muted" style={{ maxWidth: "150px" }}>
                        <span className="text-truncate d-block">{inc.location}</span>
                      </td>
                      <td>
                        <span className={getSuspectBadge(inc.suspect_status)} style={{ fontSize: "0.7rem" }}>
                          {inc.suspect_status.replace("_", " ")}
                        </span>
                      </td>
                      <td className="small">{inc.officer_name || <span className="text-muted">Unassigned</span>}</td>
                      <td>
                        <div className="d-flex gap-1">
                          <Link
                            href={`/incidents/${inc.id}`}
                            className="btn btn-sm btn-outline-primary py-0 px-2"
                            title="View"
                          >
                            <i className="bi bi-eye"></i>
                          </Link>
                          {["admin", "police_officer"].includes(userRole) && (
                            <Link
                              href={`/incidents/${inc.id}/edit`}
                              className="btn btn-sm btn-outline-secondary py-0 px-2"
                              title="Edit"
                            >
                              <i className="bi bi-pencil"></i>
                            </Link>
                          )}
                          {userRole === "admin" && (
                            <button
                              className="btn btn-sm btn-outline-danger py-0 px-2"
                              onClick={() => handleDelete(inc.id, inc.incident_number)}
                              title="Delete"
                            >
                              <i className="bi bi-trash"></i>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Pagination */}
        {pagination.pages > 1 && (
          <div className="card-footer bg-white d-flex align-items-center justify-content-between">
            <small className="text-muted">
              Showing {(pagination.page - 1) * 15 + 1}–{Math.min(pagination.page * 15, pagination.total)} of {pagination.total}
            </small>
            <nav>
              <ul className="pagination pagination-sm mb-0">
                <li className={`page-item ${page === 1 ? "disabled" : ""}`}>
                  <button className="page-link" onClick={() => setPage(page - 1)}>
                    <i className="bi bi-chevron-left"></i>
                  </button>
                </li>
                {Array.from({ length: Math.min(5, pagination.pages) }, (_, i) => {
                  const p = Math.max(1, Math.min(page - 2, pagination.pages - 4)) + i;
                  return (
                    <li key={p} className={`page-item ${p === page ? "active" : ""}`}>
                      <button className="page-link" onClick={() => setPage(p)}>{p}</button>
                    </li>
                  );
                })}
                <li className={`page-item ${page === pagination.pages ? "disabled" : ""}`}>
                  <button className="page-link" onClick={() => setPage(page + 1)}>
                    <i className="bi bi-chevron-right"></i>
                  </button>
                </li>
              </ul>
            </nav>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
