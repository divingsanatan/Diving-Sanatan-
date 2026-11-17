"use client";

import React, { useMemo, useState } from "react";
import { ArrowLeft, ExternalLink, Plus, Save, Sparkles, Trash2, X } from "lucide-react";
import RichTextEditor from "@/components/ui/RichTextEditor";
import { SITE_URL, stripHtml, truncate, wordCount } from "@/lib/shopShared";
import { leadingWords } from "@/lib/glossaryShared";
import { scoreTone, slugifyQuestion, type Check } from "@/lib/faqShared";
import {
  QA_DEFAULT_CATEGORIES,
  defaultQaFocusKeyword,
  effectiveMetaDescription,
  effectiveMetaTitle,
  effectiveShortAnswer,
  isAnswered,
  qaJsonLd,
  qaUrl,
  relatedQuestions,
  scoreQuestion,
  type QaQuestion,
} from "@/lib/qaShared";
import type { PractitionerOption } from "./qaApi";
import shop from "../shop/adminShop.module.css";
// Score pills, big score cards, chips, pickers and code blocks are shared with the glossary editor.
import styles from "../glossary/adminGlossary.module.css";

type Tab = "question" | "answer" | "seo" | "ai" | "links" | "preview";

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

export default function QaEditor({
  initial, allQuestions, practitioners, isStaff, saving, onSave, onBack, onError,
}: {
  initial: QaQuestion;
  allQuestions: QaQuestion[];
  practitioners: PractitionerOption[];
  /** Staff can edit everything. Healers can only write the answer (the server enforces this too). */
  isStaff: boolean;
  saving: boolean;
  onSave: (draft: QaQuestion) => void;
  onBack: (dirty: boolean) => void;
  onError: (message: string) => void;
}) {
  const [draft, setDraft] = useState<QaQuestion>(initial);
  const [secText, setSecText] = useState(initial.secondaryKeywords.join(", "));
  const [slugTouched, setSlugTouched] = useState(!!initial.id);
  const [tab, setTab] = useState<Tab>(initial.id && !isAnswered(initial) ? "answer" : "question");
  const [relFilter, setRelFilter] = useState("");
  const [initialJson, setInitialJson] = useState(() => JSON.stringify(initial));

  // After a save the parent hands us the stored question: adopt it as the new baseline (keeps the current tab)
  const [prevInitial, setPrevInitial] = useState(initial);
  if (initial !== prevInitial) {
    setPrevInitial(initial);
    setDraft(initial);
    setSecText(initial.secondaryKeywords.join(", "));
    setInitialJson(JSON.stringify(initial));
  }

  const isNew = !initial.id;
  const eff: QaQuestion = useMemo(() => ({ ...draft, secondaryKeywords: parseList(secText) }), [draft, secText]);
  const dirty = JSON.stringify(draft) !== initialJson;
  const scores = useMemo(() => scoreQuestion(eff), [eff]);
  const update = (patch: Partial<QaQuestion>) => setDraft((d) => ({ ...d, ...patch }));
  const locked = !isStaff; // healers: question wording and SEO are read-only

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!eff.title.trim()) { setTab("question"); onError("Please enter the question."); return; }
    if (eff.status === "published" && isNew && !stripHtml(eff.answer)) {
      // Allowed: a published, unanswered question simply waits for a healer. Nothing to block.
    }
    onSave(eff);
  };

  const answerWords = eff.shortAnswer.trim() ? eff.shortAnswer.trim().split(/\s+/).length : 0;
  const slugChangeWarning = !isNew && initial.status === "published" && initial.slug !== draft.slug;
  const titleLen = eff.metaTitle.trim().length;
  const descLen = eff.metaDescription.trim().length;
  const liveUrl = qaUrl(eff.slug || "your-question");
  const jsonLd = useMemo(() => {
    const ld = qaJsonLd(eff, []);
    return ld ? JSON.stringify(ld, null, 2) : "";
  }, [eff]);

  const categories = useMemo(() => Array.from(new Set([...QA_DEFAULT_CATEGORIES, ...allQuestions.map((q) => q.category).filter(Boolean)])), [allQuestions]);
  const relatedChosen = eff.relatedQuestions.map((s) => allQuestions.find((q) => q.slug === s)).filter((q): q is QaQuestion => !!q);
  const relatedOptions = allQuestions
    .filter((q) => q.id !== initial.id && q.status === "published" && isAnswered(q) && !eff.relatedQuestions.includes(q.slug))
    .filter((q) => !relFilter || q.title.toLowerCase().includes(relFilter.toLowerCase()))
    .slice(0, 40);

  const pickHealer = (id: string) => {
    const p = practitioners.find((x) => x.id === id);
    if (!p) { update({ practitionerId: "" }); return; }
    update({ practitionerId: p.id, answererName: p.name, answererRole: p.specialty || "Healer", answererCredentials: p.credentials || draft.answererCredentials, answererImage: p.image || draft.answererImage });
  };

  const TABS: { id: Tab; label: string; badge?: string }[] = [
    { id: "question", label: "Question" },
    { id: "answer", label: "Answer" },
    ...(isStaff ? [{ id: "seo" as Tab, label: "SEO", badge: String(scores.seo.score) }] : []),
    { id: "ai", label: isStaff ? "AI & answers" : "Facts & sources", badge: isStaff ? `${scores.geo.score}/${scores.aeo.score}` : undefined },
    ...(isStaff ? [{ id: "links" as Tab, label: "Related", badge: String(eff.relatedQuestions.length) }, { id: "preview" as Tab, label: "Preview & schema" }] : []),
  ];

  return (
    <form onSubmit={submit} className={shop.wrap}>
      <div className={shop.editorBar}>
        <div className={shop.editorTitle}>
          <button type="button" className={`${shop.btn} ${shop.secondary} ${shop.small}`} onClick={() => onBack(dirty)}><ArrowLeft size={14} /> Q&amp;A</button>
          <span>{isNew ? "New Q&A" : truncate(eff.title || "Edit question", 60)}</span>
          {dirty && <span className={shop.dirty}>● Unsaved changes</span>}
        </div>
        <div className={shop.editorBtns}>
          {isAnswered(eff) && (
            <div className={styles.scores} aria-label="Scores">
              <span className={`${styles.pillScore} ${toneClass(scores.seo.score)}`}>SEO <small>{scores.seo.score}</small></span>
              <span className={`${styles.pillScore} ${toneClass(scores.geo.score)}`}>GEO <small>{scores.geo.score}</small></span>
              <span className={`${styles.pillScore} ${toneClass(scores.aeo.score)}`}>AEO <small>{scores.aeo.score}</small></span>
            </div>
          )}
          {!isNew && initial.status === "published" && (
            <a href={`/blog/quora-qa/${initial.slug}`} target="_blank" rel="noopener noreferrer" className={`${shop.btn} ${shop.secondary}`}><ExternalLink size={15} /> View live</a>
          )}
          <button type="submit" className={`${shop.btn} ${shop.primary}`} disabled={saving}><Save size={15} /> {saving ? "Saving…" : isNew ? "Create Q&A" : "Save changes"}</button>
        </div>
      </div>

      <div className={shop.tabs} role="tablist">
        {TABS.map((t) => (
          <button key={t.id} type="button" role="tab" aria-selected={tab === t.id} className={`${shop.tab} ${tab === t.id ? shop.tabOn : ""}`} onClick={() => setTab(t.id)}>
            {t.label}{t.badge ? ` · ${t.badge}` : ""}
          </button>
        ))}
      </div>

      {/* ------------------------------ QUESTION ------------------------------ */}
      {tab === "question" && (
        <div className={shop.panel}>
          {locked && <p className={shop.hint}>Only the team can edit the question itself. You can write the answer on the next tab.</p>}
          <div className={shop.field}>
            <label className={shop.label} htmlFor="q-title">Question *</label>
            <input id="q-title" className={shop.input} disabled={locked} value={draft.title} maxLength={220} placeholder="e.g. Can meditation help with exam anxiety?" onChange={(e) => {
              const title = e.target.value;
              update(slugTouched ? { title } : { title, slug: slugifyQuestion(title) });
            }} />
            <span className={shop.hint}>The wording a visitor would use. It becomes the page heading and title. Fix typos here, but keep the meaning.</span>
          </div>

          <div className={shop.field}>
            <label className={shop.label} htmlFor="q-desc">Details from the asker</label>
            <textarea id="q-desc" className={shop.textarea} rows={4} disabled={locked} value={draft.description} maxLength={1500} onChange={(e) => update({ description: e.target.value })} />
            <span className={shop.hint}>Plain text. Remove anything personal (phone numbers, addresses, names, medical records) before publishing.</span>
          </div>

          <div className={shop.row2}>
            <div className={shop.field}>
              <label className={shop.label} htmlFor="q-cat">Topic</label>
              <input id="q-cat" className={shop.input} list="qa-cats" disabled={locked} value={draft.category} maxLength={60} placeholder="Choose or type a topic" onChange={(e) => update({ category: e.target.value })} />
              <datalist id="qa-cats">{categories.map((c) => (<option key={c} value={c} />))}</datalist>
            </div>
            <div className={shop.field}>
              <label className={shop.label} htmlFor="q-status">Status</label>
              <select id="q-status" className={shop.select} disabled={locked} value={draft.status} onChange={(e) => update({ status: e.target.value as QaQuestion["status"] })}>
                <option value="pending">Awaiting approval (hidden)</option>
                <option value="published">Published (live)</option>
                <option value="rejected">Rejected (hidden)</option>
              </select>
            </div>
          </div>

          <div className={shop.field}>
            <label className={shop.label} htmlFor="q-slug">Page address (URL)</label>
            <div className={shop.listRow}>
              <span className={shop.hint} style={{ whiteSpace: "nowrap" }}>/blog/quora-qa/</span>
              <input id="q-slug" className={shop.input} disabled={locked} value={draft.slug} maxLength={100} placeholder="created automatically" onChange={(e) => { setSlugTouched(true); update({ slug: slugifyQuestion(e.target.value) }); }} />
            </div>
            {slugChangeWarning && <span className={shop.hint} style={{ color: "#b45309" }}>You are changing the address of a live page. A permanent (301) redirect from the old address is created automatically.</span>}
          </div>

          <div className={shop.row2}>
            <div className={shop.field}>
              <label className={shop.label} htmlFor="q-asker">Shown as asker</label>
              <input id="q-asker" className={shop.input} disabled={locked || draft.anonymous} value={draft.anonymous ? "" : draft.askedByName} maxLength={60} placeholder={draft.anonymous ? "Anonymous" : "e.g. Priya S."} onChange={(e) => update({ askedByName: e.target.value })} />
              <span className={shop.hint}>First name and last initial only. Never an email or full name.</span>
            </div>
            <label className={shop.check} style={{ alignSelf: "end" }}>
              <input type="checkbox" disabled={locked} checked={draft.anonymous} onChange={(e) => update({ anonymous: e.target.checked })} />
              <span>Show as “Community member”</span>
            </label>
          </div>

          {isStaff && (
            <div className={shop.field}>
              <label className={shop.label} htmlFor="q-note">Private moderation note</label>
              <textarea id="q-note" className={shop.textarea} rows={2} value={draft.moderationNote || ""} maxLength={500} placeholder="Only the team sees this, e.g. why it was rejected." onChange={(e) => update({ moderationNote: e.target.value })} />
            </div>
          )}
        </div>
      )}

      {/* ------------------------------ ANSWER ------------------------------ */}
      {tab === "answer" && (
        <div className={shop.panel}>
          <div className={shop.field}>
            <h3 className={shop.sectionHead}>Question</h3>
            <p style={{ margin: 0, fontWeight: 600 }}>{draft.title || "(no question yet)"}</p>
            {draft.description && <p className={shop.hint} style={{ whiteSpace: "pre-wrap" }}>{draft.description}</p>}
          </div>

          <div className={shop.field}>
            <h3 className={shop.sectionHead}>Who is answering?</h3>
            <label className={shop.label} htmlFor="a-prac">Pick a healer from the directory</label>
            <select id="a-prac" className={shop.select} value={draft.practitionerId} onChange={(e) => pickHealer(e.target.value)}>
              <option value="">Choose a healer (or type below)</option>
              {practitioners.map((p) => (<option key={p.id} value={p.id}>{p.name}{p.specialty ? `: ${p.specialty}` : ""}</option>))}
            </select>
          </div>
          <div className={shop.row2}>
            <div className={shop.field}>
              <label className={shop.label} htmlFor="a-name">Answered by</label>
              <input id="a-name" className={shop.input} value={draft.answererName} maxLength={100} placeholder="Healer's full name" onChange={(e) => update({ answererName: e.target.value })} />
            </div>
            <div className={shop.field}>
              <label className={shop.label} htmlFor="a-role">Title</label>
              <input id="a-role" className={shop.input} value={draft.answererRole} maxLength={100} placeholder="e.g. Reiki Master" onChange={(e) => update({ answererRole: e.target.value })} />
            </div>
          </div>
          <div className={shop.field}>
            <label className={shop.label} htmlFor="a-cred">Credentials</label>
            <input id="a-cred" className={shop.input} value={draft.answererCredentials} maxLength={200} placeholder="e.g. Certified Reiki Master, 12 years of practice" onChange={(e) => update({ answererCredentials: e.target.value })} />
            <span className={shop.hint}>Shown with the answer and in the page&apos;s structured data. It is the strongest trust signal for wellbeing topics.</span>
          </div>
          <div className={shop.field}>
            <label className={shop.label} htmlFor="a-img">Healer photo (optional web address)</label>
            <input id="a-img" className={shop.input} value={draft.answererImage} placeholder="https://…" onChange={(e) => update({ answererImage: e.target.value })} />
          </div>

          <div className={shop.field}>
            <span className={shop.label}>The healer&apos;s answer</span>
            <RichTextEditor value={draft.answer} onChange={(v) => update({ answer: v })} placeholder="Write a clear, caring, practical answer in plain language. Explain the why, not just the what." />
            <span className={shop.hint}>{wordCount(draft.answer)} words. Aim for 150+ with a couple of sub-headings or a short list. General guidance only: never diagnose, and suggest seeing a doctor where relevant.</span>
          </div>

          <div className={shop.field}>
            <div className={shop.listRow} style={{ justifyContent: "space-between" }}>
              <label className={shop.label} htmlFor="a-quick">Quick answer (the line AI and Google will quote)</label>
              <button type="button" className={`${shop.btn} ${shop.secondary} ${shop.small}`} onClick={() => update({ shortAnswer: leadingWords(eff.answer, 55) })} disabled={!draft.answer}><Sparkles size={13} /> Suggest from answer</button>
            </div>
            <textarea id="a-quick" className={shop.textarea} rows={3} value={draft.shortAnswer} maxLength={700} placeholder="One clear, self-contained answer of 40–60 words that makes sense on its own." onChange={(e) => update({ shortAnswer: e.target.value })} />
            <Meter value={answerWords} min={40} max={60} />
            <div className={shop.counter}><span>Aim for 40–60 words. Lead with the answer and name the subject (avoid starting with “It” or “This”).</span><span>{answerWords} words</span></div>
          </div>
        </div>
      )}

      {/* -------------------------------- SEO -------------------------------- */}
      {tab === "seo" && isStaff && (
        <div className={shop.panel}>
          {!isAnswered(eff) && <p className={`${shop.hint}`} style={{ color: "#b45309" }}>This question has no healer answer yet, so its page is hidden from Google until it is answered.</p>}
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
                <input id="s-kw" className={shop.input} value={draft.focusKeyword} maxLength={80} placeholder="e.g. can meditation help exam anxiety" onChange={(e) => update({ focusKeyword: e.target.value })} />
                <button type="button" className={`${shop.btn} ${shop.secondary} ${shop.small}`} onClick={() => update({ focusKeyword: defaultQaFocusKeyword(eff.title) })} disabled={!draft.title}>Suggest</button>
              </div>
              <span className={shop.hint}>The main phrase people type. For questions this is usually the question itself.</span>
            </div>
            <div className={shop.field}>
              <label className={shop.label} htmlFor="s-sec">Related search phrases</label>
              <input id="s-sec" className={shop.input} value={secText} onChange={(e) => setSecText(e.target.value)} placeholder="meditation for exam stress, calm before exams" />
              <span className={shop.hint}>Other ways people search, separated by commas.</span>
            </div>
          </div>

          <div className={shop.field}>
            <div className={shop.listRow} style={{ justifyContent: "space-between" }}>
              <label className={shop.label} htmlFor="s-title">SEO title</label>
              <button type="button" className={`${shop.btn} ${shop.secondary} ${shop.small}`} onClick={() => update({ metaTitle: effectiveMetaTitle({ ...eff, metaTitle: "" }) })} disabled={!draft.title}>Suggest</button>
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

      {/* ------------------------------ AI & ANSWERS / FACTS ------------------------------ */}
      {tab === "ai" && (
        <div className={shop.panel}>
          {isStaff && (
            <div className={styles.bigScores}>
              <div className={styles.bigScore}><div className={`${styles.num} ${toneClass(scores.geo.score)}`} style={{ background: "none" }}>{scores.geo.score}</div><div className={styles.lbl}><strong>GEO score</strong><br />Cited by ChatGPT, Gemini, Perplexity &amp; Google AI Overviews</div></div>
              <div className={styles.bigScore}><div className={`${styles.num} ${toneClass(scores.aeo.score)}`} style={{ background: "none" }}>{scores.aeo.score}</div><div className={styles.lbl}><strong>AEO score</strong><br />Featured snippets, “People also ask”, voice answers</div></div>
              <div className={styles.bigScore}><div className={`${styles.num} ${toneClass(scores.seo.score)}`} style={{ background: "none" }}>{scores.seo.score}</div><div className={styles.lbl}><strong>SEO score</strong><br />Classic search ranking</div></div>
              <div className={styles.bigScore}><div className={`${styles.num} ${toneClass(scores.overall)}`} style={{ background: "none" }}>{scores.overall}</div><div className={styles.lbl}><strong>Overall readiness</strong><br />Weighted blend</div></div>
            </div>
          )}

          <LineList
            label="Key takeaways"
            hint="3 to 6 short, factual bullet points from the healer's answer. Easy for AI systems to quote."
            items={draft.keyTakeaways} max={10} maxLength={240} placeholder="A short, factual point"
            onChange={(keyTakeaways) => update({ keyTakeaways })}
          />

          {isStaff && (
            <LineList
              label="Alternate questions"
              hint="Other ways people ask the same thing, e.g. “Does Reiki actually work?”. These show on the page and help voice search match."
              items={draft.alternateQuestions} max={10} maxLength={200} placeholder="Another way to ask this"
              onChange={(alternateQuestions) => update({ alternateQuestions })}
            />
          )}

          <div className={shop.row2}>
            <div className={shop.field}>
              <label className={shop.label} htmlFor="r-by">Reviewed by (expert name)</label>
              <input id="r-by" className={shop.input} value={draft.reviewedBy} maxLength={100} placeholder="Expert’s full name and title" onChange={(e) => update({ reviewedBy: e.target.value })} />
            </div>
            <div className={shop.field}>
              <label className={shop.label} htmlFor="r-date">Last reviewed</label>
              <div className={shop.listRow}>
                <input id="r-date" type="date" className={shop.input} value={draft.lastReviewed || ""} onChange={(e) => update({ lastReviewed: e.target.value || null })} />
                <button type="button" className={`${shop.btn} ${shop.secondary} ${shop.small}`} onClick={() => update({ lastReviewed: new Date().toISOString().slice(0, 10) })}>Today</button>
              </div>
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

          {isStaff && (
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
          )}
        </div>
      )}

      {/* ------------------------------ RELATED ------------------------------ */}
      {tab === "links" && isStaff && (
        <div className={shop.panel}>
          <div>
            <h3 className={shop.sectionHead}>Related questions (internal links)</h3>
            <p className={shop.hint}>Link to 2 or more other answered questions. This builds a web of pages Google can crawl, and keeps visitors reading.</p>
          </div>
          <div className={styles.chips}>
            {relatedChosen.map((q) => (
              <span key={q.id} className={styles.chip}>
                {truncate(q.title, 50)}
                <button type="button" aria-label={`Remove ${q.title}`} onClick={() => update({ relatedQuestions: draft.relatedQuestions.filter((s) => s !== q.slug) })}><X size={13} /></button>
              </span>
            ))}
            {relatedChosen.length === 0 && <span className={shop.hint}>None yet.</span>}
          </div>
          <div className={shop.listRow}>
            <input className={shop.input} placeholder="Search questions to add…" aria-label="Search questions to link" value={relFilter} onChange={(e) => setRelFilter(e.target.value)} />
            <button type="button" className={`${shop.btn} ${shop.secondary}`} onClick={() => {
              const picks = relatedQuestions({ ...eff, id: initial.id }, allQuestions.map((q) => (q.id === initial.id ? { ...q, status: "pending" as const } : q)), 4).filter((q) => !draft.relatedQuestions.includes(q.slug));
              update({ relatedQuestions: [...draft.relatedQuestions, ...picks.map((q) => q.slug)].slice(0, 12) });
            }} disabled={!draft.title}><Sparkles size={14} /> Auto-suggest similar questions</button>
          </div>
          <div className={styles.pickList} role="listbox" aria-label="Questions you can link">
            {relatedOptions.map((q) => (
              <button key={q.id} type="button" className={styles.pickItem} onClick={() => update({ relatedQuestions: [...draft.relatedQuestions, q.slug].slice(0, 12) })}>+ {q.title}</button>
            ))}
            {relatedOptions.length === 0 && <div className={shop.hint} style={{ padding: 12 }}>No matching answered questions.</div>}
          </div>
        </div>
      )}

      {/* ------------------------------ PREVIEW ------------------------------ */}
      {tab === "preview" && isStaff && (
        <div className={shop.panel}>
          <div>
            <h3 className={shop.sectionHead}>Structured data (what search engines and AI read)</h3>
            <p className={shop.hint}>
              Generated automatically as Q&amp;A markup (QAPage): the visitor&apos;s question, the healer&apos;s accepted answer, who answered, and the approved comments.
              It is only produced once the question has an answer.
            </p>
          </div>
          {jsonLd ? <pre className={styles.pre} aria-label="JSON-LD preview">{jsonLd}</pre> : <p className={shop.hint}>Write the healer&apos;s answer first. Unanswered questions have no structured data and are hidden from search engines.</p>}
          <div>
            <h3 className={shop.sectionHead}>Check it</h3>
            <p className={shop.hint}>After the question is live and answered, validate the markup:</p>
            <div className={shop.listRow} style={{ flexWrap: "wrap", marginTop: 8 }}>
              <a className={`${shop.btn} ${shop.secondary}`} href={`https://validator.schema.org/#url=${encodeURIComponent(liveUrl)}`} target="_blank" rel="noopener noreferrer"><ExternalLink size={14} /> Schema validator</a>
              <a className={`${shop.btn} ${shop.secondary}`} href={`https://search.google.com/test/rich-results?url=${encodeURIComponent(liveUrl)}`} target="_blank" rel="noopener noreferrer"><ExternalLink size={14} /> Google Rich Results Test</a>
            </div>
          </div>
          <div>
            <h3 className={shop.sectionHead}>What an AI assistant reads from your llms.txt</h3>
            <pre className={styles.pre} aria-label="AI view">{`- [${eff.title || "Question"}](${SITE_URL}/blog/quora-qa/${eff.slug || "your-question"}): ${truncate(effectiveShortAnswer(eff), 140)}`}</pre>
            <p className={shop.hint}>Live, answered questions are added to /llms.txt and /llm-full.txt automatically.</p>
          </div>
        </div>
      )}
    </form>
  );
}
