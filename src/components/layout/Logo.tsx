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
  textColor = "#7c112b",
  subTextColor = "#475569",
}) => {
  return (
    <div className="ds-logo-container">
      <svg
        width={size}
        height={size}
        viewBox="0 0 200 200"
        xmlns="http://www.w3.org/2000/svg"
        className="ds-logo-svg"
      >
        <defs>
          <linearGradient id="dsGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#e11d48" />
            <stop offset="50%" stopColor="#9f1239" />
            <stop offset="100%" stopColor="#4c0519" />
          </linearGradient>
          <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="6" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        <path
          d="M 35 125 C 22 105 25 70 45 48 C 65 26 95 22 120 32 C 138 39 152 54 156 72 C 158 82 150 90 140 88 C 130 86 130 74 122 64 C 110 50 90 48 76 60 C 64 70 64 90 76 102 C 84 110 96 114 108 114 C 114 114 118 118 118 124 C 118 130 114 134 108 134 C 88 134 70 126 56 112 C 46 102 38 114 35 125 Z"
          fill="url(#dsGradient)"
          filter="url(#glow)"
        />

        <path
          d="M 165 75 C 178 95 175 130 155 152 C 135 174 105 178 80 168 C 62 161 48 146 44 128 C 42 118 50 110 60 112 C 70 114 70 126 78 136 C 90 150 110 152 124 140 C 136 130 136 110 124 98 C 116 90 104 86 92 86 C 86 86 82 82 82 76 C 82 70 86 66 92 66 C 112 66 130 74 144 88 C 154 98 162 86 165 75 Z"
          fill="url(#dsGradient)"
          filter="url(#glow)"
          opacity="0.9"
        />

        <path
          d="M 68 75 V 125 H 85 C 102 125 116 112 116 100 V 100 C 116 88 102 75 85 75 H 68 Z M 80 87 H 85 C 93 87 100 93 100 100 V 100 C 100 107 93 113 85 113 H 80 V 87 Z"
          fill="url(#dsGradient)"
        />

        <path
          d="M 112 70 C 114 62 122 55 132 55 C 142 55 148 62 148 72 C 148 82 138 88 128 94 C 118 100 110 108 110 120 C 110 132 118 140 130 140 C 140 140 148 132 148 122 H 136 C 136 126 132 128 130 128 C 126 128 122 124 122 120 C 122 114 128 108 138 102 C 148 96 160 86 160 72 C 160 54 148 43 132 43 C 118 43 108 52 106 64 L 112 70 Z"
          fill="url(#dsGradient)"
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
          transform: rotate(8deg) scale(1.05);
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
