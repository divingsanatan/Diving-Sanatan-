"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Logo } from "@/components/layout/Logo";

export default function AdminLoginPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  // Redirect if already authenticated
  useEffect(() => {
    const isAuth = window.sessionStorage.getItem("divingsanatan_admin_auth");
    if (isAuth === "true") {
      router.push("/admin");
    }
  }, [router]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === "admin123") {
      window.sessionStorage.setItem("divingsanatan_admin_auth", "true");
      setError("");
      router.push("/admin");
    } else {
      setError("Unauthorized access passcode. Resonance mismatch.");
    }
  };

  return (
    <div className="login-overlay">
      <Card variant="glass" className="login-card">
        <div className="login-logo-row">
          <Logo size={36} />
          <h1 className="login-title">Diving Sanatan Gateway</h1>
        </div>
        <p className="login-subtitle">Enter passcode to authorize logistics dashboard.</p>

        <form onSubmit={handleLogin} className="login-form">
          <div className="form-group">
            <label>Passcode</label>
            <input
              type="password"
              className="glass-input"
              required
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          {error && <p className="error-text">{error}</p>}

          <Button variant="gold" type="submit">
            Unlock Panel
          </Button>
        </form>

        <Link href="/" className="return-link">← Return to Public Portal</Link>
      </Card>

      <style jsx>{`
        .login-overlay {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 24px;
          background: radial-gradient(circle, rgba(236, 72, 153, 0.06) 0%, rgba(168, 85, 247, 0.06) 100%);
        }
        .login-card {
          width: 100%;
          max-width: 440px;
          padding: 40px;
          display: flex;
          flex-direction: column;
          gap: 20px;
        }
        .login-logo-row {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 12px;
        }
        .login-title {
          font-family: var(--font-serif);
          font-size: 1.6rem;
          color: #4c1d95;
          letter-spacing: 0.05em;
        }
        .login-subtitle {
          text-align: center;
          font-size: 0.85rem;
          color: hsl(var(--text-muted));
          line-height: 1.5;
        }
        .login-form {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        .form-group {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .form-group label {
          font-size: 0.75rem;
          color: hsl(var(--text-muted));
          text-transform: uppercase;
          letter-spacing: 0.05em;
          font-weight: 600;
        }
        .error-text {
          color: #ef4444;
          font-size: 0.8rem;
          text-align: center;
        }
        .return-link {
          text-align: center;
          font-size: 0.85rem;
          color: hsl(var(--text-muted));
          text-decoration: none;
          transition: var(--transition-fast);
          margin-top: 10px;
        }
        .return-link:hover {
          color: #7c3aed;
        }
      `}</style>
    </div>
  );
}
