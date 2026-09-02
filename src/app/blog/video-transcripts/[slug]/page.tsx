"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import Link from "next/link";
import { useBlog } from "@/app/blog/BlogContext";
import { Blog } from "@/types/database";
import {
  FALLBACK_VIDEOS,
  ParsedVideoBlog,
  parseTranscriptText,
  normalizeEmbedUrl,
  TranscriptLine
} from "../page";

export default function VideoBlogDetailPage() {
  const router = useRouter();
  const params = useParams();
  const rawSlug = (params?.slug as string) || "";
  const { setActiveBlog } = useBlog();

  const [videoBlog, setVideoBlog] = useState<ParsedVideoBlog | null>(null);
  const [allVideos, setAllVideos] = useState<ParsedVideoBlog[]>(FALLBACK_VIDEOS);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");

  // Video playback timestamp state
  const [activeTimestamp, setActiveTimestamp] = useState<number>(0);

  // User session state
  const [user, setUser] = useState<any>(null);

  // Engagement states
  const [likesCount, setLikesCount] = useState<number>(0);
  const [isLiked, setIsLiked] = useState<boolean>(false);
  const [loadingLikes, setLoadingLikes] = useState<boolean>(false);

  // Comments states
  const [comments, setComments] = useState<any[]>([]);
  const [commentText, setCommentText] = useState<string>("");
  const [postingComment, setPostingComment] = useState<boolean>(false);

  // Share state
  const [copiedLink, setCopiedLink] = useState<boolean>(false);

  // 1. Fetch user session
  useEffect(() => {
    const session = window.localStorage.getItem("divingsanatan_user_session");
    if (session) {
      try {
        setUser(JSON.parse(session));
      } catch (e) {
        setUser(null);
      }
    }
  }, []);

  // 2. Resolve video blog data
  useEffect(() => {
    if (!rawSlug) return;
    let isMounted = true;
    setLoading(true);
    setError("");

    // Fallback lookup first
    const fallbackMatch = FALLBACK_VIDEOS.find(
      (v) => v.slug === rawSlug || v.id === rawSlug
    );

    fetch("/api/blogs")
      .then((res) => res.json())
      .then((json) => {
        if (!isMounted) return;
        if (json.success && Array.isArray(json.data)) {
          const rawBlogs: Blog[] = json.data;
          const filtered = rawBlogs.filter(
            (b) =>
              b.content_type === "video" ||
              Boolean(b.video_embed_url) ||
              (b.videos && b.videos.length > 0) ||
              b.category?.toLowerCase().includes("video") ||
              b.section?.toLowerCase().includes("video")
          );

          const parsedList: ParsedVideoBlog[] = filtered.map((b) => {
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

          // Merge fallbacks if not present
          const combined = [...parsedList];
          FALLBACK_VIDEOS.forEach((fv) => {
            if (!combined.some((item) => item.id === fv.id || item.slug === fv.slug)) {
              combined.push(fv);
            }
          });

          setAllVideos(combined);

          const target = combined.find(
            (v) => v.slug === rawSlug || v.id === rawSlug
          );

          if (target) {
            setVideoBlog(target);
          } else if (fallbackMatch) {
            setVideoBlog(fallbackMatch);
          } else {
            setError("Video blog post not found.");
          }
        } else if (fallbackMatch) {
          setVideoBlog(fallbackMatch);
        } else {
          setError("Failed to resolve video blog.");
        }
      })
      .catch((err) => {
        console.error("Failed to load video blog details:", err);
        if (fallbackMatch && isMounted) {
          setVideoBlog(fallbackMatch);
        } else if (isMounted) {
          setError("Connection error while loading video blog.");
        }
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [rawSlug]);

  // Set active blog context for sidebar
  useEffect(() => {
    if (videoBlog) {
      setActiveBlog({
        id: videoBlog.id,
        slug: videoBlog.slug,
        title: videoBlog.title,
        category: videoBlog.category,
        author: videoBlog.author,
        content: videoBlog.content,
        date: videoBlog.date,
        readTime: videoBlog.readTime,
        image: videoBlog.image,
        videos: [videoBlog.videoEmbedUrl],
      } as any);
    }
    return () => {
      setActiveBlog(null);
    };
  }, [videoBlog, setActiveBlog]);

  // Fetch Likes & Comments for the blog
  useEffect(() => {
    if (!videoBlog?.id) return;
    const blogId = videoBlog.id;

    // Likes
    const profileId = user?.id || "";
    fetch(`/api/blogs/likes?blogId=${encodeURIComponent(blogId)}&profileId=${encodeURIComponent(profileId)}`)
      .then((res) => res.json())
      .then((json) => {
        if (json.success) {
          setLikesCount(json.count || 0);
          setIsLiked(Boolean(json.liked));
        }
      })
      .catch((err) => console.error("Error loading likes:", err));

    // Comments
    fetch(`/api/blogs/comments?blogId=${encodeURIComponent(blogId)}`)
      .then((res) => res.json())
      .then((json) => {
        if (json.success && Array.isArray(json.data)) {
          setComments(json.data);
        }
      })
      .catch((err) => console.error("Error loading comments:", err));
  }, [videoBlog?.id, user?.id]);

  // Handle Like Action
  const handleLike = async () => {
    if (!videoBlog) return;
    if (!user) {
      alert("Please log in to like this video blog post.");
      return;
    }

    try {
      setLoadingLikes(true);
      const res = await fetch("/api/blogs/likes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ blogId: videoBlog.id, profileId: user.id }),
      });
      const json = await res.json();
      if (json.success) {
        setIsLiked(json.liked);
        setLikesCount((prev) => (json.liked ? prev + 1 : prev - 1));
      }
    } catch (err) {
      console.error("Failed to like video blog:", err);
    } finally {
      setLoadingLikes(false);
    }
  };

  // Handle Comment Submission
  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!videoBlog || !commentText.trim()) return;
    if (!user) {
      alert("Please log in to leave a comment.");
      return;
    }

    try {
      setPostingComment(true);
      const res = await fetch("/api/blogs/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          blogId: videoBlog.id,
          profileId: user.id,
          commentText: commentText.trim(),
        }),
      });
      const json = await res.json();
      if (json.success) {
        setComments((prev) => [json.data, ...prev]);
        setCommentText("");
      } else {
        alert("Failed to post comment: " + json.error);
      }
    } catch (err) {
      console.error("Error submitting comment:", err);
    } finally {
      setPostingComment(false);
    }
  };

  // Handle Share Link Copy
  const copyShareLink = () => {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(window.location.href);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  const isDirectVideoFile = (url: string) => {
    if (!url) return false;
    const clean = url.trim().toLowerCase();
    return (
      clean.endsWith(".mp4") ||
      clean.endsWith(".webm") ||
      clean.endsWith(".mov") ||
      clean.endsWith(".ogg") ||
      clean.includes("/storage/v1/object/public/uploads/") ||
      clean.includes("video/upload")
    );
  };

  const getEmbedWithTime = (baseUrl: string, startSecs: number) => {
    if (!baseUrl) return "";
    const joinChar = baseUrl.includes("?") ? "&" : "?";
    return `${baseUrl}${joinChar}autoplay=1&start=${startSecs}`;
  };

  if (loading) {
    return (
      <div className="video-detail-loading">
        <div className="infinite-loader-box">
          <svg viewBox="0 0 100 100" className="loader-lotus-spin">
            <path d="M50 25 C45 45 35 60 50 80 C65 60 55 45 50 25 Z" fill="none" stroke="#7c3aed" strokeWidth="4" />
          </svg>
          <span>Loading Video Blog Details...</span>
        </div>
      </div>
    );
  }

  if (error || !videoBlog) {
    return (
      <div className="video-detail-error glass-panel">
        <h2>Video Blog Not Found</h2>
        <p>{error || "The requested video blog post could not be resolved."}</p>
        <Link href="/blog/video-transcripts" className="back-link-btn">
          ← Back to Video Transcripts
        </Link>
      </div>
    );
  }

  const relatedVideos = allVideos
    .filter((v) => v.id !== videoBlog.id && v.slug !== videoBlog.slug)
    .slice(0, 3);

  return (
    <div className="video-detail-page">
      {/* Breadcrumb Navigation */}
      <nav className="article-breadcrumb">
        <Link href="/blog" className="breadcrumb-link">
          Blog
        </Link>
        <span className="breadcrumb-sep">&gt;</span>
        <Link href="/blog/video-transcripts" className="breadcrumb-link">
          Video Transcripts
        </Link>
        <span className="breadcrumb-sep">&gt;</span>
        <span className="breadcrumb-current">{videoBlog.title}</span>
      </nav>

      {/* Main Video Detail Article Container */}
      <article className="video-detail-article">
        {/* Header Block */}
        <div className="video-detail-header">
          <div className="category-tag-row">
            <span className="category-badge">{videoBlog.category}</span>
            <span className="duration-badge">⏱ {videoBlog.readTime}</span>
          </div>
          <h1 className="video-detail-title">{videoBlog.title}</h1>
          <div className="video-detail-meta">
            <div className="author-box">
              <div className="author-avatar">{videoBlog.author.charAt(0)}</div>
              <span className="author-name">{videoBlog.author}</span>
            </div>
            <span className="meta-sep">•</span>
            <span className="publish-date">Published {videoBlog.date}</span>
          </div>
        </div>

        {/* Video Player & Interactive Transcript 2-Column Grid */}
        <div className="video-interactive-grid">
          {/* Main Video Screen */}
          <div className="video-player-column">
            <div className="video-screen-wrapper">
              {isDirectVideoFile(videoBlog.videoEmbedUrl) ? (
                <video
                  src={videoBlog.videoEmbedUrl}
                  controls
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    width: "100%",
                    height: "100%",
                    objectFit: "contain",
                    background: "#000",
                  }}
                />
              ) : (
                <iframe
                  src={getEmbedWithTime(videoBlog.videoEmbedUrl, activeTimestamp)}
                  className="video-iframe"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  title={videoBlog.title}
                />
              )}
            </div>
            <p className="timestamp-note">
              💡 Tip: Click any transcript line on the right to jump directly to that timestamp in the video session!
            </p>
          </div>

          {/* Time-Synced Transcript Box */}
          <div className="transcript-column glass-panel">
            <div className="transcript-header-row">
              <h3 className="transcript-heading">📜 Interactive Transcript</h3>
              <span className="lines-count">{videoBlog.lines.length} Timestamp Notes</span>
            </div>
            <div className="transcript-lines-scroll">
              {videoBlog.lines.map((line, idx) => {
                const isActive = activeTimestamp === line.seconds;
                return (
                  <button
                    key={`${line.seconds}-${idx}`}
                    className={`transcript-line-btn ${isActive ? "active" : ""}`}
                    onClick={() => setActiveTimestamp(line.seconds)}
                  >
                    <span className="time-badge">[{line.timeStr}]</span>
                    <span className="line-text">{line.text}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* About This Video / Article Content */}
        <div className="video-content-section glass-panel">
          <h3 className="section-title">About This Guided Video Session</h3>
          <div
            className="video-content-body"
            dangerouslySetInnerHTML={{ __html: videoBlog.content }}
          />

          {/* Social Actions & Engagement Row */}
          <div className="engagement-bar">
            <button
              className={`like-btn ${isLiked ? "liked" : ""}`}
              onClick={handleLike}
              disabled={loadingLikes}
            >
              <span className="heart-icon">{isLiked ? "❤️" : "🤍"}</span>
              <span>{likesCount} Likes</span>
            </button>

            <button className="share-btn" onClick={copyShareLink}>
              <span className="share-icon">🔗</span>
              <span>{copiedLink ? "Link Copied!" : "Share Video"}</span>
            </button>
          </div>
        </div>

        {/* Comments Section */}
        <div className="comments-section glass-panel">
          <h3 className="section-title">Discussion & Insights ({comments.length})</h3>

          {/* Add Comment Form */}
          <form onSubmit={handleCommentSubmit} className="comment-form">
            <textarea
              rows={3}
              placeholder={user ? "Share your reflection or experience..." : "Log in to post a reflection..."}
              className="comment-textarea"
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              disabled={!user || postingComment}
            />
            <div className="comment-submit-row">
              {!user && <span className="login-hint">Please sign in to join the conversation.</span>}
              <Button
                type="submit"
                variant="gold"
                size="sm"
                disabled={!user || !commentText.trim() || postingComment}
              >
                {postingComment ? "Posting..." : "Post Reflection"}
              </Button>
            </div>
          </form>

          {/* Comments List */}
          <div className="comments-list">
            {comments.length > 0 ? (
              comments.map((c) => (
                <div key={c.id || c.created_at} className="comment-item">
                  <div className="comment-avatar">
                    {(c.profiles?.name || c.author || "U").charAt(0).toUpperCase()}
                  </div>
                  <div className="comment-body">
                    <div className="comment-meta">
                      <span className="comment-author">{c.profiles?.name || c.author || "Anonymous Seeker"}</span>
                      <span className="comment-date">{c.created_at ? new Date(c.created_at).toLocaleDateString() : "Just now"}</span>
                    </div>
                    <p className="comment-text">{c.comment_text || c.text}</p>
                  </div>
                </div>
              ))
            ) : (
              <p className="no-comments-msg">Be the first to share your reflection on this video blog session!</p>
            )}
          </div>
        </div>
      </article>

      <style jsx>{`
        .video-detail-page {
          display: flex;
          flex-direction: column;
          gap: 20px;
          width: 100%;
        }

        /* Breadcrumb */
        .article-breadcrumb {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 0.85rem;
          color: #64748b;
        }
        .breadcrumb-link {
          color: #7c3aed;
          text-decoration: none;
          font-weight: 600;
        }
        .breadcrumb-link:hover {
          text-decoration: underline;
        }
        .breadcrumb-sep {
          color: #cbd5e1;
        }
        .breadcrumb-current {
          color: #1e1b4b;
          font-weight: 700;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          max-width: 320px;
        }

        .video-detail-article {
          display: flex;
          flex-direction: column;
          gap: 24px;
        }

        .video-detail-header {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }
        .category-tag-row {
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .category-badge {
          background: #7c3aed;
          color: #ffffff;
          font-size: 0.75rem;
          font-weight: 700;
          padding: 4px 12px;
          border-radius: 20px;
          text-transform: uppercase;
        }
        .duration-badge {
          background: #f3e8ff;
          color: #6b21a8;
          font-size: 0.78rem;
          font-weight: 700;
          padding: 4px 12px;
          border-radius: 20px;
        }
        .video-detail-title {
          font-size: 2.2rem;
          color: #2e1065;
          margin: 0;
          font-weight: 800;
          line-height: 1.25;
        }
        .video-detail-meta {
          display: flex;
          align-items: center;
          gap: 12px;
          font-size: 0.88rem;
          color: #64748b;
        }
        .author-box {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .author-avatar {
          width: 28px;
          height: 28px;
          border-radius: 50%;
          background: #7c3aed;
          color: #ffffff;
          font-size: 0.82rem;
          font-weight: 700;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .author-name {
          font-weight: 700;
          color: #334155;
        }
        .meta-sep {
          color: #cbd5e1;
        }

        /* 2-Column Grid */
        .video-interactive-grid {
          display: grid;
          grid-template-columns: 1.25fr 0.75fr;
          gap: 24px;
          align-items: flex-start;
        }
        @media (max-width: 900px) {
          .video-interactive-grid {
            grid-template-columns: 1fr;
          }
        }

        .video-player-column {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }
        .video-screen-wrapper {
          position: relative;
          width: 100%;
          padding-top: 56.25%;
          background: #090514;
          border-radius: 20px;
          overflow: hidden;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.12);
        }
        .video-iframe {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          border: none;
        }
        .timestamp-note {
          font-size: 0.82rem;
          color: #6b21a8;
          background: #f5f3ff;
          padding: 8px 14px;
          border-radius: 10px;
          margin: 0;
          border: 1px solid rgba(124, 58, 237, 0.15);
        }

        /* Transcript */
        .transcript-column {
          display: flex;
          flex-direction: column;
          gap: 14px;
          max-height: 480px;
          padding: 20px !important;
          border-radius: 20px !important;
          background: #ffffff !important;
          border: 1px solid rgba(168, 85, 247, 0.15) !important;
        }
        .transcript-header-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding-bottom: 10px;
          border-bottom: 1px solid rgba(0, 0, 0, 0.08);
        }
        .transcript-heading {
          font-size: 1.1rem;
          color: #4c1d95;
          margin: 0;
          font-weight: 700;
        }
        .lines-count {
          font-size: 0.78rem;
          color: #7c3aed;
          font-weight: 600;
        }
        .transcript-lines-scroll {
          overflow-y: auto;
          display: flex;
          flex-direction: column;
          gap: 8px;
          padding-right: 4px;
        }
        .transcript-line-btn {
          display: flex;
          align-items: flex-start;
          gap: 10px;
          padding: 10px 12px;
          border-radius: 12px;
          background: #faf5ff;
          border: 1px solid transparent;
          cursor: pointer;
          text-align: left;
          transition: all 0.2s ease;
        }
        .transcript-line-btn:hover {
          background: #f3e8ff;
          border-color: rgba(124, 58, 237, 0.2);
        }
        .transcript-line-btn.active {
          background: #6b21a8;
          border-color: #581c87;
        }
        .transcript-line-btn.active .time-badge {
          color: #e9d5ff;
        }
        .transcript-line-btn.active .line-text {
          color: #ffffff;
          font-weight: 600;
        }
        .time-badge {
          font-family: monospace;
          color: #7c3aed;
          font-weight: 700;
          font-size: 0.85rem;
          flex-shrink: 0;
        }
        .line-text {
          font-size: 0.88rem;
          color: #334155;
          line-height: 1.45;
        }

        /* Video Content Section */
        .video-content-section {
          padding: 28px !important;
          border-radius: 20px !important;
          background: #ffffff !important;
          border: 1px solid rgba(168, 85, 247, 0.15) !important;
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        .section-title {
          font-size: 1.3rem;
          color: #3b0764;
          margin: 0;
          font-weight: 750;
        }
        .video-content-body {
          font-size: 0.96rem;
          color: #475569;
          line-height: 1.7;
        }

        /* Engagement Bar */
        .engagement-bar {
          display: flex;
          align-items: center;
          gap: 16px;
          margin-top: 12px;
          padding-top: 16px;
          border-top: 1px solid rgba(0, 0, 0, 0.08);
        }
        .like-btn,
        .share-btn {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 18px;
          border-radius: 30px;
          font-size: 0.88rem;
          font-weight: 700;
          cursor: pointer;
          border: 1px solid rgba(168, 85, 247, 0.2);
          background: #f5f3ff;
          color: #6b21a8;
          transition: all 0.2s ease;
        }
        .like-btn:hover,
        .share-btn:hover {
          background: #e9d5ff;
        }
        .like-btn.liked {
          background: #fce7f3;
          color: #be185d;
          border-color: rgba(190, 24, 93, 0.2);
        }

        /* Comments Section */
        .comments-section {
          padding: 28px !important;
          border-radius: 20px !important;
          background: #ffffff !important;
          border: 1px solid rgba(168, 85, 247, 0.15) !important;
          display: flex;
          flex-direction: column;
          gap: 20px;
        }
        .comment-form {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }
        .comment-textarea {
          width: 100%;
          padding: 14px;
          border-radius: 14px;
          border: 1px solid rgba(168, 85, 247, 0.2);
          font-family: inherit;
          font-size: 0.92rem;
          outline: none;
          resize: vertical;
        }
        .comment-textarea:focus {
          border-color: #7c3aed;
          box-shadow: 0 0 0 3px rgba(124, 58, 237, 0.1);
        }
        .comment-submit-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .login-hint {
          font-size: 0.82rem;
          color: #64748b;
        }
        .comments-list {
          display: flex;
          flex-direction: column;
          gap: 14px;
        }
        .comment-item {
          display: flex;
          gap: 12px;
          padding: 12px;
          background: #faf5ff;
          border-radius: 14px;
        }
        .comment-avatar {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background: #6b21a8;
          color: #ffffff;
          font-size: 0.85rem;
          font-weight: 700;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        .comment-body {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        .comment-meta {
          display: flex;
          gap: 8px;
          font-size: 0.82rem;
        }
        .comment-author {
          font-weight: 700;
          color: #1e1b4b;
        }
        .comment-date {
          color: #94a3b8;
        }
        .comment-text {
          font-size: 0.9rem;
          color: #334155;
          margin: 0;
        }
        .no-comments-msg {
          font-size: 0.88rem;
          color: #64748b;
          font-style: italic;
          margin: 0;
        }

        /* Related Videos */
        .related-videos-section {
          display: flex;
          flex-direction: column;
          gap: 16px;
          margin-top: 10px;
        }
        .related-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
          gap: 18px;
        }
        .related-card {
          padding: 0 !important;
          overflow: hidden;
          border-radius: 16px !important;
          background: #ffffff !important;
          border: 1px solid rgba(168, 85, 247, 0.15) !important;
        }
        .related-thumb-link {
          position: relative;
          display: block;
          height: 140px;
        }
        .related-img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        .related-play {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 36px;
          height: 36px;
          border-radius: 50%;
          background: rgba(124, 58, 237, 0.9);
          color: #ffffff;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 0.9rem;
        }
        .related-body {
          padding: 12px;
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        .related-cat {
          font-size: 0.72rem;
          color: #7c3aed;
          font-weight: 700;
          text-transform: uppercase;
        }
        .related-title-link {
          text-decoration: none;
        }
        .related-title {
          font-size: 0.92rem;
          color: #1e1b4b;
          margin: 0;
          font-weight: 700;
          line-height: 1.3;
        }
        .related-title-link:hover .related-title {
          color: #7c3aed;
        }

        .video-detail-loading,
        .video-detail-error {
          padding: 60px 20px;
          text-align: center;
        }
        .back-link-btn {
          display: inline-block;
          margin-top: 14px;
          color: #7c3aed;
          font-weight: 700;
          text-decoration: none;
        }
      `}</style>
    </div>
  );
}
