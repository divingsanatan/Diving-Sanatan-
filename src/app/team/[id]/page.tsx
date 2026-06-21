"use client";

import React, { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Card } from "@/components/ui/Card";
import { formatCurrency } from "@/utils/formatters";

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


  // Services scroll ref
  const servicesScrollRef = useRef<HTMLDivElement>(null);

  // Certifications Modal Lightbox State
  const [activeCertUrl, setActiveCertUrl] = useState<string | null>(null);

  // Helper to generate dynamic title & description for certifications
  const getCertInfo = (url: string, index: number) => {
    if (url.includes("cert_1")) {
      return {
        title: "Certified Usui Reiki Master",
        description: "Accredited Reiki master certification in energetic realignment and chakra healing resonance."
      };
    }
    if (url.includes("cert_2")) {
      return {
        title: "Advanced Chakra Therapist",
        description: "Professional qualification in chakra energy balancing, aura diagnostics, and sound therapy."
      };
    }
    const fallbacks = [
      {
        title: "Certified Usui Reiki Master",
        description: "Accredited Reiki master certification in energetic realignment and chakra healing resonance."
      },
      {
        title: "Advanced Chakra Therapist",
        description: "Professional qualification in chakra energy balancing, aura diagnostics, and sound therapy."
      },
      {
        title: "Cosmic Consciousness Guide",
        description: "Specialized certification in past life regression, akashic records, and spiritual counseling."
      }
    ];
    return fallbacks[index % fallbacks.length];
  };

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

  // Services scroll handler
  const scrollServices = (direction: "left" | "right") => {
    if (servicesScrollRef.current) {
      const scrollAmount = 340;
      servicesScrollRef.current.scrollBy({
        left: direction === "left" ? -scrollAmount : scrollAmount,
        behavior: "smooth",
      });
    }
  };

  const selectSuggestion = (val: string) => {
    window.location.href = `/?search=${encodeURIComponent(val)}`;
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

  // Resolve service image mapping
  const getServiceImage = (imgName: string) => {
    const mappings: Record<string, string> = {
      "aura_balancing": "/images/service_chakra.png",
      "crystal_healing": "/images/service_regression.png",
      "chakra_clearing": "/images/service_akashic.png",
      "mindfulness_meditation": "/images/service_chakra.png",
      "anxiety_release": "/images/service_regression.png",
      "spiritual_counseling": "/images/service_akashic.png",
    };
    return mappings[imgName] || "/images/service_chakra.png";
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
      <div style={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>
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
      <div style={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>
        <Header />
        <main className="error-state-wrapper">
          <h2>⚠️ Registry Search Terminated</h2>
          <p>{error || "The requested practitioner profile was not found."}</p>
          <button 
            onClick={() => router.push("/team")} 
            style={{
              marginTop: "20px",
              backgroundColor: "#4c1d95",
              color: "white",
              padding: "12px 24px",
              borderRadius: "12px",
              fontWeight: 700,
              border: "none",
              cursor: "pointer",
              boxShadow: "0 4px 10px rgba(76,29,149,0.15)"
            }}
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
        
        {/* Breadcrumbs */}
        <div className="breadcrumbs-row">
          <Link href="/">Home</Link>
          <span className="breadcrumb-divider">/</span>
          <Link href="/team">Our Healers</Link>
          <span className="breadcrumb-divider">/</span>
          <span className="breadcrumb-active">{healer.name}</span>
        </div>

        <div className="about-grid" style={{ marginTop: "24px" }}>
          
          {/* ==================== LEFT COLUMN ==================== */}
          <div className="left-column">
            
            {/* Intro Grid: Card & Bio side-by-side */}
            <div className="intro-grid">
              
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
                          <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
                        </a>
                      )}
                      {healer.social_links.instagram && (
                        <a href={healer.social_links.instagram} target="_blank" rel="noopener noreferrer" className="social-icon" title="Instagram">
                          <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>
                        </a>
                      )}
                      {healer.social_links.linkedin && (
                        <a href={healer.social_links.linkedin} target="_blank" rel="noopener noreferrer" className="social-icon" title="LinkedIn">
                          <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.779-1.75-1.75s.784-1.75 1.75-1.75 1.75.779 1.75 1.75-.784 1.75-1.75 1.75zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/></svg>
                        </a>
                      )}
                      {healer.social_links.youtube && (
                        <a href={healer.social_links.youtube} target="_blank" rel="noopener noreferrer" className="social-icon" title="YouTube">
                          <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>
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
                      style={{
                        display: "block",
                        width: "100%",
                        textAlign: "center",
                        backgroundColor: "#4c1d95",
                        color: "white",
                        padding: "12px",
                        borderRadius: "12px",
                        fontWeight: 700,
                        fontSize: "0.85rem",
                        letterSpacing: "0.08em",
                        boxShadow: "0 4px 12px rgba(76, 29, 149, 0.15)",
                        textDecoration: "none",
                        cursor: "pointer",
                        transition: "all 0.2s ease"
                      }}
                    >
                      BOOK A SESSION
                    </Link>
                    <Link 
                      href="/?search=resonance" 
                      className="btn-quiz"
                      style={{
                        display: "block",
                        width: "100%",
                        textAlign: "center",
                        backgroundColor: "white",
                        color: "#4c1d95",
                        padding: "11px",
                        borderRadius: "12px",
                        fontWeight: 700,
                        fontSize: "0.85rem",
                        letterSpacing: "0.08em",
                        border: "1.5px solid #4c1d95",
                        textDecoration: "none",
                        cursor: "pointer",
                        transition: "all 0.2s ease"
                      }}
                    >
                      TAKE SOUL QUIZ
                    </Link>
                    <Link 
                      href="/team" 
                      style={{
                        display: "block",
                        width: "100%",
                        textAlign: "center",
                        color: "#7c3aed",
                        fontSize: "0.82rem",
                        fontWeight: 600,
                        marginTop: "8px",
                        textDecoration: "underline",
                        cursor: "pointer"
                      }}
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
                  {healer.bio.split("\n\n").map((para, idx) => (
                    <p key={idx}>{renderBioText(para)}</p>
                  ))}
                </div>

                {/* Video Playback Slot */}
                {healer.video_url && (() => {
                  const embedUrl = getEmbedUrl(healer.video_url);
                  return (
                    <div className="video-slot glass-panel" style={{ cursor: "default" }}>
                      {embedUrl ? (
                        <iframe 
                          width="100%" 
                          height="100%" 
                          src={embedUrl.replace("?autoplay=1", "")} 
                          title="Meet Healer - Video Introduction" 
                          frameBorder="0" 
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                          allowFullScreen
                          style={{ border: "none", width: "100%", height: "100%" }}
                        ></iframe>
                      ) : (
                        <video 
                          src={healer.video_url} 
                          controls 
                          style={{ width: "100%", height: "100%", objectFit: "contain", outline: "none", background: "black" }}
                        />
                      )}
                    </div>
                  );
                })()}
              </div>

            </div>

            {/* Curated Services Carousel */}
            <div className="curated-services-section">
              <div className="section-header-row">
                <h2 className="section-heading">Therapies Guided</h2>
                <div className="carousel-nav-arrows">
                  <button className="nav-arrow-btn" onClick={() => scrollServices("left")}>
                    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" width="20" height="20">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>
                  <button className="nav-arrow-btn" onClick={() => scrollServices("right")}>
                    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" width="20" height="20">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </div>
              </div>

              <div className="services-carousel-wrapper" ref={servicesScrollRef}>
                <div className="services-carousel-track">
                  {services.length > 0 ? (
                    services.map((srv) => (
                      <div key={srv.id} className="service-slide-card glass-card">
                        <div className="service-image-box">
                          <img src={getServiceImage(srv.image)} alt={srv.name} />
                        </div>
                        <div className="service-card-body">
                          <h3>{srv.name}</h3>
                          <p>{srv.description.length > 110 ? `${srv.description.substring(0, 110)}...` : srv.description}</p>
                          <Link href={`/booking?service=${srv.id}`} className="service-link">
                            Book Session ({formatCurrency(srv.price)}) →
                          </Link>
                        </div>
                      </div>
                    ))
                  ) : (
                    <Card variant="glass" style={{ padding: "20px", width: "300px", color: "hsl(var(--text-muted))" }}>
                      No active therapies listed under {healer.name}'s guidance.
                    </Card>
                  )}
                </div>
              </div>
            </div>

            {/* Google Ad Banner Space */}
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

          </div>

          {/* ==================== RIGHT COLUMN (SIDEBAR) ==================== */}
          <div className="right-column">
            
            {/* Insights & Guidance Section: Testimonials */}
            <div className="sidebar-section glass-panel">
              <h2 className="sidebar-heading">CLIENT TESTIMONIALS</h2>
              
              <div className="insights-list">
                {reviews.length > 0 ? (
                  reviews.slice(0, 4).map((rev) => (
                    <div key={rev.id} className="insight-card" style={{ flexDirection: "column", alignItems: "flex-start", gap: "6px" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", width: "100%", alignItems: "center" }}>
                        <span style={{ fontWeight: 700, color: "#4c1d95", fontSize: "0.92rem" }}>{rev.clientName}</span>
                        <span style={{ color: "#d4af37", fontSize: "0.75rem" }}>{"★".repeat(rev.rating)}</span>
                      </div>
                      {rev.serviceName && (
                        <span style={{
                          fontSize: "0.72rem",
                          background: "rgba(13, 148, 136, 0.08)",
                          color: "#0d9488",
                          padding: "2px 6px",
                          borderRadius: "4px",
                          fontWeight: 500
                        }}>{rev.serviceName}</span>
                      )}
                      <p style={{
                        fontSize: "0.82rem",
                        color: "hsl(var(--text-cream))",
                        lineHeight: 1.5,
                        fontStyle: "italic",
                        margin: "4px 0"
                      }}>"{rev.comment}"</p>
                      <span style={{ fontSize: "0.7rem", color: "hsl(var(--text-muted))" }}>
                        {new Date(rev.date).toLocaleDateString()}
                      </span>
                    </div>
                  ))
                ) : (
                  <p style={{ color: "hsl(var(--text-muted))", fontStyle: "italic" }}>No client testimonials recorded for {healer.name} yet.</p>
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

            {/* Certification Showcase */}
            <div className="sidebar-section glass-panel">
              <h2 className="sidebar-heading">CREDENTIALS SHOWCASE</h2>
              
              <div className="insights-list">
                {certificationsList.map((certUrl, idx) => {
                  const certInfo = getCertInfo(certUrl, idx);
                  return (
                    <div 
                      key={idx} 
                      className="insight-card" 
                      style={{ cursor: "pointer" }} 
                      onClick={() => setActiveCertUrl(certUrl)}
                    >
                      <div className="insight-img-wrapper" style={{ border: "1px solid rgba(168, 85, 247, 0.1)" }}>
                        <img src={certUrl} alt={certInfo.title} />
                      </div>
                      <div className="insight-content">
                        <h4 style={{
                          fontFamily: "var(--font-sans)",
                          fontSize: "0.95rem",
                          color: "#4c1d95",
                          fontWeight: 700,
                          lineHeight: 1.35
                        }}>{certInfo.title}</h4>
                        <p style={{
                          fontSize: "0.8rem",
                          color: "hsl(var(--text-muted))",
                          lineHeight: 1.4,
                          margin: "2px 0 0 0"
                        }}>{certInfo.description}</p>
                        <span className="insight-read-link" style={{ fontSize: "0.8rem", color: "#7c3aed", fontWeight: 600, marginTop: "4px" }}>
                          View Certificate →
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

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
              <div className="iframe-wrapper" style={{ display: "flex", justifyContent: "center", alignItems: "center", width: "100%", height: "100%", minHeight: "350px", background: "black" }}>
                {embedUrl ? (
                  <iframe 
                    width="100%" 
                    height="100%" 
                    src={embedUrl} 
                    title="Meet Healer - Video Introduction" 
                    frameBorder="0" 
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                    allowFullScreen
                    style={{ border: "none" }}
                  ></iframe>
                ) : (
                  <video 
                    src={healer.video_url} 
                    controls 
                    autoPlay 
                    style={{ width: "100%", maxHeight: "500px", borderRadius: "14px", objectFit: "contain", outline: "none" }}
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
          <div className="video-modal-content glass-panel" style={{ maxWidth: "600px" }} onClick={(e) => e.stopPropagation()}>
            <button className="close-modal-btn" onClick={() => setActiveCertUrl(null)}>×</button>
            <div style={{ width: "100%", borderRadius: "14px", overflow: "hidden", background: "white", padding: "10px", boxShadow: "inset 0 0 10px rgba(0,0,0,0.05)" }}>
              <img src={activeCertUrl} alt="Certification Certificate" style={{ width: "100%", height: "auto", display: "block", borderRadius: "8px" }} />
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

        .about-grid {
          display: grid;
          grid-template-columns: 1.8fr 1fr;
          gap: 40px;
          align-items: start;
        }

        /* ==================== COLUMN STRETCH BUG FIXES ==================== */
        .left-column {
          display: flex;
          flex-direction: column;
          gap: 50px;
          min-width: 0;
        }

        .right-column {
          display: flex;
          flex-direction: column;
          gap: 40px;
          min-width: 0;
        }

        .intro-grid {
          display: grid;
          grid-template-columns: 1fr 1.3fr;
          gap: 32px;
          align-items: stretch;
        }

        .intro-grid > div {
          min-width: 0;
        }

        /* Healer Profile Card */
        .anara-card {
          padding: 24px;
          display: flex;
          flex-direction: column;
          gap: 20px;
          border-radius: 24px;
          overflow: hidden;
          background: rgba(255, 255, 255, 0.8);
          border: 1px solid var(--gold-border);
          box-shadow: 0 8px 30px rgba(168, 85, 247, 0.04);
        }

        .anara-photo-wrapper {
          width: 100%;
          border-radius: 18px;
          overflow: hidden;
          aspect-ratio: 1 / 1.1;
          min-height: 250px;
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
          gap: 12px;
        }

        .anara-name {
          font-family: var(--font-serif);
          font-size: 1.6rem;
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
          gap: 10px;
          margin-top: 14px;
        }

        /* Bio and Video block */
        .bio-video-section {
          display: flex;
          flex-direction: column;
          gap: 24px;
          height: 100%;
        }

        .main-title {
          font-family: var(--font-serif);
          font-size: 2.6rem;
          color: #4c1d95;
          line-height: 1.15;
          margin-bottom: 4px;
        }

        .bio-paragraphs {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .bio-paragraphs p {
          font-size: 1.05rem;
          line-height: 1.75;
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
          margin-top: auto;
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

        /* Therapies Guided Carousel */
        .curated-services-section {
          display: flex;
          flex-direction: column;
          gap: 24px;
        }

        .section-header-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-bottom: 1.5px solid rgba(168, 85, 247, 0.1);
          padding-bottom: 12px;
        }

        .section-heading {
          font-family: var(--font-serif);
          font-size: 2rem;
          color: #4c1d95;
        }

        .carousel-nav-arrows {
          display: flex;
          gap: 12px;
        }

        .nav-arrow-btn {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          border: 1px solid rgba(168, 85, 247, 0.2);
          background: white;
          color: #4c1d95;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: var(--transition-fast);
          box-shadow: 0 2px 8px rgba(0,0,0,0.02);
        }

        .nav-arrow-btn:hover {
          background: #4c1d95;
          color: white;
          border-color: #4c1d95;
          transform: scale(1.05);
        }

        .services-carousel-wrapper {
          overflow-x: auto;
          scroll-behavior: smooth;
          padding: 8px 4px 20px;
          scrollbar-width: none;
        }

        .services-carousel-wrapper::-webkit-scrollbar {
          display: none;
        }

        .services-carousel-track {
          display: flex;
          gap: 24px;
          width: max-content;
        }

        .service-slide-card {
          width: 300px;
          flex-shrink: 0;
          display: flex;
          flex-direction: column;
          border-radius: 20px;
          overflow: hidden;
          background: rgba(255,255,255,0.85);
          box-shadow: 0 8px 24px rgba(0,0,0,0.015);
          border: 1px solid var(--border-glass);
          transition: var(--transition-smooth);
        }

        .service-slide-card:hover {
          transform: translateY(-4px);
          border-color: var(--gold-border);
          box-shadow: 0 12px 30px rgba(168,85,247,0.04), 0 0 20px rgba(168,85,247,0.05);
        }

        .service-image-box {
          width: 100%;
          height: 180px;
          overflow: hidden;
          position: relative;
        }

        .service-image-box img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          transition: var(--transition-smooth);
        }

        .service-slide-card:hover .service-image-box img {
          transform: scale(1.05);
        }

        .service-card-body {
          padding: 20px;
          display: flex;
          flex-direction: column;
          gap: 10px;
          flex-grow: 1;
        }

        .service-card-body h3 {
          font-family: var(--font-serif);
          font-size: 1.3rem;
          color: #4c1d95;
        }

        .service-card-body p {
          font-size: 0.88rem;
          line-height: 1.6;
          color: hsl(var(--text-muted));
          flex-grow: 1;
        }

        .service-link {
          font-family: var(--font-serif);
          font-size: 0.9rem;
          font-weight: 700;
          color: #7c3aed;
          text-decoration: none;
          display: inline-block;
          margin-top: 6px;
          transition: color 0.2s;
        }

        .service-link:hover {
          color: #d4af37;
        }

        /* Google Ad Banner */
        .google-ad-horizontal-wrapper {
          display: flex;
          flex-direction: column;
          gap: 6px;
          margin-top: 10px;
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
          padding: 24px;
          background: rgba(255, 255, 255, 0.7);
          border: 1px solid var(--gold-border);
          border-radius: 24px;
          box-shadow: 0 8px 30px rgba(0,0,0,0.015);
        }

        .sidebar-heading {
          font-family: var(--font-serif);
          font-size: 1.35rem;
          letter-spacing: 0.05em;
          color: #4c1d95;
          border-bottom: 1.5px solid rgba(168, 85, 247, 0.1);
          padding-bottom: 10px;
          margin-bottom: 20px;
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
          border-radius: 20px;
          padding: 28px 24px;
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
          border-radius: 16px;
          overflow: hidden;
          position: relative;
          aspect-ratio: 1.4 / 1;
          box-shadow: 0 4px 15px rgba(0,0,0,0.03);
          border: 1px solid rgba(168, 85, 247, 0.1);
        }

        .cert-img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .cert-title-overlay {
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          background: linear-gradient(to top, rgba(0,0,0,0.7) 0%, transparent 100%);
          padding: 12px 16px;
          color: white;
          font-size: 0.8rem;
          font-weight: 600;
          letter-spacing: 0.01em;
          text-align: center;
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
          .about-grid {
            grid-template-columns: 1fr;
            gap: 50px;
          }

          .right-column {
            gap: 32px;
          }
        }

        @media (max-width: 768px) {
          .about-layout-container {
            padding: 30px 16px 120px;
          }

          .intro-grid {
            grid-template-columns: 1fr;
            gap: 32px;
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
