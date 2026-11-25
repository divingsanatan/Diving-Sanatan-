"use client";

import React, { useCallback, useEffect, useState } from "react";
import { Check, Pencil, Plus, Trash2, X } from "lucide-react";
import shop from "../shop/adminShop.module.css";

interface Cat {
  id: string;
  name: string;
  counts: { blog: number; video: number; qa: number; glossary: number };
  total: number;
}

async function call<T>(url: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers);
  if (init.body) headers.set("Content-Type", "application/json");
  const res = await fetch(url, { ...init, headers, credentials: "same-origin", cache: "no-store" });
  const json = await res.json().catch(() => ({}));
  if (!res.ok || json.success === false) throw new Error(json.error || `Request failed (${res.status})`);
  return json as T;
}

/** One category list for everything: articles, video blogs, questions and glossary terms. */
export default function ContentCategoriesPage() {
  const [cats, setCats] = useState<Cat[]>([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [editId, setEditId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState<{ msg: string; err?: boolean } | null>(null);

  const notify = (msg: string, err = false) => { setToast({ msg, err }); window.setTimeout(() => setToast(null), err ? 8000 : 3500); };

  const load = useCallback(async () => {
    try {
      const j = await call<{ data: Cat[] }>("/api/blogs/categories?admin_view=true");
      setCats(j.data);
    } catch (e) {
      notify(e instanceof Error ? e.message : "Could not load categories.", true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const j = await call<{ data: Cat[] }>("/api/blogs/categories?admin_view=true");
        if (!cancelled) setCats(j.data);
      } catch (e) {
        if (!cancelled) notify(e instanceof Error ? e.message : "Could not load categories.", true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const add = async () => {
    if (!name.trim()) return;
    setBusy(true);
    try {
      await call("/api/blogs/categories", { method: "POST", body: JSON.stringify({ name }) });
      setName("");
      notify("Category added.");
      await load();
    } catch (e) { notify(e instanceof Error ? e.message : "Could not add.", true); } finally { setBusy(false); }
  };

  const rename = async (c: Cat) => {
    if (!editName.trim() || editName.trim() === c.name) { setEditId(null); return; }
    setBusy(true);
    try {
      await call("/api/blogs/categories", { method: "PUT", body: JSON.stringify({ id: c.id, name: editName }) });
      setEditId(null);
      notify(c.total ? `Renamed. ${c.total} item${c.total === 1 ? "" : "s"} moved to the new name.` : "Renamed.");
      await load();
    } catch (e) { notify(e instanceof Error ? e.message : "Could not rename.", true); } finally { setBusy(false); }
  };

  const remove = async (c: Cat) => {
    if (!window.confirm(`Delete the category "${c.name}"?`)) return;
    setBusy(true);
    try {
      await call(`/api/blogs/categories?id=${encodeURIComponent(c.id)}`, { method: "DELETE" });
      notify("Category deleted.");
      await load();
    } catch (e) { notify(e instanceof Error ? e.message : "Could not delete.", true); } finally { setBusy(false); }
  };

  return (
    <div className={shop.wrap}>
      <div className={shop.topbar}>
        <div>
          <h2 className={shop.h2}>Content categories</h2>
          <p className={shop.sub}>One list for everything: articles, video blogs, questions and glossary terms. Add a category here and it appears in every editor. Services have their own list under Service Categories.</p>
        </div>
      </div>

      <div className={shop.panel}>
        <label className={shop.label} htmlFor="cat-new">Add a category</label>
        <div className={shop.listRow}>
          <input id="cat-new" className={shop.input} value={name} maxLength={60} placeholder="e.g. Vedic Wisdom" onChange={(e) => setName(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); void add(); } }} />
          <button type="button" className={`${shop.btn} ${shop.primary}`} disabled={busy || !name.trim()} onClick={() => void add()}><Plus size={14} /> Add</button>
        </div>
      </div>

      <div className={shop.tableCard}>
        {loading ? <p className={shop.empty}>Loading…</p> : cats.length === 0 ? <p className={shop.empty}>No categories yet.</p> : (
          <table className={shop.table}>
            <thead><tr><th>Category</th><th>Articles</th><th>Videos</th><th>Questions</th><th>Glossary terms</th><th>Actions</th></tr></thead>
            <tbody>
              {cats.map((c) => (
                <tr key={c.id}>
                  <td>
                    {editId === c.id ? (
                      <input className={shop.input} value={editName} maxLength={60} aria-label={`New name for ${c.name}`} autoFocus onChange={(e) => setEditName(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") void rename(c); if (e.key === "Escape") setEditId(null); }} />
                    ) : (<span className={shop.prodName}>{c.name}</span>)}
                  </td>
                  <td>{c.counts.blog}</td><td>{c.counts.video}</td><td>{c.counts.qa}</td><td>{c.counts.glossary}</td>
                  <td>
                    <div className={shop.actions}>
                      {editId === c.id ? (
                        <>
                          <button type="button" className={`${shop.btn} ${shop.primary} ${shop.small}`} disabled={busy} onClick={() => void rename(c)} aria-label="Save name"><Check size={14} /></button>
                          <button type="button" className={`${shop.btn} ${shop.secondary} ${shop.small}`} onClick={() => setEditId(null)} aria-label="Cancel"><X size={14} /></button>
                        </>
                      ) : (
                        <>
                          <button type="button" className={`${shop.btn} ${shop.secondary} ${shop.small}`} onClick={() => { setEditId(c.id); setEditName(c.name); }}><Pencil size={14} /> Rename</button>
                          <button type="button" className={`${shop.btn} ${shop.danger} ${shop.small}`} disabled={busy || c.total > 0} title={c.total > 0 ? "Still in use. Rename it, or move its content to another category first." : "Delete"} onClick={() => void remove(c)} aria-label={`Delete ${c.name}`}><Trash2 size={14} /></button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      <p className={shop.hint}>Renaming moves every article, video, question and glossary term in that category to the new name. A category that is still in use cannot be deleted.</p>
      {toast && <div className={`${shop.toast} ${toast.err ? shop.toastErr : ""}`} role="status">{toast.msg}</div>}
    </div>
  );
}
