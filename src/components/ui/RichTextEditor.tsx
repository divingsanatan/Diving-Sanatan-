"use client";

import React, { useRef, useEffect, useCallback } from "react";

interface RichTextEditorProps {
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  minHeight?: string;
  required?: boolean;
  className?: string;
}

export default function RichTextEditor({
  value,
  onChange,
  placeholder = "Draft content here — use the toolbar above for formatting...",
  minHeight = "160px",
  required = false,
  className = "",
}: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const isInternalChange = useRef(false);

  // Sync external value to innerHTML when value changes from outside (e.g. form reset or loading item)
  useEffect(() => {
    if (editorRef.current) {
      if (isInternalChange.current) {
        isInternalChange.current = false;
        return;
      }
      if (editorRef.current.innerHTML !== (value || "")) {
        editorRef.current.innerHTML = value || "";
      }
    }
  }, [value]);

  const handleInput = useCallback(() => {
    if (editorRef.current) {
      isInternalChange.current = true;
      const html = editorRef.current.innerHTML;
      // If editor contains only empty br or whitespace tag, normalize to empty string
      const isEmpty = html === "<br>" || html === "<div><br></div>" || html.trim() === "";
      onChange(isEmpty ? "" : html);
    }
  }, [onChange]);

  const execCmd = (cmd: string, arg?: string) => {
    document.execCommand(cmd, false, arg);
    editorRef.current?.focus();
    handleInput();
  };

  const insertLink = () => {
    const url = window.prompt("Enter URL:", "https://");
    if (url) {
      execCmd("createLink", url);
    }
  };

  return (
    <div className={`rte-wrapper ${className}`}>
      {/* Toolbar */}
      <div className="rte-toolbar">
        <div className="rte-toolbar-group">
          <button
            type="button"
            className="rte-btn"
            title="Bold"
            onMouseDown={(e) => {
              e.preventDefault();
              execCmd("bold");
            }}
          >
            <b>B</b>
          </button>
          <button
            type="button"
            className="rte-btn"
            title="Italic"
            onMouseDown={(e) => {
              e.preventDefault();
              execCmd("italic");
            }}
          >
            <i>I</i>
          </button>
          <button
            type="button"
            className="rte-btn"
            title="Underline"
            onMouseDown={(e) => {
              e.preventDefault();
              execCmd("underline");
            }}
          >
            <u>U</u>
          </button>
          <button
            type="button"
            className="rte-btn"
            title="Strikethrough"
            onMouseDown={(e) => {
              e.preventDefault();
              execCmd("strikeThrough");
            }}
          >
            <s>S</s>
          </button>
        </div>

        <div className="rte-toolbar-divider" />

        <div className="rte-toolbar-group">
          <button
            type="button"
            className="rte-btn rte-btn-text"
            title="Heading 2"
            onMouseDown={(e) => {
              e.preventDefault();
              execCmd("formatBlock", "H2");
            }}
          >
            H2
          </button>
          <button
            type="button"
            className="rte-btn rte-btn-text"
            title="Heading 3"
            onMouseDown={(e) => {
              e.preventDefault();
              execCmd("formatBlock", "H3");
            }}
          >
            H3
          </button>
          <button
            type="button"
            className="rte-btn rte-btn-text"
            title="Paragraph"
            onMouseDown={(e) => {
              e.preventDefault();
              execCmd("formatBlock", "P");
            }}
          >
            ¶
          </button>
        </div>

        <div className="rte-toolbar-divider" />

        <div className="rte-toolbar-group">
          <button
            type="button"
            className="rte-btn"
            title="Bullet List"
            onMouseDown={(e) => {
              e.preventDefault();
              execCmd("insertUnorderedList");
            }}
          >
            ≡
          </button>
          <button
            type="button"
            className="rte-btn rte-btn-text"
            title="Numbered List"
            onMouseDown={(e) => {
              e.preventDefault();
              execCmd("insertOrderedList");
            }}
          >
            1.
          </button>
          <button
            type="button"
            className="rte-btn"
            title="Blockquote"
            onMouseDown={(e) => {
              e.preventDefault();
              execCmd("formatBlock", "BLOCKQUOTE");
            }}
          >
            &quot;
          </button>
        </div>

        <div className="rte-toolbar-divider" />

        <div className="rte-toolbar-group">
          <button
            type="button"
            className="rte-btn"
            title="Insert Link"
            onMouseDown={(e) => {
              e.preventDefault();
              insertLink();
            }}
          >
            🔗
          </button>
          <button
            type="button"
            className="rte-btn"
            title="Unlink"
            onMouseDown={(e) => {
              e.preventDefault();
              execCmd("unlink");
            }}
          >
            🚫
          </button>
          <button
            type="button"
            className="rte-btn rte-btn-danger"
            title="Clear Formatting"
            onMouseDown={(e) => {
              e.preventDefault();
              execCmd("removeFormat");
            }}
          >
            ✕
          </button>
        </div>
      </div>

      {/* Editable Area */}
      <div
        ref={editorRef}
        className="rte-editable"
        contentEditable
        suppressContentEditableWarning
        onInput={handleInput}
        onBlur={handleInput}
        data-placeholder={placeholder}
        style={{ minHeight }}
      />

      {/* Hidden input for HTML form validation if required */}
      {required && (
        <input
          type="text"
          required
          value={value || ""}
          onChange={() => {}}
          tabIndex={-1}
          style={{
            opacity: 0,
            height: 0,
            width: 0,
            position: "absolute",
            pointerEvents: "none",
          }}
        />
      )}

      <style jsx>{`
        .rte-wrapper {
          border: 1.5px solid rgba(168, 85, 247, 0.25);
          border-radius: 12px;
          overflow: hidden;
          background: rgba(255, 255, 255, 0.95);
          box-shadow: 0 2px 12px rgba(0, 0, 0, 0.04);
          transition: border-color 0.2s ease, box-shadow 0.2s ease;
          position: relative;
          width: 100%;
        }
        .rte-wrapper:focus-within {
          border-color: #a855f7;
          box-shadow: 0 0 0 3px rgba(168, 85, 247, 0.15);
        }
        .rte-toolbar {
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          gap: 2px;
          padding: 8px 10px;
          background: rgba(248, 245, 255, 0.9);
          border-bottom: 1.5px solid rgba(168, 85, 247, 0.12);
        }
        .rte-toolbar-group {
          display: flex;
          align-items: center;
          gap: 2px;
        }
        .rte-toolbar-divider {
          width: 1px;
          height: 20px;
          background: rgba(0, 0, 0, 0.12);
          margin: 0 6px;
          flex-shrink: 0;
        }
        .rte-btn {
          background: transparent;
          border: 1px solid transparent;
          border-radius: 6px;
          width: 30px;
          height: 28px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 0.88rem;
          color: #475569;
          cursor: pointer;
          transition: all 0.15s ease;
          padding: 0;
          line-height: 1;
        }
        .rte-btn-text {
          width: auto;
          padding: 0 7px;
          font-size: 0.78rem;
          font-weight: 700;
          letter-spacing: 0.02em;
        }
        .rte-btn:hover {
          background: rgba(124, 58, 237, 0.1);
          border-color: rgba(124, 58, 237, 0.25);
          color: #7c3aed;
        }
        .rte-btn-danger:hover {
          background: rgba(239, 68, 68, 0.1);
          border-color: rgba(239, 68, 68, 0.25);
          color: #ef4444;
        }
        .rte-editable {
          max-height: 500px;
          overflow-y: auto;
          padding: 14px 16px;
          font-family: inherit;
          font-size: 0.92rem;
          line-height: 1.6;
          color: #1e293b;
          outline: none;
          word-break: break-word;
          position: relative;
          caret-color: #7c3aed;
        }
        .rte-editable:empty:before {
          content: attr(data-placeholder);
          color: #94a3b8;
          pointer-events: none;
          font-style: italic;
        }
        .rte-editable :global(h2) {
          font-size: 1.35rem;
          font-weight: 700;
          color: #4c1d95;
          margin: 12px 0 6px;
        }
        .rte-editable :global(h3) {
          font-size: 1.1rem;
          font-weight: 700;
          color: #5b21b6;
          margin: 10px 0 4px;
        }
        .rte-editable :global(blockquote) {
          border-left: 3px solid #7c3aed;
          margin: 10px 0;
          padding: 8px 14px;
          background: rgba(168, 85, 247, 0.05);
          border-radius: 0 8px 8px 0;
          color: #4c1d95;
          font-style: italic;
        }
        .rte-editable :global(ul) {
          list-style: disc;
          padding-left: 24px;
          margin: 8px 0;
        }
        .rte-editable :global(ol) {
          list-style: decimal;
          padding-left: 24px;
          margin: 8px 0;
        }
        .rte-editable :global(a) {
          color: #7c3aed;
          text-decoration: underline;
        }
        .rte-editable :global(b),
        .rte-editable :global(strong) {
          font-weight: 700;
        }
        .rte-editable :global(i),
        .rte-editable :global(em) {
          font-style: italic;
        }
        .rte-editable :global(u) {
          text-decoration: underline;
        }
        .rte-editable :global(s) {
          text-decoration: line-through;
        }
      `}</style>
    </div>
  );
}
