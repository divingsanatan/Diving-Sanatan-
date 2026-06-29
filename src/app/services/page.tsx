"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { formatCurrency } from "@/utils/formatters";
import { Service, Category, Review } from "@/types/database";
import {
  Search,
  Grid,
  Flower,
  Sparkles,
  Compass,
  Heart,
  Volume2,
  Flame,
  Leaf,
  Shield,
  User,
  ChevronLeft,
  ChevronRight,
  Clock,
  CheckCircle,
  Calendar,
  MessageSquare,
  Moon,
  Brain,
  Star,
  ArrowRight
} from "lucide-react";

// Map database image references to new high-fidelity generated mockup assets
const getServiceImage = (imgName: string) => {
  if (!imgName) return "/images/service_chakra_healing.png";
  if (imgName.startsWith("http") || imgName.startsWith("/")) return imgName;
  const mappings: Record<string, string> = {
    chakra_healing: "/images/service_chakra_healing.png",
    aura_scanning: "/images/service_aura_scanning.png",
    reiki_healing: "/images/service_reiki_healing.png",
    sound_healing: "/images/service_sound_healing.png",
    personal_guidance: "/images/service_personal_guidance.png",
    meditation_program: "/images/service_meditation_program.png",
    full_moon_program: "/images/service_full_moon_program.png",
    manifestation_program: "/images/service_manifestation_program.png",
    // Fallback mappings for dynamic entries
    chakra_program: "/images/service_chakra_healing.png",
    aura_balancing: "/images/service_aura_scanning.png",
    chakra_clearing: "/images/service_chakra_healing.png",
    crystal_healing: "/images/service_reiki_healing.png",
    free_energy_session: "/images/service_aura_scanning.png",
    mindfulness_meditation: "/images/service_meditation_program.png",
    spiritual_counseling: "/images/service_personal_guidance.png",
    anxiety_release: "/images/service_reiki_healing.png"
  };
  return mappings[imgName] || "/images/service_chakra_healing.png";
};

// Exact order from the mockup
const categoryOrder = [
  "Chakra Healing",
  "Aura & Energy",
  "Meditation & Mindfulness",
  "Reiki Healing",
  "Sound Healing",
  "Manifestation",
  "Spiritual Growth",
  "Sacred Rituals",
  "Holistic Wellness",
  "Personal Guidance"
];

// Mockup featured services order
const featuredOrder = [
  "Chakra Healing",
  "Aura Scanning",
  "Reiki Healing",
  "Sound Healing",
  "Personal Guidance"
];

// Mockup healing programs order
const programsOrder = [
  "7 Chakra Balancing Program",
  "21 Days Meditation Program",
  "Full Moon Healing Program",
  "Manifestation Mastery"
];

