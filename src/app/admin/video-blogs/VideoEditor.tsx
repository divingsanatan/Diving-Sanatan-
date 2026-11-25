"use client";

import React, { useMemo, useState } from "react";
import { ArrowLeft, ExternalLink, Plus, Save, Sparkles, Trash2, X } from "lucide-react";
import RichTextEditor from "@/components/ui/RichTextEditor";
import CategorySelect from "@/components/admin/CategorySelect";
import { SITE_URL, truncate, wordCount } from "@/lib/shopShared";
import { leadingWords } from "@/lib/glossaryShared";
import { scoreTone, slugifyQuestion, type Check } from "@/lib/faqShared";
import {
  defaultVideoFocusKeyword,
  effectiveMetaDescription,
  effectiveMetaTitle,
  effectiveSummary,
  formatDuration,
  parseDuration,
  parseTranscript,
  relatedVideos,
  scoreVideo,
  thumbnailOf,
  transcriptPlain,
  videoJsonLd,
  videoUrl,
  type VideoPost,
} from "@/lib/videoShared";
import { parseYouTube, youtubeThumb } from "@/lib/youtube";
import shop from "../shop/adminShop.module.css";
// Score pills, big score cards, chips, pickers and code blocks are shared with the glossary editor.
import styles from "../glossary/adminGlossary.module.css";

type Tab = "video" | "content" | "seo" | "ai" | "links" | "preview";

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

