"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useBlog } from "../BlogContext";
import VideoPlayer, { type VideoPlayerHandle } from "./VideoPlayer";
import SubscribeButton from "./SubscribeButton";
import { PlayIcon } from "./Icons";
import { effectiveSummary, formatDuration, parseTranscript, thumbnailOf, videoPath, type VideoPost } from "@/lib/videoShared";
import { truncate } from "@/lib/shopShared";
import styles from "./video.module.css";

const PAGE = 12;
type Fmt = "all" | "vertical" | "horizontal";

const fmtDate = (iso: string | null) =>
  iso ? new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" }) : "";

/** Plain left-click opens the pop-up player. Ctrl/Cmd/middle-click still opens the real page in a new tab. */
const isPlainClick = (e: React.MouseEvent) => !(e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0);

function PosterCard({ v, onOpen }: { v: VideoPost; onOpen: (v: VideoPost, trigger: HTMLElement) => void }) {
  const wide = v.format === "horizontal";
  return (
    <li className={`${styles.cardItem} ${wide ? styles.cardWideItem : ""}`}>
      <Link
        href={videoPath(v.slug)}
        className={styles.card}
        onClick={(e) => {
          if (!isPlainClick(e)) return;
          e.preventDefault();
          onOpen(v, e.currentTarget);
        }}
        aria-label={`Watch: ${v.title}`}
      >
        <div className={`${styles.poster} ${wide ? styles.posterWide : ""}`}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={thumbnailOf(v)} alt="" className={styles.posterImg} loading="lazy" />
          <div className={styles.posterShade} />
          {v.category && <span className={styles.posterCat}>{v.category}</span>}
          {v.durationSeconds ? <span className={styles.posterDur}>{formatDuration(v.durationSeconds)}</span> : null}
          <span className={styles.posterPlay}><PlayIcon /></span>
          <div className={styles.posterBody}>
            <h3 className={styles.posterTitle}>{v.title}</h3>
          </div>
        </div>
      </Link>
      <p className={styles.cardMeta}>
        {v.authorName && <strong>{v.authorName}</strong>}
        {v.authorName && v.uploadDate && <span aria-hidden="true">·</span>}
        {v.uploadDate && <span>{fmtDate(v.uploadDate)}</span>}
      </p>
    </li>
  );
}

