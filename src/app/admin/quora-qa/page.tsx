"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Check, ExternalLink, Pencil, Plus, Sparkles, Trash2, X } from "lucide-react";
import { truncate } from "@/lib/shopShared";
import { scoreTone } from "@/lib/faqShared";
import { isAnswered, scoreQuestion, type QaComment, type QaQuestion, type QaStatus } from "@/lib/qaShared";
import {
  ApiError,
  STAFF_ROLES,
  blankQuestion,
  createQuestion,
  deleteComment,
  deleteQuestion,
  fillBlanks,
  listComments,
  listPractitioners,
  listQuestions,
  setCommentStatus,
  setQuestionStatus,
  updateQuestion,
  whoAmI,
  type PractitionerOption,
} from "./qaApi";
import QaEditor from "./QaEditor";
import shop from "../shop/adminShop.module.css";
import styles from "../glossary/adminGlossary.module.css";

type View = "review" | "awaiting" | "answered" | "rejected" | "all";
const PAGE_SIZE = 25;
const tone = (n: number) => styles[scoreTone(n)];
const fmt = (iso: string) => (iso ? new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" }) : "");

export default function AdminQaPage() {
  const [questions, setQuestions] = useState<QaQuestion[]>([]);
  const [practitioners, setPractitioners] = useState<PractitionerOption[]>([]);
  const [role, setRole] = useState("");
  const [loading, setLoading] = useState(true);
  const [authIssue, setAuthIssue] = useState("");
  const [loadError, setLoadError] = useState("");
  const [editing, setEditing] = useState<QaQuestion | null>(null);
  const [formKey, setFormKey] = useState(0);
  const [saving, setSaving] = useState(false);
  const [view, setView] = useState<View | null>(null);
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<"newest" | "oldest" | "recent" | "weakest">("newest");
  const [page, setPage] = useState(1);
  const [filling, setFilling] = useState(false);
  const [comments, setComments] = useState<QaComment[]>([]);
  const [commentStatus, setCommentStatusFilter] = useState<QaStatus>("pending");
  const [toast, setToast] = useState<{ msg: string; err?: boolean } | null>(null);

  const isStaff = STAFF_ROLES.includes(role);

  const notify = (msg: string, err = false) => {
    setToast({ msg, err });
    window.setTimeout(() => setToast(null), err ? 6500 : 3800);
  };
  const handleError = (e: unknown, fallback: string) => {
    if (e instanceof ApiError && (e.status === 401 || e.status === 403)) setAuthIssue(e.status === 401 ? "Your admin session has expired. Please sign in again." : "You do not have permission to do that.");
    else notify(e instanceof Error ? e.message : fallback, true);
  };

  const reloadComments = async (status: QaStatus = commentStatus) => {
    try {
      setComments(await listComments(status));
    } catch {
      setComments([]);
    }
  };

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const me = await whoAmI();
        if (cancelled) return;
        if (!me) {
          setAuthIssue("Your admin session has expired. Please sign in again.");
          return;
        }
        setRole(me.role);
        const [qs, pr] = await Promise.all([listQuestions(), listPractitioners()]);
        if (cancelled) return;
        setQuestions(qs);
        setPractitioners(pr);
        if (STAFF_ROLES.includes(me.role)) {
          try {
            setComments(await listComments("pending"));
          } catch {
            /* queue is optional */
          }
        }
      } catch (e) {
        if (cancelled) return;
        if (e instanceof ApiError && (e.status === 401 || e.status === 403)) setAuthIssue(e.message);
        else setLoadError(e instanceof Error ? e.message : "Could not load the questions.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const scored = useMemo(() => questions.map((q) => ({ q, s: isAnswered(q) ? scoreQuestion(q) : null })), [questions]);

  const counts = useMemo(() => ({
    review: questions.filter((q) => q.status === "pending").length,
    awaiting: questions.filter((q) => q.status === "published" && !isAnswered(q)).length,
    answered: questions.filter((q) => q.status === "published" && isAnswered(q)).length,
    rejected: questions.filter((q) => q.status === "rejected").length,
    all: questions.length,
  }), [questions]);

  // Healers start on the questions that need an answer; staff start on the review queue
  const activeView: View = view ?? (isStaff ? (counts.review > 0 ? "review" : "awaiting") : "awaiting");

  const stats = useMemo(() => {
    const live = scored.filter((x) => x.s && x.q.status === "published");
    const avg = (get: (s: NonNullable<(typeof live)[number]["s"]>) => number) => (live.length ? Math.round(live.reduce((n, x) => n + get(x.s!), 0) / live.length) : 0);
    const gaps = new Map<string, number>();
    for (const x of live) for (const p of [x.s!.seo, x.s!.geo, x.s!.aeo]) for (const c of p.checks) if (!c.pass) gaps.set(c.label, (gaps.get(c.label) || 0) + 1);
    return { answered: live.length, overall: avg((s) => s.overall), seo: avg((s) => s.seo.score), geo: avg((s) => s.geo.score), aeo: avg((s) => s.aeo.score), topGaps: Array.from(gaps.entries()).sort((a, b) => b[1] - a[1]).slice(0, 5) };
  }, [scored]);

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return scored
      .filter(({ q: x }) => {
        if (activeView === "review") return x.status === "pending";
        if (activeView === "awaiting") return x.status === "published" && !isAnswered(x);
        if (activeView === "answered") return x.status === "published" && isAnswered(x);
        if (activeView === "rejected") return x.status === "rejected";
        return true;
      })
      .filter(({ q: x }) => (isStaff ? true : x.status === "published")) // healers only see live questions
      .filter(({ q: x }) => !q || `${x.title} ${x.slug} ${x.category} ${x.askedByName}`.toLowerCase().includes(q))
      .sort((a, b) => {
        if (sort === "weakest") return (a.s?.overall ?? 101) - (b.s?.overall ?? 101) || a.q.title.localeCompare(b.q.title);
        if (sort === "oldest") return (a.q.createdAt || "").localeCompare(b.q.createdAt || "");
        if (sort === "recent") return (b.q.updatedAt || "").localeCompare(a.q.updatedAt || "");
        return (b.q.createdAt || "").localeCompare(a.q.createdAt || "");
      });
  }, [scored, activeView, query, isStaff, sort]);

  const pages = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
  const pageRows = rows.slice((Math.min(page, pages) - 1) * PAGE_SIZE, Math.min(page, pages) * PAGE_SIZE);

  const openEditor = (q: QaQuestion) => {
    setFormKey((k) => k + 1);
    setEditing(q);
  };

  const replace = (next: QaQuestion) => setQuestions((l) => l.map((x) => (x.id === next.id ? { ...next, commentCount: x.commentCount } : x)));

  const save = async (draft: QaQuestion) => {
    setSaving(true);
    try {
      if (draft.id) {
        const r = await updateQuestion(draft);
        replace(r.data);
        setEditing(r.data);
        notify(r.redirectCreated ? "Saved. A 301 redirect from the old address was created." : "Saved.");
      } else {
        const created = await createQuestion(draft);
        setQuestions((l) => [created, ...l]);
        setEditing(created);
        notify("Q&A created.");
      }
    } catch (e) {
      handleError(e, "Could not save.");
    } finally {
      setSaving(false);
    }
  };

  const decide = async (q: QaQuestion, status: QaStatus) => {
    let note: string | undefined;
    if (status === "rejected") {
      const reason = window.prompt("Optional private note (why was it rejected?). Only the team sees this.", q.moderationNote || "");
      if (reason === null) return;
      note = reason;
    }
    try {
      const r = await setQuestionStatus(q.id, status, note);
      replace(r.data);
      notify(status === "published" ? "Approved and published." : status === "rejected" ? "Question rejected." : "Updated.");
    } catch (e) {
      handleError(e, "Could not update.");
    }
  };

  const remove = async (q: QaQuestion) => {
    if (!window.confirm(`Delete “${truncate(q.title, 60)}” and all its comments permanently? This cannot be undone.\n\nTip: use Reject to hide it instead.`)) return;
    try {
      await deleteQuestion(q.id);
      setQuestions((l) => l.filter((x) => x.id !== q.id));
      notify("Question deleted.");
    } catch (e) {
      handleError(e, "Could not delete.");
    }
  };

  const runFill = async () => {
    if (!window.confirm("Fill in the EMPTY basics for every ANSWERED question?\n\nThis adds a quick answer, SEO title, meta description, focus keyword and related questions ONLY where they are blank. Anything you have already written is never changed.")) return;
    setFilling(true);
    try {
      const r = await fillBlanks();
      setQuestions(await listQuestions());
      notify(`Done. ${r.updated} of ${r.total} answered questions were updated.`);
    } catch (e) {
      handleError(e, "Could not fill the blanks.");
    } finally {
      setFilling(false);
    }
  };

  const moderateComment = async (c: QaComment, status: QaStatus) => {
    try {
      await setCommentStatus(c.id, status);
      await reloadComments();
      setQuestions(await listQuestions());
      notify(status === "published" ? "Comment approved." : "Comment rejected.");
    } catch (e) {
      handleError(e, "Could not update the comment.");
    }
  };

  const removeComment = async (c: QaComment) => {
    if (!window.confirm("Delete this comment permanently?")) return;
    try {
      await deleteComment(c.id);
      await reloadComments();
      notify("Comment deleted.");
    } catch (e) {
      handleError(e, "Could not delete the comment.");
    }
  };

  /* ------------------------------- editor ------------------------------- */
  if (editing) {
    return (
      <div className={shop.wrap}>
        {authIssue && <AuthBanner message={authIssue} />}
        <QaEditor
          key={formKey}
          initial={editing}
          allQuestions={questions}
          practitioners={practitioners}
          isStaff={isStaff}
          saving={saving}
          onSave={save}
          onError={(m) => notify(m, true)}
          onBack={(dirty) => {
            if (dirty && !window.confirm("You have unsaved changes. Leave without saving?")) return;
            setEditing(null);
          }}
        />
        {toast && <div className={`${shop.toast} ${toast.err ? shop.toastErr : ""}`} role="status">{toast.msg}</div>}
      </div>
    );
  }

  const TABS: { id: View; label: string; count: number; staffOnly?: boolean }[] = [
    { id: "review", label: "Needs review", count: counts.review, staffOnly: true },
    { id: "awaiting", label: "Awaiting answer", count: counts.awaiting },
    { id: "answered", label: "Answered", count: counts.answered },
    { id: "rejected", label: "Rejected", count: counts.rejected, staffOnly: true },
    { id: "all", label: "All", count: counts.all, staffOnly: true },
  ];

  /* ------------------------------- list ------------------------------- */
  return (
    <div className={shop.wrap}>
      {authIssue && <AuthBanner message={authIssue} />}
      {loadError && <div className={`${shop.banner} ${shop.bannerErr}`}><span>{loadError}</span></div>}

      <div className={shop.topbar}>
        <div>
          <h2 className={shop.h2}>Q&amp;A Board</h2>
          <p className={shop.sub}>
            {isStaff
              ? "Approve new questions, have a healer answer them, and optimise each answered question for SEO, AI search (GEO) and answer engines (AEO)."
              : "Questions waiting for a healer's answer. Open one to write the official answer."}
          </p>
        </div>
        <div className={shop.actions}>
          <a href="/blog/quora-qa" target="_blank" rel="noopener noreferrer" className={`${shop.btn} ${shop.secondary}`}><ExternalLink size={15} /> View board</a>
          {isStaff && (
            <>
              <button className={`${shop.btn} ${shop.secondary}`} onClick={() => void runFill()} disabled={filling || !!authIssue || stats.answered === 0}><Sparkles size={15} /> {filling ? "Working…" : "Fill empty basics for all"}</button>
              <button className={`${shop.btn} ${shop.primary}`} onClick={() => openEditor(blankQuestion())} disabled={!!authIssue}><Plus size={16} /> Add Q&amp;A</button>
            </>
          )}
        </div>
      </div>

      {isStaff && stats.answered > 0 && (
        <>
          <div className={styles.bigScores}>
            <div className={styles.bigScore}><div className={`${styles.num} ${tone(stats.overall)}`} style={{ background: "none" }}>{stats.overall}</div><div className={styles.lbl}><strong>Overall readiness</strong><br />{stats.answered} answered · {counts.awaiting} waiting</div></div>
            <div className={styles.bigScore}><div className={`${styles.num} ${tone(stats.seo)}`} style={{ background: "none" }}>{stats.seo}</div><div className={styles.lbl}><strong>Average SEO</strong><br />Google search</div></div>
            <div className={styles.bigScore}><div className={`${styles.num} ${tone(stats.geo)}`} style={{ background: "none" }}>{stats.geo}</div><div className={styles.lbl}><strong>Average GEO</strong><br />AI citations</div></div>
            <div className={styles.bigScore}><div className={`${styles.num} ${tone(stats.aeo)}`} style={{ background: "none" }}>{stats.aeo}</div><div className={styles.lbl}><strong>Average AEO</strong><br />Answers &amp; voice</div></div>
          </div>
          {stats.topGaps.length > 0 && (
            <div className={shop.panel}>
              <h3 className={shop.sectionHead}>Biggest opportunities across answered questions</h3>
              <ul className={styles.gaps}>{stats.topGaps.map(([label, n]) => (<li key={label}><span>{label}</span><strong>{n} of {stats.answered}</strong></li>))}</ul>
            </div>
          )}
        </>
      )}

      <div className={shop.tabs} role="tablist" aria-label="Question lists">
        {TABS.filter((t) => isStaff || !t.staffOnly).map((t) => (
          <button key={t.id} type="button" role="tab" aria-selected={activeView === t.id} className={`${shop.tab} ${activeView === t.id ? shop.tabOn : ""}`} onClick={() => { setView(t.id); setPage(1); }}>
            {t.label} · {t.count}
          </button>
        ))}
      </div>

      <div className={shop.filters}>
        <input className={shop.input} placeholder="Search questions" aria-label="Search questions" value={query} onChange={(e) => { setQuery(e.target.value); setPage(1); }} />
        <select className={shop.select} aria-label="Sort questions" value={sort} onChange={(e) => { setSort(e.target.value as typeof sort); setPage(1); }}>
          <option value="newest">Newest first</option><option value="recent">Recently updated</option><option value="oldest">Oldest first</option><option value="weakest">Weakest score first</option>
        </select>
      </div>

      <div className={shop.tableCard}>
        {loading ? (
          <div className={shop.empty}>Loading questions…</div>
        ) : pageRows.length === 0 ? (
          <div className={shop.empty}>{questions.length === 0 ? "No questions yet. Visitors can ask from the Q&A Board, or use “Add Q&A”." : "Nothing here."}</div>
        ) : (
          <table className={shop.table}>
            <thead><tr><th>Question</th><th>Status</th><th>Asked by</th><th>Comments</th><th>Reviewed</th><th>SEO</th><th>GEO</th><th>AEO</th><th>Overall</th><th>Actions</th></tr></thead>
            <tbody>
              {pageRows.map(({ q, s }) => (
                <tr key={q.id}>
                  <td><div className={shop.prodName}>{truncate(q.title, 90)}</div><div className={shop.prodSlug}>{q.category ? `${q.category} · ` : ""}{fmt(q.createdAt)} · /blog/quora-qa/{q.slug}</div></td>
                  <td>
                    <span className={`${shop.status} ${q.status === "published" ? shop.st_published : q.status === "rejected" ? shop.st_archived : shop.st_draft}`}>
                      {q.status === "pending" ? "needs review" : q.status === "published" ? (isAnswered(q) ? "answered" : "awaiting answer") : "rejected"}
                    </span>
                  </td>
                  <td>{q.anonymous ? "Anonymous" : q.askedByName || "–"}</td>
                  <td>{q.commentCount || 0}</td>
                  <td>{q.reviewedBy?.trim() ? <Check size={16} aria-label={`Reviewed by ${q.reviewedBy}`} /> : "–"}</td>
                  <td>{s ? <span className={`${styles.pillScore} ${tone(s.seo.score)}`}>{s.seo.score}</span> : "–"}</td>
                  <td>{s ? <span className={`${styles.pillScore} ${tone(s.geo.score)}`}>{s.geo.score}</span> : "–"}</td>
                  <td>{s ? <span className={`${styles.pillScore} ${tone(s.aeo.score)}`}>{s.aeo.score}</span> : "–"}</td>
                  <td>{s ? <span className={`${styles.pillScore} ${tone(s.overall)}`}>{s.overall}</span> : "–"}</td>
                  <td>
                    <div className={shop.actions}>
                      {isStaff && q.status === "pending" && (
                        <>
                          <button className={`${shop.btn} ${shop.primary} ${shop.small}`} onClick={() => void decide(q, "published")} aria-label={`Approve ${truncate(q.title, 40)}`}><Check size={14} /> Approve</button>
                          <button className={`${shop.btn} ${shop.secondary} ${shop.small}`} onClick={() => void decide(q, "rejected")} aria-label={`Reject ${truncate(q.title, 40)}`}><X size={14} /> Reject</button>
                        </>
                      )}
                      <button className={`${shop.btn} ${shop.secondary} ${shop.small}`} onClick={() => openEditor(q)} aria-label={`${isAnswered(q) ? "Edit" : "Answer"} ${truncate(q.title, 40)}`}><Pencil size={14} /> {isAnswered(q) || isStaff ? "Edit" : "Answer"}</button>
                      {q.status === "published" && <a className={`${shop.btn} ${shop.secondary} ${shop.small}`} href={`/blog/quora-qa/${q.slug}`} target="_blank" rel="noopener noreferrer" aria-label={`View ${truncate(q.title, 40)}`}><ExternalLink size={14} /></a>}
                      {isStaff && <button className={`${shop.btn} ${shop.danger} ${shop.small}`} onClick={() => void remove(q)} aria-label={`Delete ${truncate(q.title, 40)}`}><Trash2 size={14} /></button>}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      {pages > 1 && (
        <div className={styles.pager}>
          <span>{rows.length} questions · page {Math.min(page, pages)} of {pages}</span>
          <span className={shop.actions}>
            <button className={`${shop.btn} ${shop.secondary} ${shop.small}`} disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Previous</button>
            <button className={`${shop.btn} ${shop.secondary} ${shop.small}`} disabled={page >= pages} onClick={() => setPage((p) => p + 1)}>Next</button>
          </span>
        </div>
      )}

      {isStaff && (
        <div className={shop.panel}>
          <div className={shop.listRow} style={{ justifyContent: "space-between", flexWrap: "wrap" }}>
            <h3 className={shop.sectionHead}>Comments</h3>
            <select className={shop.select} style={{ maxWidth: 200 }} aria-label="Comment status" value={commentStatus} onChange={(e) => { const s = e.target.value as QaStatus; setCommentStatusFilter(s); void reloadComments(s); }}>
              <option value="pending">Awaiting approval</option>
              <option value="published">Published</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
          {comments.length === 0 ? (
            <p className={shop.hint}>No {commentStatus === "pending" ? "comments awaiting approval" : `${commentStatus} comments`}.</p>
          ) : (
            <ul className={styles.pickList} style={{ maxHeight: "none" }}>
              {comments.map((c) => (
                <li key={c.id} className={styles.pickItem} style={{ cursor: "default", display: "block" }}>
                  <div className={shop.hint}>{c.authorName} · {c.authorRole} · {fmt(c.createdAt)} · on “{truncate(c.questionTitle || "", 60)}”{c.parentId ? " (reply)" : ""}</div>
                  <p style={{ margin: "4px 0 8px", whiteSpace: "pre-wrap" }}>{c.body}</p>
                  <div className={shop.actions}>
                    {c.status !== "published" && <button type="button" className={`${shop.btn} ${shop.primary} ${shop.small}`} onClick={() => void moderateComment(c, "published")}><Check size={14} /> Approve</button>}
                    {c.status !== "rejected" && <button type="button" className={`${shop.btn} ${shop.secondary} ${shop.small}`} onClick={() => void moderateComment(c, "rejected")}><X size={14} /> {c.status === "published" ? "Hide" : "Reject"}</button>}
                    <button type="button" className={`${shop.btn} ${shop.danger} ${shop.small}`} onClick={() => void removeComment(c)} aria-label="Delete comment"><Trash2 size={14} /></button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {toast && <div className={`${shop.toast} ${toast.err ? shop.toastErr : ""}`} role="status">{toast.msg}</div>}
    </div>
  );
}

function AuthBanner({ message }: { message: string }) {
  return (
    <div className={shop.banner} role="alert">
      <span>{message}</span>
      <a href="/admin/login?logout=1" className={`${shop.btn} ${shop.secondary} ${shop.small}`}>Sign in again</a>
    </div>
  );
}
