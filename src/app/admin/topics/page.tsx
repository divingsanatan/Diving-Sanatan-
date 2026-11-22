"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { ArrowDown, ArrowUp, Check, ExternalLink, Pencil, Plus, Save, Search, Sparkles, Trash2, X } from "lucide-react";
import RichTextEditor from "@/components/ui/RichTextEditor";
import { truncate, wordCount, stripHtml } from "@/lib/shopShared";
import {
  ITEM_LABEL,
  ROLE_LABEL,
  readinessChecks,
  topicPath,
  type Topic,
  type TopicItemType,
  type TopicRole,
} from "@/lib/topicsShared";
import shop from "../shop/adminShop.module.css";

interface Member { type: TopicItemType; slug: string; role: TopicRole; sortOrder: number; title: string; live: boolean }
interface Hit { type: TopicItemType; slug: string; title: string; published: boolean; score?: number; matched?: string[] }
type ListTopic = Topic & { counts: Record<string, number> };

class ApiError extends Error { status: number; constructor(m: string, s: number) { super(m); this.status = s; } }

async function api<T>(url: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers);
  if (init.body) headers.set("Content-Type", "application/json");
  const res = await fetch(url, { ...init, headers, credentials: "same-origin", cache: "no-store" });
  const json = await res.json().catch(() => ({}));
  if (!res.ok || !json.success) throw new ApiError(json.error || `Request failed (${res.status})`, res.status);
  return json.data as T;
}

const blank = (): Topic => ({
  id: "", slug: "", title: "", shortAnswer: "", overviewHtml: "", keyTakeaways: [], sources: [], sameAs: [], alternateQuestions: [],
  focusKeyword: "", secondaryKeywords: [], metaTitle: "", metaDescription: "", canonicalUrl: "", ogImage: "", authorName: "Diving Sanatan Team",
  authorCredentials: "", reviewedBy: "", lastReviewed: null, ctaLabel: "Book a session", ctaUrl: "/explore-services", ctaText: "", status: "draft",
  noindex: false, sortOrder: 0, publishedAt: null, createdAt: "", updatedAt: "",
});

const slugOf = (t: string) => t.toLowerCase().replace(/&/g, " and ").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
const roleOptions: TopicRole[] = ["pillar", "cluster", "supporting"];

function StringList({ label, items, onChange, placeholder, max = 12 }: { label: string; items: string[]; onChange: (v: string[]) => void; placeholder?: string; max?: number }) {
  return (
    <div className={shop.field}>
      <span className={shop.label}>{label}</span>
      {items.map((t, i) => (
        <div key={i} className={shop.listRow} style={{ marginBottom: 6 }}>
          <input className={shop.input} value={t} placeholder={placeholder} aria-label={`${label} ${i + 1}`} onChange={(e) => onChange(items.map((x, j) => (j === i ? e.target.value : x)))} />
          <button type="button" className={`${shop.btn} ${shop.secondary} ${shop.small}`} onClick={() => onChange(items.filter((_, j) => j !== i))} aria-label={`Remove ${label} ${i + 1}`}><X size={14} /></button>
        </div>
      ))}
      {items.length < max && <button type="button" className={`${shop.btn} ${shop.secondary} ${shop.small}`} onClick={() => onChange([...items, ""])}><Plus size={14} /> Add</button>}
    </div>
  );
}

