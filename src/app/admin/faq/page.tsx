"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Check, ExternalLink, Pencil, Plus, Sparkles, Trash2 } from "lucide-react";
import { truncate } from "@/lib/shopShared";
import { scoreFaq, scoreTone, type FaqEntry } from "@/lib/faqShared";
import {
  ApiError,
  blankFaq,
  checkStaffSession,
  createFaq,
  deleteFaq,
  fillBlanks,
  listFaqs,
  updateFaq,
} from "./faqApi";
import FaqEditor from "./FaqEditor";
import shop from "../shop/adminShop.module.css";
import styles from "../glossary/adminGlossary.module.css";

type StatusFilter = "all" | "published" | "draft";
type Sort = "weakest" | "oldest" | "recent";
const PAGE_SIZE = 25;

const tone = (n: number) => styles[scoreTone(n)];

export default function AdminFAQPage() {
  const [faqs, setFaqs] = useState<FaqEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [authIssue, setAuthIssue] = useState("");
  const [loadError, setLoadError] = useState("");
  const [editing, setEditing] = useState<FaqEntry | null>(null);
  const [formKey, setFormKey] = useState(0);
  const [saving, setSaving] = useState(false);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<StatusFilter>("all");
  const [sort, setSort] = useState<Sort>("weakest");
  const [page, setPage] = useState(1);
  const [filling, setFilling] = useState(false);
  const [toast, setToast] = useState<{ msg: string; err?: boolean } | null>(null);

  const notify = (msg: string, err = false) => {
    setToast({ msg, err });
    window.setTimeout(() => setToast(null), err ? 6500 : 3800);
  };

  const handleError = (e: unknown, fallback: string) => {
    if (e instanceof ApiError && (e.status === 401 || e.status === 403 || e.status === 503)) setAuthIssue(e.message);
    else notify(e instanceof Error ? e.message : fallback, true);
  };

  const reload = async () => setFaqs(await listFaqs());

  useEffect(() => {
    let cancelled = false;
    Promise.all([listFaqs(), checkStaffSession()])
      .then(([f, sess]) => {
        if (cancelled) return;
        setFaqs(f);
        if (!sess.ok) setAuthIssue(sess.message);
      })
      .catch((e: unknown) => {
        if (cancelled) return;
        if (e instanceof ApiError && (e.status === 401 || e.status === 403 || e.status === 503)) setAuthIssue(e.message);
        else setLoadError(e instanceof Error ? e.message : "Could not load the FAQs.");
      })
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, []);

  const scored = useMemo(() => faqs.map((f) => ({ f, s: scoreFaq(f) })), [faqs]);

  const stats = useMemo(() => {
    const live = scored.filter((x) => x.f.status === "published");
    const avg = (get: (s: ReturnType<typeof scoreFaq>) => number) => (live.length ? Math.round(live.reduce((n, x) => n + get(x.s), 0) / live.length) : 0);
    // Most common gaps across published FAQs
    const gaps = new Map<string, number>();
    for (const x of live) {
      for (const p of [x.s.seo, x.s.geo, x.s.aeo]) for (const c of p.checks) if (!c.pass) gaps.set(c.label, (gaps.get(c.label) || 0) + 1);
    }
    const topGaps = Array.from(gaps.entries()).sort((a, b) => b[1] - a[1]).slice(0, 6);
    return {
      total: faqs.length,
      published: live.length,
      drafts: faqs.length - live.length,
      overall: avg((s) => s.overall),
      seo: avg((s) => s.seo.score),
      geo: avg((s) => s.geo.score),
      aeo: avg((s) => s.aeo.score),
      topGaps,
      weak: live.filter((x) => x.s.overall < 50).length,
    };
  }, [scored, faqs.length]);

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = scored
      .filter((x) => status === "all" || x.f.status === status)
      .filter((x) => !q || `${x.f.question} ${x.f.slug} ${x.f.focusKeyword}`.toLowerCase().includes(q));
    if (sort === "weakest") list.sort((a, b) => a.s.overall - b.s.overall || a.f.question.localeCompare(b.f.question));
    else if (sort === "oldest") list.sort((a, b) => (a.f.createdAt || "").localeCompare(b.f.createdAt || ""));
    else list.sort((a, b) => (b.f.updatedAt || "").localeCompare(a.f.updatedAt || ""));
    return list;
  }, [scored, query, status, sort]);

  const pages = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
  const pageRows = rows.slice((Math.min(page, pages) - 1) * PAGE_SIZE, Math.min(page, pages) * PAGE_SIZE);

  const openEditor = (f: FaqEntry) => {
    setFormKey((k) => k + 1);
    setEditing(f);
  };

  const save = async (draft: FaqEntry) => {
    setSaving(true);
    try {
      if (draft.id) {
        const r = await updateFaq(draft);
        setFaqs((l) => l.map((f) => (f.id === r.data.id ? r.data : f)));
        setEditing(r.data);
        notify(r.redirectCreated ? "Saved. A 301 redirect from the old address was created." : "FAQ saved.");
      } else {
        const created = await createFaq(draft);
        setFaqs((l) => [...l, created]);
        setEditing(created);
        notify("FAQ created.");
      }
    } catch (e) {
      handleError(e, "Could not save the FAQ.");
    } finally {
      setSaving(false);
    }
  };

  const remove = async (f: FaqEntry) => {
    if (!window.confirm(`Delete “${truncate(f.question, 60)}” permanently? This cannot be undone.\n\nTip: set it to Draft instead to hide it.`)) return;
    try {
      await deleteFaq(f.id);
      setFaqs((l) => l.filter((x) => x.id !== f.id));
      notify("FAQ deleted.");
    } catch (e) {
      handleError(e, "Could not delete the FAQ.");
    }
  };

  const runFill = async () => {
    if (!window.confirm("Fill in the EMPTY basics for every FAQ?\n\nThis adds a quick answer, SEO title, meta description, focus keyword and related questions ONLY where they are blank. Anything you have already written is never changed. You can edit all of it afterwards.")) return;
    setFilling(true);
    try {
      const r = await fillBlanks();
      await reload();
      notify(`Done. ${r.updated} of ${r.total} FAQs were updated.`);
    } catch (e) {
      handleError(e, "Could not fill the blanks.");
    } finally {
      setFilling(false);
    }
  };

  /* ------------------------------- editor ------------------------------- */
  if (editing) {
    return (
      <div className={shop.wrap}>
        {authIssue && <AuthBanner message={authIssue} />}
        <FaqEditor
          key={formKey}
          initial={editing}
          allFaqs={faqs}
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

  /* ------------------------------- list ------------------------------- */
  return (
    <div className={shop.wrap}>
      {authIssue && <AuthBanner message={authIssue} />}
      {loadError && <div className={`${shop.banner} ${shop.bannerErr}`}><span>{loadError}</span></div>}

      <div className={shop.topbar}>
        <div>
          <h2 className={shop.h2}>FAQs</h2>
          <p className={shop.sub}>Every question gets its own page. Improve SEO, AI search (GEO) and answer-engine (AEO) readiness question by question.</p>
        </div>
        <div className={shop.actions}>
          <a href="/blog/faq" target="_blank" rel="noopener noreferrer" className={`${shop.btn} ${shop.secondary}`}><ExternalLink size={15} /> View FAQ</a>
          <button className={`${shop.btn} ${shop.secondary}`} onClick={() => void runFill()} disabled={filling || !!authIssue || faqs.length === 0}>
            <Sparkles size={15} /> {filling ? "Working…" : "Fill empty basics for all"}
          </button>
          <button className={`${shop.btn} ${shop.primary}`} onClick={() => openEditor(blankFaq())} disabled={!!authIssue}><Plus size={16} /> Add FAQ</button>
        </div>
      </div>

      <div className={styles.bigScores}>
        <div className={styles.bigScore}><div className={`${styles.num} ${tone(stats.overall)}`} style={{ background: "none" }}>{stats.published ? stats.overall : "–"}</div><div className={styles.lbl}><strong>Overall readiness</strong><br />{stats.published} published · {stats.drafts} draft</div></div>
        <div className={styles.bigScore}><div className={`${styles.num} ${tone(stats.seo)}`} style={{ background: "none" }}>{stats.published ? stats.seo : "–"}</div><div className={styles.lbl}><strong>Average SEO</strong><br />Google search</div></div>
        <div className={styles.bigScore}><div className={`${styles.num} ${tone(stats.geo)}`} style={{ background: "none" }}>{stats.published ? stats.geo : "–"}</div><div className={styles.lbl}><strong>Average GEO</strong><br />AI citations</div></div>
        <div className={styles.bigScore}><div className={`${styles.num} ${tone(stats.aeo)}`} style={{ background: "none" }}>{stats.published ? stats.aeo : "–"}</div><div className={styles.lbl}><strong>Average AEO</strong><br />Answers &amp; voice</div></div>
      </div>

      {stats.topGaps.length > 0 && (
        <div className={shop.panel}>
          <h3 className={shop.sectionHead}>Biggest opportunities across your published FAQs</h3>
          <ul className={styles.gaps}>
            {stats.topGaps.map(([label, n]) => (<li key={label}><span>{label}</span><strong>{n} of {stats.published} FAQs</strong></li>))}
          </ul>
          <p className={shop.hint}>{stats.weak} {stats.weak === 1 ? "FAQ scores" : "FAQs score"} below 50. Sort by “Weakest first” and work down the list.</p>
        </div>
      )}

      <div className={shop.filters}>
        <input className={shop.input} placeholder="Search questions" aria-label="Search questions" value={query} onChange={(e) => { setQuery(e.target.value); setPage(1); }} />
        <select className={shop.select} style={{ maxWidth: 170 }} aria-label="Status" value={status} onChange={(e) => { setStatus(e.target.value as StatusFilter); setPage(1); }}>
          <option value="all">All statuses</option><option value="published">Published</option><option value="draft">Draft</option>
        </select>
        <select className={shop.select} style={{ maxWidth: 190 }} aria-label="Sort" value={sort} onChange={(e) => setSort(e.target.value as Sort)}>
          <option value="weakest">Weakest first</option><option value="oldest">Oldest first</option><option value="recent">Recently updated</option>
        </select>
      </div>

      <div className={shop.tableCard}>
        {loading ? (
          <div className={shop.empty}>Loading FAQs…</div>
        ) : pageRows.length === 0 ? (
          <div className={shop.empty}>{faqs.length === 0 ? "No FAQs yet. Click “Add FAQ”." : "No FAQs match your filters."}</div>
        ) : (
          <table className={shop.table}>
            <thead><tr><th>Question</th><th>Status</th><th>Verified</th><th>SEO</th><th>GEO</th><th>AEO</th><th>Overall</th><th>Actions</th></tr></thead>
            <tbody>
              {pageRows.map(({ f, s }) => (
                <tr key={f.id}>
                  <td><div className={shop.prodName}>{truncate(f.question, 90)}</div><div className={shop.prodSlug}>/blog/faq/{f.slug}</div></td>
                  <td><span className={`${shop.status} ${f.status === "published" ? shop.st_published : shop.st_draft}`}>{f.status}</span></td>
                  <td>{f.verified ? <Check size={16} aria-label="Verified badge shown" /> : "–"}</td>
                  <td><span className={`${styles.pillScore} ${tone(s.seo.score)}`}>{s.seo.score}</span></td>
                  <td><span className={`${styles.pillScore} ${tone(s.geo.score)}`}>{s.geo.score}</span></td>
                  <td><span className={`${styles.pillScore} ${tone(s.aeo.score)}`}>{s.aeo.score}</span></td>
                  <td><span className={`${styles.pillScore} ${tone(s.overall)}`}>{s.overall}</span></td>
                  <td>
                    <div className={shop.actions}>
                      <button className={`${shop.btn} ${shop.secondary} ${shop.small}`} onClick={() => openEditor(f)} aria-label={`Edit ${truncate(f.question, 40)}`}><Pencil size={14} /> Edit</button>
                      {f.status === "published" && <a className={`${shop.btn} ${shop.secondary} ${shop.small}`} href={`/blog/faq/${f.slug}`} target="_blank" rel="noopener noreferrer" aria-label={`View ${truncate(f.question, 40)}`}><ExternalLink size={14} /></a>}
                      <button className={`${shop.btn} ${shop.danger} ${shop.small}`} onClick={() => void remove(f)} aria-label={`Delete ${truncate(f.question, 40)}`}><Trash2 size={14} /></button>
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
          <span>{rows.length} FAQs · page {Math.min(page, pages)} of {pages}</span>
          <span className={shop.actions}>
            <button className={`${shop.btn} ${shop.secondary} ${shop.small}`} disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Previous</button>
            <button className={`${shop.btn} ${shop.secondary} ${shop.small}`} disabled={page >= pages} onClick={() => setPage((p) => p + 1)}>Next</button>
          </span>
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
