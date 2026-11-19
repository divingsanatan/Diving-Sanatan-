/**
 * YouTube helpers. Client-safe (no server code).
 *
 * The channel address lives here and ONLY here. Change it once and every Subscribe button,
 * the schema markup and the AI files follow.
 */
export const YOUTUBE_CHANNEL_NAME = "Diving Sanatan";
export const YOUTUBE_CHANNEL_URL = "https://www.youtube.com/@divingsanatan";

/**
 * "?sub_confirmation=1" makes YouTube show a one-click "Subscribe?" confirmation as soon as a signed-in
 * visitor lands on the channel. (YouTube does not let any website subscribe someone without that
 * confirmation on youtube.com, and the old embeddable widget is unreliable behind ad blockers.)
 */
export const YOUTUBE_SUBSCRIBE_URL = `${YOUTUBE_CHANNEL_URL}?sub_confirmation=1`;

const ID = /^[A-Za-z0-9_-]{11}$/;
export const isYouTubeId = (s: string) => ID.test(s);

export interface ParsedYouTube {
  id: string;
  /** true when the link is a YouTube Short (those are always vertical) */
  vertical: boolean;
  /** start offset in seconds when the link carries one (?t=42 or &start=42) */
  start: number;
}

const toSeconds = (t: string | null): number => {
  if (!t) return 0;
  if (/^\d+$/.test(t)) return parseInt(t, 10);
  const m = t.match(/^(?:(\d+)h)?(?:(\d+)m)?(?:(\d+)s)?$/i);
  return m ? (parseInt(m[1] || "0", 10) * 3600 + parseInt(m[2] || "0", 10) * 60 + parseInt(m[3] || "0", 10)) : 0;
};

/**
 * Understands every common way people copy a YouTube link: watch, youtu.be, /shorts/, /embed/, /live/, /v/,
 * mobile and nocookie addresses, or just the bare 11-character id. Returns null when it is not a YouTube video.
 */
export function parseYouTube(input: string): ParsedYouTube | null {
  const raw = (input || "").trim();
  if (!raw) return null;
  if (ID.test(raw)) return { id: raw, vertical: false, start: 0 };
  let url: URL;
  try {
    url = new URL(/^https?:\/\//i.test(raw) ? raw : `https://${raw}`);
  } catch {
    return null;
  }
  const host = url.hostname.replace(/^(www\.|m\.|music\.)/, "").toLowerCase();
  const start = toSeconds(url.searchParams.get("t") || url.searchParams.get("start"));
  if (host === "youtu.be") {
    const id = url.pathname.split("/").filter(Boolean)[0] || "";
    return ID.test(id) ? { id, vertical: false, start } : null;
  }
  if (host === "youtube.com" || host === "youtube-nocookie.com") {
    const parts = url.pathname.split("/").filter(Boolean);
    if (parts[0] === "watch") {
      const id = url.searchParams.get("v") || "";
      return ID.test(id) ? { id, vertical: false, start } : null;
    }
    if (["shorts", "embed", "live", "v"].includes(parts[0])) {
      return ID.test(parts[1] || "") ? { id: parts[1], vertical: parts[0] === "shorts", start } : null;
    }
  }
  return null;
}

/** YouTube always has the "hq" thumbnail. For vertical videos it is the 9:16 frame centred in a wider picture. */
export const youtubeThumb = (id: string) => `https://i.ytimg.com/vi/${id}/hqdefault.jpg`;
export const youtubeWatchUrl = (id: string) => `https://www.youtube.com/watch?v=${id}`;
export const youtubeEmbedBase = (id: string) => `https://www.youtube.com/embed/${id}`;

/** Privacy-friendly player address (no tracking cookies until the visitor presses play). */
export function youtubePlayerUrl(id: string, opts: { start?: number; autoplay?: boolean; origin?: string } = {}) {
  const p = new URLSearchParams({ rel: "0", modestbranding: "1", playsinline: "1", enablejsapi: "1" });
  if (opts.autoplay) p.set("autoplay", "1");
  if (opts.start && opts.start > 0) p.set("start", String(Math.floor(opts.start)));
  if (opts.origin) p.set("origin", opts.origin);
  return `https://www.youtube-nocookie.com/embed/${id}?${p.toString()}`;
}
