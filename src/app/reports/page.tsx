"use client";
import { useState, useEffect } from "react";
import AppLayout from "@/components/AppLayout";

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
  victims_count: number;
}

interface DashboardData {
  totalIncidents: number;
  incidentsByCrimeType: Array<{ name: string; count: number; severity: string }>;
  incidentsByVillage: Array<{ name: string; count: number }>;
  thisMonthCount: number;
  lastMonthCount: number;
}

export default function ReportsPage() {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [dashData, setDashData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [reportType, setReportType] = useState("monthly");
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));
  const [selectedQuarter, setSelectedQuarter] = useState(`${new Date().getFullYear()}-Q${Math.ceil((new Date().getMonth() + 1) / 3)}`);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("auth_token");
    const headers = { Authorization: `Bearer ${token}` };

    Promise.all([
      fetch("/api/incidents?limit=500", { headers }).then((r) => r.json()),
      fetch("/api/dashboard", { headers }).then((r) => r.json()),
    ]).then(([inc, dash]) => {
      setIncidents(inc.incidents || []);
      setDashData(dash);
      setLoading(false);
    });
  }, []);

  const getFilteredIncidents = () => {
    if (reportType === "monthly") {
      return incidents.filter((i) => i.date_time.startsWith(selectedMonth));
    } else if (reportType === "quarterly") {
      const [year, q] = selectedQuarter.split("-Q");
      const quarterNum = parseInt(q);
      const startMonth = (quarterNum - 1) * 3 + 1;
      const endMonth = quarterNum * 3;
      return incidents.filter((i) => {
        const month = new Date(i.date_time).getMonth() + 1;
        const incYear = new Date(i.date_time).getFullYear();
        return incYear === parseInt(year) && month >= startMonth && month <= endMonth;
      });
    }
    return incidents;
  };

  const exportCSV = (data: Incident[], filename: string) => {
    const headers = [
      "Incident #", "Date/Time", "Sub-location", "Crime Type", "Severity",
      "Location", "Description", "Suspect Status", "Officer", "Case Status", "Victims"
    ];
    const rows = data.map((i) => [
      i.incident_number,
      new Date(i.date_time).toLocaleString("en-KE"),
      i.village_name,
      i.crime_type_name,
      i.crime_severity,
      i.location,
      i.description.replace(/"/g, '""'),
      i.suspect_status.replace("_", " "),
      i.officer_name || "N/A",
      i.status.replace("_", " "),
      String(i.victims_count || 0),
    ]);
    const csv = [headers, ...rows].map((r) => r.map((c) => `"${c}"`).join(",")).join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const generatePDFReport = async () => {
    setGenerating(true);
    const filteredData = getFilteredIncidents();

    try {
      // Dynamic import of jsPDF
      const { default: jsPDF } = await import("jspdf");
      const { default: autoTable } = await import("jspdf-autotable");

      const doc = new jsPDF({ orientation: "landscape" });

      // Header
      doc.setFillColor(26, 58, 92);
      doc.rect(0, 0, 297, 30, "F");
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(16);
      doc.setFont("helvetica", "bold");
      doc.text("GANDA WARD SECURITY INFORMATION SYSTEM", 148.5, 12, { align: "center" });
      doc.setFontSize(11);
      doc.setFont("helvetica", "normal");
      doc.text(`Crime Incident Report - ${reportType === "monthly" ? selectedMonth : selectedQuarter}`, 148.5, 22, { align: "center" });

      // Summary stats
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(10);
      doc.setFont("helvetica", "bold");
      doc.text("REPORT SUMMARY", 14, 40);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);

      const summaryData = [
        ["Total Incidents", String(filteredData.length)],
        ["Arrested", String(filteredData.filter((i) => i.suspect_status === "arrested").length)],
        ["Under Investigation", String(filteredData.filter((i) => i.suspect_status === "under_investigation").length)],
        ["Unknown Suspects", String(filteredData.filter((i) => i.suspect_status === "unknown").length)],
        ["Total Victims", String(filteredData.reduce((sum, i) => sum + (i.victims_count || 0), 0))],
        ["Generated", new Date().toLocaleString("en-KE")],
      ];

      autoTable(doc, {
        startY: 44,
        head: [["Metric", "Value"]],
        body: summaryData,
        theme: "grid",
        headStyles: { fillColor: [26, 58, 92], textColor: 255, fontSize: 8 },
        bodyStyles: { fontSize: 8 },
        columnStyles: { 0: { fontStyle: "bold" } },
        tableWidth: 80,
        margin: { left: 14 },
      });

      // Crime by village
      const villageStats: Record<string, number> = {};
      filteredData.forEach((i) => {
        villageStats[i.village_name] = (villageStats[i.village_name] || 0) + 1;
      });
      const villageData = Object.entries(villageStats)
        .sort((a, b) => b[1] - a[1])
        .map(([name, count]) => [name, String(count)]);

      autoTable(doc, {
        startY: 44,
        head: [["Sub-location", "Incidents"]],
        body: villageData,
        theme: "grid",
        headStyles: { fillColor: [26, 58, 92], textColor: 255, fontSize: 8 },
        bodyStyles: { fontSize: 8 },
        tableWidth: 60,
        margin: { left: 110 },
      });

      // Crime by type
      const typeStats: Record<string, number> = {};
      filteredData.forEach((i) => {
        typeStats[i.crime_type_name] = (typeStats[i.crime_type_name] || 0) + 1;
      });
      const typeData = Object.entries(typeStats)
        .sort((a, b) => b[1] - a[1])
        .map(([name, count]) => [name, String(count)]);

      autoTable(doc, {
        startY: 44,
        head: [["Crime Type", "Count"]],
        body: typeData,
        theme: "grid",
        headStyles: { fillColor: [26, 58, 92], textColor: 255, fontSize: 8 },
        bodyStyles: { fontSize: 8 },
        tableWidth: 70,
        margin: { left: 220 },
      });

      // Main incidents table
      const lastY = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable?.finalY || 100;
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.text("INCIDENT DETAILS", 14, lastY + 10);

      autoTable(doc, {
        startY: lastY + 14,
        head: [["Incident #", "Date", "Sub-location", "Crime Type", "Location", "Suspect Status", "Officer", "Status"]],
        body: filteredData.map((i) => [
          i.incident_number,
          new Date(i.date_time).toLocaleDateString("en-KE"),
          i.village_name,
          i.crime_type_name,
          i.location.slice(0, 30),
          i.suspect_status.replace("_", " "),
          i.officer_name || "N/A",
          i.status.replace("_", " "),
        ]),
        theme: "striped",
        headStyles: { fillColor: [26, 58, 92], textColor: 255, fontSize: 7 },
        bodyStyles: { fontSize: 7 },
        alternateRowStyles: { fillColor: [245, 247, 250] },
      });

      // Footer
      const pageCount = doc.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(7);
        doc.setTextColor(150);
        doc.text(
          `Ganda Ward Security Information System · Kilifi County, Kenya · Page ${i} of ${pageCount}`,
          148.5,
          doc.internal.pageSize.height - 5,
          { align: "center" }
        );
      }

      const filename = `ganda-ward-report-${reportType === "monthly" ? selectedMonth : selectedQuarter}.pdf`;
      doc.save(filename);
    } catch (err) {
      console.error("PDF generation error:", err);
      alert("Failed to generate PDF. Please try CSV export instead.");
    } finally {
      setGenerating(false);
    }
  };

  const filteredData = getFilteredIncidents();

  const getSeverityBadge = (severity: string) => {
    const classes: Record<string, string> = {
      critical: "badge-critical", high: "badge-high", medium: "badge-medium", low: "badge-low",
    };
    return `badge ${classes[severity] || "bg-secondary"} text-white`;
  };

  // Stats for filtered data
  const stats = {
    total: filteredData.length,
    arrested: filteredData.filter((i) => i.suspect_status === "arrested").length,
    underInvestigation: filteredData.filter((i) => i.suspect_status === "under_investigation").length,
    unknown: filteredData.filter((i) => i.suspect_status === "unknown").length,
    totalVictims: filteredData.reduce((sum, i) => sum + (i.victims_count || 0), 0),
  };

  const crimeTypeStats = filteredData.reduce((acc, i) => {
    acc[i.crime_type_name] = (acc[i.crime_type_name] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const villageStats = filteredData.reduce((acc, i) => {
    acc[i.village_name] = (acc[i.village_name] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <AppLayout>
      <div className="d-flex align-items-center justify-content-between mb-4">
        <div>
          <h4 className="fw-bold mb-1">
            <i className="bi bi-file-earmark-bar-graph me-2 text-primary"></i>
            Security Reports
          </h4>
          <p className="text-muted small mb-0">Generate and export crime incident reports</p>
        </div>
      </div>

      {/* Report Configuration */}
      <div className="card border-0 shadow-sm mb-4">
        <div className="card-header bg-white border-0">
          <h6 className="fw-bold mb-0">
            <i className="bi bi-gear me-2"></i>Report Configuration
          </h6>
        </div>
        <div className="card-body">
          <div className="row g-3 align-items-end">
            <div className="col-md-3">
              <label className="form-label fw-semibold small">Report Type</label>
              <select
                className="form-select"
                value={reportType}
                onChange={(e) => setReportType(e.target.value)}
              >
                <option value="monthly">Monthly Report</option>
                <option value="quarterly">Quarterly Report</option>
                <option value="all">All Incidents</option>
              </select>
            </div>

            {reportType === "monthly" && (
              <div className="col-md-3">
                <label className="form-label fw-semibold small">Select Month</label>
                <input
                  type="month"
                  className="form-control"
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                />
              </div>
            )}

            {reportType === "quarterly" && (
              <div className="col-md-3">
                <label className="form-label fw-semibold small">Select Quarter</label>
                <select
                  className="form-select"
                  value={selectedQuarter}
                  onChange={(e) => setSelectedQuarter(e.target.value)}
                >
                  {[2024, 2025, 2026].flatMap((year) =>
                    [1, 2, 3, 4].map((q) => (
                      <option key={`${year}-Q${q}`} value={`${year}-Q${q}`}>
                        {year} Q{q} (
                        {["Jan-Mar", "Apr-Jun", "Jul-Sep", "Oct-Dec"][q - 1]})
                      </option>
                    ))
                  )}
                </select>
              </div>
            )}

            <div className="col-md-6">
              <div className="d-flex gap-2">
                <button
                  className="btn btn-danger"
                  onClick={generatePDFReport}
                  disabled={generating || loading || filteredData.length === 0}
                >
                  {generating ? (
                    <><span className="spinner-border spinner-border-sm me-2"></span>Generating...</>
                  ) : (
                    <><i className="bi bi-file-pdf me-2"></i>Export PDF</>
                  )}
                </button>
                <button
                  className="btn btn-success"
                  onClick={() => exportCSV(filteredData, `ganda-ward-${reportType}-${selectedMonth || selectedQuarter}.csv`)}
                  disabled={loading || filteredData.length === 0}
                >
                  <i className="bi bi-file-spreadsheet me-2"></i>Export CSV
                </button>
                <button
                  className="btn btn-outline-secondary"
                  onClick={() => window.print()}
                >
                  <i className="bi bi-printer me-2"></i>Print
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status"></div>
          <p className="text-muted mt-2">Loading report data...</p>
        </div>
      ) : (
        <>
          {/* Summary Stats */}
          <div className="row g-3 mb-4">
            {[
              { label: "Total Incidents", value: stats.total, icon: "bi-exclamation-triangle", color: "primary" },
              { label: "Suspects Arrested", value: stats.arrested, icon: "bi-person-check", color: "success" },
              { label: "Under Investigation", value: stats.underInvestigation, icon: "bi-search", color: "warning" },
              { label: "Unknown Suspects", value: stats.unknown, icon: "bi-question-circle", color: "secondary" },
              { label: "Total Victims", value: stats.totalVictims, icon: "bi-people", color: "danger" },
            ].map((stat) => (
              <div key={stat.label} className="col-6 col-md">
                <div className="card border-0 shadow-sm text-center">
                  <div className="card-body py-3">
                    <i className={`bi ${stat.icon} text-${stat.color} mb-1`} style={{ fontSize: "1.5rem" }}></i>
                    <h4 className="fw-bold mb-0">{stat.value}</h4>
                    <p className="text-muted small mb-0">{stat.label}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="row g-4 mb-4">
            {/* Crime by Type */}
            <div className="col-md-6">
              <div className="card border-0 shadow-sm">
                <div className="card-header bg-white border-0">
                  <h6 className="fw-bold mb-0">Incidents by Crime Type</h6>
                </div>
                <div className="card-body p-0">
                  <table className="table table-sm mb-0">
                    <thead className="table-light">
                      <tr>
                        <th className="small">Crime Type</th>
                        <th className="small text-end">Count</th>
                        <th className="small text-end">%</th>
                      </tr>
                    </thead>
                    <tbody>
                      {Object.entries(crimeTypeStats)
                        .sort((a, b) => b[1] - a[1])
                        .map(([type, count]) => (
                          <tr key={type}>
                            <td className="small">{type}</td>
                            <td className="small text-end fw-semibold">{count}</td>
                            <td className="small text-end text-muted">
                              {stats.total > 0 ? Math.round((count / stats.total) * 100) : 0}%
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Crime by Village */}
            <div className="col-md-6">
              <div className="card border-0 shadow-sm">
                <div className="card-header bg-white border-0">
                  <h6 className="fw-bold mb-0">Incidents by Sub-location</h6>
                </div>
                <div className="card-body p-0">
                  <table className="table table-sm mb-0">
                    <thead className="table-light">
                      <tr>
                        <th className="small">Sub-location</th>
                        <th className="small text-end">Count</th>
                        <th className="small text-end">%</th>
                      </tr>
                    </thead>
                    <tbody>
                      {Object.entries(villageStats)
                        .sort((a, b) => b[1] - a[1])
                        .map(([village, count]) => (
                          <tr key={village}>
                            <td className="small">{village}</td>
                            <td className="small text-end fw-semibold">{count}</td>
                            <td className="small text-end text-muted">
                              {stats.total > 0 ? Math.round((count / stats.total) * 100) : 0}%
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>

          {/* Incidents Table */}
          <div className="card border-0 shadow-sm">
            <div className="card-header bg-white border-0 d-flex align-items-center justify-content-between">
              <h6 className="fw-bold mb-0">
                Incident Details ({filteredData.length} records)
              </h6>
            </div>
            <div className="card-body p-0">
              {filteredData.length === 0 ? (
                <div className="text-center py-5">
                  <i className="bi bi-inbox text-muted" style={{ fontSize: "2rem" }}></i>
                  <p className="text-muted mt-2">No incidents found for the selected period</p>
                </div>
              ) : (
                <div className="table-responsive">
                  <table className="table table-hover table-sm mb-0">
                    <thead className="table-light">
                      <tr>
                        <th className="small fw-semibold">Incident #</th>
                        <th className="small fw-semibold">Date</th>
                        <th className="small fw-semibold">Sub-location</th>
                        <th className="small fw-semibold">Crime Type</th>
                        <th className="small fw-semibold">Location</th>
                        <th className="small fw-semibold">Suspect</th>
                        <th className="small fw-semibold">Officer</th>
                        <th className="small fw-semibold">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredData.map((inc) => (
                        <tr key={inc.id}>
                          <td className="small fw-semibold text-primary">{inc.incident_number}</td>
                          <td className="small text-muted">
                            {new Date(inc.date_time).toLocaleDateString("en-KE", { day: "2-digit", month: "short", year: "numeric" })}
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
                          <td className="small">{inc.suspect_status.replace("_", " ")}</td>
                          <td className="small">{inc.officer_name || "N/A"}</td>
                          <td className="small">{inc.status.replace("_", " ")}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </AppLayout>
  );
}
