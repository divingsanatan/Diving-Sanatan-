"use client";

import React, { useRef, useEffect } from "react";

interface SkeletonProps {
  className?: string;
  width?: string | number;
  height?: string | number;
  borderRadius?: string;
}

/**
 * High-performance pulsing loading Skeleton placeholder.
 */
export const Skeleton: React.FC<SkeletonProps> = ({
  className = "",
  width = "100%",
  height = "20px",
  borderRadius = "8px",
}) => {
  const skeletonRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = skeletonRef.current;
    if (!el) return;
    el.style.setProperty("--skeleton-width", typeof width === "number" ? `${width}px` : width);
    el.style.setProperty("--skeleton-height", typeof height === "number" ? `${height}px` : height);
    el.style.setProperty("--skeleton-radius", borderRadius);
  }, [width, height, borderRadius]);

  return (
    <div
      ref={skeletonRef}
      className={`skeleton-loader ${className}`}
    />
  );
};
