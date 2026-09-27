"use client";

import React, { useState, useEffect, useRef } from "react";
import { useBlog } from "@/app/blog/BlogContext";
import { usePathname } from "next/navigation";
import { Search, ArrowRight } from "lucide-react";

export function BlogFloatingSearchBar() {
  const { searchQuery, setSearchQuery, executeSearch, activeCategory, setActiveCategory } = useBlog();
  const pathname = usePathname();
  const [isFocused, setIsFocused] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [localInput, setLocalInput] = useState(searchQuery || "");
  const [isMac, setIsMac] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Sync localInput with searchQuery from context
  useEffect(() => {
    setLocalInput(searchQuery || "");
  }, [searchQuery]);

  // Detect OS for shortcut hint (⌘K vs Ctrl+K)
  useEffect(() => {
    if (typeof window !== "undefined") {
      setIsMac(navigator.platform.toUpperCase().indexOf("MAC") >= 0);
    }
  }, []);

  // Keyboard shortcut listener (Cmd+K / Ctrl+K & Escape)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setIsExpanded(true);
        setTimeout(() => inputRef.current?.focus(), 50);
      } else if (e.key === "Escape") {
        if (isFocused || isExpanded) {
          setIsFocused(false);
          setIsExpanded(false);
          inputRef.current?.blur();
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isFocused, isExpanded]);

  // Close popup menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsFocused(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setLocalInput(val);
    setSearchQuery(val);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!localInput.trim()) return;
    executeSearch(localInput);
    inputRef.current?.blur();
    setIsFocused(false);
  };

  const handleSuggestionClick = (topicText: string) => {
    setLocalInput(topicText);
    setSearchQuery(topicText);
    executeSearch(topicText);
    setIsFocused(false);
  };

  const handleClear = () => {
    setLocalInput("");
    setSearchQuery("");
    inputRef.current?.focus();
  };

  const suggestions = ["Anxiety", "Relationship", "Self doubt", "Financial issues"];

  const popularTopics = [
    { label: "Anxiety & Overthinking", cat: "anxiety" },
    { label: "Relationship Pain", cat: "relationship" },
    { label: "Financial Stress", cat: "financial" },
    { label: "Meditation & Mindfulness", cat: "meditation" },
    { label: "Chakra Healing", cat: "chakra healing" },
    { label: "Sound Therapy", cat: "sound therapy" },
    { label: "Breathwork", cat: "breathwork" },
  ];

  return (
    <div 
      ref={containerRef}
      className={`floating-blog-search-dock ${isFocused ? "is-focused" : ""} ${isExpanded ? "is-expanded" : ""}`}
      id="floating-blog-search-dock"
    >
      {/* Search Input Pill */}
      <form onSubmit={handleSubmit} className="floating-search-form">
        <div className="floating-search-input-wrapper">
          <Search className="floating-search-icon" size={20} />

          <div className={`floating-search-main-container ${localInput.trim() ? "has-query" : ""}`}>
            <input
              ref={inputRef}
              type="text"
              id="floating-blog-search-input"
              className={`floating-search-input ${localInput.trim() ? "has-text" : ""}`}
              placeholder="What is stealing your peace right now?"
              value={localInput}
              onChange={handleInputChange}
              onFocus={() => {
                setIsFocused(true);
                setIsExpanded(true);
              }}
              aria-label="Search guidance"
            />

            {!localInput.trim() && (
              <div className="floating-input-suggestion">
                <span className="suggestion-label">e.g.,</span>
                {suggestions.map((item, idx) => (
                  <React.Fragment key={idx}>
                    <button
                      type="button"
                      className="suggestion-link"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleSuggestionClick(item);
                      }}
                    >
                      {item}
                    </button>
                    {idx < suggestions.length - 1 && <span className="suggestion-sep">, </span>}
                  </React.Fragment>
                ))}
              </div>
            )}
          </div>

          {localInput ? (
            <button
              type="button"
              className="floating-clear-btn"
              onClick={handleClear}
              aria-label="Clear search text"
              title="Clear search"
            >
              ✕
            </button>
          ) : (
            <span className="floating-shortcut-badge" title="Keyboard shortcut">
              {isMac ? "⌘K" : "Ctrl+K"}
            </span>
          )}

          <button
            type="submit"
            className="floating-submit-btn"
            aria-label="Find Guidance"
          >
            <span>Find Guidance</span>
            <ArrowRight size={16} />
          </button>
        </div>
      </form>

      {/* Quick Suggestions & Categories Popup */}
      {isFocused && (
        <div className="floating-search-dropdown animate-fade-in">
          <div className="dropdown-section-title">
            <span>Explore Healing Guidance</span>
          </div>

          <div className="popular-topics-pills">
            {popularTopics.map((topic) => (
              <button
                key={topic.cat}
                type="button"
                className={`topic-pill ${activeCategory === topic.cat ? "active" : ""}`}
                onClick={() => {
                  handleSuggestionClick(topic.label);
                }}
              >
                {topic.label}
              </button>
            ))}
          </div>

          {localInput && (
            <div className="dropdown-footer-hint">
              Press <kbd className="kbd-shortcut">Enter ↵</kbd> to search for &ldquo;<strong>{localInput}</strong>&rdquo;
            </div>
          )}
        </div>
      )}

      {/* Styling */}
      <style jsx global>{`
        .floating-blog-search-dock {
          position: fixed;
          bottom: 28px;
          left: 50%;
          transform: translateX(-50%);
          z-index: 999;
          width: calc(100% - 32px);
          max-width: 760px;
          transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .floating-search-form {
          width: 100%;
        }

        .floating-search-input-wrapper {
          display: flex;
          align-items: center;
          width: 100%;
          background: rgba(255, 255, 255, 0.94);
          backdrop-filter: blur(20px) saturate(180%);
          -webkit-backdrop-filter: blur(20px) saturate(180%);
          border: 1px solid rgba(124, 58, 237, 0.25);
          border-radius: 9999px;
          padding: 8px 10px 8px 22px;
          gap: 12px;
          box-shadow: 
            0 14px 40px -4px rgba(124, 58, 237, 0.18),
            0 4px 14px rgba(0, 0, 0, 0.04),
            inset 0 1px 0 rgba(255, 255, 255, 0.8);
          transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .floating-blog-search-dock.is-focused .floating-search-input-wrapper {
          border-color: rgba(124, 58, 237, 0.6);
          box-shadow: 
            0 18px 48px -4px rgba(124, 58, 237, 0.28),
            0 0 0 4px rgba(168, 85, 247, 0.14),
            inset 0 1px 0 rgba(255, 255, 255, 0.9);
          background: rgba(255, 255, 255, 0.98);
          transform: translateY(-2px);
        }

        .floating-search-icon {
          color: #7c3aed;
          flex-shrink: 0;
          transition: transform 0.2s ease;
        }

        .floating-blog-search-dock.is-focused .floating-search-icon {
          transform: scale(1.1);
          color: #6b21a8;
        }

        .floating-search-main-container {
          display: flex;
          flex-direction: column;
          flex: 1;
          justify-content: center;
          padding: 2px 0;
          min-width: 0;
          gap: 1px;
        }

        .floating-search-input {
          width: 100%;
          background: transparent !important;
          border: none !important;
          outline: none !important;
          color: #1f2937;
          font-size: 0.98rem;
          font-family: var(--font-sans, system-ui, sans-serif);
          font-weight: 500;
          padding: 0 !important;
          margin: 0 !important;
          line-height: 1.3 !important;
        }

        .floating-search-input::placeholder {
          color: #9ca3af;
          font-weight: 400;
        }

        .floating-input-suggestion {
          font-family: var(--font-sans, system-ui, sans-serif);
          font-size: 0.78rem;
          color: #6b7280;
          margin-top: 1px;
          line-height: 1.2;
          text-align: left;
          pointer-events: auto;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          display: flex;
          align-items: center;
          gap: 3px;
        }

        .suggestion-label {
          color: #9ca3af;
          margin-right: 2px;
        }

        .suggestion-link {
          background: none;
          border: none;
          padding: 0;
          font: inherit;
          color: #6b7280;
          cursor: pointer;
          transition: color 0.15s ease;
          text-decoration: underline;
          text-decoration-color: transparent;
        }

        .suggestion-link:hover {
          color: #7c3aed;
          text-decoration-color: #7c3aed;
        }

        .suggestion-sep {
          color: #9ca3af;
        }

        .floating-shortcut-badge {
          font-family: var(--font-sans, system-ui, sans-serif);
          font-size: 0.72rem;
          font-weight: 600;
          color: #7c3aed;
          background: rgba(168, 85, 247, 0.08);
          border: 1px solid rgba(168, 85, 247, 0.2);
          border-radius: 6px;
          padding: 3px 8px;
          user-select: none;
          letter-spacing: 0.02em;
          white-space: nowrap;
        }

        .floating-clear-btn {
          background: rgba(239, 68, 68, 0.08);
          border: 1px solid rgba(239, 68, 68, 0.15);
          color: #ef4444;
          border-radius: 50%;
          width: 24px;
          height: 24px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          font-size: 0.72rem;
          transition: all 0.2s ease;
          flex-shrink: 0;
        }

        .floating-clear-btn:hover {
          background: rgba(239, 68, 68, 0.18);
          transform: scale(1.1);
        }

        .floating-submit-btn {
          background: linear-gradient(135deg, #e11d48 0%, #7c3aed 100%);
          color: #ffffff;
          border: none;
          border-radius: 9999px;
          padding: 10px 22px;
          font-family: var(--font-sans, system-ui, sans-serif);
          font-size: 0.9rem;
          font-weight: 600;
          cursor: pointer;
          box-shadow: 0 4px 14px rgba(124, 58, 237, 0.25);
          transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
          white-space: nowrap;
          display: flex;
          align-items: center;
          gap: 6px;
          flex-shrink: 0;
        }

        .floating-submit-btn:hover {
          transform: translateY(-1px) scale(1.02);
          box-shadow: 0 6px 20px rgba(124, 58, 237, 0.35);
        }

        .floating-search-dropdown {
          position: absolute;
          bottom: calc(100% + 12px);
          left: 0;
          right: 0;
          background: rgba(255, 255, 255, 0.96);
          backdrop-filter: blur(24px);
          -webkit-backdrop-filter: blur(24px);
          border: 1px solid rgba(168, 85, 247, 0.25);
          border-radius: 20px;
          padding: 16px;
          box-shadow: 
            0 20px 48px -8px rgba(124, 58, 237, 0.2),
            0 8px 20px rgba(0, 0, 0, 0.05);
          animation: floatingDropdownUp 0.25s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }

        @keyframes floatingDropdownUp {
          from {
            opacity: 0;
            transform: translateY(10px) scale(0.98);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        .dropdown-section-title {
          font-size: 0.75rem;
          text-transform: uppercase;
          letter-spacing: 0.06em;
          color: #7c3aed;
          font-weight: 700;
          margin-bottom: 10px;
        }

        .popular-topics-pills {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }

        .topic-pill {
          background: rgba(245, 243, 255, 0.9);
          border: 1px solid rgba(168, 85, 247, 0.18);
          color: #5b21b6;
          border-radius: 9999px;
          padding: 6px 14px;
          font-size: 0.8rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .topic-pill:hover,
        .topic-pill.active {
          background: linear-gradient(135deg, #e11d48 0%, #7c3aed 100%);
          color: #ffffff;
          border-color: transparent;
          transform: translateY(-1px);
          box-shadow: 0 4px 10px rgba(124, 58, 237, 0.2);
        }

        .dropdown-footer-hint {
          margin-top: 14px;
          padding-top: 10px;
          border-top: 1px solid rgba(168, 85, 247, 0.1);
          font-size: 0.8rem;
          color: #6b7280;
        }

        .kbd-shortcut {
          background: #f3f4f6;
          border: 1px solid #d1d5db;
          border-radius: 4px;
          padding: 2px 5px;
          font-size: 0.72rem;
          font-family: monospace;
          color: #374151;
        }

        @media (max-width: 640px) {
          .floating-blog-search-dock {
            bottom: 16px;
            width: calc(100% - 24px);
          }
          .floating-search-input-wrapper {
            padding: 6px 8px 6px 14px;
            gap: 8px;
          }
          .floating-shortcut-badge,
          .floating-input-suggestion {
            display: none;
          }
          .floating-submit-btn {
            padding: 8px 14px;
            font-size: 0.82rem;
          }
          .floating-submit-btn span {
            display: none;
          }
        }
      `}</style>
    </div>
  );
}
