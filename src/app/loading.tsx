import React from "react";
import { Skeleton } from "@/components/ui/Skeleton";

/**
 * Global Loading Page for smooth Next.js transitions using glowing loading states.
 */
export default function Loading() {
  return (
    <main className="loading-shell">
      {/* Sidebar Mock Loader */}
      <div className="loading-sidebar">
        <Skeleton height={40} width="80%" />
        <div className="loading-nav-stack">
          <Skeleton height={50} />
          <Skeleton height={50} />
          <Skeleton height={50} />
          <Skeleton height={50} />
        </div>
        <Skeleton height={40} />
      </div>

      {/* Dashboard Body Mock Loader */}
      <div className="loading-body">
        {/* Header Skeletons */}
        <div className="loading-header-row">
          <div>
            <Skeleton height={32} width={240} />
            <Skeleton height={18} width={180} className="skeleton-mt-8" />
          </div>
          <Skeleton height={40} width={120} />
        </div>

        {/* Highlight Grid */}
        <div className="loading-stat-grid">
          <div className="loading-glass-card">
            <Skeleton height={20} width="60%" />
            <Skeleton height={40} width="80%" className="skeleton-mt-16" />
          </div>
          <div className="loading-glass-card">
            <Skeleton height={20} width="60%" />
            <Skeleton height={40} width="80%" className="skeleton-mt-16" />
          </div>
          <div className="loading-glass-card">
            <Skeleton height={20} width="60%" />
            <Skeleton height={40} width="80%" className="skeleton-mt-16" />
          </div>
        </div>

        {/* Large SVG Chart Loader */}
        <div className="loading-glass-card">
          <Skeleton height={30} width="40%" />
          <Skeleton height={250} className="skeleton-mt-24" />
        </div>
      </div>
    </main>
  );
}
