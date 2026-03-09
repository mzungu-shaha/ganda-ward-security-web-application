"use client";
import { useState, useEffect, useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";

interface User {
  id: number;
  username: string;
  full_name: string;
  role: string;
  email: string;
}

interface AppLayoutProps {
  children: React.ReactNode;
}

export default function AppLayout({ children }: AppLayoutProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<User | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notifications, setNotifications] = useState<number>(0);

  const checkAuth = useCallback(() => {
    const token = localStorage.getItem("auth_token");
    const userData = localStorage.getItem("user");
    if (!token || !userData) {
      router.replace("/login");
      return;
    }
    setUser(JSON.parse(userData));
  }, [router]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    checkAuth();
    // Fetch notification count
    const token = localStorage.getItem("auth_token");
    if (token) {
      fetch("/api/dashboard", {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((r) => r.json())
        .then((data) => {
          if (data.notifications) {
            setNotifications(data.notifications.length);
          }
        })
        .catch(() => {});
    }
  }, [checkAuth]);

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    localStorage.removeItem("auth_token");
    localStorage.removeItem("user");
    router.replace("/login");
  };

  const navItems = [
    { href: "/dashboard", icon: "bi-speedometer2", label: "Dashboard", roles: ["admin", "police_officer", "village_elder", "viewer"] },
    { href: "/incidents", icon: "bi-exclamation-triangle", label: "Incidents", roles: ["admin", "police_officer", "village_elder", "viewer"] },
    { href: "/incidents/new", icon: "bi-plus-circle", label: "Report Incident", roles: ["admin", "police_officer"] },
    { href: "/map", icon: "bi-map", label: "Crime Map", roles: ["admin", "police_officer", "village_elder", "viewer"] },
    { href: "/reports", icon: "bi-file-earmark-bar-graph", label: "Reports", roles: ["admin", "police_officer", "village_elder"] },
    { href: "/villages", icon: "bi-houses", label: "Villages", roles: ["admin", "police_officer", "village_elder", "viewer"] },
    { href: "/users", icon: "bi-people", label: "Users", roles: ["admin"] },
  ];

  const getRoleBadge = (role: string) => {
    const badges: Record<string, string> = {
      admin: "danger",
      police_officer: "primary",
      village_elder: "success",
      viewer: "secondary",
    };
    return badges[role] || "secondary";
  };

  const getRoleLabel = (role: string) => {
    const labels: Record<string, string> = {
      admin: "Administrator",
      police_officer: "Police Officer",
      village_elder: "Village Elder",
      viewer: "Viewer",
    };
    return labels[role] || role;
  };

  if (!user) {
    return (
      <div className="d-flex align-items-center justify-content-center min-vh-100">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Sidebar Overlay (mobile) */}
      <div
        className={`sidebar-overlay ${sidebarOpen ? "show" : ""}`}
        onClick={() => setSidebarOpen(false)}
      />

      {/* Sidebar */}
      <nav className={`sidebar ${sidebarOpen ? "show" : ""}`}>
        <div className="sidebar-brand">
          <div className="badge-icon">
            <i className="bi bi-shield-fill-check text-white" style={{ fontSize: "1.2rem" }}></i>
          </div>
          <h5 className="mb-0">Ganda Ward Security</h5>
          <small style={{ color: "rgba(255,255,255,0.5)", fontSize: "0.75rem" }}>
            Information System
          </small>
        </div>

        {/* User info */}
        <div className="px-3 py-3 border-bottom" style={{ borderColor: "rgba(255,255,255,0.1) !important" }}>
          <div className="d-flex align-items-center">
            <div
              className="rounded-circle bg-secondary d-flex align-items-center justify-content-center me-2 flex-shrink-0"
              style={{ width: "36px", height: "36px" }}
            >
              <i className="bi bi-person-fill text-white small"></i>
            </div>
            <div className="overflow-hidden">
              <div className="text-white small fw-semibold text-truncate">{user.full_name}</div>
              <span className={`badge bg-${getRoleBadge(user.role)}`} style={{ fontSize: "0.65rem" }}>
                {getRoleLabel(user.role)}
              </span>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <div className="py-2">
          <div className="sidebar-section-title">Navigation</div>
          <ul className="nav flex-column">
            {navItems
              .filter((item) => item.roles.includes(user.role))
              .map((item) => (
                <li key={item.href} className="nav-item">
                  <Link
                    href={item.href}
                    className={`nav-link ${pathname === item.href ? "active" : ""}`}
                    onClick={() => setSidebarOpen(false)}
                  >
                    <i className={`bi ${item.icon}`}></i>
                    {item.label}
                    {item.href === "/dashboard" && notifications > 0 && (
                      <span className="badge bg-danger ms-auto" style={{ fontSize: "0.65rem" }}>
                        {notifications}
                      </span>
                    )}
                  </Link>
                </li>
              ))}
          </ul>

          <div className="sidebar-section-title mt-2">Account</div>
          <ul className="nav flex-column">
            <li className="nav-item">
              <button
                className="nav-link w-100 text-start border-0 bg-transparent"
                onClick={handleLogout}
              >
                <i className="bi bi-box-arrow-left"></i>
                Sign Out
              </button>
            </li>
          </ul>
        </div>
      </nav>

      {/* Main Content */}
      <div className="main-content">
        {/* Top Navbar */}
        <div className="top-navbar d-flex align-items-center justify-content-between">
          <div className="d-flex align-items-center">
            <button
              className="btn btn-sm btn-outline-secondary d-md-none me-2"
              onClick={() => setSidebarOpen(!sidebarOpen)}
            >
              <i className="bi bi-list"></i>
            </button>
            <nav aria-label="breadcrumb" className="d-none d-md-block">
              <ol className="breadcrumb mb-0 small">
                <li className="breadcrumb-item">
                  <Link href="/dashboard" className="text-decoration-none">Home</Link>
                </li>
                <li className="breadcrumb-item active text-capitalize">
                  {pathname.split("/")[1] || "Dashboard"}
                </li>
              </ol>
            </nav>
          </div>

          <div className="d-flex align-items-center gap-2">
            <div className="position-relative">
              <Link href="/dashboard" className="btn btn-sm btn-outline-secondary position-relative">
                <i className="bi bi-bell"></i>
                {notifications > 0 && (
                  <span className="notification-badge">{notifications}</span>
                )}
              </Link>
            </div>
            <div className="dropdown">
              <button
                className="btn btn-sm btn-outline-secondary dropdown-toggle d-flex align-items-center gap-1"
                data-bs-toggle="dropdown"
              >
                <i className="bi bi-person-circle"></i>
                <span className="d-none d-sm-inline">{user.full_name.split(" ")[0]}</span>
              </button>
              <ul className="dropdown-menu dropdown-menu-end">
                <li>
                  <span className="dropdown-item-text small text-muted">
                    {user.email}
                  </span>
                </li>
                <li><hr className="dropdown-divider" /></li>
                <li>
                  <button className="dropdown-item text-danger" onClick={handleLogout}>
                    <i className="bi bi-box-arrow-left me-2"></i>Sign Out
                  </button>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Page Content */}
        <div className="p-3 p-md-4">
          {children}
        </div>
      </div>
    </>
  );
}
