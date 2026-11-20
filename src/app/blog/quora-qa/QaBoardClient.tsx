"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useBlog } from "../BlogContext";
import { effectiveShortAnswer, isAnswered, qaPath, type QaQuestion } from "@/lib/qaShared";
import { truncate } from "@/lib/shopShared";
import styles from "./qa.module.css";

type Me = { id: string; role: string; name: string } | null;
type Mine = { id: string; slug: string; title: string; status: "pending" | "published" | "rejected"; answered: boolean; createdAt: string };
type Sort = "answered" | "newest";
type Source = "all" | "expert" | "community";

const PAGE = 10;
const fmt = (iso: string | null) =>
  iso ? new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" }) : "";

/**
 * The interactive Q&A board. The live questions arrive already loaded from the server (see page.tsx),
 * so the full text is in the page for search engines. Asking needs a real signed-in account: the server
 * checks it, nothing here is trusted. New questions wait for staff approval before they go public.
 */
export default function QaBoardClient({ initialQuestions, categories }: { initialQuestions: QaQuestion[]; categories: string[] }) {
  const { searchQuery } = useBlog();
  const [me, setMe] = useState<Me>(null);
  const [meLoaded, setMeLoaded] = useState(false);
  const [mine, setMine] = useState<Mine[]>([]);
  const [showAsk, setShowAsk] = useState(false);
  const [category, setCategory] = useState("all");
  const [source, setSource] = useState<Source>("all");
  const [sort, setSort] = useState<Sort>("answered");
  const [visible, setVisible] = useState(PAGE);

  // ask form
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [askCategory, setAskCategory] = useState("");
  const [anonymous, setAnonymous] = useState(false);
  const [sending, setSending] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const formRef = useRef<HTMLElement | null>(null);

  const loadMine = useCallback(async () => {
    try {
      const r = await fetch("/api/qa/questions?mine=1", { credentials: "same-origin", cache: "no-store" });
      if (r.ok) setMine((await r.json()).data || []);
    } catch {
      /* optional */
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/auth/me", { credentials: "same-origin", cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => {
        if (cancelled) return;
        setMe(j?.success ? { id: j.data.id, role: j.data.role, name: j.data.name || "" } : null);
        setMeLoaded(true);
        if (j?.success) void loadMine();
      })
      .catch(() => !cancelled && setMeLoaded(true));
    return () => {
      cancelled = true;
    };
  }, [loadMine]);

  // Other pages link here with ?focusAsk=true to open the form straight away
  useEffect(() => {
    const open = () => {
      setShowAsk(true);
      window.setTimeout(() => formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 50);
    };
    if (new URLSearchParams(window.location.search).get("focusAsk") === "true") open();
    window.addEventListener("open-ask-form", open);
    return () => window.removeEventListener("open-ask-form", open);
  }, []);

  const cats = useMemo(() => {
    const used = new Set(initialQuestions.map((q) => q.category).filter(Boolean));
    return categories.filter((c) => used.has(c));
  }, [initialQuestions, categories]);

  const list = useMemo(() => {
    const q = (searchQuery || "").trim().toLowerCase();
    const filtered = initialQuestions
      .filter((x) => category === "all" || x.category === category)
      .filter((x) => source === "all" || (source === "expert" ? x.source === "staff" : x.source === "member"))
      .filter((x) => !q || `${x.title} ${x.description} ${x.category} ${x.shortAnswer}`.toLowerCase().includes(q));
    const byDate = (a: QaQuestion, b: QaQuestion) => (b.publishedAt || b.createdAt).localeCompare(a.publishedAt || a.createdAt);
    return [...filtered].sort((a, b) => {
      if (sort === "answered") {
        const d = Number(isAnswered(b)) - Number(isAnswered(a));
        if (d) return d;
      }
      return byDate(a, b);
    });
  }, [initialQuestions, category, source, searchQuery, sort]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg(null);
    setSending(true);
    try {
      const r = await fetch("/api/qa/questions", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, description, category: askCategory, anonymous }),
      });
      const j = await r.json().catch(() => ({}));
      if (r.status === 401) {
        setMe(null);
        setMsg({ ok: false, text: "Your session has ended. Please sign in again to ask your question." });
      } else if (!r.ok || !j.success) {
        setMsg({ ok: false, text: j.error || "Something went wrong. Please try again." });
      } else {
        setTitle("");
        setDescription("");
        setAskCategory("");
        setAnonymous(false);
        setMsg({ ok: true, text: "Thank you! Your question has been received. It will appear on the board once our team has reviewed it." });
        void loadMine();
      }
    } catch {
      setMsg({ ok: false, text: "Could not reach the server. Please check your connection and try again." });
    } finally {
      setSending(false);
    }
  };

  const shown = list.slice(0, visible);

  return (
    <div className={styles.page}>
      <header className={styles.hero}>
        <div className={styles.heroText}>
          <p className={styles.eyebrow}>Questions &amp; Answers</p>
          <h1 className={styles.heroTitle}>Ask a Healer</h1>
          <p className={styles.heroSub}>
            Real questions about energy healing, chakras, meditation and everyday wellbeing, answered by our certified healers.
          </p>
        </div>
        <button type="button" className={styles.btn} onClick={() => setShowAsk((v) => !v)} aria-expanded={showAsk}>
          {showAsk ? "Close" : "Ask a question"}
        </button>
      </header>

      {showAsk && (
        <section className={styles.panel} aria-labelledby="ask-title" ref={formRef}>
          <h2 id="ask-title" className={styles.panelTitle}>Ask your question</h2>
          <p className={styles.panelSub}>
            Our team reviews every question before it is published, and a healer will answer it. Please don&apos;t share phone numbers, addresses or medical records.
          </p>

          {!meLoaded ? (
            <p className={styles.hint}>Checking your sign-in…</p>
          ) : !me ? (
            <div className={`${styles.notice} ${styles.info} ${styles.signin}`}>
              Please sign in to ask a question, so we can keep the board spam-free.{" "}
              <Link href="/profile" className={styles.more}>Sign in or create an account →</Link>
            </div>
          ) : (
            <form onSubmit={submit} noValidate>
              <div className={styles.field}>
                <label className={styles.label} htmlFor="qa-title">Your question *</label>
                <input id="qa-title" className={styles.input} value={title} maxLength={200} required placeholder="e.g. Can meditation help with anxiety before exams?" onChange={(e) => setTitle(e.target.value)} />
                <span className={styles.hint}>Short and specific works best. {title.length}/200</span>
              </div>
              <div className={styles.field}>
                <label className={styles.label} htmlFor="qa-desc">More details (optional)</label>
                <textarea id="qa-desc" className={styles.textarea} value={description} maxLength={1500} placeholder="Tell us a little more so the healer can answer well." onChange={(e) => setDescription(e.target.value)} />
                <span className={styles.hint}>{description.length}/1500</span>
              </div>
              <div className={styles.field}>
                <label className={styles.label} htmlFor="qa-cat">Topic</label>
                <select id="qa-cat" className={styles.select} value={askCategory} onChange={(e) => setAskCategory(e.target.value)}>
                  <option value="">Choose a topic (optional)</option>
                  {categories.map((c) => (<option key={c} value={c}>{c}</option>))}
                </select>
              </div>
              <label className={styles.check}>
                <input type="checkbox" checked={anonymous} onChange={(e) => setAnonymous(e.target.checked)} />
                <span>Ask anonymously. Your name won&apos;t be shown. Otherwise we show your first name and last initial only (like “Priya S.”).</span>
              </label>
              {msg && <p className={`${styles.notice} ${msg.ok ? styles.ok : styles.err}`} role="status">{msg.text}</p>}
              <button type="submit" className={styles.btn} disabled={sending || title.trim().length < 10}>{sending ? "Sending…" : "Submit question"}</button>
            </form>
          )}
        </section>
      )}

      {me && mine.length > 0 && (
        <section className={styles.panel} aria-labelledby="mine-title">
          <h2 id="mine-title" className={styles.panelTitle}>Your questions</h2>
          <ul className={styles.thread}>
            {mine.map((m) => (
              <li key={m.id} className={styles.comment}>
                <div className={styles.commentHead}>
                  <span className={`${styles.tag} ${m.status === "published" ? styles.tagOk : styles.tagWait}`}>
                    {m.status === "published" ? (m.answered ? "Answered" : "Live, awaiting a healer") : m.status === "pending" ? "Awaiting approval" : "Not published"}
                  </span>
                  <span className={styles.commentDate}>{fmt(m.createdAt)}</span>
                </div>
                {m.status === "published" ? <Link href={qaPath(m.slug)} className={styles.more}>{m.title}</Link> : <p className={styles.commentBody}>{m.title}</p>}
              </li>
            ))}
          </ul>
        </section>
      )}

      <div className={styles.chips} role="group" aria-label="Filter by who asked">
        {([["all", "All questions"], ["expert", "Expert answers"], ["community", "From the community"]] as [Source, string][]).map(([k, label]) => (
          <button key={k} type="button" className={`${styles.chip} ${source === k ? styles.chipOn : ""}`} aria-pressed={source === k} onClick={() => { setSource(k); setVisible(PAGE); }}>{label}</button>
        ))}
      </div>

      {cats.length > 0 && (
        <div className={styles.chips} role="group" aria-label="Filter by topic">
          <button type="button" className={`${styles.chip} ${category === "all" ? styles.chipOn : ""}`} aria-pressed={category === "all"} onClick={() => { setCategory("all"); setVisible(PAGE); }}>All topics</button>
          {cats.map((c) => (
            <button key={c} type="button" className={`${styles.chip} ${category === c ? styles.chipOn : ""}`} aria-pressed={category === c} onClick={() => { setCategory(c); setVisible(PAGE); }}>{c}</button>
          ))}
        </div>
      )}

      <div className={styles.toolbar}>
        <p className={styles.count} aria-live="polite">{list.length} {list.length === 1 ? "question" : "questions"}</p>
        <select className={`${styles.select} ${styles.sort}`} aria-label="Sort questions" value={sort} onChange={(e) => setSort(e.target.value as Sort)}>
          <option value="answered">Answered first</option>
          <option value="newest">Newest first</option>
        </select>
      </div>

      {shown.length === 0 ? (
        <div className={styles.empty}>
          {initialQuestions.length === 0 ? "No questions have been published yet. Be the first to ask!" : "No questions match your search."}
        </div>
      ) : (
        <ul className={styles.list}>
          {shown.map((q) => {
            const answered = isAnswered(q);
            return (
              <li key={q.id} className={styles.card}>
                <div className={styles.cardMeta}>
                  {q.category && <span className={styles.tag}>{q.category}</span>}
                  <span className={`${styles.tag} ${answered ? styles.tagOk : styles.tagWait}`}>{answered ? "Answered" : "Awaiting a healer"}</span>
                  <span>Asked by {q.askedByName || "a community member"}</span>
                  <span>{fmt(q.publishedAt || q.createdAt)}</span>
                </div>
                <h2 className={styles.cardTitle}><Link href={qaPath(q.slug)}>{q.title}</Link></h2>
                {answered ? (
                  <p className={styles.snippet}>{truncate(effectiveShortAnswer(q), 220)}</p>
                ) : (
                  <p className={`${styles.snippet} ${styles.snippetWait}`}>{q.description ? truncate(q.description, 160) : "A healer will answer this soon."}</p>
                )}
                <div className={styles.cardFoot}>
                  <span className={styles.healer}>
                    {answered && q.answererName ? `Answered by ${q.answererName}` : `${q.commentCount || 0} ${q.commentCount === 1 ? "comment" : "comments"}`}
                  </span>
                  <Link href={qaPath(q.slug)} className={styles.more}>{answered ? "Read the answer →" : "Open →"}</Link>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {list.length > visible && (
        <div style={{ textAlign: "center", marginBottom: 24 }}>
          <button type="button" className={`${styles.btn} ${styles.btnGhost}`} onClick={() => setVisible((v) => v + PAGE)}>Show more questions</button>
        </div>
      )}
    </div>
  );
}
