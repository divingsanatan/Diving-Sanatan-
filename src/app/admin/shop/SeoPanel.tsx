"use client";

import React from "react";
import {
  SITE_URL,
  effectiveDescription,
  effectiveTitle,
  seoChecks,
  truncate,
  stripHtml,
  type ShopProduct,
} from "@/lib/shopShared";
import styles from "./adminShop.module.css";

const scoreClass = (score: number) => (score >= 80 ? "#16a34a" : score >= 50 ? "#d97706" : "#e11d48");

function Meter({ value, min, max }: { value: number; min: number; max: number }) {
  const pct = Math.min(100, Math.round((value / max) * 100));
  const color = value === 0 ? "#cbd5e1" : value < min ? "#d97706" : value <= max ? "#16a34a" : "#e11d48";
  return (
    <div className={styles.meter} aria-hidden="true">
      <div className={styles.meterFill} style={{ width: `${pct}%`, background: color }} />
    </div>
  );
}

export default function SeoPanel({
  draft,
  update,
}: {
  draft: ShopProduct;
  update: (patch: Partial<ShopProduct>) => void;
}) {
  const { score, checks } = seoChecks(draft);
  const title = effectiveTitle(draft);
  const description = effectiveDescription(draft);
  const url = draft.canonicalUrl || `${SITE_URL}/shop/${draft.slug || "your-product"}`;
  const displayUrl = url.replace(/^https?:\/\//, "").replace(/\/$/, "").split("/").join(" › ");

  const suggestTitle = () => {
    const base = draft.focusKeyword.trim() ? `${draft.focusKeyword.trim()}: ${draft.name}` : draft.name;
    update({ metaTitle: truncate(`${base} | Diving Sanatan`, 60).replace(/…$/, "") });
  };
  const suggestDescription = () => {
    const src = draft.shortDescription.trim() || stripHtml(draft.description) || draft.name;
    update({ metaDescription: truncate(src, 155) });
  };

  return (
    <div className={styles.panel}>
      <div className={styles.scoreCard}>
        <div className={styles.scoreBig} style={{ background: scoreClass(score) }} aria-label={`SEO score ${score} out of 100`}>
          {score}
        </div>
        <div>
          <h3 className={styles.sectionHead}>SEO score</h3>
          <p className={styles.hint}>
            {score >= 80
              ? "Great. This product is well optimised for search."
              : score >= 50
                ? "Decent start. Fix the red items below to improve your ranking chances."
                : "Needs work. Complete the checklist below before publishing."}
          </p>
        </div>
      </div>

      <div>
        <h3 className={styles.sectionHead}>Google preview</h3>
        <p className={styles.hint} style={{ marginBottom: 8 }}>This is roughly how your product may appear in search results.</p>
        <div className={styles.serp}>
          <div className={styles.serpUrl}>{displayUrl}</div>
          <h4 className={styles.serpTitle}>{truncate(title, 60) || "Product title"}</h4>
          <p className={styles.serpDesc}>{truncate(description, 160) || "Your meta description will appear here."}</p>
        </div>
      </div>

      <div className={styles.field}>
        <label className={styles.label} htmlFor="seo-kw">Focus keyword</label>
        <input
          id="seo-kw"
          className={styles.input}
          value={draft.focusKeyword}
          maxLength={80}
          placeholder="e.g. rudraksha mala"
          onChange={(e) => update({ focusKeyword: e.target.value })}
        />
        <span className={styles.hint}>The main phrase you want people to search to find this product. Use one phrase per product.</span>
      </div>

      <div className={styles.field}>
        <div className={styles.listRow} style={{ justifyContent: "space-between" }}>
          <label className={styles.label} htmlFor="seo-title">SEO title</label>
          <button type="button" className={`${styles.btn} ${styles.secondary} ${styles.small}`} onClick={suggestTitle} disabled={!draft.name}>
            Suggest
          </button>
        </div>
        <input
          id="seo-title"
          className={styles.input}
          value={draft.metaTitle}
          maxLength={120}
          placeholder={`${draft.name || "Product name"} | Diving Sanatan`}
          onChange={(e) => update({ metaTitle: e.target.value })}
        />
        <Meter value={draft.metaTitle.trim().length} min={30} max={60} />
        <div className={styles.counter}>
          <span>Best between 30 and 60 characters</span>
          <span>{draft.metaTitle.trim().length}/60</span>
        </div>
      </div>

      <div className={styles.field}>
        <div className={styles.listRow} style={{ justifyContent: "space-between" }}>
          <label className={styles.label} htmlFor="seo-desc">Meta description</label>
          <button type="button" className={`${styles.btn} ${styles.secondary} ${styles.small}`} onClick={suggestDescription} disabled={!draft.name}>
            Suggest
          </button>
        </div>
        <textarea
          id="seo-desc"
          className={styles.textarea}
          value={draft.metaDescription}
          maxLength={320}
          rows={3}
          placeholder="A short, persuasive summary that makes people want to click."
          onChange={(e) => update({ metaDescription: e.target.value })}
        />
        <Meter value={draft.metaDescription.trim().length} min={70} max={160} />
        <div className={styles.counter}>
          <span>Best between 70 and 160 characters</span>
          <span>{draft.metaDescription.trim().length}/160</span>
        </div>
      </div>

      <div className={styles.row2}>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="seo-canon">Canonical URL (optional)</label>
          <input
            id="seo-canon"
            className={styles.input}
            value={draft.canonicalUrl}
            placeholder={`${SITE_URL}/shop/${draft.slug || "your-product"}`}
            onChange={(e) => update({ canonicalUrl: e.target.value })}
          />
          <span className={styles.hint}>Leave empty unless this product page duplicates another page.</span>
        </div>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="seo-og">Social sharing image (optional)</label>
          <input
            id="seo-og"
            className={styles.input}
            value={draft.ogImage}
            placeholder={draft.images[0]?.url || "Uses the main product image"}
            onChange={(e) => update({ ogImage: e.target.value })}
          />
          <span className={styles.hint}>Shown on WhatsApp, Facebook and X. Defaults to the main image.</span>
        </div>
      </div>

      <label className={styles.check}>
        <input type="checkbox" checked={draft.noindex} onChange={(e) => update({ noindex: e.target.checked })} />
        <span>
          Hide from search engines (noindex)
          <span className={styles.hint} style={{ display: "block" }}>
            The page stays visible to visitors but Google will not list it, and it is removed from your sitemap.
          </span>
        </span>
      </label>

      <div>
        <h3 className={styles.sectionHead} style={{ marginBottom: 10 }}>SEO checklist</h3>
        <ul className={styles.checks}>
          {checks.map((c) => (
            <li key={c.id}>
              <span className={c.pass ? styles.dotPass : styles.dotFail} aria-hidden="true">{c.pass ? "✓" : "!"}</span>
              <span>
                {c.label}
                <span className="sr-only" style={{ position: "absolute", left: -9999 }}>{c.pass ? " passed" : " needs attention"}</span>
                {!c.pass && <span className={styles.checkHint}>{c.hint}</span>}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
