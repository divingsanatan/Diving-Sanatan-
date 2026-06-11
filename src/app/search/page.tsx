"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { formatCurrency } from "@/utils/formatters";

import { Service, Category } from "@/types/database";

function SearchPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [query, setQuery] = useState(searchParams.get("query") || "");
  const [category, setCategory] = useState(searchParams.get("category") || "all");
  const [duration, setDuration] = useState(searchParams.get("duration") || "all");
  const [price, setPrice] = useState(searchParams.get("price") || "200");
  
  const [services, setServices] = useState<Service[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [filteredServices, setFilteredServices] = useState<Service[]>([]);
  const [selections, setSelections] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);

  // Aura analyzer state based on query words
  const [auraReport, setAuraReport] = useState<{
    resonance: number;
    description: string;
    chakras: { name: string; key: string; value: number; color: string }[];
  } | null>(null);

  // 1. Fetch catalog
  useEffect(() => {
    async function loadCatalog() {
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
        }
      } catch (err) {
        console.error("Error loading services/categories:", err);
      } finally {
        setLoading(false);
      }
    }
    loadCatalog();
  }, []);

  // 2. Load selections from localStorage on mount
  useEffect(() => {
    try {
      const stored = window.localStorage.getItem("divingsanatan_selections");
      if (stored) {
        setSelections(JSON.parse(stored));
      }
    } catch (e) {
      console.warn("Could not read selections", e);
    }
  }, []);

  // 3. Filter services & calculate Aura scan when parameters change
  useEffect(() => {
    let result = [...services];
    
    // Apply Query
    if (query) {
      const q = query.toLowerCase();
      result = result.filter(s => 
        s.name.toLowerCase().includes(q) || 
        s.description.toLowerCase().includes(q) || 
        s.categories?.some(c => c.toLowerCase().includes(q))
      );
    }

    // Apply Category
    if (category !== "all") {
      result = result.filter(s => 
        s.categories?.some(c => c.toLowerCase() === category.toLowerCase())
      );
    }

    // Apply Duration
    if (duration !== "all") {
      result = result.filter(s => s.duration.toLowerCase() === duration.toLowerCase());
    }

    // Apply Price Limit
    result = result.filter(s => s.price <= Number(price));

    setFilteredServices(result);

    // Compute Aura Report from search text
    if (query) {
      const q = query.toLowerCase();
      let rootVal = 75, sacralVal = 80, solarVal = 80, heartVal = 78, throatVal = 80, eyeVal = 82, crownVal = 85;
      let description = "Your overall energy fields represent a moderately balanced flow of life force (Prana). Regular crystal grid layouts will help maintain this equilibrium.";

      if (q.includes("anxious") || q.includes("lost") || q.includes("fear") || q.includes("stress") || q.includes("worry") || q.includes("panic")) {
        rootVal = 35;
        solarVal = 48;
        sacralVal = 55;
        eyeVal = 60;
        description = "Chakra scan shows structural stress compression in your Root (survival security) and Solar Plexus (willpower/anxiety). Somatic breathing exercises, guided reiki, and grounded crystal balances are highly recommended.";
      } else if (q.includes("sad") || q.includes("broken") || q.includes("grief") || q.includes("heart") || q.includes("lonely") || q.includes("depressed")) {
        heartVal = 30;
        throatVal = 45;
        crownVal = 65;
        description = "Chakra scan registers high blockages in your Heart chakra (emotional flow) and Throat chakra (unexpressed grief). Seek sound wave healing and intensive energy counselors to release these blockades.";
      } else if (q.includes("angry") || q.includes("frustrated") || q.includes("mad") || q.includes("rage")) {
        solarVal = 32;
        heartVal = 50;
        sacralVal = 42;
        description = "High thermal heat registers in your Solar Plexus (ego/anger) node. Grounding crystal fields (like Jasper or Obsidian) and water therapy sessions are recommended to cool down this region.";
      }

      const resonance = Math.round((rootVal + sacralVal + solarVal + heartVal + throatVal + eyeVal + crownVal) / 7);
      
      setAuraReport({
        resonance,
        description,
        chakras: [
          { name: "Crown", key: "crown", value: crownVal, color: "#a855f7" },
          { name: "Third Eye", key: "thirdeye", value: eyeVal, color: "#6366f1" },
          { name: "Throat", key: "throat", value: throatVal, color: "#06b6d4" },
          { name: "Heart", key: "heart", value: heartVal, color: "#22c55e" },
          { name: "Solar Plexus", key: "solar", value: solarVal, color: "#eab308" },
          { name: "Sacral", key: "sacral", value: sacralVal, color: "#f97316" },
          { name: "Root", key: "root", value: rootVal, color: "#ef4444" },
        ]
      });
    } else {
      setAuraReport(null);
    }
  }, [services, query, category, duration, price]);

  // Handle cart selection toggle
  const toggleSelection = (srv: Service) => {
    let next: Service[];
    if (selections.some(s => s.id === srv.id)) {
      next = selections.filter(s => s.id !== srv.id);
    } else {
      next = [...selections, srv];
    }
    setSelections(next);
    window.localStorage.setItem("divingsanatan_selections", JSON.stringify(next));
  };

  const clearSelections = () => {
    setSelections([]);
    window.localStorage.removeItem("divingsanatan_selections");
  };

  const handleCheckout = () => {
    if (selections.length === 0) return;
    router.push("/checkout");
  };

  const totalSelectionsCost = selections.reduce((s, x) => s + x.price, 0);

  return (
    <div style={{ display: "flex", flexDirection: "column", minHeight: "100vh", paddingBottom: selections.length > 0 ? "140px" : "0" }}>
      <Header />

      <main className="search-container">
        
        {/* Search header filters */}
        <section className="search-controls-card glass-panel">
          <h2 className="search-header-title">Search Results Page</h2>
          <p style={{ color: "hsl(var(--text-muted))", fontSize: "0.9rem", marginBottom: "20px" }}>
            Refining services and vibrational frequency outputs based on your search metrics.
          </p>

          <div className="filters-row">
            {/* Query */}
            <div className="filter-group">
              <label>Emotional Query</label>
              <input 
                type="text" 
                className="glass-input" 
                value={query} 
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search feelings..."
              />
            </div>

            {/* Type */}
            <div className="filter-group">
              <label>Service Category</label>
              <select className="glass-input" value={category} onChange={(e) => setCategory(e.target.value)}>
                <option value="all">All Categories</option>
                {categories.map(cat => (
                  <option key={cat.id} value={cat.name.toLowerCase()}>{cat.name}</option>
                ))}
              </select>
            </div>

            {/* Duration */}
            <div className="filter-group">
              <label>Duration</label>
              <select className="glass-input" value={duration} onChange={(e) => setDuration(e.target.value)}>
                <option value="all">Any Duration</option>
                <option value="1 Hour">1 Hour</option>
                <option value="1.5 Hours">1.5 Hours</option>
              </select>
            </div>

            {/* Price Max */}
            <div className="filter-group">
              <label>Max Price ({formatCurrency(Number(price))})</label>
              <input 
                type="range" 
                min="50" 
                max="200" 
                step="10" 
                value={price} 
                onChange={(e) => setPrice(e.target.value)} 
                className="price-range-slider"
              />
            </div>
          </div>
        </section>

        {/* Dynamic Grid: Services List + Aura Scan Report */}
        <section className="search-layout-split">
          
          {/* Services List */}
          <div className="services-column">
            <h3 className="column-title">Available Services ({filteredServices.length})</h3>
            
            {loading ? (
              <p>Calibrating search outputs...</p>
            ) : filteredServices.length === 0 ? (
              <div className="empty-state glass-card">
                <p>No matching energy alignments found. Try adjusting your query words or resetting filters.</p>
              </div>
            ) : (
              <div className="services-vertical-list">
                {filteredServices.map(srv => {
                  const isSelected = selections.some(s => s.id === srv.id);
                  return (
                    <Card key={srv.id} className="service-row-card" variant={isSelected ? "glowing" : "glass"}>
                      <div className="row-content">
                        <div className="row-main-info">
                          <div className="row-header">
                            <div className="category-badges">
                              {srv.categories && srv.categories.length > 0 ? (
                                srv.categories.map(cat => (
                                  <span key={cat} className="row-category" style={{ marginRight: '6px' }}>{cat}</span>
                                ))
                              ) : (
                                <span className="row-category">{srv.category}</span>
                              )}
                            </div>
                            <span className="row-price">{formatCurrency(srv.price)}</span>
                          </div>
                          <h4 className="row-title">{srv.name}</h4>
                          <p className="row-desc">{srv.description}</p>
                          <div className="row-footer">
                            <span>Duration: <strong>{srv.duration}</strong></span>
                            <span>Practitioner: <strong>{srv.practitioner}</strong></span>
                          </div>
                        </div>
                        <div className="row-actions">
                          <button 
                            className={`checkbox-selection-btn ${isSelected ? "selected" : ""}`}
                            onClick={() => toggleSelection(srv)}
                            title={isSelected ? "Deselect Service" : "Select Service"}
                          >
                            {isSelected ? "✓" : "+"}
                          </button>
                          <Button 
                            variant="gold"
                            size="sm"
                            onClick={() => router.push(`/booking?service=${srv.id}`)}
                          >
                            Book Now
                          </Button>
                        </div>
                      </div>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>

          {/* Aura Report Scan panel */}
          {auraReport && (
            <div className="aura-report-column">
              <Card variant="glowing" className="aura-report-card">
                <h3 className="aura-title">Your Aura Scan</h3>
                <p className="aura-meta">Based on user search query resonance</p>

                {/* SVG Chakra alignment chart */}
                <div className="chakra-scan-visual">
                  <svg viewBox="0 0 160 300" width="100%" height="240" className="chakra-svg">
                    {/* Spine background */}
                    <line x1="80" y1="20" x2="80" y2="280" stroke="rgba(255,255,255,0.06)" strokeWidth="4" strokeDasharray="6,4" />
                    
                    {/* Body silhouette placeholder */}
                    <path d="M80,10 C90,10 95,20 95,30 C95,45 80,60 80,60 C80,60 65,45 65,30 C65,20 70,10 80,10 Z" fill="none" stroke="rgba(255,255,255,0.03)" strokeWidth="2" />
                    <path d="M80,60 C40,90 30,150 35,290 L125,290 C130,150 120,90 80,60 Z" fill="none" stroke="rgba(255,255,255,0.03)" strokeWidth="2" />
                    
                    {/* Glowing chakra nodes */}
                    {auraReport.chakras.map((chk, index) => {
                      const yPos = 30 + index * 38;
                      const glowRadius = chk.value * 0.12;
                      const opacity = chk.value / 100;
                      return (
                        <g key={chk.key}>
                          {/* Radial Glow */}
                          <circle cx="80" cy={yPos} r={glowRadius} fill={chk.color} opacity={opacity * 0.25} style={{ filter: "blur(6px)" }} />
                          {/* Inner Core */}
                          <circle cx="80" cy={yPos} r="7" fill={chk.color} stroke="#fff" strokeWidth="1.5" className="chakra-node-pulse" />
                          {/* Label Text */}
                          <text x="96" y={yPos + 4} fill="hsl(var(--text-muted))" fontSize="8" fontWeight="600" letterSpacing="0.05em">
                            {chk.name}: {chk.value}%
                          </text>
                        </g>
                      );
                    })}
                  </svg>
                </div>

                <div className="aura-stats">
                  <div className="aura-stat-row">
                    <span>Vibrational Resonance</span>
                    <span className="aura-stat-val" style={{ color: "#d4af37" }}>{auraReport.resonance}%</span>
                  </div>
                  <div className="resonance-bar-bg">
                    <div className="resonance-bar-fill" style={{ width: `${auraReport.resonance}%` }} />
                  </div>
                </div>

                <p className="aura-analysis-desc">
                  {auraReport.description}
                </p>

                <div className="aura-card-actions">
                  <button className="view-pdf-btn" onClick={() => alert("Your aura profile has been generated. Download option active in production.")}>
                    📄 View Full PDF
                  </button>
                </div>
              </Card>
            </div>
          )}

        </section>

      </main>

      {/* Cart/Selections Drawer */}
      {selections.length > 0 && (
        <div className="cart-drawer-panel">
          <div className="cart-drawer-container">
            <div className="cart-drawer-left">
              <h4 className="cart-drawer-title">YOUR SELECTIONS ({selections.length} Items)</h4>
              <div className="cart-items-preview">
                {selections.map(s => (
                  <span key={s.id} className="cart-preview-pill">
                    {s.name} ({formatCurrency(s.price)})
                    <button className="pill-remove-btn" onClick={() => toggleSelection(s)}>×</button>
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

      <style jsx>{`
        .search-container {
          max-width: 1200px;
          margin: 0 auto;
          padding: 40px 24px;
          display: flex;
          flex-direction: column;
          gap: 32px;
          width: 100%;
        }
        .search-controls-card {
          padding: 32px;
        }
        .search-header-title {
          color: #4c1d95;
          font-size: 1.8rem;
          margin-bottom: 8px;
        }
        .filters-row {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 20px;
        }
        .filter-group {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .filter-group label {
          font-size: 0.8rem;
          font-weight: 600;
          color: hsl(var(--text-muted));
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }
        .price-range-slider {
          -webkit-appearance: none;
          width: 100%;
          height: 6px;
          background: rgba(0, 0, 0, 0.08);
          border-radius: 4px;
          outline: none;
          margin-top: 14px;
        }
        .price-range-slider::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 16px;
          height: 16px;
          border-radius: 50%;
          background: #7c3aed;
          cursor: pointer;
          box-shadow: 0 0 8px rgba(124, 58, 237, 0.3);
          transition: 0.1s;
        }
        .price-range-slider::-webkit-slider-thumb:hover {
          transform: scale(1.2);
        }
        .search-layout-split {
          display: grid;
          grid-template-columns: 1.6fr 1fr;
          gap: 32px;
        }
        .services-column {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }
        .column-title {
          font-size: 1.3rem;
          color: #4c1d95;
          margin-bottom: 8px;
        }
        .services-vertical-list {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }
        .service-row-card {
          padding: 0 !important;
        }
        .row-content {
          padding: 24px;
          display: flex;
          justify-content: space-between;
          gap: 24px;
          align-items: center;
        }
        .row-main-info {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .row-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .row-category {
          background: rgba(16, 185, 129, 0.08);
          border: 1px solid rgba(16, 185, 129, 0.2);
          color: #065f46;
          font-size: 0.7rem;
          font-weight: 600;
          padding: 3px 8px;
          border-radius: 4px;
          text-transform: uppercase;
        }
        .row-price {
          font-family: var(--font-serif);
          color: #db2777;
          font-weight: 700;
          font-size: 1.15rem;
        }
        .row-title {
          font-size: 1.25rem;
          color: hsl(var(--text-cream));
        }
        .row-desc {
          font-size: 0.85rem;
        }
        .row-footer {
          display: flex;
          gap: 16px;
          font-size: 0.8rem;
          color: hsl(var(--text-muted));
          border-top: 1px solid rgba(0,0,0,0.05);
          padding-top: 10px;
          margin-top: 4px;
        }
        .row-actions {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 16px;
          min-width: 100px;
        }
        .checkbox-selection-btn {
          width: 44px;
          height: 44px;
          border-radius: 50%;
          background: rgba(0,0,0,0.02);
          border: 1.5px solid rgba(0,0,0,0.1);
          color: hsl(var(--text-muted));
          font-size: 1.3rem;
          cursor: pointer;
          transition: var(--transition-smooth);
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .checkbox-selection-btn:hover {
          border-color: #7c3aed;
          color: #7c3aed;
          box-shadow: 0 0 10px var(--gold-glow);
        }
        .checkbox-selection-btn.selected {
          background: #7c3aed;
          border-color: #7c3aed;
          color: #ffffff;
          box-shadow: 0 0 15px rgba(124, 58, 237, 0.4);
        }
        .aura-report-column {
          display: flex;
          flex-direction: column;
        }
        .aura-report-card {
          padding: 28px;
          display: flex;
          flex-direction: column;
          gap: 20px;
        }
        .aura-title {
          font-size: 1.4rem;
          color: #4c1d95;
          text-align: center;
        }
        .aura-meta {
          text-align: center;
          font-size: 0.8rem;
          color: hsl(var(--text-muted));
          margin-top: -16px;
        }
        .chakra-scan-visual {
          background: rgba(255,255,255,0.7);
          border-radius: 16px;
          padding: 16px;
          border: 1px solid rgba(0,0,0,0.05);
        }
        .aura-stats {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .aura-stat-row {
          display: flex;
          justify-content: space-between;
          font-size: 0.9rem;
          font-weight: 600;
        }
        .aura-stat-val {
          font-family: var(--font-serif);
        }
        .resonance-bar-bg {
          height: 6px;
          background: rgba(0,0,0,0.04);
          border-radius: 99px;
          overflow: hidden;
        }
        .resonance-bar-fill {
          height: 100%;
          background: linear-gradient(90deg, #059669, #7c3aed);
          border-radius: 99px;
        }
        .aura-analysis-desc {
          font-size: 0.85rem;
          line-height: 1.6;
          color: hsl(var(--text-muted));
        }
        .aura-card-actions {
          margin-top: 8px;
        }
        .view-pdf-btn {
          width: 100%;
          background: rgba(168, 85, 247, 0.04);
          border: 1.5px solid rgba(168, 85, 247, 0.4);
          color: #6d28d9;
          font-family: var(--font-serif);
          font-weight: 700;
          font-size: 0.75rem;
          letter-spacing: 0.05em;
          text-transform: uppercase;
          padding: 12px;
          border-radius: 10px;
          cursor: pointer;
          transition: var(--transition-fast);
        }
        .view-pdf-btn:hover {
          background: rgba(168, 85, 247, 0.08);
          border-color: #7c3aed;
          box-shadow: 0 0 10px rgba(124, 58, 237, 0.1);
        }
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
          max-width: 1200px;
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
          color: hsl(var(--text-muted));
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
          color: hsl(var(--text-muted));
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
        @keyframes slideUp {
          from { transform: translateY(100%); }
          to { transform: translateY(0); }
        }
        @keyframes pulse-node {
          0%, 100% { transform: scale(1); opacity: 0.8; }
          50% { transform: scale(1.2); opacity: 1; }
        }
        .chakra-node-pulse {
          animation: pulse-node 2s infinite ease-in-out;
        }
        @media (max-width: 1024px) {
          .search-layout-split {
            grid-template-columns: 1fr;
          }
          .filters-row {
            grid-template-columns: repeat(2, 1fr);
          }
        }
        @media (max-width: 640px) {
          .filters-row {
            grid-template-columns: 1fr;
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

export default function SearchPage() {
  return (
    <Suspense fallback={<div>Loading Diving Sanatan scan metrics...</div>}>
      <SearchPageContent />
    </Suspense>
  );
}
