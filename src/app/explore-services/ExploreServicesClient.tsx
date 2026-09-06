"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { formatCurrency } from "@/utils/formatters";
import { Service, Category } from "@/types/database";
import { cachedFetch } from "@/utils/apiCache";
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
  Clock,
  CheckCircle2,
  Calendar,
  Globe,
  ArrowRight,
  Star,
  Eye,
  SlidersHorizontal,
  X,
  Plus,
  Check,
  Zap,
  Tag,
  ChevronLeft,
  ChevronRight
} from "lucide-react";

// Image mapping helper matching site assets
const getServiceImage = (imgName?: string) => {
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

// Key benefits checklist generator per service category
const getServiceHighlights = (service: Service): string[] => {
  const name = (service.name || "").toLowerCase();
  if (name.includes("chakra")) {
    return [
      "7 Energy Centers Deep Scanning & Realignment",
      "Removal of subconscious emotional blockages",
      "Personalized Chakra Balancing Action Plan",
      "100% Online & Confidential 1-on-1 Session"
    ];
  }
  if (name.includes("aura")) {
    return [
      "Complete Bio-field Aura Health Assessment",
      "Identification of energy leakages & negative vibes",
      "Protective Energy Shielding Ritual",
      "Comprehensive Digital Energy Diagnostics Report"
    ];
  }
  if (name.includes("reiki")) {
    return [
      "Universal Life Force restoration & healing",
      "Physical tension & mental stress reduction",
      "Distance Pranic & Reiki energy transmission",
      "Guided post-session grounding instructions"
    ];
  }
  if (name.includes("sound")) {
    return [
      "Singing Bowl & Solfeggio frequency resonance",
      "Deep cellular relaxation & anxiety release",
      "Brainwave synchronization for tranquil sleep",
      "Custom sound bath audio recording provided"
    ];
  }
  if (name.includes("program") || name.includes("mastery")) {
    return [
      "Multi-week guided transformational journey",
      "Daily practice assignments & meditation tracks",
      "Weekly live Q&A with master practitioners",
      "Lifetime access to program materials"
    ];
  }
  return [
    "Holistic 1-on-1 expert consultation",
    "Ancient Vedic & modern energy alignment techniques",
    "Tailored guidance for emotional and spiritual peace",
    "Post-session integration and ongoing support"
  ];
};

export default function ExploreServicesClient() {
  const router = useRouter();

  // Search, Sort & Pagination state
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<"popular" | "price-asc" | "price-desc" | "duration">("popular");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalServices, setTotalServices] = useState(0);
  const limit = 9; // 3 columns x 3 rows per page

  // Data states
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [quickViewService, setQuickViewService] = useState<Service | null>(null);

  // Cart selections state
  const [cartSelections, setCartSelections] = useState<Service[]>([]);

  // Sync cart from localStorage
  useEffect(() => {
    try {
      const stored = window.localStorage.getItem("divingsanatan_selections");
      if (stored) setCartSelections(JSON.parse(stored));
    } catch (e) {
      console.warn("Could not read selections", e);
    }
  }, []);

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

  const totalSelectionsCost = cartSelections.reduce((sum, s) => sum + s.price, 0);

  // Fetch Services from backend with pagination, query & sorting
  useEffect(() => {
    let isMounted = true;
    setLoading(true);

    const params = new URLSearchParams({
      page: String(page),
      limit: String(limit),
      query: searchQuery,
      sortBy: sortBy
    });

    fetch(`/api/services?${params.toString()}`)
      .then(res => res.json())
      .then(json => {
        if (json?.success && isMounted) {
          setServices(json.data || []);
          if (json.pagination) {
            setTotalPages(json.pagination.totalPages || 1);
            setTotalServices(json.pagination.total || 0);
          }
        }
      })
      .catch(err => console.error("Error loading services:", err))
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => { isMounted = false; };
  }, [page, searchQuery, sortBy]);

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    setPage(1);
  };

  const handleSortChange = (value: string) => {
    setSortBy(value as any);
    setPage(1);
  };

  const handleBookNow = (serviceId: string) => {
    router.push(`/booking?service=${serviceId}`);
  };

  return (
    <div className="explore-services-page">
      <Header />

      <main className="explore-main-content">
        {/* SEARCH BAR & SORT HERO HEADER */}
        <section className="explore-hero-banner">
          <div className="hero-inner-container">
            {/* SEARCH BAR & QUICK FILTERS */}
            <div className="search-filter-box">
              <div className="search-input-wrapper">
                <Search size={20} className="search-icon" />
                <input
                  type="text"
                  placeholder="Search by therapy name, chakra, aura, reiki..."
                  value={searchQuery}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  className="search-input-field"
                />
                {searchQuery && (
                  <button
                    type="button"
                    className="clear-search-btn"
                    onClick={() => handleSearchChange("")}
                    aria-label="Clear search"
                  >
                    <X size={16} />
                  </button>
                )}
              </div>

              {/* SORT DROPDOWN */}
              <div className="sort-dropdown-wrapper">
                <SlidersHorizontal size={16} className="sort-icon" />
                <select
                  value={sortBy}
                  onChange={(e) => handleSortChange(e.target.value)}
                  className="sort-select"
                >
                  <option value="popular">Sort: Featured & Popular</option>
                  <option value="price-asc">Price: Low to High</option>
                  <option value="price-desc">Price: High to Low</option>
                  <option value="duration">Duration</option>
                </select>
              </div>
            </div>
          </div>
        </section>

        {/* 3-COLUMN SERVICES CARDS GRID */}
        <section className="services-catalog-section">
          <div className="catalog-container">
            <div className="catalog-header-meta">
              <div className="meta-left">
                <h2 className="catalog-title">All Sacred Therapies</h2>
                <span className="meta-count">
                  Showing {services.length} of {totalServices} services
                  {totalPages > 1 ? ` (Page ${page} of ${totalPages})` : ""}
                </span>
              </div>
            </div>

            {loading ? (
              <div className="loading-grid-skeleton">
                {[1, 2, 3, 4, 5, 6].map(idx => (
                  <div key={idx} className="skeleton-card-large pulse" />
                ))}
              </div>
            ) : services.length === 0 ? (
              <div className="empty-catalog-box">
                <Compass size={48} className="empty-icon" />
                <h3>No therapies found</h3>
                <p>Try adjusting your search query.</p>
                <button
                  type="button"
                  className="reset-filters-btn"
                  onClick={() => handleSearchChange("")}
                >
                  Clear Search
                </button>
              </div>
            ) : (
              <>
                <div className="large-cards-grid">
                  {services.map((srv) => {
                    const inCart = cartSelections.some(s => s.id === srv.id);
                    const highlights = getServiceHighlights(srv);
                    const isPopular = srv.name?.includes("Chakra") || srv.name?.includes("Aura") || srv.name?.includes("Reiki");
                    const isProgram = srv.duration?.includes("Sessions") || srv.duration?.includes("Days");

                    return (
                      <article key={srv.id} className="large-service-card">
                        {/* CARD MEDIA TOP BANNER */}
                        <div className="card-media-banner">
                          <img
                            src={getServiceImage(srv.image)}
                            alt={srv.name}
                            className="card-media-img"
                          />
                          <div className="card-media-overlay" />

                          {/* BADGES */}
                          <div className="media-badge-group top-left">
                            {isPopular && <span className="badge-pill popular"><Sparkles size={12} /> Popular</span>}
                            {isProgram && <span className="badge-pill program"><Flame size={12} /> Program</span>}
                          </div>

                          <div className="media-badge-group top-right">
                            <span className="badge-pill price-pill">{formatCurrency(srv.price)}</span>
                          </div>

                          <div className="media-duration-tag">
                            <Clock size={13} />
                            <span>{srv.duration || "60 Min"}</span>
                            <span className="dot">•</span>
                            <Globe size={13} />
                            <span>Online / Remote</span>
                          </div>
                        </div>

                        {/* CARD BODY CONTENT */}
                        <div className="card-body-content">
                          <div className="card-header-row">
                            <h3 className="card-title">{srv.name}</h3>
                            <div className="rating-pill">
                              <Star size={14} className="star-icon" fill="currentColor" />
                              <span>4.9</span>
                            </div>
                          </div>

                          <p className="card-description">{srv.description}</p>

                          {/* HIGHLIGHTS CHECKLIST */}
                          <div className="card-highlights-box">
                            <h4 className="highlights-title">What's Included & Benefits:</h4>
                            <ul className="highlights-list">
                              {highlights.map((item, idx) => (
                                <li key={idx}>
                                  <CheckCircle2 size={15} className="check-icon" />
                                  <span>{item}</span>
                                </li>
                              ))}
                            </ul>
                          </div>

                          {/* CARD FOOTER ACTIONS */}
                          <div className="card-actions-footer">
                            <button
                              type="button"
                              className="quick-view-btn"
                              onClick={() => setQuickViewService(srv)}
                            >
                              <Eye size={15} />
                              <span>Quick View</span>
                            </button>

                            <button
                              type="button"
                              className="book-now-primary-btn"
                              onClick={() => handleBookNow(srv.id)}
                            >
                              <span>Book Now</span>
                              <ArrowRight size={16} />
                            </button>
                          </div>
                        </div>
                      </article>
                    );
                  })}
                </div>

                {/* BACKEND PAGINATION BAR */}
                {totalPages > 1 && (
                  <div className="pagination-bar">
                    <button
                      type="button"
                      className="pagination-nav-btn"
                      disabled={page <= 1}
                      onClick={() => {
                        setPage(p => Math.max(1, p - 1));
                        window.scrollTo({ top: 50, behavior: 'smooth' });
                      }}
                    >
                      <ChevronLeft size={18} />
                      <span>Previous</span>
                    </button>

                    <div className="pagination-numbers">
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map(pNum => (
                        <button
                          key={pNum}
                          type="button"
                          className={`page-number-btn ${pNum === page ? "active" : ""}`}
                          onClick={() => {
                            setPage(pNum);
                            window.scrollTo({ top: 50, behavior: 'smooth' });
                          }}
                        >
                          {pNum}
                        </button>
                      ))}
                    </div>

                    <button
                      type="button"
                      className="pagination-nav-btn"
                      disabled={page >= totalPages}
                      onClick={() => {
                        setPage(p => Math.min(totalPages, p + 1));
                        window.scrollTo({ top: 50, behavior: 'smooth' });
                      }}
                    >
                      <span>Next</span>
                      <ChevronRight size={18} />
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </section>

        {/* QUICK VIEW MODAL */}
        {quickViewService && (
          <div className="modal-backdrop" onClick={() => setQuickViewService(null)}>
            <div className="modal-content-card" onClick={(e) => e.stopPropagation()}>
              <button
                type="button"
                className="modal-close-btn"
                onClick={() => setQuickViewService(null)}
                aria-label="Close modal"
              >
                <X size={20} />
              </button>

              <div className="modal-banner">
                <img
                  src={getServiceImage(quickViewService.image)}
                  alt={quickViewService.name}
                  className="modal-banner-img"
                />
                <div className="modal-banner-overlay" />
                <div className="modal-title-box">
                  <span className="modal-category-tag">HEALING THERAPY</span>
                  <h2>{quickViewService.name}</h2>
                </div>
              </div>

              <div className="modal-body">
                <div className="modal-meta-row">
                  <div className="meta-badge">
                    <Clock size={16} />
                    <span>Duration: {quickViewService.duration || "60 Min"}</span>
                  </div>
                  <div className="meta-badge">
                    <Tag size={16} />
                    <span>Price: {formatCurrency(quickViewService.price)}</span>
                  </div>
                  <div className="meta-badge">
                    <Globe size={16} />
                    <span>Mode: Live Online Consultation</span>
                  </div>
                </div>

                <div className="modal-section">
                  <h3>About This Therapy</h3>
                  <p>{quickViewService.description}</p>
                </div>

                <div className="modal-section">
                  <h3>Key Deliverables & Expected Outcomes</h3>
                  <ul className="modal-benefits-list">
                    {getServiceHighlights(quickViewService).map((item, idx) => (
                      <li key={idx}>
                        <CheckCircle2 size={16} className="check-icon" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="modal-footer-actions">
                  <button
                    type="button"
                    className="modal-book-btn"
                    onClick={() => handleBookNow(quickViewService.id)}
                  >
                    Confirm & Proceed to Booking <ArrowRight size={16} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      <Footer />

      <style jsx>{`
        .explore-services-page {
          min-height: 100vh;
          background: #faf8fc;
          display: flex;
          flex-direction: column;
        }
        .explore-main-content {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 40px;
          padding-bottom: 60px;
        }

        /* HERO BANNER */
        .explore-hero-banner {
          background: linear-gradient(135deg, #1e1b4b 0%, #311042 50%, #4c1d95 100%);
          color: #ffffff;
          padding: 32px 24px;
          position: relative;
          overflow: hidden;
          box-shadow: 0 10px 30px rgba(0,0,0,0.15);
        }
        .hero-inner-container {
          max-width: 1200px;
          margin: 0 auto;
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          gap: 20px;
          position: relative;
          z-index: 2;
        }
        .hero-badge-pill {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 6px 16px;
          border-radius: 99px;
          background: rgba(255, 255, 255, 0.12);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.2);
          font-size: 0.72rem;
          font-weight: 700;
          letter-spacing: 0.08em;
          color: #f3e8ff;
        }
        .sparkle-icon {
          color: #e9d5ff;
        }
        .hero-main-title {
          font-family: var(--font-serif);
          font-size: 2.75rem;
          font-weight: 700;
          line-height: 1.25;
          max-width: 900px;
          margin: 0;
        }
        .text-gradient-purple {
          background: linear-gradient(135deg, #e9d5ff 0%, #c084fc 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }
        .hero-subtitle {
          font-size: 1.05rem;
          color: #cbd5e1;
          max-width: 750px;
          line-height: 1.6;
          margin: 0;
        }

        /* SEARCH BAR & SORT */
        .search-filter-box {
          width: 100%;
          max-width: 850px;
          display: flex;
          gap: 12px;
          margin-top: 10px;
        }
        .search-input-wrapper {
          flex: 1;
          display: flex;
          align-items: center;
          background: #ffffff;
          border-radius: 14px;
          padding: 4px 16px;
          box-shadow: 0 8px 24px rgba(0,0,0,0.2);
          position: relative;
        }
        .search-icon {
          color: #7c3aed;
          margin-right: 12px;
        }
        .search-input-field {
          width: 100%;
          border: none;
          outline: none;
          font-size: 0.95rem;
          color: #1e1b4b;
          padding: 12px 0;
          background: transparent;
        }
        .clear-search-btn {
          background: transparent;
          border: none;
          color: #94a3b8;
          cursor: pointer;
          padding: 4px;
        }
        .clear-search-btn:hover {
          color: #475569;
        }
        .sort-dropdown-wrapper {
          display: flex;
          align-items: center;
          background: rgba(255, 255, 255, 0.15);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.25);
          border-radius: 14px;
          padding: 0 16px;
          gap: 8px;
        }
        .sort-icon {
          color: #e9d5ff;
        }
        .sort-select {
          background: transparent;
          border: none;
          color: #ffffff;
          font-size: 0.88rem;
          font-weight: 600;
          outline: none;
          cursor: pointer;
          padding: 14px 0;
        }
        .sort-select option {
          background: #1e1b4b;
          color: #ffffff;
        }

        /* CATEGORY PILLS */
        .category-pills-row {
          display: flex;
          flex-wrap: wrap;
          justify-content: center;
          gap: 10px;
          margin-top: 14px;
          max-width: 1000px;
        }
        .category-pill {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 9px 18px;
          border-radius: 99px;
          background: rgba(255, 255, 255, 0.1);
          border: 1px solid rgba(255, 255, 255, 0.18);
          color: #f3e8ff;
          font-size: 0.82rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.25s ease;
        }
        .category-pill:hover {
          background: rgba(255, 255, 255, 0.2);
          transform: translateY(-2px);
        }
        .category-pill.active {
          background: #ffffff;
          color: #4c1d95;
          border-color: #ffffff;
          box-shadow: 0 6px 20px rgba(0,0,0,0.15);
          font-weight: 700;
        }

        /* CATALOG SECTION */
        .services-catalog-section {
          max-width: 1240px;
          margin: 0 auto;
          padding: 0 20px;
          width: 100%;
        }
        .catalog-container {
          display: flex;
          flex-direction: column;
          gap: 24px;
        }
        .catalog-header-meta {
          display: flex;
          justify-content: space-between;
          align-items: flex-end;
          border-bottom: 2px solid rgba(124, 58, 237, 0.1);
          padding-bottom: 14px;
        }
        .catalog-title {
          font-family: var(--font-serif);
          font-size: 1.8rem;
          color: #1e1b4b;
          margin: 0;
          font-weight: 700;
        }
        .meta-count {
          font-size: 0.85rem;
          color: #64748b;
          font-weight: 500;
        }

        /* 3-COLUMN CARDS GRID */
        .large-cards-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 24px;
          width: 100%;
        }

        /* BACKEND PAGINATION BAR */
        .pagination-bar {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 16px;
          margin-top: 40px;
          padding: 20px 0;
        }
        .pagination-nav-btn {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 10px 18px;
          border-radius: 12px;
          background: #ffffff;
          border: 1px solid rgba(124, 58, 237, 0.2);
          color: #4c1d95;
          font-weight: 600;
          font-size: 0.88rem;
          cursor: pointer;
          transition: all 0.2s ease;
          box-shadow: 0 2px 8px rgba(0,0,0,0.04);
        }
        .pagination-nav-btn:hover:not(:disabled) {
          background: #7c3aed;
          color: #ffffff;
          border-color: #7c3aed;
          transform: translateY(-1px);
        }
        .pagination-nav-btn:disabled {
          opacity: 0.4;
          cursor: not-allowed;
          box-shadow: none;
        }
        .pagination-numbers {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .page-number-btn {
          width: 40px;
          height: 40px;
          border-radius: 10px;
          border: 1px solid rgba(124, 58, 237, 0.15);
          background: #ffffff;
          color: #1e1b4b;
          font-weight: 600;
          font-size: 0.9rem;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        .page-number-btn:hover {
          border-color: #7c3aed;
          color: #7c3aed;
        }
        .page-number-btn.active {
          background: #7c3aed;
          color: #ffffff;
          border-color: #7c3aed;
          box-shadow: 0 4px 12px rgba(124, 58, 237, 0.3);
          font-weight: 700;
        }
        .large-service-card {
          background: #ffffff;
          border-radius: 24px;
          border: 1px solid rgba(124, 58, 237, 0.12);
          overflow: hidden;
          box-shadow: 0 10px 30px rgba(0,0,0,0.05);
          display: flex;
          flex-direction: column;
          transition: all 0.35s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .large-service-card:hover {
          transform: translateY(-6px);
          box-shadow: 0 20px 45px rgba(124, 58, 237, 0.12);
          border-color: rgba(124, 58, 237, 0.3);
        }

        /* MEDIA BANNER TOP */
        .card-media-banner {
          position: relative;
          width: 100%;
          height: 240px;
          overflow: hidden;
        }
        .card-media-img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          transition: transform 0.6s ease;
        }
        .large-service-card:hover .card-media-img {
          transform: scale(1.05);
        }
        .card-media-overlay {
          position: absolute;
          inset: 0;
          background: linear-gradient(180deg, rgba(0,0,0,0.3) 0%, rgba(0,0,0,0.7) 100%);
        }
        .media-badge-group {
          position: absolute;
          top: 16px;
          display: flex;
          gap: 8px;
          z-index: 2;
        }
        .media-badge-group.top-left { left: 16px; }
        .media-badge-group.top-right { right: 16px; }
        .badge-pill {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          padding: 6px 12px;
          border-radius: 99px;
          font-size: 0.75rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.04em;
        }
        .badge-pill.popular {
          background: linear-gradient(135deg, #a855f7 0%, #ec4899 100%);
          color: #ffffff;
          box-shadow: 0 4px 12px rgba(236, 72, 153, 0.3);
        }
        .badge-pill.program {
          background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
          color: #ffffff;
        }
        .badge-pill.price-pill {
          background: #ffffff;
          color: #7c3aed;
          font-size: 0.95rem;
          font-family: var(--font-serif);
          box-shadow: 0 4px 14px rgba(0,0,0,0.2);
        }
        .media-duration-tag {
          position: absolute;
          bottom: 16px;
          left: 16px;
          right: 16px;
          display: flex;
          align-items: center;
          gap: 8px;
          color: #f1f5f9;
          font-size: 0.8rem;
          font-weight: 600;
          z-index: 2;
          background: rgba(0, 0, 0, 0.45);
          backdrop-filter: blur(8px);
          padding: 6px 14px;
          border-radius: 10px;
          width: fit-content;
        }
        .dot { opacity: 0.5; }

        /* BODY CONTENT */
        .card-body-content {
          padding: 24px;
          display: flex;
          flex-direction: column;
          gap: 16px;
          flex: 1;
        }
        .card-header-row {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 12px;
        }
        .card-title {
          font-family: var(--font-serif);
          font-size: 1.35rem;
          color: #1e1b4b;
          margin: 0;
          font-weight: 700;
          line-height: 1.3;
        }
        .rating-pill {
          display: flex;
          align-items: center;
          gap: 4px;
          background: #fef9c3;
          color: #a16207;
          padding: 4px 10px;
          border-radius: 99px;
          font-size: 0.78rem;
          font-weight: 700;
          flex-shrink: 0;
        }
        .star-icon { color: #eab308; }
        .card-description {
          font-size: 0.9rem;
          color: #475569;
          line-height: 1.6;
          margin: 0;
        }

        /* HIGHLIGHTS CHECKLIST */
        .card-highlights-box {
          background: #faf5ff;
          border: 1px solid rgba(168, 85, 247, 0.12);
          border-radius: 14px;
          padding: 14px 16px;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .highlights-title {
          font-size: 0.78rem;
          font-weight: 700;
          color: #6d28d9;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          margin: 0;
        }
        .highlights-list {
          list-style: none;
          padding: 0;
          margin: 0;
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        .highlights-list li {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 0.82rem;
          color: #334155;
        }
        .check-icon {
          color: #7c3aed;
          flex-shrink: 0;
        }

        /* CARD FOOTER ACTIONS */
        .card-actions-footer {
          display: flex;
          gap: 10px;
          margin-top: auto;
          padding-top: 10px;
        }
        .quick-view-btn, .cart-btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          padding: 12px 14px;
          border-radius: 12px;
          font-size: 0.82rem;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.2s ease;
          border: 1px solid rgba(124, 58, 237, 0.2);
          background: #ffffff;
          color: #6d28d9;
        }
        .quick-view-btn:hover, .cart-btn:hover {
          background: #f3e8ff;
        }
        .cart-btn.in-cart {
          background: #7c3aed;
          color: #ffffff;
          border-color: #7c3aed;
        }
        .book-now-primary-btn {
          flex: 1;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 12px 20px;
          border-radius: 12px;
          background: linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%);
          color: #ffffff;
          font-weight: 700;
          font-size: 0.88rem;
          border: none;
          cursor: pointer;
          box-shadow: 0 4px 14px rgba(124, 58, 237, 0.25);
          transition: all 0.25s ease;
        }
        .book-now-primary-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 24px rgba(124, 58, 237, 0.35);
        }

        /* EMPTY STATE */
        .empty-catalog-box {
          text-align: center;
          padding: 60px 20px;
          background: #ffffff;
          border-radius: 24px;
          border: 1px solid rgba(124, 58, 237, 0.1);
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 12px;
        }
        .empty-icon { color: #a855f7; opacity: 0.6; }
        .reset-filters-btn {
          padding: 10px 20px;
          border-radius: 10px;
          background: #7c3aed;
          color: #ffffff;
          border: none;
          font-weight: 600;
          cursor: pointer;
          margin-top: 10px;
        }

        /* SKELETON LOADING */
        .loading-grid-skeleton {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 32px;
        }
        .skeleton-card-large {
          height: 480px;
          background: #e2e8f0;
          border-radius: 24px;
        }
        .pulse {
          animation: pulse 1.5s infinite ease-in-out;
        }
        @keyframes pulse {
          0% { opacity: 0.6; }
          50% { opacity: 0.3; }
          100% { opacity: 0.6; }
        }

        /* QUICK VIEW MODAL */
        .modal-backdrop {
          position: fixed;
          inset: 0;
          background: rgba(15, 23, 42, 0.7);
          backdrop-filter: blur(8px);
          z-index: 2000;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
        }
        .modal-content-card {
          background: #ffffff;
          width: 100%;
          max-width: 680px;
          max-height: 90vh;
          border-radius: 28px;
          overflow-y: auto;
          position: relative;
          box-shadow: 0 25px 60px rgba(0,0,0,0.3);
          display: flex;
          flex-direction: column;
          animation: modalPop 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        }
        @keyframes modalPop {
          from { transform: scale(0.92); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
        .modal-close-btn {
          position: absolute;
          top: 16px;
          right: 16px;
          z-index: 10;
          width: 36px;
          height: 36px;
          border-radius: 50%;
          background: rgba(0, 0, 0, 0.5);
          color: #ffffff;
          border: none;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .modal-banner {
          position: relative;
          height: 220px;
          width: 100%;
        }
        .modal-banner-img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        .modal-banner-overlay {
          position: absolute;
          inset: 0;
          background: linear-gradient(180deg, rgba(0,0,0,0.2) 0%, rgba(15, 23, 42, 0.85) 100%);
        }
        .modal-title-box {
          position: absolute;
          bottom: 20px;
          left: 24px;
          right: 24px;
          color: #ffffff;
          z-index: 2;
        }
        .modal-category-tag {
          font-size: 0.72rem;
          font-weight: 800;
          letter-spacing: 0.08em;
          color: #c084fc;
        }
        .modal-title-box h2 {
          font-family: var(--font-serif);
          font-size: 1.6rem;
          margin: 4px 0 0;
        }
        .modal-body {
          padding: 24px;
          display: flex;
          flex-direction: column;
          gap: 20px;
        }
        .modal-meta-row {
          display: flex;
          flex-wrap: wrap;
          gap: 12px;
        }
        .meta-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background: #f1f5f9;
          padding: 8px 14px;
          border-radius: 10px;
          font-size: 0.82rem;
          font-weight: 600;
          color: #334155;
        }
        .modal-section h3 {
          font-size: 0.95rem;
          font-weight: 700;
          color: #1e1b4b;
          margin: 0 0 8px;
        }
        .modal-section p {
          font-size: 0.9rem;
          color: #475569;
          line-height: 1.6;
          margin: 0;
        }
        .modal-benefits-list {
          list-style: none;
          padding: 0;
          margin: 0;
          display: flex;
          flex-direction: column;
          gap: 10px;
        }
        .modal-benefits-list li {
          display: flex;
          align-items: center;
          gap: 10px;
          font-size: 0.88rem;
          color: #334155;
        }
        .modal-footer-actions {
          display: flex;
          gap: 12px;
          margin-top: 10px;
          padding-top: 16px;
          border-top: 1px solid #e2e8f0;
        }
        .modal-cart-btn {
          padding: 12px 18px;
          border-radius: 12px;
          border: 1px solid rgba(124, 58, 237, 0.25);
          background: #faf5ff;
          color: #6d28d9;
          font-weight: 700;
          font-size: 0.85rem;
          cursor: pointer;
        }
        .modal-book-btn {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 12px 20px;
          border-radius: 12px;
          background: #7c3aed;
          color: #ffffff;
          font-weight: 700;
          font-size: 0.9rem;
          border: none;
          cursor: pointer;
        }

        /* BOTTOM CART DRAWER */
        .bottom-cart-drawer {
          position: fixed;
          bottom: 0;
          left: 0;
          right: 0;
          background: rgba(255, 255, 255, 0.96);
          backdrop-filter: blur(20px);
          border-top: 2px solid #a855f7;
          box-shadow: 0 -10px 40px rgba(0,0,0,0.1);
          z-index: 1500;
          padding: 16px 24px;
        }
        .drawer-container {
          max-width: 1200px;
          margin: 0 auto;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .drawer-info {
          display: flex;
          flex-direction: column;
        }
        .drawer-count {
          font-size: 0.8rem;
          color: #64748b;
          font-weight: 600;
        }
        .drawer-total {
          font-family: var(--font-serif);
          font-size: 1.3rem;
          font-weight: 700;
          color: #7c3aed;
        }
        .drawer-btns {
          display: flex;
          gap: 12px;
        }
        .drawer-clear-btn {
          background: transparent;
          border: 1px solid #cbd5e1;
          padding: 10px 16px;
          border-radius: 10px;
          font-weight: 600;
          cursor: pointer;
        }
        .drawer-checkout-btn {
          background: #7c3aed;
          color: #ffffff;
          border: none;
          padding: 10px 22px;
          border-radius: 10px;
          font-weight: 700;
          cursor: pointer;
        }

        /* RESPONSIVE DESIGN */
        @media (max-width: 1180px) {
          .large-cards-grid { grid-template-columns: repeat(2, 1fr); }
          .loading-grid-skeleton { grid-template-columns: repeat(2, 1fr); }
        }

        @media (max-width: 768px) {
          .large-cards-grid { grid-template-columns: 1fr; }
          .loading-grid-skeleton { grid-template-columns: 1fr; }
          .search-filter-box { flex-direction: column; }
          .catalog-header-meta { flex-direction: column; align-items: flex-start; gap: 4px; }
          .card-actions-footer { flex-wrap: wrap; }
          .book-now-primary-btn { width: 100%; }
        }
      `}</style>
    </div>
  );
}
