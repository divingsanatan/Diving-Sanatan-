"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Card } from "@/components/ui/Card";
import { ServicesCartCarousel } from "@/components/services/ServicesCartCarousel";

interface Practitioner {
  id: string;
  name: string;
  specialty: string;
  bio: string;
  rating: number;
  reviewsCount: number;
  image: string;
  video_url?: string;
  certifications?: string[];
  expertise?: string[];
  social_links?: {
    facebook?: string;
    instagram?: string;
    linkedin?: string;
    youtube?: string;
  };
}

interface Service {
  id: string;
  name: string;
  description: string;
  image: string;
  duration: string;
  price: number;
  practitioner: string;
}

interface Review {
  id: string;
  serviceName?: string;
  practitionerId?: string;
  practitionerName: string;
  clientName: string;
  rating: number;
  comment: string;
  date: string;
}

export default function HealerDetailPage() {
  const params = useParams();
  const router = useRouter();
  const healerId = params?.id as string;



  const [healer, setHealer] = useState<Practitioner | null>(null);
  const [isBioExpanded, setIsBioExpanded] = useState(false);
  console.log("HEALER DATA IN CLIENT:", healer);
  const [services, setServices] = useState<Service[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isVideoOpen, setIsVideoOpen] = useState(false);

  // Helper to resolve YouTube embed URL or direct video file URL
  const getEmbedUrl = (url: string) => {
    if (!url) return null;

    // Check if it is a direct video file
    const isVideoFile = url.match(/\.(mp4|webm|ogg|mov|mkv)($|\?)/i) || url.includes("/storage/v1/object/public/");
    if (isVideoFile) {
      return null;
    }

    // YouTube Shorts
    if (url.includes("youtube.com/shorts/")) {
      const parts = url.split("youtube.com/shorts/");
      const id = parts[1]?.split(/[?&]/)[0];
      if (id) {
        return `https://www.youtube.com/embed/${id}?autoplay=1`;
      }
    }

    // Regular YouTube
    const ytRegExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(ytRegExp);

    if (match && match[2].length === 11) {
      return `https://www.youtube.com/embed/${match[2]}?autoplay=1`;
    }

    if (url.includes("embed")) {
      return url;
    }

    return null;
  };


  // Certifications Modal Lightbox State
  const [activeCertUrl, setActiveCertUrl] = useState<string | null>(null);
  const [certActiveIndex, setCertActiveIndex] = useState(0);

  useEffect(() => {
    if (!healerId) return;

    async function loadHealerDetails() {
      try {
        setLoading(true);
        // 1. Fetch healer details by ID
        const hRes = await fetch(`/api/practitioners?id=${healerId}`);
        const hJson = await hRes.json();

        if (!hJson.success) {
          setError(hJson.error || "Healer details could not be retrieved.");
          setLoading(false);
          return;
        }

        const healerData = hJson.data as Practitioner;
        setHealer(healerData);

        // 2. Fetch all services and reviews
        const [servicesRes, reviewsRes] = await Promise.all([
          fetch("/api/services"),
          fetch("/api/reviews")
        ]);

        const sJson = await servicesRes.json();
        const rJson = await reviewsRes.json();

        if (sJson.success) {
          // Filter services led by this healer
          const filteredServices = sJson.data.filter((s: Service) =>
            s.practitioner.toLowerCase() === healerData.name.toLowerCase()
          );
          setServices(filteredServices);
        }

        if (rJson.success) {
          // Filter reviews mentioning this healer
          const filteredReviews = rJson.data.filter((r: Review) =>
            r.practitionerId === healerData.id || r.practitionerName.toLowerCase() === healerData.name.toLowerCase()
          );
          setReviews(filteredReviews);
        }

      } catch (err) {
        console.error(err);
        setError("An error occurred while loading this profile.");
      } finally {
        setLoading(false);
      }
    }

    loadHealerDetails();
  }, [healerId]);

  const selectSuggestion = (val: string) => {
    window.location.href = `/?search=${encodeURIComponent(val)}`;
  };

  // Helper to truncate bio text safely based on word count, preserving tag tokens starting with '/'
  const getTruncatedBio = (text: string, maxWords: number = 350) => {
    if (!text) return { text: "", isLong: false };

    const words = text.split(/(\s+)/); // split by whitespace but keep spaces so we can reconstruct

    // Count actual non-whitespace words
    let wordCount = 0;
    let cutIndex = -1;

    for (let i = 0; i < words.length; i++) {
      if (words[i].trim().length > 0) {
        wordCount++;
        if (wordCount === maxWords) {
          cutIndex = i;
          break;
        }
      }
    }

    // If the text has fewer or equal words than the limit, don't truncate
    if (wordCount < maxWords || cutIndex === -1) {
      return { text, isLong: false };
    }

    // Reconstruct the truncated text up to the cutIndex
    let truncated = words.slice(0, cutIndex + 1).join("").trim();

    if (truncated.endsWith(".")) {
      truncated = truncated.slice(0, -1);
    }

    return {
      text: truncated + "...",
      isLong: true
    };
  };

  // Helper to parse bio text and convert tokens starting with / into interactive tags
  const renderBioText = (text: string) => {
    if (!text) return null;
    const parts = text.split(/(\/[A-Za-z0-9\-]+)/g);
    return parts.map((part, index) => {
      if (part.startsWith("/")) {
        const cleanTag = part.replace("/", "").replace(/-/g, " ");
        return (
          <span
            key={index}
            className="highlight-text"
            onClick={() => selectSuggestion(cleanTag)}
          >
            {part}
          </span>
        );
      }
      return part;
    });
  };

  const getPractitionerImage = (img: string) => {
    if (!img) return "/images/anara.png";
    if (img.startsWith("http") || img.startsWith("/")) return img;
    const mappings: Record<string, string> = {
      "elara_vance": "/images/anara.png",
      "master_zephyr": "/images/anara.png",
      "celeste_thorne": "/images/anara.png",
    };
    return mappings[img] || "/images/anara.png";
  };

  if (loading) {
    return (
      <div className="page-shell">
        <Header />
        <main className="loading-state-wrapper">
          <div className="spinner"></div>
          <p>Aligning frequencies & opening practitioner bio...</p>
        </main>
        <Footer />
        <style jsx>{`
          .loading-state-wrapper {
            flex: 1;
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            gap: 16px;
            color: hsl(var(--text-muted));
            font-size: 1.1rem;
            min-height: 50vh;
          }
          .spinner {
            width: 40px;
            height: 40px;
            border: 3px solid rgba(168, 85, 247, 0.1);
            border-top-color: #7c3aed;
            border-radius: 50%;
            animation: spin 1s infinite linear;
          }
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  if (error || !healer) {
    return (
      <div className="page-shell">
        <Header />
        <main className="error-state-wrapper">
          <h2>⚠️ Registry Search Terminated</h2>
          <p>{error || "The requested practitioner profile was not found."}</p>
          <button
            onClick={() => router.push("/team")}
            className="error-return-btn"
          >
            Return to Team List
          </button>
        </main>
        <Footer />
        <style jsx>{`
          .error-state-wrapper {
            flex: 1;
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            gap: 12px;
            padding: 40px 24px;
            text-align: center;
            min-height: 50vh;
          }
          .error-state-wrapper h2 {
            font-family: var(--font-serif);
            color: #ef4444;
            font-size: 1.8rem;
          }
          .error-state-wrapper p {
            color: hsl(var(--text-muted));
          }
        `}</style>
      </div>
    );
  }

  const certificationsList = healer.certifications && healer.certifications.length > 0
    ? healer.certifications
    : ["/images/cert_2.png", "/images/cert_1.png"];

  return (
    <div className="about-page-wrapper">
      <Header />

      <main className="about-layout-container">

        {/* Top Profile Section: 3-Column Grid */}
        <div className="profile-top-grid">

          {/* Featured Healer Card */}
          <div className="anara-card glass-panel">
            <div className="anara-photo-wrapper">
              <img
                src={getPractitionerImage(healer.image)}
                alt={healer.name}
                className="anara-photo"
              />
            </div>

            <div className="anara-info">
              <h2 className="anara-name">{healer.name}</h2>
              <p className="anara-title">{healer.specialty}</p>

              <div className="anara-meta">
                <span className="meta-exp">Practicing Since 2010</span>
              </div>

              {healer.social_links && Object.values(healer.social_links).some(link => !!link) && (
                <div className="healer-socials">
                  {healer.social_links.facebook && (
                    <a href={healer.social_links.facebook} target="_blank" rel="noopener noreferrer" className="social-icon" title="Facebook">
                      <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" /></svg>
                    </a>
                  )}
                  {healer.social_links.instagram && (
                    <a href={healer.social_links.instagram} target="_blank" rel="noopener noreferrer" className="social-icon" title="Instagram">
                      <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" /></svg>
                    </a>
                  )}
                  {healer.social_links.linkedin && (
                    <a href={healer.social_links.linkedin} target="_blank" rel="noopener noreferrer" className="social-icon" title="LinkedIn">
                      <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.779-1.75-1.75s.784-1.75 1.75-1.75 1.75.779 1.75 1.75-.784 1.75-1.75 1.75zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" /></svg>
                    </a>
                  )}
                  {healer.social_links.youtube && (
                    <a href={healer.social_links.youtube} target="_blank" rel="noopener noreferrer" className="social-icon" title="YouTube">
                      <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" /></svg>
                    </a>
                  )}
                </div>
              )}

              <div className="tag-list">
                {healer.expertise && healer.expertise.length > 0 ? (
                  healer.expertise.map((exp, i) => (
                    <span key={i} className="tag-badge">/{exp}</span>
                  ))
                ) : (
                  <>
                    <span className="tag-badge">/Chakra-Healing</span>
                    <span className="tag-badge">/Reiki-Master</span>
                    <span className="tag-badge">/Past-Life</span>
                    <span className="tag-badge">/Sound-Therapy</span>
                    <span className="tag-badge">/Aura-Imaging</span>
                  </>
                )}
              </div>

              <div className="anara-actions">
                <Link
                  href={`/booking?practitioner=${healer.id}`}
                  className="btn-book"
                >
                  BOOK A SESSION
                </Link>
                <Link
                  href="/?search=resonance"
                  className="btn-quiz"
                >
                  TAKE SOUL QUIZ
                </Link>
                <Link
                  href="/team"
                  className="btn-back-list"
                >
                  Back to healer list
                </Link>
              </div>
            </div>
          </div>

          {/* Bio & Video Section */}
          <div className="bio-video-section">
            <h1 className="main-title gold-text-gradient">A Journey into Wholeness</h1>

            <div className="bio-paragraphs">
              {(() => {
                const { text: truncatedBioText, isLong: isBioLong } = getTruncatedBio(healer.bio);
                const bioToRender = (!isBioExpanded && isBioLong) ? truncatedBioText : healer.bio;
                const paragraphs = bioToRender.split("\n\n");

                return paragraphs.map((para, idx) => {
                  const isLast = idx === paragraphs.length - 1;
                  return (
                    <p key={idx}>
                      {renderBioText(para)}
                      {isLast && isBioLong && (
                        <button
                          onClick={() => setIsBioExpanded(!isBioExpanded)}
                          className="toggle-bio-btn"
                          aria-expanded={isBioExpanded}
                        >
                          {isBioExpanded ? "..less" : "..more"}
                        </button>
                      )}
                    </p>
                  );
                });
              })()}
            </div>

            {/* Video Playback Slot */}
            {healer.video_url && (() => {
              const embedUrl = getEmbedUrl(healer.video_url);
              return (
                <div className="video-slot glass-panel video-slot-embedded">
                  {embedUrl ? (
                    <iframe
                      width="100%"
                      height="100%"
                      src={embedUrl.replace("?autoplay=1", "")}
                      title="Meet Healer - Video Introduction"
                      frameBorder="0"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                      className="embed-iframe"
                    ></iframe>
                  ) : (
                    <video
                      src={healer.video_url}
                      controls
                      className="embed-video"
                    />
                  )}
                </div>
              );
            })()}
          </div>

          {/* ==================== RIGHT COLUMN (SIDEBAR) ==================== */}
          <div className="profile-sidebar-column">

            {/* Insights & Guidance Section: Testimonials */}
            <div className="sidebar-section glass-panel">
              <h2 className="sidebar-heading">CLIENT TESTIMONIALS</h2>

              <div className="insights-list">
                {reviews.length > 0 ? (
                  reviews.slice(0, 4).map((rev) => (
                    <div key={rev.id} className="insight-card testimonial-card">
                      <div className="testimonial-header">
                        <span className="testimonial-name">{rev.clientName}</span>
                        <span className="testimonial-stars">{"★".repeat(rev.rating)}</span>
                      </div>
                      {rev.serviceName && (
                        <span className="testimonial-service-tag">{rev.serviceName}</span>
                      )}
                      <p className="testimonial-comment">"{rev.comment}"</p>
                      <span className="testimonial-date">
                        {new Date(rev.date).toLocaleDateString()}
                      </span>
                    </div>
                  ))
                ) : (
                  <p className="text-muted-italic">No client testimonials recorded for {healer.name} yet.</p>
                )}
              </div>
            </div>

            {/* Google Ad Box Space */}
            <div className="google-ad-vertical-wrapper">
              <span className="ad-label">Ad by Google</span>
              <div className="google-ad-box">
                <div className="ad-box-content">
                  <div className="ad-box-logo">G</div>
                  <h5>Diving Sanatan Sessions</h5>
                  <p>Certified master therapists online. Book today.</p>
                  <Link href="/booking" className="ad-box-btn">Book Now</Link>
                </div>
              </div>
            </div>

            {/* Certification Showcase — image carousel only */}
            <div className="sidebar-section glass-panel sidebar-section-bottom">
              <h2 className="sidebar-heading">CREDENTIALS SHOWCASE</h2>

              <div className="cert-slider">
                {certificationsList.length > 1 && (
                  <button
                    type="button"
                    className="cert-nav-btn"
                    onClick={() =>
                      setCertActiveIndex((i) =>
                        i === 0 ? certificationsList.length - 1 : i - 1
                      )
                    }
                    aria-label="Previous certificate"
                  >
                    ‹
                  </button>
                )}

                <div
                  className="cert-frame cert-frame-clickable"
                  onClick={() => setActiveCertUrl(certificationsList[certActiveIndex])}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      setActiveCertUrl(certificationsList[certActiveIndex]);
                    }
                  }}
                  aria-label={`View certificate ${certActiveIndex + 1} of ${certificationsList.length}`}
                >
                  <img
                    src={certificationsList[certActiveIndex]}
                    alt={`Certificate ${certActiveIndex + 1}`}
                    className="cert-img"
                  />
                </div>

                {certificationsList.length > 1 && (
                  <button
                    type="button"
                    className="cert-nav-btn"
                    onClick={() =>
                      setCertActiveIndex((i) =>
                        i === certificationsList.length - 1 ? 0 : i + 1
                      )
                    }
                    aria-label="Next certificate"
                  >
                    ›
                  </button>
                )}
              </div>

              {certificationsList.length > 1 && (
                <div className="cert-dots">
                  {certificationsList.map((_, idx) => (
                    <button
                      key={idx}
                      type="button"
                      className={`cert-dot ${certActiveIndex === idx ? "active" : ""}`}
                      onClick={() => setCertActiveIndex(idx)}
                      aria-label={`Go to certificate ${idx + 1}`}
                    />
                  ))}
                </div>
              )}
            </div>

          </div>

        </div>

        <ServicesCartCarousel
          services={services}
          title="Add More Therapies to Cart"
          emptyMessage={healer ? `No active therapies listed under ${healer.name}'s guidance.` : "No therapies available."}
          className="curated-services-section"
        />

        {/* Google Ad Banner Space — Full Width */}
        <div className="google-ad-horizontal-wrapper">
          <span className="ad-label">Ad by Google</span>
          <div className="google-ad-banner">
            <div className="ad-logo">G</div>
            <div className="ad-text-content">
              <h4>Looking for Inner Peace?</h4>
              <p>Discover personalized healing sessions tailored specifically to your spiritual requirements.</p>
            </div>
            <Link href="/" className="ad-cta">Learn More</Link>
          </div>
        </div>
      </main>

      {/* Video Modal Overlay */}
      {isVideoOpen && healer.video_url && (() => {
        const embedUrl = getEmbedUrl(healer.video_url);
        return (
          <div className="video-modal-overlay" onClick={() => setIsVideoOpen(false)}>
            <div className="video-modal-content glass-panel" onClick={(e) => e.stopPropagation()}>
              <button className="close-modal-btn" onClick={() => setIsVideoOpen(false)}>×</button>
              <div className="iframe-wrapper iframe-wrapper-modal">
                {embedUrl ? (
                  <iframe
                    width="100%"
                    height="100%"
                    src={embedUrl}
                    title="Meet Healer - Video Introduction"
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    className="embed-iframe"
                  ></iframe>
                ) : (
                  <video
                    src={healer.video_url}
                    controls
                    autoPlay
                    className="embed-video-modal"
                  />
                )}
              </div>
            </div>
          </div>
        );
      })()}

      {/* Certification Image Modal Overlay */}
      {activeCertUrl && (
        <div className="video-modal-overlay" onClick={() => setActiveCertUrl(null)}>
          <div className="video-modal-content glass-panel cert-modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="close-modal-btn" onClick={() => setActiveCertUrl(null)}>×</button>
            <div className="cert-modal-frame">
              <img src={activeCertUrl} alt="Certification Certificate" className="cert-modal-image" />
            </div>
          </div>
        </div>
      )}

      <Footer />

      <style jsx>{`
        .about-page-wrapper {
          display: flex;
          flex-direction: column;
          min-height: 100vh;
          background: transparent;
        }

        .healer-socials {
          display: flex;
          gap: 10px;
          margin-top: 8px;
          margin-bottom: 4px;
        }

        .social-icon {
          color: #7c3aed;
          transition: all 0.2s ease;
          display: flex;
          align-items: center;
          background: rgba(124, 58, 237, 0.05);
          border: 1px solid rgba(124, 58, 237, 0.15);
          padding: 6px;
          border-radius: 50%;
        }

        .social-icon:hover {
          color: #d4af37;
          background: rgba(212, 175, 55, 0.08);
          border-color: rgba(212, 175, 55, 0.3);
          transform: translateY(-2px);
        }

        .about-layout-container {
          max-width: 1200px;
          margin: 0 auto;
          padding: 40px 24px 100px;
          width: 100%;
        }

        .breadcrumbs-row {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 0.85rem;
          color: hsl(var(--text-muted));
          font-weight: 500;
        }

        .breadcrumbs-row :global(a) {
          text-decoration: none;
          color: hsl(var(--text-muted));
          transition: var(--transition-fast);
        }

        .breadcrumbs-row :global(a):hover {
          color: #7c3aed;
        }

        .breadcrumb-divider {
          color: rgba(0, 0, 0, 0.1);
        }

        .breadcrumb-active {
          color: #4c1d95;
          font-weight: 600;
        }

        .profile-top-grid {
          display: grid;
          grid-template-columns: 1fr 1.25fr 1fr;
          gap: 24px;
          align-items: stretch;
        }

        .profile-sidebar-column {
          display: flex;
          flex-direction: column;
          gap: 20px;
          min-width: 0;
          height: 100%;
        }

        .intro-grid > div {
          min-width: 0;
        }

        /* Healer Profile Card */
        .anara-card {
          padding: 16px;
          display: flex;
          flex-direction: column;
          gap: 14px;
          height: 100%;
          border-radius: 20px;
          overflow: hidden;
          background: rgba(255, 255, 255, 0.8);
          border: 1px solid var(--gold-border);
          box-shadow: 0 8px 30px rgba(168, 85, 247, 0.04);
        }

        .anara-photo-wrapper {
          width: 100%;
          border-radius: 14px;
          overflow: hidden;
          aspect-ratio: 1 / 1;
          flex-shrink: 0;
          box-shadow: 0 4px 20px rgba(0,0,0,0.03);
          border: 1px solid rgba(168, 85, 247, 0.1);
          background: rgba(168, 85, 247, 0.03);
        }

        .anara-photo {
          width: 100%;
          height: 100%;
          object-fit: cover;
          transition: var(--transition-smooth);
        }

        .anara-card:hover .anara-photo {
          transform: scale(1.03);
        }

        .anara-info {
          display: flex;
          flex-direction: column;
          gap: 8px;
          flex: 1;
          min-height: 0;
        }

        .anara-name {
          font-family: var(--font-serif);
          font-size: 1.35rem;
          color: #4c1d95;
          line-height: 1.2;
          font-weight: 700;
        }

        .anara-title {
          font-size: 0.95rem;
          color: #0d9488;
          font-weight: 600;
          letter-spacing: 0.05em;
          text-transform: uppercase;
          margin-top: -4px;
        }

        .anara-meta {
          font-size: 0.85rem;
          color: hsl(var(--text-muted));
          font-weight: 500;
        }

        .tag-list {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          margin-top: 6px;
        }

        .tag-badge {
          background: rgba(168, 85, 247, 0.08);
          color: #6d28d9;
          font-size: 0.78rem;
          padding: 4px 10px;
          border-radius: 8px;
          font-weight: 600;
          letter-spacing: 0.02em;
          border: 1px solid rgba(168, 85, 247, 0.1);
        }

        .anara-actions {
          display: flex;
          flex-direction: column;
          gap: 8px;
          margin-top: auto;
          padding-top: 10px;
        }

        .anara-actions :global(a.btn-book) {
          display: block;
          width: 100%;
          text-align: center;
          background-color: #4c1d95;
          color: #ffffff !important;
          padding: 12px 16px;
          border-radius: 12px;
          font-weight: 700;
          font-size: 0.82rem;
          letter-spacing: 0.08em;
          box-shadow: 0 4px 14px rgba(76, 29, 149, 0.2);
          text-decoration: none !important;
          cursor: pointer;
          transition: all 0.2s ease;
          border: none;
        }

        .anara-actions :global(a.btn-book:hover) {
          background-color: #5b21b6;
          transform: translateY(-1px);
          box-shadow: 0 6px 18px rgba(76, 29, 149, 0.28);
        }

        .anara-actions :global(a.btn-quiz) {
          display: block;
          width: 100%;
          text-align: center;
          background-color: #ffffff;
          color: #4c1d95 !important;
          padding: 11px 16px;
          border-radius: 12px;
          font-weight: 700;
          font-size: 0.82rem;
          letter-spacing: 0.08em;
          border: 1.5px solid #4c1d95;
          text-decoration: none !important;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .anara-actions :global(a.btn-quiz:hover) {
          background-color: rgba(76, 29, 149, 0.06);
          border-color: #5b21b6;
          transform: translateY(-1px);
        }

        .anara-actions :global(a.btn-back-list) {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          width: 100%;
          color: #7c3aed !important;
          font-size: 0.8rem;
          font-weight: 600;
          margin-top: 4px;
          padding: 8px 0;
          text-decoration: none !important;
          cursor: pointer;
          transition: color 0.2s ease;
          opacity: 0.85;
        }

        .anara-actions :global(a.btn-back-list:hover) {
          color: #4c1d95 !important;
          opacity: 1;
        }

        .anara-actions :global(a.btn-back-list)::before {
          content: "←";
          font-size: 0.9rem;
        }

        .error-return-btn {
          margin-top: 20px;
          background-color: #4c1d95;
          color: white;
          padding: 12px 24px;
          border-radius: 12px;
          font-weight: 700;
          border: none;
          cursor: pointer;
          box-shadow: 0 4px 10px rgba(76, 29, 149, 0.15);
        }

        .video-slot-embedded {
          cursor: default;
          max-height: 220px;
          margin-top: auto;
        }

        .testimonial-card {
          flex-direction: column;
          align-items: flex-start;
          gap: 6px;
        }

        .testimonial-header {
          display: flex;
          justify-content: space-between;
          width: 100%;
          align-items: center;
        }

        .testimonial-name {
          font-weight: 700;
          color: #4c1d95;
          font-size: 0.92rem;
        }

        .testimonial-stars {
          color: #d4af37;
          font-size: 0.75rem;
        }

        .testimonial-service-tag {
          font-size: 0.72rem;
          background: rgba(13, 148, 136, 0.08);
          color: #0d9488;
          padding: 2px 6px;
          border-radius: 4px;
          font-weight: 500;
        }

        .testimonial-comment {
          font-size: 0.82rem;
          color: hsl(var(--text-cream));
          line-height: 1.5;
          font-style: italic;
          margin: 4px 0;
        }

        .testimonial-date {
          font-size: 0.7rem;
          color: hsl(var(--text-muted));
        }

        .sidebar-section-bottom {
          margin-top: auto;
        }

        .insight-card-clickable {
          cursor: pointer;
        }

        .insight-img-bordered {
          border: 1px solid rgba(168, 85, 247, 0.1);
        }

        .insight-cert-title {
          font-family: var(--font-sans);
          font-size: 0.95rem;
          color: #4c1d95;
          font-weight: 700;
          line-height: 1.35;
        }

        .insight-cert-desc {
          font-size: 0.8rem;
          color: hsl(var(--text-muted));
          line-height: 1.4;
          margin: 2px 0 0 0;
        }

        .insight-read-link-styled {
          font-size: 0.8rem;
          color: #7c3aed;
          font-weight: 600;
          margin-top: 4px;
        }

        .iframe-wrapper-modal {
          display: flex;
          justify-content: center;
          align-items: center;
          width: 100%;
          height: 100%;
          min-height: 350px;
          background: black;
        }

        .cert-modal-content {
          max-width: 600px;
        }

        .cert-modal-frame {
          width: 100%;
          border-radius: 14px;
          overflow: hidden;
          background: white;
          padding: 10px;
          box-shadow: inset 0 0 10px rgba(0, 0, 0, 0.05);
        }

        .cert-modal-image {
          width: 100%;
          height: auto;
          display: block;
          border-radius: 8px;
        }

        /* Bio and Video block */
        .bio-video-section {
          display: flex;
          flex-direction: column;
          gap: 10px;
          height: 100%;
          min-height: 0;
        }

        .main-title {
          font-family: var(--font-serif);
          font-size: 2.1rem;
          color: #4c1d95;
          line-height: 1.15;
          margin-bottom: 4px;
        }

        .bio-paragraphs {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .bio-paragraphs p {
          font-size: 0.95rem;
          line-height: 1.65;
          color: hsl(var(--text-cream));
        }

        .highlight-text {
          color: #7c3aed;
          font-weight: 600;
          cursor: pointer;
          border-bottom: 1.5px dashed rgba(124, 58, 237, 0.4);
          padding: 0 2px;
          transition: var(--transition-fast);
        }

        .highlight-text:hover {
          color: #d4af37;
          border-bottom-color: rgba(212, 175, 55, 0.8);
          background: rgba(124, 58, 237, 0.03);
        }

        .toggle-bio-btn {
          background: none;
          border: none;
          color: #7c3aed;
          font-weight: 700;
          cursor: pointer;
          padding: 0;
          margin-left: 6px;
          font-size: 0.95rem;
          text-decoration: underline;
          display: inline;
          transition: var(--transition-fast);
        }

        .toggle-bio-btn:hover {
          color: #d4af37;
        }

        /* Video slot styling */
        .video-slot {
          position: relative;
          width: 100%;
          border-radius: 20px;
          overflow: hidden;
          aspect-ratio: 16 / 9;
          cursor: pointer;
          border: 1px solid var(--gold-border);
          box-shadow: 0 8px 30px rgba(0,0,0,0.03);
          transition: var(--transition-smooth);
          margin-top: 4px;
        }

        .video-slot:hover {
          transform: translateY(-2px);
          box-shadow: 0 12px 40px rgba(168,85,247,0.08);
          border-color: rgba(168, 85, 247, 0.4);
        }

        .video-thumb {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .video-overlay {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          padding: 16px 20px;
          background: linear-gradient(to bottom, rgba(0,0,0,0.6) 0%, transparent 100%);
          display: flex;
          justify-content: space-between;
          align-items: center;
          color: white;
          z-index: 2;
        }

        .video-title {
          font-weight: 600;
          font-size: 0.95rem;
          letter-spacing: 0.02em;
        }

        .share-icon {
          cursor: pointer;
          opacity: 0.85;
          transition: opacity 0.2s;
        }

        .share-icon:hover {
          opacity: 1;
        }

        .play-button-outer {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 68px;
          height: 68px;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.25);
          backdrop-filter: blur(8px);
          display: flex;
          align-items: center;
          justify-content: center;
          transition: var(--transition-smooth);
          box-shadow: 0 0 30px rgba(0,0,0,0.1);
          border: 1px solid rgba(255,255,255,0.4);
          z-index: 2;
        }

        .play-button-inner {
          width: 50px;
          height: 50px;
          border-radius: 50%;
          background: white;
          color: #4c1d95;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: var(--transition-smooth);
          padding-left: 3px;
        }

        .video-slot:hover .play-button-outer {
          transform: translate(-50%, -50%) scale(1.1);
          background: rgba(255, 255, 255, 0.4);
        }

        .video-slot:hover .play-button-inner {
          color: #db2777;
          box-shadow: 0 0 15px rgba(219,39,119,0.3);
        }

        /* Therapies carousel section */
        :global(.curated-services-section) {
          margin-top: 60px;
        }

        /* Google Ad Banner */
        .google-ad-horizontal-wrapper {
          display: flex;
          flex-direction: column;
          gap: 6px;
          margin-top: 50px;
        }

        .ad-label {
          font-size: 0.72rem;
          text-transform: uppercase;
          color: hsl(var(--text-muted));
          letter-spacing: 0.05em;
          font-weight: 600;
        }

        .google-ad-banner {
          display: flex;
          align-items: center;
          gap: 20px;
          background: rgba(240, 240, 240, 0.45);
          border: 1px dashed rgba(0, 0, 0, 0.12);
          border-radius: 16px;
          padding: 16px 24px;
          position: relative;
        }

        .ad-logo {
          width: 38px;
          height: 38px;
          border-radius: 8px;
          background: #4285f4;
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 800;
          font-size: 1.25rem;
          box-shadow: 0 2px 8px rgba(66, 133, 244, 0.3);
        }

        .ad-text-content {
          flex-grow: 1;
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .ad-text-content h4 {
          font-family: var(--font-sans);
          font-size: 0.95rem;
          color: #334155;
          font-weight: 700;
        }

        .ad-text-content p {
          font-size: 0.82rem;
          color: #64748b;
          line-height: 1.4;
        }

        .ad-cta {
          background: white;
          border: 1px solid rgba(0,0,0,0.1);
          color: #334155 !important;
          padding: 8px 16px;
          border-radius: 10px;
          font-size: 0.8rem;
          font-weight: 700;
          box-shadow: 0 2px 6px rgba(0,0,0,0.02);
          transition: var(--transition-fast);
        }

        .ad-cta:hover {
          background: #f8fafc;
          border-color: rgba(0,0,0,0.18);
        }

        /* ==================== RIGHT COLUMN (SIDEBAR) ==================== */
        .sidebar-section {
          padding: 16px;
          background: rgba(255, 255, 255, 0.7);
          border: 1px solid var(--gold-border);
          border-radius: 18px;
          box-shadow: 0 8px 30px rgba(0,0,0,0.015);
        }

        .sidebar-heading {
          font-family: var(--font-serif);
          font-size: 1.1rem;
          letter-spacing: 0.05em;
          color: #4c1d95;
          border-bottom: 1.5px solid rgba(168, 85, 247, 0.1);
          padding-bottom: 8px;
          margin-bottom: 14px;
          font-weight: 700;
        }

        /* Testimonials List */
        .insights-list {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .insight-card {
          display: flex;
          gap: 16px;
          align-items: center;
          padding-bottom: 16px;
          border-bottom: 1px solid rgba(0,0,0,0.04);
        }

        .insight-img-wrapper {
          width: 70px;
          height: 70px;
          border-radius: 12px;
          overflow: hidden;
          flex-shrink: 0;
          position: relative;
        }

        .insight-img-wrapper img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .insight-card:last-child {
          border-bottom: none;
          padding-bottom: 0;
        }

        /* Google Ad Box */
        .google-ad-vertical-wrapper {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .google-ad-box {
          background: rgba(240, 240, 240, 0.45);
          border: 1px dashed rgba(0, 0, 0, 0.12);
          border-radius: 16px;
          padding: 16px 14px;
          text-align: center;
        }

        .ad-box-content {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 12px;
        }

        .ad-box-logo {
          width: 32px;
          height: 32px;
          border-radius: 6px;
          background: #4285f4;
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 800;
          font-size: 1.1rem;
        }

        .ad-box-content h5 {
          font-family: var(--font-sans);
          font-size: 0.95rem;
          color: #334155;
          font-weight: 700;
        }

        .ad-box-content p {
          font-size: 0.8rem;
          color: #64748b;
          line-height: 1.4;
          max-width: 200px;
        }

        .ad-box-btn {
          background: #334155;
          color: white !important;
          font-size: 0.78rem;
          font-weight: 700;
          padding: 8px 20px;
          border-radius: 8px;
          letter-spacing: 0.03em;
          transition: background 0.2s;
        }

        .ad-box-btn:hover {
          background: #1e293b;
        }

        /* Certification Showcase Slider */
        .cert-slider {
          display: flex;
          align-items: center;
          gap: 12px;
          position: relative;
        }

        .cert-frame {
          flex-grow: 1;
          border-radius: 12px;
          overflow: hidden;
          position: relative;
          aspect-ratio: 1.5 / 1;
          max-height: 130px;
          box-shadow: 0 4px 15px rgba(0,0,0,0.03);
          border: 1px solid rgba(168, 85, 247, 0.1);
          background: rgba(168, 85, 247, 0.03);
        }

        .cert-frame-clickable {
          cursor: pointer;
          transition: var(--transition-fast);
        }

        .cert-frame-clickable:hover {
          border-color: rgba(168, 85, 247, 0.35);
          box-shadow: 0 6px 20px rgba(124, 58, 237, 0.1);
        }

        .cert-img {
          width: 100%;
          height: 100%;
          object-fit: contain;
          display: block;
        }

        .cert-nav-btn {
          width: 28px;
          height: 28px;
          border-radius: 50%;
          background: white;
          color: #4c1d95;
          border: 1px solid rgba(168, 85, 247, 0.15);
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          font-size: 0.7rem;
          box-shadow: 0 2px 6px rgba(0,0,0,0.03);
          transition: var(--transition-fast);
        }

        .cert-nav-btn:hover {
          background: #4c1d95;
          color: white;
          border-color: #4c1d95;
        }

        .cert-dots {
          display: flex;
          justify-content: center;
          gap: 6px;
          margin-top: 14px;
        }

        .cert-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: rgba(168, 85, 247, 0.2);
          cursor: pointer;
          transition: var(--transition-fast);
          border: none;
          padding: 0;
        }

        .cert-dot.active {
          background: #4c1d95;
          width: 16px;
          border-radius: 4px;
        }

        /* Video Modal overlay */
        .video-modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(76, 29, 149, 0.15);
          backdrop-filter: blur(10px);
          z-index: 1000;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 24px;
        }

        .video-modal-content {
          width: 100%;
          max-width: 900px;
          background: rgba(255, 255, 255, 0.9);
          border: 1px solid var(--gold-border);
          border-radius: 24px;
          padding: 20px;
          position: relative;
          box-shadow: 0 20px 50px rgba(0,0,0,0.15);
        }

        .close-modal-btn {
          position: absolute;
          top: -16px;
          right: -16px;
          width: 36px;
          height: 36px;
          border-radius: 50%;
          background: #4c1d95;
          color: white;
          border: none;
          font-size: 1.5rem;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          box-shadow: 0 4px 10px rgba(0,0,0,0.1);
          transition: background 0.2s;
          z-index: 10;
        }

        .close-modal-btn:hover {
          background: #db2777;
        }

        .iframe-wrapper {
          width: 100%;
          aspect-ratio: 16 / 9;
          border-radius: 14px;
          overflow: hidden;
          background: black;
          box-shadow: inset 0 0 20px rgba(0,0,0,0.8);
        }

        /* ==================== RESPONSIVE MEDIA QUERIES ==================== */
        @media (max-width: 1024px) {
          .profile-top-grid {
            grid-template-columns: 1fr;
            gap: 40px;
          }

          .profile-sidebar-column {
            gap: 32px;
          }

          .video-slot {
            margin-top: 16px !important;
          }

          .sidebar-section {
            margin-top: 0 !important;
          }
        }

        @media (max-width: 768px) {
          .about-layout-container {
            padding: 30px 16px 120px;
          }

          .main-title {
            font-size: 2.2rem;
            text-align: center;
          }

          .bio-paragraphs p {
            text-align: center;
          }

          .anara-card {
            max-width: 420px;
            margin: 0 auto;
          }

          .google-ad-banner {
            flex-direction: column;
            text-align: center;
            padding: 20px;
          }

          .ad-cta {
            width: 100%;
            text-align: center;
          }
        }
      `}</style>
    </div>
  );
}
