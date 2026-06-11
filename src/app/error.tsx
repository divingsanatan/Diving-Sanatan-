"use client";

import React, { useEffect } from "react";
import { Button } from "@/components/ui/Button";

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

/**
 * Production-grade custom Error Boundary Component for App Router.
 */
export default function Error({ error, reset }: ErrorProps) {
  useEffect(() => {
    // Log the error to an external error tracking service in production
    console.error("App Boundary Error Catch:", error);
  }, [error]);

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "100vh",
        background: "hsl(var(--bg-base))",
        padding: "32px",
        color: "white",
        fontFamily: "var(--font-family)",
      }}
    >
      <div
        className="glass-panel"
        style={{
          maxWidth: "480px",
          width: "100%",
          padding: "40px",
          textAlign: "center",
          display: "flex",
          flexDirection: "column",
          gap: "24px",
        }}
      >
        <div
          style={{
            fontSize: "3.5rem",
            animation: "wiggle 1s infinite ease-in-out",
          }}
        >
          ⚠️
        </div>
        <div>
          <h2 style={{ fontSize: "1.6rem", fontWeight: "700" }}>System Anomaly Detected</h2>
          <p style={{ fontSize: "0.9rem", color: "hsl(var(--text-secondary))", marginTop: "8px" }}>
            An unexpected runtime error occurred within the dashboard environment.
          </p>
        </div>

        {error.message && (
          <code
            style={{
              padding: "12px 16px",
              borderRadius: "8px",
              background: "rgba(255, 255, 255, 0.03)",
              border: "1px solid var(--glass-border)",
              fontSize: "0.8rem",
              color: "hsl(var(--color-error))",
              textAlign: "left",
              wordBreak: "break-all",
            }}
          >
            {error.message}
          </code>
        )}

        <div style={{ display: "flex", gap: "12px", justifyContent: "center" }}>
          <Button variant="secondary" onClick={() => window.location.reload()}>
            Reload App
          </Button>
          <Button variant="primary" onClick={() => reset()}>
            Attempt Recovery
          </Button>
        </div>
      </div>
      
      <style jsx>{`
        @keyframes wiggle {
          0%, 100% { transform: rotate(0); }
          25% { transform: rotate(-5deg); }
          75% { transform: rotate(5deg); }
        }
      `}</style>
    </div>
  );
}
