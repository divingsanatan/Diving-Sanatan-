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
                {healer.video_url && (
                  <div className="video-slot glass-panel" onClick={() => setIsVideoOpen(true)}>
                    <img src="/images/anara_video.png" alt="Meet healer video preview" className="video-thumb" />
                    <div className="video-overlay">
                      <span className="video-title">Meet {healer.name.split(" ")[0]} | A Gentle Introduction to Healing</span>
                      <svg className="share-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor" width="20" height="20">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.684 10.748a3.001 3.001 0 110 2.504l5.244 3.032a3.001 3.001 0 11-.482 1.488l-5.245-3.033a3.001 3.001 0 110-3.483l5.245-3.033a3.001 3.001 0 11.482 1.487l-5.244 3.033z" />
                      </svg>
                    </div>
                    <div className="play-button-outer">
                      <div className="play-button-inner">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                          <polygon points="8 5 8 19 19 12 8 5" />
                        </svg>
                      </div>
                    </div>
                  </div>
                )}
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
      {isVideoOpen && healer.video_url && (
        <div className="video-modal-overlay" onClick={() => setIsVideoOpen(false)}>
          <div className="video-modal-content glass-panel" onClick={(e) => e.stopPropagation()}>
            <button className="close-modal-btn" onClick={() => setIsVideoOpen(false)}>×</button>
            <div className="iframe-wrapper">
              <iframe 
                width="100%" 
                height="100%" 
                src={healer.video_url.includes("embed") ? healer.video_url : "https://www.youtube.com/embed/77ZozI0rw7w?autoplay=1"} 
                title="Meet Healer - Video Introduction" 
                frameBorder="0" 
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                allowFullScreen
              ></iframe>
            </div>
          </div>
        </div>
      )}

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
