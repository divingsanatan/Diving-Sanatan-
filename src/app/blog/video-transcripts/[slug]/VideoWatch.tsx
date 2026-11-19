"use client";

import React, { createContext, useCallback, useContext, useRef, useState, useSyncExternalStore } from "react";
import VideoPlayer, { type VideoPlayerHandle } from "../VideoPlayer";
import SubscribeButton from "../SubscribeButton";
import type { TranscriptLine } from "@/lib/videoShared";
import { youtubeWatchUrl } from "@/lib/youtube";
import styles from "../video.module.css";

interface Ctx {
  seek: (seconds: number) => void;
}
const WatchContext = createContext<Ctx | null>(null);
const RefContext = createContext<{ playerRef: React.RefObject<VideoPlayerHandle | null>; boxRef: React.RefObject<HTMLDivElement | null> } | null>(null);

/**
 * Wraps the video page so the transcript (in the text column) can control the player (in the video column).
 */
export function WatchRoot({ children }: { children: React.ReactNode }) {
  const playerRef = useRef<VideoPlayerHandle | null>(null);
  const boxRef = useRef<HTMLDivElement | null>(null);
  const seek = useCallback((seconds: number) => {
    playerRef.current?.seekTo(seconds);
    const el = boxRef.current;
    if (el && el.getBoundingClientRect().bottom < 0) el.scrollIntoView({ behavior: "smooth", block: "center" });
  }, []);
  return (
    <RefContext.Provider value={{ playerRef, boxRef }}>
      <WatchContext.Provider value={{ seek }}>{children}</WatchContext.Provider>
    </RefContext.Provider>
  );
}

export function WatchPlayer({
  youtubeId, format, title, poster, shareUrl,
}: { youtubeId: string; format: "vertical" | "horizontal"; title: string; poster: string; shareUrl: string }) {
  const refs = useContext(RefContext);
  const [copied, setCopied] = useState(false);
  // browser-only capability: false on the server and during hydration, then the real answer (no mismatch)
  const canShare = useSyncExternalStore(
    () => () => {},
    () => typeof navigator !== "undefined" && "share" in navigator,
    () => false
  );

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2200);
    } catch {
      window.prompt("Copy this link:", shareUrl);
    }
  };
  const nativeShare = async () => {
    try {
      await navigator.share({ title, url: shareUrl });
    } catch {
      /* cancelled */
    }
  };

  return (
    <div className={styles.watchCol}>
      <div ref={refs?.boxRef} style={{ width: "100%", display: "flex", justifyContent: "center" }}>
        <VideoPlayer ref={refs?.playerRef} youtubeId={youtubeId} format={format} title={title} poster={poster} embedded />
      </div>
      <div className={styles.watchActions}>
        <SubscribeButton />
      </div>
      <div className={styles.share}>
        <button type="button" className={styles.shareBtn} onClick={copy}>Copy link</button>
        <a className={styles.shareBtn} href={`https://wa.me/?text=${encodeURIComponent(`${title} ${shareUrl}`)}`} target="_blank" rel="noopener noreferrer">WhatsApp</a>
        <a className={styles.shareBtn} href={youtubeWatchUrl(youtubeId)} target="_blank" rel="noopener noreferrer">Open on YouTube</a>
        {canShare && <button type="button" className={styles.shareBtn} onClick={nativeShare}>Share…</button>}
        {copied && <span className={styles.copied} role="status">Link copied</span>}
      </div>
    </div>
  );
}

/** The timestamped transcript. Pressing a time jumps the video to that moment. */
export function WatchTranscript({ lines }: { lines: TranscriptLine[] }) {
  const ctx = useContext(WatchContext);
  const [active, setActive] = useState<number | null>(null);
  if (lines.length === 0) return null;
  const timed = lines.some((l) => l.timed);
  return (
    <div className={styles.transcriptBox}>
      <div className={styles.transcriptHead}>
        <span>Transcript</span>
        {timed && <span style={{ fontWeight: 500, opacity: 0.75 }}>Tap a time to jump there</span>}
      </div>
      <ul className={styles.transcriptList}>
        {lines.map((l, i) => (
          <li key={i}>
            {l.timed ? (
              <button
                type="button"
                className={`${styles.tLine} ${active === i ? styles.tLineOn : ""}`}
                onClick={() => { setActive(i); ctx?.seek(l.seconds); }}
                aria-label={`Jump to ${l.timeStr}: ${l.text}`}
              >
                <span className={styles.tTime}>{l.timeStr}</span>
                <span className={styles.tText}>{l.text}</span>
              </button>
            ) : (
              <p className={styles.tPlain}>{l.text}</p>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
