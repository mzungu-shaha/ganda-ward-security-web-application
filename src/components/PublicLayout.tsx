"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

interface PublicLayoutProps {
  children: React.ReactNode;
}

export default function PublicLayout({ children }: PublicLayoutProps) {
  const pathname = usePathname();
  
  const isActive = (path: string) => pathname === path ? "active" : "";

  return (
    <div className="public-layout">
      {/* Public Header */}
      <nav className="navbar navbar-expand-lg navbar-dark bg-dark">
        <div className="container">
          <Link href="/" className="navbar-brand d-flex align-items-center">
            <i className="bi bi-shield-fill-check me-2"></i>
            <span>Ganda Ward Security</span>
          </Link>
          <button
            className="navbar-toggler"
            type="button"
            data-bs-toggle="collapse"
            data-bs-target="#navbarNav"
          >
            <span className="navbar-toggler-icon"></span>
          </button>
          <div className="collapse navbar-collapse" id="navbarNav">
            <ul className="navbar-nav ms-auto">
              <li className="nav-item">
                <Link href="/dashboard" className={`nav-link ${isActive("/dashboard")}`}>
                  <i className="bi bi-speedometer2 me-1"></i>
                  Dashboard
                </Link>
              </li>
              <li className="nav-item">
                <Link href="/map" className={`nav-link ${isActive("/map")}`}>
                  <i className="bi bi-map me-1"></i>
                  Crime Map
                </Link>
              </li>
              <li className="nav-item">
                <Link href="/villages" className={`nav-link ${isActive("/villages")}`}>
                  <i className="bi bi-houses me-1"></i>
                  Sub-locations
                </Link>
              </li>
              <li className="nav-item">
                <Link href="/login" className="nav-link btn btn-primary btn-sm ms-lg-2">
                  <i className="bi bi-box-arrow-in-right me-1"></i>
                  Login
                </Link>
              </li>
            </ul>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="py-4">
        {children}
      </main>

      {/* Public Footer */}
      <footer className="bg-dark text-light py-4 mt-auto">
        <div className="container">
          <div className="row">
            <div className="col-md-6">
              <h6>Ganda Ward Security Information System</h6>
              <p className="small text-muted mb-0">
                Community-driven crime tracking and safety awareness for Ganda Ward, Kilifi County, Kenya.
              </p>
            </div>
            <div className="col-md-6 text-md-end">
              <p className="small text-muted mb-0">
                Emergency: 999 | Kilifi Police: +254 700 000 000
              </p>
              <p className="small text-muted">
                © 2024 Ganda Ward Security
              </p>
            </div>
          </div>
        </div>
      </footer>

      <style jsx global>{`
        .public-layout {
          min-height: 100vh;
          display: flex;
          flex-direction: column;
        }
        .public-layout main {
          flex: 1;
        }
        .navbar .nav-link.active {
          color: #fff !important;
          background-color: rgba(255,255,255,0.1);
          border-radius: 4px;
        }
        .navbar .nav-link:hover {
          color: #fff !important;
          background-color: rgba(255,255,255,0.05);
          border-radius: 4px;
        }
      `}</style>
    </div>
  );
}
