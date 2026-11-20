"use client";

import React, { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import type { QaComment } from "@/lib/qaShared";
import styles from "../qa.module.css";
import RichCommentEditor from "./RichCommentEditor";

type Me = { id: string; role: string } | null;
const fmt = (iso: string) => (iso ? new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" }) : "");

/**
 * Discussion under a question. The approved comments arrive already loaded from the server (so they are in the
 * page for search engines). Posting needs a real signed-in account, checked by the server. Visitor comments wait
 * for staff approval; healer and team comments appear straight away.
 */
export default function QaComments({ questionId, initialComments }: { questionId: string; initialComments: QaComment[] }) {
  const [comments, setComments] = useState<QaComment[]>(initialComments);
  const [me, setMe] = useState<Me>(null);
  const [meLoaded, setMeLoaded] = useState(false);
  const [html, setHtml] = useState("");
  const [textLen, setTextLen] = useState(0);
  const [resetKey, setResetKey] = useState(0);
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const refresh = useCallback(async () => {
    try {
      const r = await fetch(`/api/qa/comments?questionId=${encodeURIComponent(questionId)}`, { cache: "no-store" });
      if (r.ok) setComments((await r.json()).data || []);
    } catch {
      /* keep what we have */
    }
  }, [questionId]);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/auth/me", { credentials: "same-origin", cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => {
        if (cancelled) return;
        setMe(j?.success ? { id: j.data.id, role: j.data.role } : null);
        setMeLoaded(true);
      })
      .catch(() => !cancelled && setMeLoaded(true));
    return () => {
      cancelled = true;
    };
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg(null);
    setSending(true);
    try {
      const r = await fetch("/api/qa/comments", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ questionId, parentId: replyTo, body: html }),
      });
      const j = await r.json().catch(() => ({}));
      if (r.status === 401) {
        setMe(null);
        setMsg({ ok: false, text: "Your session has ended. Please sign in again." });
      } else if (!r.ok || !j.success) {
        setMsg({ ok: false, text: j.error || "Something went wrong. Please try again." });
      } else {
        setHtml("");
        setTextLen(0);
        setResetKey((k) => k + 1);
        setReplyTo(null);
        setMsg({ ok: true, text: j.awaitingApproval ? "Thank you! Your comment will appear once our team has approved it." : "Your comment is live." });
        if (!j.awaitingApproval) await refresh();
      }
    } catch {
      setMsg({ ok: false, text: "Could not reach the server. Please try again." });
    } finally {
      setSending(false);
    }
  };

  const top = comments.filter((c) => !c.parentId);
  const repliesOf = (id: string) => comments.filter((c) => c.parentId === id);

  const one = (c: QaComment, canReply: boolean) => (
    <li key={c.id} className={`${styles.comment} ${c.authorRole !== "member" ? styles.commentHealer : ""}`}>
      <div className={styles.commentHead}>
        <span className={styles.commentName}>{c.authorName}</span>
        {c.authorRole === "healer" && <span className={styles.badge}>Healer</span>}
        {c.authorRole === "staff" && <span className={styles.badge}>Team</span>}
        <span className={styles.commentDate}>{fmt(c.createdAt)}</span>
      </div>
      <div className={styles.commentRich} dangerouslySetInnerHTML={{ __html: c.html }} />
      {canReply && me && (
        <button type="button" className={styles.linkBtn} onClick={() => setReplyTo(replyTo === c.id ? null : c.id)}>
          {replyTo === c.id ? "Cancel reply" : "Reply"}
        </button>
      )}
    </li>
  );

  return (
    <div>
      {top.length === 0 ? (
        <p className={styles.hint}>No comments yet. Share your experience or ask a follow-up.</p>
      ) : (
        <ul className={styles.thread}>
          {top.map((c) => (
            <React.Fragment key={c.id}>
              {one(c, true)}
              {repliesOf(c.id).length > 0 && (
                <li style={{ listStyle: "none" }}>
                  <ul className={styles.replies}>{repliesOf(c.id).map((r) => one(r, false))}</ul>
                </li>
              )}
            </React.Fragment>
          ))}
        </ul>
      )}

      {meLoaded && !me ? (
        <div className={`${styles.notice} ${styles.info}`}>
          Please <Link href="/profile" className={styles.more}>sign in</Link> to join the discussion.
        </div>
      ) : (
        meLoaded && (
          <form onSubmit={submit} noValidate>
            <div className={styles.field}>
              <label className={styles.label} htmlFor="qa-comment">{replyTo ? "Your reply" : "Add a comment"}</label>
              <RichCommentEditor
                id="qa-comment"
                value={html}
                resetKey={resetKey}
                placeholder="Share your experience or ask a follow-up. Be kind and keep it relevant. This is general guidance, not medical advice."
                onChange={(h, n) => {
                  setHtml(h);
                  setTextLen(n);
                }}
              />
              <span className={styles.hint}>{textLen}/2000. You can use bold, lists, quotes and up to 3 links (links are marked nofollow). Comments are reviewed before they appear.</span>
            </div>
            {msg && <p className={`${styles.notice} ${msg.ok ? styles.ok : styles.err}`} role="status">{msg.text}</p>}
            <button type="submit" className={styles.btn} disabled={sending || textLen < 2 || textLen > 2000}>{sending ? "Sending…" : replyTo ? "Post reply" : "Post comment"}</button>
          </form>
        )
      )}
    </div>
  );
}
