"use client";

import React, { forwardRef, useImperativeHandle, useRef, useState } from "react";
import { youtubePlayerUrl } from "@/lib/youtube";
import { PlayIcon } from "./Icons";
import styles from "./video.module.css";

export interface VideoPlayerHandle {
  /** Jump to a time (starts the video if it has not been started yet). */
  seekTo: (seconds: number) => void;
}

interface Props {
  youtubeId: string;
  format: "vertical" | "horizontal";
  title: string;
  poster: string;
  /** start playing immediately (used by the pop-up player after a click) */
  autoplay?: boolean;
  /** rounded card look for the video page */
  embedded?: boolean;
}

/**
 * Click-to-play YouTube player in 9:16 (vertical) or 16:9 (horizontal).
 * It shows the cover first and only loads YouTube (privacy-friendly nocookie address) when pressed:
 * the page stays fast and no tracking happens until the visitor chooses to watch.
 */
const VideoPlayer = forwardRef<VideoPlayerHandle, Props>(function VideoPlayer({ youtubeId, format, title, poster, autoplay = false, embedded = false }, ref) {
  const [active, setActive] = useState(autoplay);
  const [start, setStart] = useState(0);
  const iframeRef = useRef<HTMLIFrameElement | null>(null);

  const command = (func: string, args: unknown[] = []) =>
    iframeRef.current?.contentWindow?.postMessage(JSON.stringify({ event: "command", func, args }), "https://www.youtube-nocookie.com");

  useImperativeHandle(
    ref,
    () => ({
      seekTo(seconds: number) {
        if (!active) {
          setStart(seconds);
          setActive(true);
        } else {
          command("seekTo", [seconds, true]);
          command("playVideo");
        }
      },
    }),
    [active]
  );

  const src = active
    ? youtubePlayerUrl(youtubeId, { autoplay: true, start, origin: typeof window !== "undefined" ? window.location.origin : undefined })
    : "";

  return (
    <div className={`${styles.player} ${format === "vertical" ? styles.playerVertical : styles.playerHorizontal} ${embedded ? styles.playerEmbedded : ""}`}>
      {active ? (
        <iframe
          ref={iframeRef}
          className={styles.iframe}
          src={src}
          title={title}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
          referrerPolicy="strict-origin-when-cross-origin"
        />
      ) : (
        <>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={poster} alt="" className={styles.playerPoster} loading="lazy" />
          <div className={styles.playerShade} />
          <button type="button" className={styles.playerPlay} onClick={() => setActive(true)} aria-label={`Play video: ${title}`}>
            <span className={styles.playerPlayIcon}><PlayIcon /></span>
            <span className={styles.playerLabel}>Tap to watch</span>
          </button>
        </>
      )}
    </div>
  );
});

export default VideoPlayer;
