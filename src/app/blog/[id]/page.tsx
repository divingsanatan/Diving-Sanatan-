"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

interface Blog {
  id: string;
  title: string;
  category: string;
  author: string;
  content: string;
  date: string;
  readTime: string;
  image: string;
  images?: string[];
  videos?: string[];
}

const getBlogImage = (img: string) => {
  if (!img) return "/images/insight_blog.png";
  if (img.startsWith("http://") || img.startsWith("https://") || img.startsWith("/")) {
    return img;
  }
  const mappings: Record<string, string> = {
    "amethyst_crystals": "/images/insight_blog.png",
    "chakras_guide": "/images/insight_space.png",
    "breathing_stress": "/images/insight_video.png",
  };
  return mappings[img] || "/images/insight_blog.png";
};

const IconHeart = ({ filled = false }: { filled?: boolean }) => (
  <svg className="action-icon" width="18" height="18" viewBox="0 0 24 24" fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
  </svg>
);

const IconComment = () => (
  <svg className="action-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
  </svg>
);

const IconShare = () => (
  <svg className="action-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <circle cx="18" cy="5" r="3" />
    <circle cx="6" cy="12" r="3" />
    <circle cx="18" cy="19" r="3" />
    <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
    <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
  </svg>
);

const IconCopy = () => (
  <svg className="action-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
  </svg>
);

const isHtmlContent = (c: string) => /^\s*<[a-z]/.test(c);

const getContentParagraphs = (content: string): string[] =>
  content.split(/\r?\n\r?\n/).filter((p) => p.trim().length > 0).map((p) => p.trim());

const extractHtmlIntro = (html: string): string => {
  const match = html.match(/<p[^>]*>([\s\S]*?)<\/p>/i);
  if (match) return match[1].replace(/<[^>]+>/g, "").trim();
  return "";
};

const stripFirstHtmlParagraph = (html: string): string =>
  html.replace(/<p[^>]*>[\s\S]*?<\/p>/i, "").trim();

const FALLBACK_QUOTE =
  "Energy flow balances are the foundational blueprint of physical comfort. Maintain your aura, and your mind will follow.";

const FALLBACK_BODY =
  "Somatic therapies remind us that blockades within our chakras aren't just mystical constructs. They represent tension held in our nervous pathways. By introducing sound bowls at specific frequencies, we assist the body in aligning these rhythms, which stabilizes cortisol flow and reduces tension.";
