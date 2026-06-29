"use client";

import React from "react";

interface LogoProps {
  size?: number;
  showText?: boolean;
  textColor?: string;
  subTextColor?: string;
}

export const Logo: React.FC<LogoProps> = ({
  size = 40,
  showText = false,
  textColor = "#7c3aed",
  subTextColor = "#475569",
}) => {
  return (
    <div className="ds-logo-container">
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="ds-logo-svg"
      >
        <path
          d="M12 2c0 5.523 4.477 10 10 10-5.523 0-10 4.477-10 10 0-5.523-4.477-10-10-10 5.523 0 10-4.477 10-10z"
          fill="#7c3aed"
        />
      </svg>

      {showText && (
        <div className="ds-logo-text-col">
          <span className="ds-logo-title">DIVING SANATAN</span>
          <span className="ds-logo-subtitle">HOLISTIC LIFE HEALING & PROBLEM SOLVING</span>
        </div>
      )}

      <style jsx>{`
        .ds-logo-container {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .ds-logo-svg {
          flex-shrink: 0;
          transition: transform 0.4s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .ds-logo-container:hover .ds-logo-svg {
          transform: rotate(15deg) scale(1.1);
        }
        .ds-logo-text-col {
          display: flex;
          flex-direction: column;
          line-height: 1.2;
        }
        .ds-logo-title {
          font-family: var(--font-serif);
          font-size: 1.35rem;
          font-weight: 700;
          letter-spacing: 0.1em;
          color: ${textColor};
        }
        .ds-logo-subtitle {
          font-family: var(--font-sans);
          font-size: 0.65rem;
          font-weight: 600;
          letter-spacing: 0.05em;
          text-transform: uppercase;
          opacity: 0.8;
          color: ${subTextColor};
        }
        @media (max-width: 768px) {
          .ds-logo-title {
            font-size: 1.1rem;
          }
          .ds-logo-subtitle {
            font-size: 0.55rem;
          }
        }
      `}</style>
    </div>
  );
};
