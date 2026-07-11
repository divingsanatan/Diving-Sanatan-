"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";

// ─── Types ──────────────────────────────────────────────────────────────────
interface CartItem {
  id: string;
  name: string;
  type: "Service" | "Product";
  price: number;
  originalPrice?: number;
  quantity: number;
  emoji: string;
  description: string;
  meta?: string;
  category?: string;
}

interface RecommendedItem {
  id: string;
  name: string;
  price: number;
  emoji: string;
  type: "Service" | "Product";
  meta?: string;
  rating?: string;
  ratingCount?: number;
}

// ─── Static Recommendation Data ─────────────────────────────────────────────
const recommendedServices: RecommendedItem[] = [
  { id: "rs1", name: "Chakra Balancing Session", price: 1799, emoji: "🧘‍♀️", type: "Service", meta: "45 mins • Online", rating: "4.8", ratingCount: 128 },
  { id: "rs2", name: "Sound Healing Therapy", price: 2199, emoji: "🎵", type: "Service", meta: "60 mins • Online", rating: "4.9", ratingCount: 96 },
  { id: "rs3", name: "Anxiety Relief Coaching", price: 1999, emoji: "🌅", type: "Service", meta: "45 mins • Online", rating: "4.7", ratingCount: 72 },
  { id: "rs4", name: "Crystal Healing Session", price: 1499, emoji: "💎", type: "Service", meta: "30 mins • Online", rating: "4.8", ratingCount: 64 },
];

const recommendedProducts: RecommendedItem[] = [
  { id: "rp1", name: "Sandalwood Incense Sticks (Pack of 20)", price: 299, emoji: "🪵", type: "Product" },
  { id: "rp2", name: "Rose Quartz Healing Bracelet", price: 899, emoji: "📿", type: "Product" },
  { id: "rp3", name: "Spiritual Journal Daily Reflections", price: 499, emoji: "📖", type: "Product" },
  { id: "rp4", name: "Himalayan Salt Lamp (Natural)", price: 1299, emoji: "🪨", type: "Product" },
];

// Discount codes
const DISCOUNT_CODES: Record<string, number> = {
  WELCOME300: 300,
  HEAL100: 100,
  SANATAN200: 200,
};

const FREE_SHIPPING_THRESHOLD = 1500;

// ─── Utility ─────────────────────────────────────────────────────────────────
const formatINR = (n: number) =>
  "₹" + n.toLocaleString("en-IN");

