"use client";

import React, { useMemo, useState } from "react";
import { ArrowDown, ArrowLeft, ArrowUp, ExternalLink, ImagePlus, Plus, Save, Sparkles, Trash2, X } from "lucide-react";
import RichTextEditor from "@/components/ui/RichTextEditor";
import { SITE_URL, stripHtml, truncate, wordCount } from "@/lib/shopShared";
import {
  coreWord,
  effectiveMetaDescription,
  effectiveMetaTitle,
  effectiveShortAnswer,
  leadingWords,
  scoreTerm,
  scoreTone,
  slugifyTerm,
  termJsonLd,
  termUrl,
  type Check,
  type GlossaryEntry,
} from "@/lib/glossaryShared";
import { compressImage } from "../shop/shopApi";
import { uploadImage, type CategoryRow } from "./glossaryApi";
import shop from "../shop/adminShop.module.css";
import styles from "./adminGlossary.module.css";

type Tab = "content" | "seo" | "ai" | "faq" | "preview";

const parseList = (text: string) =>
  Array.from(new Set(text.split(",").map((t) => t.trim()).filter(Boolean)));

const toneClass = (n: number) => styles[scoreTone(n)];

function Checklist({ checks }: { checks: Check[] }) {
  return (
    <ul className={shop.checks}>
      {checks.map((c) => (
        <li key={c.id}>
          <span className={c.pass ? shop.dotPass : shop.dotFail} aria-hidden="true">{c.pass ? "✓" : "!"}</span>
          <span>
            {c.label}
            <span style={{ position: "absolute", left: -9999 }}>{c.pass ? " passed" : " needs attention"}</span>
            {!c.pass && <span className={shop.checkHint}>{c.hint}</span>}
          </span>
        </li>
      ))}
    </ul>
  );
}

function Meter({ value, min, max }: { value: number; min: number; max: number }) {
  const pct = Math.min(100, Math.round((value / max) * 100));
  const color = value === 0 ? "#cbd5e1" : value < min ? "#d97706" : value <= max ? "#16a34a" : "#e11d48";
  return (
    <div className={shop.meter} aria-hidden="true">
      <div className={shop.meterFill} style={{ width: `${pct}%`, background: color }} />
    </div>
  );
}

