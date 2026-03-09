"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import AppLayout from "@/components/AppLayout";
import PublicLayout from "@/components/PublicLayout";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface DashboardData {
  totalIncidents: number;
  incidentsByCrimeType: Array<{ name: string; count: number; severity: string }>;
  incidentsByVillage: Array<{ name: string; count: number }>;
  incidentsByMonth: Array<{ month: string; count: number }>;
  highRiskVillages: Array<{ name: string; count: number }>;
  incidentsBySuspectStatus: Array<{ suspect_status: string; count: number }>;
  recentIncidents: Array<{
    incident_number: string;
    date_time: string;
    description: string;
    suspect_status: string;
    status: string;
    village_name: string;
    crime_type_name: string;
    crime_severity: string;
  }>;
  thisMonthCount: number;
  lastMonthCount: number;
  incidentsByStatus: Array<{ status: string; count: number }>;
  notifications: Array<{ id: number; title: string; message: string; type: string; created_at: string }>;
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    // Check auth on initial render
    if (typeof window === "undefined") return false;
    const token = localStorage.getItem("auth_token");
    const userData = localStorage.getItem("user");
    return !!token && !!userData;
  });
  const router = useRouter();
  const chartsInitialized = useRef(false);

  const initCharts = useCallback((d: DashboardData) => {
    const Chart = (window as unknown as { Chart: new (...args: unknown[]) => unknown }).Chart;
    if (!Chart) return;

    // Bar chart - Crimes by village
    const villageCtx = document.getElementById("villageChart") as HTMLCanvasElement;
    if (villageCtx) {
      new Chart(villageCtx, {
        type: "bar",
        data: {
          labels: d.incidentsByVillage.map((v) => v.name),
          datasets: [{
            label: "Incidents",
            data: d.incidentsByVillage.map((v) => v.count),
            backgroundColor: "rgba(26, 58, 92, 0.8)",
            borderColor: "rgba(26, 58, 92, 1)",
            borderWidth: 1,
            borderRadius: 4,
          }],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { display: false } },
          scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } } },
        },
      });
    }

    // Pie chart - Crime type distribution
    const crimeTypeCtx = document.getElementById("crimeTypeChart") as HTMLCanvasElement;
    if (crimeTypeCtx) {
      const colors = ["#e74c3c", "#3498db", "#f39c12", "#27ae60", "#9b59b6", "#1abc9c", "#e67e22", "#2c3e50"];
      new Chart(crimeTypeCtx, {
        type: "doughnut",
        data: {
          labels: d.incidentsByCrimeType.slice(0, 8).map((c) => c.name),
          datasets: [{
            data: d.incidentsByCrimeType.slice(0, 8).map((c) => c.count),
            backgroundColor: colors,
            borderWidth: 2,
            borderColor: "#fff",
          }],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { position: "right", labels: { font: { size: 11 } } },
          },
        },
      });
    }

    // Line chart - Crime trend over time
    const trendCtx = document.getElementById("trendChart") as HTMLCanvasElement;
    if (trendCtx) {
      const months = d.incidentsByMonth.map((m) => {
        const [year, month] = m.month.split("-");
        return new Date(parseInt(year), parseInt(month) - 1).toLocaleDateString("en-US", { month: "short", year: "2-digit" });
      });
      new Chart(trendCtx, {
        type: "line",
        data: {
          labels: months,
          datasets: [{
            label: "Incidents",
            data: d.incidentsByMonth.map((m) => m.count),
            borderColor: "#e74c3c",
            backgroundColor: "rgba(231, 76, 60, 0.1)",
            borderWidth: 2,
            fill: true,
            tension: 0.4,
            pointBackgroundColor: "#e74c3c",
            pointRadius: 4,
          }],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { display: false } },
          scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } } },
        },
      });
    }

    // Suspect status chart
    const suspectCtx = document.getElementById("suspectChart") as HTMLCanvasElement;
    if (suspectCtx) {
      const statusColors: Record<string, string> = {
        unknown: "#95a5a6",
        arrested: "#27ae60",
        under_investigation: "#f39c12",
        at_large: "#e74c3c",
      };
      new Chart(suspectCtx, {
        type: "pie",
        data: {
          labels: d.incidentsBySuspectStatus.map((s) => s.suspect_status.replace("_", " ").toUpperCase()),
          datasets: [{
            data: d.incidentsBySuspectStatus.map((s) => s.count),
            backgroundColor: d.incidentsBySuspectStatus.map((s) => statusColors[s.suspect_status] || "#95a5a6"),
            borderWidth: 2,
            borderColor: "#fff",
          }],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { position: "bottom", labels: { font: { size: 11 } } } },
        },
      });
    }
  }, []);

  const getSeverityBadge = (severity: string) => {
    const classes: Record<string, string> = {
      critical: "badge-critical",
      high: "badge-high",
      medium: "badge-medium",
      low: "badge-low",
    };
    return `badge ${classes[severity] || "bg-secondary"} text-white`;
  };

  const getSuspectBadge = (status: string) => {
    const classes: Record<string, string> = {
      unknown: "suspect-unknown",
      arrested: "suspect-arrested",
      under_investigation: "suspect-under_investigation",
      at_large: "suspect-at_large",
    };
    return `badge ${classes[status] || "bg-secondary"} text-white`;
  };

  useEffect(() => {
    // Fetch dashboard data (works without auth now)
    const token = localStorage.getItem("auth_token");
    fetch("/api/dashboard", {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })
      .then((r) => r.json())
      .then((d) => {
        setData(d);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!data || chartsInitialized.current) return;
    chartsInitialized.current = true;

    // Load Chart.js dynamically
    const script = document.createElement("script");
    script.src = "https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js";
    script.onload = () => initCharts(data);
    document.head.appendChild(script);
  }, [data, initCharts]);

  const monthChange = data
    ? data.lastMonthCount > 0
      ? Math.round(((data.thisMonthCount - data.lastMonthCount) / data.lastMonthCount) * 100)
      : data.thisMonthCount > 0 ? 100 : 0
    : 0;

  if (loading) {
    const Layout = isAuthenticated ? AppLayout : PublicLayout;
    return (
      <Layout>
        <div className="d-flex align-items-center justify-content-center" style={{ minHeight: "400px" }}>
          <div className="text-center">
            <div className="spinner-border text-primary mb-3" role="status"></div>
            <p className="text-muted">Loading dashboard...</p>
          </div>
        </div>
      </Layout>
    );
  }

  const Layout = isAuthenticated ? AppLayout : PublicLayout;

  return (
    <Layout>
      {/* Page Header */}
      <div className="d-flex align-items-center justify-content-between mb-4">
        <div>
          <h4 className="fw-bold mb-1">
            <i className="bi bi-speedometer2 me-2 text-primary"></i>
            Security Dashboard
          </h4>
          <p className="text-muted small mb-0">Ganda Ward Crime Intelligence Overview</p>
        </div>
        {isAuthenticated ? (
          <div className="d-flex gap-2">
            <Link href="/incidents/new" className="btn btn-danger btn-sm">
              <i className="bi bi-plus-circle me-1"></i>
              Report Incident
            </Link>
            <Link href="/reports" className="btn btn-outline-secondary btn-sm">
              <i className="bi bi-download me-1"></i>
              Export
            </Link>
          </div>
        ) : (
          <Link href="/login" className="btn btn-primary btn-sm">
            <i className="bi bi-box-arrow-in-right me-1"></i>
            Login to Report
          </Link>
        )}
      </div>

      {/* Notifications */}
      {data?.notifications && data.notifications.length > 0 && (
        <div className="mb-4">
          {data.notifications.slice(0, 2).map((notif) => (
            <div key={notif.id} className={`alert alert-${notif.type === "warning" ? "warning" : "info"} d-flex align-items-start py-2 mb-2`}>
              <i className="bi bi-exclamation-triangle-fill me-2 mt-1 flex-shrink-0"></i>
              <div>
                <strong className="small">{notif.title}</strong>
                <p className="mb-0 small">{notif.message}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Stats Cards */}
      <div className="row g-3 mb-4">
        <div className="col-6 col-md-3">
          <div className="card stat-card h-100">
            <div className="card-body">
              <div className="d-flex align-items-center justify-content-between mb-2">
                <div className="stat-icon bg-primary bg-opacity-10">
                  <i className="bi bi-exclamation-triangle text-primary"></i>
                </div>
                <span className="badge bg-primary bg-opacity-10 text-primary small">Total</span>
              </div>
              <h3 className="fw-bold mb-0">{data?.totalIncidents || 0}</h3>
              <p className="text-muted small mb-0">Total Incidents</p>
            </div>
          </div>
        </div>

        <div className="col-6 col-md-3">
          <div className="card stat-card h-100">
            <div className="card-body">
              <div className="d-flex align-items-center justify-content-between mb-2">
                <div className="stat-icon bg-danger bg-opacity-10">
                  <i className="bi bi-calendar-month text-danger"></i>
                </div>
                <span className={`badge ${monthChange >= 0 ? "bg-danger" : "bg-success"} bg-opacity-10 ${monthChange >= 0 ? "text-danger" : "text-success"} small`}>
                  {monthChange >= 0 ? "+" : ""}{monthChange}%
                </span>
              </div>
              <h3 className="fw-bold mb-0">{data?.thisMonthCount || 0}</h3>
              <p className="text-muted small mb-0">This Month</p>
            </div>
          </div>
        </div>

        <div className="col-6 col-md-3">
          <div className="card stat-card h-100">
            <div className="card-body">
              <div className="d-flex align-items-center justify-content-between mb-2">
                <div className="stat-icon bg-warning bg-opacity-10">
                  <i className="bi bi-search text-warning"></i>
                </div>
                <span className="badge bg-warning bg-opacity-10 text-warning small">Active</span>
              </div>
              <h3 className="fw-bold mb-0">
                {data?.incidentsByStatus?.find((s) => s.status === "under_investigation")?.count || 0}
              </h3>
              <p className="text-muted small mb-0">Under Investigation</p>
            </div>
          </div>
        </div>

        <div className="col-6 col-md-3">
          <div className="card stat-card h-100">
            <div className="card-body">
              <div className="d-flex align-items-center justify-content-between mb-2">
                <div className="stat-icon bg-success bg-opacity-10">
                  <i className="bi bi-check-circle text-success"></i>
                </div>
                <span className="badge bg-success bg-opacity-10 text-success small">Resolved</span>
              </div>
              <h3 className="fw-bold mb-0">
                {data?.incidentsBySuspectStatus?.find((s) => s.suspect_status === "arrested")?.count || 0}
              </h3>
              <p className="text-muted small mb-0">Suspects Arrested</p>
            </div>
          </div>
        </div>
      </div>

      {/* Charts Row 1 */}
      <div className="row g-3 mb-4">
        <div className="col-md-8">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-header bg-white border-0 pb-0">
              <h6 className="fw-bold mb-0">
                <i className="bi bi-bar-chart me-2 text-primary"></i>
                Incidents by Village
              </h6>
            </div>
            <div className="card-body">
              <div className="chart-container">
                <canvas id="villageChart"></canvas>
              </div>
            </div>
          </div>
        </div>

        <div className="col-md-4">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-header bg-white border-0 pb-0">
              <h6 className="fw-bold mb-0">
                <i className="bi bi-pie-chart me-2 text-danger"></i>
                Crime Types
              </h6>
            </div>
            <div className="card-body">
              <div className="chart-container">
                <canvas id="crimeTypeChart"></canvas>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Charts Row 2 */}
      <div className="row g-3 mb-4">
        <div className="col-md-8">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-header bg-white border-0 pb-0">
              <h6 className="fw-bold mb-0">
                <i className="bi bi-graph-up me-2 text-danger"></i>
                Crime Trend (Last 12 Months)
              </h6>
            </div>
            <div className="card-body">
              <div className="chart-container">
                <canvas id="trendChart"></canvas>
              </div>
            </div>
          </div>
        </div>

        <div className="col-md-4">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-header bg-white border-0 pb-0">
              <h6 className="fw-bold mb-0">
                <i className="bi bi-person-badge me-2 text-warning"></i>
                Suspect Status
              </h6>
            </div>
            <div className="card-body">
              <div className="chart-container">
                <canvas id="suspectChart"></canvas>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Row */}
      <div className="row g-3">
        {/* Recent Incidents */}
        <div className="col-md-8">
          <div className="card border-0 shadow-sm">
            <div className="card-header bg-white border-0 d-flex align-items-center justify-content-between">
              <h6 className="fw-bold mb-0">
                <i className="bi bi-clock-history me-2 text-primary"></i>
                Recent Incidents
              </h6>
              <Link href="/incidents" className="btn btn-sm btn-outline-primary">View All</Link>
            </div>
            <div className="card-body p-0">
              <div className="table-responsive">
                <table className="table table-hover mb-0">
                  <thead className="table-light">
                    <tr>
                      <th className="small fw-semibold">Incident #</th>
                      <th className="small fw-semibold">Date</th>
                      <th className="small fw-semibold">Village</th>
                      <th className="small fw-semibold">Type</th>
                      <th className="small fw-semibold">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data?.recentIncidents?.map((inc) => (
                      <tr key={inc.incident_number}>
                        <td>
                          <Link href={`/incidents?search=${inc.incident_number}`} className="text-decoration-none fw-semibold small">
                            {inc.incident_number}
                          </Link>
                        </td>
                        <td className="small text-muted">
                          {new Date(inc.date_time).toLocaleDateString("en-KE", { day: "2-digit", month: "short" })}
                        </td>
                        <td className="small">{inc.village_name}</td>
                        <td>
                          <span className={getSeverityBadge(inc.crime_severity)} style={{ fontSize: "0.7rem" }}>
                            {inc.crime_type_name}
                          </span>
                        </td>
                        <td>
                          <span className={getSuspectBadge(inc.suspect_status)} style={{ fontSize: "0.7rem" }}>
                            {inc.suspect_status.replace("_", " ")}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        {/* High Risk Villages */}
        <div className="col-md-4">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-header bg-white border-0">
              <h6 className="fw-bold mb-0">
                <i className="bi bi-geo-alt-fill me-2 text-danger"></i>
                High-Risk Villages
                <span className="badge bg-danger ms-2 small">Last 30 Days</span>
              </h6>
            </div>
            <div className="card-body">
              {data?.highRiskVillages?.length === 0 ? (
                <p className="text-muted small text-center py-3">No high-risk villages in the last 30 days</p>
              ) : (
                data?.highRiskVillages?.map((village, idx) => (
                  <div key={village.name} className="d-flex align-items-center mb-3">
                    <div
                      className={`rounded-circle d-flex align-items-center justify-content-center me-3 flex-shrink-0 ${idx === 0 ? "bg-danger" : idx === 1 ? "bg-warning" : "bg-secondary"}`}
                      style={{ width: "36px", height: "36px" }}
                    >
                      <span className="text-white fw-bold small">{idx + 1}</span>
                    </div>
                    <div className="flex-grow-1">
                      <div className="fw-semibold small">{village.name}</div>
                      <div className="progress" style={{ height: "4px" }}>
                        <div
                          className={`progress-bar ${idx === 0 ? "bg-danger" : idx === 1 ? "bg-warning" : "bg-secondary"}`}
                          style={{ width: `${(village.count / (data.highRiskVillages[0]?.count || 1)) * 100}%` }}
                        ></div>
                      </div>
                    </div>
                    <span className={`badge ms-2 ${idx === 0 ? "bg-danger" : idx === 1 ? "bg-warning" : "bg-secondary"}`}>
                      {village.count}
                    </span>
                  </div>
                ))
              )}

              <hr />
              <Link href="/map" className="btn btn-outline-primary btn-sm w-100">
                <i className="bi bi-map me-1"></i>
                View Crime Map
              </Link>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
