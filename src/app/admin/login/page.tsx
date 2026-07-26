"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Globe } from "lucide-react";

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  // Redirect if already authenticated
  useEffect(() => {
    // 1. Check admin specific session
    const isAdminAuth = window.sessionStorage.getItem("divingsanatan_admin_auth");
    
    // 2. Check general user session from frontend
    let isUserAuth = false;
    const userSessionStr = window.localStorage.getItem("divingsanatan_user_session");
    if (userSessionStr) {
      try {
        const userObj = JSON.parse(userSessionStr);
        if (["admin", "super_admin", "guru"].includes(userObj.role)) {
          isUserAuth = true;
        }
      } catch (e) {}
    }

    if (isAdminAuth === "true" || isUserAuth) {
      router.push("/admin");
    }
  }, [router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
      });
      const json = await res.json();
      
      if (json.success) {
        if (["admin", "super_admin", "guru"].includes(json.data.role)) {
          window.sessionStorage.setItem("divingsanatan_admin_auth", "true");
          window.sessionStorage.setItem("divingsanatan_admin_user", JSON.stringify(json.data));
          setError("");
          router.push("/admin");
        } else {
          setError("Unauthorized access. You do not have admin privileges.");
        }
      } else {
        setError(json.error || "Login failed.");
      }
    } catch (err) {
      setError("Server connection failed. Please try again.");
    }
  };

  return (
    <div className="login-page">
      <div className="login-box">
        <div className="login-logo">
          <Link href="/">
            <b>Diving</b> Sanatan
          </Link>
        </div>
        
        <div className="card card-outline card-primary">
          <div className="card-body login-card-body">
            <p className="login-box-msg">Sign in to start your administrator session</p>

            <form onSubmit={handleLogin}>
              <div className="form-group mb-3">
                <label style={{ fontWeight: "600", fontSize: "0.85rem" }}>Email</label>
                <input
                  type="email"
                  className="form-control"
                  required
                  placeholder="Admin Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div className="form-group mb-3">
                <label style={{ fontWeight: "600", fontSize: "0.85rem" }}>Password</label>
                <input
                  type="password"
                  className="form-control"
                  required
                  placeholder="Password Passcode"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>

              {error && (
                <div className="error-alert">
                  {error}
                </div>
              )}

              <div className="row">
                <button type="submit" className="btn btn-primary btn-block">
                  Unlock Panel
                </button>
              </div>
            </form>

            <p className="mb-0 mt-3" style={{ textAlign: "center" }}>
              <Link href="/" className="text-center back-link">
                ← Return to Public Portal
              </Link>
            </p>
          </div>
        </div>
      </div>

      <style jsx>{`
        .login-page {
          align-items: center;
          background: #e9ecef;
          display: flex;
          flex-direction: column;
          height: 100vh;
          justify-content: center;
          width: 100vw;
          font-family: 'Source Sans Pro', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
        }
        .login-box {
          width: 360px;
        }
        .login-logo {
          font-size: 2.1rem;
          font-weight: 300;
          margin-bottom: .9rem;
          text-align: center;
        }
        .login-logo a {
          color: #495057;
          text-decoration: none;
        }
        .card {
          background-color: #fff;
          border: 1px solid rgba(0,0,0,.125);
          border-top: 3px solid #007bff;
          border-radius: .25rem;
          box-shadow: 0 0 1px rgba(0,0,0,.125), 0 1px 3px rgba(0,0,0,.2);
          margin-bottom: 1rem;
        }
        .login-card-body {
          background-color: #fff;
          border-top: 0;
          color: #666;
          padding: 20px;
        }
        .login-box-msg {
          margin: 0;
          padding: 0 20px 20px;
          text-align: center;
          font-size: 0.9rem;
        }
        .form-group {
          margin-bottom: 1rem;
        }
        .form-control {
          display: block;
          width: 100%;
          height: calc(2.25rem + 2px);
          padding: .375rem .75rem;
          font-size: 1rem;
          font-weight: 400;
          line-height: 1.5;
          color: #495057;
          background-color: #fff;
          border: 1px solid #ced4da;
          border-radius: .25rem;
          outline: none;
          transition: border-color .15s ease-in-out,box-shadow .15s ease-in-out;
        }
        .form-control:focus {
          border-color: #80bdff;
          box-shadow: 0 0 0 0.2rem rgba(0,123,255,.25);
        }
        .error-alert {
          color: #dc3545;
          font-size: 0.82rem;
          background: #f8d7da;
          border: 1px solid #f5c6cb;
          padding: 8px 12px;
          border-radius: 4px;
          margin-bottom: 15px;
          text-align: center;
        }
        .btn {
          display: block;
          width: 100%;
          font-weight: 400;
          color: #212529;
          text-align: center;
          vertical-align: middle;
          cursor: pointer;
          user-select: none;
          background-color: transparent;
          border: 1px solid transparent;
          padding: .375rem .75rem;
          font-size: 1rem;
          line-height: 1.5;
          border-radius: .25rem;
          transition: color .15s ease-in-out,background-color .15s ease-in-out,border-color .15s ease-in-out,box-shadow .15s ease-in-out;
        }
        .btn-primary {
          color: #fff;
          background-color: #007bff;
          border-color: #007bff;
          box-shadow: none;
        }
        .btn-primary:hover {
          background-color: #0069d9;
          border-color: #0062cc;
        }
        .back-link {
          color: #007bff;
          font-size: 0.85rem;
        }
        .back-link:hover {
          text-decoration: underline;
        }
      `}</style>
    </div>
  );
}