export default function TermEditor({
  initial,
  categories,
  allTerms,
  saving,
  onSave,
  onBack,
  onError,
}: {
  initial: GlossaryEntry;
  categories: CategoryRow[];
  allTerms: GlossaryEntry[];
  saving: boolean;
  onSave: (draft: GlossaryEntry) => void;
  onBack: (dirty: boolean) => void;
  onError: (message: string) => void;
}) {
  const [draft, setDraft] = useState<GlossaryEntry>(initial);
  const [altText, setAltText] = useState(initial.alternateNames.join(", "));
  const [secText, setSecText] = useState(initial.secondaryKeywords.join(", "));
  const [slugTouched, setSlugTouched] = useState(!!initial.id);
  const [tab, setTab] = useState<Tab>("content");
  const [relFilter, setRelFilter] = useState("");
  const [uploading, setUploading] = useState(false);
  const [initialJson, setInitialJson] = useState(() => JSON.stringify(initial));

  // After a save the parent hands us the stored term: adopt it as the new baseline (keeps the current tab)
  const [prevInitial, setPrevInitial] = useState(initial);
  if (initial !== prevInitial) {
    setPrevInitial(initial);
    setDraft(initial);
    setAltText(initial.alternateNames.join(", "));
    setSecText(initial.secondaryKeywords.join(", "));
    setInitialJson(JSON.stringify(initial));
  }

  const isNew = !initial.id;
  const eff: GlossaryEntry = useMemo(
    () => ({ ...draft, alternateNames: parseList(altText), secondaryKeywords: parseList(secText) }),
    [draft, altText, secText]
  );
  const dirty = JSON.stringify(eff) !== initialJson && JSON.stringify(draft) !== initialJson;
  const scores = useMemo(() => scoreTerm(eff), [eff]);
  const core = coreWord(eff.word) || "this term";

  const update = (patch: Partial<GlossaryEntry>) => setDraft((d) => ({ ...d, ...patch }));

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!eff.word.trim()) {
      setTab("content");
      onError("Please enter the term.");
      return;
    }
    if (!stripHtml(eff.definition)) {
      setTab("content");
      onError("Please write the definition.");
      return;
    }
    onSave(eff);
  };

  const onFile = async (file: File | undefined) => {
    if (!file) return;
    setUploading(true);
    try {
      const url = await uploadImage(await compressImage(file));
      update({ illustration: url, imageAlt: draft.imageAlt || `${core} illustration` });
    } catch (e) {
      onError(e instanceof Error ? e.message : "Upload failed.");
    } finally {
      setUploading(false);
    }
  };

  const answerWords = eff.shortAnswer.trim() ? eff.shortAnswer.trim().split(/\s+/).length : 0;
  const slugChangeWarning = !isNew && initial.status === "published" && initial.slug !== draft.slug;
  const titleLen = eff.metaTitle.trim().length;
  const descLen = eff.metaDescription.trim().length;
  const liveUrl = termUrl(eff.slug || "your-term");
  const jsonLd = useMemo(() => JSON.stringify(termJsonLd(eff), null, 2), [eff]);

  const relatedChosen = eff.relatedTerms
    .map((s) => allTerms.find((t) => t.slug === s))
    .filter((t): t is GlossaryEntry => !!t);
  const relatedOptions = allTerms
    .filter((t) => t.id !== initial.id && !eff.relatedTerms.includes(t.slug))
    .filter((t) => !relFilter || t.word.toLowerCase().includes(relFilter.toLowerCase()))
    .slice(0, 40);

  const move = <T,>(arr: T[], from: number, to: number): T[] => {
    if (to < 0 || to >= arr.length) return arr;
    const next = [...arr];
    const [it] = next.splice(from, 1);
    next.splice(to, 0, it);
    return next;
  };

  const TABS: { id: Tab; label: string; badge?: string }[] = [
    { id: "content", label: "Content" },
    { id: "seo", label: "SEO", badge: String(scores.seo.score) },
    { id: "ai", label: "AI & answers", badge: `${scores.geo.score}/${scores.aeo.score}` },
    { id: "faq", label: "FAQs & links", badge: String(eff.faqs.length) },
    { id: "preview", label: "Preview & schema" },
  ];

  const faqMissing = eff.faqs.length === 0;

  return (
    <form onSubmit={submit} className={shop.wrap}>
      <div className={shop.editorBar}>
        <div className={shop.editorTitle}>
          <button type="button" className={`${shop.btn} ${shop.secondary} ${shop.small}`} onClick={() => onBack(dirty)}>
            <ArrowLeft size={14} /> Terms
          </button>
          <span>{isNew ? "New term" : eff.word || "Edit term"}</span>
          {dirty && <span className={shop.dirty}>● Unsaved changes</span>}
        </div>
        <div className={shop.editorBtns}>
          <div className={styles.scores} aria-label="Scores">
            <span className={`${styles.pillScore} ${toneClass(scores.seo.score)}`}>SEO <small>{scores.seo.score}</small></span>
            <span className={`${styles.pillScore} ${toneClass(scores.geo.score)}`}>GEO <small>{scores.geo.score}</small></span>
            <span className={`${styles.pillScore} ${toneClass(scores.aeo.score)}`}>AEO <small>{scores.aeo.score}</small></span>
          </div>
          {!isNew && initial.status === "published" && (
            <a href={`/blog/glossary/${initial.slug}`} target="_blank" rel="noopener noreferrer" className={`${shop.btn} ${shop.secondary}`}>
              <ExternalLink size={15} /> View live
            </a>
          )}
          <button type="submit" className={`${shop.btn} ${shop.primary}`} disabled={saving}>
            <Save size={15} /> {saving ? "Saving…" : isNew ? "Create term" : "Save changes"}
          </button>
        </div>
      </div>

      <div className={shop.tabs} role="tablist">
        {TABS.map((t) => (
          <button key={t.id} type="button" role="tab" aria-selected={tab === t.id} className={`${shop.tab} ${tab === t.id ? shop.tabOn : ""}`} onClick={() => setTab(t.id)}>
            {t.label}{t.badge ? ` · ${t.badge}` : ""}
          </button>
        ))}
      </div>

      {/* ------------------------------ CONTENT ------------------------------ */}
      {tab === "content" && (
        <div className={shop.panel}>
          <div className={shop.row2}>
            <div className={shop.field}>
              <label className={shop.label} htmlFor="g-word">Term *</label>
              <input id="g-word" className={shop.input} value={draft.word} maxLength={120} placeholder="e.g. Kundalini" onChange={(e) => {
                const word = e.target.value;
                update(slugTouched ? { word } : { word, slug: slugifyTerm(word) });
              }} />
            </div>
            <div className={shop.field}>
              <label className={shop.label} htmlFor="g-phon">Pronunciation</label>
              <input id="g-phon" className={shop.input} value={draft.phonetic} maxLength={80} placeholder="e.g. KUN-da-lee-nee" onChange={(e) => update({ phonetic: e.target.value })} />
            </div>
          </div>

          <div className={shop.field}>
            <label className={shop.label} htmlFor="g-slug">Page address (URL)</label>
            <div className={shop.listRow}>
              <span className={shop.hint} style={{ whiteSpace: "nowrap" }}>/blog/glossary/</span>
              <input id="g-slug" className={shop.input} value={draft.slug} maxLength={100} onChange={(e) => { setSlugTouched(true); update({ slug: slugifyTerm(e.target.value) }); }} />
            </div>
            <span className={shop.hint}>Lowercase words joined by hyphens. Keep it short, e.g. “kundalini”.</span>
            {slugChangeWarning && (
              <span className={shop.hint} style={{ color: "#b45309" }}>
                You are changing the address of a live page. A permanent (301) redirect from the old address will be created automatically so no rankings are lost.
              </span>
            )}
          </div>

          <div className={shop.row3}>
            <div className={shop.field}>
              <label className={shop.label} htmlFor="g-cat">Category</label>
              <select id="g-cat" className={shop.select} value={draft.category} onChange={(e) => update({ category: e.target.value })}>
                <option value="">No category</option>
                {categories.map((c) => (<option key={c.id} value={c.name}>{c.name}</option>))}
                {draft.category && !categories.some((c) => c.name === draft.category) && <option value={draft.category}>{draft.category}</option>}
              </select>
            </div>
            <div className={shop.field}>
              <label className={shop.label} htmlFor="g-status">Status</label>
              <select id="g-status" className={shop.select} value={draft.status} onChange={(e) => update({ status: e.target.value as GlossaryEntry["status"] })}>
                <option value="draft">Draft (hidden)</option>
                <option value="published">Published (live)</option>
              </select>
            </div>
            <div className={shop.field}>
              <label className={shop.label} htmlFor="g-alt">Also known as</label>
              <input id="g-alt" className={shop.input} value={altText} onChange={(e) => setAltText(e.target.value)} placeholder="Kundalini Shakti, Serpent Power" />
              <span className={shop.hint}>Alternate names or spellings, separated by commas.</span>
            </div>
          </div>

          <div className={shop.field}>
            <label className={shop.label} htmlFor="g-def">Definition *</label>
            <textarea id="g-def" className={shop.textarea} rows={5} value={draft.definition} onChange={(e) => update({ definition: e.target.value })} placeholder="A clear explanation of the term in plain language." />
            <span className={shop.hint}>{wordCount(draft.definition)} words. This is the main definition shown on the glossary and on the term&apos;s own page.</span>
          </div>

          <div className={shop.field}>
            <span className={shop.label}>In-depth explanation (recommended)</span>
            <RichTextEditor value={draft.extendedContent} onChange={(v) => update({ extendedContent: v })} placeholder="Go deeper: meaning, significance, how it is practised. Use sub-headings (H2/H3) to break it up." />
            <span className={shop.hint}>
              {wordCount(draft.extendedContent)} words. Pages with 300+ total words and clear sub-headings rank better and are quoted more by AI assistants.
            </span>
          </div>

          <div className={shop.field}>
            <span className={shop.label}>Illustration</span>
            <div className={shop.listRow} style={{ alignItems: "flex-start" }}>
              <div className={styles.thumbBox}>
                {draft.illustration && /^(https?:)?\/\//.test(draft.illustration) ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={draft.illustration} alt="" />
                ) : null}
              </div>
              <div style={{ display: "grid", gap: 8, flex: 1 }}>
                <div className={shop.listRow}>
                  <label className={`${shop.btn} ${shop.secondary}`} style={{ cursor: "pointer" }}>
                    <ImagePlus size={15} /> {uploading ? "Uploading…" : "Upload image"}
                    <input type="file" accept="image/*" hidden onChange={(e) => { void onFile(e.target.files?.[0]); e.target.value = ""; }} />
                  </label>
                  {draft.illustration && (
                    <button type="button" className={`${shop.btn} ${shop.danger}`} onClick={() => update({ illustration: null })}>Remove</button>
                  )}
                </div>
                {draft.illustration && !/^(https?:)?\/\//.test(draft.illustration) && (
                  <span className={shop.hint}>Using the built-in illustration “{draft.illustration}”. Upload an image to replace it.</span>
                )}
                <input className={shop.input} value={draft.imageAlt} maxLength={200} placeholder="Alt text: describe the image for search engines and screen readers" onChange={(e) => update({ imageAlt: e.target.value })} />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* -------------------------------- SEO -------------------------------- */}
      {tab === "seo" && (
        <div className={shop.panel}>
          <div className={shop.scoreCard}>
            <div className={shop.scoreBig} style={{ background: scores.seo.score >= 80 ? "#16a34a" : scores.seo.score >= 50 ? "#d97706" : "#e11d48" }}>{scores.seo.score}</div>
            <div>
              <h3 className={shop.sectionHead}>SEO score (classic Google search)</h3>
              <p className={shop.hint}>How well this page is set up to rank in normal search results.</p>
            </div>
          </div>

          <div>
            <h3 className={shop.sectionHead}>Google preview</h3>
            <div className={shop.serp} style={{ marginTop: 8 }}>
              <div className={shop.serpUrl}>{liveUrl.replace(/^https?:\/\//, "").split("/").join(" › ")}</div>
              <h4 className={shop.serpTitle}>{truncate(effectiveMetaTitle(eff), 60)}</h4>
              <p className={shop.serpDesc}>{truncate(effectiveMetaDescription(eff), 160)}</p>
            </div>
          </div>

          <div className={shop.row2}>
            <div className={shop.field}>
              <label className={shop.label} htmlFor="s-kw">Focus keyword</label>
              <div className={shop.listRow}>
                <input id="s-kw" className={shop.input} value={draft.focusKeyword} maxLength={80} placeholder="e.g. kundalini meaning" onChange={(e) => update({ focusKeyword: e.target.value })} />
                <button type="button" className={`${shop.btn} ${shop.secondary} ${shop.small}`} onClick={() => update({ focusKeyword: `${core.toLowerCase()} meaning` })} disabled={!draft.word}>Suggest</button>
              </div>
              <span className={shop.hint}>The main phrase people search for. One per term.</span>
            </div>
            <div className={shop.field}>
              <label className={shop.label} htmlFor="s-sec">Related search phrases</label>
              <input id="s-sec" className={shop.input} value={secText} onChange={(e) => setSecText(e.target.value)} placeholder={`what is ${core.toLowerCase()}, ${core.toLowerCase()} in hinduism`} />
              <span className={shop.hint}>Other ways people search, separated by commas.</span>
            </div>
          </div>

          <div className={shop.field}>
            <div className={shop.listRow} style={{ justifyContent: "space-between" }}>
              <label className={shop.label} htmlFor="s-title">SEO title</label>
              <button type="button" className={`${shop.btn} ${shop.secondary} ${shop.small}`} onClick={() => update({ metaTitle: effectiveMetaTitle({ ...eff, metaTitle: "" }) })} disabled={!draft.word}>Suggest</button>
            </div>
            <input id="s-title" className={shop.input} value={draft.metaTitle} maxLength={120} placeholder={effectiveMetaTitle({ ...eff, metaTitle: "" })} onChange={(e) => update({ metaTitle: e.target.value })} />
            <Meter value={titleLen} min={30} max={60} />
            <div className={shop.counter}><span>Best between 30 and 60 characters</span><span>{titleLen}/60</span></div>
          </div>

          <div className={shop.field}>
            <div className={shop.listRow} style={{ justifyContent: "space-between" }}>
              <label className={shop.label} htmlFor="s-desc">Meta description</label>
              <button type="button" className={`${shop.btn} ${shop.secondary} ${shop.small}`} onClick={() => update({ metaDescription: truncate(effectiveShortAnswer(eff), 155) })} disabled={!draft.definition}>Suggest</button>
            </div>
            <textarea id="s-desc" className={shop.textarea} rows={3} value={draft.metaDescription} maxLength={320} placeholder="A short, persuasive summary that makes people click." onChange={(e) => update({ metaDescription: e.target.value })} />
            <Meter value={descLen} min={70} max={160} />
            <div className={shop.counter}><span>Best between 70 and 160 characters</span><span>{descLen}/160</span></div>
          </div>

          <div className={shop.row2}>
            <div className={shop.field}>
              <label className={shop.label} htmlFor="s-canon">Canonical URL (optional)</label>
              <input id="s-canon" className={shop.input} value={draft.canonicalUrl} placeholder={liveUrl} onChange={(e) => update({ canonicalUrl: e.target.value })} />
              <span className={shop.hint}>Leave empty unless this page duplicates another page.</span>
            </div>
            <div className={shop.field}>
              <label className={shop.label} htmlFor="s-og">Social sharing image (optional)</label>
              <input id="s-og" className={shop.input} value={draft.ogImage} placeholder={draft.illustration || "Uses the illustration"} onChange={(e) => update({ ogImage: e.target.value })} />
              <span className={shop.hint}>Shown on WhatsApp, Facebook and X.</span>
            </div>
          </div>

          <label className={shop.check}>
            <input type="checkbox" checked={draft.noindex} onChange={(e) => update({ noindex: e.target.checked })} />
            <span>
              Hide from search engines (noindex)
              <span className={shop.hint} style={{ display: "block" }}>The page stays visible to visitors but is removed from Google, your sitemap and AI files.</span>
            </span>
          </label>

          <div>
            <h3 className={shop.sectionHead} style={{ marginBottom: 10 }}>SEO checklist</h3>
            <Checklist checks={scores.seo.checks} />
          </div>
        </div>
      )}

      {/* ------------------------------ AI & ANSWERS ------------------------------ */}
      {tab === "ai" && (
        <div className={shop.panel}>
          <div className={styles.bigScores}>
            <div className={styles.bigScore}><div className={`${styles.num} ${toneClass(scores.geo.score)}`} style={{ background: "none" }}>{scores.geo.score}</div><div className={styles.lbl}><strong>GEO score</strong><br />Cited by ChatGPT, Gemini, Perplexity &amp; Google AI Overviews</div></div>
            <div className={styles.bigScore}><div className={`${styles.num} ${toneClass(scores.aeo.score)}`} style={{ background: "none" }}>{scores.aeo.score}</div><div className={styles.lbl}><strong>AEO score</strong><br />Featured snippets, “People also ask”, voice answers</div></div>
            <div className={styles.bigScore}><div className={`${styles.num} ${toneClass(scores.seo.score)}`} style={{ background: "none" }}>{scores.seo.score}</div><div className={styles.lbl}><strong>SEO score</strong><br />Classic search ranking</div></div>
            <div className={styles.bigScore}><div className={`${styles.num} ${toneClass(scores.overall)}`} style={{ background: "none" }}>{scores.overall}</div><div className={styles.lbl}><strong>Overall readiness</strong><br />Weighted blend</div></div>
          </div>

          <div className={shop.field}>
            <div className={shop.listRow} style={{ justifyContent: "space-between" }}>
              <label className={shop.label} htmlFor="a-ans">Quick answer (the line AI and Google will quote)</label>
              <button type="button" className={`${shop.btn} ${shop.secondary} ${shop.small}`} onClick={() => update({ shortAnswer: leadingWords(eff.definition, 55) })} disabled={!draft.definition}>
                <Sparkles size={13} /> Suggest from definition
              </button>
            </div>
            <textarea id="a-ans" className={shop.textarea} rows={3} value={draft.shortAnswer} maxLength={700} placeholder={`${core} is … (one clear, self-contained answer of 40–60 words)`} onChange={(e) => update({ shortAnswer: e.target.value })} />
            <Meter value={answerWords} min={40} max={60} />
            <div className={shop.counter}><span>Aim for 40–60 words, and begin with “{core} is…”</span><span>{answerWords} words</span></div>
          </div>

          <div className={shop.field}>
            <h3 className={shop.sectionHead}>Key takeaways</h3>
            <span className={shop.hint}>3 to 6 short, factual bullet points. Easy for AI systems to quote.</span>
            {draft.keyTakeaways.map((t, i) => (
              <div key={i} className={shop.listRow}>
                <input className={shop.input} value={t} maxLength={240} aria-label={`Takeaway ${i + 1}`} onChange={(e) => update({ keyTakeaways: draft.keyTakeaways.map((x, j) => (j === i ? e.target.value : x)) })} />
                <button type="button" className={`${shop.btn} ${shop.danger} ${shop.small}`} aria-label="Remove takeaway" onClick={() => update({ keyTakeaways: draft.keyTakeaways.filter((_, j) => j !== i) })}><Trash2 size={14} /></button>
              </div>
            ))}
            <div><button type="button" className={`${shop.btn} ${shop.secondary} ${shop.small}`} disabled={draft.keyTakeaways.length >= 10} onClick={() => update({ keyTakeaways: [...draft.keyTakeaways, ""] })}><Plus size={14} /> Add takeaway</button></div>
          </div>

          <div className={shop.field}>
            <label className={shop.label} htmlFor="a-origin">Origin of the word / tradition</label>
            <textarea id="a-origin" className={shop.textarea} rows={2} maxLength={900} value={draft.origin} placeholder="e.g. From the Sanskrit “kundala”, meaning coiled… Found in the Upanishads and Tantra traditions." onChange={(e) => update({ origin: e.target.value })} />
          </div>

          <div className={shop.row2}>
            <div className={shop.field}>
              <label className={shop.label} htmlFor="a-rev">Reviewed by (expert name)</label>
              <input id="a-rev" className={shop.input} value={draft.reviewedBy} maxLength={100} placeholder="e.g. Nikhil, Spiritual Practitioner" onChange={(e) => update({ reviewedBy: e.target.value })} />
            </div>
            <div className={shop.field}>
              <label className={shop.label} htmlFor="a-date">Last reviewed</label>
              <div className={shop.listRow}>
                <input id="a-date" type="date" className={shop.input} value={draft.lastReviewed || ""} onChange={(e) => update({ lastReviewed: e.target.value || null })} />
                <button type="button" className={`${shop.btn} ${shop.secondary} ${shop.small}`} onClick={() => update({ lastReviewed: new Date().toISOString().slice(0, 10) })}>Today</button>
              </div>
              <span className={shop.hint}>Shows freshness and expertise to Google and AI engines.</span>
            </div>
          </div>

          <div className={shop.field}>
            <h3 className={shop.sectionHead}>Sources and citations</h3>
            <span className={shop.hint}>Credible references (scriptures, books, respected websites). AI engines trust and cite pages that cite others.</span>
            {draft.sources.map((s, i) => (
              <div key={i} className={shop.listRow}>
                <input className={shop.input} style={{ maxWidth: 260 }} value={s.title} placeholder="Title (e.g. Bhagavad Gita 6.5)" aria-label={`Source ${i + 1} title`} onChange={(e) => update({ sources: draft.sources.map((x, j) => (j === i ? { ...x, title: e.target.value } : x)) })} />
                <input className={shop.input} value={s.url} placeholder="https://…" aria-label={`Source ${i + 1} link`} onChange={(e) => update({ sources: draft.sources.map((x, j) => (j === i ? { ...x, url: e.target.value } : x)) })} />
                <button type="button" className={`${shop.btn} ${shop.danger} ${shop.small}`} aria-label="Remove source" onClick={() => update({ sources: draft.sources.filter((_, j) => j !== i) })}><Trash2 size={14} /></button>
              </div>
            ))}
            <div><button type="button" className={`${shop.btn} ${shop.secondary} ${shop.small}`} disabled={draft.sources.length >= 10} onClick={() => update({ sources: [...draft.sources, { title: "", url: "" }] })}><Plus size={14} /> Add source</button></div>
          </div>

          <div className={shop.field}>
            <h3 className={shop.sectionHead}>Reference links (entity links)</h3>
            <span className={shop.hint}>Link this term to its Wikipedia or Wikidata page. This tells AI systems exactly which concept you mean.</span>
            {draft.sameAs.map((u, i) => (
              <div key={i} className={shop.listRow}>
                <input className={shop.input} value={u} placeholder="https://en.wikipedia.org/wiki/…" aria-label={`Reference link ${i + 1}`} onChange={(e) => update({ sameAs: draft.sameAs.map((x, j) => (j === i ? e.target.value : x)) })} />
                <button type="button" className={`${shop.btn} ${shop.danger} ${shop.small}`} aria-label="Remove reference link" onClick={() => update({ sameAs: draft.sameAs.filter((_, j) => j !== i) })}><Trash2 size={14} /></button>
              </div>
            ))}
            <div><button type="button" className={`${shop.btn} ${shop.secondary} ${shop.small}`} disabled={draft.sameAs.length >= 8} onClick={() => update({ sameAs: [...draft.sameAs, ""] })}><Plus size={14} /> Add reference link</button></div>
          </div>

          <div className={shop.row2}>
            <div>
              <h3 className={shop.sectionHead} style={{ marginBottom: 10 }}>GEO checklist (AI citations)</h3>
              <Checklist checks={scores.geo.checks} />
            </div>
            <div>
              <h3 className={shop.sectionHead} style={{ marginBottom: 10 }}>AEO checklist (answers &amp; voice)</h3>
              <Checklist checks={scores.aeo.checks} />
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------ FAQS & LINKS ------------------------------ */}
      {tab === "faq" && (
        <div className={shop.panel}>
          <div>
            <h3 className={shop.sectionHead}>Frequently asked questions</h3>
            <p className={shop.hint}>
              FAQs can appear in Google&apos;s “People also ask” and are a favourite source for AI answers. Write real questions people ask, and answer each in 2 to 4 sentences (15+ words).
            </p>
          </div>
          {draft.faqs.map((f, i) => (
            <div key={i} className={styles.faqCard}>
              <input className={shop.input} value={f.question} maxLength={220} placeholder={`What is ${core}?`} aria-label={`Question ${i + 1}`} onChange={(e) => update({ faqs: draft.faqs.map((x, j) => (j === i ? { ...x, question: e.target.value } : x)) })} />
              <textarea className={shop.textarea} rows={3} value={f.answer} maxLength={1800} placeholder="A clear, direct answer." aria-label={`Answer ${i + 1}`} onChange={(e) => update({ faqs: draft.faqs.map((x, j) => (j === i ? { ...x, answer: e.target.value } : x)) })} />
              <div className={shop.listRow}>
                <button type="button" className={`${shop.btn} ${shop.secondary} ${shop.small}`} disabled={i === 0} aria-label="Move up" onClick={() => update({ faqs: move(draft.faqs, i, i - 1) })}><ArrowUp size={14} /></button>
                <button type="button" className={`${shop.btn} ${shop.secondary} ${shop.small}`} disabled={i === draft.faqs.length - 1} aria-label="Move down" onClick={() => update({ faqs: move(draft.faqs, i, i + 1) })}><ArrowDown size={14} /></button>
                <span className={shop.hint} style={{ flex: 1 }}>{wordCount(f.answer)} words</span>
                <button type="button" className={`${shop.btn} ${shop.danger} ${shop.small}`} aria-label="Remove question" onClick={() => update({ faqs: draft.faqs.filter((_, j) => j !== i) })}><Trash2 size={14} /></button>
              </div>
            </div>
          ))}
          <div className={shop.listRow}>
            <button type="button" className={`${shop.btn} ${shop.secondary}`} disabled={draft.faqs.length >= 15} onClick={() => update({ faqs: [...draft.faqs, { question: "", answer: "" }] })}><Plus size={15} /> Add question</button>
            {faqMissing && (
              <button type="button" className={`${shop.btn} ${shop.secondary}`} disabled={!draft.word} onClick={() => update({ faqs: [
                { question: `What is ${core}?`, answer: "" },
                { question: `What is the meaning of ${core} in Sanatan Dharma?`, answer: "" },
                { question: `Why is ${core} important?`, answer: "" },
                { question: `How is ${core} practised or experienced?`, answer: "" },
              ] })}><Sparkles size={14} /> Add suggested questions</button>
            )}
          </div>
          <p className={shop.hint}>Questions left without an answer are not saved.</p>

          <div>
            <h3 className={shop.sectionHead}>Related terms (internal links)</h3>
            <p className={shop.hint}>Link to 3 or more other terms. This builds a web of pages Google can crawl, and keeps visitors reading.</p>
          </div>
          <div className={styles.chips}>
            {relatedChosen.map((t) => (
              <span key={t.id} className={styles.chip}>
                {coreWord(t.word)}
                <button type="button" aria-label={`Remove ${t.word}`} onClick={() => update({ relatedTerms: draft.relatedTerms.filter((s) => s !== t.slug) })}><X size={13} /></button>
              </span>
            ))}
            {relatedChosen.length === 0 && <span className={shop.hint}>None yet.</span>}
          </div>
          <div className={shop.listRow}>
            <input className={shop.input} placeholder="Search terms to add…" aria-label="Search terms to link" value={relFilter} onChange={(e) => setRelFilter(e.target.value)} />
            <button type="button" className={`${shop.btn} ${shop.secondary}`} onClick={() => {
              const same = allTerms.filter((t) => t.id !== initial.id && t.category && t.category === draft.category && !draft.relatedTerms.includes(t.slug)).slice(0, 4);
              update({ relatedTerms: [...draft.relatedTerms, ...same.map((t) => t.slug)].slice(0, 12) });
            }} disabled={!draft.category}><Sparkles size={14} /> Auto-suggest from category</button>
          </div>
          <div className={styles.pickList} role="listbox" aria-label="Terms you can link">
            {relatedOptions.map((t) => (
              <button key={t.id} type="button" className={styles.pickItem} onClick={() => update({ relatedTerms: [...draft.relatedTerms, t.slug].slice(0, 12) })}>
                + {t.word} <span className={shop.hint}>{t.category}</span>
              </button>
            ))}
            {relatedOptions.length === 0 && <div className={shop.hint} style={{ padding: 12 }}>No matching terms.</div>}
          </div>
        </div>
      )}

      {/* ------------------------------ PREVIEW ------------------------------ */}
      {tab === "preview" && (
        <div className={shop.panel}>
          <div>
            <h3 className={shop.sectionHead}>Structured data (what search engines and AI read)</h3>
            <p className={shop.hint}>Generated automatically from the fields you filled in: DefinedTerm, WebPage (with a voice-readable answer), FAQPage and Breadcrumbs.</p>
          </div>
          <pre className={styles.pre} aria-label="JSON-LD preview">{jsonLd}</pre>

          <div>
            <h3 className={shop.sectionHead}>Check it with Google</h3>
            <p className={shop.hint}>After the term is published and live, test it:</p>
            <div className={shop.listRow} style={{ flexWrap: "wrap", marginTop: 8 }}>
              <a className={`${shop.btn} ${shop.secondary}`} href={`https://search.google.com/test/rich-results?url=${encodeURIComponent(liveUrl)}`} target="_blank" rel="noopener noreferrer"><ExternalLink size={14} /> Rich Results Test</a>
              <a className={`${shop.btn} ${shop.secondary}`} href={`https://validator.schema.org/#url=${encodeURIComponent(liveUrl)}`} target="_blank" rel="noopener noreferrer"><ExternalLink size={14} /> Schema validator</a>
            </div>
          </div>

          <div>
            <h3 className={shop.sectionHead}>What an AI assistant reads from your llms.txt</h3>
            <pre className={styles.pre} aria-label="AI view">{`### ${eff.word || "Term"}
URL: ${SITE_URL}/blog/glossary/${eff.slug || "your-term"}
${effectiveShortAnswer(eff)}
${eff.alternateNames.length ? `Also known as: ${eff.alternateNames.join(", ")}\n` : ""}${eff.origin ? `Origin: ${eff.origin}\n` : ""}${eff.keyTakeaways.filter(Boolean).map((k) => `- ${k}`).join("\n")}
${eff.faqs.filter((f) => f.question && f.answer).slice(0, 4).map((f) => `Q: ${f.question}\nA: ${f.answer}`).join("\n")}`}</pre>
            <p className={shop.hint}>Published terms are added to /llms.txt and /llm-full.txt automatically.</p>
          </div>
        </div>
      )}
    </form>
  );
}
