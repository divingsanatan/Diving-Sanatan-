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
    <div className="error-boundary-shell">
      <div className="glass-panel error-boundary-panel">
        <div className="error-boundary-icon">⚠️</div>
        <div>
          <h2 className="error-boundary-title">System Anomaly Detected</h2>
          <p className="error-boundary-desc">
            An unexpected runtime error occurred within the dashboard environment.
          </p>
        </div>

        {error.message && (
          <code className="error-boundary-code">{error.message}</code>
        )}

        <div className="error-boundary-actions">
          <Button variant="secondary" onClick={() => window.location.reload()}>
            Reload App
          </Button>
          <Button variant="primary" onClick={() => reset()}>
            Attempt Recovery
          </Button>
        </div>
      </div>
    </div>
  );
}
