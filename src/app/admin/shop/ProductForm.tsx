"use client";

import React, { useMemo, useRef, useState } from "react";
import { ArrowLeft, ExternalLink, Plus, Save, Trash2 } from "lucide-react";
import RichTextEditor from "@/components/ui/RichTextEditor";
import { CURRENCIES, seoChecks, slugify, type ShopProduct } from "@/lib/shopShared";
import ImagesPanel from "./ImagesPanel";
import SeoPanel from "./SeoPanel";
import styles from "./adminShop.module.css";

type Tab = "general" | "pricing" | "images" | "details" | "seo";
const TABS: { id: Tab; label: string }[] = [
  { id: "general", label: "General" },
  { id: "pricing", label: "Pricing & stock" },
  { id: "images", label: "Images" },
  { id: "details", label: "Details" },
  { id: "seo", label: "SEO" },
];

export default function ProductForm({
  initial,
  categories,
  saving,
  onSave,
  onBack,
  onError,
}: {
  initial: ShopProduct;
  categories: string[];
  saving: boolean;
  onSave: (draft: ShopProduct) => void;
  onBack: (dirty: boolean) => void;
  onError: (message: string) => void;
}) {
  const [draft, setDraft] = useState<ShopProduct>(initial);
  const [tab, setTab] = useState<Tab>("general");
  const [tagsText, setTagsText] = useState(initial.tags.join(", "));
  const slugTouched = useRef(!!initial.slug);
  const [initialJson, setInitialJson] = useState(() => JSON.stringify(initial));

  // When the parent hands us a freshly saved product, adopt it as the new baseline (keeps the current tab).
  const [prevInitial, setPrevInitial] = useState(initial);
  if (initial !== prevInitial) {
    setPrevInitial(initial);
    setDraft(initial);
    setTagsText(initial.tags.join(", "));
    setInitialJson(JSON.stringify(initial));
  }

  const isNew = !initial.id;
  const dirty = JSON.stringify(draft) !== initialJson;
  const { score } = useMemo(() => seoChecks(draft), [draft]);

  const update = (patch: Partial<ShopProduct>) => setDraft((d) => ({ ...d, ...patch }));
  const num = (v: string): number => (v === "" ? 0 : Number(v));

  const onName = (name: string) => {
    // Only brand-new products follow the name; a saved product's URL never changes by accident.
    update(slugTouched.current || !!initial.id ? { name } : { name, slug: slugify(name) });
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!draft.name.trim()) {
      setTab("general");
      onError("Please enter a product name.");
      return;
    }
    onSave({ ...draft, tags: tagsText.split(",").map((t) => t.trim()).filter(Boolean) });
  };

  const slugChangeWarning = !isNew && initial.status === "published" && initial.slug !== draft.slug;

  return (
    <form onSubmit={submit} className={styles.wrap}>
      <div className={styles.editorBar}>
        <div className={styles.editorTitle}>
          <button type="button" className={`${styles.btn} ${styles.secondary} ${styles.small}`} onClick={() => onBack(dirty)}>
            <ArrowLeft size={14} /> Products
          </button>
          <span>{isNew ? "New product" : draft.name || "Edit product"}</span>
          {dirty && <span className={styles.dirty}>● Unsaved changes</span>}
        </div>
        <div className={styles.editorBtns}>
          {!isNew && initial.status === "published" && (
            <a href={`/shop/${initial.slug}`} target="_blank" rel="noopener noreferrer" className={`${styles.btn} ${styles.secondary}`}>
              <ExternalLink size={15} /> View live
            </a>
          )}
          <button type="submit" className={`${styles.btn} ${styles.primary}`} disabled={saving}>
            <Save size={15} /> {saving ? "Saving…" : isNew ? "Create product" : "Save changes"}
          </button>
        </div>
      </div>

      <div className={styles.tabs} role="tablist">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={tab === t.id}
            className={`${styles.tab} ${tab === t.id ? styles.tabOn : ""}`}
            onClick={() => setTab(t.id)}
          >
            {t.label}
            {t.id === "seo" && ` · ${score}`}
            {t.id === "images" && ` · ${draft.images.length}`}
          </button>
        ))}
      </div>

      {tab === "general" && (
        <div className={styles.panel}>
          <div className={styles.field}>
            <label className={styles.label} htmlFor="p-name">Product name *</label>
            <input id="p-name" className={styles.input} value={draft.name} maxLength={150} onChange={(e) => onName(e.target.value)} placeholder="e.g. Five Mukhi Rudraksha Mala" />
          </div>

          <div className={styles.field}>
            <label className={styles.label} htmlFor="p-slug">Page address (URL)</label>
            <div className={styles.listRow}>
              <span className={styles.hint} style={{ whiteSpace: "nowrap" }}>/shop/</span>
              <input
                id="p-slug"
                className={styles.input}
                value={draft.slug}
                maxLength={100}
                onChange={(e) => {
                  slugTouched.current = true;
                  update({ slug: slugify(e.target.value) });
                }}
              />
            </div>
            <span className={styles.hint}>Lowercase words joined by hyphens. Keep it short and include your main keyword.</span>
            {slugChangeWarning && (
              <span className={styles.hint} style={{ color: "#b45309" }}>
                You are changing the address of a live product. A permanent (301) redirect from the old address will be created automatically so no links or rankings are lost.
              </span>
            )}
          </div>

          <div className={styles.row2}>
            <div className={styles.field}>
              <label className={styles.label} htmlFor="p-cat">Category</label>
              <input id="p-cat" className={styles.input} list="shop-categories" value={draft.category} maxLength={80} onChange={(e) => update({ category: e.target.value })} placeholder="e.g. Malas & Beads" />
              <datalist id="shop-categories">
                {categories.map((c) => (
                  <option key={c} value={c} />
                ))}
              </datalist>
            </div>
            <div className={styles.field}>
              <label className={styles.label} htmlFor="p-tags">Tags</label>
              <input id="p-tags" className={styles.input} value={tagsText} onChange={(e) => setTagsText(e.target.value)} placeholder="meditation, gift, handmade" />
              <span className={styles.hint}>Separate with commas.</span>
            </div>
          </div>

          <div className={styles.field}>
            <label className={styles.label} htmlFor="p-short">Short description</label>
            <textarea id="p-short" className={styles.textarea} rows={3} maxLength={400} value={draft.shortDescription} onChange={(e) => update({ shortDescription: e.target.value })} placeholder="One or two sentences shown on product cards and above the buy button." />
            <span className={styles.hint}>{draft.shortDescription.length}/400</span>
          </div>

          <div className={styles.field}>
            <span className={styles.label}>Full description</span>
            <RichTextEditor value={draft.description} onChange={(v) => update({ description: v })} placeholder="Describe the product: what it is, who it is for, how to use it, what makes it special…" />
            <span className={styles.hint}>Tip: aim for 150+ words. Search engines favour helpful, original descriptions.</span>
          </div>

          <div className={styles.row3}>
            <div className={styles.field}>
              <label className={styles.label} htmlFor="p-status">Status</label>
              <select id="p-status" className={styles.select} value={draft.status} onChange={(e) => update({ status: e.target.value as ShopProduct["status"] })}>
                <option value="draft">Draft (hidden)</option>
                <option value="published">Published (live)</option>
                <option value="archived">Archived (hidden)</option>
              </select>
            </div>
            <div className={styles.field}>
              <label className={styles.label} htmlFor="p-order">Display order</label>
              <input id="p-order" type="number" className={styles.input} value={draft.sortOrder} onChange={(e) => update({ sortOrder: Math.trunc(num(e.target.value)) })} />
              <span className={styles.hint}>Lower numbers appear first.</span>
            </div>
            <label className={styles.check} style={{ alignSelf: "end", paddingBottom: 10 }}>
              <input type="checkbox" checked={draft.featured} onChange={(e) => update({ featured: e.target.checked })} />
              Featured product
            </label>
          </div>
        </div>
      )}

      {tab === "pricing" && (
        <div className={styles.panel}>
          <div className={styles.row3}>
            <div className={styles.field}>
              <label className={styles.label} htmlFor="p-price">Price</label>
              <input id="p-price" type="number" min={0} step="0.01" className={styles.input} value={draft.price} onChange={(e) => update({ price: num(e.target.value) })} />
              <span className={styles.hint}>Set 0 to show “View details” instead of a price.</span>
            </div>
            <div className={styles.field}>
              <label className={styles.label} htmlFor="p-cmp">Original price (optional)</label>
              <input id="p-cmp" type="number" min={0} step="0.01" className={styles.input} value={draft.compareAtPrice ?? ""} onChange={(e) => update({ compareAtPrice: e.target.value === "" ? null : Number(e.target.value) })} />
              <span className={styles.hint}>Shown crossed out to display a discount.</span>
            </div>
            <div className={styles.field}>
              <label className={styles.label} htmlFor="p-cur">Currency</label>
              <select id="p-cur" className={styles.select} value={draft.currency} onChange={(e) => update({ currency: e.target.value })}>
                {CURRENCIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
          </div>

          <div className={styles.row3}>
            <div className={styles.field}>
              <label className={styles.label} htmlFor="p-sku">SKU</label>
              <input id="p-sku" className={styles.input} value={draft.sku} maxLength={80} onChange={(e) => update({ sku: e.target.value })} />
            </div>
            <div className={styles.field}>
              <label className={styles.label} htmlFor="p-stock">Availability</label>
              <select id="p-stock" className={styles.select} value={draft.stockStatus} onChange={(e) => update({ stockStatus: e.target.value as ShopProduct["stockStatus"] })}>
                <option value="in_stock">In stock</option>
                <option value="out_of_stock">Out of stock</option>
                <option value="preorder">Pre-order</option>
              </select>
            </div>
            <div className={styles.field}>
              <label className={styles.label} htmlFor="p-qty">Quantity (optional)</label>
              <input id="p-qty" type="number" min={0} step={1} className={styles.input} value={draft.stockQuantity ?? ""} onChange={(e) => update({ stockQuantity: e.target.value === "" ? null : Math.trunc(Number(e.target.value)) })} />
              <span className={styles.hint}>Shows “Only N left” when 5 or fewer.</span>
            </div>
          </div>

          <div className={styles.field}>
            <label className={styles.label} htmlFor="p-buy">Buy link (optional)</label>
            <input id="p-buy" className={styles.input} value={draft.buyUrl} maxLength={600} onChange={(e) => update({ buyUrl: e.target.value })} placeholder="https://… (payment page, Amazon, Razorpay link, etc.)" />
            <span className={styles.hint}>
              With a link, the product page shows a “Buy now” button that opens it. Without one, visitors see “Enquire to order”, which goes to your Contact page.
            </span>
          </div>
        </div>
      )}

      {tab === "images" && (
        <ImagesPanel images={draft.images} productName={draft.name} onChange={(images) => update({ images })} onError={onError} />
      )}

      {tab === "details" && (
        <div className={styles.panel}>
          <div className={styles.field}>
            <h3 className={styles.sectionHead}>Key highlights</h3>
            <span className={styles.hint}>Short bullet points shown beside the buy button (up to 12).</span>
            {draft.highlights.map((h, i) => (
              <div key={i} className={styles.listRow}>
                <input className={styles.input} value={h} maxLength={200} aria-label={`Highlight ${i + 1}`} onChange={(e) => update({ highlights: draft.highlights.map((x, j) => (j === i ? e.target.value : x)) })} />
                <button type="button" className={`${styles.btn} ${styles.danger} ${styles.small}`} aria-label="Remove highlight" onClick={() => update({ highlights: draft.highlights.filter((_, j) => j !== i) })}>
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
            <div>
              <button type="button" className={`${styles.btn} ${styles.secondary} ${styles.small}`} disabled={draft.highlights.length >= 12} onClick={() => update({ highlights: [...draft.highlights, ""] })}>
                <Plus size={14} /> Add highlight
              </button>
            </div>
          </div>

          <div className={styles.field}>
            <h3 className={styles.sectionHead}>Product details table</h3>
            <span className={styles.hint}>Things like Material, Size, Weight, Origin (up to 20 rows).</span>
            {draft.specs.map((s, i) => (
              <div key={i} className={styles.listRow}>
                <input className={styles.input} style={{ maxWidth: 220 }} value={s.label} maxLength={60} placeholder="Label" aria-label={`Detail ${i + 1} label`} onChange={(e) => update({ specs: draft.specs.map((x, j) => (j === i ? { ...x, label: e.target.value } : x)) })} />
                <input className={styles.input} value={s.value} maxLength={200} placeholder="Value" aria-label={`Detail ${i + 1} value`} onChange={(e) => update({ specs: draft.specs.map((x, j) => (j === i ? { ...x, value: e.target.value } : x)) })} />
                <button type="button" className={`${styles.btn} ${styles.danger} ${styles.small}`} aria-label="Remove detail" onClick={() => update({ specs: draft.specs.filter((_, j) => j !== i) })}>
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
            <div>
              <button type="button" className={`${styles.btn} ${styles.secondary} ${styles.small}`} disabled={draft.specs.length >= 20} onClick={() => update({ specs: [...draft.specs, { label: "", value: "" }] })}>
                <Plus size={14} /> Add detail
              </button>
            </div>
          </div>
        </div>
      )}

      {tab === "seo" && <SeoPanel draft={draft} update={update} />}
    </form>
  );
}
