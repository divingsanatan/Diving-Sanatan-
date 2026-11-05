"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Copy, ExternalLink, Pencil, Plus, Trash2 } from "lucide-react";
import { formatPrice, seoChecks, type ShopProduct } from "@/lib/shopShared";
import {
  ApiError,
  blankProduct,
  createProduct,
  deleteProduct,
  getAdminToken,
  listProducts,
  updateProduct,
} from "./shopApi";
import ProductForm from "./ProductForm";
import styles from "./adminShop.module.css";

type Filter = "all" | "published" | "draft" | "archived";
const scoreTone = (s: number) => (s >= 80 ? styles.good : s >= 50 ? styles.ok : styles.bad);

export default function AdminShopPage() {
  const [products, setProducts] = useState<ShopProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [authIssue, setAuthIssue] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [editing, setEditing] = useState<ShopProduct | null>(null);
  const [formKey, setFormKey] = useState(0); // changes only when a different product is opened
  const openEditor = (p: ShopProduct) => {
    setFormKey((k) => k + 1);
    setEditing(p);
  };
  const [saving, setSaving] = useState(false);
  const [filter, setFilter] = useState<Filter>("all");
  const [query, setQuery] = useState("");
  const [toast, setToast] = useState<{ msg: string; err?: boolean } | null>(null);

  const notify = useCallback((msg: string, err = false) => {
    setToast({ msg, err });
    window.setTimeout(() => setToast(null), err ? 6000 : 3500);
  }, []);

  const handleApiError = useCallback(
    (e: unknown, fallback: string) => {
      if (e instanceof ApiError && (e.status === 401 || e.status === 503)) {
        setAuthIssue(e.message);
      } else {
        notify(e instanceof Error ? e.message : fallback, true);
      }
    },
    [notify]
  );

  // Fetches products and reports the outcome; state is applied in a callback (not synchronously in an effect).
  const fetchProducts = useCallback(async (): Promise<
    { kind: "ok"; data: ShopProduct[] } | { kind: "auth"; message: string } | { kind: "error"; message: string }
  > => {
    if (!getAdminToken()) {
      return { kind: "auth", message: "Please sign out and sign in again to manage the shop. This adds a secure session token." };
    }
    try {
      return { kind: "ok", data: await listProducts() };
    } catch (e) {
      if (e instanceof ApiError && (e.status === 401 || e.status === 503)) return { kind: "auth", message: e.message };
      return { kind: "error", message: e instanceof Error ? e.message : "Could not load products." };
    }
  }, []);

  const applyResult = useCallback((r: Awaited<ReturnType<typeof fetchProducts>>) => {
    if (r.kind === "ok") {
      setProducts(r.data);
      setAuthIssue(null);
      setLoadError(null);
    } else if (r.kind === "auth") {
      setAuthIssue(r.message);
    } else {
      setLoadError(r.message);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    let cancelled = false;
    void fetchProducts().then((r) => {
      if (!cancelled) applyResult(r);
    });
    return () => {
      cancelled = true;
    };
  }, [fetchProducts, applyResult]);

  const retry = () => {
    setLoading(true);
    setLoadError(null);
    void fetchProducts().then(applyResult);
  };

  const categories = useMemo(
    () => Array.from(new Set(products.map((p) => p.category).filter(Boolean))).sort(),
    [products]
  );

  const counts = useMemo(
    () => ({
      all: products.length,
      published: products.filter((p) => p.status === "published").length,
      draft: products.filter((p) => p.status === "draft").length,
      archived: products.filter((p) => p.status === "archived").length,
    }),
    [products]
  );

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return products
      .filter((p) => (filter === "all" ? true : p.status === filter))
      .filter((p) => !q || [p.name, p.slug, p.category, p.sku].join(" ").toLowerCase().includes(q))
      .map((p) => ({ p, score: seoChecks(p).score }));
  }, [products, filter, query]);

  const avgSeo = useMemo(() => {
    const pub = products.filter((p) => p.status === "published");
    return pub.length ? Math.round(pub.reduce((s, p) => s + seoChecks(p).score, 0) / pub.length) : 0;
  }, [products]);

  const save = async (draft: ShopProduct) => {
    setSaving(true);
    try {
      if (draft.id) {
        const res = await updateProduct(draft);
        setProducts((list) => list.map((p) => (p.id === res.data.id ? res.data : p)));
        setEditing(res.data);
        notify(res.redirectCreated ? "Saved. A 301 redirect from the old address was created." : "Product saved.");
      } else {
        const created = await createProduct(draft);
        setProducts((list) => [created, ...list]);
        setEditing(created);
        notify("Product created.");
      }
    } catch (e) {
      handleApiError(e, "Could not save the product.");
    } finally {
      setSaving(false);
    }
  };

  const remove = async (p: ShopProduct) => {
    if (!window.confirm(`Delete “${p.name}” permanently? This cannot be undone.\n\nTip: choose “Archived” instead to just hide it.`)) return;
    try {
      await deleteProduct(p.id);
      setProducts((list) => list.filter((x) => x.id !== p.id));
      notify("Product deleted.");
    } catch (e) {
      handleApiError(e, "Could not delete the product.");
    }
  };

  const duplicate = (p: ShopProduct) =>
    openEditor({ ...p, id: "", slug: "", name: `${p.name} (copy)`, status: "draft", featured: false, createdAt: "", updatedAt: "" });

  /* ---------------------------- editor ---------------------------- */
  if (editing) {
    return (
      <div className={styles.wrap}>
        {authIssue && <AuthBanner message={authIssue} />}
        <ProductForm
          key={formKey}
          initial={editing}
          categories={categories}
          saving={saving}
          onSave={save}
          onError={(m) => notify(m, true)}
          onBack={(dirty) => {
            if (dirty && !window.confirm("You have unsaved changes. Leave without saving?")) return;
            setEditing(null);
          }}
        />
        {toast && <div className={`${styles.toast} ${toast.err ? styles.toastErr : ""}`} role="status">{toast.msg}</div>}
      </div>
    );
  }

  /* ----------------------------- list ----------------------------- */
  return (
    <div className={styles.wrap}>
      {authIssue && <AuthBanner message={authIssue} />}
      {loadError && (
        <div className={`${styles.banner} ${styles.bannerErr}`}>
          <span>{loadError}</span>
          <button className={`${styles.btn} ${styles.secondary} ${styles.small}`} onClick={retry}>Try again</button>
        </div>
      )}

      <div className={styles.topbar}>
        <div>
          <h2 className={styles.h2}>Shop products</h2>
          <p className={styles.sub}>Add and manage what appears in your shop, with full SEO controls for every product.</p>
        </div>
        <div className={styles.actions}>
          <a href="/shop" target="_blank" rel="noopener noreferrer" className={`${styles.btn} ${styles.secondary}`}>
            <ExternalLink size={15} /> View shop
          </a>
          <button className={`${styles.btn} ${styles.primary}`} onClick={() => openEditor(blankProduct())} disabled={!!authIssue}>
            <Plus size={16} /> Add product
          </button>
        </div>
      </div>

      <div className={styles.stats}>
        <div className={styles.stat}><div className={styles.statNum}>{counts.all}</div><div className={styles.statLabel}>Total products</div></div>
        <div className={styles.stat}><div className={styles.statNum}>{counts.published}</div><div className={styles.statLabel}>Published</div></div>
        <div className={styles.stat}><div className={styles.statNum}>{counts.draft}</div><div className={styles.statLabel}>Drafts</div></div>
        <div className={styles.stat}><div className={styles.statNum}>{counts.published ? avgSeo : "–"}</div><div className={styles.statLabel}>Avg. SEO score (published)</div></div>
      </div>

      <div className={styles.filters}>
        <input className={styles.input} placeholder="Search by name, URL, category or SKU" aria-label="Search products" value={query} onChange={(e) => setQuery(e.target.value)} />
        <div className={styles.tabsRow}>
          {(["all", "published", "draft", "archived"] as Filter[]).map((f) => (
            <button key={f} type="button" className={`${styles.pill} ${filter === f ? styles.pillOn : ""}`} onClick={() => setFilter(f)}>
              {f === "all" ? "All" : f[0].toUpperCase() + f.slice(1)} ({counts[f]})
            </button>
          ))}
        </div>
      </div>

      <div className={styles.tableCard}>
        {loading ? (
          <div className={styles.empty}>Loading products…</div>
        ) : rows.length === 0 ? (
          <div className={styles.empty}>
            {products.length === 0 ? "No products yet. Click “Add product” to create your first one." : "No products match your search."}
          </div>
        ) : (
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Product</th><th>Category</th><th>Price</th><th>Stock</th><th>Status</th><th>SEO</th><th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(({ p, score }) => (
                <tr key={p.id}>
                  <td>
                    <div className={styles.prodCell}>
                      {p.images[0] ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img className={styles.thumb} src={p.images[0].url} alt="" />
                      ) : (
                        <div className={styles.thumb} />
                      )}
                      <div>
                        <div className={styles.prodName}>{p.name}</div>
                        <div className={styles.prodSlug}>/shop/{p.slug}</div>
                      </div>
                    </div>
                  </td>
                  <td>{p.category || "–"}</td>
                  <td>{p.price > 0 ? formatPrice(p.price, p.currency) : "–"}</td>
                  <td>{p.stockStatus === "in_stock" ? "In stock" : p.stockStatus === "preorder" ? "Pre-order" : "Out of stock"}</td>
                  <td><span className={`${styles.status} ${styles[`st_${p.status}`]}`}>{p.status}</span></td>
                  <td><span className={`${styles.score} ${scoreTone(score)}`}>{score}</span></td>
                  <td>
                    <div className={styles.actions}>
                      <button className={`${styles.btn} ${styles.secondary} ${styles.small}`} onClick={() => openEditor(p)} aria-label={`Edit ${p.name}`}><Pencil size={14} /> Edit</button>
                      <button className={`${styles.btn} ${styles.secondary} ${styles.small}`} onClick={() => duplicate(p)} aria-label={`Duplicate ${p.name}`}><Copy size={14} /></button>
                      <button className={`${styles.btn} ${styles.danger} ${styles.small}`} onClick={() => void remove(p)} aria-label={`Delete ${p.name}`}><Trash2 size={14} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {toast && <div className={`${styles.toast} ${toast.err ? styles.toastErr : ""}`} role="status">{toast.msg}</div>}
    </div>
  );
}

function AuthBanner({ message }: { message: string }) {
  return (
    <div className={styles.banner} role="alert">
      <span>{message}</span>
      <a href="/admin/login?logout=1" className={`${styles.btn} ${styles.secondary} ${styles.small}`}>Sign in again</a>
    </div>
  );
}
