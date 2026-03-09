"use client";
import { useState, useEffect } from "react";
import AppLayout from "@/components/AppLayout";
import { useRouter, useParams } from "next/navigation";
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
  latitude: number;
  longitude: number;
  suspect_status: string;
  officer_name: string;
  officer_badge: string;
  officer_rank: string;
  reported_by_name: string;
  victims_count: number;
  property_damage: string;
  evidence_collected: string;
  status: string;
  created_at: string;
  updated_at: string;
}

export default function IncidentDetailPage() {
  const router = useRouter();
  const params = useParams();
  const [incident, setIncident] = useState<Incident | null>(null);
  const [loading, setLoading] = useState(true);
  const [userRole] = useState(() => {
    if (typeof window === "undefined") return "";
    return JSON.parse(localStorage.getItem("user") || "{}").role || "";
  });

  useEffect(() => {
    const token = localStorage.getItem("auth_token");
    fetch(`/api/incidents/${params.id}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((data) => {
        setIncident(data.incident);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [params.id]);

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

  const getStatusBadge = (status: string) => {
    const classes: Record<string, string> = {
      open: "status-open", closed: "status-closed",
      under_investigation: "status-under_investigation", referred: "status-referred",
    };
    return `badge ${classes[status] || "bg-secondary"} text-white`;
  };

  const printReport = () => {
    window.print();
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="d-flex align-items-center justify-content-center" style={{ minHeight: "400px" }}>
          <div className="spinner-border text-primary" role="status"></div>
        </div>
      </AppLayout>
    );
  }

  if (!incident) {
    return (
      <AppLayout>
        <div className="text-center py-5">
          <i className="bi bi-exclamation-circle text-muted" style={{ fontSize: "3rem" }}></i>
          <h5 className="mt-3">Incident Not Found</h5>
          <Link href="/incidents" className="btn btn-primary btn-sm mt-2">Back to Incidents</Link>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      {/* Header */}
      <div className="d-flex align-items-center justify-content-between mb-4">
        <div>
          <h4 className="fw-bold mb-1">
            <i className="bi bi-file-earmark-text me-2 text-primary"></i>
            Incident Report
          </h4>
          <p className="text-muted small mb-0">
            <span className="fw-semibold text-primary">{incident.incident_number}</span>
            {" · "}
            {new Date(incident.date_time).toLocaleDateString("en-KE", {
              weekday: "long", year: "numeric", month: "long", day: "numeric"
            })}
          </p>
        </div>
        <div className="d-flex gap-2 no-print">
          <button className="btn btn-outline-secondary btn-sm" onClick={printReport}>
            <i className="bi bi-printer me-1"></i>Print
          </button>
          {["admin", "police_officer"].includes(userRole) && (
            <Link href={`/incidents/${incident.id}/edit`} className="btn btn-primary btn-sm">
              <i className="bi bi-pencil me-1"></i>Edit
            </Link>
          )}
          <button className="btn btn-outline-secondary btn-sm" onClick={() => router.back()}>
            <i className="bi bi-arrow-left me-1"></i>Back
          </button>
        </div>
      </div>

      <div className="row g-4">
        {/* Main Details */}
        <div className="col-md-8">
          <div className="card border-0 shadow-sm">
            <div className="card-header bg-white d-flex align-items-center justify-content-between">
              <h6 className="fw-bold mb-0">Incident Information</h6>
              <div className="d-flex gap-2">
                <span className={getSeverityBadge(incident.crime_severity)}>
                  {incident.crime_severity?.toUpperCase()}
                </span>
                <span className={getStatusBadge(incident.status)}>
                  {incident.status?.replace("_", " ").toUpperCase()}
                </span>
              </div>
            </div>
            <div className="card-body">
              <div className="row g-3">
                <div className="col-md-6">
                  <label className="text-muted small fw-semibold">INCIDENT NUMBER</label>
                  <p className="fw-bold text-primary mb-0">{incident.incident_number}</p>
                </div>
                <div className="col-md-6">
                  <label className="text-muted small fw-semibold">DATE & TIME</label>
                  <p className="mb-0">
                    {new Date(incident.date_time).toLocaleDateString("en-KE", {
                      year: "numeric", month: "long", day: "numeric"
                    })}
                    {" at "}
                    {new Date(incident.date_time).toLocaleTimeString("en-KE", {
                      hour: "2-digit", minute: "2-digit"
                    })}
                  </p>
                </div>
                <div className="col-md-6">
                  <label className="text-muted small fw-semibold">VILLAGE</label>
                  <p className="mb-0">{incident.village_name}</p>
                </div>
                <div className="col-md-6">
                  <label className="text-muted small fw-semibold">CRIME TYPE</label>
                  <p className="mb-0">
                    <span className={getSeverityBadge(incident.crime_severity)}>
                      {incident.crime_type_name}
                    </span>
                  </p>
                </div>
                <div className="col-12">
                  <label className="text-muted small fw-semibold">LOCATION</label>
                  <p className="mb-0">{incident.location}</p>
                  {incident.latitude && incident.longitude && (
                    <small className="text-muted">
                      <i className="bi bi-geo-alt me-1"></i>
                      GPS: {incident.latitude.toFixed(4)}, {incident.longitude.toFixed(4)}
                    </small>
                  )}
                </div>
                <div className="col-12">
                  <label className="text-muted small fw-semibold">DESCRIPTION</label>
                  <p className="mb-0">{incident.description}</p>
                </div>
                {incident.property_damage && (
                  <div className="col-12">
                    <label className="text-muted small fw-semibold">PROPERTY DAMAGE</label>
                    <p className="mb-0">{incident.property_damage}</p>
                  </div>
                )}
                {incident.evidence_collected && (
                  <div className="col-12">
                    <label className="text-muted small fw-semibold">EVIDENCE COLLECTED</label>
                    <p className="mb-0">{incident.evidence_collected}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="col-md-4">
          {/* Status Card */}
          <div className="card border-0 shadow-sm mb-4">
            <div className="card-header bg-white border-0">
              <h6 className="fw-bold mb-0">Case Status</h6>
            </div>
            <div className="card-body">
              <div className="mb-3">
                <label className="text-muted small fw-semibold">SUSPECT STATUS</label>
                <div className="mt-1">
                  <span className={`${getSuspectBadge(incident.suspect_status)} fs-6`}>
                    {incident.suspect_status?.replace("_", " ").toUpperCase()}
                  </span>
                </div>
              </div>
              <div className="mb-3">
                <label className="text-muted small fw-semibold">CASE STATUS</label>
                <div className="mt-1">
                  <span className={`${getStatusBadge(incident.status)} fs-6`}>
                    {incident.status?.replace("_", " ").toUpperCase()}
                  </span>
                </div>
              </div>
              <div>
                <label className="text-muted small fw-semibold">VICTIMS COUNT</label>
                <p className="mb-0 fw-bold">{incident.victims_count || 0}</p>
              </div>
            </div>
          </div>

          {/* Officer Card */}
          <div className="card border-0 shadow-sm mb-4">
            <div className="card-header bg-white border-0">
              <h6 className="fw-bold mb-0">
                <i className="bi bi-person-badge me-2"></i>Officer in Charge
              </h6>
            </div>
            <div className="card-body">
              {incident.officer_name ? (
                <>
                  <p className="fw-semibold mb-1">{incident.officer_rank} {incident.officer_name}</p>
                  <p className="text-muted small mb-0">Badge: {incident.officer_badge}</p>
                </>
              ) : (
                <p className="text-muted small mb-0">No officer assigned</p>
              )}
            </div>
          </div>

          {/* Metadata */}
          <div className="card border-0 shadow-sm">
            <div className="card-header bg-white border-0">
              <h6 className="fw-bold mb-0">Record Information</h6>
            </div>
            <div className="card-body">
              <div className="mb-2">
                <label className="text-muted small fw-semibold">REPORTED BY</label>
                <p className="mb-0 small">{incident.reported_by_name || "System"}</p>
              </div>
              <div className="mb-2">
                <label className="text-muted small fw-semibold">CREATED</label>
                <p className="mb-0 small">
                  {new Date(incident.created_at).toLocaleDateString("en-KE", {
                    year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit"
                  })}
                </p>
              </div>
              <div>
                <label className="text-muted small fw-semibold">LAST UPDATED</label>
                <p className="mb-0 small">
                  {new Date(incident.updated_at).toLocaleDateString("en-KE", {
                    year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit"
                  })}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
