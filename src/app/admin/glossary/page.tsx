"use client";

import React, { useEffect, useMemo, useState } from "react";
import { ExternalLink, Pencil, Plus, Sparkles, Trash2 } from "lucide-react";
import { scoreTerm, scoreTone, type GlossaryEntry } from "@/lib/glossaryShared";
import {
  ApiError,
  addCategory,
  blankTerm,
  checkStaffSession,
  createTerm,
  deleteTerm,
  fillBlanks,
  listCategories,
  listTerms,
  removeCategory,
  renameCategory,
  updateTerm,
  type CategoryRow,
} from "./glossaryApi";
import TermEditor from "./TermEditor";
import shop from "../shop/adminShop.module.css";
import styles from "./adminGlossary.module.css";

type View = "terms" | "categories";
type StatusFilter = "all" | "published" | "draft";
type Sort = "weakest" | "az" | "recent";
const PAGE_SIZE = 25;

const tone = (n: number) => styles[scoreTone(n)];

export default function AdminGlossaryPage() {
  const [terms, setTerms] = useState<GlossaryEntry[]>([]);
  const [categories, setCategories] = useState<CategoryRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [authIssue, setAuthIssue] = useState("");
  const [loadError, setLoadError] = useState("");
  const [editing, setEditing] = useState<GlossaryEntry | null>(null);
  const [formKey, setFormKey] = useState(0);
  const [saving, setSaving] = useState(false);
  const [view, setView] = useState<View>("terms");
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<StatusFilter>("all");
  const [category, setCategory] = useState("all");
  const [sort, setSort] = useState<Sort>("weakest");
  const [page, setPage] = useState(1);
  const [filling, setFilling] = useState(false);
  const [newCat, setNewCat] = useState("");
  const [toast, setToast] = useState<{ msg: string; err?: boolean } | null>(null);

  const notify = (msg: string, err = false) => {
    setToast({ msg, err });
    window.setTimeout(() => setToast(null), err ? 6500 : 3800);
  };

  const handleError = (e: unknown, fallback: string) => {
    if (e instanceof ApiError && (e.status === 401 || e.status === 403 || e.status === 503)) setAuthIssue(e.message);
    else notify(e instanceof Error ? e.message : fallback, true);
  };

  const reload = async () => {
    const [t, c] = await Promise.all([listTerms(), listCategories().catch(() => [] as CategoryRow[])]);
    setTerms(t);
    setCategories(c);
  };

  useEffect(() => {
    let cancelled = false;
    Promise.all([listTerms(), listCategories().catch(() => [] as CategoryRow[]), checkStaffSession()])
      .then(([t, c, sess]) => {
        if (cancelled) return;
        setTerms(t);
        setCategories(c);
        if (!sess.ok) setAuthIssue(sess.message);
      })
      .catch((e: unknown) => {
        if (cancelled) return;
        if (e instanceof ApiError && (e.status === 401 || e.status === 403 || e.status === 503)) setAuthIssue(e.message);
        else setLoadError(e instanceof Error ? e.message : "Could not load the glossary.");
      })
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, []);

  const scored = useMemo(() => terms.map((t) => ({ t, s: scoreTerm(t) })), [terms]);

  const stats = useMemo(() => {
    const live = scored.filter((x) => x.t.status === "published");
    const avg = (f: (s: ReturnType<typeof scoreTerm>) => number) => (live.length ? Math.round(live.reduce((n, x) => n + f(x.s), 0) / live.length) : 0);
    // Most common gaps across published terms
    const gaps = new Map<string, number>();
    for (const x of live) {
      for (const p of [x.s.seo, x.s.geo, x.s.aeo]) for (const c of p.checks) if (!c.pass) gaps.set(c.label, (gaps.get(c.label) || 0) + 1);
    }
    const topGaps = Array.from(gaps.entries()).sort((a, b) => b[1] - a[1]).slice(0, 6);
    return {
      total: terms.length,
      published: live.length,
      drafts: terms.length - live.length,
      overall: avg((s) => s.overall),
      seo: avg((s) => s.seo.score),
      geo: avg((s) => s.geo.score),
      aeo: avg((s) => s.aeo.score),
      topGaps,
      weak: live.filter((x) => x.s.overall < 50).length,
    };
  }, [scored, terms.length]);

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = scored
      .filter((x) => status === "all" || x.t.status === status)
      .filter((x) => category === "all" || x.t.category === category)
      .filter((x) => !q || `${x.t.word} ${x.t.slug} ${x.t.category}`.toLowerCase().includes(q));
    if (sort === "weakest") list.sort((a, b) => a.s.overall - b.s.overall || a.t.word.localeCompare(b.t.word));
    else if (sort === "az") list.sort((a, b) => a.t.word.localeCompare(b.t.word));
    else list.sort((a, b) => (b.t.updatedAt || "").localeCompare(a.t.updatedAt || ""));
    return list;
  }, [scored, query, status, category, sort]);

  const pages = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
  const pageRows = rows.slice((Math.min(page, pages) - 1) * PAGE_SIZE, Math.min(page, pages) * PAGE_SIZE);

  const openEditor = (t: GlossaryEntry) => {
    setFormKey((k) => k + 1);
    setEditing(t);
  };

  const save = async (draft: GlossaryEntry) => {
    setSaving(true);
    try {
      if (draft.id) {
        const r = await updateTerm(draft);
        setTerms((l) => l.map((t) => (t.id === r.data.id ? r.data : t)));
        setEditing(r.data);
        notify(r.redirectCreated ? "Saved. A 301 redirect from the old address was created." : "Term saved.");
      } else {
        const created = await createTerm(draft);
        setTerms((l) => [...l, created].sort((a, b) => a.word.localeCompare(b.word)));
        setEditing(created);
        notify("Term created.");
      }
    } catch (e) {
      handleError(e, "Could not save the term.");
    } finally {
      setSaving(false);
    }
  };

  const remove = async (t: GlossaryEntry) => {
    if (!window.confirm(`Delete “${t.word}” permanently? This cannot be undone.\n\nTip: set it to Draft instead to hide it.`)) return;
    try {
      await deleteTerm(t.id);
      setTerms((l) => l.filter((x) => x.id !== t.id));
      notify("Term deleted.");
    } catch (e) {
      handleError(e, "Could not delete the term.");
    }
  };

  const runFill = async () => {
    if (!window.confirm("Fill in the EMPTY basics for every term?\n\nThis adds a quick answer, SEO title, meta description, focus keyword and related terms ONLY where they are blank. Anything you have already written is never changed. You can edit all of it afterwards.")) return;
    setFilling(true);
    try {
      const r = await fillBlanks();
      await reload();
      notify(`Done. ${r.updated} of ${r.total} terms were updated.`);
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
        <TermEditor
          key={formKey}
          initial={editing}
          categories={categories}
          allTerms={terms}
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

  /* ------------------------------- lists ------------------------------- */
  return (
    <div className={shop.wrap}>
      {authIssue && <AuthBanner message={authIssue} />}
      {loadError && <div className={`${shop.banner} ${shop.bannerErr}`}><span>{loadError}</span></div>}

      <div className={shop.topbar}>
        <div>
          <h2 className={shop.h2}>Glossary</h2>
          <p className={shop.sub}>Every term gets its own page. Improve SEO, AI search (GEO) and answer-engine (AEO) readiness term by term.</p>
        </div>
        <div className={shop.actions}>
          <a href="/blog/glossary" target="_blank" rel="noopener noreferrer" className={`${shop.btn} ${shop.secondary}`}><ExternalLink size={15} /> View glossary</a>
          <button className={`${shop.btn} ${shop.secondary}`} onClick={() => void runFill()} disabled={filling || !!authIssue || terms.length === 0}>
            <Sparkles size={15} /> {filling ? "Working…" : "Fill empty basics for all"}
          </button>
          <button className={`${shop.btn} ${shop.primary}`} onClick={() => openEditor(blankTerm())} disabled={!!authIssue}><Plus size={16} /> Add term</button>
        </div>
      </div>

      <div className={shop.tabsRow}>
        <button className={`${shop.pill} ${view === "terms" ? shop.pillOn : ""}`} onClick={() => setView("terms")}>Terms &amp; SEO health</button>
        <button className={`${shop.pill} ${view === "categories" ? shop.pillOn : ""}`} onClick={() => setView("categories")}>Categories ({categories.length})</button>
      </div>

      {view === "terms" && (
        <>
          <div className={styles.bigScores}>
            <div className={styles.bigScore}><div className={`${styles.num} ${tone(stats.overall)}`} style={{ background: "none" }}>{stats.published ? stats.overall : "–"}</div><div className={styles.lbl}><strong>Overall readiness</strong><br />{stats.published} published · {stats.drafts} draft</div></div>
            <div className={styles.bigScore}><div className={`${styles.num} ${tone(stats.seo)}`} style={{ background: "none" }}>{stats.published ? stats.seo : "–"}</div><div className={styles.lbl}><strong>Average SEO</strong><br />Google search</div></div>
            <div className={styles.bigScore}><div className={`${styles.num} ${tone(stats.geo)}`} style={{ background: "none" }}>{stats.published ? stats.geo : "–"}</div><div className={styles.lbl}><strong>Average GEO</strong><br />AI citations</div></div>
            <div className={styles.bigScore}><div className={`${styles.num} ${tone(stats.aeo)}`} style={{ background: "none" }}>{stats.published ? stats.aeo : "–"}</div><div className={styles.lbl}><strong>Average AEO</strong><br />Answers &amp; voice</div></div>
          </div>

          {stats.topGaps.length > 0 && (
            <div className={shop.panel}>
              <h3 className={shop.sectionHead}>Biggest opportunities across your published terms</h3>
              <ul className={styles.gaps}>
                {stats.topGaps.map(([label, n]) => (<li key={label}><span>{label}</span><strong>{n} of {stats.published} terms</strong></li>))}
              </ul>
              <p className={shop.hint}>{stats.weak} {stats.weak === 1 ? "term scores" : "terms score"} below 50. Sort by “Weakest first” and work down the list.</p>
            </div>
          )}

          <div className={shop.filters}>
            <input className={shop.input} placeholder="Search terms" aria-label="Search terms" value={query} onChange={(e) => { setQuery(e.target.value); setPage(1); }} />
            <select className={shop.select} style={{ maxWidth: 170 }} aria-label="Status" value={status} onChange={(e) => { setStatus(e.target.value as StatusFilter); setPage(1); }}>
              <option value="all">All statuses</option><option value="published">Published</option><option value="draft">Draft</option>
            </select>
            <select className={shop.select} style={{ maxWidth: 200 }} aria-label="Category" value={category} onChange={(e) => { setCategory(e.target.value); setPage(1); }}>
              <option value="all">All categories</option>
              {categories.map((c) => (<option key={c.id} value={c.name}>{c.name}</option>))}
            </select>
            <select className={shop.select} style={{ maxWidth: 190 }} aria-label="Sort" value={sort} onChange={(e) => setSort(e.target.value as Sort)}>
              <option value="weakest">Weakest first</option><option value="az">A to Z</option><option value="recent">Recently updated</option>
            </select>
          </div>

          <div className={shop.tableCard}>
            {loading ? (
              <div className={shop.empty}>Loading glossary…</div>
            ) : pageRows.length === 0 ? (
              <div className={shop.empty}>{terms.length === 0 ? "No terms yet. Click “Add term”." : "No terms match your filters."}</div>
            ) : (
              <table className={shop.table}>
                <thead><tr><th>Term</th><th>Category</th><th>Status</th><th>SEO</th><th>GEO</th><th>AEO</th><th>Overall</th><th>Actions</th></tr></thead>
                <tbody>
                  {pageRows.map(({ t, s }) => (
                    <tr key={t.id}>
                      <td><div className={shop.prodName}>{t.word}</div><div className={shop.prodSlug}>/blog/glossary/{t.slug}</div></td>
                      <td>{t.category || "–"}</td>
                      <td><span className={`${shop.status} ${t.status === "published" ? shop.st_published : shop.st_draft}`}>{t.status}</span></td>
                      <td><span className={`${styles.pillScore} ${tone(s.seo.score)}`}>{s.seo.score}</span></td>
                      <td><span className={`${styles.pillScore} ${tone(s.geo.score)}`}>{s.geo.score}</span></td>
                      <td><span className={`${styles.pillScore} ${tone(s.aeo.score)}`}>{s.aeo.score}</span></td>
                      <td><span className={`${styles.pillScore} ${tone(s.overall)}`}>{s.overall}</span></td>
                      <td>
                        <div className={shop.actions}>
                          <button className={`${shop.btn} ${shop.secondary} ${shop.small}`} onClick={() => openEditor(t)} aria-label={`Edit ${t.word}`}><Pencil size={14} /> Edit</button>
                          {t.status === "published" && <a className={`${shop.btn} ${shop.secondary} ${shop.small}`} href={`/blog/glossary/${t.slug}`} target="_blank" rel="noopener noreferrer" aria-label={`View ${t.word}`}><ExternalLink size={14} /></a>}
                          <button className={`${shop.btn} ${shop.danger} ${shop.small}`} onClick={() => void remove(t)} aria-label={`Delete ${t.word}`}><Trash2 size={14} /></button>
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
              <span>{rows.length} terms · page {Math.min(page, pages)} of {pages}</span>
              <span className={shop.actions}>
                <button className={`${shop.btn} ${shop.secondary} ${shop.small}`} disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Previous</button>
                <button className={`${shop.btn} ${shop.secondary} ${shop.small}`} disabled={page >= pages} onClick={() => setPage((p) => p + 1)}>Next</button>
              </span>
            </div>
          )}
        </>
      )}

      {view === "categories" && (
        <div className={shop.panel}>
          <p className={shop.hint}>Categories group terms on the glossary and help search engines understand the topic. Renaming a category updates all its terms.</p>
          <div className={shop.listRow}>
            <input className={shop.input} placeholder="New category name" aria-label="New category name" value={newCat} maxLength={60} onChange={(e) => setNewCat(e.target.value)} />
            <button className={`${shop.btn} ${shop.primary}`} disabled={!newCat.trim()} onClick={async () => {
              try { await addCategory(newCat.trim()); setNewCat(""); await reload(); notify("Category added."); } catch (e) { handleError(e, "Could not add the category."); }
            }}>Add</button>
          </div>
          {categories.map((c) => (
            <div key={c.id} className={shop.listRow}>
              <input className={shop.input} defaultValue={c.name} aria-label={`Category ${c.name}`} onBlur={async (e) => {
                const v = e.target.value.trim();
                if (!v || v === c.name) return;
                try { await renameCategory(c.id, v); await reload(); notify("Category renamed."); } catch (er) { handleError(er, "Could not rename the category."); }
              }} />
              <span className={shop.hint} style={{ whiteSpace: "nowrap" }}>{terms.filter((t) => t.category === c.name).length} terms</span>
              <button className={`${shop.btn} ${shop.danger} ${shop.small}`} aria-label={`Delete category ${c.name}`} onClick={async () => {
                if (!window.confirm(`Delete the category “${c.name}”?`)) return;
                try { await removeCategory(c.id); await reload(); notify("Category deleted."); } catch (er) { handleError(er, "Could not delete the category."); }
              }}><Trash2 size={14} /></button>
            </div>
          ))}
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
