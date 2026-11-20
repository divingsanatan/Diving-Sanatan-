"use client";

import React, { useEffect, useRef } from "react";
import styles from "../qa.module.css";

function ToolBtn({ label, title, onClick, style }: { label: string; title: string; onClick: () => void; style?: React.CSSProperties }) {
  return (
    <button type="button" className={styles.toolBtn} title={title} aria-label={title} onMouseDown={(e) => e.preventDefault()} onClick={onClick} style={style}>
      {label}
    </button>
  );
}

/**
 * A small rich text box for comments: bold, italic, bullet list, quote and link.
 * It only produces a handful of simple tags. The server cleans the result again with an allow-list,
 * so nothing here is trusted. Pasted text is always inserted as plain text.
 */
export default function RichCommentEditor({
  value,
  onChange,
  id,
  placeholder,
  resetKey,
}: {
  value: string;
  onChange: (html: string, textLength: number) => void;
  id: string;
  placeholder: string;
  /** Change this number to clear the box (after a comment is sent). */
  resetKey: number;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (ref.current && value === "") ref.current.innerHTML = "";
    // only when asked to reset
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resetKey]);

  const emit = () => {
    const el = ref.current;
    if (!el) return;
    const text = (el.textContent || "").trim();
    onChange(text ? el.innerHTML : "", text.length);
  };

  const run = (cmd: string, arg?: string) => {
    ref.current?.focus();
    document.execCommand(cmd, false, arg);
    emit();
  };

  const addLink = () => {
    const sel = window.getSelection();
    const hasSelection = !!sel && !sel.isCollapsed && ref.current?.contains(sel.anchorNode);
    const raw = window.prompt("Paste the web address (it must start with https://)");
    if (!raw) return;
    const url = raw.trim();
    if (!/^https?:\/\/[^\s]+\.[^\s]+$/i.test(url)) {
      window.alert("Please enter a full web address starting with https://");
      return;
    }
    ref.current?.focus();
    if (hasSelection) {
      document.execCommand("createLink", false, url);
    } else {
      const safe = url.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/"/g, "&quot;");
      document.execCommand("insertHTML", false, `<a href="${safe}">${safe}</a>&nbsp;`);
    }
    emit();
  };

  const onPaste = (e: React.ClipboardEvent<HTMLDivElement>) => {
    e.preventDefault();
    const text = e.clipboardData.getData("text/plain");
    document.execCommand("insertText", false, text);
    emit();
  };

  return (
    <div className={styles.editorWrap}>
      <div className={styles.editorBar} role="toolbar" aria-label="Text formatting">
        <ToolBtn label="B" title="Bold" onClick={() => run("bold")} style={{ fontWeight: 800 }} />
        <ToolBtn label="I" title="Italic" onClick={() => run("italic")} style={{ fontStyle: "italic" }} />
        <ToolBtn label="•" title="Bulleted list" onClick={() => run("insertUnorderedList")} />
        <ToolBtn label="❝" title="Quote" onClick={() => run("formatBlock", "blockquote")} />
        <ToolBtn label="Link" title="Add a link" onClick={addLink} />
      </div>
      <div
        id={id}
        ref={ref}
        className={styles.editable}
        contentEditable
        role="textbox"
        aria-multiline="true"
        aria-label="Comment"
        data-placeholder={placeholder}
        suppressContentEditableWarning
        onInput={emit}
        onBlur={emit}
        onPaste={onPaste}
      />
    </div>
  );
}
