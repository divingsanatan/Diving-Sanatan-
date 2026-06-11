"use client";

import React, { useState, useEffect } from "react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { formatCurrency } from "@/utils/formatters";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { Service, Category } from "@/types/database";

export default function Home() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [services, setServices] = useState<Service[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [recommended, setRecommended] = useState<Service[]>([]);
  const [categorized, setCategorized] = useState<Service[]>([]);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [loading, setLoading] = useState(true);

  // Fetch services and categories from API
  useEffect(() => {
    async function fetchStorefrontData() {
      try {
        const [servRes, catRes] = await Promise.all([
          fetch("/api/services"),
          fetch("/api/categories")
        ]);
        
        const servJson = await servRes.json();
        const catJson = await catRes.json();
        
        if (servJson.success && catJson.success) {
          setServices(servJson.data);
          setCategories(catJson.data);
          
          // Seed initial recommendations
          const recNames = ["Aura Balancing", "Crystal Healing", "Chakra Clearing"];
          const recList = servJson.data.filter((s: Service) => recNames.includes(s.name));
          setRecommended(recList.length ? recList : servJson.data.slice(0, 3));
          setCategorized(servJson.data);
        }
      } catch (err) {
        console.error("Failed to load storefront data:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchStorefrontData();
  }, []);

  // Handle Search Submission
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    router.push(`/search?query=${encodeURIComponent(searchQuery)}`);
  };

  // Quick feelings links
  const feelings = [
    { label: "Anxious and Lost", query: "anxious and lost" },
    { label: "Stressed and Fatigued", query: "stress and fatigue" },
    { label: "Need Mental Clarity", query: "clarity and focus" },
    { label: "Spiritual Blockage", query: "spiritual blockage" }
  ];

  // Filter categorized services by category tab
  const tabList = ["all", ...categories.map(c => c.name)];
  
  const handleCategoryChange = (catName: string) => {
    setSelectedCategory(catName);
    if (catName === "all") {
      setCategorized(services);
    } else {
      setCategorized(services.filter(s => 
        s.categories?.some(c => c.toLowerCase() === catName.toLowerCase())
      ));
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>
      <Header />
      
      {/* Hero Search Section */}
      <section className="hero-banner">
        <div className="hero-content">
          <h1 className="hero-title">How can we guide you today?</h1>
          <p className="hero-subtitle">Enter your feelings, spiritual blockers, or healing needs...</p>
          
          <form onSubmit={handleSearchSubmit} className="search-bar-form">
            <div className="search-input-wrapper">
              <svg className="search-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor" width="20" height="20">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                placeholder="I am struggling with stress and need peace..."
                className="search-input"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <button type="submit" className="search-submit-btn">
                Seek Guidance
              </button>
            </div>
          </form>

          {/* Quick Feelings Buttons */}
          <div className="feelings-tag-container">
            <span className="feelings-label">Common Seekings:</span>
            {feelings.map((f, i) => (
              <button
                key={i}
                className="feeling-tag"
                onClick={() => router.push(`/search?query=${encodeURIComponent(f.query)}`)}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Recommended Services */}
      <main className="main-content">
        <section className="service-section">
          <div className="section-header">
            <h2 className="section-title">Recommended For You</h2>
            <p className="section-desc">Highly impactful energy balancing services chosen for core alignment</p>
          </div>
          
          {loading ? (
            <div className="loading-grid">
              {[1, 2, 3].map(i => (
                <div key={i} className="skeleton-card" />
              ))}
            </div>
          ) : (
            <div className="services-grid">
              {recommended.map(srv => (
                <Card key={srv.id} className="service-card" variant="glowing">
                  <div className="card-top">
                    <div className="category-badges">
                      {srv.categories && srv.categories.length > 0 ? (
                        srv.categories.map(cat => (
                          <span key={cat} className="category-badge">{cat}</span>
                        ))
                      ) : (
                        <span className="category-badge">{srv.category}</span>
                      )}
                    </div>
                    <span className="price-tag">{formatCurrency(srv.price)}</span>
                  </div>
                  
                  <h3 className="card-service-title">{srv.name}</h3>
                  <p className="card-service-desc">{srv.description}</p>
                  
                  <div className="card-practitioner-row">
                    <span>Practitioner: <strong>{srv.practitioner}</strong></span>
                    <span className="card-rating">★ {srv.rating}</span>
                  </div>
                  
                  <div className="card-action-row">
                    <Button 
                      variant="gold" 
                      onClick={() => router.push(`/booking?service=${srv.id}`)}
                      style={{ width: "100%" }}
                    >
                      Schedule Appointment
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </section>

        {/* Categorized For You */}
        <section className="service-section">
          <div className="section-header">
            <h2 className="section-title">Explore Healing Services</h2>
            <p className="section-desc">Filter services by discipline and schedule your path to mindfulness</p>
          </div>

          <div className="category-tabs">
            {tabList.map(cat => (
              <button
                key={cat}
                className={`category-tab-btn ${selectedCategory === cat ? "active" : ""}`}
                onClick={() => handleCategoryChange(cat)}
              >
                {cat === "all" ? "All Disciplines" : cat}
              </button>
            ))}
          </div>

          <div className="services-grid" style={{ marginTop: "40px" }}>
            {categorized.map(srv => (
              <Card key={srv.id} className="service-card" variant="glass">
                <div className="card-top">
                  <div className="category-badges">
                    {srv.categories && srv.categories.length > 0 ? (
                      srv.categories.map(cat => (
                        <span key={cat} className="category-badge">{cat}</span>
                      ))
                    ) : (
                      <span className="category-badge">{srv.category}</span>
                    )}
                  </div>
                  <span className="price-tag">{formatCurrency(srv.price)}</span>
                </div>
                
                <h3 className="card-service-title">{srv.name}</h3>
                <p className="card-service-desc">{srv.description}</p>
                
                <div className="card-practitioner-row">
                  <span>Practitioner: <strong>{srv.practitioner}</strong></span>
                  <span className="card-rating">★ {srv.rating}</span>
                </div>
                
                <div className="card-action-row">
                  <Button 
                    variant="gold-outline" 
                    onClick={() => router.push(`/booking?service=${srv.id}`)}
                    style={{ width: "100%" }}
                  >
                    Schedule Appointment
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </section>

        {/* Dynamic Philosophy Quote Section */}
        <section className="philosophy-section">
          <div className="philosophy-content">
            <p className="philosophy-symbol">❦</p>
            <p className="philosophy-quote">
              &ldquo;The soul is dyed the color of its thoughts. Wellness is the alignment of spiritual intention with cellular peace.&rdquo;
            </p>
            <p className="philosophy-author">Diving Sanatan Manifesto</p>
          </div>
        </section>
      </main>

      <Footer />

      <style jsx>{`
        .hero-banner {
          padding: 120px 24px 80px;
          text-align: center;
          background: radial-gradient(circle at center, rgba(168, 85, 247, 0.08) 0%, transparent 60%);
          display: flex;
          justify-content: center;
          align-items: center;
          flex-direction: column;
        }
        .hero-content {
          max-width: 800px;
          width: 100%;
        }
        .hero-title {
          font-size: 3.2rem;
          margin-bottom: 16px;
          background: linear-gradient(135deg, #db2777 0%, #7c3aed 60%, #2563eb 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          text-shadow: 0 0 40px rgba(168, 85, 247, 0.1);
        }
        .hero-subtitle {
          font-size: 1.15rem;
          color: hsl(var(--text-muted));
          margin-bottom: 40px;
        }
        .search-bar-form {
          width: 100%;
          display: flex;
          justify-content: center;
        }
        .search-input-wrapper {
          position: relative;
          display: flex;
          align-items: center;
          width: 100%;
          max-width: 650px;
          background: rgba(255, 255, 255, 0.95);
          backdrop-filter: blur(12px);
          border: 1.5px solid var(--gold-border);
          border-radius: 99px;
          padding: 8px 8px 8px 20px;
          box-shadow: 0 8px 32px rgba(0,0,0,0.03), 0 0 20px var(--gold-glow);
          transition: var(--transition-smooth);
        }
        .search-input-wrapper:focus-within {
          border-color: #7c3aed;
          box-shadow: 0 8px 40px rgba(0,0,0,0.05), 0 0 30px rgba(168, 85, 247, 0.3);
        }
        .search-icon {
          color: #7c3aed;
          margin-right: 12px;
        }
        .search-input {
          flex: 1;
          background: transparent;
          border: none;
          outline: none;
          color: hsl(var(--text-cream));
          font-size: 1.05rem;
          font-family: var(--font-sans);
          padding-right: 16px;
        }
        .search-input::placeholder {
          color: rgba(0, 0, 0, 0.4);
        }
        .search-submit-btn {
          font-family: var(--font-serif);
          font-weight: 700;
          font-size: 0.85rem;
          letter-spacing: 0.05em;
          text-transform: uppercase;
          background: var(--btn-gold-bg);
          color: var(--btn-gold-text);
          border: 1px solid var(--btn-gold-border);
          padding: 12px 24px;
          border-radius: 99px;
          cursor: pointer;
          transition: var(--transition-smooth);
        }
        .search-submit-btn:hover {
          filter: brightness(1.1);
          transform: scale(1.02);
        }
        .feelings-tag-container {
          margin-top: 24px;
          display: flex;
          justify-content: center;
          align-items: center;
          flex-wrap: wrap;
          gap: 12px;
        }
        .feelings-label {
          font-size: 0.85rem;
          color: hsl(var(--text-muted));
          margin-right: 8px;
        }
        .feeling-tag {
          background: rgba(168, 85, 247, 0.05);
          border: 1px solid rgba(168, 85, 247, 0.15);
          color: #6d28d9;
          padding: 6px 14px;
          border-radius: 99px;
          font-size: 0.8rem;
          cursor: pointer;
          transition: var(--transition-fast);
        }
        .feeling-tag:hover {
          background: rgba(168, 85, 247, 0.12);
          border-color: #7c3aed;
        }
        .main-content {
          max-width: 1200px;
          margin: 0 auto;
          padding: 40px 24px;
          width: 100%;
        }
        .service-section {
          margin-bottom: 80px;
        }
        .section-header {
          margin-bottom: 40px;
          text-align: center;
        }
        .section-title {
          font-size: 2.1rem;
          color: #4c1d95;
          margin-bottom: 12px;
        }
        .section-desc {
          color: hsl(var(--text-muted));
          font-size: 0.95rem;
        }
        .services-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
          gap: 32px;
        }
        .service-card {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        .card-top {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .category-badges {
          display: flex;
          gap: 6px;
          flex-wrap: wrap;
        }
        .category-badge {
          background: rgba(16, 185, 129, 0.08);
          border: 1px solid rgba(16, 185, 129, 0.2);
          color: #065f46;
          font-size: 0.75rem;
          font-weight: 600;
          padding: 4px 10px;
          border-radius: 6px;
          text-transform: uppercase;
        }
        .price-tag {
          font-family: var(--font-serif);
          color: #db2777;
          font-weight: 700;
          font-size: 1.2rem;
        }
        .card-service-title {
          font-size: 1.35rem;
          margin-bottom: 4px;
          color: hsl(var(--text-cream));
        }
        .card-service-desc {
          font-size: 0.88rem;
          flex: 1;
          margin-bottom: 12px;
        }
        .card-practitioner-row {
          display: flex;
          justify-content: space-between;
          font-size: 0.85rem;
          border-top: 1px solid rgba(0,0,0,0.05);
          padding-top: 16px;
          color: hsl(var(--text-muted));
        }
        .card-rating {
          color: #d97706;
          font-weight: 600;
        }
        .card-action-row {
          margin-top: 8px;
        }
        .category-tabs {
          display: flex;
          justify-content: center;
          gap: 16px;
          margin-bottom: 20px;
          border-bottom: 1.5px solid rgba(0,0,0,0.06);
          padding-bottom: 16px;
        }
        .category-tab-btn {
          background: transparent;
          border: none;
          color: hsl(var(--text-muted));
          font-family: var(--font-serif);
          font-size: 0.95rem;
          font-weight: 600;
          padding: 8px 20px;
          cursor: pointer;
          letter-spacing: 0.05em;
          text-transform: uppercase;
          transition: var(--transition-fast);
          position: relative;
        }
        .category-tab-btn:hover {
          color: #7c3aed;
        }
        .category-tab-btn.active {
          color: #7c3aed;
        }
        .category-tab-btn.active::after {
          content: '';
          position: absolute;
          bottom: -17.5px;
          left: 0;
          right: 0;
          height: 2px;
          background: #7c3aed;
          box-shadow: 0 0 10px rgba(124, 58, 237, 0.4);
        }
        .philosophy-section {
          padding: 60px 24px;
          text-align: center;
          border-top: 1px solid rgba(0,0,0,0.06);
          border-bottom: 1px solid rgba(0,0,0,0.06);
        }
        .philosophy-symbol {
          font-size: 2rem;
          color: #db2777;
          margin-bottom: 16px;
        }
        .philosophy-quote {
          font-family: var(--font-serif);
          font-size: 1.6rem;
          font-style: italic;
          max-width: 800px;
          margin: 0 auto 16px;
          color: #4c1d95;
          line-height: 1.5;
        }
        .philosophy-author {
          font-size: 0.85rem;
          text-transform: uppercase;
          letter-spacing: 0.12em;
          color: hsl(var(--text-muted));
        }
        .loading-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 32px;
        }
        .skeleton-card {
          height: 300px;
          background: rgba(0,0,0,0.03);
          border-radius: 20px;
          animation: pulse 1.8s infinite ease-in-out;
        }
        @keyframes pulse {
          0%, 100% { opacity: 0.6; }
          50% { opacity: 1; }
        }
        @media (max-width: 768px) {
          .hero-title {
            font-size: 2.2rem;
          }
          .philosophy-quote {
            font-size: 1.25rem;
          }
          .category-tabs {
            flex-wrap: wrap;
            gap: 8px;
          }
          .loading-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
}