export default function AdminTopicsPage() {
  const [topics, setTopics] = useState<ListTopic[]>([]);
  const [gaps, setGaps] = useState<{ total: number; items: Hit[] }>({ total: 0, items: [] });
  const [loading, setLoading] = useState(true);
  const [authIssue, setAuthIssue] = useState("");
  const [toast, setToast] = useState<{ msg: string; err?: boolean } | null>(null);

  const [editing, setEditing] = useState(false);
  const [topicId, setTopicId] = useState<string | null>(null);
  const [draft, setDraft] = useState<Topic>(blank());
  const [members, setMembers] = useState<Member[]>([]);
  const [saving, setSaving] = useState(false);
  const [query, setQuery] = useState("");
  const [hits, setHits] = useState<Hit[]>([]);
  const [suggestions, setSuggestions] = useState<Hit[] | null>(null);
  const [busy, setBusy] = useState(false);
  const [slugTouched, setSlugTouched] = useState(false);

  const notify = (msg: string, err = false) => { setToast({ msg, err }); window.setTimeout(() => setToast(null), err ? 7000 : 3800); };
  const handleError = useCallback((e: unknown, fallback: string) => {
    if (e instanceof ApiError && (e.status === 401 || e.status === 403)) setAuthIssue(e.status === 401 ? "Your admin session has expired. Please sign in again." : "Only staff can manage topics.");
    else notify(e instanceof Error ? e.message : fallback, true);
  }, []);

  const reload = useCallback(async () => {
    try {
      const [t, g] = await Promise.all([api<ListTopic[]>("/api/topics?list=1"), api<{ total: number; items: Hit[] }>("/api/topics?gaps=1")]);
      setTopics(t);
      setGaps(g);
    } catch (e) {
      handleError(e, "Could not load topics.");
    } finally {
      setLoading(false);
    }
  }, [handleError]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [t, g] = await Promise.all([api<ListTopic[]>("/api/topics?list=1"), api<{ total: number; items: Hit[] }>("/api/topics?gaps=1")]);
        if (cancelled) return;
        setTopics(t);
        setGaps(g);
      } catch (e) {
        if (!cancelled) handleError(e, "Could not load topics.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [handleError]);

  const openNew = () => { setTopicId(null); setDraft(blank()); setMembers([]); setHits([]); setSuggestions(null); setQuery(""); setSlugTouched(false); setEditing(true); };

  const openEdit = async (id: string) => {
    try {
      const d = await api<{ topic: Topic; members: Member[] }>(`/api/topics?id=${encodeURIComponent(id)}`);
      setTopicId(id); setDraft(d.topic); setMembers(d.members); setHits([]); setSuggestions(null); setQuery(""); setSlugTouched(true); setEditing(true);
    } catch (e) { handleError(e, "Could not open the topic."); }
  };

  const update = (patch: Partial<Topic>) => setDraft((d) => ({ ...d, ...patch }));

  const checks = useMemo(() => readinessChecks(draft, members.filter((m) => m.live)), [draft, members]);
  const blocked = checks.filter((c) => c.blocking && !c.ok);

  const save = async (status?: "draft" | "published") => {
    setSaving(true);
    try {
      const topic = { ...draft, status: status ?? draft.status, slug: draft.slug || slugOf(draft.title) };
      const items = members.map((m, n) => ({ type: m.type, slug: m.slug, role: m.role, sortOrder: (n + 1) * 10 }));
      if (topicId) {
        await api(`/api/topics?id=${encodeURIComponent(topicId)}`, { method: "PUT", body: JSON.stringify({ topic, items }) });
        notify(status === "published" ? "Published." : "Saved.");
        await openEdit(topicId);
      } else {
        const r = await api<{ id: string }>("/api/topics", { method: "POST", body: JSON.stringify({ topic, items }) });
        notify(status === "published" ? "Published." : "Saved.");
        await openEdit(r.id);
      }
      void reload();
    } catch (e) { handleError(e, "Could not save the topic."); } finally { setSaving(false); }
  };

  const remove = async (t: ListTopic) => {
    if (!window.confirm(`Delete the topic "${t.title}"? The articles, questions, videos and terms in it are not deleted, only the links between them.`)) return;
    try { await api(`/api/topics?id=${encodeURIComponent(t.id)}`, { method: "DELETE" }); notify("Topic deleted."); void reload(); } catch (e) { handleError(e, "Could not delete."); }
  };

  const search = async () => {
    setBusy(true);
    try { setHits(await api<Hit[]>(`/api/topics?search=${encodeURIComponent(query)}`)); } catch (e) { handleError(e, "Search failed."); } finally { setBusy(false); }
  };
  const suggest = async () => {
    if (!topicId) { notify("Save the topic once first, then ask for suggestions.", true); return; }
    setBusy(true);
    try { setSuggestions(await api<Hit[]>(`/api/topics?suggest=${encodeURIComponent(topicId)}`)); } catch (e) { handleError(e, "Could not get suggestions."); } finally { setBusy(false); }
  };

  const has = (h: Hit) => members.some((m) => m.type === h.type && m.slug === h.slug);
  const addMember = (h: Hit) => {
    if (has(h)) return;
    const role: TopicRole = h.type === "glossary" ? "supporting" : members.some((m) => m.role === "pillar") || h.type !== "blog" ? "cluster" : "pillar";
    setMembers((ms) => [...ms, { type: h.type, slug: h.slug, role, sortOrder: (ms.length + 1) * 10, title: h.title, live: h.published }]);
  };
  const move = (i: number, d: -1 | 1) => setMembers((ms) => { const j = i + d; if (j < 0 || j >= ms.length) return ms; const c = ms.slice(); [c[i], c[j]] = [c[j], c[i]]; return c; });

  const addGapTo = async (h: Hit, id: string) => {
    if (!id) return;
    try {
      await api(`/api/topics?id=${encodeURIComponent(id)}`, { method: "PUT", body: JSON.stringify({ addItems: [{ type: h.type, slug: h.slug, role: h.type === "glossary" ? "supporting" : "cluster" }] }) });
      notify("Added to the topic.");
      void reload();
    } catch (e) { handleError(e, "Could not add."); }
  };

  if (authIssue) {
    return (
      <div className={shop.wrap}>
        <div className={shop.banner} role="alert"><span>{authIssue}</span><a href="/admin/login?logout=1" className={`${shop.btn} ${shop.secondary} ${shop.small}`}>Sign in again</a></div>
      </div>
    );
  }

  /* ------------------------------- editor ------------------------------- */
  if (editing) {
    const quickWords = wordCount(draft.shortAnswer);
    return (
      <div className={shop.wrap}>
        <div className={shop.editorBar}>
          <button type="button" className={`${shop.btn} ${shop.secondary} ${shop.small}`} onClick={() => { setEditing(false); void reload(); }}>Back to topics</button>
          <h2 className={shop.editorTitle}>{topicId ? `Edit: ${draft.title || "topic"}` : "New topic"}</h2>
          <div className={shop.editorBtns}>
            {topicId && draft.slug && (
              <a className={`${shop.btn} ${shop.secondary} ${shop.small}`} href={draft.status === "published" ? topicPath(draft.slug) : `/blog/topics/preview/${draft.slug}`} target="_blank" rel="noopener noreferrer"><ExternalLink size={14} /> {draft.status === "published" ? "View live" : "Preview draft"}</a>
            )}
            <button type="button" className={`${shop.btn} ${shop.secondary}`} disabled={saving || !draft.title.trim()} onClick={() => void save("draft")}><Save size={14} /> Save as draft</button>
            <button type="button" className={`${shop.btn} ${shop.primary}`} disabled={saving || blocked.length > 0} title={blocked.length ? "Fix the items marked as required first" : ""} onClick={() => void save("published")}><Check size={14} /> {draft.status === "published" ? "Save and keep published" : "Publish"}</button>
          </div>
        </div>

        <div className={shop.panel}>
          <h3 className={shop.sectionHead}>Before you publish</h3>
          <ul style={{ margin: 0, paddingLeft: 18, lineHeight: 1.8 }}>
            {checks.map((c, i) => (<li key={i} style={{ color: c.ok ? "#166534" : c.blocking ? "#9f1239" : "#92400e" }}>{c.ok ? "Done" : c.blocking ? "Required" : "Recommended"}: {c.label}</li>))}
          </ul>
        </div>

        <div className={shop.panel}>
          <h3 className={shop.sectionHead}>The topic</h3>
          <div className={shop.row2}>
            <div className={shop.field}>
              <label className={shop.label} htmlFor="t-title">Title *</label>
              <input id="t-title" className={shop.input} value={draft.title} maxLength={160} placeholder="e.g. Chakras" onChange={(e) => update({ title: e.target.value, ...(slugTouched ? {} : { slug: slugOf(e.target.value) }) })} />
            </div>
            <div className={shop.field}>
              <label className={shop.label} htmlFor="t-slug">Web address</label>
              <input id="t-slug" className={shop.input} value={draft.slug} maxLength={120} onChange={(e) => { setSlugTouched(true); update({ slug: slugOf(e.target.value) }); }} />
              <span className={shop.hint}>/blog/topics/{draft.slug || "…"}{topicId && draft.status === "published" ? ". If you change this, the old address redirects automatically." : ""}</span>
            </div>
          </div>
          <div className={shop.field}>
            <label className={shop.label} htmlFor="t-quick">Quick answer (the 40 to 60 words that Google and AI tools will quote) *</label>
            <textarea id="t-quick" className={shop.textarea} rows={4} value={draft.shortAnswer} maxLength={700} onChange={(e) => update({ shortAnswer: e.target.value })} />
            <span className={shop.hint} style={{ color: quickWords >= 25 && quickWords <= 70 ? "#166534" : "#92400e" }}>{quickWords} words. Aim for 40 to 60, a direct answer to &quot;What is {draft.title || "this topic"}?&quot;</span>
          </div>
          <div className={shop.field}>
            <span className={shop.label}>The guide (your main write-up for this topic)</span>
            <RichTextEditor value={draft.overviewHtml} onChange={(v) => update({ overviewHtml: v })} minHeight="320px" placeholder="Explain the topic clearly. Use headings for each section, link to your articles, questions and glossary terms, and mention safety where it matters." />
            <span className={shop.hint}>{wordCount(stripHtml(draft.overviewHtml))} words. If you have a long main-guide article, set it as the main guide below and keep this short.</span>
          </div>
          <StringList label="Key takeaways" items={draft.keyTakeaways} onChange={(v) => update({ keyTakeaways: v })} placeholder="One clear point" />
          <StringList label="Questions people ask (shown until real answers are linked)" items={draft.alternateQuestions} onChange={(v) => update({ alternateQuestions: v })} placeholder="e.g. Are chakras real?" max={20} />
        </div>

        <div className={shop.panel}>
          <h3 className={shop.sectionHead}>What is in this topic</h3>
          <p className={shop.hint}>Order matters: readers move through articles, videos and questions in this order. Mark one article as the main guide. Glossary terms are reference, not part of the reading order.</p>
          {members.length === 0 ? <p className={shop.hint}>Nothing linked yet. Search below or ask for suggestions.</p> : (
            <ul style={{ listStyle: "none", margin: "8px 0 0", padding: 0, display: "grid", gap: 8 }}>
              {members.map((m, i) => (
                <li key={`${m.type}:${m.slug}`} className={shop.listRow} style={{ flexWrap: "wrap", gap: 8, padding: "8px 10px", border: "1px solid #e2e8f0", borderRadius: 10, background: m.live ? "#fff" : "#fff7ed" }}>
                  <span style={{ minWidth: 96, fontWeight: 700, fontSize: "0.8rem", color: "#6d28d9" }}>{ITEM_LABEL[m.type]}</span>
                  <span style={{ flex: 1, minWidth: 180 }}>{truncate(m.title, 80)}{!m.live && <span className={shop.hint}> (not published or missing, so it is hidden on the site)</span>}</span>
                  <select className={shop.select} style={{ maxWidth: 150 }} aria-label={`Role of ${m.title}`} value={m.role} onChange={(e) => setMembers((ms) => ms.map((x, j) => (j === i ? { ...x, role: e.target.value as TopicRole } : x)))}>
                    {roleOptions.map((r) => (<option key={r} value={r}>{ROLE_LABEL[r]}</option>))}
                  </select>
                  <span className={shop.actions}>
                    <button type="button" className={`${shop.btn} ${shop.secondary} ${shop.small}`} onClick={() => move(i, -1)} disabled={i === 0} aria-label="Move up"><ArrowUp size={14} /></button>
                    <button type="button" className={`${shop.btn} ${shop.secondary} ${shop.small}`} onClick={() => move(i, 1)} disabled={i === members.length - 1} aria-label="Move down"><ArrowDown size={14} /></button>
                    <button type="button" className={`${shop.btn} ${shop.danger} ${shop.small}`} onClick={() => setMembers((ms) => ms.filter((_, j) => j !== i))} aria-label={`Remove ${m.title}`}><Trash2 size={14} /></button>
                  </span>
                </li>
              ))}
            </ul>
          )}

          <div className={shop.field} style={{ marginTop: 16 }}>
            <label className={shop.label} htmlFor="t-search">Add something</label>
            <div className={shop.listRow}>
              <input id="t-search" className={shop.input} value={query} placeholder="Search articles, questions, videos and glossary terms" onChange={(e) => setQuery(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); void search(); } }} />
              <button type="button" className={`${shop.btn} ${shop.secondary}`} disabled={busy || query.trim().length < 2} onClick={() => void search()}><Search size={14} /> Search</button>
              <button type="button" className={`${shop.btn} ${shop.secondary}`} disabled={busy} onClick={() => void suggest()}><Sparkles size={14} /> Suggest related</button>
            </div>
          </div>
          {[{ title: "Search results", list: hits }, { title: "Suggested for this topic", list: suggestions }].map(({ title, list }) => list && (
            <div key={title} style={{ marginTop: 8 }}>
              <h4 className={shop.sectionHead} style={{ fontSize: "0.95rem" }}>{title}</h4>
              {list.length === 0 ? <p className={shop.hint}>Nothing found.</p> : (
                <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "grid", gap: 6 }}>
                  {list.map((h) => (
                    <li key={`${h.type}:${h.slug}`} className={shop.listRow} style={{ gap: 8 }}>
                      <span style={{ minWidth: 96, fontWeight: 700, fontSize: "0.8rem", color: "#6d28d9" }}>{ITEM_LABEL[h.type]}</span>
                      <span style={{ flex: 1 }}>{truncate(h.title, 90)}{!h.published && <span className={shop.hint}> (draft)</span>}{h.matched && h.matched.length > 0 && <span className={shop.hint}> matches: {h.matched.join(", ")}</span>}</span>
                      <button type="button" className={`${shop.btn} ${shop.primary} ${shop.small}`} disabled={has(h)} onClick={() => addMember(h)}>{has(h) ? "Added" : <><Plus size={14} /> Add</>}</button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}
          <p className={shop.hint} style={{ marginTop: 10 }}>Changes to the list are saved when you press Save or Publish.</p>
        </div>

        <div className={shop.panel}>
          <h3 className={shop.sectionHead}>Trust and sources</h3>
          <div className={shop.row3}>
            <div className={shop.field}><label className={shop.label} htmlFor="t-author">Author</label><input id="t-author" className={shop.input} value={draft.authorName} onChange={(e) => update({ authorName: e.target.value })} /></div>
            <div className={shop.field}><label className={shop.label} htmlFor="t-rev">Reviewed by</label><input id="t-rev" className={shop.input} value={draft.reviewedBy} placeholder="Only if a named person has read it" onChange={(e) => update({ reviewedBy: e.target.value })} /></div>
            <div className={shop.field}><label className={shop.label} htmlFor="t-revd">Last reviewed</label><input id="t-revd" type="date" className={shop.input} value={draft.lastReviewed || ""} onChange={(e) => update({ lastReviewed: e.target.value || null })} /></div>
          </div>
          <div className={shop.field}>
            <span className={shop.label}>Sources (real pages that back up your claims)</span>
            {draft.sources.map((s, i) => (
              <div key={i} className={shop.listRow} style={{ marginBottom: 6 }}>
                <input className={shop.input} value={s.title} placeholder="Title" aria-label={`Source title ${i + 1}`} onChange={(e) => update({ sources: draft.sources.map((x, j) => (j === i ? { ...x, title: e.target.value } : x)) })} />
                <input className={shop.input} value={s.url} placeholder="https://…" aria-label={`Source link ${i + 1}`} onChange={(e) => update({ sources: draft.sources.map((x, j) => (j === i ? { ...x, url: e.target.value } : x)) })} />
                <button type="button" className={`${shop.btn} ${shop.secondary} ${shop.small}`} onClick={() => update({ sources: draft.sources.filter((_, j) => j !== i) })} aria-label={`Remove source ${i + 1}`}><X size={14} /></button>
              </div>
            ))}
            <button type="button" className={`${shop.btn} ${shop.secondary} ${shop.small}`} onClick={() => update({ sources: [...draft.sources, { title: "", url: "" }] })}><Plus size={14} /> Add source</button>
          </div>
          <StringList label="Same topic elsewhere (Wikipedia and similar links)" items={draft.sameAs} onChange={(v) => update({ sameAs: v })} placeholder="https://en.wikipedia.org/wiki/…" max={10} />
        </div>

        <div className={shop.panel}>
          <h3 className={shop.sectionHead}>Search and sharing</h3>
          <div className={shop.row2}>
            <div className={shop.field}><label className={shop.label} htmlFor="t-fk">Main keyword</label><input id="t-fk" className={shop.input} value={draft.focusKeyword} placeholder="e.g. what are chakras" onChange={(e) => update({ focusKeyword: e.target.value })} /></div>
            <div className={shop.field}><label className={shop.label} htmlFor="t-sk">Other keywords (comma separated)</label><input id="t-sk" className={shop.input} value={draft.secondaryKeywords.join(", ")} onChange={(e) => update({ secondaryKeywords: e.target.value.split(",").map((x) => x.trim()).filter(Boolean) })} /></div>
          </div>
          <div className={shop.field}><label className={shop.label} htmlFor="t-mt">Page title for Google</label><input id="t-mt" className={shop.input} value={draft.metaTitle} maxLength={120} onChange={(e) => update({ metaTitle: e.target.value })} /><span className={shop.hint}>{draft.metaTitle.length}/60. Leave empty to build it from the title.</span></div>
          <div className={shop.field}><label className={shop.label} htmlFor="t-md">Description for Google</label><textarea id="t-md" className={shop.textarea} rows={2} maxLength={300} value={draft.metaDescription} onChange={(e) => update({ metaDescription: e.target.value })} /><span className={shop.hint}>{draft.metaDescription.length}/155. Leave empty to use the quick answer.</span></div>
          <div className={shop.row2}>
            <div className={shop.field}><label className={shop.label} htmlFor="t-og">Share image link</label><input id="t-og" className={shop.input} value={draft.ogImage} placeholder="https://…" onChange={(e) => update({ ogImage: e.target.value })} /></div>
            <div className={shop.field}><label className={shop.label} htmlFor="t-ord">Position in the topics list</label><input id="t-ord" type="number" className={shop.input} value={draft.sortOrder} onChange={(e) => update({ sortOrder: Number(e.target.value) || 0 })} /></div>
          </div>
          <label className={shop.listRow} style={{ gap: 8 }}><input type="checkbox" checked={draft.noindex} onChange={(e) => update({ noindex: e.target.checked })} /> Keep this topic out of Google (not recommended once it is ready)</label>
        </div>

        <div className={shop.panel}>
          <h3 className={shop.sectionHead}>Next step for the reader</h3>
          <div className={shop.row2}>
            <div className={shop.field}><label className={shop.label} htmlFor="t-cl">Button text</label><input id="t-cl" className={shop.input} value={draft.ctaLabel} onChange={(e) => update({ ctaLabel: e.target.value })} /></div>
            <div className={shop.field}><label className={shop.label} htmlFor="t-cu">Button link</label><input id="t-cu" className={shop.input} value={draft.ctaUrl} placeholder="/explore-services" onChange={(e) => update({ ctaUrl: e.target.value })} /></div>
          </div>
          <div className={shop.field}><label className={shop.label} htmlFor="t-ct">Sentence above the button</label><input id="t-ct" className={shop.input} value={draft.ctaText} maxLength={400} onChange={(e) => update({ ctaText: e.target.value })} /></div>
        </div>
        {toast && <div className={`${shop.toast} ${toast.err ? shop.toastErr : ""}`} role="status">{toast.msg}</div>}
      </div>
    );
  }

  /* -------------------------------- list -------------------------------- */
  return (
    <div className={shop.wrap}>
      <div className={shop.topbar}>
        <div>
          <h2 className={shop.h2}>Topic guides</h2>
          <p className={shop.sub}>Group articles, videos, questions and glossary terms into one guide per topic. Each topic gets its own page, and every linked page points back to it.</p>
        </div>
        <button type="button" className={`${shop.btn} ${shop.primary}`} onClick={openNew}><Plus size={14} /> New topic</button>
      </div>

      <div className={shop.tableCard}>
        {loading ? <p className={shop.empty}>Loading…</p> : topics.length === 0 ? <p className={shop.empty}>No topics yet. Create the first one.</p> : (
          <table className={shop.table}>
            <thead><tr><th>Topic</th><th>Status</th><th>Articles</th><th>Videos</th><th>Questions</th><th>Terms</th><th>Actions</th></tr></thead>
            <tbody>
              {topics.map((t) => (
                <tr key={t.id}>
                  <td><div className={shop.prodName}>{t.title}</div><div className={shop.prodSlug}>/blog/topics/{t.slug}</div></td>
                  <td><span className={`${shop.status} ${t.status === "published" ? shop.st_published : shop.st_draft}`}>{t.status}</span></td>
                  <td>{t.counts.blog || 0}</td><td>{t.counts.video || 0}</td><td>{t.counts.qa || 0}</td><td>{t.counts.glossary || 0}</td>
                  <td>
                    <div className={shop.actions}>
                      <button type="button" className={`${shop.btn} ${shop.secondary} ${shop.small}`} onClick={() => void openEdit(t.id)}><Pencil size={14} /> Edit</button>
                      <a className={`${shop.btn} ${shop.secondary} ${shop.small}`} href={t.status === "published" ? topicPath(t.slug) : `/blog/topics/preview/${t.slug}`} target="_blank" rel="noopener noreferrer" aria-label={`${t.status === "published" ? "View" : "Preview"} ${t.title}`}><ExternalLink size={14} /></a>
                      <button type="button" className={`${shop.btn} ${shop.danger} ${shop.small}`} onClick={() => void remove(t)} aria-label={`Delete ${t.title}`}><Trash2 size={14} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className={shop.panel}>
        <h3 className={shop.sectionHead}>Pages that no topic links to ({gaps.total})</h3>
        <p className={shop.hint}>These published pages have no guide pointing to them, which makes them harder for readers and search engines to find. Add each one to a topic, or leave it if it stands alone.</p>
        {gaps.items.length === 0 ? <p className={shop.hint}>Every published page belongs to a topic.</p> : (
          <ul style={{ listStyle: "none", margin: "8px 0 0", padding: 0, display: "grid", gap: 6, maxHeight: 420, overflow: "auto" }}>
            {gaps.items.map((h) => (
              <li key={`${h.type}:${h.slug}`} className={shop.listRow} style={{ gap: 8, flexWrap: "wrap" }}>
                <span style={{ minWidth: 96, fontWeight: 700, fontSize: "0.8rem", color: "#6d28d9" }}>{ITEM_LABEL[h.type]}</span>
                <span style={{ flex: 1, minWidth: 160 }}>{truncate(h.title, 90)}</span>
                <select className={shop.select} style={{ maxWidth: 220 }} aria-label={`Add ${h.title} to a topic`} value="" onChange={(e) => void addGapTo(h, e.target.value)}>
                  <option value="">Add to topic…</option>
                  {topics.map((t) => (<option key={t.id} value={t.id}>{t.title}</option>))}
                </select>
              </li>
            ))}
          </ul>
        )}
      </div>
      {toast && <div className={`${shop.toast} ${toast.err ? shop.toastErr : ""}`} role="status">{toast.msg}</div>}
    </div>
  );
}