export default function CartPage() {
  const router = useRouter();

  // ── State ─────────────────────────────────────────────────────────────────
  const [cartItems, setCartItems] = useState<CartItem[]>([
    {
      id: "ci1", name: "1:1 Healing Session", type: "Service",
      price: 2499, quantity: 1, emoji: "🧘",
      description: "Personalized healing session with expert guidance designed for your unique needs.",
      meta: "⏱ 60 mins  📍 Online Session", category: "Service",
    },
    {
      id: "ci2", name: "The Power Within", type: "Product",
      price: 599, quantity: 1, emoji: "📗",
      description: "A transformational guide to self-discovery and inner peace.",
      meta: "Paperback", category: "Product",
    },
    {
      id: "ci3", name: "Lavender Serenity Candle", type: "Product",
      price: 749, quantity: 1, emoji: "🕯️",
      description: "Hand-poured soy candle to calm your mind and uplift your spirit.",
      category: "Product",
    },
  ]);

  const [removingId, setRemovingId] = useState<string | null>(null);
  const [addedIds, setAddedIds] = useState<Set<string>>(new Set());
  const [couponCode, setCouponCode] = useState("WELCOME300");
  const [couponInput, setCouponInput] = useState("");
  const [couponError, setCouponError] = useState("");
  const [showCouponField, setShowCouponField] = useState(false);
  const [orderNote, setOrderNote] = useState("");
  const [showNoteField, setShowNoteField] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  // ── Cart Calculations ─────────────────────────────────────────────────────
  const subtotal = cartItems.reduce((s, i) => s + i.price * i.quantity, 0);
  const discount = DISCOUNT_CODES[couponCode] || 0;
  const tax = Math.round((subtotal - discount) * 0.18);
  const amountToFreeShipping = Math.max(0, FREE_SHIPPING_THRESHOLD - subtotal);
  const shippingFree = subtotal >= FREE_SHIPPING_THRESHOLD;
  const total = subtotal - discount + tax;
  const progressPct = Math.min(100, (subtotal / FREE_SHIPPING_THRESHOLD) * 100);

  // ── Handlers ──────────────────────────────────────────────────────────────
  const updateQty = useCallback((id: string, delta: number) => {
    setCartItems(prev =>
      prev.map(item =>
        item.id === id
          ? { ...item, quantity: Math.max(1, item.quantity + delta) }
          : item
      )
    );
  }, []);

  const removeItem = useCallback((id: string) => {
    setRemovingId(id);
    setTimeout(() => {
      setCartItems(prev => prev.filter(i => i.id !== id));
      setRemovingId(null);
    }, 400);
  }, []);

  const addRecommended = useCallback((item: RecommendedItem) => {
    setAddedIds(prev => new Set(prev).add(item.id));
    setCartItems(prev => {
      const exists = prev.find(i => i.id === item.id);
      if (exists) return prev.map(i => i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i);
      return [...prev, {
        id: item.id, name: item.name, type: item.type,
        price: item.price, quantity: 1, emoji: item.emoji,
        description: item.meta || "",
        meta: item.meta,
        category: item.type,
      }];
    });
    setTimeout(() => setAddedIds(prev => { const s = new Set(prev); s.delete(item.id); return s; }), 1500);
  }, []);

  const applyCoupon = () => {
    const code = couponInput.trim().toUpperCase();
    if (DISCOUNT_CODES[code]) {
      setCouponCode(code);
      setCouponError("");
      setShowCouponField(false);
      setCouponInput("");
    } else {
      setCouponError("Invalid code. Try WELCOME300, HEAL100, or SANATAN200.");
    }
  };

  const removeCoupon = () => { setCouponCode(""); setCouponError(""); };

  const handleCheckout = () => router.push("/checkout");

  if (!mounted) return null;

  return (
    <div className="cart-page-shell">
      <Header />

      <main className="cart-main">
        {/* ── Page Title ── */}
        <div className="cart-page-title">
          <span className="cart-title-icon">🛍️</span>
          <div>
            <h1 className="cart-h1">Shopping Cart</h1>
            <p className="cart-subtitle">{cartItems.length === 0 ? "Your cart is empty" : `${cartItems.reduce((s, i) => s + i.quantity, 0)} item${cartItems.reduce((s, i) => s + i.quantity, 0) !== 1 ? "s" : ""} in your cart`}</p>
          </div>
        </div>

        {cartItems.length === 0 ? (
          /* ── Empty State ── */
          <div className="empty-cart-state">
            <div className="empty-cart-icon">🛒</div>
            <h2 className="empty-cart-title">Your cart feels lonely</h2>
            <p className="empty-cart-desc">Explore our healing services and products to start your wellness journey.</p>
            <Link href="/services" className="explore-btn">Explore Services →</Link>
          </div>
        ) : (
          <div className="cart-layout">
            {/* ══ LEFT: Main Content ══════════════════════════════ */}
            <div className="cart-left">

              {/* Free Shipping Bar */}
              <div className="shipping-bar-card">
                <div className="shipping-bar-text">
                  {shippingFree ? (
                    <span className="shipping-free-msg">🎉 You've unlocked <strong>FREE shipping!</strong></span>
                  ) : (
                    <span>You're <strong>{formatINR(amountToFreeShipping)}</strong> away from <strong>FREE shipping</strong></span>
                  )}
                  <span className="shipping-bar-right">{shippingFree ? "🚚 Free" : `${formatINR(amountToFreeShipping)} to go`}</span>
                </div>
                <div className="shipping-progress-track">
                  <div className="shipping-progress-fill" style={{ width: `${progressPct}%` }} />
                </div>
              </div>

              {/* Cart Items */}
              <div className="cart-items-list">
                {cartItems.map(item => (
                  <div
                    key={item.id}
                    className={`cart-item-card${removingId === item.id ? " removing" : ""}`}
                  >
                    <div className="item-emoji-box">
                      <span className="item-emoji">{item.emoji}</span>
                    </div>
                    <div className="item-body">
                      <div className="item-body-top">
                        <div className="item-body-left">
                          <span className={`item-type-tag ${item.type === "Service" ? "tag-service" : "tag-product"}`}>
                            {item.type}
                          </span>
                          <h2 className="item-name">{item.name}</h2>
                          {item.meta && <p className="item-meta-text">{item.meta}</p>}
                          <p className="item-desc-text">{item.description}</p>
                        </div>
                        <div className="item-price-col">
                          <span className="item-price">{formatINR(item.price * item.quantity)}</span>
                          {item.quantity > 1 && (
                            <span className="item-unit-price">{formatINR(item.price)} each</span>
                          )}
                        </div>
                      </div>
                      <div className="item-body-bottom">
                        <button
                          className="item-remove-btn"
                          onClick={() => removeItem(item.id)}
                        >
                          🗑 Remove
                        </button>
                        <div className="qty-control">
                          <button
                            className="qty-btn"
                            onClick={() => updateQty(item.id, -1)}
                            disabled={item.quantity <= 1}
                          >
                            −
                          </button>
                          <span className="qty-value">{item.quantity}</span>
                          <button
                            className="qty-btn"
                            onClick={() => updateQty(item.id, 1)}
                          >
                            +
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Order Note */}
              <div className="order-note-card">
                <button
                  className="note-toggle-btn"
                  onClick={() => setShowNoteField(v => !v)}
                >
                  <span className="note-icon">🪷</span>
                  <div className="note-toggle-text">
                    <span className="note-toggle-title">Add Order Note</span>
                    <span className="note-toggle-sub">Special instructions for your healer</span>
                  </div>
                  <span className={`note-chevron${showNoteField ? " open" : ""}`}>›</span>
                </button>
                {showNoteField && (
                  <div className="note-field-wrap">
                    <textarea
                      className="note-textarea"
                      placeholder="e.g. Please focus on the heart chakra. I prefer evening sessions..."
                      value={orderNote}
                      onChange={e => setOrderNote(e.target.value)}
                      rows={3}
                    />
                  </div>
                )}
              </div>

              {/* Recommended Services */}
              <div className="rec-section-card">
                <div className="rec-section-header">
                  <h3 className="rec-section-title">✨ You May Also Like — Services</h3>
                  <Link href="/services" className="rec-view-all">View All →</Link>
                </div>
                <div className="rec-grid">
                  {recommendedServices.map(item => (
                    <div key={item.id} className="rec-card">
                      <div className="rec-card-img">
                        <span className="rec-card-emoji">{item.emoji}</span>
                      </div>
                      <div className="rec-card-body">
                        <p className="rec-card-name">{item.name}</p>
                        {item.meta && <p className="rec-card-meta">{item.meta}</p>}
                        {item.rating && (
                          <p className="rec-card-rating">★ {item.rating} ({item.ratingCount})</p>
                        )}
                        <div className="rec-card-bottom">
                          <span className="rec-card-price">{formatINR(item.price)}</span>
                          <button
                            className={`rec-add-btn${addedIds.has(item.id) ? " added" : ""}`}
                            onClick={() => addRecommended(item)}
                          >
                            {addedIds.has(item.id) ? "✓ Added" : "+ Add"}
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Recommended Products */}
              <div className="rec-section-card">
                <div className="rec-section-header">
                  <h3 className="rec-section-title">🛒 You May Also Like — Products</h3>
                  <Link href="/services" className="rec-view-all">View All →</Link>
                </div>
                <div className="rec-grid">
                  {recommendedProducts.map(item => (
                    <div key={item.id} className="rec-card">
                      <div className="rec-card-img">
                        <span className="rec-card-emoji">{item.emoji}</span>
                      </div>
                      <div className="rec-card-body">
                        <p className="rec-card-name">{item.name}</p>
                        <div className="rec-card-bottom rec-card-bottom-mt">
                          <span className="rec-card-price">{formatINR(item.price)}</span>
                          <button
                            className={`rec-add-btn${addedIds.has(item.id) ? " added" : ""}`}
                            onClick={() => addRecommended(item)}
                          >
                            {addedIds.has(item.id) ? "✓ Added" : "+ Add"}
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Trust Promos */}
              <div className="trust-promo-grid">
                {[
                  { icon: "🛡️", title: "Secure Payments", desc: "Your transactions are 100% safe and encrypted." },
                  { icon: "📦", title: "Easy Returns", desc: "Hassle-free returns within 7 days of delivery." },
                  { icon: "🚚", title: "Fast Delivery", desc: "Quick and reliable delivery at your doorstep." },
                  { icon: "🎧", title: "Support 24/7", desc: "We're here to help you anytime, any day." },
                ].map(p => (
                  <div key={p.title} className="trust-promo-item">
                    <span className="trust-promo-icon">{p.icon}</span>
                    <div>
                      <h4 className="trust-promo-title">{p.title}</h4>
                      <p className="trust-promo-desc">{p.desc}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Thank You Banner */}
              <div className="thankyou-banner">
                <span className="thankyou-lotus">🪷</span>
                <div className="thankyou-text">
                  <h2 className="thankyou-title">Your well-being is our priority.</h2>
                  <p className="thankyou-sub">Thank you for choosing Divine Sanatan. We're honored to be part of your healing journey.</p>
                </div>
              </div>

            </div>

            {/* ══ RIGHT: Order Summary ══════════════════════════ */}
            <aside className="cart-right">
              <div className="summary-card">
                <h3 className="summary-title">🪷 Order Summary</h3>

                <div className="summary-rows">
                  <div className="summary-row">
                    <span>Subtotal ({cartItems.reduce((s, i) => s + i.quantity, 0)} items)</span>
                    <span className="summary-val">{formatINR(subtotal)}</span>
                  </div>

                  {discount > 0 && (
                    <div className="summary-row">
                      <span>Discount ({couponCode})</span>
                      <span className="summary-val-green">−{formatINR(discount)}</span>
                    </div>
                  )}

                  {/* Coupon */}
                  {couponCode ? (
                    <div className="coupon-applied-row">
                      <span className="coupon-code-label">🏷 {couponCode}</span>
                      <button className="coupon-remove-btn" onClick={removeCoupon}>✕ Remove</button>
                    </div>
                  ) : (
                    <div className="coupon-area">
                      {!showCouponField ? (
                        <button className="coupon-toggle-btn" onClick={() => setShowCouponField(true)}>
                          + Apply Coupon Code
                        </button>
                      ) : (
                        <div className="coupon-input-row">
                          <input
                            className="coupon-input"
                            placeholder="Enter code…"
                            value={couponInput}
                            onChange={e => { setCouponInput(e.target.value); setCouponError(""); }}
                            onKeyDown={e => e.key === "Enter" && applyCoupon()}
                          />
                          <button className="coupon-apply-btn" onClick={applyCoupon}>Apply</button>
                        </div>
                      )}
                      {couponError && <p className="coupon-error">{couponError}</p>}
                    </div>
                  )}

                  <div className="summary-row">
                    <span>Shipping</span>
                    <span className={shippingFree ? "summary-val-green" : "summary-val"}>{shippingFree ? "FREE 🎉" : formatINR(99)}</span>
                  </div>

                  <div className="summary-row">
                    <span>Tax (18% GST)</span>
                    <span className="summary-val">{formatINR(tax)}</span>
                  </div>

                  <div className="summary-row summary-total-row">
                    <span className="summary-total-label">Total</span>
                    <span className="summary-total-val">{formatINR(total)}</span>
                  </div>
                </div>

                {discount > 0 && (
                  <div className="saved-badge">
                    🎉 You saved {formatINR(discount)} on this order!
                  </div>
                )}

                <button className="checkout-btn" onClick={handleCheckout}>
                  Proceed to Checkout →
                </button>

                <Link href="/services" className="continue-shopping-link">
                  ← Continue Shopping
                </Link>

                <div className="trust-badges-row">
                  {[
                    { icon: "🛡️", label: "Secure Checkout" },
                    { icon: "💳", label: "100% Safe Pay" },
                    { icon: "↩️", label: "Easy Returns" },
                  ].map(b => (
                    <div key={b.label} className="trust-badge-item">
                      <span className="trust-badge-icon">{b.icon}</span>
                      <span className="trust-badge-label">{b.label}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Member Card */}
              <div className="member-card">
                <h3 className="member-card-title">Become a Member & Save More</h3>
                <p className="member-card-desc">Join our wellness community and get exclusive benefits.</p>
                <ul className="member-benefits">
                  {["10% OFF on all orders", "Priority access to events", "Exclusive member content", "Special offers & more"].map(b => (
                    <li key={b} className="member-benefit-item">
                      <span className="benefit-dot">🌸</span> {b}
                    </li>
                  ))}
                </ul>
                <button className="member-join-btn">Join Now</button>
                <div className="member-card-bg-icon">🧘</div>
              </div>
            </aside>
          </div>
        )}
      </main>

      <Footer />

      <style jsx>{`
        /* ── Shell & Layout ─────────────────────────────── */
        .cart-page-shell {
          display: flex;
          flex-direction: column;
          min-height: 100vh;
        }
        .cart-main {
          flex: 1;
          max-width: 1280px;
          margin: 0 auto;
          padding: 32px 24px 60px;
          width: 100%;
        }

        /* ── Page Title ─────────────────────────────────── */
        .cart-page-title {
          display: flex;
          align-items: center;
          gap: 16px;
          margin-bottom: 28px;
          animation: fadeSlideIn 0.5s ease both;
        }
        .cart-title-icon {
          font-size: 2.4rem;
          filter: drop-shadow(0 4px 12px rgba(168, 85, 247, 0.25));
        }
        .cart-h1 {
          font-size: 2rem !important;
          color: #1a1a2e !important;
          margin-bottom: 4px;
        }
        .cart-subtitle {
          font-size: 0.9rem;
          color: hsl(var(--text-muted));
        }

        /* ── Empty State ────────────────────────────────── */
        .empty-cart-state {
          text-align: center;
          padding: 80px 24px;
          animation: fadeSlideIn 0.5s ease both;
        }
        .empty-cart-icon {
          font-size: 5rem;
          margin-bottom: 20px;
          display: block;
          opacity: 0.4;
        }
        .empty-cart-title {
          font-size: 1.8rem;
          color: #1a1a2e;
          margin-bottom: 10px;
        }
        .empty-cart-desc {
          color: hsl(var(--text-muted));
          margin-bottom: 28px;
          max-width: 400px;
          margin-left: auto;
          margin-right: auto;
        }
        .explore-btn {
          display: inline-block;
          background: #6b21a8;
          color: white !important;
          padding: 12px 28px;
          border-radius: 10px;
          font-weight: 600;
          font-size: 0.95rem;
          transition: all 0.3s ease;
          text-decoration: none !important;
        }
        .explore-btn:hover {
          background: #5b1891;
          transform: translateY(-2px);
          box-shadow: 0 8px 24px rgba(107, 33, 168, 0.25);
        }

        /* ── Cart 2-Column Layout ───────────────────────── */
        .cart-layout {
          display: grid;
          grid-template-columns: 1fr 340px;
          gap: 28px;
          align-items: start;
        }
        .cart-left {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }
        .cart-right {
          display: flex;
          flex-direction: column;
          gap: 20px;
          position: sticky;
          top: 90px;
        }

        /* ── Shipping Bar ───────────────────────────────── */
        .shipping-bar-card {
          background: white;
          border: 1px solid #e9d5ff;
          border-radius: 14px;
          padding: 18px 22px;
          animation: fadeSlideIn 0.4s 0.05s ease both;
          box-shadow: 0 2px 12px rgba(168, 85, 247, 0.05);
        }
        .shipping-bar-text {
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 0.88rem;
          color: #374151;
          margin-bottom: 12px;
        }
        .shipping-bar-text strong { color: #6b21a8; }
        .shipping-free-msg { color: #15803d; font-weight: 600; }
        .shipping-bar-right {
          font-size: 0.8rem;
          color: hsl(var(--text-muted));
          font-weight: 500;
        }
        .shipping-progress-track {
          height: 7px;
          background: #f3e8ff;
          border-radius: 99px;
          overflow: hidden;
        }
        .shipping-progress-fill {
          height: 100%;
          background: linear-gradient(90deg, #a855f7, #6b21a8);
          border-radius: 99px;
          transition: width 0.6s cubic-bezier(0.16, 1, 0.3, 1);
        }

        /* ── Cart Items ─────────────────────────────────── */
        .cart-items-list {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        .cart-item-card {
          background: white;
          border: 1px solid #ede9fe;
          border-radius: 16px;
          padding: 22px;
          display: flex;
          gap: 20px;
          transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
          box-shadow: 0 2px 16px rgba(0, 0, 0, 0.03);
          animation: fadeSlideIn 0.45s ease both;
        }
        .cart-item-card:hover {
          border-color: #c4b5fd;
          box-shadow: 0 8px 32px rgba(168, 85, 247, 0.08);
          transform: translateY(-2px);
        }
        .cart-item-card.removing {
          opacity: 0;
          transform: translateX(40px) scale(0.97);
          pointer-events: none;
        }
        .item-emoji-box {
          width: 110px;
          height: 110px;
          min-width: 110px;
          background: linear-gradient(135deg, #f3e8ff 0%, #e9d5ff 100%);
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          border: 1px solid #e9d5ff;
        }
        .item-emoji {
          font-size: 3rem;
          filter: drop-shadow(0 4px 8px rgba(0,0,0,0.15));
        }
        .item-body {
          flex: 1;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          gap: 8px;
        }
        .item-body-top {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 12px;
        }
        .item-body-left { flex: 1; }
        .item-type-tag {
          display: inline-block;
          font-size: 0.72rem;
          font-weight: 700;
          padding: 3px 10px;
          border-radius: 20px;
          letter-spacing: 0.04em;
          margin-bottom: 6px;
          text-transform: uppercase;
        }
        .tag-service {
          background: #f3e8ff;
          color: #6b21a8;
          border: 1px solid #e9d5ff;
        }
        .tag-product {
          background: #fef3c7;
          color: #92400e;
          border: 1px solid #fde68a;
        }
        .item-name {
          font-size: 1.1rem !important;
          font-weight: 700 !important;
          color: #1a1a2e !important;
          margin-bottom: 4px;
          line-height: 1.3 !important;
        }
        .item-meta-text {
          font-size: 0.8rem;
          color: hsl(var(--text-muted));
          margin-bottom: 4px;
        }
        .item-desc-text {
          font-size: 0.83rem;
          color: #4b5563;
          line-height: 1.5;
        }
        .item-price-col {
          text-align: right;
          flex-shrink: 0;
        }
        .item-price {
          font-size: 1.25rem;
          font-weight: 800;
          color: #6b21a8;
          display: block;
          font-family: var(--font-serif);
        }
        .item-unit-price {
          font-size: 0.75rem;
          color: hsl(var(--text-muted));
        }
        .item-body-bottom {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-top: 6px;
        }
        .item-remove-btn {
          background: none;
          border: none;
          color: #a855f7;
          font-size: 0.82rem;
          cursor: pointer;
          padding: 4px 8px;
          border-radius: 6px;
          transition: all 0.2s ease;
          font-weight: 500;
        }
        .item-remove-btn:hover {
          background: #fdf4ff;
          color: #7e22ce;
        }
        .qty-control {
          display: flex;
          align-items: center;
          gap: 4px;
          background: #f5f3ff;
          border: 1px solid #e9d5ff;
          border-radius: 10px;
          padding: 4px 6px;
        }
        .qty-btn {
          background: white;
          border: 1px solid #e9d5ff;
          color: #6b21a8;
          width: 28px;
          height: 28px;
          border-radius: 7px;
          font-size: 1rem;
          font-weight: 700;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s ease;
          line-height: 1;
        }
        .qty-btn:hover:not(:disabled) {
          background: #ede9fe;
          border-color: #c4b5fd;
          transform: scale(1.08);
        }
        .qty-btn:disabled { opacity: 0.35; cursor: not-allowed; }
        .qty-value {
          min-width: 28px;
          text-align: center;
          font-weight: 700;
          font-size: 0.95rem;
          color: #1a1a2e;
        }

        /* ── Order Note ─────────────────────────────────── */
        .order-note-card {
          background: linear-gradient(135deg, #faf5ff 0%, #f5f3ff 100%);
          border: 1px solid #e9d5ff;
          border-radius: 14px;
          overflow: hidden;
        }
        .note-toggle-btn {
          width: 100%;
          background: none;
          border: none;
          display: flex;
          align-items: center;
          gap: 14px;
          padding: 18px 22px;
          cursor: pointer;
          text-align: left;
          transition: background 0.2s ease;
        }
        .note-toggle-btn:hover { background: rgba(168,85,247,0.04); }
        .note-icon { font-size: 1.5rem; }
        .note-toggle-text { flex: 1; }
        .note-toggle-title {
          display: block;
          font-weight: 700;
          color: #6b21a8;
          font-size: 0.92rem;
        }
        .note-toggle-sub {
          display: block;
          font-size: 0.8rem;
          color: hsl(var(--text-muted));
          margin-top: 2px;
        }
        .note-chevron {
          color: #a855f7;
          font-size: 1.4rem;
          transition: transform 0.3s ease;
          display: inline-block;
        }
        .note-chevron.open { transform: rotate(90deg); }
        .note-field-wrap {
          padding: 0 22px 18px;
          animation: fadeSlideIn 0.25s ease both;
        }
        .note-textarea {
          width: 100%;
          border: 1px solid #e9d5ff;
          border-radius: 10px;
          padding: 12px 14px;
          font-family: var(--font-sans);
          font-size: 0.88rem;
          resize: vertical;
          background: white;
          color: #1a1a2e;
          outline: none;
          transition: border-color 0.2s ease;
          line-height: 1.6;
        }
        .note-textarea:focus { border-color: #a855f7; box-shadow: 0 0 0 3px rgba(168,85,247,0.1); }

        /* ── Recommended Sections ───────────────────────── */
        .rec-section-card {
          background: white;
          border: 1px solid #ede9fe;
          border-radius: 16px;
          padding: 22px;
          box-shadow: 0 2px 12px rgba(0,0,0,0.03);
        }
        .rec-section-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 18px;
        }
        .rec-section-title {
          font-size: 1.05rem !important;
          color: #1a1a2e !important;
        }
        .rec-view-all {
          color: #6b21a8;
          font-size: 0.85rem;
          font-weight: 600;
          transition: color 0.2s ease;
          text-decoration: none !important;
        }
        .rec-view-all:hover { color: #4c1d95; }
        .rec-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 14px;
        }
        .rec-card {
          border: 1px solid #ede9fe;
          border-radius: 12px;
          overflow: hidden;
          transition: all 0.3s ease;
          background: #faf5ff;
        }
        .rec-card:hover {
          border-color: #c4b5fd;
          transform: translateY(-3px);
          box-shadow: 0 8px 24px rgba(168,85,247,0.1);
        }
        .rec-card-img {
          height: 100px;
          background: linear-gradient(135deg, #f3e8ff, #ddd6fe);
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .rec-card-emoji { font-size: 2.4rem; }
        .rec-card-body { padding: 10px 12px 12px; }
        .rec-card-name {
          font-size: 0.8rem;
          font-weight: 700;
          color: #1a1a2e;
          min-height: 34px;
          line-height: 1.4;
          margin-bottom: 4px;
        }
        .rec-card-meta {
          font-size: 0.72rem;
          color: hsl(var(--text-muted));
          margin-bottom: 2px;
        }
        .rec-card-rating {
          font-size: 0.72rem;
          color: #d97706;
          margin-bottom: 8px;
        }
        .rec-card-bottom {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 6px;
        }
        .rec-card-bottom-mt { margin-top: 28px; }
        .rec-card-price {
          font-weight: 800;
          font-size: 0.9rem;
          color: #6b21a8;
          font-family: var(--font-serif);
        }
        .rec-add-btn {
          background: white;
          border: 1.5px solid #a855f7;
          color: #6b21a8;
          padding: 4px 10px;
          border-radius: 6px;
          font-size: 0.75rem;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.25s ease;
          white-space: nowrap;
        }
        .rec-add-btn:hover {
          background: #6b21a8;
          color: white;
          transform: scale(1.05);
        }
        .rec-add-btn.added {
          background: #15803d;
          border-color: #15803d;
          color: white;
        }

        /* ── Trust Promo Grid ───────────────────────────── */
        .trust-promo-grid {
          background: linear-gradient(135deg, #faf5ff 0%, #f5f3ff 100%);
          border: 1px solid #ede9fe;
          border-radius: 16px;
          padding: 24px;
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 20px;
        }
        .trust-promo-item {
          display: flex;
          gap: 12px;
          align-items: flex-start;
        }
        .trust-promo-icon { font-size: 1.6rem; flex-shrink: 0; }
        .trust-promo-title {
          font-size: 0.88rem !important;
          font-weight: 700 !important;
          color: #1a1a2e !important;
          margin-bottom: 4px;
        }
        .trust-promo-desc {
          font-size: 0.78rem;
          color: hsl(var(--text-muted));
          line-height: 1.4;
        }

        /* ── Thank You Banner ───────────────────────────── */
        .thankyou-banner {
          background: linear-gradient(135deg, #c4b5fd 0%, #a78bfa 50%, #818cf8 100%);
          border-radius: 16px;
          padding: 28px 32px;
          display: flex;
          align-items: center;
          gap: 20px;
          position: relative;
          overflow: hidden;
        }
        .thankyou-banner::before {
          content: '';
          position: absolute;
          top: -30%;
          right: -10%;
          width: 200px;
          height: 200px;
          background: radial-gradient(circle, rgba(255,255,255,0.15) 0%, transparent 70%);
          border-radius: 50%;
        }
        .thankyou-lotus { font-size: 2.8rem; flex-shrink: 0; }
        .thankyou-title {
          font-size: 1.2rem !important;
          color: white !important;
          margin-bottom: 4px;
        }
        .thankyou-sub {
          font-size: 0.85rem;
          color: rgba(255,255,255,0.85);
          line-height: 1.5;
        }

        /* ── Order Summary Card ─────────────────────────── */
        .summary-card {
          background: white;
          border: 1px solid #ede9fe;
          border-radius: 16px;
          padding: 24px;
          box-shadow: 0 4px 20px rgba(168,85,247,0.06);
          animation: fadeSlideIn 0.5s 0.1s ease both;
        }
        .summary-title {
          font-size: 1.2rem !important;
          color: #1a1a2e !important;
          margin-bottom: 20px;
          padding-bottom: 14px;
          border-bottom: 1px solid #f3e8ff;
        }
        .summary-rows {
          display: flex;
          flex-direction: column;
          gap: 0;
        }
        .summary-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 10px 0;
          font-size: 0.88rem;
          color: #374151;
          border-bottom: 1px dashed #f3e8ff;
        }
        .summary-val { color: #1a1a2e; font-weight: 600; }
        .summary-val-green { color: #15803d; font-weight: 700; }
        .summary-total-row {
          border-top: 2px solid #e9d5ff;
          border-bottom: none;
          margin-top: 4px;
          padding-top: 14px !important;
        }
        .summary-total-label {
          font-size: 1rem !important;
          font-weight: 800;
          color: #1a1a2e;
        }
        .summary-total-val {
          font-size: 1.3rem;
          font-weight: 800;
          color: #6b21a8;
          font-family: var(--font-serif);
        }

        /* Coupon */
        .coupon-applied-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          background: #f0fdf4;
          border: 1px solid #bbf7d0;
          border-radius: 8px;
          padding: 8px 12px;
          margin: 6px 0;
        }
        .coupon-code-label {
          font-size: 0.82rem;
          font-weight: 700;
          color: #15803d;
        }
        .coupon-remove-btn {
          background: none;
          border: none;
          color: #dc2626;
          font-size: 0.75rem;
          cursor: pointer;
          font-weight: 600;
        }
        .coupon-area { padding: 6px 0; }
        .coupon-toggle-btn {
          background: none;
          border: none;
          color: #6b21a8;
          font-size: 0.83rem;
          font-weight: 600;
          cursor: pointer;
          padding: 4px 0;
          text-decoration: underline;
          text-underline-offset: 2px;
        }
        .coupon-input-row {
          display: flex;
          gap: 8px;
        }
        .coupon-input {
          flex: 1;
          border: 1.5px solid #e9d5ff;
          border-radius: 8px;
          padding: 8px 12px;
          font-size: 0.85rem;
          outline: none;
          transition: border-color 0.2s;
          color: #1a1a2e;
          background: white;
        }
        .coupon-input:focus { border-color: #a855f7; }
        .coupon-apply-btn {
          background: #6b21a8;
          color: white;
          border: none;
          border-radius: 8px;
          padding: 8px 14px;
          font-size: 0.82rem;
          font-weight: 700;
          cursor: pointer;
          transition: background 0.2s;
          white-space: nowrap;
        }
        .coupon-apply-btn:hover { background: #4c1d95; }
        .coupon-error {
          color: #dc2626;
          font-size: 0.75rem;
          margin-top: 6px;
          line-height: 1.4;
        }

        /* Saved Badge */
        .saved-badge {
          background: #f0fdf4;
          color: #15803d;
          border: 1px solid #bbf7d0;
          border-radius: 8px;
          padding: 10px 14px;
          font-size: 0.82rem;
          font-weight: 600;
          text-align: center;
          margin-top: 14px;
        }

        /* Checkout Button */
        .checkout-btn {
          width: 100%;
          background: linear-gradient(135deg, #7c3aed, #6b21a8);
          color: white;
          border: none;
          border-radius: 12px;
          padding: 15px;
          font-size: 0.95rem;
          font-weight: 700;
          cursor: pointer;
          margin-top: 16px;
          transition: all 0.3s ease;
          letter-spacing: 0.02em;
          box-shadow: 0 4px 16px rgba(107, 33, 168, 0.3);
        }
        .checkout-btn:hover {
          background: linear-gradient(135deg, #6d28d9, #5b1891);
          transform: translateY(-2px);
          box-shadow: 0 8px 28px rgba(107, 33, 168, 0.4);
        }
        .checkout-btn:active { transform: translateY(0); }

        .continue-shopping-link {
          display: block;
          text-align: center;
          color: #6b21a8;
          font-size: 0.82rem;
          font-weight: 600;
          margin-top: 12px;
          text-decoration: none !important;
          transition: color 0.2s;
        }
        .continue-shopping-link:hover { color: #4c1d95; }

        /* Trust Badges */
        .trust-badges-row {
          display: flex;
          justify-content: space-around;
          margin-top: 18px;
          padding-top: 16px;
          border-top: 1px solid #f3e8ff;
        }
        .trust-badge-item {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 4px;
          text-align: center;
        }
        .trust-badge-icon { font-size: 1.2rem; }
        .trust-badge-label {
          font-size: 0.68rem;
          color: hsl(var(--text-muted));
          font-weight: 500;
        }

        /* ── Member Card ────────────────────────────────── */
        .member-card {
          background: linear-gradient(180deg, #f5f3ff 0%, #ede9fe 100%);
          border: 1px solid #ddd6fe;
          border-radius: 16px;
          padding: 22px;
          position: relative;
          overflow: hidden;
          animation: fadeSlideIn 0.5s 0.15s ease both;
        }
        .member-card-title {
          font-size: 1rem !important;
          color: #1a1a2e !important;
          margin-bottom: 8px;
        }
        .member-card-desc {
          font-size: 0.82rem;
          color: hsl(var(--text-muted));
          margin-bottom: 14px;
          line-height: 1.5;
        }
        .member-benefits {
          list-style: none;
          display: flex;
          flex-direction: column;
          gap: 7px;
          margin-bottom: 18px;
        }
        .member-benefit-item {
          font-size: 0.82rem;
          color: #374151;
          display: flex;
          align-items: center;
          gap: 6px;
        }
        .benefit-dot { font-size: 0.75rem; }
        .member-join-btn {
          background: #6b21a8;
          color: white;
          border: none;
          border-radius: 10px;
          padding: 10px 24px;
          font-size: 0.88rem;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        .member-join-btn:hover {
          background: #4c1d95;
          transform: translateY(-1px);
          box-shadow: 0 4px 14px rgba(107,33,168,0.25);
        }
        .member-card-bg-icon {
          position: absolute;
          bottom: -10px;
          right: 10px;
          font-size: 5rem;
          opacity: 0.12;
          pointer-events: none;
          user-select: none;
        }

        /* ── Animations ─────────────────────────────────── */
        @keyframes fadeSlideIn {
          from { opacity: 0; transform: translateY(14px); }
          to { opacity: 1; transform: translateY(0); }
        }

        /* ── Responsive ─────────────────────────────────── */
        @media (max-width: 1024px) {
          .cart-layout { grid-template-columns: 1fr 300px; }
          .rec-grid { grid-template-columns: repeat(2, 1fr); }
          .trust-promo-grid { grid-template-columns: repeat(2, 1fr); }
        }
        @media (max-width: 768px) {
          .cart-layout { grid-template-columns: 1fr; }
          .cart-right { position: static; }
          .rec-grid { grid-template-columns: repeat(2, 1fr); }
          .trust-promo-grid { grid-template-columns: repeat(2, 1fr); }
          .item-emoji-box { width: 80px; height: 80px; min-width: 80px; }
          .item-emoji { font-size: 2.2rem; }
          .cart-h1 { font-size: 1.6rem !important; }
        }
        @media (max-width: 480px) {
          .cart-main { padding: 20px 16px 40px; }
          .rec-grid { grid-template-columns: repeat(2, 1fr); }
          .trust-promo-grid { grid-template-columns: 1fr 1fr; }
          .item-body-top { flex-direction: column; gap: 8px; }
          .item-price-col { text-align: left; }
        }
      `}</style>
    </div>
  );
}