function Modal({
  video, index, total, onClose, onPrev, onNext,
}: {
  video: VideoPost; index: number; total: number; onClose: () => void; onPrev: () => void; onNext: () => void;
}) {
  const playerRef = useRef<VideoPlayerHandle | null>(null);
  const boxRef = useRef<HTMLDivElement | null>(null);
  const lines = useMemo(() => parseTranscript(video.transcript).filter((l) => l.timed).slice(0, 14), [video.transcript]);
  const summary = effectiveSummary(video);
  const wide = video.format === "horizontal";

  // Always call the latest handlers without re-registering listeners (and re-stealing focus) on every render
  const handlers = useRef({ onClose, onNext, onPrev });
  useEffect(() => {
    handlers.current = { onClose, onNext, onPrev };
  });

  // keyboard: Esc closes, arrows move between videos, Tab stays inside the dialog
  useEffect(() => {
    const el = boxRef.current;
    el?.querySelector<HTMLElement>("button[data-close]")?.focus();
    const onKey = (e: KeyboardEvent) => {
      const h = handlers.current;
      if (e.key === "Escape") h.onClose();
      else if (e.key === "ArrowRight" && !(e.target instanceof HTMLInputElement)) h.onNext();
      else if (e.key === "ArrowLeft" && !(e.target instanceof HTMLInputElement)) h.onPrev();
      else if (e.key === "Tab" && el) {
        const f = Array.from(el.querySelectorAll<HTMLElement>('button:not(:disabled), a[href], iframe, [tabindex]:not([tabindex="-1"])'));
        if (f.length === 0) return;
        const first = f[0], last = f[f.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    };
    document.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, []);

  return (
    <div className={styles.overlay} role="presentation" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div ref={boxRef} className={`${styles.modal} ${wide ? styles.modalWide : ""}`} role="dialog" aria-modal="true" aria-label={video.title}>
        <button type="button" className={styles.modalClose} onClick={onClose} aria-label="Close video" data-close>×</button>
        <div className={styles.modalPlayer}>
          <VideoPlayer key={video.id} ref={playerRef} youtubeId={video.youtubeId} format={video.format} title={video.title} poster={thumbnailOf(video)} autoplay />
        </div>
        <div className={styles.modalSide}>
          {video.category && <p className={styles.modalCat}>{video.category}</p>}
          <h2 className={styles.modalTitle}>{video.title}</h2>
          {summary && <p className={styles.modalSummary}>{truncate(summary, 260)}</p>}
          <div className={styles.modalActions}>
            <SubscribeButton compact />
            <Link href={videoPath(video.slug)} className={styles.linkWhite}>Open full page: transcript &amp; more →</Link>
          </div>
          {lines.length > 0 && (
            <div>
              <p className={styles.modalCat} style={{ marginBottom: 6 }}>Jump to</p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {lines.map((l, i) => (
                  <button key={i} type="button" className={styles.navBtn} onClick={() => playerRef.current?.seekTo(l.seconds)} title={l.text}>
                    {l.timeStr} {truncate(l.text, 22)}
                  </button>
                ))}
              </div>
            </div>
          )}
          <div className={styles.modalNav}>
            <button type="button" className={styles.navBtn} onClick={onPrev} disabled={index <= 0}>← Previous</button>
            <span style={{ fontSize: "var(--fs-xs)", opacity: 0.7, alignSelf: "center" }}>{index + 1} / {total}</span>
            <button type="button" className={styles.navBtn} onClick={onNext} disabled={index >= total - 1}>Next →</button>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * The video hub. The videos arrive already loaded from the server (see page.tsx), so every title, link and
 * summary is in the page HTML for search engines. Nothing here depends on the browser's local storage.
 */
export default function VideoHubClient({ videos }: { videos: VideoPost[] }) {
  const { searchQuery } = useBlog();
  const [category, setCategory] = useState("all");
  const [fmt, setFmt] = useState<Fmt>("all");
  const [visible, setVisible] = useState(PAGE);
  const [openId, setOpenId] = useState<string | null>(null);
  const triggerRef = useRef<HTMLElement | null>(null);

  const featured = useMemo(() => videos.find((v) => v.featured) || videos[0] || null, [videos]);
  const categories = useMemo(() => Array.from(new Set(videos.map((v) => v.category).filter(Boolean))), [videos]);
  const hasBoth = useMemo(() => videos.some((v) => v.format === "vertical") && videos.some((v) => v.format === "horizontal"), [videos]);

  const list = useMemo(() => {
    const q = (searchQuery || "").trim().toLowerCase();
    return videos
      .filter((v) => category === "all" || v.category === category)
      .filter((v) => fmt === "all" || v.format === fmt)
      .filter((v) => !q || `${v.title} ${v.description} ${v.category} ${v.authorName} ${v.shortAnswer}`.toLowerCase().includes(q));
  }, [videos, category, fmt, searchQuery]);

  const openIndex = openId ? list.findIndex((v) => v.id === openId) : -1;
  const openVideo = openId ? videos.find((v) => v.id === openId) || null : null;
  // if the open video is hidden by a filter, step through all videos instead
  const navList = openIndex >= 0 ? list : videos;
  const navIndex = openVideo ? navList.findIndex((v) => v.id === openVideo.id) : -1;

  const open = useCallback((v: VideoPost, trigger?: HTMLElement) => {
    if (trigger) triggerRef.current = trigger;
    setOpenId(v.id);
  }, []);
  const close = useCallback(() => {
    setOpenId(null);
    window.setTimeout(() => triggerRef.current?.focus(), 0);
  }, []);
  const step = useCallback((dir: 1 | -1) => {
    setOpenId((cur) => {
      const idx = navList.findIndex((v) => v.id === cur);
      const next = navList[idx + dir];
      return next ? next.id : cur;
    });
  }, [navList]);

  const shown = list.slice(0, visible);

  return (
    <div className={styles.page}>
      <header className={styles.hero}>
        <span className={`${styles.orb} ${styles.orbA}`} aria-hidden="true" />
        <span className={`${styles.orb} ${styles.orbB}`} aria-hidden="true" />
        <div>
          <p className={styles.heroEyebrow}>🪔 Video Blogs</p>
          <h1 className={styles.heroTitle}>Watch. Breathe. <em>Awaken.</em></h1>
          <p className={styles.heroSub}>
            Short, powerful videos on Vedic wisdom, meditation and healing. Real practices for real life, made to watch in a minute and carry with you all day.
          </p>
          <div className={styles.heroCtas}>
            <SubscribeButton />
            {featured && (
              <button type="button" className={styles.btnGhost} onClick={(e) => open(featured, e.currentTarget)}>▶ Watch now</button>
            )}
          </div>
          {videos.length > 0 && (
            <ul className={styles.heroStats}>
              <li>{videos.length} {videos.length === 1 ? "video" : "videos"}</li>
              {categories.length > 0 && <li>{categories.length} {categories.length === 1 ? "topic" : "topics"}</li>}
              <li>Free on YouTube</li>
            </ul>
          )}
        </div>

        {featured && (
          <div className={styles.stage}>
            <span className={`${styles.floatChip} ${styles.chipA}`} aria-hidden="true">{featured.format === "vertical" ? "Shorts ▶" : "Watch ▶"}</span>
            {featured.category && <span className={`${styles.floatChip} ${styles.chipB}`} aria-hidden="true">{featured.category}</span>}
            <button
              type="button"
              className={`${styles.phone} ${featured.format === "horizontal" ? styles.phoneWide : ""}`}
              onClick={(e) => open(featured, e.currentTarget)}
              aria-label={`Play featured video: ${featured.title}`}
            >
              <span className={`${styles.screen} ${featured.format === "horizontal" ? styles.screenWide : ""}`} style={{ display: "block" }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={thumbnailOf(featured)} alt="" className={styles.screenImg} />
                <span className={styles.screenShade} />
                <span className={styles.playRing}><PlayIcon /></span>
                <span className={styles.screenCap} style={{ display: "block" }}>
                  {featured.category && <span className={styles.screenCat}>{featured.category}</span>}
                  <span className={styles.screenTitle} style={{ display: "-webkit-box" }}>{featured.title}</span>
                </span>
              </span>
            </button>
          </div>
        )}
      </header>

      <section aria-labelledby="all-videos">
        <div className={styles.sectionHead}>
          <h2 id="all-videos" className={styles.sectionTitle}>All videos</h2>
          <p className={styles.count} aria-live="polite">{list.length} {list.length === 1 ? "video" : "videos"}</p>
        </div>

        {(categories.length > 0 || hasBoth) && (
          <div className={styles.filters} role="group" aria-label="Filter videos">
            <button type="button" className={`${styles.chip} ${category === "all" ? styles.chipOn : ""}`} aria-pressed={category === "all"} onClick={() => { setCategory("all"); setVisible(PAGE); }}>All topics</button>
            {categories.map((c) => (
              <button key={c} type="button" className={`${styles.chip} ${category === c ? styles.chipOn : ""}`} aria-pressed={category === c} onClick={() => { setCategory(c); setVisible(PAGE); }}>{c}</button>
            ))}
            {hasBoth && (
              <>
                <span className={styles.filterGap} aria-hidden="true" />
                {(["all", "vertical", "horizontal"] as Fmt[]).map((f) => (
                  <button key={f} type="button" className={`${styles.chip} ${fmt === f ? styles.chipOn : ""}`} aria-pressed={fmt === f} onClick={() => { setFmt(f); setVisible(PAGE); }}>
                    {f === "all" ? "Any format" : f === "vertical" ? "Shorts" : "Long videos"}
                  </button>
                ))}
              </>
            )}
          </div>
        )}

        {shown.length === 0 ? (
          <div className={styles.empty}>
            {videos.length === 0 ? "New videos are on the way. Subscribe on YouTube to see them first." : "No videos match your search."}
          </div>
        ) : (
          <ul className={styles.grid}>
            {shown.map((v) => (<PosterCard key={v.id} v={v} onOpen={open} />))}
          </ul>
        )}

        {list.length > visible && (
          <div style={{ textAlign: "center", marginBottom: 28 }}>
            <button type="button" className={styles.btnLight} onClick={() => setVisible((n) => n + PAGE)}>Show more videos</button>
          </div>
        )}
      </section>

      <aside className={styles.band} aria-label="Subscribe on YouTube">
        <div className={styles.bandText}>
          <h2 className={styles.bandTitle}>Never miss a video</h2>
          <p className={styles.bandSub}>Subscribe to the Diving Sanatan channel on YouTube and watch every new video the moment it goes live. One tap, completely free.</p>
        </div>
        <SubscribeButton />
      </aside>

      <aside className={styles.cta}>
        <div>
          <h2 className={styles.ctaTitle}>Want guidance made for you?</h2>
          <p className={styles.ctaText}>Our practitioners offer personal sessions in healing, meditation and life guidance.</p>
        </div>
        <Link href="/explore-services" className={styles.btnLight}>Explore services</Link>
      </aside>

      {openVideo && navIndex >= 0 && (
        <Modal video={openVideo} index={navIndex} total={navList.length} onClose={close} onPrev={() => step(-1)} onNext={() => step(1)} />
      )}
    </div>
  );
}
