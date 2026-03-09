"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import AppLayout from "@/components/AppLayout";
import PublicLayout from "@/components/PublicLayout";
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
}

interface Village {
  id: number;
  name: string;
  latitude: number;
  longitude: number;
  incident_count: number;
}

type LeafletLayer = {
  addTo: (map: unknown) => LeafletLayer;
  bindPopup: (html: string) => LeafletLayer;
  bindTooltip: (text: string, opts: unknown) => LeafletLayer;
};

type LeafletLib = {
  map: (el: HTMLElement, opts: unknown) => unknown;
  tileLayer: (url: string, opts: unknown) => { addTo: (map: unknown) => void };
  circleMarker: (latlng: [number, number], opts: unknown) => LeafletLayer;
  circle: (latlng: [number, number], opts: unknown) => LeafletLayer;
};

export default function MapPage() {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<unknown>(null);
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [villages, setVillages] = useState<Village[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [leafletLoaded, setLeafletLoaded] = useState(false);
  const [isAuthenticated] = useState(() => {
    // Check auth on initial render
    if (typeof window === "undefined") return false;
    const token = localStorage.getItem("auth_token");
    const userData = localStorage.getItem("user");
    return !!token && !!userData;
  });

  const getSeverityColor = useCallback((severity: string) => {
    const colors: Record<string, string> = {
      critical: "#c0392b",
      high: "#e74c3c",
      medium: "#f39c12",
      low: "#27ae60",
    };
    return colors[severity] || "#95a5a6";
  }, []);

  const addIncidentMarkers = useCallback((
    L: LeafletLib,
    map: unknown,
    incidentList: Incident[],
    currentFilter: string
  ) => {
    const filtered = currentFilter === "all"
      ? incidentList
      : incidentList.filter((i) => i.crime_severity === currentFilter);

    filtered.forEach((incident) => {
      if (incident.latitude && incident.longitude) {
        const color = getSeverityColor(incident.crime_severity);
        const marker = L.circleMarker([incident.latitude, incident.longitude], {
          radius: 8,
          fillColor: color,
          color: "#fff",
          weight: 2,
          opacity: 1,
          fillOpacity: 0.8,
        });

        marker.addTo(map);
        marker.bindPopup(`
          <div style="min-width: 200px; font-family: sans-serif;">
            <div style="background: ${color}; color: white; padding: 8px 12px; margin: -8px -12px 8px; border-radius: 4px 4px 0 0;">
              <strong style="font-size: 0.85rem;">${incident.incident_number}</strong>
            </div>
            <p style="margin: 0 0 4px; font-size: 0.8rem;"><strong>Type:</strong> ${incident.crime_type_name}</p>
            <p style="margin: 0 0 4px; font-size: 0.8rem;"><strong>Sub-location:</strong> ${incident.village_name}</p>
            <p style="margin: 0 0 4px; font-size: 0.8rem;"><strong>Location:</strong> ${incident.location}</p>
            <p style="margin: 0 0 4px; font-size: 0.8rem;"><strong>Date:</strong> ${new Date(incident.date_time).toLocaleDateString("en-KE")}</p>
            <p style="margin: 0; font-size: 0.8rem;"><strong>Suspect:</strong> ${incident.suspect_status.replace("_", " ")}</p>
            <hr style="margin: 8px 0;">
            <p style="margin: 0; font-size: 0.75rem; color: #666;">${incident.description.slice(0, 100)}${incident.description.length > 100 ? "..." : ""}</p>
          </div>
        `);
      }
    });
  }, [getSeverityColor]);

  const initMap = useCallback(() => {
    const L = (window as unknown as { L: unknown }).L as LeafletLib;
    if (!L || !mapRef.current) return;

    // Destroy existing map
    if (mapInstanceRef.current) {
      (mapInstanceRef.current as { remove: () => void }).remove();
      mapInstanceRef.current = null;
    }

    // Center on Kijiwetanga, Ganda Ward, Kilifi County
    const map = L.map(mapRef.current, {
      center: [-3.2146, 40.0913],
      zoom: 15,
    });

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 19,
    }).addTo(map);

    mapInstanceRef.current = map;

    // Add village circles
    villages.forEach((village) => {
      if (village.latitude && village.longitude) {
        const intensity = Math.min(village.incident_count * 10, 100);
        L.circle([village.latitude, village.longitude], {
          color: `rgba(231, 76, 60, ${0.3 + intensity / 200})`,
          fillColor: `rgba(231, 76, 60, ${0.1 + intensity / 300})`,
          fillOpacity: 0.5,
          radius: 300 + village.incident_count * 50,
          weight: 1,
        })
          .addTo(map)
          .bindTooltip(`${village.name}: ${village.incident_count} incidents`, {
            permanent: false,
            direction: "top",
          });
      }
    });

    // Add incident markers
    addIncidentMarkers(L, map, incidents, filter);
  }, [villages, incidents, filter, addIncidentMarkers]);

  useEffect(() => {
    // Fetch data (works without auth now)
    Promise.all([
      fetch("/api/incidents?limit=200").then((r) => r.json()),
      fetch("/api/villages").then((r) => r.json()),
    ]).then(([inc, vil]) => {
      setIncidents(inc.incidents || []);
      setVillages(vil.villages || []);
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    if (loading) return;

    if (!(window as unknown as { L?: unknown }).L) {
      // Load Leaflet
      const script = document.createElement("script");
      script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
      script.onload = () => setLeafletLoaded(true);
      document.head.appendChild(script);
    } else {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setLeafletLoaded(true);
    }
  }, [loading]);

  useEffect(() => {
    if (!leafletLoaded || loading) return;
    initMap();
  }, [leafletLoaded, incidents, filter, initMap, loading]);

  const filteredCount = filter === "all"
    ? incidents.filter((i) => i.latitude && i.longitude).length
    : incidents.filter((i) => i.crime_severity === filter && i.latitude && i.longitude).length;

  const Layout = isAuthenticated ? AppLayout : PublicLayout;

  return (
    <Layout>
      <div className="d-flex align-items-center justify-content-between mb-4">
        <div>
          <h4 className="fw-bold mb-1">
            <i className="bi bi-map me-2 text-success"></i>
            Crime Incident Map
          </h4>
          <p className="text-muted small mb-0">
            Showing {filteredCount} incidents on map · Ganda Ward, Kilifi County
          </p>
        </div>
        {!isAuthenticated && (
          <Link href="/login" className="btn btn-primary btn-sm">
            <i className="bi bi-box-arrow-in-right me-1"></i>
            Login to Report
          </Link>
        )}
      </div>

      {/* Filter Controls */}
      <div className="card border-0 shadow-sm mb-4">
        <div className="card-body py-2">
          <div className="d-flex align-items-center gap-3 flex-wrap">
            <span className="small fw-semibold text-muted">Filter by Severity:</span>
            {[
              { value: "all", label: "All Incidents", color: "secondary" },
              { value: "critical", label: "Critical", color: "danger" },
              { value: "high", label: "High", color: "danger" },
              { value: "medium", label: "Medium", color: "warning" },
              { value: "low", label: "Low", color: "success" },
            ].map((f) => (
              <button
                key={f.value}
                className={`btn btn-sm ${filter === f.value ? `btn-${f.color}` : `btn-outline-${f.color}`}`}
                onClick={() => setFilter(f.value)}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="row g-4">
        {/* Map */}
        <div className="col-md-9">
          <div className="card border-0 shadow-sm">
            <div className="card-body p-2">
              {loading ? (
                <div className="d-flex align-items-center justify-content-center" style={{ height: "500px" }}>
                  <div className="text-center">
                    <div className="spinner-border text-primary mb-2" role="status"></div>
                    <p className="text-muted small">Loading map...</p>
                  </div>
                </div>
              ) : (
                <div ref={mapRef} id="incident-map"></div>
              )}
            </div>
          </div>
        </div>

        {/* Legend & Stats */}
        <div className="col-md-3">
          <div className="card border-0 shadow-sm mb-4">
            <div className="card-header bg-white border-0">
              <h6 className="fw-bold mb-0">Map Legend</h6>
            </div>
            <div className="card-body">
              <div className="d-flex flex-column gap-2">
                {[
                  { color: "#c0392b", label: "Critical Severity" },
                  { color: "#e74c3c", label: "High Severity" },
                  { color: "#f39c12", label: "Medium Severity" },
                  { color: "#27ae60", label: "Low Severity" },
                ].map((item) => (
                  <div key={item.label} className="d-flex align-items-center gap-2">
                    <div
                      className="rounded-circle flex-shrink-0"
                      style={{ width: "14px", height: "14px", backgroundColor: item.color, border: "2px solid white", boxShadow: "0 0 0 1px #ccc" }}
                    ></div>
                    <span className="small">{item.label}</span>
                  </div>
                ))}
                <hr className="my-1" />
                <div className="d-flex align-items-center gap-2">
                  <div
                    className="rounded-circle flex-shrink-0"
                    style={{ width: "20px", height: "20px", backgroundColor: "rgba(231,76,60,0.3)", border: "1px solid rgba(231,76,60,0.5)" }}
                  ></div>
                  <span className="small">Sub-location Risk Zone</span>
                </div>
              </div>
            </div>
          </div>

          {/* Village Stats */}
          <div className="card border-0 shadow-sm">
            <div className="card-header bg-white border-0">
              <h6 className="fw-bold mb-0">Sub-location Incident Count</h6>
            </div>
            <div className="card-body p-0">
              <div className="list-group list-group-flush">
                {villages
                  .sort((a, b) => b.incident_count - a.incident_count)
                  .map((village) => (
                    <div key={village.id} className="list-group-item d-flex align-items-center justify-content-between py-2">
                      <span className="small">{village.name}</span>
                      <span className={`badge ${village.incident_count >= 5 ? "bg-danger" : village.incident_count >= 3 ? "bg-warning" : "bg-success"}`}>
                        {village.incident_count}
                      </span>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
