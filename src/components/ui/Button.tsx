"use client";

import React from "react";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  variant?: "primary" | "secondary" | "danger" | "glass" | "gold" | "gold-outline";
  size?: "sm" | "md" | "lg";
}

/**
 * High-fidelity, smooth interactive Button component with premium shine sweep animations.
 */
export const Button: React.FC<ButtonProps> = ({
  children,
  className = "",
  variant = "gold",
  size = "md",
  ...props
}) => {
  return (
    <button
      className={`premium-interactive-button ${className}`}
      data-variant={variant}
      data-size={size}
      {...props}
    >
      <span className="button-label">{children}</span>
      <span className="button-sweep-shine" />
    </button>
  );
};

