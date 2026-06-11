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
  const styles: Record<string, string> = {
    gold: "background: var(--btn-gold-bg); color: var(--btn-gold-text); border: 1px solid var(--btn-gold-border); font-weight: 700; font-family: var(--font-serif); letter-spacing: 0.08em; text-transform: uppercase;",
    "gold-outline": "background: var(--btn-gold-outline-bg); color: var(--btn-gold-outline-text); border: 1.5px solid var(--btn-gold-outline-border); font-weight: 600; font-family: var(--font-serif); letter-spacing: 0.08em; text-transform: uppercase; backdrop-filter: blur(8px);",
    primary: "background: var(--btn-primary-bg); color: var(--btn-primary-text); border: none; font-weight: 600;",
    secondary: "background: var(--btn-secondary-bg); color: var(--btn-secondary-text); border: 1px solid var(--btn-secondary-border); font-weight: 600;",
    danger: "background: rgba(239, 68, 68, 0.08); color: #ef4444; border: 1px solid rgba(239, 68, 68, 0.25); font-weight: 600;",
    glass: "background: var(--btn-glass-bg); color: var(--btn-glass-text); border: 1px solid var(--btn-glass-border); backdrop-filter: blur(8px); font-weight: 600;",
  };

  const sizes: Record<string, string> = {
    sm: "padding: 9px 18px; font-size: 0.78rem; border-radius: 10px;",
    md: "padding: 13px 26px; font-size: 0.88rem; border-radius: 14px;",
    lg: "padding: 16px 36px; font-size: 0.98rem; border-radius: 18px;",
  };

  const inlineStyle = styles[variant] + sizes[size];

  return (
    <button
      className={`premium-interactive-button ${className}`}
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        gap: "10px",
        cursor: "pointer",
        transition: "all 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
        outline: "none",
        position: "relative",
        overflow: "hidden",
        boxShadow: variant === "gold" ? "0 4px 18px var(--btn-gold-hover-shadow)" : "none",
        ...parseCssStyleString(inlineStyle),
      }}
      {...props}
    >
      {/* Button inner label */}
      <span style={{ position: "relative", zIndex: 2 }}>{children}</span>
      
      {/* Glossy sweep shine overlay element */}
      <span className="button-sweep-shine" />

      <style jsx>{`
        button {
          transform-origin: center;
        }
        button:hover {
          transform: translateY(-2px);
          filter: brightness(1.05);
          box-shadow: ${
            variant === "gold"
              ? "var(--btn-gold-hover-shadow)"
              : variant === "gold-outline"
              ? "var(--btn-gold-outline-hover-shadow)"
              : variant === "primary"
              ? "var(--btn-primary-hover-shadow)"
              : "var(--btn-secondary-hover-shadow)"
          } !important;
          border-color: ${variant === "gold-outline" ? "var(--btn-gold-outline-hover-border)" : ""};
        }
        button:active {
          transform: translateY(0);
          box-shadow: none;
        }
        button:disabled {
          opacity: 0.35;
          cursor: not-allowed;
          transform: none !important;
          box-shadow: none !important;
        }
        
        /* Shine sweep animations keyframes mapping */
        .button-sweep-shine {
          position: absolute;
          top: 0;
          left: -150%;
          width: 60%;
          height: 100%;
          background: linear-gradient(
            90deg,
            transparent 0%,
            rgba(255, 255, 255, 0.3) 50%,
            transparent 100%
          );
          transform: skewX(-20deg);
          transition: all 0.75s ease;
          z-index: 1;
        }
        
        button:hover .button-sweep-shine {
          left: 200%;
        }
      `}</style>
    </button>
  );
};

function parseCssStyleString(cssText: string): React.CSSProperties {
  const result: Record<string, string> = {};
  const attributes = cssText.split(";");
  for (let i = 0; i < attributes.length; i++) {
    const entry = attributes[i].trim();
    if (!entry) continue;
    const [key, value] = entry.split(":");
    if (!key || !value) continue;
    const camelKey = key.trim().replace(/-./g, (x) => x[1].toUpperCase());
    result[camelKey] = value.trim();
  }
  return result as React.CSSProperties;
}
