import React from "react";
import { YOUTUBE_CHANNEL_NAME, YOUTUBE_SUBSCRIBE_URL } from "@/lib/youtube";
import { YouTubeIcon } from "./Icons";
import styles from "./video.module.css";

/**
 * "Subscribe on YouTube" button. A plain link (no third-party script, nothing for an ad blocker to remove).
 * It opens the channel with YouTube's one-click "Subscribe?" confirmation for signed-in viewers.
 */
export default function SubscribeButton({ compact = false, label = "Subscribe on YouTube" }: { compact?: boolean; label?: string }) {
  return (
    <a
      href={YOUTUBE_SUBSCRIBE_URL}
      target="_blank"
      rel="noopener noreferrer"
      className={compact ? `${styles.subscribe} ${styles.subscribeSm}` : styles.subscribe}
      aria-label={`${label}: ${YOUTUBE_CHANNEL_NAME} (opens YouTube in a new tab)`}
    >
      <YouTubeIcon />
      {label}
    </a>
  );
}
