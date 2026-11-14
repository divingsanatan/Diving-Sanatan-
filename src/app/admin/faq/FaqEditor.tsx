"use client";

import React, { useMemo, useState } from "react";
import { ArrowLeft, ExternalLink, Plus, Save, Sparkles, Trash2, X } from "lucide-react";
import RichTextEditor from "@/components/ui/RichTextEditor";
import { SITE_URL, stripHtml, truncate, wordCount } from "@/lib/shopShared";
import { leadingWords } from "@/lib/glossaryShared";
import {
  defaultFocusKeyword,
  effectiveMetaDescription,
  effectiveMetaTitle,
  effectiveShortAnswer,
  faqJsonLd,
  faqUrl,
  relatedBySimilarity,
  scoreFaq,
  scoreTone,
  slugifyQuestion,
  type Check,
  type FaqEntry,
} from "@/lib/faqShared";
import shop from "../shop/adminShop.module.css";
// Score pills, big score cards, chips, pickers and code blocks are shared with the glossary editor.
import styles from "../glossary/adminGlossary.module.css";

type Tab = "content" | "seo" | "ai" | "links" | "preview";

const parseList = (text: string) => Array.from(new Set(text.split(",").map((t) => t.trim()).filter(Boolean)));
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

/** Editable list of one-line texts (takeaways, alternate questions). */
function LineList({
  label, hint, items, max, maxLength, placeholder, onChange,
}: {
  label: string; hint: string; items: string[]; max: number; maxLength: number; placeholder: string;
  onChange: (next: string[]) => void;
}) {
  return (
    <div className={shop.field}>
      <h3 className={shop.sectionHead}>{label}</h3>
      <span className={shop.hint}>{hint}</span>
      {items.map((t, i) => (
        <div key={i} className={shop.listRow}>
          <input className={shop.input} value={t} maxLength={maxLength} placeholder={placeholder} aria-label={`${label} ${i + 1}`} onChange={(e) => onChange(items.map((x, j) => (j === i ? e.target.value : x)))} />
          <button type="button" className={`${shop.btn} ${shop.danger} ${shop.small}`} aria-label={`Remove ${label.toLowerCase()} ${i + 1}`} onClick={() => onChange(items.filter((_, j) => j !== i))}><Trash2 size={14} /></button>
        </div>
      ))}
      <div><button type="button" className={`${shop.btn} ${shop.secondary} ${shop.small}`} disabled={items.length >= max} onClick={() => onChange([...items, ""])}><Plus size={14} /> Add</button></div>
    </div>
  );
}

