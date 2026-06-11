import React from "react";

interface SkeletonProps {
  className?: string;
  width?: string | number;
  height?: string | number;
  borderRadius?: string;
  style?: React.CSSProperties;
}

/**
 * High-performance pulsing loading Skeleton placeholder.
 */
export const Skeleton: React.FC<SkeletonProps> = ({
  className = "",
  width = "100%",
  height = "20px",
  borderRadius = "8px",
  style = {},
}) => {
  return (
    <div
      className={`skeleton-loader ${className}`}
      style={{
        width: typeof width === "number" ? `${width}px` : width,
        height: typeof height === "number" ? `${height}px` : height,
        borderRadius,
        background: "linear-gradient(90deg, rgba(255, 255, 255, 0.04) 25%, rgba(255, 255, 255, 0.08) 50%, rgba(255, 255, 255, 0.04) 75%)",
        backgroundSize: "200% 100%",
        animation: "pulse-shimmer 1.8s infinite linear",
        ...style,
      }}
    />
  );
};
