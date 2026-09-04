"use client";

import React, { useState, useEffect, useRef } from "react";
import { Card } from "@/components/ui/Card";
import Link from "next/link";
import { Blog } from "@/types/database";

export interface TranscriptLine {
  timeStr: string;
  seconds: number;
  text: string;
}

export interface ParsedVideoBlog {
  id: string;
  slug: string;
  title: string;
  author: string;
  category: string;
  date: string;
  readTime: string;
  content: string;
  videoEmbedUrl: string;
  lines: TranscriptLine[];
  image: string;
}

export const FALLBACK_VIDEOS: ParsedVideoBlog[] = [
  {
    id: "vblog-1",
    slug: "chakra-shorts-awakening-the-heart-node",
    title: "Chakra Shorts: Awakening the Heart Node",
    author: "Master Zephyr",
    category: "Chakra Shorts",
    date: "2026-06-10",
    readTime: "5 Min Watch",
    content: "Sound wave healing acts as a direct conduit to rebalance our primary energetic nodes. In this short video session, we explore 528Hz crystal sound bowl frequencies.",
    videoEmbedUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ",
    image: "/images/insight_video.png",
    lines: [
      { timeStr: "00:00", seconds: 0, text: "Currently, sound wave healing acts as a conduit to rebalance our primary nodes." },
      { timeStr: "00:06", seconds: 6, text: "By using sound bowls tuned to 528Hz, we target cellular water crystals." },
      { timeStr: "00:14", seconds: 14, text: "Key insights show that chakra blockages are often somatic reactions to stress." },
      { timeStr: "00:22", seconds: 22, text: "Practitioners can use targeted vibration maps to dissolve localized anxieties." },
      { timeStr: "00:29", seconds: 29, text: "The transcript here acts as a reference log for your personal audio sessions." },
    ],
  },
  {
    id: "vblog-2",
    slug: "aura-alignment-mineral-energy-fields",
    title: "Aura Alignment & Mineral Energy Fields",
    author: "Dr. Elara Vance",
    category: "Aura Alignment",
    date: "2026-06-15",
    readTime: "6 Min Watch",
    content: "Explore quartz crystal energy transmissions and piezoelectric field stabilization.",
    videoEmbedUrl: "https://www.youtube.com/embed/L_LUpnjgPso",
    image: "/images/insight_space.png",
    lines: [
      { timeStr: "00:00", seconds: 0, text: "Welcome to the study of quartz energy transmissions." },
      { timeStr: "00:08", seconds: 8, text: "Crystals carry stable crystalline structures that output continuous frequencies." },
      { timeStr: "00:16", seconds: 16, text: "When placed near active nerve endings, they help normalize nervous voltage." },
      { timeStr: "00:25", seconds: 25, text: "We call this process piezo-energy stabilizing." },
      { timeStr: "00:33", seconds: 33, text: "Remember to wash your gems monthly under cold running spring water." },
    ],
  },
  {
    id: "vblog-3",
    slug: "somatic-breathwork-cortisol-release",
    title: "Somatic Breathwork & Cortisol Release",
    author: "Master Zephyr",
    category: "Guided Sessions",
    date: "2026-06-18",
    readTime: "7 Min Watch",
    content: "Learn box breathing and vagus nerve stimulation techniques to calm hyperactive stress responses.",
    videoEmbedUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ",
    image: "/images/insight_blog.png",
    lines: [
      { timeStr: "00:00", seconds: 0, text: "In moments of high anxiety, our sympathetic nervous system triggers fight-or-flight." },
      { timeStr: "00:10", seconds: 10, text: "Box breathing slows down the pulse rate within 90 seconds." },
      { timeStr: "00:20", seconds: 20, text: "Inhale for 4 seconds, hold for 4, exhale for 4." },
    ],
  },
];