export default function VideoEditor({
  initial, allVideos, saving, onSave, onBack, onError,
}: {
  initial: VideoPost;
  allVideos: VideoPost[];
  saving: boolean;
  onSave: (draft: VideoPost) => void;
  onBack: (dirty: boolean) => void;
  onError: (message: string) => void;
}) {
  const [draft, setDraft] = useState<VideoPost>(initial);
  const [secText, setSecText] = useState(initial.secondaryKeywords.join(", "));
  const [ytInput, setYtInput] = useState(initial.youtubeId ? `https://www.youtube.com/watch?v=${initial.youtubeId}` : "");
  const [durText, setDurText] = useState(formatDuration(initial.durationSeconds));
  const [slugTouched, setSlugTouched] = useState(!!initial.id);
  const [tab, setTab] = useState<Tab>("video");
  const [relFilter, setRelFilter] = useState("");
  const [initialJson, setInitialJson] = useState(() => JSON.stringify(initial));

  // After a save the parent hands us the stored video: adopt it as the new baseline (keeps the current tab)
  const [prevInitial, setPrevInitial] = useState(initial);
  if (initial !== prevInitial) {
    setPrevInitial(initial);
    setDraft(initial);
    setSecText(initial.secondaryKeywords.join(", "));
    setDurText(formatDuration(initial.durationSeconds));
    setInitialJson(JSON.stringify(initial));
  }

  const isNew = !initial.id;
  const eff: VideoPost = useMemo(() => ({ ...draft, secondaryKeywords: parseList(secText) }), [draft, secText]);
  const dirty = JSON.stringify(draft) !== initialJson;
  const scores = useMemo(() => scoreVideo(eff), [eff]);
  const update = (patch: Partial<VideoPost>) => setDraft((d) => ({ ...d, ...patch }));

  const parsedYt = ytInput.trim() ? parseYouTube(ytInput) : null;
  const ytError = ytInput.trim() && !parsedYt ? "That does not look like a YouTube link." : "";
  const durError = durText.trim() && parseDuration(durText) === null ? "Use a format like 0:58 or 12:05." : "";

  const onYtChange = (value: string) => {
    setYtInput(value);
    const p = parseYouTube(value);
    if (p) update({ youtubeId: p.id, ...(p.vertical ? { format: "vertical" as const } : {}) });
  };
  const onDurChange = (value: string) => {
    setDurText(value);
    update({ durationSeconds: value.trim() === "" ? null : parseDuration(value) });
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!eff.title.trim()) { setTab("video"); onError("Please enter the title."); return; }
    if (!eff.youtubeId) { setTab("video"); onError("Please paste the YouTube link."); return; }
    if (durError) { setTab("video"); onError(durError); return; }
    onSave(eff);
  };

  const lines = useMemo(() => parseTranscript(eff.transcript), [eff.transcript]);
  const transcriptWords = transcriptPlain(lines).split(/\s+/).filter(Boolean).length;
  const timedCount = lines.filter((l) => l.timed).length;
  const summaryWords = eff.shortAnswer.trim() ? eff.shortAnswer.trim().split(/\s+/).length : 0;
  const slugChangeWarning = !isNew && initial.status === "published" && initial.slug !== draft.slug;
  const titleLen = eff.metaTitle.trim().length;
  const descLen = eff.metaDescription.trim().length;
  const liveUrl = videoUrl(eff.slug || "your-video");
  const jsonLd = useMemo(() => (eff.youtubeId ? JSON.stringify(videoJsonLd(eff), null, 2) : ""), [eff]);

  const relatedChosen = eff.relatedVideos.map((s) => allVideos.find((v) => v.slug === s)).filter((v): v is VideoPost => !!v);
  const relatedOptions = allVideos
    .filter((v) => v.id !== initial.id && v.status === "published" && !eff.relatedVideos.includes(v.slug))
    .filter((v) => !relFilter || v.title.toLowerCase().includes(relFilter.toLowerCase()))
    .slice(0, 40);

  const TABS: { id: Tab; label: string; badge?: string }[] = [
    { id: "video", label: "Video" },
    { id: "content", label: "Transcript & article" },
    { id: "seo", label: "SEO", badge: String(scores.seo.score) },
    { id: "ai", label: "AI & answers", badge: `${scores.geo.score}/${scores.aeo.score}` },
    { id: "links", label: "Related", badge: String(eff.relatedVideos.length) },
    { id: "preview", label: "Preview & schema" },
  ];

  const vertical = eff.format === "vertical";
  const thumb = eff.youtubeId ? thumbnailOf(eff) : "";

  return (
    <form onSubmit={submit} className={shop.wrap}>
      <div className={shop.editorBar}>
        <div className={shop.editorTitle}>
          <button type="button" className={`${shop.btn} ${shop.secondary} ${shop.small}`} onClick={() => onBack(dirty)}><ArrowLeft size={14} /> Videos</button>
          <span>{isNew ? "New video" : truncate(eff.title || "Edit video", 60)}</span>
          {dirty && <span className={shop.dirty}>● Unsaved changes</span>}
        </div>
        <div className={shop.editorBtns}>
          <div className={styles.scores} aria-label="Scores">
            <span className={`${styles.pillScore} ${toneClass(scores.seo.score)}`}>SEO <small>{scores.seo.score}</small></span>
            <span className={`${styles.pillScore} ${toneClass(scores.geo.score)}`}>GEO <small>{scores.geo.score}</small></span>
            <span className={`${styles.pillScore} ${toneClass(scores.aeo.score)}`}>AEO <small>{scores.aeo.score}</small></span>
          </div>
          {!isNew && initial.status === "published" && (
            <a href={`/blog/video-transcripts/${initial.slug}`} target="_blank" rel="noopener noreferrer" className={`${shop.btn} ${shop.secondary}`}><ExternalLink size={15} /> View live</a>
          )}
          <button type="submit" className={`${shop.btn} ${shop.primary}`} disabled={saving}><Save size={15} /> {saving ? "Saving…" : isNew ? "Create video" : "Save changes"}</button>
        </div>
      </div>

      <div className={shop.tabs} role="tablist">
        {TABS.map((t) => (
          <button key={t.id} type="button" role="tab" aria-selected={tab === t.id} className={`${shop.tab} ${tab === t.id ? shop.tabOn : ""}`} onClick={() => setTab(t.id)}>
            {t.label}{t.badge ? ` · ${t.badge}` : ""}
          </button>
        ))}
      </div>

      {/* ------------------------------ VIDEO ------------------------------ */}
      {tab === "video" && (
        <div className={shop.panel}>
          <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) 220px", gap: 24, alignItems: "start" }}>
            <div>
              <div className={shop.field}>
                <label className={shop.label} htmlFor="v-yt">YouTube link *</label>
                <input id="v-yt" className={shop.input} value={ytInput} placeholder="https://www.youtube.com/shorts/…  or  https://youtu.be/…" onChange={(e) => onYtChange(e.target.value)} />
                {ytError ? <span className={shop.hint} style={{ color: "#b91c1c" }}>{ytError}</span>
                  : parsedYt ? <span className={shop.hint} style={{ color: "#047857" }}>✓ Video found (id {parsedYt.id}){parsedYt.vertical ? ". This is a Short, so it is set to vertical." : ""}</span>
                  : <span className={shop.hint}>Paste any YouTube link: a Short, a normal video, or a youtu.be share link.</span>}
              </div>

              <div className={shop.field}>
                <span className={shop.label}>Video shape</span>
                <div className={shop.listRow} role="radiogroup" aria-label="Video shape">
                  {(["vertical", "horizontal"] as const).map((f) => (
                    <label key={f} className={shop.check} style={{ marginRight: 16 }}>
                      <input type="radio" name="v-format" checked={draft.format === f} onChange={() => update({ format: f })} />
                      <span>{f === "vertical" ? "Vertical (9:16): Shorts and Reels" : "Horizontal (16:9): normal video"}</span>
                    </label>
                  ))}
                </div>
                <span className={shop.hint}>Vertical videos are shown in a tall phone-style frame; horizontal ones in a wide frame. Pick the one your video was filmed in.</span>
              </div>

              <div className={shop.field}>
                <label className={shop.label} htmlFor="v-title">Title *</label>
                <input id="v-title" className={shop.input} value={draft.title} maxLength={220} placeholder="e.g. Hanuman Ji ka Rahasya: The Secret Nobody Tells You" onChange={(e) => {
                  const title = e.target.value;
                  update(slugTouched ? { title } : { title, slug: slugifyQuestion(title) });
                }} />
              </div>

              <div className={shop.field}>
                <label className={shop.label} htmlFor="v-slug">Page address (URL)</label>
                <div className={shop.listRow}>
                  <span className={shop.hint} style={{ whiteSpace: "nowrap" }}>/blog/video-transcripts/</span>
                  <input id="v-slug" className={shop.input} value={draft.slug} maxLength={100} placeholder="created automatically" onChange={(e) => { setSlugTouched(true); update({ slug: slugifyQuestion(e.target.value) }); }} />
                </div>
                {slugChangeWarning && <span className={shop.hint} style={{ color: "#b45309" }}>You are changing the address of a live page. A permanent (301) redirect from the old address is created automatically.</span>}
              </div>
            </div>

            {/* live preview of how the video will be framed */}
            <div aria-label="Preview" style={{ justifySelf: "center", width: "100%" }}>
              <p className={shop.hint} style={{ marginBottom: 8, textAlign: "center" }}>Preview</p>
              <div style={{ position: "relative", width: vertical ? 160 : 220, aspectRatio: vertical ? "9 / 16" : "16 / 9", margin: "0 auto", borderRadius: 18, overflow: "hidden", background: "#1e1b4b", boxShadow: "0 10px 26px rgba(30,27,75,.25)" }}>
                {thumb ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={thumb} alt="" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} />
                ) : (
                  <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", color: "#c4b5fd", fontSize: "var(--fs-xs)", textAlign: "center", padding: 12 }}>Paste a YouTube link to see the cover</div>
                )}
                <div style={{ position: "absolute", inset: "auto 0 0 0", padding: "24px 10px 10px", background: "linear-gradient(to top, rgba(15,10,45,.92), transparent)", color: "#fff", fontFamily: "var(--font-heading)", fontWeight: 700, fontSize: "var(--fs-sm)", lineHeight: 1.2 }}>
                  {truncate(eff.title || "Your title", 50)}
                </div>
              </div>
            </div>
          </div>

          <div className={shop.row2}>
            <div className={shop.field}>
              <label className={shop.label} htmlFor="v-dur">Video length</label>
              <input id="v-dur" className={shop.input} value={durText} placeholder="e.g. 0:58 or 12:05" onChange={(e) => onDurChange(e.target.value)} />
              {durError ? <span className={shop.hint} style={{ color: "#b91c1c" }}>{durError}</span> : <span className={shop.hint}>Shown on the cover and used in the video structured data.</span>}
            </div>
            <div className={shop.field}>
              <label className={shop.label} htmlFor="v-date">Uploaded to YouTube on</label>
              <input id="v-date" type="date" className={shop.input} value={draft.uploadDate || ""} onChange={(e) => update({ uploadDate: e.target.value || null })} />
            </div>
          </div>

          <div className={shop.row2}>
            <div className={shop.field}>
              <label className={shop.label} htmlFor="v-cat">Category</label>
              <CategorySelect id="v-cat" value={draft.category} onChange={(category) => update({ category })} />
            </div>
            <div className={shop.field}>
              <label className={shop.label} htmlFor="v-status">Status</label>
              <select id="v-status" className={shop.select} value={draft.status} onChange={(e) => update({ status: e.target.value as VideoPost["status"] })}>
                <option value="draft">Draft (hidden)</option>
                <option value="published">Published (live)</option>
              </select>
            </div>
          </div>

          <div className={shop.row2}>
            <div className={shop.field}>
              <label className={shop.label} htmlFor="v-author">Speaker</label>
              <input id="v-author" className={shop.input} value={draft.authorName} maxLength={100} placeholder="e.g. Nikhil" onChange={(e) => update({ authorName: e.target.value })} />
            </div>
            <div className={shop.field}>
              <label className={shop.label} htmlFor="v-cred">Speaker credentials</label>
              <input id="v-cred" className={shop.input} value={draft.authorCredentials} maxLength={200} placeholder="Who they are and why you can trust them on this topic" onChange={(e) => update({ authorCredentials: e.target.value })} />
            </div>
          </div>

          <div className={shop.field}>
            <label className={shop.label} htmlFor="v-desc">Short description</label>
            <textarea id="v-desc" className={shop.textarea} rows={3} value={draft.description} maxLength={400} placeholder="One or two sentences about what the video covers. Shown on cards and in search results." onChange={(e) => update({ description: e.target.value })} />
            <span className={shop.hint}>{draft.description.length}/400</span>
          </div>

          <div className={shop.field}>
            <label className={shop.label} htmlFor="v-thumb">Custom cover image (optional web address)</label>
            <input id="v-thumb" className={shop.input} value={draft.thumbnailUrl} placeholder={eff.youtubeId ? youtubeThumb(eff.youtubeId) : "https://…"} onChange={(e) => update({ thumbnailUrl: e.target.value })} />
            <span className={shop.hint}>Leave empty to use the YouTube thumbnail. A custom cover should match the video shape (tall for vertical videos).</span>
          </div>

          <label className={shop.check}>
            <input type="checkbox" checked={draft.featured} onChange={(e) => update({ featured: e.target.checked })} />
            <span>Feature this video at the top of the Video Blogs page<span className={shop.hint} style={{ display: "block" }}>Only one video can be featured. Choosing this one removes it from the previous one. If none is featured, the newest video is shown.</span></span>
          </label>
        </div>
      )}

      {/* ------------------------------ TRANSCRIPT & ARTICLE ------------------------------ */}
      {tab === "content" && (
        <div className={shop.panel}>
          <div className={shop.field}>
            <label className={shop.label} htmlFor="c-tr">Transcript</label>
            <textarea id="c-tr" className={shop.textarea} rows={12} value={draft.transcript} placeholder={"0:00 Namaste, today we talk about…\n0:12 The first secret is…\n0:34 Here is what to do…"} onChange={(e) => update({ transcript: e.target.value })} />
            <span className={shop.hint}>
              One line per moment, starting with the time (0:12 or 1:02:03). Copy the captions from YouTube Studio. Search engines and AI assistants cannot watch your video, so this text is what they read.
              {" "}{lines.length} lines · {timedCount} timed · {transcriptWords} words
            </span>
          </div>

          <div className={shop.field}>
            <span className={shop.label}>Written article (optional)</span>
            <RichTextEditor value={draft.content} onChange={(v) => update({ content: v })} placeholder="Expand on the video: the story, the practice step by step, the scripture behind it." />
            <span className={shop.hint}>{wordCount(draft.content)} words. Shown under the video as “The full story”. 150+ words with a couple of sub-headings helps ranking.</span>
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
              <p className={shop.hint}>How well this page is set up to rank in normal search and in Google Video results.</p>
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
                <input id="s-kw" className={shop.input} value={draft.focusKeyword} maxLength={80} placeholder="e.g. hanuman ji ka rahasya" onChange={(e) => update({ focusKeyword: e.target.value })} />
                <button type="button" className={`${shop.btn} ${shop.secondary} ${shop.small}`} onClick={() => update({ focusKeyword: defaultVideoFocusKeyword(eff.title) })} disabled={!draft.title}>Suggest</button>
              </div>
              <span className={shop.hint}>The main phrase people search for.</span>
            </div>
            <div className={shop.field}>
              <label className={shop.label} htmlFor="s-sec">Related search phrases</label>
              <input id="s-sec" className={shop.input} value={secText} onChange={(e) => setSecText(e.target.value)} placeholder="hanuman rahasya, hanuman ji secret" />
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
              <button type="button" className={`${shop.btn} ${shop.secondary} ${shop.small}`} onClick={() => update({ metaDescription: truncate(effectiveSummary(eff), 155) })} disabled={!effectiveSummary(eff)}>Suggest</button>
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
              <span className={shop.hint}>Shown when the page is shared. Empty = the cover image.</span>
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
              <label className={shop.label} htmlFor="a-sum">Summary (the line AI and Google will quote)</label>
              <button type="button" className={`${shop.btn} ${shop.secondary} ${shop.small}`} onClick={() => update({ shortAnswer: leadingWords(draft.description || transcriptPlain(lines), 55) })} disabled={!draft.description && lines.length === 0}><Sparkles size={13} /> Suggest</button>
            </div>
            <textarea id="a-sum" className={shop.textarea} rows={3} value={draft.shortAnswer} maxLength={700} placeholder="One clear, self-contained summary of 40–60 words that makes sense without watching the video." onChange={(e) => update({ shortAnswer: e.target.value })} />
            <Meter value={summaryWords} min={40} max={60} />
            <div className={shop.counter}><span>Aim for 40–60 words. State the point first. Avoid “In this video…” and starting with “It” or “This”.</span><span>{summaryWords} words</span></div>
          </div>

          <LineList label="Key takeaways" hint="3 to 6 short, factual points from the video. Easy for AI systems to quote." items={draft.keyTakeaways} max={10} maxLength={240} placeholder="A short, factual point" onChange={(keyTakeaways) => update({ keyTakeaways })} />
          <LineList label="Questions this video answers" hint="The questions people ask that this video answers, e.g. “Why is Hanuman called Sankat Mochan?”. They show on the page and help voice search." items={draft.alternateQuestions} max={10} maxLength={200} placeholder="A question people ask" onChange={(alternateQuestions) => update({ alternateQuestions })} />

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
            <span className={shop.hint}>The scripture, book or study you mention in the video. AI engines trust and cite pages that cite others.</span>
            {draft.sources.map((s, i) => (
              <div key={i} className={shop.listRow}>
                <input className={shop.input} style={{ maxWidth: 260 }} value={s.title} placeholder="Title (e.g. Hanuman Chalisa)" aria-label={`Source ${i + 1} title`} onChange={(e) => update({ sources: draft.sources.map((x, j) => (j === i ? { ...x, title: e.target.value } : x)) })} />
                <input className={shop.input} value={s.url} placeholder="https://…" aria-label={`Source ${i + 1} link`} onChange={(e) => update({ sources: draft.sources.map((x, j) => (j === i ? { ...x, url: e.target.value } : x)) })} />
                <button type="button" className={`${shop.btn} ${shop.danger} ${shop.small}`} aria-label="Remove source" onClick={() => update({ sources: draft.sources.filter((_, j) => j !== i) })}><Trash2 size={14} /></button>
              </div>
            ))}
            <div><button type="button" className={`${shop.btn} ${shop.secondary} ${shop.small}`} disabled={draft.sources.length >= 10} onClick={() => update({ sources: [...draft.sources, { title: "", url: "" }] })}><Plus size={14} /> Add source</button></div>
          </div>

          <div className={shop.field}>
            <h3 className={shop.sectionHead}>Reference links (entity links)</h3>
            <span className={shop.hint}>Link the main subject of the video to its Wikipedia or Wikidata page so AI systems know exactly what it is about.</span>
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

      {/* ------------------------------ RELATED ------------------------------ */}
      {tab === "links" && (
        <div className={shop.panel}>
          <div>
            <h3 className={shop.sectionHead}>Related videos (internal links)</h3>
            <p className={shop.hint}>Link to 2 or more other published videos. This keeps visitors watching and gives Google links to follow.</p>
          </div>
          <div className={styles.chips}>
            {relatedChosen.map((v) => (
              <span key={v.id} className={styles.chip}>
                {truncate(v.title, 50)}
                <button type="button" aria-label={`Remove ${v.title}`} onClick={() => update({ relatedVideos: draft.relatedVideos.filter((s) => s !== v.slug) })}><X size={13} /></button>
              </span>
            ))}
            {relatedChosen.length === 0 && <span className={shop.hint}>None yet.</span>}
          </div>
          <div className={shop.listRow}>
            <input className={shop.input} placeholder="Search videos to add…" aria-label="Search videos to link" value={relFilter} onChange={(e) => setRelFilter(e.target.value)} />
            <button type="button" className={`${shop.btn} ${shop.secondary}`} onClick={() => {
              const picks = relatedVideos({ ...eff, id: initial.id }, allVideos, 4).filter((v) => !draft.relatedVideos.includes(v.slug));
              update({ relatedVideos: [...draft.relatedVideos, ...picks.map((v) => v.slug)].slice(0, 12) });
            }} disabled={!draft.title}><Sparkles size={14} /> Auto-suggest similar videos</button>
          </div>
          <div className={styles.pickList} role="listbox" aria-label="Videos you can link">
            {relatedOptions.map((v) => (
              <button key={v.id} type="button" className={styles.pickItem} onClick={() => update({ relatedVideos: [...draft.relatedVideos, v.slug].slice(0, 12) })}>+ {v.title}</button>
            ))}
            {relatedOptions.length === 0 && <div className={shop.hint} style={{ padding: 12 }}>No matching published videos.</div>}
          </div>
        </div>
      )}

      {/* ------------------------------ PREVIEW ------------------------------ */}
      {tab === "preview" && (
        <div className={shop.panel}>
          <div>
            <h3 className={shop.sectionHead}>Structured data (what search engines and AI read)</h3>
            <p className={shop.hint}>
              Generated automatically as VideoObject markup (title, summary, thumbnail, upload date, length, speaker, transcript), plus the page and breadcrumbs.
              Videos are also added to your sitemap with their cover and length, which helps Google show them in video results.
            </p>
          </div>
          {jsonLd ? <pre className={styles.pre} aria-label="JSON-LD preview">{jsonLd}</pre> : <p className={shop.hint}>Paste the YouTube link first.</p>}
          <div>
            <h3 className={shop.sectionHead}>Check it</h3>
            <p className={shop.hint}>After the video is live, validate the markup:</p>
            <div className={shop.listRow} style={{ flexWrap: "wrap", marginTop: 8 }}>
              <a className={`${shop.btn} ${shop.secondary}`} href={`https://validator.schema.org/#url=${encodeURIComponent(liveUrl)}`} target="_blank" rel="noopener noreferrer"><ExternalLink size={14} /> Schema validator</a>
              <a className={`${shop.btn} ${shop.secondary}`} href={`https://search.google.com/test/rich-results?url=${encodeURIComponent(liveUrl)}`} target="_blank" rel="noopener noreferrer"><ExternalLink size={14} /> Google Rich Results Test</a>
            </div>
          </div>
          <div>
            <h3 className={shop.sectionHead}>What an AI assistant reads from your llms.txt</h3>
            <pre className={styles.pre} aria-label="AI view">{`- [${eff.title || "Video"}](${SITE_URL}/blog/video-transcripts/${eff.slug || "your-video"}): ${truncate(effectiveSummary(eff), 140)}`}</pre>
          </div>
        </div>
      )}
    </form>
  );
}