export default function BlogDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;

  const [blog, setBlog] = useState<Blog | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeMediaIndex, setActiveMediaIndex] = useState(0);

  // User session
  const [user, setUser] = useState<any>(null);

  // Likes states
  const [likesCount, setLikesCount] = useState(0);
  const [isLiked, setIsLiked] = useState(false);
  const [loadingLikes, setLoadingLikes] = useState(false);

  // Comments states
  const [comments, setComments] = useState<any[]>([]);
  const [commentText, setCommentText] = useState("");
  const [loadingComments, setLoadingComments] = useState(false);
  const [postingComment, setPostingComment] = useState(false);

  // Share states
  const [showSharePopup, setShowSharePopup] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [showCommentsPanel, setShowCommentsPanel] = useState(false);

  // Auth modal states
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [modalAuthMode, setModalAuthMode] = useState<"login" | "signup">("login");
  const [modalEmail, setModalEmail] = useState("");
  const [modalPassword, setModalPassword] = useState("");
  const [modalName, setModalName] = useState("");
  const [modalPhone, setModalPhone] = useState("");
  const [modalGender, setModalGender] = useState("Female");
  const [modalDob, setModalDob] = useState("");
  const [modalAuthError, setModalAuthError] = useState("");
  const [modalAuthSuccess, setModalAuthSuccess] = useState("");
  const [modalSubmitting, setModalSubmitting] = useState(false);
  const [pendingActionAfterAuth, setPendingActionAfterAuth] = useState<"like" | "comment" | null>(null);

  const getMediaItems = (b: Blog) => {
    const imgs = (b.images || []).map((src) => ({
      type: "image" as const,
      src: getBlogImage(src),
    }));
    const vids = (b.videos || []).map((src) => ({
      type: "video" as const,
      src,
    }));
    return [...imgs, ...vids];
  };

  const nextMedia = (total: number) => {
    setActiveMediaIndex((prev) => (prev + 1) % total);
  };

  const prevMedia = (total: number) => {
    setActiveMediaIndex((prev) => (prev - 1 + total) % total);
  };

  // 1. Fetch user session on mount
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

  // 2. Fetch blog details
  useEffect(() => {
    if (!id) return;

    async function loadBlogDetail() {
      try {
        setLoading(true);
        const res = await fetch(`/api/blogs?id=${id}`);
        const json = await res.json();
        if (json.success) {
          setBlog(json.data);
          setActiveMediaIndex(0);
        } else {
          setError(json.error || "Article not found");
        }
      } catch (err) {
        console.error(err);
        setError("Failed to resolve article server connection.");
      } finally {
        setLoading(false);
      }
    }
    loadBlogDetail();
  }, [id]);

  // 3. Fetch likes count & status
  useEffect(() => {
    if (!id) return;

    async function loadLikes() {
      try {
        setLoadingLikes(true);
        const profileId = user?.id || "";
        const res = await fetch(`/api/blogs/likes?blogId=${id}&profileId=${profileId}`);
        const json = await res.json();
        if (json.success) {
          setLikesCount(json.count);
          setIsLiked(json.liked);
        }
      } catch (err) {
        console.error("Failed to load likes:", err);
      } finally {
        setLoadingLikes(false);
      }
    }

    loadLikes();
  }, [id, user]);

  // 4. Fetch comments
  useEffect(() => {
    if (!id) return;

    async function loadComments() {
      try {
        setLoadingComments(true);
        const res = await fetch(`/api/blogs/comments?blogId=${id}`);
        const json = await res.json();
        if (json.success) {
          setComments(json.data);
        }
      } catch (err) {
        console.error("Failed to load comments:", err);
      } finally {
        setLoadingComments(false);
      }
    }

    loadComments();
  }, [id]);

  // Handle Like Toggle
  const handleLikeToggle = async () => {
    if (!user) {
      setPendingActionAfterAuth("like");
      setShowAuthModal(true);
      return;
    }

    try {
      setLoadingLikes(true);
      const res = await fetch("/api/blogs/likes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ blogId: id, profileId: user.id })
      });
      const json = await res.json();
      if (json.success) {
        setIsLiked(json.liked);
        setLikesCount((prev) => (json.liked ? prev + 1 : prev - 1));
      }
    } catch (err) {
      console.error("Failed to toggle like:", err);
    } finally {
      setLoadingLikes(false);
    }
  };

  // Helper function to toggle likes immediately after a successful authentication callback
  const toggleLikeForUser = async (profileId: string) => {
    try {
      setLoadingLikes(true);
      const res = await fetch("/api/blogs/likes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ blogId: id, profileId })
      });
      const json = await res.json();
      if (json.success) {
        setIsLiked(json.liked);
        setLikesCount((prev) => (json.liked ? prev + 1 : prev - 1));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingLikes(false);
    }
  };

  // Handle Comment Submission
  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      setPendingActionAfterAuth("comment");
      setShowAuthModal(true);
      return;
    }

    if (!commentText.trim()) return;

    try {
      setPostingComment(true);
      const res = await fetch("/api/blogs/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ blogId: id, profileId: user.id, commentText })
      });
      const json = await res.json();
      if (json.success) {
        setComments((prev) => [json.data, ...prev]);
        setCommentText("");
      } else {
        alert("Failed to post comment: " + json.error);
      }
    } catch (err) {
      console.error("Failed to post comment:", err);
    } finally {
      setPostingComment(false);
    }
  };

  // Handle Modal Login
  const handleModalLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalAuthError("");

    if (!modalEmail.trim() || !modalPassword) {
      setModalAuthError("Please enter both email and password.");
      return;
    }

    try {
      setModalSubmitting(true);
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: modalEmail, password: modalPassword })
      });
      const json = await res.json();

      if (json.success) {
        window.localStorage.setItem("divingsanatan_user_session", JSON.stringify(json.data));
        setUser(json.data);
        setShowAuthModal(false);

        // Execute pending actions
        if (pendingActionAfterAuth === "like") {
          toggleLikeForUser(json.data.id);
        }
        if (pendingActionAfterAuth === "comment") {
          setShowCommentsPanel(true);
        }
        setPendingActionAfterAuth(null);
        setModalEmail("");
        setModalPassword("");
      } else {
        setModalAuthError(json.error || "Login failed.");
      }
    } catch (err) {
      setModalAuthError("Connection failed. Try again.");
    } finally {
      setModalSubmitting(false);
    }
  };

  // Handle Modal Signup
  const handleModalSignupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalAuthError("");
    setModalAuthSuccess("");

    if (!modalName.trim() || !modalEmail.trim() || !modalPhone.trim() || !modalDob || !modalPassword) {
      setModalAuthError("All fields are required to register.");
      return;
    }

    try {
      setModalSubmitting(true);
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: modalName,
          email: modalEmail,
          phone: modalPhone,
          gender: modalGender,
          dob: modalDob,
          password: modalPassword
        })
      });
      const json = await res.json();

      if (json.success) {
        setModalAuthSuccess(json.message || "Registration completed successfully!");
        window.localStorage.setItem("divingsanatan_user_session", JSON.stringify(json.data));
        setUser(json.data);

        setTimeout(() => {
          setShowAuthModal(false);
        if (pendingActionAfterAuth === "like") {
          toggleLikeForUser(json.data.id);
        }
        if (pendingActionAfterAuth === "comment") {
          setShowCommentsPanel(true);
        }
        setPendingActionAfterAuth(null);
          setModalName("");
          setModalEmail("");
          setModalPhone("");
          setModalDob("");
          setModalPassword("");
          setModalAuthSuccess("");
        }, 1200);
      } else {
        setModalAuthError(json.error || "Registration failed.");
      }
    } catch (err) {
      setModalAuthError("Connection failed. Try again.");
    } finally {
      setModalSubmitting(false);
    }
  };

  // Handle Share Link Copy
  const copyPageLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const formatCommentDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit"
      });
    } catch (e) {
      return dateStr;
    }
  };

  const getArticleSections = (b: Blog) => {
    const coverImage = getBlogImage(b.image);
    const htmlMode = isHtmlContent(b.content);

    if (htmlMode) {
      const intro =
        extractHtmlIntro(b.content) ||
        `In this guide, ${b.author} explores ${b.title.toLowerCase()} — a foundational topic in ${b.category.toLowerCase()}.`;
      return {
        htmlMode: true,
        intro,
        bodyParagraphs: [] as string[],
        coverImage,
      };
    }

    const paras = getContentParagraphs(b.content);
    const intro =
      paras[0] ||
      `Welcome to this exploration of ${b.title}. Our practitioners share insights to help you on your healing journey.`;

    return {
      htmlMode: false,
      intro,
      bodyParagraphs: paras.slice(1),
      coverImage,
    };
  };

  return (
    <div className="blog-detail-page">
      {loading ? (
        <p className="text-muted-center-padded">Unrolling manuscript...</p>
      ) : error || !blog ? (
        <div className="error-card glass-panel card-pad-40-center">
          <h3>Error Resolving Article</h3>
          <p className="error-text-muted-mb">{error}</p>
          <Button variant="gold" onClick={() => router.push("/blog")}>Back to Blog</Button>
        </div>
      ) : (
        <article className="blog-article-content">
          {(() => {
            const sections = getArticleSections(blog);
            const { intro, bodyParagraphs, coverImage, htmlMode } = sections;

            return (
              <>
                <nav className="article-breadcrumb" aria-label="Breadcrumb">
                  <button type="button" className="breadcrumb-link" onClick={() => router.push("/blog")}>
                    ← Back to Blog
                  </button>
                  <span className="breadcrumb-sep">/</span>
                  <span className="breadcrumb-current">{blog.category}</span>
                </nav>

                <Card variant="glass" className="article-unified-card">
                  <div className="article-header">
                    <span className="article-category">{blog.category}</span>
                    <h1 className="article-title">{blog.title}</h1>
                    <div className="article-meta">
                      <span>Written by: <strong>{blog.author}</strong></span>
                      <span>•</span>
                      <span>Released: <strong>{blog.date}</strong></span>
                      <span>•</span>
                      <span>Reading estimate: <strong>{blog.readTime}</strong></span>
                    </div>
                  </div>

                  <div className="article-lead">
                    <p className="first-paragraph-dropcap">{intro}</p>
                  </div>

                  <div className="article-split-row hero-split">
                    <div className="split-text-col">
                      {htmlMode ? (
                        <div
                          className="article-rich-content split-preview"
                          dangerouslySetInnerHTML={{
                            __html: stripFirstHtmlParagraph(blog.content) || blog.content,
                          }}
                        />
                      ) : bodyParagraphs.length > 0 ? (
                        <p className="split-body-text">{bodyParagraphs[0]}</p>
                      ) : (
                        <>
                          <div className="article-blockquote compact">
                            <span className="quote-mark">"</span>
                            <p>{FALLBACK_QUOTE}</p>
                          </div>
                          <p className="split-body-text">{FALLBACK_BODY}</p>
                        </>
                      )}
                    </div>
                    <figure className="split-media-col">
                      <img
                        src={coverImage}
                        alt={blog.title}
                        className="split-featured-img"
                      />
                    </figure>
                  </div>

                  {bodyParagraphs.slice(1).length > 0 && (
                    <div className="article-paragraph-wrapper">
                      {bodyParagraphs.slice(1).map((para, index) => (
                        <p key={index}>{para}</p>
                      ))}
                    </div>
                  )}

                  {(() => {
                    const mediaItems = getMediaItems(blog);
                    if (mediaItems.length === 0) return null;
                    const currentItem = mediaItems[activeMediaIndex];
                    return (
                      <div className="article-carousel-showcase">
                        <h4 className="media-section-title gallery-heading">Gallery &amp; Media</h4>
                        <div className="carousel-container">
                          <div className="carousel-viewport">
                            {currentItem.type === "video" ? (
                              <video
                                key={currentItem.src}
                                controls
                                className="carousel-active-slide-video"
                              >
                                <source src={currentItem.src} type="video/mp4" />
                                Your browser does not support the video tag.
                              </video>
                            ) : (
                              <img
                                src={currentItem.src}
                                alt={`${blog.title} gallery ${activeMediaIndex + 1}`}
                                className="carousel-active-slide-img"
                                onClick={() => window.open(currentItem.src, "_blank")}
                              />
                            )}
                            {currentItem.type === "video" && (
                              <div className="carousel-media-badge">Video</div>
                            )}
                          </div>

                          {mediaItems.length > 1 && (
                            <>
                              <button
                                type="button"
                                className="carousel-control-btn prev"
                                onClick={() => prevMedia(mediaItems.length)}
                                aria-label="Previous slide"
                              >
                                ‹
                              </button>
                              <button
                                type="button"
                                className="carousel-control-btn next"
                                onClick={() => nextMedia(mediaItems.length)}
                                aria-label="Next slide"
                              >
                                ›
                              </button>
                              <div className="carousel-dots-indicator">
                                {mediaItems.map((item, idx) => (
                                  <button
                                    key={idx}
                                    type="button"
                                    className={`carousel-dot-btn ${item.type === "video" ? "video-dot" : ""} ${activeMediaIndex === idx ? "active" : ""}`}
                                    onClick={() => setActiveMediaIndex(idx)}
                                    aria-label={`Go to ${item.type} ${idx + 1}`}
                                  />
                                ))}
                              </div>
                            </>
                          )}

                          <div className="carousel-counter">
                            {activeMediaIndex + 1} / {mediaItems.length}
                          </div>
                        </div>
                      </div>
                    );
                  })()}

                  <div className="article-interactions-section">
                    <div className="interactions-bar">
                      <div className="interactions-left">
                        <button
                          type="button"
                          className={`like-action-btn ${isLiked ? "liked" : ""}`}
                          onClick={handleLikeToggle}
                          disabled={loadingLikes}
                          aria-label={isLiked ? "Unlike article" : "Like article"}
                        >
                          <IconHeart filled={isLiked} />
                          <span className="likes-count-text">
                            {loadingLikes ? "..." : likesCount}
                          </span>
                        </button>

                        <button
                          type="button"
                          className={`comment-count-btn ${showCommentsPanel ? "active" : ""}`}
                          onClick={() => setShowCommentsPanel((prev) => !prev)}
                          aria-expanded={showCommentsPanel}
                          aria-label="Toggle comments"
                        >
                          <IconComment />
                          <span>{comments.length}</span>
                        </button>
                      </div>

                      <div className="share-interactive-trigger">
                        <button
                          type="button"
                          className="share-action-btn"
                          onClick={() => setShowSharePopup(!showSharePopup)}
                          aria-label="Share article"
                        >
                          <IconShare />
                          <span>Share</span>
                        </button>
                        {showSharePopup && (
                          <div className="share-glass-popup glass-panel">
                            <button type="button" className="share-popup-item" onClick={copyPageLink}>
                              <IconCopy /> {copiedLink ? "Link Copied!" : "Copy Link"}
                            </button>
                            <a href={`https://api.whatsapp.com/send?text=${encodeURIComponent("Read this beautiful wellness article on Diving Sanatan: " + window.location.href)}`} target="_blank" rel="noopener noreferrer" className="share-popup-item">
                              <IconComment /> WhatsApp
                            </a>
                            <a href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(window.location.href)}&text=${encodeURIComponent(blog.title)}`} target="_blank" rel="noopener noreferrer" className="share-popup-item">
                              <svg className="action-icon" width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" /></svg>
                              X / Twitter
                            </a>
                            <a href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.href)}`} target="_blank" rel="noopener noreferrer" className="share-popup-item">
                              <svg className="action-icon" width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" /></svg>
                              Facebook
                            </a>
                          </div>
                        )}
                      </div>
                    </div>

                    {showCommentsPanel && (
                      <div id="comments-section" className="comments-interactive-section">
                        <h4 className="media-section-title comments-heading">
                          <IconComment />
                          Reflections &amp; Conversation ({comments.length})
                        </h4>

                        <div className="comment-post-box">
                          {user ? (
                            <form onSubmit={handleCommentSubmit} className="comment-form">
                              <textarea
                                rows={3}
                                placeholder="Share your somatic insights or thoughts on this article..."
                                value={commentText}
                                onChange={(e) => setCommentText(e.target.value)}
                                className="comment-textarea"
                                required
                              />
                              <Button variant="gold" type="submit" disabled={postingComment}>
                                {postingComment ? "Posting reflection..." : "Publish Reflection"}
                              </Button>
                            </form>
                          ) : (
                            <div className="comment-login-promo">
                              <p>Somatic reflections are shared within our directory. Log in or sign up to leave a comment.</p>
                              <Button variant="gold-outline" onClick={() => setShowAuthModal(true)} className="btn-fit-center">
                                Log In / Sign Up to Comment
                              </Button>
                            </div>
                          )}
                        </div>

                        {loadingComments ? (
                          <p className="text-slate-italic-center">Unrolling reflections...</p>
                        ) : comments.length > 0 ? (
                          <div className="comments-list-container">
                            {comments.map((comm) => (
                              <div key={comm.id} className="single-comment-card">
                                <div className="comment-card-meta">
                                  <strong className="comment-author-name">{comm.userName}</strong>
                                  <span className="comment-timestamp">{formatCommentDate(comm.createdAt)}</span>
                                </div>
                                <p className="comment-text-content">{comm.commentText}</p>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="no-comments-fallback">No reflections yet. Be the first to share your thoughts!</p>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="article-footer-actions">
                    <Button variant="gold-outline" onClick={() => router.push("/blog")}>
                      ← Back to Listings
                    </Button>
                    <Button variant="gold" onClick={() => router.push(`/search?query=${encodeURIComponent(blog.category)}`)}>
                      Book Related Sessions
                    </Button>
                  </div>
                </Card>
              </>
            );
          })()}
        </article>
      )}

      {/* Auth Modal Overlay */}
      {showAuthModal && (
        <div className="auth-modal-overlay" onClick={() => { setShowAuthModal(false); setPendingActionAfterAuth(null); }}>
          <div className="auth-modal-card glass-panel" onClick={(e) => e.stopPropagation()}>
            <button type="button" className="close-modal-btn" onClick={() => { setShowAuthModal(false); setPendingActionAfterAuth(null); }}>×</button>

            <div className="modal-auth-tabs">
              <button
                type="button"
                className={`modal-auth-tab-btn ${modalAuthMode === "login" ? "active" : ""}`}
                onClick={() => { setModalAuthMode("login"); setModalAuthError(""); }}
              >
                Log In
              </button>
              <button
                type="button"
                className={`modal-auth-tab-btn ${modalAuthMode === "signup" ? "active" : ""}`}
                onClick={() => { setModalAuthMode("signup"); setModalAuthError(""); }}
              >
                Sign Up & Sync
              </button>
            </div>

            {modalAuthError && <div className="modal-alert error">{modalAuthError}</div>}
            {modalAuthSuccess && <div className="modal-alert success">{modalAuthSuccess}</div>}

            {modalAuthMode === "login" ? (
              <form onSubmit={handleModalLoginSubmit} className="modal-auth-form">
                <div className="modal-input-group">
                  <label>Email Address</label>
                  <input
                    type="email"
                    placeholder="you@example.com"
                    value={modalEmail}
                    onChange={(e) => setModalEmail(e.target.value)}
                    className="modal-glass-input"
                    required
                  />
                </div>
                <div className="modal-input-group">
                  <label>Password</label>
                  <input
                    type="password"
                    placeholder="••••••••"
                    value={modalPassword}
                    onChange={(e) => setModalPassword(e.target.value)}
                    className="modal-glass-input"
                    required
                  />
                </div>
                <Button variant="gold" type="submit" disabled={modalSubmitting} >
                  {modalSubmitting ? "Authenticating..." : "Log In & Continue"}
                </Button>
              </form>
            ) : (
              <form onSubmit={handleModalSignupSubmit} className="modal-auth-form signup">
                <div className="modal-input-group">
                  <label>Full Name</label>
                  <input
                    type="text"
                    placeholder="John Doe"
                    value={modalName}
                    onChange={(e) => setModalName(e.target.value)}
                    className="modal-glass-input"
                    required
                  />
                </div>
                <div className="modal-input-group">
                  <label>Email Address</label>
                  <input
                    type="email"
                    placeholder="you@example.com"
                    value={modalEmail}
                    onChange={(e) => setModalEmail(e.target.value)}
                    className="modal-glass-input"
                    required
                  />
                </div>
                <div className="modal-input-group">
                  <label>Phone / WhatsApp</label>
                  <input
                    type="tel"
                    placeholder="+91 XXXXX XXXXX"
                    value={modalPhone}
                    onChange={(e) => setModalPhone(e.target.value)}
                    className="modal-glass-input"
                    required
                  />
                </div>
                <div className="modal-form-row">
                  <div className="modal-input-group">
                    <label>Gender</label>
                    <select value={modalGender} onChange={(e) => setModalGender(e.target.value)} className="modal-glass-input">
                      <option value="Female">Female</option>
                      <option value="Male">Male</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  <div className="modal-input-group">
                    <label>Date of Birth</label>
                    <input
                      type="date"
                      value={modalDob}
                      onChange={(e) => setModalDob(e.target.value)}
                      className="modal-glass-input"
                      required
                    />
                  </div>
                </div>
                <div className="modal-input-group">
                  <label>Create Password</label>
                  <input
                    type="password"
                    placeholder="Min 6 characters"
                    value={modalPassword}
                    onChange={(e) => setModalPassword(e.target.value)}
                    className="modal-glass-input"
                    required
                  />
                </div>
                <Button variant="gold" type="submit" disabled={modalSubmitting} className="btn-mt-12-full">
                  {modalSubmitting ? "Creating & Syncing..." : "Sign Up & Sync Profile"}
                </Button>
              </form>
            )}
          </div>
        </div>
      )}

      <style jsx>{`
        .blog-detail-page {
          width: 100%;
          max-width: 920px;
          margin: 0 auto;
        }
        .article-breadcrumb {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 20px;
          font-size: 0.85rem;
        }
        .breadcrumb-link {
          background: none;
          border: none;
          color: #7c3aed;
          font-weight: 600;
          cursor: pointer;
          padding: 0;
          font-size: 0.85rem;
        }
        .breadcrumb-link:hover { text-decoration: underline; }
        .breadcrumb-sep { color: hsl(var(--text-muted)); }
        .breadcrumb-current {
          color: hsl(var(--text-muted));
          text-transform: capitalize;
        }
        .article-unified-card {
          padding: 36px 40px !important;
          border-radius: 24px !important;
        }
        .article-header {
          text-align: center;
          margin-bottom: 24px;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 12px;
          padding-bottom: 24px;
          border-bottom: 1px solid rgba(0, 0, 0, 0.06);
        }
        .article-category {
          background: rgba(16, 185, 129, 0.08);
          border: 1px solid rgba(16, 185, 129, 0.2);
          color: #065f46;
          font-size: 0.75rem;
          font-weight: 600;
          padding: 4px 10px;
          border-radius: 6px;
          text-transform: uppercase;
        }
        .article-title {
          font-size: 2.3rem;
          color: #4c1d95;
          line-height: 1.3;
          font-weight: 700;
        }
        .article-meta {
          display: flex;
          gap: 12px;
          font-size: 0.85rem;
          color: hsl(var(--text-muted));
          margin-top: 4px;
          flex-wrap: wrap;
          justify-content: center;
        }
        .article-lead {
          padding: 0 0 24px;
          margin-bottom: 24px;
          border-bottom: 1px solid rgba(0, 0, 0, 0.05);
        }
        .article-lead p {
          font-size: 1.18rem;
          line-height: 1.9;
          color: #334155;
          margin: 0;
        }
        .article-split-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 36px;
          align-items: center;
          margin-bottom: 36px;
        }
        .article-split-row.reversed .split-text-col { order: 2; }
        .article-split-row.reversed .split-media-col { order: 1; }
        .split-text-col {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        .split-body-text {
          font-size: 1.05rem;
          line-height: 1.85;
          color: hsl(var(--text-cream));
          margin: 0;
        }
        .split-media-col {
          margin: 0;
        }
        .split-featured-img {
          width: 100%;
          height: 300px;
          object-fit: cover;
          border-radius: 20px;
          border: 1px solid var(--gold-border);
          box-shadow: 0 12px 36px rgba(0, 0, 0, 0.07);
        }
        .hero-split {
          margin-bottom: 28px;
          padding-bottom: 28px;
          border-bottom: 1px solid rgba(0, 0, 0, 0.05);
        }
        .article-blockquote.compact {
          margin: 0 0 16px;
          padding: 16px 20px;
        }
        .split-preview :global(p) {
          margin: 0 0 12px;
        }
        .split-preview :global(p:last-child) {
          margin-bottom: 0;
        }
        .article-paragraph-wrapper {
          display: flex;
          flex-direction: column;
          gap: 20px;
          margin-bottom: 28px;
          padding-bottom: 28px;
          border-bottom: 1px solid rgba(0, 0, 0, 0.05);
        }
        /* Rich HTML content (from RTE) */
        .article-rich-content {
          font-size: 1.05rem;
          line-height: 1.85;
          color: hsl(var(--text-cream));
        }
        .article-rich-content p {
          margin: 0 0 16px;
          font-size: 1.05rem;
          line-height: 1.85;
          color: hsl(var(--text-cream));
        }
        .article-rich-content h2 {
          font-family: var(--font-serif);
          font-size: 1.55rem;
          font-weight: 700;
          color: #4c1d95;
          margin: 28px 0 12px;
          line-height: 1.3;
        }
        .article-rich-content h3 {
          font-size: 1.2rem;
          font-weight: 700;
          color: #5b21b6;
          margin: 22px 0 8px;
        }
        .article-rich-content blockquote {
          border-left: 3px solid #7c3aed;
          background: rgba(168, 85, 247, 0.04);
          padding: 16px 24px;
          border-radius: 0 16px 16px 0;
          margin: 20px 0;
          font-style: italic;
          color: #4c1d95;
          font-family: var(--font-serif);
          font-size: 1.08rem;
        }
        .article-rich-content ul {
          list-style: disc;
          padding-left: 28px;
          margin: 12px 0;
        }
        .article-rich-content ol {
          list-style: decimal;
          padding-left: 28px;
          margin: 12px 0;
        }
        .article-rich-content li {
          margin-bottom: 6px;
          font-size: 1.02rem;
          line-height: 1.7;
          color: hsl(var(--text-cream));
        }
        .article-rich-content a {
          color: #7c3aed;
          text-decoration: underline;
          transition: color 0.15s ease;
        }
        .article-rich-content a:hover { color: #5b21b6; }
        .article-rich-content b, .article-rich-content strong { font-weight: 700; }
        .article-rich-content i, .article-rich-content em { font-style: italic; }
        .article-rich-content u { text-decoration: underline; }
        .article-rich-content s { text-decoration: line-through; }
        .article-paragraph-wrapper p {
          font-size: 1.05rem;
          line-height: 1.8;
          color: hsl(var(--text-cream));
        }
        .first-paragraph-dropcap::first-letter {
          font-family: var(--font-serif);
          font-size: 3.5rem;
          float: left;
          line-height: 0.8;
          padding-right: 8px;
          padding-top: 4px;
          color: #7c3aed;
          font-weight: 700;
        }
        .article-blockquote {
          background: rgba(168, 85, 247, 0.04);
          border-left: 3px solid #7c3aed;
          padding: 24px;
          border-radius: 0 16px 16px 0;
          margin: 12px 0;
          position: relative;
        }
        .quote-mark {
          position: absolute;
          top: -10px;
          left: 10px;
          font-size: 4rem;
          font-family: var(--font-serif);
          color: rgba(168, 85, 247, 0.15);
          line-height: 1;
        }
        .article-blockquote p {
          font-family: var(--font-serif);
          font-style: italic;
          font-size: 1.15rem;
          color: #4c1d95 !important;
        }
        
        /* Interactive Actions Bar Styles */
        .article-interactions-section {
          margin-top: 8px;
          padding-top: 28px;
          border-top: 1px solid rgba(0, 0, 0, 0.06);
        }
        .interactions-bar {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 4px 0;
          margin-bottom: 0;
        }
        .interactions-left {
          display: flex;
          align-items: center;
          gap: 4px;
        }
        .likes-interactive-trigger, .share-interactive-trigger {
          position: relative;
        }
        .like-action-btn, .comment-count-btn, .share-action-btn {
          background: transparent;
          border: none;
          cursor: pointer;
          font-size: 0.88rem;
          font-weight: 600;
          color: #64748b;
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 8px 14px;
          border-radius: 999px;
          transition: all 0.2s ease;
        }
        .action-icon {
          flex-shrink: 0;
          display: block;
        }
        .like-action-btn:hover {
          background: rgba(239, 68, 68, 0.08);
          color: #dc2626;
        }
        .like-action-btn.liked {
          color: #dc2626;
          background: rgba(239, 68, 68, 0.06);
        }
        .like-action-btn.liked .action-icon {
          animation: beat 0.3s ease-in-out;
        }
        .comment-count-btn:hover,
        .comment-count-btn.active {
          background: rgba(124, 58, 237, 0.08);
          color: #7c3aed;
        }
        @keyframes beat {
          0% { transform: scale(1); }
          50% { transform: scale(1.2); }
          100% { transform: scale(1); }
        }
        .share-action-btn:hover {
          background: rgba(124, 58, 237, 0.08);
          color: #7c3aed;
        }
        .share-glass-popup {
          position: absolute;
          bottom: 125%;
          right: 0;
          width: 180px;
          display: flex;
          flex-direction: column;
          padding: 8px !important;
          border-radius: 12px !important;
          box-shadow: 0 10px 30px rgba(124, 58, 237, 0.08) !important;
          z-index: 50;
          background: rgba(255, 255, 255, 0.9) !important;
          animation: fadeSlideIn 0.2s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .share-popup-item {
          width: 100%;
          text-align: left;
          background: transparent;
          border: none;
          padding: 8px 12px;
          font-size: 0.85rem;
          font-weight: 600;
          color: #475569;
          cursor: pointer;
          border-radius: 8px;
          display: flex;
          align-items: center;
          gap: 10px;
          transition: all 0.15s ease;
        }
        .share-popup-item:hover {
          background: rgba(168, 85, 247, 0.06);
          color: #7c3aed;
        }

        /* Comments Subsection styles */
        .comments-interactive-section {
          display: flex;
          flex-direction: column;
          gap: 20px;
          margin-top: 20px;
          padding-top: 20px;
          border-top: 1px solid rgba(0, 0, 0, 0.06);
          animation: commentsSlideIn 0.25s ease-out;
        }
        @keyframes commentsSlideIn {
          from { opacity: 0; transform: translateY(-8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .comments-heading {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .comments-heading .action-icon {
          color: #7c3aed;
        }
        .comment-post-box {
          padding: 20px !important;
          border-radius: 16px !important;
          background: rgba(255, 255, 255, 0.6) !important;
          border-color: rgba(168, 85, 247, 0.08) !important;
        }
        .comment-form {
          display: flex;
          flex-direction: column;
        }
        .comment-textarea {
          width: 100%;
          padding: 12px 16px;
          border-radius: 12px;
          background: rgba(0, 0, 0, 0.02);
          border: 1px solid rgba(0, 0, 0, 0.06);
          font-family: var(--font-sans);
          font-size: 0.92rem;
          color: #1e293b;
          resize: vertical;
          outline: none;
          transition: var(--transition-fast);
        }
        .comment-textarea:focus {
          border-color: #a855f7;
          background: #ffffff;
          box-shadow: 0 0 12px rgba(168, 85, 247, 0.08);
        }
        .comment-login-promo {
          text-align: center;
          padding: 16px;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .comment-login-promo p {
          font-size: 0.88rem;
          color: #64748b;
          margin: 0 !important;
        }
        .comments-list-container {
          display: flex;
          flex-direction: column;
          gap: 16px;
          margin-top: 10px;
        }
        .single-comment-card {
          padding: 16px 20px !important;
          border-radius: 16px !important;
          background: rgba(255, 255, 255, 0.4) !important;
          border-color: rgba(0, 0, 0, 0.03) !important;
          box-shadow: 0 4px 15px rgba(0, 0, 0, 0.01) !important;
        }
        .comment-card-meta {
          display: flex;
          justify-content: space-between;
          margin-bottom: 8px;
          font-size: 0.82rem;
        }
        .comment-author-name {
          color: #1e1b4b;
          font-weight: 700;
        }
        .comment-timestamp {
          color: #94a3b8;
        }
        .comment-text-content {
          font-size: 0.92rem !important;
          line-height: 1.6 !important;
          color: #334155 !important;
          margin: 0 !important;
        }
        .no-comments-fallback {
          text-align: center;
          color: #94a3b8;
          font-style: italic;
          padding: 24px;
          font-size: 0.88rem;
        }

        /* Inline Auth Modal Overlay */
        .auth-modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(15, 12, 30, 0.4);
          backdrop-filter: blur(8px);
          z-index: 1000;
          display: flex;
          align-items: center;
          justify-content: center;
          animation: fadeIn 0.25s ease;
        }
        .auth-modal-card {
          width: 100%;
          max-width: 460px;
          padding: 32px !important;
          border-radius: 24px !important;
          background: rgba(255, 255, 255, 0.85) !important;
          border: 1px solid var(--gold-border) !important;
          box-shadow: 0 20px 60px rgba(124, 58, 237, 0.12) !important;
          position: relative;
          max-height: 90vh;
          overflow-y: auto;
          animation: scaleUp 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .close-modal-btn {
          position: absolute;
          top: 20px;
          right: 20px;
          background: transparent;
          border: none;
          font-size: 1.8rem;
          color: #94a3b8;
          cursor: pointer;
          line-height: 1;
          transition: all 0.2s ease;
        }
        .close-modal-btn:hover {
          color: #4c1d95;
        }
        .modal-auth-tabs {
          display: grid;
          grid-template-columns: 1fr 1fr;
          background: rgba(0, 0, 0, 0.03);
          border-radius: 12px;
          padding: 4px;
          margin-bottom: 24px;
        }
        .modal-auth-tab-btn {
          background: transparent;
          border: none;
          padding: 10px;
          font-size: 0.88rem;
          font-weight: 600;
          color: #64748b;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        .modal-auth-tab-btn.active {
          background: #ffffff;
          color: #7c3aed;
          box-shadow: 0 4px 10px rgba(124, 58, 237, 0.1);
        }
        .modal-auth-form {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        .modal-input-group {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        .modal-input-group label {
          font-size: 0.72rem;
          text-transform: uppercase;
          font-weight: 700;
          color: #475569;
          letter-spacing: 0.02em;
        }
        .modal-glass-input {
          width: 100%;
          padding: 10px 14px;
          border-radius: 10px;
          background: rgba(0, 0, 0, 0.02);
          border: 1px solid rgba(0, 0, 0, 0.06);
          font-family: var(--font-sans);
          font-size: 0.9rem;
          color: #1e293b;
          outline: none;
          transition: all 0.2s ease;
        }
        .modal-glass-input:focus {
          background: #ffffff;
          border-color: #a855f7;
          box-shadow: 0 0 8px rgba(168, 85, 247, 0.08);
        }
        .modal-form-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
        }
        .modal-alert {
          padding: 10px 14px;
          border-radius: 8px;
          font-size: 0.85rem;
          font-weight: 600;
          margin-bottom: 12px;
        }
        .modal-alert.error {
          background: rgba(239, 68, 68, 0.06);
          border: 1px solid rgba(239, 68, 68, 0.15);
          color: #b91c1c;
        }
        .modal-alert.success {
          background: rgba(34, 197, 94, 0.06);
          border: 1px solid rgba(34, 197, 94, 0.15);
          color: #15803d;
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        .article-footer-actions {
          display: flex;
          justify-content: space-between;
          border-top: 1px solid rgba(0,0,0,0.06);
          padding-top: 32px;
          margin-top: 40px;
        }
        @media (max-width: 768px) {
          .article-split-row {
            grid-template-columns: 1fr;
            gap: 20px;
          }
          .article-split-row.reversed .split-text-col,
          .article-split-row.reversed .split-media-col {
            order: unset;
          }
          .split-featured-img {
            height: 220px;
          }
          .article-lead {
            padding: 20px;
          }
        }
        @media (max-width: 640px) {
          .article-title {
            font-size: 1.8rem;
          }
          .article-meta {
            flex-direction: column;
            gap: 4px;
            align-items: center;
          }
          .article-meta span:nth-child(even) {
            display: none;
          }
          .article-unified-card {
            padding: 20px !important;
          }
          .article-body-card {
            padding: 20px !important;
          }
          .article-footer-actions {
            flex-direction: column;
            gap: 16px;
          }
          .article-footer-actions :global(button) {
            width: 100%;
          }
          .modal-form-row {
            grid-template-columns: 1fr;
            gap: 12px;
          }
        }

        /* Dynamic Carousel Showcase Styles */
        .media-section-title {
          font-family: var(--font-serif);
          font-size: 1.4rem;
          color: #4c1d95;
          margin: 32px 0 16px;
          border-bottom: 1.5px solid rgba(168, 85, 247, 0.15);
          padding-bottom: 8px;
          letter-spacing: 0.02em;
        }
        .article-carousel-showcase {
          margin: 8px 0 28px;
          padding-bottom: 28px;
          border-bottom: 1px solid rgba(0, 0, 0, 0.05);
        }
        .gallery-heading {
          margin-top: 0;
        }
        .carousel-container {
          position: relative;
          width: 100%;
          height: 440px;
          border-radius: 20px;
          overflow: hidden;
          padding: 0 !important;
          border: 1px solid var(--border-glass);
          box-shadow: 0 10px 30px rgba(0,0,0,0.04);
          background: rgba(255, 255, 255, 0.4);
        }
        .carousel-viewport {
          width: 100%;
          height: 100%;
          position: relative;
          overflow: hidden;
          background: #000;
        }
        .carousel-active-slide-img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
          cursor: pointer;
          transition: transform 0.6s cubic-bezier(0.16, 1, 0.3, 1), filter 0.3s;
        }
        .carousel-active-slide-img:hover {
          transform: scale(1.02);
          filter: brightness(0.96);
        }
        .carousel-control-btn {
          position: absolute;
          top: 50%;
          transform: translateY(-50%);
          width: 48px;
          height: 48px;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.7);
          backdrop-filter: blur(8px);
          border: 1px solid rgba(168, 85, 247, 0.2);
          color: #7c3aed;
          font-size: 2rem;
          font-weight: 300;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: var(--transition-fast);
          z-index: 10;
          line-height: 1;
        }
        .carousel-control-btn:hover {
          background: #7c3aed;
          color: #ffffff;
          border-color: #7c3aed;
          box-shadow: 0 4px 15px rgba(124, 58, 237, 0.25);
        }
        .carousel-control-btn.prev {
          left: 20px;
          padding-right: 2px;
        }
        .carousel-control-btn.next {
          right: 20px;
          padding-left: 2px;
        }
        .carousel-dots-indicator {
          position: absolute;
          bottom: 20px;
          left: 50%;
          transform: translateX(-50%);
          display: flex;
          gap: 10px;
          z-index: 10;
          background: rgba(0, 0, 0, 0.25);
          backdrop-filter: blur(4px);
          padding: 8px 16px;
          border-radius: 20px;
          border: 1.5px solid rgba(255, 255, 255, 0.15);
        }
        .carousel-dot-btn {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          border: none;
          background: rgba(255, 255, 255, 0.5);
          cursor: pointer;
          padding: 0;
          transition: var(--transition-fast);
        }
        .carousel-dot-btn:hover {
          background: rgba(255, 255, 255, 0.85);
        }
        .carousel-dot-btn.active {
          background: #7c3aed;
          transform: scale(1.3);
          box-shadow: 0 0 8px #7c3aed;
        }
        /* Unified carousel video slide */
        .carousel-active-slide-video {
          width: 100%;
          height: 100%;
          object-fit: contain;
          background: #000;
          display: block;
        }
        /* Media type badge inside viewport */
        .carousel-media-badge {
          position: absolute;
          top: 16px;
          left: 16px;
          background: rgba(0, 0, 0, 0.55);
          backdrop-filter: blur(6px);
          color: #fff;
          font-size: 0.75rem;
          font-weight: 700;
          padding: 5px 12px;
          border-radius: 20px;
          letter-spacing: 0.03em;
          z-index: 10;
          pointer-events: none;
        }
        /* Slide counter top-right */
        .carousel-counter {
          position: absolute;
          top: 16px;
          right: 16px;
          background: rgba(0, 0, 0, 0.45);
          backdrop-filter: blur(6px);
          color: rgba(255,255,255,0.9);
          font-size: 0.75rem;
          font-weight: 600;
          padding: 5px 12px;
          border-radius: 20px;
          z-index: 10;
          pointer-events: none;
          letter-spacing: 0.03em;
        }
        /* Video dot style */
        .carousel-dot-btn.video-dot {
          border-radius: 4px;
          width: 10px;
          height: 10px;
          background: rgba(255,255,255,0.55);
        }
        .carousel-dot-btn.video-dot.active {
          background: #f59e0b;
          box-shadow: 0 0 8px #f59e0b;
        }
      `}</style>
    </div>
  );
}
