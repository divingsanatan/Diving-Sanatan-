"use client";

import React, { useEffect, useMemo, useState } from "react";
import { DownloadCloud, ExternalLink, Pencil, Plus, Sparkles, Star, Trash2 } from "lucide-react";
import { truncate } from "@/lib/shopShared";
import { scoreTone } from "@/lib/faqShared";
import { formatDuration, scoreVideo, thumbnailOf, type VideoPost } from "@/lib/videoShared";
import {
  ApiError,
  blankVideo,
  checkStaffSession,
  createVideo,
  deleteVideo,
  fillBlanks,
  importFromBlogs,
  listVideos,
  updateVideo,
  type ImportReport,
} from "./videoApi";
import VideoEditor from "./VideoEditor";
import shop from "../shop/adminShop.module.css";
import styles from "../glossary/adminGlossary.module.css";

type StatusFilter = "all" | "published" | "draft";
type FormatFilter = "all" | "vertical" | "horizontal";
type Sort = "weakest" | "newest" | "oldest";
const PAGE_SIZE = 20;
const tone = (n: number) => styles[scoreTone(n)];

export default function AdminVideoBlogsPage() {
  const [videos, setVideos] = useState<VideoPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [authIssue, setAuthIssue] = useState("");
  const [loadError, setLoadError] = useState("");
  const [editing, setEditing] = useState<VideoPost | null>(null);
  const [formKey, setFormKey] = useState(0);
  const [saving, setSaving] = useState(false);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<StatusFilter>("all");
  const [format, setFormat] = useState<FormatFilter>("all");
  const [sort, setSort] = useState<Sort>("newest");
  const [page, setPage] = useState(1);
  const [filling, setFilling] = useState(false);
  const [importing, setImporting] = useState(false);
  const [report, setReport] = useState<ImportReport | null>(null);
  const [toast, setToast] = useState<{ msg: string; err?: boolean } | null>(null);

  const notify = (msg: string, err = false) => {
    setToast({ msg, err });
    window.setTimeout(() => setToast(null), err ? 6500 : 3800);
  };
  const handleError = (e: unknown, fallback: string) => {
    if (e instanceof ApiError && (e.status === 401 || e.status === 403 || e.status === 503)) setAuthIssue(e.message);
    else notify(e instanceof Error ? e.message : fallback, true);
  };
  const reload = async () => setVideos(await listVideos());

  useEffect(() => {
    let cancelled = false;
    Promise.all([listVideos(), checkStaffSession()])
      .then(([v, sess]) => {
        if (cancelled) return;
        setVideos(v);
        if (!sess.ok) setAuthIssue(sess.message);
      })
      .catch((e: unknown) => {
        if (cancelled) return;
        if (e instanceof ApiError && (e.status === 401 || e.status === 403 || e.status === 503)) setAuthIssue(e.message);
        else setLoadError(e instanceof Error ? e.message : "Could not load the videos.");
      })
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, []);

  const scored = useMemo(() => videos.map((v) => ({ v, s: scoreVideo(v) })), [videos]);

  const stats = useMemo(() => {
    const live = scored.filter((x) => x.v.status === "published");
    const avg = (get: (s: ReturnType<typeof scoreVideo>) => number) => (live.length ? Math.round(live.reduce((n, x) => n + get(x.s), 0) / live.length) : 0);
    const gaps = new Map<string, number>();
    for (const x of live) for (const p of [x.s.seo, x.s.geo, x.s.aeo]) for (const c of p.checks) if (!c.pass) gaps.set(c.label, (gaps.get(c.label) || 0) + 1);
    return {
      published: live.length,
      drafts: videos.length - live.length,
      overall: avg((s) => s.overall), seo: avg((s) => s.seo.score), geo: avg((s) => s.geo.score), aeo: avg((s) => s.aeo.score),
      topGaps: Array.from(gaps.entries()).sort((a, b) => b[1] - a[1]).slice(0, 6),
    };
  }, [scored, videos.length]);

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = scored
      .filter((x) => status === "all" || x.v.status === status)
      .filter((x) => format === "all" || x.v.format === format)
      .filter((x) => !q || `${x.v.title} ${x.v.slug} ${x.v.category} ${x.v.authorName}`.toLowerCase().includes(q));
    if (sort === "weakest") list.sort((a, b) => a.s.overall - b.s.overall);
    else if (sort === "oldest") list.sort((a, b) => (a.v.uploadDate || a.v.createdAt || "").localeCompare(b.v.uploadDate || b.v.createdAt || ""));
    else list.sort((a, b) => (b.v.uploadDate || b.v.createdAt || "").localeCompare(a.v.uploadDate || a.v.createdAt || ""));
    return list;
  }, [scored, query, status, format, sort]);

  const pages = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
  const pageRows = rows.slice((Math.min(page, pages) - 1) * PAGE_SIZE, Math.min(page, pages) * PAGE_SIZE);

  const openEditor = (v: VideoPost) => {
    setFormKey((k) => k + 1);
    setEditing(v);
  };

  const save = async (draft: VideoPost) => {
    setSaving(true);
    try {
      if (draft.id) {
        const r = await updateVideo(draft);
        await reload(); // the featured video may have changed
        setEditing(r.data);
        notify(r.redirectCreated ? "Saved. A 301 redirect from the old address was created." : "Video saved.");
      } else {
        const created = await createVideo(draft);
        await reload();
        setEditing(created);
        notify("Video created.");
      }
    } catch (e) {
      handleError(e, "Could not save the video.");
    } finally {
      setSaving(false);
    }
  };

  const toggleStatus = async (v: VideoPost) => {
    try {
      const next = v.status === "published" ? "draft" : "published";
      const r = await updateVideo({ id: v.id, status: next });
      setVideos((l) => l.map((x) => (x.id === v.id ? r.data : x)));
      notify(next === "published" ? "Video published." : "Video moved to drafts.");
    } catch (e) {
      handleError(e, "Could not change the status.");
    }
  };

  const remove = async (v: VideoPost) => {
    if (!window.confirm(`Delete “${truncate(v.title, 60)}” permanently? This cannot be undone.\n\nTip: set it to Draft instead to hide it.`)) return;
    try {
      await deleteVideo(v.id);
      setVideos((l) => l.filter((x) => x.id !== v.id));
      notify("Video deleted.");
    } catch (e) {
      handleError(e, "Could not delete the video.");
    }
  };

  const runFill = async () => {
    if (!window.confirm("Fill in the EMPTY basics for every video?\n\nThis adds a summary, SEO title, meta description, focus keyword and related videos ONLY where they are blank. Anything you have already written is never changed.")) return;
    setFilling(true);
    try {
      const r = await fillBlanks();
      await reload();
      notify(`Done. ${r.updated} of ${r.total} videos were updated.`);
    } catch (e) {
      handleError(e, "Could not fill the blanks.");
    } finally {
      setFilling(false);
    }
  };

  const runImport = async () => {
    if (!window.confirm(
      "Import your existing video blog posts?\n\n" +
      "• Each video post that has a real YouTube link is copied into this list (the original blog post is not changed or deleted).\n" +
      "• Videos are set to VERTICAL by default. Open any horizontal video afterwards and switch its shape.\n" +
      "• For every live video, its old /blog/… address will permanently redirect (301) to the new video page, so there is no duplicate content.\n\n" +
      "It is safe to run again: videos already imported are skipped."
    )) return;
    setImporting(true);
    try {
      const r = await importFromBlogs(true);
      await reload();
      setReport(r);
      notify(`Imported ${r.imported.length} video${r.imported.length === 1 ? "" : "s"}${r.skipped.length ? `, skipped ${r.skipped.length}` : ""}.`);
    } catch (e) {
      handleError(e, "Import failed.");
    } finally {
      setImporting(false);
    }
  };

  /* ------------------------------- editor ------------------------------- */
  if (editing) {
    return (
      <div className={shop.wrap}>
        {authIssue && <AuthBanner message={authIssue} />}
        <VideoEditor
          key={formKey}
          initial={editing}
          allVideos={videos}
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
          <h2 className={shop.h2}>Video Blogs</h2>
          <p className={shop.sub}>Vertical Shorts and normal videos, each with its own page. Improve SEO, AI search (GEO) and answer-engine (AEO) readiness video by video.</p>
        </div>
        <div className={shop.actions}>
          <a href="/blog/video-transcripts" target="_blank" rel="noopener noreferrer" className={`${shop.btn} ${shop.secondary}`}><ExternalLink size={15} /> View page</a>
          <button className={`${shop.btn} ${shop.secondary}`} onClick={() => void runImport()} disabled={importing || !!authIssue}><DownloadCloud size={15} /> {importing ? "Importing…" : "Import from blog posts"}</button>
          <button className={`${shop.btn} ${shop.secondary}`} onClick={() => void runFill()} disabled={filling || !!authIssue || videos.length === 0}><Sparkles size={15} /> {filling ? "Working…" : "Fill empty basics for all"}</button>
          <button className={`${shop.btn} ${shop.primary}`} onClick={() => openEditor(blankVideo())} disabled={!!authIssue}><Plus size={16} /> Add video</button>
        </div>
      </div>

      {report && (
        <div className={shop.panel}>
          <div className={shop.listRow} style={{ justifyContent: "space-between" }}>
            <h3 className={shop.sectionHead}>Import result</h3>
            <button type="button" className={`${shop.btn} ${shop.secondary} ${shop.small}`} onClick={() => setReport(null)}>Dismiss</button>
          </div>
          <p className={shop.hint}>
            Imported {report.imported.length}. {report.imported.filter((i) => i.status === "published").length} are live{report.redirects ? " and their old addresses now redirect here" : ""}; the rest are drafts.
            Videos start as vertical: open any horizontal one and switch its shape.
          </p>
          {report.skipped.length > 0 && (
            <>
              <h4 className={shop.sectionHead} style={{ marginTop: 8 }}>Skipped ({report.skipped.length})</h4>
              <ul className={styles.gaps}>
                {report.skipped.map((s, i) => (<li key={i}><span>{truncate(s.title, 70)}</span><strong>{s.reason}</strong></li>))}
              </ul>
            </>
          )}
        </div>
      )}

      {stats.published > 0 && (
        <>
          <div className={styles.bigScores}>
            <div className={styles.bigScore}><div className={`${styles.num} ${tone(stats.overall)}`} style={{ background: "none" }}>{stats.overall}</div><div className={styles.lbl}><strong>Overall readiness</strong><br />{stats.published} live · {stats.drafts} draft</div></div>
            <div className={styles.bigScore}><div className={`${styles.num} ${tone(stats.seo)}`} style={{ background: "none" }}>{stats.seo}</div><div className={styles.lbl}><strong>Average SEO</strong><br />Google search</div></div>
            <div className={styles.bigScore}><div className={`${styles.num} ${tone(stats.geo)}`} style={{ background: "none" }}>{stats.geo}</div><div className={styles.lbl}><strong>Average GEO</strong><br />AI citations</div></div>
            <div className={styles.bigScore}><div className={`${styles.num} ${tone(stats.aeo)}`} style={{ background: "none" }}>{stats.aeo}</div><div className={styles.lbl}><strong>Average AEO</strong><br />Answers &amp; voice</div></div>
          </div>
          {stats.topGaps.length > 0 && (
            <div className={shop.panel}>
              <h3 className={shop.sectionHead}>Biggest opportunities across your live videos</h3>
              <ul className={styles.gaps}>{stats.topGaps.map(([label, n]) => (<li key={label}><span>{label}</span><strong>{n} of {stats.published}</strong></li>))}</ul>
            </div>
          )}
        </>
      )}

      <div className={shop.filters}>
        <input className={shop.input} placeholder="Search videos" aria-label="Search videos" value={query} onChange={(e) => { setQuery(e.target.value); setPage(1); }} />
        <select className={shop.select} style={{ maxWidth: 160 }} aria-label="Status" value={status} onChange={(e) => { setStatus(e.target.value as StatusFilter); setPage(1); }}>
          <option value="all">All statuses</option><option value="published">Live</option><option value="draft">Draft</option>
        </select>
        <select className={shop.select} style={{ maxWidth: 160 }} aria-label="Shape" value={format} onChange={(e) => { setFormat(e.target.value as FormatFilter); setPage(1); }}>
          <option value="all">Any shape</option><option value="vertical">Vertical</option><option value="horizontal">Horizontal</option>
        </select>
        <select className={shop.select} style={{ maxWidth: 180 }} aria-label="Sort" value={sort} onChange={(e) => setSort(e.target.value as Sort)}>
          <option value="newest">Newest first</option><option value="oldest">Oldest first</option><option value="weakest">Weakest first</option>
        </select>
      </div>

      <div className={shop.tableCard}>
        {loading ? (
          <div className={shop.empty}>Loading videos…</div>
        ) : pageRows.length === 0 ? (
          <div className={shop.empty}>{videos.length === 0 ? "No videos yet. Use “Import from blog posts” to bring over your existing ones, or “Add video”." : "No videos match your filters."}</div>
        ) : (
          <table className={shop.table}>
            <thead><tr><th>Video</th><th>Shape</th><th>Status</th><th>SEO</th><th>GEO</th><th>AEO</th><th>Overall</th><th>Actions</th></tr></thead>
            <tbody>
              {pageRows.map(({ v, s }) => (
                <tr key={v.id}>
                  <td>
                    <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={thumbnailOf(v)} alt="" style={{ objectFit: "cover", borderRadius: 6, height: 52, width: v.format === "vertical" ? 30 : 64, flex: "none", background: "#1e1b4b" }} />
                      <div>
                        <div className={shop.prodName}>{v.featured && <Star size={13} style={{ color: "#d97706", marginRight: 4, verticalAlign: "-1px" }} aria-label="Featured" />}{truncate(v.title, 80)}</div>
                        <div className={shop.prodSlug}>{v.category ? `${v.category} · ` : ""}{v.durationSeconds ? `${formatDuration(v.durationSeconds)} · ` : ""}/blog/video-transcripts/{v.slug}</div>
                      </div>
                    </div>
                  </td>
                  <td>{v.format === "vertical" ? "Vertical" : "Horizontal"}</td>
                  <td><span className={`${shop.status} ${v.status === "published" ? shop.st_published : shop.st_draft}`}>{v.status === "published" ? "live" : "draft"}</span></td>
                  <td><span className={`${styles.pillScore} ${tone(s.seo.score)}`}>{s.seo.score}</span></td>
                  <td><span className={`${styles.pillScore} ${tone(s.geo.score)}`}>{s.geo.score}</span></td>
                  <td><span className={`${styles.pillScore} ${tone(s.aeo.score)}`}>{s.aeo.score}</span></td>
                  <td><span className={`${styles.pillScore} ${tone(s.overall)}`}>{s.overall}</span></td>
                  <td>
                    <div className={shop.actions}>
                      <button className={`${shop.btn} ${shop.secondary} ${shop.small}`} onClick={() => openEditor(v)} aria-label={`Edit ${truncate(v.title, 40)}`}><Pencil size={14} /> Edit</button>
                      <button className={`${shop.btn} ${shop.secondary} ${shop.small}`} onClick={() => void toggleStatus(v)}>{v.status === "published" ? "Unpublish" : "Publish"}</button>
                      {v.status === "published" && <a className={`${shop.btn} ${shop.secondary} ${shop.small}`} href={`/blog/video-transcripts/${v.slug}`} target="_blank" rel="noopener noreferrer" aria-label={`View ${truncate(v.title, 40)}`}><ExternalLink size={14} /></a>}
                      <button className={`${shop.btn} ${shop.danger} ${shop.small}`} onClick={() => void remove(v)} aria-label={`Delete ${truncate(v.title, 40)}`}><Trash2 size={14} /></button>
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
          <span>{rows.length} videos · page {Math.min(page, pages)} of {pages}</span>
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
