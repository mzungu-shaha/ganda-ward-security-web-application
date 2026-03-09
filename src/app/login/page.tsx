"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    // Check if already logged in
    const token = localStorage.getItem("auth_token");
    if (token) {
      router.replace("/dashboard");
    }
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: username.trim(), password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Login failed");
        return;
      }

      localStorage.setItem("auth_token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));
      router.replace("/dashboard");
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page d-flex align-items-center justify-content-center p-3">
      <div className="w-100" style={{ maxWidth: "420px" }}>
        {/* Header */}
        <div className="text-center mb-4">
          <div className="d-inline-flex align-items-center justify-content-center bg-danger rounded-circle mb-3"
            style={{ width: "72px", height: "72px" }}>
            <i className="bi bi-shield-fill-check text-white" style={{ fontSize: "2rem" }}></i>
          </div>
          <h2 className="text-white fw-bold mb-1">Ganda Ward Security</h2>
          <p className="text-white-50 mb-0">Information System</p>
          <small className="text-white-50">Kilifi County, Kenya</small>
        </div>

        {/* Login Card */}
        <div className="card login-card">
          <div className="card-body p-4">
            <h5 className="card-title fw-bold mb-1">Sign In</h5>
            <p className="text-muted small mb-4">Enter your credentials to access the system</p>

            {error && (
              <div className="alert alert-danger d-flex align-items-center py-2" role="alert">
                <i className="bi bi-exclamation-triangle-fill me-2"></i>
                <small>{error}</small>
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div className="mb-3">
                <label className="form-label fw-semibold small">Username</label>
                <div className="input-group">
                  <span className="input-group-text bg-light border-end-0">
                    <i className="bi bi-person text-muted"></i>
                  </span>
                  <input
                    type="text"
                    className="form-control border-start-0"
                    placeholder="Enter username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                    autoComplete="username"
                    maxLength={50}
                  />
                </div>
              </div>

              <div className="mb-4">
                <label className="form-label fw-semibold small">Password</label>
                <div className="input-group">
                  <span className="input-group-text bg-light border-end-0">
                    <i className="bi bi-lock text-muted"></i>
                  </span>
                  <input
                    type={showPassword ? "text" : "password"}
                    className="form-control border-start-0 border-end-0"
                    placeholder="Enter password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    autoComplete="current-password"
                    maxLength={100}
                  />
                  <button
                    type="button"
                    className="input-group-text bg-light"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    <i className={`bi ${showPassword ? "bi-eye-slash" : "bi-eye"} text-muted`}></i>
                  </button>
                </div>
              </div>

              <button
                type="submit"
                className="btn btn-primary w-100 py-2 fw-semibold"
                disabled={loading}
                style={{ backgroundColor: "var(--primary-color)", borderColor: "var(--primary-color)" }}
              >
                {loading ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                    Signing in...
                  </>
                ) : (
                  <>
                    <i className="bi bi-box-arrow-in-right me-2"></i>
                    Sign In
                  </>
                )}
              </button>
            </form>
          </div>
        </div>

        {/* Demo credentials */}
        <div className="card mt-3 border-0 bg-white bg-opacity-10">
          <div className="card-body p-3">
            <p className="text-white-50 small fw-semibold mb-2">
              <i className="bi bi-info-circle me-1"></i>Demo Credentials:
            </p>
            <div className="row g-2">
              {[
                { role: "Admin", user: "admin", pass: "admin123" },
                { role: "Officer", user: "officer_kamau", pass: "officer123" },
                { role: "Elder", user: "elder_wanjiku", pass: "elder123" },
                { role: "Viewer", user: "viewer1", pass: "viewer123" },
              ].map((cred) => (
                <div key={cred.role} className="col-6">
                  <button
                    type="button"
                    className="btn btn-sm btn-outline-light w-100 text-start py-1 px-2"
                    onClick={() => { setUsername(cred.user); setPassword(cred.pass); }}
                    style={{ fontSize: "0.75rem" }}
                  >
                    <strong>{cred.role}:</strong> {cred.user}
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        <p className="text-center text-white-50 small mt-3">
          © 2024 Ganda Ward Administration · Kilifi County
        </p>
      </div>
    </div>
  );
}