export default function FaqEditor({
  initial,
  allFaqs,
  saving,
  onSave,
  onBack,
  onError,
}: {
  initial: FaqEntry;
  allFaqs: FaqEntry[];
  saving: boolean;
  onSave: (draft: FaqEntry) => void;
  onBack: (dirty: boolean) => void;
  onError: (message: string) => void;
}) {
  const [draft, setDraft] = useState<FaqEntry>(initial);
  const [secText, setSecText] = useState(initial.secondaryKeywords.join(", "));
  const [slugTouched, setSlugTouched] = useState(!!initial.id);
  const [tab, setTab] = useState<Tab>("content");
  const [relFilter, setRelFilter] = useState("");
  const [initialJson, setInitialJson] = useState(() => JSON.stringify(initial));

  // After a save the parent hands us the stored FAQ: adopt it as the new baseline (keeps the current tab)
  const [prevInitial, setPrevInitial] = useState(initial);
  if (initial !== prevInitial) {
    setPrevInitial(initial);
    setDraft(initial);
    setSecText(initial.secondaryKeywords.join(", "));
    setInitialJson(JSON.stringify(initial));
  }

  const isNew = !initial.id;
  const eff: FaqEntry = useMemo(
    () => ({ ...draft, isPublished: draft.status === "published", secondaryKeywords: parseList(secText) }),
    [draft, secText]
  );
  const dirty = JSON.stringify(eff) !== initialJson && JSON.stringify(draft) !== initialJson;
  const scores = useMemo(() => scoreFaq(eff), [eff]);

  const update = (patch: Partial<FaqEntry>) => setDraft((d) => ({ ...d, ...patch }));

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!eff.question.trim()) {
      setTab("content");
      onError("Please enter the question.");
      return;
    }
    if (!stripHtml(eff.answer)) {
      setTab("content");
      onError("Please write the answer.");
      return;
    }
    onSave(eff);
  };

  const answerWords = eff.shortAnswer.trim() ? eff.shortAnswer.trim().split(/\s+/).length : 0;
  const slugChangeWarning = !isNew && initial.status === "published" && initial.slug !== draft.slug;
  const titleLen = eff.metaTitle.trim().length;
  const descLen = eff.metaDescription.trim().length;
  const liveUrl = faqUrl(eff.slug || "your-question");
  const jsonLd = useMemo(() => JSON.stringify(faqJsonLd(eff), null, 2), [eff]);

  const relatedChosen = eff.relatedFaqs
    .map((s) => allFaqs.find((f) => f.slug === s))
    .filter((f): f is FaqEntry => !!f);
  const relatedOptions = allFaqs
    .filter((f) => f.id !== initial.id && !eff.relatedFaqs.includes(f.slug))
    .filter((f) => !relFilter || f.question.toLowerCase().includes(relFilter.toLowerCase()))
    .slice(0, 40);

  const TABS: { id: Tab; label: string; badge?: string }[] = [
    { id: "content", label: "Content" },
    { id: "seo", label: "SEO", badge: String(scores.seo.score) },
    { id: "ai", label: "AI & answers", badge: `${scores.geo.score}/${scores.aeo.score}` },
    { id: "links", label: "Related & links", badge: String(eff.relatedFaqs.length) },
    { id: "preview", label: "Preview & schema" },
  ];

  return (
    <form onSubmit={submit} className={shop.wrap}>
      <div className={shop.editorBar}>
        <div className={shop.editorTitle}>
          <button type="button" className={`${shop.btn} ${shop.secondary} ${shop.small}`} onClick={() => onBack(dirty)}>
            <ArrowLeft size={14} /> FAQs
          </button>
          <span>{isNew ? "New FAQ" : truncate(eff.question || "Edit FAQ", 60)}</span>
          {dirty && <span className={shop.dirty}>● Unsaved changes</span>}
        </div>
        <div className={shop.editorBtns}>
          <div className={styles.scores} aria-label="Scores">
            <span className={`${styles.pillScore} ${toneClass(scores.seo.score)}`}>SEO <small>{scores.seo.score}</small></span>
            <span className={`${styles.pillScore} ${toneClass(scores.geo.score)}`}>GEO <small>{scores.geo.score}</small></span>
            <span className={`${styles.pillScore} ${toneClass(scores.aeo.score)}`}>AEO <small>{scores.aeo.score}</small></span>
          </div>
          {!isNew && initial.status === "published" && (
            <a href={`/blog/faq/${initial.slug}`} target="_blank" rel="noopener noreferrer" className={`${shop.btn} ${shop.secondary}`}>
              <ExternalLink size={15} /> View live
            </a>
          )}
          <button type="submit" className={`${shop.btn} ${shop.primary}`} disabled={saving}>
            <Save size={15} /> {saving ? "Saving…" : isNew ? "Create FAQ" : "Save changes"}
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
          <div className={shop.field}>
            <label className={shop.label} htmlFor="f-q">Question *</label>
            <input id="f-q" className={shop.input} value={draft.question} maxLength={220} placeholder="e.g. What is holistic healing?" onChange={(e) => {
              const question = e.target.value;
              update(slugTouched ? { question } : { question, slug: slugifyQuestion(question) });
            }} />
            <span className={shop.hint}>Write it the way a visitor would ask it. This becomes the page heading and title.</span>
          </div>

          <div className={shop.field}>
            <label className={shop.label} htmlFor="f-slug">Page address (URL)</label>
            <div className={shop.listRow}>
              <span className={shop.hint} style={{ whiteSpace: "nowrap" }}>/blog/faq/</span>
              <input id="f-slug" className={shop.input} value={draft.slug} maxLength={100} onChange={(e) => { setSlugTouched(true); update({ slug: slugifyQuestion(e.target.value) }); }} />
            </div>
            <span className={shop.hint}>Lowercase words joined by hyphens, up to 60 characters.</span>
            {slugChangeWarning && (
              <span className={shop.hint} style={{ color: "#b45309" }}>
                You are changing the address of a live page. A permanent (301) redirect from the old address will be created automatically so no rankings are lost.
              </span>
            )}
          </div>

          <div className={shop.row2}>
            <div className={shop.field}>
              <label className={shop.label} htmlFor="f-status">Status</label>
              <select id="f-status" className={shop.select} value={draft.status} onChange={(e) => update({ status: e.target.value as FaqEntry["status"] })}>
                <option value="draft">Draft (hidden)</option>
                <option value="published">Published (live)</option>
              </select>
            </div>
            <label className={shop.check} style={{ alignSelf: "end" }}>
              <input type="checkbox" checked={draft.verified} onChange={(e) => update({ verified: e.target.checked })} />
              <span>
                Show the expert-verified badge
                <span className={shop.hint} style={{ display: "block" }}>Uses the name in “Reviewed by” (AI &amp; answers tab) when it is filled in.</span>
              </span>
            </label>
          </div>

          <div className={shop.field}>
            <span className={shop.label}>Answer *</span>
            <RichTextEditor value={draft.answer} onChange={(v) => update({ answer: v })} placeholder="The full answer, in clear, plain language." />
            <span className={shop.hint}>{wordCount(draft.answer)} words. This is the main answer shown on the FAQ list and on the question&apos;s own page.</span>
          </div>

          <div className={shop.field}>
            <span className={shop.label}>In-depth explanation (optional)</span>
            <RichTextEditor value={draft.extendedContent} onChange={(v) => update({ extendedContent: v })} placeholder="Go deeper if the topic needs it. Use sub-headings (H2/H3) or lists to break it up." />
            <span className={shop.hint}>
              {wordCount(draft.extendedContent)} words. Pages with 150+ total words and a clear structure rank better and are quoted more by AI assistants.
            </span>
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
                <input id="s-kw" className={shop.input} value={draft.focusKeyword} maxLength={80} placeholder="e.g. what is holistic healing" onChange={(e) => update({ focusKeyword: e.target.value })} />
                <button type="button" className={`${shop.btn} ${shop.secondary} ${shop.small}`} onClick={() => update({ focusKeyword: defaultFocusKeyword(eff.question) })} disabled={!draft.question}>Suggest</button>
              </div>
              <span className={shop.hint}>The main phrase people type. For FAQs this is usually the question itself.</span>
            </div>
            <div className={shop.field}>
              <label className={shop.label} htmlFor="s-sec">Related search phrases</label>
              <input id="s-sec" className={shop.input} value={secText} onChange={(e) => setSecText(e.target.value)} placeholder="holistic healing meaning, benefits of holistic healing" />
              <span className={shop.hint}>Other ways people search, separated by commas.</span>
            </div>
          </div>

          <div className={shop.field}>
            <div className={shop.listRow} style={{ justifyContent: "space-between" }}>
              <label className={shop.label} htmlFor="s-title">SEO title</label>
              <button type="button" className={`${shop.btn} ${shop.secondary} ${shop.small}`} onClick={() => update({ metaTitle: effectiveMetaTitle({ ...eff, metaTitle: "" }) })} disabled={!draft.question}>Suggest</button>
            </div>
            <input id="s-title" className={shop.input} value={draft.metaTitle} maxLength={120} placeholder={effectiveMetaTitle({ ...eff, metaTitle: "" })} onChange={(e) => update({ metaTitle: e.target.value })} />
            <Meter value={titleLen} min={30} max={60} />
            <div className={shop.counter}><span>Best between 30 and 60 characters</span><span>{titleLen}/60</span></div>
          </div>

          <div className={shop.field}>
            <div className={shop.listRow} style={{ justifyContent: "space-between" }}>
              <label className={shop.label} htmlFor="s-desc">Meta description</label>
              <button type="button" className={`${shop.btn} ${shop.secondary} ${shop.small}`} onClick={() => update({ metaDescription: truncate(effectiveShortAnswer(eff), 155) })} disabled={!draft.answer}>Suggest</button>
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
              <input id="s-og" className={shop.input} value={draft.ogImage} placeholder="https://…" onChange={(e) => update({ ogImage: e.target.value })} />
              <span className={shop.hint}>Full web address of an image. Shown on WhatsApp, Facebook and X.</span>
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
              <button type="button" className={`${shop.btn} ${shop.secondary} ${shop.small}`} onClick={() => update({ shortAnswer: leadingWords(eff.answer, 55) })} disabled={!draft.answer}>
                <Sparkles size={13} /> Suggest from answer
              </button>
            </div>
            <textarea id="a-ans" className={shop.textarea} rows={3} value={draft.shortAnswer} maxLength={700} placeholder="One clear, self-contained answer of 40–60 words that makes sense on its own." onChange={(e) => update({ shortAnswer: e.target.value })} />
            <Meter value={answerWords} min={40} max={60} />
            <div className={shop.counter}><span>Aim for 40–60 words. Lead with the answer and name the subject (avoid starting with “It” or “This”).</span><span>{answerWords} words</span></div>
          </div>

          <LineList
            label="Key takeaways"
            hint="3 to 6 short, factual bullet points. Easy for AI systems to quote."
            items={draft.keyTakeaways} max={10} maxLength={240} placeholder="A short, factual point"
            onChange={(keyTakeaways) => update({ keyTakeaways })}
          />

          <LineList
            label="Alternate questions"
            hint="Other ways people ask the same thing, e.g. “Does Reiki actually work?”. These show on the page and help voice search match."
            items={draft.alternateQuestions} max={10} maxLength={200} placeholder="Another way to ask this"
            onChange={(alternateQuestions) => update({ alternateQuestions })}
          />

          <div className={shop.row2}>
            <div className={shop.field}>
              <label className={shop.label} htmlFor="a-rev">Reviewed by (expert name)</label>
              <input id="a-rev" className={shop.input} value={draft.reviewedBy} maxLength={100} placeholder="Expert’s full name and title" onChange={(e) => update({ reviewedBy: e.target.value })} />
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
            <span className={shop.hint}>Link the main concept of this question to its Wikipedia or Wikidata page. This tells AI systems exactly what you mean.</span>
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

      {/* ------------------------------ RELATED & LINKS ------------------------------ */}
      {tab === "links" && (
        <div className={shop.panel}>
          <div>
            <h3 className={shop.sectionHead}>Related questions (internal links)</h3>
            <p className={shop.hint}>Link to 2 or more other questions. This builds a web of pages Google can crawl, and keeps visitors reading.</p>
          </div>
          <div className={styles.chips}>
            {relatedChosen.map((f) => (
              <span key={f.id} className={styles.chip}>
                {truncate(f.question, 50)}
                <button type="button" aria-label={`Remove ${f.question}`} onClick={() => update({ relatedFaqs: draft.relatedFaqs.filter((s) => s !== f.slug) })}><X size={13} /></button>
              </span>
            ))}
            {relatedChosen.length === 0 && <span className={shop.hint}>None yet.</span>}
          </div>
          <div className={shop.listRow}>
            <input className={shop.input} placeholder="Search questions to add…" aria-label="Search questions to link" value={relFilter} onChange={(e) => setRelFilter(e.target.value)} />
            <button type="button" className={`${shop.btn} ${shop.secondary}`} onClick={() => {
              const picks = relatedBySimilarity({ ...eff, id: initial.id }, allFaqs, 4).filter((f) => !draft.relatedFaqs.includes(f.slug));
              update({ relatedFaqs: [...draft.relatedFaqs, ...picks.map((f) => f.slug)].slice(0, 12) });
            }} disabled={!draft.question}><Sparkles size={14} /> Auto-suggest similar questions</button>
          </div>
          <div className={styles.pickList} role="listbox" aria-label="Questions you can link">
            {relatedOptions.map((f) => (
              <button key={f.id} type="button" className={styles.pickItem} onClick={() => update({ relatedFaqs: [...draft.relatedFaqs, f.slug].slice(0, 12) })}>
                + {f.question}
              </button>
            ))}
            {relatedOptions.length === 0 && <div className={shop.hint} style={{ padding: 12 }}>No matching questions.</div>}
          </div>
        </div>
      )}

      {/* ------------------------------ PREVIEW ------------------------------ */}
      {tab === "preview" && (
        <div className={shop.panel}>
          <div>
            <h3 className={shop.sectionHead}>Structured data (what search engines and AI read)</h3>
            <p className={shop.hint}>
              Generated automatically from the fields you filled in: WebPage (with a voice-readable answer), FAQPage and Breadcrumbs.
              Note: Google stopped showing FAQ rich results in May 2026. The markup is still valid and can be read by other search engines and AI systems, but the real wins are a clear visible answer, its own page, sources and freshness.
            </p>
          </div>
          <pre className={styles.pre} aria-label="JSON-LD preview">{jsonLd}</pre>

          <div>
            <h3 className={shop.sectionHead}>Check it</h3>
            <p className={shop.hint}>After the FAQ is published and live, validate the markup:</p>
            <div className={shop.listRow} style={{ flexWrap: "wrap", marginTop: 8 }}>
              <a className={`${shop.btn} ${shop.secondary}`} href={`https://validator.schema.org/#url=${encodeURIComponent(liveUrl)}`} target="_blank" rel="noopener noreferrer"><ExternalLink size={14} /> Schema validator</a>
            </div>
          </div>

          <div>
            <h3 className={shop.sectionHead}>What an AI assistant reads from your llms.txt</h3>
            <pre className={styles.pre} aria-label="AI view">{`- [${eff.question || "Question"}](${SITE_URL}/blog/faq/${eff.slug || "your-question"}): ${truncate(effectiveShortAnswer(eff), 140)}`}</pre>
            <p className={shop.hint}>Published FAQs are added to /llms.txt and /llm-full.txt (with the full quick answer and takeaways) automatically.</p>
          </div>
        </div>
      )}
    </form>
  );
}