export default function ServicesPage() {
  const router = useRouter();

  // Database States
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [categories, setCategories] = useState<Category[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [cartSelections, setCartSelections] = useState<Service[]>([]);

  // UI Interactive States
  const [activeTestimonial, setActiveTestimonial] = useState(0);
  const [featuredIndex, setFeaturedIndex] = useState(0);
  const [visibleCount, setVisibleCount] = useState(5); // Default to 5 visible slides for desktop

  // Handle responsive visibleCount dynamically
  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      if (width <= 600) {
        setVisibleCount(1);
      } else if (width <= 900) {
        setVisibleCount(2);
      } else if (width <= 1200) {
        setVisibleCount(3);
      } else {
        setVisibleCount(5);
      }
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Load database entities
  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const [catRes, servRes, revRes] = await Promise.all([
          fetch("/api/categories"),
          fetch("/api/services"),
          fetch("/api/reviews")
        ]);

        const catJson = await catRes.json();
        const servJson = await servRes.json();
        const revJson = await revRes.json();

        if (catJson.success) setCategories(catJson.data);
        if (servJson.success) setServices(servJson.data);
        if (revJson.success) setReviews(revJson.data);
      } catch (err) {
        console.error("Failed to load services data:", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  // Load cart selections from localStorage
  useEffect(() => {
    try {
      const stored = window.localStorage.getItem("divingsanatan_selections");
      if (stored) {
        setCartSelections(JSON.parse(stored));
      }
    } catch (e) {
      console.warn("Could not read selections", e);
    }
  }, []);

  // Sync cart helper
  const toggleCartSelection = (srv: Service) => {
    let next: Service[];
    if (cartSelections.some(s => s.id === srv.id)) {
      next = cartSelections.filter(s => s.id !== srv.id);
    } else {
      next = [...cartSelections, srv];
    }
    setCartSelections(next);
    window.localStorage.setItem("divingsanatan_selections", JSON.stringify(next));
  };

  const clearSelections = () => {
    setCartSelections([]);
    window.localStorage.removeItem("divingsanatan_selections");
  };

  const handleCheckout = () => {
    if (cartSelections.length === 0) return;
    router.push("/checkout");
  };

  const totalSelectionsCost = cartSelections.reduce((s, x) => s + x.price, 0);

  // Dynamic testimonial auto-rotation
  useEffect(() => {
    if (reviews.length <= 1) return;
    const timer = setInterval(() => {
      setActiveTestimonial(prev => (prev + 1) % Math.min(reviews.length, 4));
    }, 6000);
    return () => clearInterval(timer);
  }, [reviews]);

  // Categories mapping to icons
  const getCategoryIcon = (catName: string) => {
    if (!catName) return <Sparkles size={16} strokeWidth={1.5} />;
    const name = catName.toLowerCase();
    if (name.includes("chakra")) return <Flower size={16} strokeWidth={1.5} />;
    if (name.includes("aura") || name.includes("energy")) return <Sparkles size={16} strokeWidth={1.5} />;
    if (name.includes("meditation") || name.includes("mindfulness")) return <Compass size={16} strokeWidth={1.5} />;
    if (name.includes("reiki")) return <Heart size={16} strokeWidth={1.5} />;
    if (name.includes("sound")) return <Volume2 size={16} strokeWidth={1.5} />;
    if (name.includes("manifest")) return <Flame size={16} strokeWidth={1.5} />;
    if (name.includes("growth") || name.includes("spiritual")) return <Leaf size={16} strokeWidth={1.5} />;
    if (name.includes("ritual")) return <Flame size={16} strokeWidth={1.5} />;
    if (name.includes("holistic") || name.includes("wellness")) return <Shield size={16} strokeWidth={1.5} />;
    if (name.includes("guidance") || name.includes("personal")) return <User size={16} strokeWidth={1.5} />;
    return <Sparkles size={16} strokeWidth={1.5} />;
  };

  // Sort Categories according to categoryOrder
  const sortedCategories = useMemo(() => {
    return [...categories].sort((a, b) => {
      const nameA = a.name || "";
      const nameB = b.name || "";
      const idxA = categoryOrder.indexOf(nameA);
      const idxB = categoryOrder.indexOf(nameB);
      if (idxA === -1 && idxB === -1) return nameA.localeCompare(nameB);
      if (idxA === -1) return 1;
      if (idxB === -1) return -1;
      return idxA - idxB;
    });
  }, [categories]);

  // Filter logic
  const filteredServices = useMemo(() => {
    let list = [...services];

    // Filter by category
    if (selectedCategory !== "all") {
      list = list.filter(s =>
        s.categories?.some(c => c?.toLowerCase() === selectedCategory.toLowerCase()) ||
        s.category?.toLowerCase() === selectedCategory.toLowerCase()
      );
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(s =>
        s.name?.toLowerCase().includes(q) ||
        s.description?.toLowerCase().includes(q) ||
        s.categories?.some(c => c?.toLowerCase().includes(q))
      );
    }

    return list;
  }, [services, selectedCategory, searchQuery]);

  // Split into Featured Services & Healing Programs, sorted to match mockup
  const featuredServices = useMemo(() => {
    const list = filteredServices.filter(
      s => !s.duration?.includes("Sessions") && !s.duration?.includes("Days")
    );
    return list.sort((a, b) => {
      const nameA = a.name || "";
      const nameB = b.name || "";
      const idxA = featuredOrder.indexOf(nameA);
      const idxB = featuredOrder.indexOf(nameB);
      if (idxA === -1 && idxB === -1) return nameA.localeCompare(nameB);
      if (idxA === -1) return 1;
      if (idxB === -1) return -1;
      return idxA - idxB;
    });
  }, [filteredServices]);

  const healingPrograms = useMemo(() => {
    const list = filteredServices.filter(
      s => s.duration?.includes("Sessions") || s.duration?.includes("Days") || s.name?.includes("Program") || s.name?.includes("Mastery")
    );
    return list.sort((a, b) => {
      const nameA = a.name || "";
      const nameB = b.name || "";
      const idxA = programsOrder.indexOf(nameA);
      const idxB = programsOrder.indexOf(nameB);
      if (idxA === -1 && idxB === -1) return nameA.localeCompare(nameB);
      if (idxA === -1) return 1;
      if (idxB === -1) return -1;
      return idxA - idxB;
    });
  }, [filteredServices]);

  // Maximum scrollable index for featured services carousel
  const maxFeaturedIndex = useMemo(() => {
    return Math.max(featuredServices.length - visibleCount, 0);
  }, [featuredServices.length, visibleCount]);

  // Auto-reset index if bounds shrink
  useEffect(() => {
    if (featuredIndex > maxFeaturedIndex) {
      setFeaturedIndex(maxFeaturedIndex);
    }
  }, [featuredIndex, maxFeaturedIndex]);

  // Featured Carousel Navigation
  const handlePrevFeatured = () => {
    setFeaturedIndex(prev => Math.max(prev - 1, 0));
  };

  const handleNextFeatured = () => {
    setFeaturedIndex(prev => Math.min(prev + 1, maxFeaturedIndex));
  };

  // Static benefits with icons
  const benefits = [
    { title: "Emotional Balance", icon: <Heart size={18} strokeWidth={1.5} className="icon-purple" /> },
    { title: "Energy Healing", icon: <Sparkles size={18} strokeWidth={1.5} className="icon-purple" /> },
    { title: "Stress Relief", icon: <Shield size={18} strokeWidth={1.5} className="icon-purple" /> },
    { title: "Mental Clarity", icon: <Brain size={18} strokeWidth={1.5} className="icon-purple" /> },
    { title: "Better Sleep", icon: <Moon size={18} strokeWidth={1.5} className="icon-purple" /> },
    { title: "Spiritual Growth", icon: <Leaf size={18} strokeWidth={1.5} className="icon-purple" /> }
  ];

  // Testimonials rotation
  const currentTestimonial = useMemo(() => {
    if (reviews.length > 0) {
      return reviews[activeTestimonial % reviews.length];
    }
    // Fallback testimonial
    return {
      clientName: "Ananya S.",
      comment: "The chakra healing session was life-changing. I feel more balanced, positive, and connected than ever.",
      rating: 5,
      serviceName: "Chakra Healing"
    };
  }, [reviews, activeTestimonial]);

  return (
    <div className={`page-shell ${cartSelections.length > 0 ? "page-shell--cart-pad" : ""}`}>
      <Header />

      <main className="services-main-container">
        <div className="services-grid-layout">
          
          {/* ================= LEFT SIDEBAR ================= */}
          <aside className="left-sidebar">
            {/* Search Input Box */}
            <div className="sidebar-group">
              <div className="sidebar-title-row title-small">
                <svg viewBox="0 0 100 100" className="sidebar-lotus-icon">
                  <path d="M50 25 C45 45 35 60 50 80 C65 60 55 45 50 25 Z" fill="none" stroke="#a855f7" strokeWidth="4" />
                  <path d="M50 80 C35 75 25 60 20 40 C35 50 45 60 50 80 Z" fill="none" stroke="#a855f7" strokeWidth="4" />
                  <path d="M50 80 C65 75 75 60 80 40 C65 50 55 60 50 80 Z" fill="none" stroke="#a855f7" strokeWidth="4" />
                  <path d="M50 80 C30 80 10 70 5 55 C20 65 35 70 50 80 Z" fill="none" stroke="#a855f7" strokeWidth="4" />
                  <path d="M50 80 C70 80 90 70 95 55 C80 65 65 70 50 80 Z" fill="none" stroke="#a855f7" strokeWidth="4" />
                </svg>
                <h4 className="sidebar-heading-small">Explore Services</h4>
              </div>
              <div className="search-input-field">
                <input
                  type="text"
                  placeholder="Search services, healings..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="search-field-control"
                />
                <Search size={14} className="search-field-icon" />
              </div>
            </div>

            {/* Category Filter list (Scrollable) */}
            <div className="categories-list-card">
              <button
                className={`category-item-btn ${selectedCategory === "all" ? "active" : ""}`}
                onClick={() => { setSelectedCategory("all"); setFeaturedIndex(0); }}
              >
                <Grid size={16} strokeWidth={1.5} />
                <span>All Services</span>
              </button>
              {sortedCategories.map((cat) => (
                <button
                  key={cat.id}
                  className={`category-item-btn ${selectedCategory.toLowerCase() === (cat.name || "").toLowerCase() ? "active" : ""}`}
                  onClick={() => { setSelectedCategory(cat.name || ""); setFeaturedIndex(0); }}
                >
                  {getCategoryIcon(cat.name || "")}
                  <span>{cat.name}</span>
                </button>
              ))}
            </div>

            {/* Why Choose Us */}
            <div className="why-choose-card">
              <h4 className="sidebar-heading">Why Choose Our Services?</h4>
              <div className="reasons-stack">
                <div className="reason-item">
                  <div className="reason-icon-wrapper">
                    <Heart size={16} strokeWidth={1.5} />
                  </div>
                  <div className="reason-text">
                    <h5>Authentic & Ancient Practices</h5>
                    <p>Rooted in ancient wisdom and modern healing.</p>
                  </div>
                </div>
                <div className="reason-item">
                  <div className="reason-icon-wrapper">
                    <User size={16} strokeWidth={1.5} />
                  </div>
                  <div className="reason-text">
                    <h5>Experienced Practitioners</h5>
                    <p>Learn from verified and compassionate experts.</p>
                  </div>
                </div>
                <div className="reason-item">
                  <div className="reason-icon-wrapper">
                    <Compass size={16} strokeWidth={1.5} />
                  </div>
                  <div className="reason-text">
                    <h5>Personalized Approach</h5>
                    <p>Tailored guidance for your unique journey.</p>
                  </div>
                </div>
                <div className="reason-item">
                  <div className="reason-icon-wrapper">
                    <Shield size={16} strokeWidth={1.5} />
                  </div>
                  <div className="reason-text">
                    <h5>Safe & Supportive Space</h5>
                    <p>Your healing and privacy are our priority.</p>
                  </div>
                </div>
              </div>

              {/* Elegant Lotus outline graphic */}
              <div className="lotus-graphic-wrapper">
                <svg viewBox="0 0 100 100" className="lotus-icon-line">
                  <path d="M50 15 C40 32 20 45 50 85 C80 45 60 32 50 15 Z" fill="none" stroke="#7c3aed" strokeWidth="1" strokeOpacity="0.25" />
                  <path d="M50 35 C30 45 10 55 50 85 C90 55 70 45 50 35 Z" fill="none" stroke="#7c3aed" strokeWidth="1" strokeOpacity="0.25" />
                  <path d="M50 50 C38 55 25 65 50 85 C75 65 62 55 50 50 Z" fill="none" stroke="#7c3aed" strokeWidth="1" strokeOpacity="0.25" />
                </svg>
              </div>
            </div>
          </aside>

          {/* ================= CENTER COLUMN ================= */}
          <section className="center-content">
            {/* Header Banner */}
            <div className="hero-banner-panel">
              <div className="banner-content">
                <span className="banner-lbl">OUR SERVICES</span>
                <h1 className="banner-title">Holistic Healing for<br />Mind, Body & Soul</h1>
                <p className="banner-desc">
                  Explore our range of ancient and modern healing modalities designed to restore balance, clarity, and inner peace in your life.
                </p>
                <div className="banner-btn-row">
                  <button
                    onClick={() => router.push("/booking")}
                    className="banner-cta"
                  >
                    Book a Consultation
                  </button>
                </div>
              </div>
              
              {/* Background lotus outlines */}
              <div className="banner-lotus-watermark">
                <svg viewBox="0 0 100 100" className="banner-watermark-svg">
                  <path d="M50 25 C45 45 35 60 50 80 C65 60 55 45 50 25 Z" fill="none" stroke="#a855f7" strokeWidth="2.5" strokeOpacity="0.4" />
                  <path d="M50 80 C35 75 25 60 20 40 C35 50 45 60 50 80 Z" fill="none" stroke="#a855f7" strokeWidth="2.5" strokeOpacity="0.4" />
                  <path d="M50 80 C65 75 75 60 80 40 C65 50 55 60 50 80 Z" fill="none" stroke="#a855f7" strokeWidth="2.5" strokeOpacity="0.4" />
                  <path d="M50 80 C30 80 10 70 5 55 C20 65 35 70 50 80 Z" fill="none" stroke="#a855f7" strokeWidth="2.5" strokeOpacity="0.4" />
                  <path d="M50 80 C70 80 90 70 95 55 C80 65 65 70 50 80 Z" fill="none" stroke="#a855f7" strokeWidth="2.5" strokeOpacity="0.4" />
                </svg>
              </div>
              <div className="banner-image" />
            </div>

            {/* Featured Services */}
            <div className="section-block">
              <div className="section-header">
                <div className="featured-heading-row">
                  <svg viewBox="0 0 100 100" className="featured-heading-lotus">
                    <path d="M50 25 C45 45 35 60 50 80 C65 60 55 45 50 25 Z" fill="none" stroke="#a855f7" strokeWidth="4" />
                    <path d="M50 80 C35 75 25 60 20 40 C35 50 45 60 50 80 Z" fill="none" stroke="#a855f7" strokeWidth="4" />
                    <path d="M50 80 C65 75 75 60 80 40 C65 50 55 60 50 80 Z" fill="none" stroke="#a855f7" strokeWidth="4" />
                    <path d="M50 80 C30 80 10 70 5 55 C20 65 35 70 50 80 Z" fill="none" stroke="#a855f7" strokeWidth="4" />
                    <path d="M50 80 C70 80 90 70 95 55 C80 65 65 70 50 80 Z" fill="none" stroke="#a855f7" strokeWidth="4" />
                  </svg>
                  <h3 className="section-title">Our Featured Services</h3>
                </div>
              </div>

              {featuredServices.length === 0 ? (
                <div className="empty-catalog-card glass-panel">
                  No featured services found matching the criteria.
                </div>
              ) : (
                <div className="carousel-container-relative">
                  {maxFeaturedIndex > 0 && (
                    <button
                      onClick={handlePrevFeatured}
                      disabled={featuredIndex === 0}
                      className="arrow-nav-btn absolute-left"
                      aria-label="Previous service"
                    >
                      <ChevronLeft size={16} />
                    </button>
                  )}

                  <div className="carousel-viewport">
                    <div
                      className="carousel-track"
                      style={{
                        transform: `translateX(-${featuredIndex * (100 / visibleCount)}%)`,
                        transition: "transform 0.5s cubic-bezier(0.16, 1, 0.3, 1)",
                        display: "flex",
                        width: "100%"
                      }}
                    >
                      {featuredServices.map((srv) => (
                        <div
                          key={srv.id}
                          className="carousel-slide-item"
                          style={{
                            flex: `0 0 ${100 / visibleCount}%`,
                            width: `${100 / visibleCount}%`,
                            boxSizing: "border-box",
                            padding: "0 8px"
                          }}
                        >
                          <div className="featured-item-card">
                            <div className="featured-card-media-wrapper">
                              <img
                                src={getServiceImage(srv.image)}
                                alt={srv.name}
                                className="featured-media-img"
                              />
                            </div>
                            <div className="featured-card-body">
                              <h4 className="featured-card-title">{srv.name}</h4>
                              <p className="featured-card-desc">{srv.description}</p>
                              <button
                                className="learn-more-link"
                                onClick={() => router.push(`/services/${srv.id}`)}
                              >
                                Learn More <ArrowRight size={14} className="arrow-icon" />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {maxFeaturedIndex > 0 && (
                    <button
                      onClick={handleNextFeatured}
                      disabled={featuredIndex >= maxFeaturedIndex}
                      className="arrow-nav-btn absolute-right"
                      aria-label="Next service"
                    >
                      <ChevronRight size={16} />
                    </button>
                  )}
                </div>
              )}

              {/* Slider pagination dots for slides slider controls */}
              {maxFeaturedIndex > 0 && (
                <div className="carousel-dots">
                  {Array.from({ length: maxFeaturedIndex + 1 }).map((_, idx) => (
                    <button
                      key={idx}
                      className={`carousel-dot ${featuredIndex === idx ? "active" : ""}`}
                      onClick={() => setFeaturedIndex(idx)}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Healing Programs */}
            <div className="section-block">
              <div className="featured-heading-row">
                <svg viewBox="0 0 100 100" className="featured-heading-lotus">
                  <path d="M50 25 C45 38 30 48 50 80 C70 48 55 38 50 25 Z" fill="none" stroke="#7c3aed" strokeWidth="1.5" strokeOpacity="0.75" />
                  <path d="M50 45 C38 52 25 60 50 80 C75 60 62 52 50 45 Z" fill="none" stroke="#7c3aed" strokeWidth="1.5" strokeOpacity="0.75" />
                </svg>
                <h3 className="section-title">Healing Programs</h3>
              </div>

              {healingPrograms.length === 0 ? (
                <div className="empty-catalog-card glass-panel">
                  No healing programs found matching the criteria.
                </div>
              ) : (
                <div className="programs-grid">
                  {healingPrograms.map((prg) => {
                    const isNew = (prg.name || "").includes("Full Moon") || (prg.name || "").includes("Manifestation");
                    const isPopular = (prg.name || "").includes("Chakra") || (prg.name || "").includes("Meditation");

                    return (
                      <div key={prg.id} className="program-item-card">
                        {isPopular && <span className="prog-badge badge-popular">Popular</span>}
                        {isNew && <span className="prog-badge badge-new">New</span>}
                        
                        <div className="program-media">
                          <img
                            src={getServiceImage(prg.image)}
                            alt={prg.name}
                            className="program-media-img"
                          />
                        </div>
                        <div className="program-body">
                          <h4 className="program-title">{prg.name}</h4>
                          <p className="program-desc">{prg.description}</p>
                          <div className="program-details-row">
                            <span className="details-item">⏱️ {prg.duration}</span>
                            <span className="dot-divider">•</span>
                            <span className="details-item">🌐 Online</span>
                          </div>
                          <button
                            className="view-details-link"
                            onClick={() => router.push(`/services/${prg.id}`)}
                          >
                            View Details <ArrowRight size={14} className="arrow-icon" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* How It Works */}
            <div className="section-block">
              <div className="featured-heading-row centered">
                <svg viewBox="0 0 100 100" className="featured-heading-lotus">
                  <path d="M50 25 C45 38 30 48 50 80 C70 48 55 38 50 25 Z" fill="none" stroke="#7c3aed" strokeWidth="1.5" strokeOpacity="0.75" />
                  <path d="M50 45 C38 52 25 60 50 80 C75 60 62 52 50 45 Z" fill="none" stroke="#7c3aed" strokeWidth="1.5" strokeOpacity="0.75" />
                </svg>
                <h3 className="section-title">How It Works</h3>
              </div>
              <div className="how-it-works-flow">
                <div className="flow-step">
                  <div className="flow-icon-wrapper">
                    <User size={18} strokeWidth={1.5} />
                  </div>
                  <h5>1. Choose a Service</h5>
                  <p>Explore and select the service that resonates with you.</p>
                </div>
                
                <div className="flow-arrow">
                  <ChevronRight size={16} strokeWidth={1.5} />
                </div>

                <div className="flow-step">
                  <div className="flow-icon-wrapper">
                    <Calendar size={18} strokeWidth={1.5} />
                  </div>
                  <h5>2. Book a Session</h5>
                  <p>Pick a convenient time and book your session online.</p>
                </div>

                <div className="flow-arrow">
                  <ChevronRight size={16} strokeWidth={1.5} />
                </div>

                <div className="flow-step">
                  <div className="flow-icon-wrapper">
                    <MessageSquare size={18} strokeWidth={1.5} />
                  </div>
                  <h5>3. Connect & Heal</h5>
                  <p>Connect with our expert and begin your healing journey.</p>
                </div>

                <div className="flow-arrow">
                  <ChevronRight size={16} strokeWidth={1.5} />
                </div>

                <div className="flow-step">
                  <div className="flow-icon-wrapper">
                    <Sparkles size={18} strokeWidth={1.5} />
                  </div>
                  <h5>4. Transform & Grow</h5>
                  <p>Integrate the experience and embrace your transformation.</p>
                </div>
              </div>
            </div>
          </section>

          {/* ================= RIGHT SIDEBAR ================= */}
          <aside className="right-sidebar">
            {/* Benefits list */}
            <div className="benefits-card glass-panel">
              <div className="sidebar-title-row">
                <svg viewBox="0 0 100 100" className="sidebar-lotus-icon">
                  <path d="M50 25 C45 45 35 60 50 80 C65 60 55 45 50 25 Z" fill="none" stroke="#a855f7" strokeWidth="4" />
                  <path d="M50 80 C35 75 25 60 20 40 C35 50 45 60 50 80 Z" fill="none" stroke="#a855f7" strokeWidth="4" />
                  <path d="M50 80 C65 75 75 60 80 40 C65 50 55 60 50 80 Z" fill="none" stroke="#a855f7" strokeWidth="4" />
                  <path d="M50 80 C30 80 10 70 5 55 C20 65 35 70 50 80 Z" fill="none" stroke="#a855f7" strokeWidth="4" />
                  <path d="M50 80 C70 80 90 70 95 55 C80 65 65 70 50 80 Z" fill="none" stroke="#a855f7" strokeWidth="4" />
                </svg>
                <h4 className="sidebar-heading">Benefits of Our Services</h4>
              </div>
              <div className="benefits-grid">
                {benefits.map((b, idx) => (
                  <div key={idx} className="benefit-item">
                    <div className="benefit-icon">{b.icon}</div>
                    <h5>{b.title}</h5>
                  </div>
                ))}
              </div>
              <button
                onClick={() => router.push("/about")}
                className="explore-benefits-btn"
              >
                Explore All Benefits
              </button>
            </div>

            {/* Testimonials rotation */}
            <div className="testimonial-card glass-panel">
              <div className="sidebar-title-row">
                <svg viewBox="0 0 100 100" className="sidebar-lotus-icon">
                  <path d="M50 25 C45 45 35 60 50 80 C65 60 55 45 50 25 Z" fill="none" stroke="#a855f7" strokeWidth="4" />
                  <path d="M50 80 C35 75 25 60 20 40 C35 50 45 60 50 80 Z" fill="none" stroke="#a855f7" strokeWidth="4" />
                  <path d="M50 80 C65 75 75 60 80 40 C65 50 55 60 50 80 Z" fill="none" stroke="#a855f7" strokeWidth="4" />
                  <path d="M50 80 C30 80 10 70 5 55 C20 65 35 70 50 80 Z" fill="none" stroke="#a855f7" strokeWidth="4" />
                  <path d="M50 80 C70 80 90 70 95 55 C80 65 65 70 50 80 Z" fill="none" stroke="#a855f7" strokeWidth="4" />
                </svg>
                <h4 className="sidebar-heading">What Our Clients Say</h4>
              </div>
              <div className="testimonial-box">
                <span className="quote-mark">“</span>
                <p className="testimonial-comment">
                  {currentTestimonial.comment}
                </p>
                <div className="testimonial-author-row">
                  <img
                    src="/images/anara.png"
                    alt={currentTestimonial.clientName}
                    className="client-avatar"
                  />
                  <div className="author-details">
                    <h5>{currentTestimonial.clientName}</h5>
                    <span>Mumbai</span>
                  </div>
                </div>
              </div>
              {reviews.length > 1 && (
                <div className="testimonial-dots">
                  {reviews.slice(0, 4).map((_, idx) => (
                    <button
                      key={idx}
                      className={`testimonial-dot ${activeTestimonial % reviews.length === idx ? "active" : ""}`}
                      onClick={() => setActiveTestimonial(idx)}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Ready to Begin Callout */}
            <div className="callout-cta-card">
              <div className="callout-content">
                <h4>Ready to Begin Your Healing Journey?</h4>
                <p>Our healers are here to support you every step of the way.</p>
                <button
                  onClick={() => router.push("/booking")}
                  className="callout-consult-btn"
                >
                  Book a Consultation
                </button>
                <span className="or-divider">or</span>
                <div className="callout-chat-row">
                  <MessageSquare size={14} strokeWidth={1.5} />
                  <a href="/contact" className="chat-link">Chat with our team</a>
                </div>
              </div>
              {/* Subtle outline lotus in bottom right */}
              <svg viewBox="0 0 100 100" className="callout-lotus-bg">
                <path d="M50 20 C42 35 25 45 50 80 C75 45 58 35 50 20 Z" fill="none" stroke="#ffffff" strokeWidth="1" strokeOpacity="0.12" />
                <path d="M50 40 C35 50 20 58 50 80 C80 58 65 50 50 40 Z" fill="none" stroke="#ffffff" strokeWidth="1" strokeOpacity="0.12" />
              </svg>
            </div>
          </aside>

        </div>
      </main>

      {/* Cart Selection Drawer */}
      {cartSelections.length > 0 && (
        <div className="cart-drawer-panel">
          <div className="cart-drawer-container">
            <div className="cart-drawer-left">
              <h4 className="cart-drawer-title">YOUR SELECTIONS ({cartSelections.length} Items)</h4>
              <div className="cart-items-preview">
                {cartSelections.map(s => (
                  <span key={s.id} className="cart-preview-pill">
                    {s.name} ({formatCurrency(s.price)})
                    <button className="pill-remove-btn" onClick={() => toggleCartSelection(s)}>×</button>
                  </span>
                ))}
              </div>
            </div>
            <div className="cart-drawer-right">
              <div className="cart-price-summary">
                <span className="cart-summary-label">Total Price:</span>
                <span className="cart-summary-val">{formatCurrency(totalSelectionsCost)}</span>
              </div>
              <div className="cart-drawer-actions">
                <button className="drawer-clear-btn" onClick={clearSelections}>Clear All</button>
                <button className="drawer-checkout-btn" onClick={handleCheckout}>
                  Proceed to Payment
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <Footer />

      {/* Embedded Component Specific CSS Styles */}
      <style jsx global>{`
        html, body {
          overflow-y: auto !important;
        }
        /* Override Header & Footer container max-width to match spacious 1400px layout */
        .header-nav .nav-container {
          max-width: 1400px !important;
          width: 100% !important;
        }
        .footer-container .footer-grid,
        .footer-container .footer-bottom {
          max-width: 1400px !important;
          width: 100% !important;
        }
        /* Chrome global focus ring reset */
        button:focus,
        input:focus,
        a:focus {
          outline: none !important;
          box-shadow: none !important;
        }
      `}</style>
      <style jsx>{`
        .services-main-container {
          max-width: 1400px;
          margin: 0 auto;
          padding: 40px 24px;
          width: 100%;
        }
        .services-grid-layout {
          display: grid;
          grid-template-columns: 240px 1fr 280px;
          gap: 28px;
          align-items: start;
        }
        .center-content {
          min-width: 0; /* Critical for grid child content resizing */
          display: flex;
          flex-direction: column;
          gap: 36px;
        }

        /* Sidebar Headings */
        .sidebar-heading {
          font-family: var(--font-sans);
          font-size: 1.15rem;
          color: #111827;
          font-weight: 700 !important;
          margin-bottom: 16px;
        }
        .sidebar-heading-small {
          font-family: var(--font-sans);
          font-size: 1.15rem;
          color: #111827;
          font-weight: 700 !important;
        }
        .sidebar-title-row {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 16px;
        }
        .sidebar-title-row.title-small {
          margin-bottom: 12px;
        }
        .sidebar-group {
          margin-bottom: 8px;
        }

        /* LEFT SIDEBAR */
        .left-sidebar {
          display: flex;
          flex-direction: column;
          gap: 32px;
          position: sticky;
          top: 90px;
        }
        .search-input-field {
          display: flex;
          align-items: center;
          width: 100%;
          background: #ffffff;
          border: 1px solid rgba(168, 85, 247, 0.2);
          border-radius: 8px;
          padding: 0 14px;
          box-sizing: border-box;
          transition: var(--transition-fast);
        }
        .search-input-field:focus-within {
          border-color: rgba(168, 85, 247, 0.5);
          box-shadow: 0 0 0 3px rgba(168, 85, 247, 0.1);
        }
        .search-field-icon {
          color: #a855f7;
          flex-shrink: 0;
          margin-left: 8px;
        }
        .search-field-control {
          flex: 1;
          border: none;
          background: transparent;
          outline: none;
          padding: 10px 0;
          font-family: var(--font-sans);
          font-size: 0.85rem;
          color: #111827;
        }

        .categories-list-card {
          display: flex;
          flex-direction: column;
          gap: 4px;
          max-height: 260px;
          overflow-y: auto;
          padding-right: 4px;
        }
        /* Custom thin categories scrollbar styling */
        .categories-list-card::-webkit-scrollbar {
          width: 4px;
        }
        .categories-list-card::-webkit-scrollbar-track {
          background: transparent;
        }
        .categories-list-card::-webkit-scrollbar-thumb {
          background: rgba(168, 85, 247, 0.15);
          border-radius: 4px;
        }
        .categories-list-card::-webkit-scrollbar-thumb:hover {
          background: rgba(168, 85, 247, 0.3);
        }

        .category-item-btn {
          width: 100%;
          padding: 8px 12px;
          background: transparent;
          border: none;
          border-radius: 12px;
          display: flex;
          align-items: center;
          gap: 12px;
          cursor: pointer;
          font-family: var(--font-sans);
          font-size: 0.82rem;
          font-weight: 500;
          color: #4b5563;
          transition: var(--transition-fast);
          text-align: left;
        }
        .category-item-btn svg {
          color: #a855f7;
          transition: var(--transition-fast);
        }
        .category-item-btn:hover {
          color: #7c3aed;
        }
        .category-item-btn:hover svg {
          color: #7c3aed;
        }
        .category-item-btn.active {
          background: #eedffd;
          color: #3b0764;
          font-weight: 600;
        }
        .category-item-btn.active svg {
          color: #581c87;
        }
        .category-item-btn:focus {
          outline: none !important;
        }

        .why-choose-card {
          position: relative;
          background: #fdf8ff;
          border-radius: 24px;
          padding: 24px;
          border: 1px solid rgba(168, 85, 247, 0.08);
        }
        .reasons-stack {
          display: flex;
          flex-direction: column;
          gap: 14px;
        }
        .reason-item {
          display: flex;
          gap: 12px;
          align-items: flex-start;
        }
        .reason-icon-wrapper {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          background: #eedffd;
          color: #7c3aed;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          border: none;
        }
        .reason-text h5 {
          font-family: var(--font-sans) !important;
          font-size: 0.82rem !important;
          font-weight: 700 !important;
          color: #1e1b4b;
          margin-bottom: 2px;
        }
        .reason-text p {
          font-size: 0.7rem;
          line-height: 1.35;
          color: #6b7280;
        }
        .lotus-graphic-wrapper {
          display: flex;
          justify-content: center;
          margin-top: 14px;
        }
        .lotus-icon-line {
          width: 160px;
          height: 140px;
        }

        /* Hero Banner */
        .hero-banner-panel {
          position: relative;
          overflow: hidden;
          min-height: 280px;
          display: flex;
          align-items: center;
          background: linear-gradient(135deg, #f5edfc 0%, #fdf8ff 100%);
          border: 1px solid rgba(168, 85, 247, 0.15);
          border-radius: 24px;
          padding: 40px;
        }
        .banner-content {
          position: relative;
          z-index: 3;
          max-width: 58%;
          display: flex;
          flex-direction: column;
          gap: 12px;
          align-items: flex-start;
        }
        .banner-lbl {
          font-family: var(--font-sans);
          font-size: 0.72rem;
          font-weight: 700;
          letter-spacing: 0.1em;
          color: #7c3aed;
          text-transform: uppercase;
        }
        .banner-title {
          font-family: var(--font-serif);
          font-size: 2.2rem;
          color: #111827;
          font-weight: 600 !important;
          line-height: 1.15;
        }
        .banner-desc {
          font-size: 0.84rem;
          line-height: 1.5;
          color: #6b7280;
        }
        .banner-btn-row {
          display: flex;
          align-items: center;
          gap: 16px;
          margin-top: 4px;
        }
        .banner-cta {
          background: #3b0764;
          color: #ffffff;
          border: none;
          font-family: var(--font-serif);
          font-size: 0.9rem;
          font-weight: 700;
          padding: 10px 20px;
          border-radius: 20px;
          cursor: pointer;
          transition: var(--transition-fast);
        }
        .banner-cta:hover {
          background: #4c1d95;
        }
        .banner-lotus-watermark {
          position: absolute;
          left: 45%;
          bottom: -15px;
          width: 120px;
          height: 120px;
          z-index: 1;
        }
        .banner-watermark-svg {
          width: 100%;
          height: 100%;
        }
        .banner-image {
          position: absolute;
          top: 1px;
          right: 1px;
          bottom: 1px;
          width: 45%;
          background-image: url("/images/services_hero_bg.png");
          background-size: cover;
          background-position: right center;
          z-index: 1;
          border-top-right-radius: 23px;
          border-bottom-right-radius: 23px;
          mask-image: linear-gradient(to left, rgba(0,0,0,1) 60%, rgba(0,0,0,0) 100%);
          -webkit-mask-image: linear-gradient(to left, rgba(0,0,0,1) 60%, rgba(0,0,0,0) 100%);
        }

        /* Sections Structure */
        .section-block {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }
        .section-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .featured-heading-row {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .featured-heading-row.centered {
          justify-content: center;
        }
        .featured-heading-lotus {
          width: 24px;
          height: 24px;
        }
        .section-title {
          font-family: var(--font-serif);
          font-size: 1.4rem;
          color: #111827;
          font-weight: 600 !important;
        }

        /* Carousel Catalog Layout */
        .carousel-container-relative {
          position: relative;
          width: 100%;
        }
        .carousel-viewport {
          width: 100%;
          overflow: hidden;
          padding: 6px 0;
        }
        .arrow-nav-btn {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background: #ffffff;
          border: 1px solid rgba(168, 85, 247, 0.15);
          color: #7c3aed;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          box-shadow: 0 4px 12px rgba(0,0,0,0.06);
          transition: var(--transition-fast);
        }
        .arrow-nav-btn.absolute-left {
          position: absolute;
          left: -18px;
          top: 36%;
          transform: translateY(-50%);
          z-index: 10;
        }
        .arrow-nav-btn.absolute-right {
          position: absolute;
          right: -18px;
          top: 36%;
          transform: translateY(-50%);
          z-index: 10;
        }
        .arrow-nav-btn:hover:not(:disabled) {
          background: #fbf8ff;
          border-color: #7c3aed;
          box-shadow: 0 4px 16px rgba(124, 58, 237, 0.12);
        }
        .arrow-nav-btn:disabled {
          opacity: 0.3;
          cursor: not-allowed;
        }

        /* Featured Cards */
        .featured-item-card {
          background: transparent;
          border: none;
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          text-align: left;
          transition: var(--transition-smooth);
        }
        .featured-item-card:hover {
          transform: translateY(-4px);
        }
        .featured-card-media-wrapper {
          width: 100%;
          aspect-ratio: 4/3;
          border-radius: 16px;
          overflow: hidden;
          background: #fbf8ff;
          margin-bottom: 16px;
          box-shadow: 0 8px 24px rgba(124, 58, 237, 0.08);
        }
        .featured-media-img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          transition: transform 0.5s ease;
        }
        .featured-item-card:hover .featured-media-img {
          transform: scale(1.05);
        }
        .featured-card-body {
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          gap: 8px;
          padding: 0 4px;
        }
        .featured-card-title {
          font-family: var(--font-serif);
          font-size: 1.1rem;
          color: #1e1b4b;
          font-weight: 700 !important;
          line-height: 1.2;
        }
        .featured-card-desc {
          font-size: 0.78rem;
          line-height: 1.45;
          color: #6b7280;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        .learn-more-link {
          background: transparent;
          border: none;
          color: #7c3aed;
          font-size: 0.78rem;
          font-weight: 700;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 4px 0;
          transition: var(--transition-fast);
          margin-top: 4px;
        }
        .learn-more-link:hover {
          color: #4c1d95;
        }
        .learn-more-link:hover .arrow-icon {
          transform: translateX(2px);
        }
        .arrow-icon {
          transition: transform 0.2s ease;
        }

        .carousel-dots {
          display: flex;
          justify-content: center;
          gap: 6px;
          margin-top: 10px;
        }
        .carousel-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: rgba(168, 85, 247, 0.15);
          border: none;
          cursor: pointer;
          transition: var(--transition-fast);
        }
        .carousel-dot.active {
          background: #7c3aed;
          width: 14px;
          border-radius: 99px;
        }

        /* Healing Programs */
        .programs-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 16px;
        }
        .program-item-card {
          background: #ffffff;
          border: 1px solid rgba(168, 85, 247, 0.08);
          border-radius: 20px;
          padding: 12px;
          display: flex;
          flex-direction: column;
          position: relative;
          transition: var(--transition-smooth);
        }
        .program-item-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 8px 24px rgba(168, 85, 247, 0.06);
          border-color: rgba(168, 85, 247, 0.15);
        }
        .prog-badge {
          position: absolute;
          top: 20px;
          right: 20px;
          z-index: 10;
          font-size: 0.62rem;
          font-weight: 800;
          text-transform: uppercase;
          padding: 3px 8px;
          border-radius: 6px;
          color: #ffffff;
          letter-spacing: 0.05em;
        }
        .badge-popular {
          background: #3b0764;
        }
        .badge-new {
          background: #db2777;
        }
        .program-media {
          width: 100%;
          aspect-ratio: 4/3;
          border-radius: 12px;
          overflow: hidden;
          background: #fbf8ff;
          margin-bottom: 12px;
        }
        .program-media-img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        .program-body {
          display: flex;
          flex-direction: column;
          gap: 6px;
          flex: 1;
        }
        .program-title {
          font-family: var(--font-serif);
          font-size: 1.05rem;
          color: #4c1d95;
          font-weight: 700 !important;
          line-height: 1.25;
        }
        .program-desc {
          font-size: 0.72rem;
          line-height: 1.4;
          color: #6b7280;
          flex: 1;
        }
        .program-details-row {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 0.7rem;
          color: #6b7280;
          font-weight: 600;
        }
        .view-details-link {
          background: transparent;
          border: none;
          color: #7c3aed;
          font-size: 0.75rem;
          font-weight: 700;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 4px;
          padding: 6px 0;
          margin-top: 4px;
          transition: var(--transition-fast);
          width: fit-content;
        }
        .view-details-link:hover {
          color: #4c1d95;
        }
        .view-details-link:hover .arrow-icon {
          transform: translateX(2px);
        }

        /* How It Works Flow chart */
        .how-it-works-flow {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 8px;
          background: #ffffff;
          border: 1px solid rgba(168, 85, 247, 0.08);
          border-radius: 20px;
          padding: 24px;
        }
        .flow-step {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          gap: 6px;
        }
        .flow-icon-wrapper {
          width: 44px;
          height: 44px;
          border-radius: 50%;
          background: #eedffd;
          color: #7c3aed;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          border: none;
        }
        .flow-step h5 {
          font-family: var(--font-sans) !important;
          font-size: 0.8rem !important;
          font-weight: 700 !important;
          color: #1e1b4b;
        }
        .flow-step p {
          font-size: 0.7rem;
          line-height: 1.35;
          color: #6b7280;
        }
        .flow-arrow {
          color: rgba(168, 85, 247, 0.2);
          display: flex;
          align-items: center;
        }

        /* RIGHT SIDEBAR */
        .right-sidebar {
          display: flex;
          flex-direction: column;
          gap: 28px;
          position: sticky;
          top: 90px;
        }
        .sidebar-title-row {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 12px;
        }
        .sidebar-lotus-icon {
          width: 24px;
          height: 24px;
          flex-shrink: 0;
          margin-top: -2px;
        }
        .benefits-card {
          padding: 24px;
        }
        .benefits-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 12px;
          margin-bottom: 16px;
        }
        .benefit-item {
          background: #ffffff;
          border: 1px solid rgba(168, 85, 247, 0.06);
          border-radius: 16px;
          padding: 12px;
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          gap: 6px;
        }
        .benefit-icon {
          width: 42px;
          height: 42px;
          border-radius: 50%;
          background: #faf5ff;
          border: 1px solid rgba(168, 85, 247, 0.1);
          color: #9333ea;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        .benefit-item h5 {
          font-family: var(--font-sans) !important;
          font-size: 0.74rem !important;
          font-weight: 700 !important;
          color: #1e1b4b;
          line-height: 1.2;
        }
        .explore-benefits-btn {
          width: 100%;
          padding: 10px;
          background: transparent;
          border: 1px solid rgba(168, 85, 247, 0.4);
          border-radius: 20px;
          color: #7c3aed;
          font-family: var(--font-sans);
          font-size: 0.8rem;
          font-weight: 600;
          cursor: pointer;
          transition: var(--transition-fast);
        }
        .explore-benefits-btn:hover {
          background: #fbf8ff;
          border-color: #7c3aed;
        }

        /* Testimonials */
        .testimonial-card {
          padding: 24px;
        }
        .testimonial-box {
          display: flex;
          flex-direction: column;
          gap: 12px;
          position: relative;
          min-height: 140px;
        }
        .quote-mark {
          font-family: var(--font-serif);
          font-size: 4.5rem;
          color: rgba(168, 85, 247, 0.18);
          position: absolute;
          top: -24px;
          left: -4px;
          line-height: 1;
        }
        .testimonial-comment {
          font-size: 0.78rem;
          line-height: 1.45;
          color: #4b5563;
          font-style: italic;
          z-index: 2;
        }
        .testimonial-author-row {
          margin-top: auto;
          display: flex;
          align-items: center;
          gap: 10px;
          z-index: 2;
        }
        .client-avatar {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          object-fit: cover;
          border: 1.5px solid rgba(168, 85, 247, 0.2);
        }
        .author-details {
          display: flex;
          flex-direction: column;
        }
        .author-details h5 {
          font-family: var(--font-sans) !important;
          font-size: 0.78rem !important;
          font-weight: 700 !important;
          color: #1e1b4b;
        }
        .author-details span {
          font-size: 0.68rem;
          color: #9ca3af;
        }
        .testimonial-dots {
          display: flex;
          justify-content: center;
          gap: 6px;
          margin-top: 14px;
        }
        .testimonial-dot {
          width: 5px;
          height: 5px;
          border-radius: 50%;
          background: rgba(168, 85, 247, 0.15);
          border: none;
          cursor: pointer;
          transition: var(--transition-fast);
        }
        .testimonial-dot.active {
          background: #7c3aed;
          width: 11px;
          border-radius: 99px;
        }

        /* Callout Consultation CTA */
        .callout-cta-card {
          padding: 24px;
          background: linear-gradient(135deg, #eedffd 0%, #fdf2f8 100%);
          border: 1px solid rgba(168, 85, 247, 0.15);
          border-radius: 24px;
          position: relative;
          overflow: hidden;
          box-shadow: 0 8px 30px rgba(124, 58, 237, 0.05);
          color: #111827;
        }
        .callout-content {
          position: relative;
          z-index: 2;
          display: flex;
          flex-direction: column;
          gap: 10px;
          align-items: center;
          text-align: center;
        }
        .callout-content h4 {
          font-family: var(--font-serif);
          font-size: 1.15rem;
          color: #3b0764;
          font-weight: 600 !important;
          line-height: 1.3;
        }
        .callout-content p {
          font-size: 0.76rem;
          line-height: 1.35;
          color: #4b5563;
        }
        .callout-consult-btn {
          width: 100%;
          padding: 10px;
          background: #3b0764;
          color: #ffffff;
          border: none;
          border-radius: 20px;
          font-family: var(--font-serif);
          font-size: 0.85rem;
          font-weight: 700;
          cursor: pointer;
          transition: var(--transition-fast);
          margin-top: 4px;
        }
        .callout-consult-btn:hover {
          background: #4c1d95;
        }
        .or-divider {
          font-size: 0.7rem;
          color: #6b7280;
        }
        .callout-chat-row {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 0.76rem;
          font-weight: 700;
          color: #4b5563;
        }
        .chat-link {
          text-decoration: underline !important;
          cursor: pointer;
          color: #7c3aed;
        }
        .chat-link:hover {
          color: #4c1d95;
        }
        .callout-lotus-bg {
          position: absolute;
          bottom: -15px;
          right: -15px;
          width: 100px;
          height: 100px;
          z-index: 1;
          pointer-events: none;
        }
        .callout-lotus-bg path {
          stroke: #a855f7 !important;
          stroke-opacity: 0.15 !important;
        }

        /* Cart Selection Drawer */
        .cart-drawer-panel {
          position: fixed;
          bottom: 0;
          left: 0;
          right: 0;
          background: rgba(255, 255, 255, 0.95);
          backdrop-filter: blur(20px);
          border-top: 2px solid var(--gold-border);
          box-shadow: 0 -10px 40px rgba(0,0,0,0.05);
          z-index: 1000;
          padding: 20px 24px;
          animation: slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .cart-drawer-container {
          max-width: 1400px;
          margin: 0 auto;
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 40px;
        }
        .cart-drawer-left {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 12px;
          overflow: hidden;
          color: #1e1b4b;
        }
        .cart-drawer-title {
          font-family: var(--font-serif);
          font-size: 0.85rem;
          color: #4c1d95;
          letter-spacing: 0.08em;
        }
        .cart-items-preview {
          display: flex;
          gap: 10px;
          overflow-x: auto;
          padding-bottom: 4px;
        }
        .cart-preview-pill {
          background: rgba(168, 85, 247, 0.05);
          border: 1px solid rgba(168, 85, 247, 0.25);
          color: #6d28d9;
          font-size: 0.75rem;
          font-weight: 600;
          padding: 6px 12px;
          border-radius: 99px;
          white-space: nowrap;
          display: inline-flex;
          align-items: center;
          gap: 8px;
        }
        .pill-remove-btn {
          background: transparent;
          border: none;
          color: rgba(0,0,0,0.4);
          font-size: 1rem;
          cursor: pointer;
          line-height: 1;
        }
        .pill-remove-btn:hover {
          color: #ef4444;
        }
        .cart-drawer-right {
          display: flex;
          align-items: center;
          gap: 28px;
        }
        .cart-price-summary {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
        }
        .cart-summary-label {
          font-size: 0.75rem;
          color: #6b7280;
          text-transform: uppercase;
        }
        .cart-summary-val {
          font-family: var(--font-serif);
          font-size: 1.5rem;
          font-weight: 700;
          color: #db2777;
        }
        .cart-drawer-actions {
          display: flex;
          gap: 12px;
        }
        .drawer-clear-btn {
          background: transparent;
          border: 1px solid rgba(0,0,0,0.12);
          color: #6b7280;
          padding: 12px 18px;
          border-radius: 10px;
          font-size: 0.8rem;
          cursor: pointer;
          font-weight: 600;
          transition: var(--transition-fast);
        }
        .drawer-clear-btn:hover {
          border-color: #ef4444;
          color: #ef4444;
        }
        .drawer-checkout-btn {
          background: var(--btn-gold-bg);
          color: var(--btn-gold-text);
          border: 1px solid var(--btn-gold-border);
          font-family: var(--font-serif);
          font-weight: 700;
          font-size: 0.8rem;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          padding: 12px 24px;
          border-radius: 10px;
          cursor: pointer;
          transition: var(--transition-fast);
          box-shadow: 0 4px 15px rgba(168,85,247,0.15);
        }
        .drawer-checkout-btn:hover {
          filter: brightness(1.1);
          transform: translateY(-1px);
        }

        /* GRID RESPONSIVE STYLING FOR MOCKUP ALIGNMENT */
        @media (min-width: 1201px) {
          .carousel-viewport {
            overflow: hidden;
          }
        }

        @media (max-width: 1200px) and (min-width: 901px) {
          .services-grid-layout {
            grid-template-columns: 200px 1fr 240px;
            gap: 20px;
          }
          .left-sidebar {
            position: relative;
            top: 0;
          }
          .right-sidebar {
            position: relative;
            top: 0;
          }
          .carousel-viewport {
            overflow: hidden;
          }
        }

        @media (max-width: 900px) {
          .services-grid-layout {
            grid-template-columns: 180px 1fr;
            gap: 16px;
          }
          .left-sidebar {
            position: relative;
            top: 0;
          }
          .right-sidebar {
            position: relative;
            top: 0;
            grid-column: 1 / -1;
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 20px;
          }
          .callout-cta-card {
            grid-column: 1 / -1;
          }
          .programs-grid {
            grid-template-columns: repeat(2, 1fr);
          }
          .carousel-viewport {
            overflow: hidden;
          }
        }

        @media (max-width: 768px) {
          .services-grid-layout {
            grid-template-columns: 1fr;
          }
          .right-sidebar {
            grid-template-columns: 1fr;
          }
          .banner-content {
            max-width: 100%;
          }
          .banner-image {
            width: 100%;
            opacity: 0.12;
          }
          .programs-grid {
            grid-template-columns: 1fr;
          }
          .how-it-works-flow {
            flex-direction: column;
            gap: 20px;
          }
          .flow-arrow {
            transform: rotate(90deg);
          }
          .cart-drawer-container {
            flex-direction: column;
            gap: 20px;
            align-items: stretch;
          }
          .cart-price-summary {
            align-items: flex-start;
          }
        }
      `}</style>
    </div>
  );
}