export const parseTranscriptText = (text?: string): TranscriptLine[] => {
  if (!text || !text.trim()) return [];
  const lines = text.split("\n");
  const parsed: TranscriptLine[] = [];

  for (const rawLine of lines) {
    const trimmed = rawLine.trim();
    if (!trimmed) continue;

    const timeMatch = trimmed.match(/^\[?(\d{1,2}):(\d{2})\]?\s*(.*)/);
    if (timeMatch) {
      const minutes = parseInt(timeMatch[1], 10);
      const seconds = parseInt(timeMatch[2], 10);
      const totalSeconds = minutes * 60 + seconds;
      const lineText = timeMatch[3] || trimmed;
      const timeStr = `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
      parsed.push({
        timeStr,
        seconds: totalSeconds,
        text: lineText,
      });
    } else {
      parsed.push({
        timeStr: "00:00",
        seconds: 0,
        text: trimmed,
      });
    }
  }

  return parsed;
};

export const normalizeEmbedUrl = (url?: string): string => {
  if (!url) return "";
  if (url.includes("youtube.com/watch")) {
    const videoId = url.split("v=")[1]?.split("&")[0];
    return `https://www.youtube.com/embed/${videoId}`;
  }
  if (url.includes("youtu.be/")) {
    const videoId = url.split("youtu.be/")[1]?.split("?")[0];
    return `https://www.youtube.com/embed/${videoId}`;
  }
  return url;
};

export default function VideoTranscriptsPage() {
  const [videoList, setVideoList] = useState<ParsedVideoBlog[]>(FALLBACK_VIDEOS);
  const [loading, setLoading] = useState<boolean>(true);

  // Active modal player state
  const [activeModalVideo, setActiveModalVideo] = useState<ParsedVideoBlog | null>(null);
  const [activeTimestampSeconds, setActiveTimestampSeconds] = useState<number>(0);

  // Infinite Scroll States
  const [visibleCount, setVisibleCount] = useState<number>(6);
  const [isLoadingMore, setIsLoadingMore] = useState<boolean>(false);
  const observerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    let isMounted = true;
    fetch("/api/blogs")
      .then((res) => res.json())
      .then((json) => {
        if (json.success && Array.isArray(json.data) && isMounted) {
          const rawBlogs: Blog[] = json.data;
          const filtered = rawBlogs.filter(
            (b) =>
              b.content_type === "video" ||
              Boolean(b.video_embed_url) ||
              (b.videos && b.videos.length > 0) ||
              b.category?.toLowerCase().includes("video") ||
              b.section?.toLowerCase().includes("video")
          );

          if (filtered.length > 0) {
            const parsed: ParsedVideoBlog[] = filtered.map((b) => {
              const embed = normalizeEmbedUrl(b.video_embed_url || (b.videos?.[0] ?? ""));
              const lines = parseTranscriptText(b.video_transcript);

              return {
                id: b.id,
                slug: b.slug || b.id,
                title: b.title,
                author: b.author,
                category: b.category || "Video Transcripts",
                date: b.date,
                readTime: b.readTime || "5 Min Watch",
                content: b.content,
                videoEmbedUrl: embed || "https://www.youtube.com/embed/dQw4w9WgXcQ",
                image: b.image || "/images/insight_video.png",
                lines: lines.length > 0 ? lines : [
                  { timeStr: "00:00", seconds: 0, text: b.content.substring(0, 120) }
                ],
              };
            });

            setVideoList(parsed);
          }
        }
      })
      .catch((err) => console.error("Failed to load video blogs:", err))
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const hasMoreItems = visibleCount < videoList.length;

  // Infinite Pagination IntersectionObserver
  useEffect(() => {
    const node = observerRef.current;
    if (!node || !hasMoreItems) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !isLoadingMore) {
          setIsLoadingMore(true);
          setTimeout(() => {
            setVisibleCount((prev) => prev + 6);
            setIsLoadingMore(false);
          }, 350);
        }
      },
      { threshold: 0.1, rootMargin: "200px" }
    );

    observer.observe(node);
    return () => {
      observer.disconnect();
    };
  }, [hasMoreItems, isLoadingMore, videoList.length]);

  const handleOpenModal = (vid: ParsedVideoBlog) => {
    setActiveModalVideo(vid);
    setActiveTimestampSeconds(0);
  };

  const getEmbedWithTime = (baseUrl: string, startSecs: number) => {
    if (!baseUrl) return "";
    const joinChar = baseUrl.includes("?") ? "&" : "?";
    return `${baseUrl}${joinChar}autoplay=1&start=${startSecs}`;
  };

  const displayedVideos = videoList.slice(0, visibleCount);

  return (
    <div className="transcripts-page">
      {/* Page Title & Subtitle */}
      <div className="transcripts-header">
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <span style={{ fontSize: "1.8rem" }}>🎥</span>
          <h1 className="page-title">Video Blogs & Transcripts</h1>
        </div>
        <p className="page-subtitle">
          Watch guided video sessions, explore time-synced transcript notes, and deepen your healing journey.
        </p>
      </div>

      {/* Video Blog Cards List matching reference card design */}
      <div className="video-cards-list">
        {displayedVideos.map((vid) => (
          <div key={vid.id} className="reference-style-card">
            {/* Left Media Box Container */}
            <div className="card-media-wrapper">
              <Link href={`/blog/video-transcripts/${vid.slug}`} className="card-media-link">
                <img
                  src={vid.image}
                  alt={vid.title}
                  className="card-media-img"
                  loading="lazy"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = "/images/insight_video.png";
                  }}
                />
                <div className="play-overlay-circle">
                  <span className="play-icon">▶</span>
                </div>
                <span className="pill-badge-left">{vid.category}</span>
                <span className="pill-badge-right">{vid.readTime}</span>
              </Link>
            </div>

            {/* Right Body Content */}
            <div className="card-content-body">
              <div className="card-header-block">
                <Link href={`/blog/video-transcripts/${vid.slug}`} className="card-title-link">
                  <h3 className="card-post-title">{vid.title}</h3>
                </Link>
                <p className="card-post-desc">
                  <span className="summary-label">🧘 Transcript Summary: </span>
                  {vid.content.replace(/<[^>]*>/g, "")}
                </p>
              </div>

              <div className="card-footer-divider" />

              <div className="card-footer-row">
                <div className="author-metadata">
                  <div className="author-avatar-circle">{vid.author.charAt(0)}</div>
                  <span className="author-fullname">{vid.author}</span>
                  <span className="metadata-dot">•</span>
                  <span className="publish-date-text">{vid.date}</span>
                </div>

                <div className="action-buttons-group">
                  <button className="quick-watch-btn" onClick={() => handleOpenModal(vid)}>
                    ▶ Quick Watch
                  </button>
                  <Link href={`/blog/video-transcripts/${vid.slug}`} className="read-article-link">
                    Read Article &rarr;
                  </Link>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Infinite Scroll Sentinel / Loading Indicator */}
      <div className="infinite-scroll-sentinel-wrapper">
        {hasMoreItems ? (
          <div ref={observerRef} className="infinite-loader-box">
            <svg viewBox="0 0 100 100" className="loader-lotus-spin">
              <path d="M50 25 C45 45 35 60 50 80 C65 60 55 45 50 25 Z" fill="none" stroke="#7c3aed" strokeWidth="4" />
              <path d="M50 80 C35 75 25 60 20 40 C35 50 45 60 50 80 Z" fill="none" stroke="#7c3aed" strokeWidth="4" />
              <path d="M50 80 C65 75 75 60 80 40 C65 50 55 60 50 80 Z" fill="none" stroke="#7c3aed" strokeWidth="4" />
            </svg>
            <span>Loading more video blogs...</span>
          </div>
        ) : (
          <div className="end-of-list-badge">
            <span>✦ You've reached the end of the video catalog ✦</span>
          </div>
        )}
      </div>

      {/* Interactive Video Player & Transcript Modal */}
      {activeModalVideo && (
        <div className="video-modal-overlay" onClick={() => setActiveModalVideo(null)}>
          <div className="video-modal-container glass-panel" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close-btn" onClick={() => setActiveModalVideo(null)}>
              ✕
            </button>

            <div className="video-modal-grid">
              {/* Left Column: Embed Player */}
              <div className="modal-player-col">
                <div className="modal-video-screen">
                  <iframe
                    src={getEmbedWithTime(activeModalVideo.videoEmbedUrl, activeTimestampSeconds)}
                    className="modal-yt-iframe"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    title={activeModalVideo.title}
                  />
                </div>

                <div className="modal-video-info">
                  <h2>{activeModalVideo.title}</h2>
                  <div className="modal-meta-row">
                    <span>By: <strong>{activeModalVideo.author}</strong></span>
                    <span>•</span>
                    <span>{activeModalVideo.readTime}</span>
                    <span>•</span>
                    <span>{activeModalVideo.date}</span>
                  </div>
                  <p className="modal-video-desc">{activeModalVideo.content.replace(/<[^>]*>/g, "")}</p>

                  <Link href={`/blog/video-transcripts/${activeModalVideo.slug}`} className="modal-full-article-link">
                    📖 Open Dedicated Article Page &rarr;
                  </Link>
                </div>
              </div>

              {/* Right Column: Time-synced Interactive Transcript */}
              <div className="modal-transcript-col">
                <h3 className="modal-transcript-title">Interactive Transcript</h3>
                <div className="modal-lines-list">
                  {activeModalVideo.lines.map((line, idx) => {
                    const isActive = activeTimestampSeconds === line.seconds;
                    return (
                      <div
                        key={`${line.seconds}-${idx}`}
                        className={`modal-transcript-line ${isActive ? "active" : ""}`}
                        onClick={() => setActiveTimestampSeconds(line.seconds)}
                      >
                        <span className="line-time">[{line.timeStr}]</span>
                        <p className="line-text">{line.text}</p>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <style jsx global>{`
        .transcripts-page {
          display: flex;
          flex-direction: column;
          gap: 28px;
          width: 100%;
          max-width: 100%;
          box-sizing: border-box;
          font-family: var(--font-family);
        }
        .transcripts-page .transcripts-header {
          text-align: left;
          padding: 24px 28px;
          background: linear-gradient(135deg, #fcfaff 0%, #f5f0ff 100%);
          border: 1px solid rgba(168, 85, 247, 0.15);
          border-radius: 20px;
          box-shadow: 0 4px 20px rgba(124, 58, 237, 0.04);
        }
        .transcripts-page .page-title {
          font-family: var(--font-serif);
          font-size: 2.2rem;
          color: #3b0764;
          margin: 0;
          font-weight: 800;
          letter-spacing: -0.01em;
          line-height: 1.2;
        }
        .transcripts-page .page-subtitle {
          font-family: var(--font-family);
          font-size: 1rem;
          color: #64748b;
          max-width: 720px;
          margin: 8px 0 0;
          line-height: 1.5;
        }

        /* Reference-style Responsive Video Cards List */
        .transcripts-page .video-cards-list {
          display: flex;
          flex-direction: column;
          gap: 24px;
          width: 100%;
          max-width: 100%;
          box-sizing: border-box;
        }
        .transcripts-page .reference-style-card {
          display: flex;
          flex-direction: row;
          width: 100%;
          max-width: 100%;
          min-width: 0;
          box-sizing: border-box;
          background: #ffffff;
          border: 1px solid rgba(168, 85, 247, 0.12);
          border-radius: 24px;
          padding: 16px;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.03);
          gap: 24px;
          align-items: stretch;
          transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.3s cubic-bezier(0.16, 1, 0.3, 1), border-color 0.3s ease;
        }
        .transcripts-page .reference-style-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 14px 32px rgba(124, 58, 237, 0.08);
          border-color: rgba(168, 85, 247, 0.28);
        }

        /* Fixed Media Thumbnail Wrapper (Laptop/Desktop) */
        .transcripts-page .card-media-wrapper {
          position: relative;
          width: 320px;
          min-width: 320px;
          max-width: 320px;
          height: 200px;
          flex-shrink: 0;
          border-radius: 18px;
          overflow: hidden;
          background: #0f0a1e;
          box-sizing: border-box;
        }
        .transcripts-page .card-media-link {
          position: relative;
          display: block;
          width: 100%;
          height: 100%;
          text-decoration: none;
        }
        .transcripts-page .card-media-img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
          transition: transform 0.4s ease, opacity 0.4s ease;
          opacity: 0.94;
        }
        .transcripts-page .card-media-wrapper:hover .card-media-img {
          transform: scale(1.05);
          opacity: 1;
        }

        /* Overlay Play Button & Badges */
        .transcripts-page .play-overlay-circle {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 50px;
          height: 50px;
          border-radius: 50%;
          background: rgba(124, 58, 237, 0.9);
          backdrop-filter: blur(4px);
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 0 20px rgba(168, 85, 247, 0.5);
          transition: transform 0.25s ease, background 0.2s ease;
          z-index: 3;
        }
        .transcripts-page .card-media-wrapper:hover .play-overlay-circle {
          transform: translate(-50%, -50%) scale(1.15);
          background: #7c3aed;
        }
        .transcripts-page .play-icon {
          color: #ffffff;
          font-size: 1.15rem;
          margin-left: 3px;
          line-height: 1;
        }
        .transcripts-page .pill-badge-left {
          position: absolute;
          bottom: 12px;
          left: 12px;
          background: rgba(255, 255, 255, 0.95);
          backdrop-filter: blur(4px);
          color: #6b21a8;
          font-size: 0.72rem;
          font-weight: 800;
          padding: 5px 12px;
          border-radius: 12px;
          text-transform: uppercase;
          letter-spacing: 0.03em;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
          z-index: 2;
        }
        .transcripts-page .pill-badge-right {
          position: absolute;
          bottom: 12px;
          right: 12px;
          background: rgba(255, 255, 255, 0.95);
          backdrop-filter: blur(4px);
          color: #475569;
          font-size: 0.75rem;
          font-weight: 700;
          padding: 5px 12px;
          border-radius: 12px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
          z-index: 2;
        }

        /* Right Content Body */
        .transcripts-page .card-content-body {
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          flex: 1;
          min-width: 0;
          padding: 4px 8px 4px 0;
          box-sizing: border-box;
        }
        .transcripts-page .card-header-block {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }
        .transcripts-page .card-title-link {
          text-decoration: none;
        }
        .transcripts-page .card-post-title {
          font-size: 1.35rem;
          color: #3b0764;
          margin: 0;
          font-weight: 800;
          line-height: 1.3;
          letter-spacing: -0.01em;
          cursor: pointer;
          transition: color 0.2s ease;
        }
        .transcripts-page .card-post-title:hover {
          color: #7c3aed;
        }
        .transcripts-page .card-post-desc {
          font-size: 0.92rem;
          color: #64748b;
          margin: 0;
          line-height: 1.55;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        .transcripts-page .summary-label {
          color: #7c3aed;
          font-weight: 700;
        }

        .transcripts-page .card-footer-divider {
          height: 1px;
          background: #f1f5f9;
          width: 100%;
          margin: 16px 0 12px;
        }

        .transcripts-page .card-footer-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          flex-wrap: wrap;
        }
        .transcripts-page .author-metadata {
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .transcripts-page .author-avatar-circle {
          width: 28px;
          height: 28px;
          border-radius: 50%;
          background: #f3e8ff;
          color: #7c3aed;
          font-size: 0.8rem;
          font-weight: 800;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .transcripts-page .author-fullname {
          font-size: 0.88rem;
          color: #475569;
          font-weight: 600;
        }
        .transcripts-page .metadata-dot {
          color: #cbd5e1;
          font-size: 0.85rem;
        }
        .transcripts-page .publish-date-text {
          font-size: 0.88rem;
          color: #94a3b8;
        }

        .transcripts-page .action-buttons-group {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .transcripts-page .quick-watch-btn {
          background: #f3e8ff;
          color: #7c3aed;
          border: 1px solid rgba(124, 58, 237, 0.15);
          padding: 7px 16px;
          border-radius: 20px;
          font-size: 0.8rem;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.2s ease;
          white-space: nowrap;
        }
        .transcripts-page .quick-watch-btn:hover {
          background: #e9d5ff;
        }
        .transcripts-page .read-article-link {
          font-size: 0.85rem;
          color: #4c1d95;
          font-weight: 700;
          text-decoration: none;
          transition: color 0.2s ease;
          white-space: nowrap;
        }
        .transcripts-page .read-article-link:hover {
          color: #7c3aed;
        }

        /* Responsive Breakpoints (Laptop / Tablet / Mobile) */
        @media (max-width: 960px) {
          .transcripts-page .card-media-wrapper {
            width: 260px;
            min-width: 260px;
            max-width: 260px;
            height: 180px;
          }
          .transcripts-page .card-post-title {
            font-size: 1.2rem;
          }
        }

        @media (max-width: 768px) {
          .transcripts-page .transcripts-header {
            padding: 18px 20px;
            border-radius: 16px;
          }
          .transcripts-page .page-title {
            font-size: 1.6rem;
          }
          .transcripts-page .page-subtitle {
            font-size: 0.88rem;
          }
          .transcripts-page .reference-style-card {
            flex-direction: column;
            padding: 14px;
            border-radius: 20px;
            gap: 14px;
          }
          .transcripts-page .card-media-wrapper {
            width: 100%;
            min-width: 100%;
            max-width: 100%;
            height: 210px;
            border-radius: 14px;
          }
          .transcripts-page .card-content-body {
            padding: 0;
            width: 100%;
          }
          .transcripts-page .card-footer-row {
            flex-direction: row;
            align-items: center;
            justify-content: space-between;
            gap: 12px;
          }
        }

        @media (max-width: 520px) {
          .transcripts-page .card-media-wrapper {
            height: 185px;
          }
          .transcripts-page .card-post-title {
            font-size: 1.15rem;
          }
          .transcripts-page .card-footer-row {
            flex-direction: column;
            align-items: flex-start;
            gap: 12px;
          }
          .transcripts-page .action-buttons-group {
            width: 100%;
            justify-content: space-between;
            align-items: center;
          }
          .transcripts-page .quick-watch-btn {
            flex: 1;
            text-align: center;
          }
          .transcripts-page .read-article-link {
            padding: 7px 14px;
            background: #f8fafc;
            border-radius: 20px;
            border: 1px solid rgba(0, 0, 0, 0.06);
            text-align: center;
          }
        }

        /* Infinite Scroll Sentinel Wrapper */
        .transcripts-page .infinite-scroll-sentinel-wrapper {
          display: flex;
          justify-content: center;
          align-items: center;
          padding: 24px 0 16px;
          width: 100%;
        }
        .transcripts-page .infinite-loader-box {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 10px 22px;
          border-radius: 30px;
          background: #f5f3ff;
          border: 1px solid rgba(124, 58, 237, 0.2);
          color: #7c3aed;
          font-size: 0.85rem;
          font-weight: 700;
        }
        .transcripts-page .loader-lotus-spin {
          width: 22px;
          height: 22px;
          animation: spinLotus 2s linear infinite;
        }
        @keyframes spinLotus {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        .transcripts-page .end-of-list-badge {
          font-size: 0.85rem;
          color: #64748b;
          padding: 8px 18px;
          background: #ffffff;
          border-radius: 20px;
          border: 1px solid rgba(0, 0, 0, 0.06);
        }

        /* Modal Player Overlay */
        .video-modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(15, 23, 42, 0.6);
          backdrop-filter: blur(8px);
          z-index: 9999;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
        }
        .video-modal-container {
          position: relative;
          width: 100%;
          max-width: 1050px;
          max-height: 90vh;
          background: #ffffff !important;
          border: 1px solid rgba(168, 85, 247, 0.2) !important;
          border-radius: 24px;
          overflow-y: auto;
          padding: 28px !important;
          color: #1e1b4b;
          box-shadow: 0 25px 50px -12px rgba(124, 58, 237, 0.22);
        }
        .modal-close-btn {
          position: absolute;
          top: 16px;
          right: 20px;
          background: #f1f5f9;
          border: 1px solid rgba(0, 0, 0, 0.08);
          color: #334155;
          width: 34px;
          height: 34px;
          border-radius: 50%;
          font-size: 1rem;
          font-weight: 700;
          cursor: pointer;
          z-index: 10;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s ease;
        }
        .modal-close-btn:hover {
          background: #e2e8f0;
          color: #0f172a;
        }
        .video-modal-grid {
          display: grid;
          grid-template-columns: 1.2fr 0.8fr;
          gap: 28px;
          align-items: flex-start;
        }
        @media (max-width: 850px) {
          .video-modal-grid {
            grid-template-columns: 1fr;
            gap: 20px;
          }
          .video-modal-container {
            padding: 20px 16px !important;
          }
        }
        .modal-video-screen {
          position: relative;
          width: 100%;
          padding-top: 56.25%;
          background: #000;
          border-radius: 16px;
          overflow: hidden;
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
        }
        .modal-yt-iframe {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          border: none;
        }
        .modal-video-info {
          margin-top: 18px;
          display: flex;
          flex-direction: column;
          gap: 10px;
        }
        .modal-video-info h2 {
          font-size: 1.4rem;
          color: #2e1065;
          margin: 0;
          font-weight: 800;
        }
        .modal-meta-row {
          font-size: 0.82rem;
          color: #7c3aed;
          display: flex;
          gap: 8px;
          font-weight: 600;
        }
        .modal-video-desc {
          font-size: 0.9rem;
          color: #475569;
          line-height: 1.5;
          margin: 0;
        }
        .modal-full-article-link {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          margin-top: 8px;
          background: #7c3aed;
          color: #ffffff;
          padding: 8px 18px;
          border-radius: 20px;
          font-size: 0.85rem;
          font-weight: 700;
          text-decoration: none;
          transition: background 0.2s ease;
          width: fit-content;
        }
        .modal-full-article-link:hover {
          background: #6d28d9;
        }

        .modal-transcript-col {
          display: flex;
          flex-direction: column;
          gap: 14px;
          max-height: 520px;
          background: #faf5ff;
          padding: 18px;
          border-radius: 18px;
          border: 1px solid rgba(168, 85, 247, 0.15);
        }
        .modal-transcript-title {
          font-size: 1.15rem;
          color: #4c1d95;
          margin: 0;
          border-bottom: 1px solid rgba(124, 58, 237, 0.15);
          padding-bottom: 8px;
          font-weight: 750;
        }
        .modal-lines-list {
          overflow-y: auto;
          display: flex;
          flex-direction: column;
          gap: 8px;
          max-height: 420px;
          padding-right: 4px;
        }
        .modal-transcript-line {
          display: flex;
          align-items: flex-start;
          gap: 10px;
          padding: 10px 12px;
          border-radius: 10px;
          background: #ffffff;
          border: 1px solid rgba(168, 85, 247, 0.1);
          cursor: pointer;
          transition: all 0.2s ease;
        }
        .modal-transcript-line:hover {
          background: #f3e8ff;
          border-color: rgba(168, 85, 247, 0.25);
        }
        .modal-transcript-line.active {
          background: #7c3aed;
          border-color: #6d28d9;
        }
        .modal-transcript-line.active .line-time {
          color: #e9d5ff;
        }
        .modal-transcript-line.active .line-text {
          color: #ffffff;
          font-weight: 600;
        }
        .line-time {
          font-family: monospace;
          color: #7c3aed;
          font-weight: 700;
          font-size: 0.85rem;
          flex-shrink: 0;
        }
        .line-text {
          font-size: 0.88rem;
          color: #334155;
          margin: 0;
          line-height: 1.45;
        }
      `}</style>
    </div>
  );
}
