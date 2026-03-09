"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();
  
  useEffect(() => {
    // Redirect to dashboard (publicly accessible) or login based on auth status
    const token = localStorage.getItem("auth_token");
    const userData = localStorage.getItem("user");
    
    if (token && userData) {
      router.replace("/dashboard");
    } else {
      router.replace("/dashboard");
    }
  }, [router]);

  return (
    <div className="d-flex align-items-center justify-content-center min-vh-100">
      <div className="spinner-border text-primary" role="status">
        <span className="visually-hidden">Loading...</span>
      </div>
    </div>
  );
}
