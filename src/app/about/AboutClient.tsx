"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import Link from "next/link";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import {
  BookOpen, Target, Wrench, Users, User, Award, MessageSquare, Newspaper, ChevronLeft, ChevronRight, ArrowRight
} from "lucide-react";

// Mockup featured services order
const featuredOrder = [
  "Chakra Healing",
  "Aura Scanning",
  "Reiki Healing",
  "Sound Healing",
  "Personal Guidance"
];

interface Practitioner {
  id: string;
  name: string;
  specialty: string;
  bio: string;
  rating: number;
  reviewsCount: number;
  image: string;
  expertise?: string[];
  certifications?: string[];
}

interface Service {
  id: string;
  name: string;
  price: number;
  duration: string;
  rating: number;
  practitioner: string;
  image: string;
  description: string;
  category?: string;
  categories?: string[];
}

interface Testimonial {
  comment: string;
  author: string;
  location: string;
}

export default function AboutClient() {
  // Dynamic Data States
  const [services, setServices] = useState<Service[]>([]);
  const [healers, setHealers] = useState<Practitioner[]>([]);
  const [loadingServices, setLoadingServices] = useState(true);
  const [loadingHealers, setLoadingHealers] = useState(true);

  // Search & Navigation States
  const [searchQuery, setSearchQuery] = useState("");
  const [activeSection, setActiveSection] = useState("story");

  // Featured Services Carousel States
  const [featuredIndex, setFeaturedIndex] = useState(0);
  const [visibleCount, setVisibleCount] = useState(3);

  // Carousel scroll position trackers (to highlight active dots)
  const [servicesScrollProgress, setServicesScrollProgress] = useState(0);
  const [healersScrollProgress, setHealersScrollProgress] = useState(0);
  const [teamScrollProgress, setTeamScrollProgress] = useState(0);

  // Testimonial States
  const [testimonialIndex, setTestimonialIndex] = useState(0);

  // Modal States
  const [showStoryModal, setShowStoryModal] = useState(false);
  const [showCertsModal, setShowCertsModal] = useState(false);

  // Refs for carousels
  const servicesCarouselRef = useRef<HTMLDivElement>(null);
  const healersCarouselRef = useRef<HTMLDivElement>(null);
  const teamCarouselRef = useRef<HTMLDivElement>(null);

  // Static Team Data
  const staticTeam = [
    {
      id: "team-1",
      name: "Priya Sharma",
      role: "Founder & CEO",
      image: "https://i.pravatar.cc/100?img=49"
    },
    {
      id: "team-2",
      name: "Arjun Malhotra",
      role: "Head of Healing",
      image: "https://i.pravatar.cc/100?img=15"
    },
    {
      id: "team-3",
      name: "Kavya Nair",
      role: "Content & Education",
      image: "https://i.pravatar.cc/100?img=45"
    },
    {
      id: "team-4",
      name: "Vikram Das",
      role: "Operations Manager",
      image: "https://i.pravatar.cc/100?img=13"
    },
    {
      id: "team-5",
      name: "Ishita Verma",
      role: "Community Manager",
      image: "https://i.pravatar.cc/100?img=20"
    }
  ];

  // Static Testimonials (as fallbacks or rotation items)
  const staticTestimonials: Testimonial[] = [
    {
      comment: "Diving Sanatan changed my life. I found clarity, peace, and purpose through their guidance.",
      author: "Ananya",
      location: "Mumbai"
    },
    {
      comment: "The chakra balancing helped release months of heavy work stress. It was truly transcendental.",
      author: "Sarah",
      location: "London"
    },
    {
      comment: "The acoustic sound healing sessions have completely rewritten my sleeping patterns. I feel lightweight and centered.",
      author: "Jonathan",
      location: "Saint Petersburg"
    }
  ];

  const menuItems = [
    { id: "story", label: "Our Story", icon: <BookOpen size={16} strokeWidth={1.5} /> },
    { id: "healers", label: "Our Healers", icon: <Users size={16} strokeWidth={1.5} /> },
    { id: "team", label: "Our Team", icon: <User size={16} strokeWidth={1.5} /> },
    { id: "services", label: "Our Services", icon: <Wrench size={16} strokeWidth={1.5} /> },
  ];

  // Load Services and Healers from DB APIs
  useEffect(() => {
    async function fetchServices() {
      try {
        const res = await fetch("/api/services");
        const json = await res.json();
        if (json.success) {
          // Keep only featured/primary services or all services for listing
          setServices(json.data);
        }
      } catch (err) {
        console.error("Failed to load services", err);
      } finally {
        setLoadingServices(false);
      }
    }

    async function fetchPractitioners() {
      try {
        const res = await fetch("/api/practitioners");
        const json = await res.json();
        if (json.success) {
          setHealers(json.data);
        }
      } catch (err) {
        console.error("Failed to load practitioners", err);
      } finally {
        setLoadingHealers(false);
      }
    }

    fetchServices();
    fetchPractitioners();
  }, []);

  // Intersection Observer for scroll-spy active state tracking
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.id);
          }
        });
      },
      { threshold: 0.15, rootMargin: "-80px 0px -40% 0px" }
    );

    menuItems.forEach((item) => {
      const el = document.getElementById(item.id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [loadingServices, loadingHealers]);

  // Testimonial auto-rotation
  useEffect(() => {
    const timer = setInterval(() => {
      setTestimonialIndex((prev) => (prev + 1) % staticTestimonials.length);
    }, 5500);
    return () => clearInterval(timer);
  }, []);

  // Handle responsive visibleCount for featured services slider dynamically
  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      if (width <= 600) {
        setVisibleCount(1);
      } else if (width <= 968) {
        setVisibleCount(2);
      } else {
        setVisibleCount(3);
      }
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Filter & sort featured services
  const featuredServices = useMemo(() => {
    const list = services.filter(
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
  }, [services]);

  const maxFeaturedIndex = useMemo(() => {
    return Math.max(featuredServices.length - visibleCount, 0);
  }, [featuredServices.length, visibleCount]);

  // Auto-reset index if bounds shrink
  useEffect(() => {
    if (featuredIndex > maxFeaturedIndex) {
      setFeaturedIndex(maxFeaturedIndex);
    }
  }, [featuredIndex, maxFeaturedIndex]);

  const handlePrevFeatured = () => {
    setFeaturedIndex(prev => Math.max(prev - 1, 0));
  };

  const handleNextFeatured = () => {
    setFeaturedIndex(prev => Math.min(prev + 1, maxFeaturedIndex));
  };

  // Image & icon mapping helper functions
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

  const getServiceIconSymbol = (serviceName: string) => {
    const name = serviceName.toLowerCase();
    if (name.includes("chakra")) return "☸";
    if (name.includes("aura")) return "👁";
    if (name.includes("reiki")) return "✋";
    if (name.includes("sound")) return "♪";
    if (name.includes("guidance") || name.includes("personal") || name.includes("counseling")) return "👤";
    return "✦";
  };

  const getHealerAvatar = (imgName: string, healerName: string) => {
    if (imgName && (imgName.startsWith("http") || imgName.startsWith("/")) && imgName !== "elara_vance") {
      return imgName;
    }
    const name = healerName.toLowerCase();
    if (name.includes("anara")) return "https://i.pravatar.cc/100?img=47";
    if (name.includes("elena") || name.includes("vance")) return "https://i.pravatar.cc/100?img=48";
    if (name.includes("rohan") || name.includes("zephyr")) return "https://i.pravatar.cc/100?img=33";
    if (name.includes("meera") || name.includes("celeste")) return "https://i.pravatar.cc/100?img=44";
    if (name.includes("dev") || name.includes("arora")) return "https://i.pravatar.cc/100?img=12";
    return "https://i.pravatar.cc/100?img=47";
  };

  // Scroll spy helper to scroll page content smoothly
  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      const offset = 85; // header spacer offset
      const bodyRect = document.body.getBoundingClientRect().top;
      const elementRect = el.getBoundingClientRect().top;
      const elementPosition = elementRect - bodyRect;
      const offsetPosition = elementPosition - offset;

      window.scrollTo({
        top: offsetPosition,
        behavior: "smooth"
      });
    }
  };

  // Carousel control helpers
  const handleCarouselScroll = (ref: React.RefObject<HTMLDivElement | null>, direction: "left" | "right", setScrollProgress: (prog: number) => void) => {
    if (ref.current) {
      const container = ref.current;
      const cardWidth = container.querySelector(".card, .healer-card")?.clientWidth || 240;
      const scrollAmount = cardWidth + 14; // card width + gap
      const targetScroll = container.scrollLeft + (direction === "left" ? -scrollAmount : scrollAmount);

      container.scrollTo({
        left: targetScroll,
        behavior: "smooth"
      });
    }
  };

  const updateScrollProgress = (ref: React.RefObject<HTMLDivElement | null>, setScrollProgress: (prog: number) => void) => {
    if (ref.current) {
      const container = ref.current;
      const maxScroll = container.scrollWidth - container.clientWidth;
      if (maxScroll <= 0) {
        setScrollProgress(0);
        return;
      }
      const progress = container.scrollLeft / maxScroll;
      setScrollProgress(progress);
    }
  };

  // Live Filtering
  const filteredServices = services.filter((srv) => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      srv.name.toLowerCase().includes(q) ||
      srv.description.toLowerCase().includes(q) ||
      (srv.category && srv.category.toLowerCase().includes(q))
    );
  });

  const filteredHealers = healers.filter((prac) => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      prac.name.toLowerCase().includes(q) ||
      prac.specialty.toLowerCase().includes(q) ||
      prac.bio.toLowerCase().includes(q)
    );
  });

  const filteredTeam = staticTeam.filter((member) => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      member.name.toLowerCase().includes(q) ||
      member.role.toLowerCase().includes(q)
    );
  });

  return (
    <div className="page-shell">
      <Header />

      <div className="page">
        {/* ================= LEFT SIDEBAR ================= */}
        <aside className="sidebar">
          <div className="sidebar-sticky-wrapper">

            {/* Search header card */}
            <div className="about-sidebar-search-box">
              <div className="about-sidebar-title-row">
                <svg viewBox="0 0 100 100" className="about-sidebar-lotus-icon">
                  <path d="M50 25 C45 45 35 60 50 80 C65 60 55 45 50 25 Z" fill="none" stroke="#a855f7" strokeWidth="4" />
                  <path d="M50 80 C35 75 25 60 20 40 C35 50 45 60 50 80 Z" fill="none" stroke="#a855f7" strokeWidth="4" />
                  <path d="M50 80 C65 75 75 60 80 40 C65 50 55 60 50 80 Z" fill="none" stroke="#a855f7" strokeWidth="4" />
                  <path d="M50 80 C30 80 10 70 5 55 C20 65 35 70 50 80 Z" fill="none" stroke="#a855f7" strokeWidth="4" />
                  <path d="M50 80 C70 80 90 70 95 55 C80 65 65 70 50 80 Z" fill="none" stroke="#a855f7" strokeWidth="4" />
                </svg>
                <h4 className="about-sidebar-heading">About Us</h4>
              </div>
            </div>

            {/* Navigation menu card */}
            <div className="about-sidebar-menu-card">
              <div className="about-sidebar-menu">
                {menuItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => scrollToSection(item.id)}
                    className={`about-sidebar-item ${activeSection === item.id ? "active" : ""}`}
                  >
                    {item.icon}
                    <div className="about-item-text-container">
                      <span className="about-item-name">{item.label}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Quote card */}
            <div className="about-quote-card">
              <h3>"We believe healing is a journey, not a destination."</h3>
              <p>We walk beside you with wisdom, compassion, and ancient practices for modern lives.</p>
              <div className="about-quote-lotus">❀</div>
            </div>

          </div>
        </aside>

        {/* ================= MAIN COLUMN ================= */}
        <main className="main">
          {/* Story Hero */}
          <section id="story" className="story-hero">
            <div className="story-content">
              <h2>Our Story</h2>
              <h1>Healing Ancient Wisdom for Modern Lives</h1>
              <p>
                Diving Sanatan was Founded in 2015 by Nikhil Deshpande, Diving Sanatan is a holistic wellness platform dedicated to helping individuals navigate life's most important challenges with clarity and confidence. Whether you're seeking guidance for your health...
              </p>
              <button className="learn-btn" onClick={() => setShowStoryModal(true)}>
                Learn Our Journey
              </button>
            </div>
            <div className="story-image"></div>
          </section>


          {/* Our Healers */}
          <section id="healers" className="section">
            <div className="section-header">
              <span className="lotus">❀</span> Our Healers
            </div>
            <div className="carousel-wrap">
              <button
                className="arrow left"
                onClick={() => handleCarouselScroll(healersCarouselRef, "left", setHealersScrollProgress)}
                aria-label="Scroll left"
              >
                ‹
              </button>
              <button
                className="arrow right"
                onClick={() => handleCarouselScroll(healersCarouselRef, "right", setHealersScrollProgress)}
                aria-label="Scroll right"
              >
                ›
              </button>

              <div
                className="cards-carousel"
                ref={healersCarouselRef}
                onScroll={() => updateScrollProgress(healersCarouselRef, setHealersScrollProgress)}
              >
                {loadingHealers ? (
                  Array.from({ length: 3 }).map((_, i) => (
                    <div className="healer-card skeleton-card" key={i}>
                      <div className="skeleton skeleton-avatar"></div>
                      <div className="skeleton skeleton-title"></div>
                      <div className="skeleton skeleton-role"></div>
                    </div>
                  ))
                ) : filteredHealers.length === 0 ? (
                  <div className="no-results">No matching healers found.</div>
                ) : (
                  filteredHealers.map((prac) => (
                    <div className="healer-card" key={prac.id}>
                      <img
                        className="healer-avatar"
                        src={getHealerAvatar(prac.image, prac.name)}
                        alt={prac.name}
                      />
                      <h4>{prac.name}</h4>
                      <div className="role">{prac.specialty}</div>
                      <div className="exp">
                        {prac.reviewsCount > 50 ? "12+ Years Exp." : "8+ Years Exp."}
                      </div>
                      <Link href={`/team/${prac.id}`} className="healer-card-link">
                        View Inner Bio & Details →
                      </Link>
                    </div>
                  ))
                )}
              </div>

              {filteredHealers.length > 0 && (
                <div className="dots">
                  {Array.from({ length: Math.ceil(filteredHealers.length / 2) }).map((_, idx) => {
                    const activeIndex = Math.min(
                      Math.round(healersScrollProgress * (Math.ceil(filteredHealers.length / 2) - 1)),
                      Math.ceil(filteredHealers.length / 2) - 1
                    );
                    return (
                      <div
                        key={idx}
                        className={`dot ${activeIndex === idx ? "active" : ""}`}
                        onClick={() => {
                          if (healersCarouselRef.current) {
                            const maxScroll = healersCarouselRef.current.scrollWidth - healersCarouselRef.current.clientWidth;
                            healersCarouselRef.current.scrollTo({
                              left: (idx / (Math.ceil(filteredHealers.length / 2) - 1)) * maxScroll,
                              behavior: "smooth"
                            });
                          }
                        }}
                      />
                    );
                  })}
                </div>
              )}
            </div>
          </section>

          {/* Our Team */}
          <section id="team" className="section">
            <div className="section-header">
              <span className="lotus">❀</span> Our Team
            </div>
            <div className="carousel-wrap">
              <button
                className="arrow left"
                onClick={() => handleCarouselScroll(teamCarouselRef, "left", setTeamScrollProgress)}
                aria-label="Scroll left"
              >
                ‹
              </button>
              <button
                className="arrow right"
                onClick={() => handleCarouselScroll(teamCarouselRef, "right", setTeamScrollProgress)}
                aria-label="Scroll right"
              >
                ›
              </button>

              <div
                className="cards-carousel"
                ref={teamCarouselRef}
                onScroll={() => updateScrollProgress(teamCarouselRef, setTeamScrollProgress)}
              >
                {filteredTeam.length === 0 ? (
                  <div className="no-results">No matching team members found.</div>
                ) : (
                  filteredTeam.map((member) => (
                    <div className="healer-card" key={member.id}>
                      <img
                        className="healer-avatar"
                        src={member.image}
                        alt={member.name}
                      />
                      <h4>{member.name}</h4>
                      <div className="role">{member.role}</div>
                      <div className="exp" style={{ visibility: "hidden" }}>.</div>
                    </div>
                  ))
                )}
              </div>

              {filteredTeam.length > 0 && (
                <div className="dots">
                  {Array.from({ length: Math.ceil(filteredTeam.length / 2) }).map((_, idx) => {
                    const activeIndex = Math.min(
                      Math.round(teamScrollProgress * (Math.ceil(filteredTeam.length / 2) - 1)),
                      Math.ceil(filteredTeam.length / 2) - 1
                    );
                    return (
                      <div
                        key={idx}
                        className={`dot ${activeIndex === idx ? "active" : ""}`}
                        onClick={() => {
                          if (teamCarouselRef.current) {
                            const maxScroll = teamCarouselRef.current.scrollWidth - teamCarouselRef.current.clientWidth;
                            teamCarouselRef.current.scrollTo({
                              left: (idx / (Math.ceil(filteredTeam.length / 2) - 1)) * maxScroll,
                              behavior: "smooth"
                            });
                          }
                        }}
                      />
                    );
                  })}
                </div>
              )}
            </div>
          </section>


          {/* Our Services */}
          <section id="services" className="section">
            <div className="section-header">
              <span className="lotus">❀</span> Our Featured Services
            </div>

            {loadingServices ? (
              <div className="carousel-viewport">
                <div className="carousel-track" style={{ display: "flex", gap: "16px" }}>
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div
                      key={i}
                      className="carousel-slide-item"
                      style={{
                        flex: `0 0 ${100 / visibleCount}%`,
                        width: `${100 / visibleCount}%`,
                        boxSizing: "border-box",
                        padding: "0 8px"
                      }}
                    >
                      <div className="featured-item-card skeleton-card">
                        <div className="featured-card-media-wrapper skeleton skeleton-img"></div>
                        <div className="featured-card-body">
                          <div className="skeleton skeleton-title"></div>
                          <div className="skeleton skeleton-desc"></div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : featuredServices.length === 0 ? (
              <div className="empty-catalog-card glass-panel" style={{ padding: "30px", textAlign: "center", color: "#6b4d8a" }}>
                No featured services found.
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
                            <Link
                              href={`/services/${srv.id}`}
                              className="learn-more-link"
                            >
                              Learn More <ArrowRight size={14} className="arrow-icon" />
                            </Link>
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
          </section>

        </main>

        {/* ================= RIGHT PANEL ================= */}
        <aside className="right-panel">
          <div id="mission-values">
            {/* Our Mission */}
            <div className="panel">
              <h3><span className="lotus">❀</span> Our Mission</h3>
              <p>To guide individuals on their path to healing and self-discovery through ancient wisdom, modern practices, and compassionate support.</p>
            </div>

            {/* Our Values */}
            <div className="panel">
              <h3><span className="lotus">❀</span> Our Values</h3>
              <div className="value">
                <div className="value-icon">🌱</div>
                <div>
                  <h5>Authenticity</h5>
                  <p>Rooted in ancient Sanatan wisdom</p>
                </div>
              </div>
              <div className="value">
                <div className="value-icon">♥</div>
                <div>
                  <h5>Compassion</h5>
                  <p>Healing with empathy and understanding</p>
                </div>
              </div>
              <div className="value">
                <div className="value-icon">🛡</div>
                <div>
                  <h5>Integrity</h5>
                  <p>Honest practices and true guidance</p>
                </div>
              </div>
              <div className="value">
                <div className="value-icon">👥</div>
                <div>
                  <h5>Community</h5>
                  <p>Building a supportive healing space</p>
                </div>
              </div>
            </div>
          </div>

          {/* Our Impact */}
          <div className="panel">
            <h3><span className="lotus">❀</span> Our Impact</h3>
            <div className="impact-grid">
              <div className="impact-box">
                <div className="impact-num">25K+</div>
                <div className="impact-label">Lives Transformed</div>
              </div>
              <div className="impact-box">
                <div className="impact-num">50+</div>
                <div className="impact-label">Expert Healers</div>
              </div>
              <div className="impact-box">
                <div className="impact-num">100+</div>
                <div className="impact-label">Holistic Modalities</div>
              </div>
              <div className="impact-box">
                <div className="impact-num">20+</div>
                <div className="impact-label">Years of Trust</div>
              </div>
            </div>
          </div>

          {/* Testimonial Panel */}
          <div id="testimonials" className="panel">
            <div className="testimonial">
              <div className="quote-mark">"</div>
              <p>{staticTestimonials[testimonialIndex].comment}</p>
              <div className="author">
                – {staticTestimonials[testimonialIndex].author},{" "}
                {staticTestimonials[testimonialIndex].location}
              </div>
            </div>
            <div className="dots" style={{ marginTop: "14px" }}>
              {staticTestimonials.map((_, idx) => (
                <div
                  key={idx}
                  className={`dot ${testimonialIndex === idx ? "active" : ""}`}
                  onClick={() => setTestimonialIndex(idx)}
                  style={{ cursor: "pointer" }}
                />
              ))}
            </div>
          </div>
        </aside>
      </div>

      {/* ================= MODAL DIALOGS ================= */}
      {showStoryModal && (
        <div className="modal-overlay" onClick={() => setShowStoryModal(false)}>
          <div className="modal-content glass-panel" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close-btn" onClick={() => setShowStoryModal(false)}>
              &times;
            </button>
            <h3>Our Journey Since 2015</h3>
            <div className="modal-body-scroll">
              <p>
                Founded in 2015 by Nikhil Deshpande, Diving Sanatan is a holistic wellness platform dedicated to helping individuals navigate life's most important challenges with clarity and confidence. Whether you're seeking guidance for your health, relationships, finances, career, emotional well-being, or personal growth, our personalized counselling and energy-based healing practices are designed to uncover the root cause and restore balance. By integrating the timeless wisdom of Sanatan with modern holistic approaches, we empower individuals to overcome obstacles, make informed life decisions, and experience lasting transformation from within.
              </p>
            </div>
          </div>
        </div>
      )}

      {showCertsModal && (
        <div className="modal-overlay" onClick={() => setShowCertsModal(false)}>
          <div className="modal-content glass-panel" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close-btn" onClick={() => setShowCertsModal(false)}>
              &times;
            </button>
            <h3>Certifications & Accreditations</h3>
            <div className="modal-body-scroll">
              <ul className="certs-detail-list">
                <li>
                  <div className="badge">ISO 9001:2015</div>
                  <div>
                    <h5>Quality Management Standards</h5>
                    <p>Certified for maintaining international quality standards in wellness consulting and online education delivery models.</p>
                  </div>
                </li>
                <li>
                  <div className="badge">IARA</div>
                  <div>
                    <h5>International Association of Reiki Professionals</h5>
                    <p>Accredited curriculum ensuring that all reiki healing practices align with the authentic Usui lineage.</p>
                  </div>
                </li>
                <li>
                  <div className="badge">AADP</div>
                  <div>
                    <h5>American Association of Drugless Practitioners</h5>
                    <p>Professional membership verifying that our practitioners adhere to holistic drugless health standards and ethics.</p>
                  </div>
                </li>
                <li>
                  <div className="badge">GSHC</div>
                  <div>
                    <h5>Global Sound Healing Coalition</h5>
                    <p>Certified sound therapies calibrated strictly to sound frequency guidelines for psychological restoration.</p>
                  </div>
                </li>
              </ul>
            </div>
          </div>
        </div>
      )}

      <Footer />

      <style jsx>{`
        /* ===== Layout ===== */
        .page {
          display: grid;
          grid-template-columns: 240px 1fr 260px;
          gap: 32px;
          padding: 40px 24px 24px;
          max-width: 1600px;
          margin: 0 auto;
          background: transparent;
          min-height: 100vh;
        }

        /* ===== Left Sidebar ===== */
        .sidebar {
          position: relative;
        }

        .sidebar-sticky-wrapper {
          position: sticky;
          top: 94px;
          display: flex;
          flex-direction: column;
          gap: 16px;
          max-height: calc(100vh - 110px);
          overflow-y: auto;
          overflow-x: hidden;
          scrollbar-width: none;
          -ms-overflow-style: none;
        }

        .sidebar-sticky-wrapper::-webkit-scrollbar {
          display: none;
        }

        /* === Search header (matches blog sidebar-search-box) === */
        .about-sidebar-search-box {
          display: flex;
          flex-direction: column;
          gap: 16px;
          flex-shrink: 0;
        }

        .about-sidebar-title-row {
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .about-sidebar-lotus-icon {
          width: 24px;
          height: 24px;
          flex-shrink: 0;
          margin-top: -2px;
        }

        .about-sidebar-heading {
          font-family: var(--font-sans);
          font-size: 1.15rem;
          color: #111827;
          font-weight: 700 !important;
          margin: 0;
        }

        .about-blog-search-wrapper {
          display: flex;
          align-items: center;
          width: 100%;
          background: #ffffff;
          border: 1px solid rgba(168, 85, 247, 0.15);
          border-radius: 12px;
          padding: 0 14px;
          box-sizing: border-box;
          transition: var(--transition-fast);
        }

        .about-blog-search-wrapper:focus-within {
          border-color: rgba(168, 85, 247, 0.4);
          box-shadow: 0 0 0 3px rgba(168, 85, 247, 0.08);
        }

        .about-search-icon {
          color: #a855f7;
          flex-shrink: 0;
          margin-left: 4px;
        }

        .about-search-input {
          flex: 1;
          border: none;
          background: transparent;
          outline: none;
          padding: 10px 0;
          font-family: var(--font-sans);
          font-size: 0.85rem;
          color: #111827;
        }

        .about-search-clear-btn {
          background: none;
          border: none;
          color: hsl(var(--text-muted));
          cursor: pointer;
          font-size: 0.75rem;
          padding: 2px 4px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: color 0.2s ease;
          line-height: 1;
          margin-left: 8px;
        }

        .about-search-clear-btn:hover {
          color: #ef4444;
        }

        /* === Navigation menu (no card — matches blog sidebar transparent style) === */
        .about-sidebar-menu-card {
          background: transparent;
          border-radius: 0;
          border: none;
          box-shadow: none;
          padding: 0;
        }

        .about-sidebar-menu {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        /* === Sidebar item (matches blog .sidebar-item exactly) === */
        .about-sidebar-item {
          width: 100%;
          padding: 10px 14px;
          background: transparent;
          border: none;
          border-radius: 10px;
          display: flex;
          align-items: center;
          gap: 12px;
          cursor: pointer;
          font-family: var(--font-sans);
          transition: var(--transition-fast);
          text-align: left;
        }

        .about-sidebar-item svg {
          color: #a855f7;
          transition: var(--transition-fast);
          width: 16px;
          height: 16px;
          opacity: 0.8;
          flex-shrink: 0;
        }

        .about-sidebar-item:hover {
          background: rgba(168, 85, 247, 0.04);
        }

        .about-sidebar-item:hover svg {
          color: #7c3aed;
          opacity: 1;
        }

        .about-sidebar-item:hover .about-item-name {
          color: #7c3aed;
        }

        .about-sidebar-item.active {
          background: #f3e8ff;
        }

        .about-sidebar-item.active svg {
          color: #6b21a8;
          opacity: 1;
        }

        .about-sidebar-item.active .about-item-name {
          color: #581c87;
          font-weight: 600;
        }

        .about-item-text-container {
          display: flex;
          flex-direction: column;
        }

        .about-item-name {
          font-size: 0.85rem;
          font-weight: 500;
          color: #4b5563;
          font-family: var(--font-sans);
          transition: var(--transition-fast);
        }

        /* === Quote card (inspiration card style) === */
        .about-quote-card {
          background: #fdf4ff;
          border: 1px solid rgba(168, 85, 247, 0.08);
          border-radius: 20px;
          padding: 24px 20px;
          text-align: center;
          color: #4a2b6e;
          transition: transform 0.3s ease;
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .about-quote-card:hover {
          transform: translateY(-2px);
        }

        .about-quote-card h3 {
          font-style: italic;
          font-weight: 500 !important;
          font-size: 0.95rem;
          line-height: 1.5;
          color: #3b0764;
          font-family: var(--font-serif) !important;
        }

        .about-quote-card p {
          font-size: 0.8rem;
          color: #6b4d8a;
          line-height: 1.6;
          margin: 0;
        }

        .about-quote-lotus {
          font-size: 36px;
          color: #d4b8e8;
          line-height: 1;
        }

        /* keep legacy .lotus for section headers */
        .lotus {
          color: #7c3aed;
          font-size: 20px;
        }

        /* ===== Main Column ===== */
        .main {
          display: flex;
          flex-direction: column;
          gap: 28px;
          min-width: 0; /* Prevents flex items from breaking layout widths */
        }

        /* Story Hero */
        .story-hero {
          background: white;
          border-radius: 18px;
          padding: 36px;
          display: grid;
          grid-template-columns: 1.1fr 0.9fr;
          gap: 28px;
          border: 1px solid #f3e8ff;
          position: relative;
          overflow: hidden;
          box-shadow: 0 4px 20px rgba(124, 58, 237, 0.02);
        }

        .story-content {
          display: flex;
          flex-direction: column;
          justify-content: center;
        }

        .story-content h2 {
          text-transform: uppercase;
          letter-spacing: 2px;
          color: #7c3aed;
          font-size: 12px;
          font-weight: 700;
          margin-bottom: 14px;
        }

        .story-content h1 {
          color: #2d1b4e;
          font-size: 34px;
          font-weight: 700;
          line-height: 1.25;
          margin-bottom: 18px;
          font-family: var(--font-serif) !important;
        }

        .story-content p {
          color: #5b4d7a;
          font-size: 14px;
          margin-bottom: 24px;
          line-height: 1.7;
        }

        .learn-btn {
          background: #4a2b6e;
          color: white;
          padding: 12px 26px;
          border-radius: 8px;
          font-weight: 600;
          font-size: 14px;
          width: fit-content;
          transition: all 0.3s ease;
          box-shadow: 0 4px 15px rgba(74, 43, 110, 0.15);
        }

        .learn-btn:hover {
          background: #7c3aed;
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(124, 58, 237, 0.2);
        }

        .story-image {
          background: url('https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=600&h=400&fit=crop') center/cover;
          border-radius: 12px;
          position: relative;
          min-height: 250px;
          box-shadow: inset 0 0 20px rgba(0,0,0,0.05);
        }

        .story-image::after {
          content: "❀";
          position: absolute;
          bottom: 16px;
          left: 16px;
          color: rgba(255,255,255,0.75);
          font-size: 40px;
          line-height: 1;
        }

        /* Sections */
        .section {
          background: white;
          border-radius: 18px;
          padding: 28px;
          border: 1px solid #f3e8ff;
          box-shadow: 0 4px 20px rgba(124, 58, 237, 0.02);
        }

        .section-header {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 24px;
          color: #4a2b6e;
          font-size: 20px;
          font-weight: 700;
          font-family: var(--font-serif) !important;
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
          width: 100%;
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
          width: 100%;
        }
        .featured-card-title {
          font-family: var(--font-serif);
          font-size: 1.1rem;
          color: #1e1b4b;
          font-weight: 700 !important;
          line-height: 1.2;
          margin: 0;
        }
        .featured-card-desc {
          font-size: 0.78rem;
          line-height: 1.45;
          color: #6b7280;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
          margin: 0;
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
          text-decoration: none;
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

        .carousel-wrap {
          position: relative;
        }

        .cards-carousel {
          display: flex;
          gap: 16px;
          overflow-x: auto;
          scroll-behavior: smooth;
          padding: 4px 2px 12px;
          width: 100%;
        }

        .cards-carousel::-webkit-scrollbar {
          display: none;
        }

        .card {
          flex: 0 0 240px;
          background: white;
          border-radius: 12px;
          overflow: hidden;
          border: 1px solid #f3e8ff;
          padding-bottom: 16px;
          transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
          display: flex;
          flex-direction: column;
        }

        .card:hover {
          transform: translateY(-6px);
          box-shadow: 0 10px 25px rgba(124, 58, 237, 0.08);
          border-color: #ede0ff;
        }

        .card-img {
          width: 100%;
          height: 110px;
          object-fit: cover;
          display: block;
        }

        .card-body {
          padding: 12px 12px 0;
          text-align: center;
          display: flex;
          flex-direction: column;
          align-items: center;
        }

        .card-icon {
          width: 36px;
          height: 36px;
          background: #ede0ff;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #7c3aed;
          margin: -24px auto 10px;
          border: 2px solid white;
          font-size: 16px;
          box-shadow: 0 4px 10px rgba(124, 58, 237, 0.1);
        }

        .card h4 {
          color: #2d1b4e;
          font-size: 14px;
          font-weight: 700;
          margin-bottom: 6px;
          font-family: var(--font-serif) !important;
        }

        .card p {
          color: #6b4d8a;
          font-size: 12px;
          line-height: 1.5;
        }

        /* Healers */
        .healer-card {
          flex: 0 0 220px;
          text-align: center;
          background: #fbf7ff;
          border-radius: 12px;
          padding: 20px 14px 16px;
          border: 1px solid #f3e8ff;
          transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
          display: flex;
          flex-direction: column;
          align-items: center;
        }

        .healer-card:hover {
          transform: translateY(-6px);
          background: white;
          box-shadow: 0 10px 25px rgba(124, 58, 237, 0.08);
          border-color: #ede0ff;
        }

        .healer-avatar {
          width: 64px;
          height: 64px;
          border-radius: 50%;
          margin: 0 auto 12px;
          object-fit: cover;
          background: #ede0ff;
          border: 2px solid white;
          box-shadow: 0 4px 12px rgba(124, 58, 237, 0.1);
        }

        .healer-card h4 {
          color: #2d1b4e;
          font-size: 14px;
          font-weight: 700;
          margin-bottom: 4px;
          font-family: var(--font-serif) !important;
        }

        .healer-card .role {
          color: #5b4d7a;
          font-size: 12px;
          margin-bottom: 4px;
          font-weight: 500;
          line-height: 1.3;
        }

        .healer-card .exp {
          color: #7c3aed;
          font-size: 11px;
          font-weight: 600;
          margin-bottom: 12px;
        }

        .healer-card-link {
          font-size: 11px;
          font-weight: 700;
          color: #7c3aed;
          text-decoration: none;
          transition: all 0.2s ease;
          border-bottom: 1px solid transparent;
          padding-bottom: 2px;
        }

        .healer-card-link:hover {
          color: #4a2b6e;
          border-color: #4a2b6e;
        }

        /* Arrows */
        .arrow {
          position: absolute;
          top: 50%;
          transform: translateY(-60%);
          width: 36px;
          height: 36px;
          background: white;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #4a2b6e;
          box-shadow: 0 4px 15px rgba(0,0,0,0.08);
          font-size: 20px;
          z-index: 10;
          cursor: pointer;
          transition: all 0.25s ease;
          border: 1px solid #f3e8ff;
        }

        .arrow:hover {
          background: #7c3aed;
          color: white;
          border-color: #7c3aed;
          transform: translateY(-60%) scale(1.08);
        }

        .arrow.left {
          left: -16px;
        }

        .arrow.right {
          right: -16px;
        }

        /* Dots */
        .dots {
          display: flex;
          justify-content: center;
          gap: 8px;
          margin-top: 20px;
        }

        .dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: #ede0ff;
          transition: all 0.3s ease;
          cursor: pointer;
        }

        .dot.active {
          background: #7c3aed;
          width: 18px;
          border-radius: 4px;
        }

        /* Media & Features */
        .media-features-section {
          background: white;
        }

        .media-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
        }

        .media-item {
          background: #fbf7ff;
          border: 1px solid #f3e8ff;
          border-radius: 12px;
          padding: 24px;
          transition: all 0.3s ease;
        }

        .media-item:hover {
          transform: translateY(-3px);
          background: white;
          box-shadow: 0 8px 25px rgba(124, 58, 237, 0.06);
        }

        .media-logo-placeholder {
          font-family: var(--font-serif) !important;
          font-size: 18px;
          font-weight: 700;
          color: #7c3aed;
          margin-bottom: 12px;
          letter-spacing: 0.5px;
        }

        .media-item h5 {
          color: #2d1b4e;
          font-size: 14px;
          font-weight: 700;
          margin-bottom: 8px;
          font-family: var(--font-serif) !important;
        }

        .media-item p {
          color: #6b4d8a;
          font-size: 12px;
          line-height: 1.6;
        }

        /* ===== Right Panel ===== */
        .right-panel {
          display: flex;
          flex-direction: column;
          gap: 24px;
        }

        .panel {
          background: white;
          border-radius: 18px;
          padding: 24px;
          border: 1px solid #f3e8ff;
          box-shadow: 0 4px 20px rgba(124, 58, 237, 0.02);
        }

        .panel h3 {
          display: flex;
          align-items: center;
          gap: 10px;
          color: #4a2b6e;
          font-size: 17px;
          font-weight: 700;
          margin-bottom: 16px;
          font-family: var(--font-serif) !important;
        }

        .panel p {
          color: #5b4d7a;
          font-size: 13px;
          line-height: 1.6;
        }

        .value {
          display: flex;
          gap: 12px;
          margin-bottom: 16px;
          align-items: flex-start;
        }

        .value:last-child {
          margin-bottom: 0;
        }

        .value-icon {
          width: 32px;
          height: 32px;
          min-width: 32px;
          background: #ede0ff;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #7c3aed;
          font-size: 15px;
          box-shadow: 0 2px 8px rgba(124, 58, 237, 0.08);
        }

        .value h5 {
          color: #2d1b4e;
          font-size: 13px;
          font-weight: 700;
          margin-bottom: 3px;
          font-family: var(--font-serif) !important;
        }

        .value p {
          font-size: 11.5px;
          line-height: 1.4;
        }

        /* Impact */
        .impact-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
        }

        .impact-box {
          background: #fbf7ff;
          border-radius: 12px;
          padding: 16px 10px;
          text-align: center;
          border: 1px solid #f3e8ff;
          transition: transform 0.3s ease;
        }

        .impact-box:hover {
          transform: translateY(-2px);
          background: white;
          border-color: #ede0ff;
        }

        .impact-num {
          color: #7c3aed;
          font-size: 22px;
          font-weight: 700;
          margin-bottom: 4px;
        }

        .impact-label {
          color: #5b4d7a;
          font-size: 11px;
          font-weight: 500;
        }

        /* Certs */
        .certs {
          display: flex;
          gap: 10px;
          margin-bottom: 18px;
          justify-content: center;
        }

        .cert {
          width: 80px;
          height: 60px;
          background: #f7eeff;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 1px solid #ede0ff;
          font-size: 10px;
          color: #7c3aed;
          text-align: center;
          font-weight: 700;
          line-height: 1.3;
          transition: all 0.3s ease;
        }

        .cert:hover {
          transform: scale(1.05);
          background: white;
          border-color: #7c3aed;
          box-shadow: 0 4px 12px rgba(124, 58, 237, 0.08);
        }

        .view-btn {
          width: 100%;
          background: #4a2b6e;
          color: white;
          padding: 11px;
          border-radius: 8px;
          font-weight: 600;
          font-size: 13px;
          transition: all 0.3s ease;
        }

        .view-btn:hover {
          background: #7c3aed;
          box-shadow: 0 4px 15px rgba(124, 58, 237, 0.25);
        }

        /* Testimonial Box */
        .testimonial {
          text-align: center;
          padding: 10px 0;
          min-height: 140px;
          display: flex;
          flex-direction: column;
          justify-content: center;
        }

        .testimonial .quote-mark {
          color: #d4b8e8;
          font-size: 40px;
          line-height: 1;
          font-family: serif;
          margin-bottom: -10px;
        }

        .testimonial p {
          color: #4a2b6e;
          font-style: italic;
          font-size: 13.5px;
          margin: 6px 0 12px;
          line-height: 1.6;
        }

        .testimonial .author {
          color: #7c3aed;
          font-size: 12px;
          font-weight: 600;
        }

        /* ===== Modal Overlay ===== */
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(45, 27, 78, 0.45);
          backdrop-filter: blur(8px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 2000;
          padding: 20px;
          animation: fadeIn 0.35s ease;
        }

        .modal-content {
          background: white;
          border-radius: 20px;
          width: 100%;
          max-width: 550px;
          padding: 36px;
          position: relative;
          box-shadow: 0 20px 50px rgba(74, 43, 110, 0.2);
          border: 1px solid rgba(168, 85, 247, 0.25);
          animation: slideUp 0.35s cubic-bezier(0.16, 1, 0.3, 1);
          max-height: 90vh;
          display: flex;
          flex-direction: column;
        }

        .modal-close-btn {
          position: absolute;
          right: 20px;
          top: 20px;
          font-size: 28px;
          color: #6b4d8a;
          cursor: pointer;
          background: none;
          border: none;
          line-height: 1;
          transition: color 0.2s ease;
        }

        .modal-close-btn:hover {
          color: #7c3aed;
        }

        .modal-content h3 {
          color: #4a2b6e;
          font-size: 22px;
          font-weight: 700;
          margin-bottom: 20px;
          font-family: var(--font-serif) !important;
          border-bottom: 1.5px solid #ede0ff;
          padding-bottom: 10px;
        }

        .modal-body-scroll {
          overflow-y: auto;
          padding-right: 8px;
          font-size: 14px;
          color: #5b4d7a;
          line-height: 1.7;
        }

        .modal-body-scroll p {
          margin-bottom: 20px;
        }

        /* Timeline in modal */
        .timeline {
          display: flex;
          flex-direction: column;
          gap: 16px;
          border-left: 2px solid #ede0ff;
          padding-left: 18px;
          margin-top: 10px;
        }

        .timeline-item {
          position: relative;
        }

        .timeline-item::before {
          content: "";
          position: absolute;
          left: -24px;
          top: 4px;
          width: 10px;
          height: 10px;
          border-radius: 50%;
          background: #7c3aed;
          border: 2px solid white;
          box-shadow: 0 0 0 2px #ede0ff;
        }

        .timeline-item .year {
          font-weight: 700;
          color: #7c3aed;
          font-size: 13px;
        }

        .timeline-item p {
          margin-top: 2px;
          margin-bottom: 0;
          font-size: 12.5px;
          color: #6b4d8a;
        }

        /* Certs detail list */
        .certs-detail-list {
          list-style: none;
          padding: 0;
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .certs-detail-list li {
          display: flex;
          gap: 16px;
          align-items: flex-start;
          border-bottom: 1px dashed #f0e8f5;
          padding-bottom: 14px;
        }

        .certs-detail-list li:last-child {
          border-bottom: none;
          padding-bottom: 0;
        }

        .certs-detail-list .badge {
          background: #ede0ff;
          color: #4a2b6e;
          font-weight: 700;
          font-size: 11px;
          padding: 6px 12px;
          border-radius: 6px;
          min-width: 90px;
          text-align: center;
        }

        .certs-detail-list h5 {
          color: #2d1b4e;
          font-size: 14px;
          font-weight: 700;
          margin-bottom: 4px;
          font-family: var(--font-serif) !important;
        }

        .certs-detail-list p {
          font-size: 12px;
          margin-bottom: 0;
          line-height: 1.5;
        }

        /* Skeletons */
        .skeleton {
          background: linear-gradient(
            90deg,
            #f0e8f5 25%,
            #fbf7ff 50%,
            #f0e8f5 75%
          );
          background-size: 200% 100%;
          animation: pulse-shimmer 1.5s infinite linear;
          border-radius: 8px;
        }

        .skeleton-img {
          width: 100%;
          height: 110px;
          border-radius: 12px 12px 0 0;
        }

        .skeleton-avatar {
          width: 64px;
          height: 64px;
          border-radius: 50%;
          margin: 0 auto 12px;
        }

        .skeleton-title {
          width: 60%;
          height: 14px;
          margin: 12px auto 6px;
        }

        .skeleton-desc {
          width: 80%;
          height: 10px;
          margin: 0 auto 12px;
        }

        .skeleton-role {
          width: 50%;
          height: 10px;
          margin: 0 auto 12px;
        }

        .no-results {
          padding: 30px;
          text-align: center;
          color: #6b4d8a;
          font-size: 14px;
          width: 100%;
        }

        @keyframes pulse-shimmer {
          0% {
            background-position: 200% 0;
          }
          100% {
            background-position: -200% 0;
          }
        }

        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        @keyframes slideUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }

        /* ===== Responsive Layout ===== */
        @media (max-width: 1200px) {
          .page {
            grid-template-columns: 240px 1fr;
            padding: 30px 20px 24px;
            gap: 24px;
          }
          .right-panel {
            grid-column: 1 / -1;
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
            gap: 20px;
          }
        }

        @media (max-width: 968px) {
          .page {
            grid-template-columns: 1fr;
            padding: 30px 20px 24px;
          }
          .sidebar {
            display: none;
          }
          .sidebar-sticky-wrapper {
            position: static;
            max-height: none;
            overflow: visible;
          }
          .right-panel {
            grid-template-columns: 1fr;
          }
          .story-hero {
            grid-template-columns: 1fr;
          }
          .story-image {
            min-height: 200px;
          }
        }
      `}</style>
    </div>
  );
}
