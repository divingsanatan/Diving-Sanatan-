import React from "react";
import { Skeleton } from "@/components/ui/Skeleton";

/**
 * Global Loading Page for smooth Next.js transitions using glowing loading states.
 */
export default function Loading() {
  return (
    <main
      style={{
        display: "grid",
        gridTemplateColumns: "280px 1fr",
        padding: "16px",
        gap: "24px",
        minHeight: "100vh",
        background: "hsl(var(--bg-base))",
      }}
    >
      {/* Sidebar Mock Loader */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "32px",
          padding: "32px 24px",
          border: "1px solid var(--glass-border)",
          borderRadius: "20px",
          background: "var(--glass-bg)",
        }}
      >
        <Skeleton height={40} width="80%" />
        <div style={{ display: "flex", flexDirection: "column", gap: "16px", flex: 1, marginTop: "20px" }}>
          <Skeleton height={50} />
          <Skeleton height={50} />
          <Skeleton height={50} />
          <Skeleton height={50} />
        </div>
        <Skeleton height={40} />
      </div>

      {/* Dashboard Body Mock Loader */}
      <div style={{ display: "flex", flexDirection: "column", gap: "32px", padding: "20px" }}>
        {/* Header Skeletons */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <Skeleton height={32} width={240} />
            <Skeleton height={18} width={180} style={{ marginTop: "8px" }} />
          </div>
          <Skeleton height={40} width={120} />
        </div>

        {/* Highlight Grid */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "20px" }}>
          <div style={{ border: "1px solid var(--glass-border)", padding: "24px", borderRadius: "16px", background: "var(--glass-bg)" }}>
            <Skeleton height={20} width="60%" />
            <Skeleton height={40} width="80%" style={{ marginTop: "16px" }} />
          </div>
          <div style={{ border: "1px solid var(--glass-border)", padding: "24px", borderRadius: "16px", background: "var(--glass-bg)" }}>
            <Skeleton height={20} width="60%" />
            <Skeleton height={40} width="80%" style={{ marginTop: "16px" }} />
          </div>
          <div style={{ border: "1px solid var(--glass-border)", padding: "24px", borderRadius: "16px", background: "var(--glass-bg)" }}>
            <Skeleton height={20} width="60%" />
            <Skeleton height={40} width="80%" style={{ marginTop: "16px" }} />
          </div>
        </div>

        {/* Large SVG Chart Loader */}
        <div style={{ border: "1px solid var(--glass-border)", padding: "24px", borderRadius: "16px", background: "var(--glass-bg)" }}>
          <Skeleton height={30} width="40%" />
          <Skeleton height={250} style={{ marginTop: "24px" }} />
        </div>
      </div>
    </main>
  );
}
