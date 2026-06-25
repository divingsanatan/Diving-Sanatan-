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

      <style jsx>{`
        button {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          cursor: pointer;
          transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
          outline: none;
          position: relative;
          overflow: hidden;
          transform-origin: center;
        }

        button[data-variant="gold"] {
          background: var(--btn-gold-bg);
          color: var(--btn-gold-text);
          border: 1px solid var(--btn-gold-border);
          font-weight: 700;
          font-family: var(--font-serif);
          letter-spacing: 0.08em;
          text-transform: uppercase;
          box-shadow: 0 4px 18px var(--btn-gold-hover-shadow);
        }

        button[data-variant="gold-outline"] {
          background: var(--btn-gold-outline-bg);
          color: var(--btn-gold-outline-text);
          border: 1.5px solid var(--btn-gold-outline-border);
          font-weight: 600;
          font-family: var(--font-serif);
          letter-spacing: 0.08em;
          text-transform: uppercase;
          backdrop-filter: blur(8px);
        }

        button[data-variant="primary"] {
          background: var(--btn-primary-bg);
          color: var(--btn-primary-text);
          border: none;
          font-weight: 600;
        }

        button[data-variant="secondary"] {
          background: var(--btn-secondary-bg);
          color: var(--btn-secondary-text);
          border: 1px solid var(--btn-secondary-border);
          font-weight: 600;
        }

        button[data-variant="danger"] {
          background: rgba(239, 68, 68, 0.08);
          color: #ef4444;
          border: 1px solid rgba(239, 68, 68, 0.25);
          font-weight: 600;
        }

        button[data-variant="glass"] {
          background: var(--btn-glass-bg);
          color: var(--btn-glass-text);
          border: 1px solid var(--btn-glass-border);
          backdrop-filter: blur(8px);
          font-weight: 600;
        }

        button[data-size="sm"] {
          padding: 9px 18px;
          font-size: 0.78rem;
          border-radius: 10px;
        }

        button[data-size="md"] {
          padding: 13px 26px;
          font-size: 0.88rem;
          border-radius: 14px;
        }

        button[data-size="lg"] {
          padding: 16px 36px;
          font-size: 0.98rem;
          border-radius: 18px;
        }

        .button-label {
          position: relative;
          z-index: 2;
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
