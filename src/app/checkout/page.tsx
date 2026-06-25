"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useRouter } from "next/navigation";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { formatCurrency } from "@/utils/formatters";

interface Service {
  id: string;
  name: string;
  price: number;
  duration: string;
  practitioner: string;
  category: string;
}

interface BookingRecord {
  id: string;
  serviceName: string;
  practitionerName: string;
  date: string;
  timeSlot: string;
  price: number;
  status: string;
  paymentStatus: string;
}

export default function CheckoutPage() {
  const router = useRouter();

  // Local state
  const [selections, setSelections] = useState<Service[]>([]);
  const [bookingId, setBookingId] = useState<string | null>(null);
  
  // Form input states
  const [paymentOption, setPaymentOption] = useState<"card" | "paypal" | "apple">("card");
  const [cardholderName, setCardholderName] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvv, setCvv] = useState("");
  const [billingAddress, setBillingAddress] = useState("");

  const [processing, setProcessing] = useState(false);
  const [success, setSuccess] = useState(false);

  // Validation errors
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // History state
  const [orderHistory, setOrderHistory] = useState<BookingRecord[]>([]);

  // 1. Load Selections & Booking ID on mount
  useEffect(() => {
    try {
      const storedSrv = window.localStorage.getItem("divingsanatan_selections");
      if (storedSrv) {
        setSelections(JSON.parse(storedSrv));
      }
      
      const bid = window.localStorage.getItem("active_booking_id");
      if (bid) {
        setBookingId(bid);
      }

      const savedProfile = window.localStorage.getItem("divingsanatan_user_profile");
      if (savedProfile) {
        const parsed = JSON.parse(savedProfile);
        if (parsed.name) setCardholderName(parsed.name);
      }
    } catch (e) {
      console.warn(e);
    }
  }, []);

  // 2. Fetch all bookings for order history sidebar
  const fetchOrderHistory = async () => {
    try {
      const res = await fetch("/api/bookings");
      const json = await res.json();
      if (json.success) {
        // Sort bookings: latest date first
        setOrderHistory(json.data);
      }
    } catch (e) {
      console.error("Failed to load history bookings", e);
    }
  };

  useEffect(() => {
    fetchOrderHistory();
  }, []);

  // Compute total
  const totalCost = selections.reduce((s, x) => s + x.price, 0);

  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/\D/g, "");
    const formatted = val.match(/.{1,4}/g)?.join(" ") || "";
    setCardNumber(formatted);
    if (formErrors.cardNumber) setFormErrors({ ...formErrors, cardNumber: "" });
  };

  const handleExpiryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value.replace(/\D/g, "");
    if (val.length > 2) {
      val = val.substring(0, 2) + "/" + val.substring(2, 4);
    }
    setExpiry(val);
    if (formErrors.expiry) setFormErrors({ ...formErrors, expiry: "" });
  };

  const handleCvvChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/\D/g, "");
    setCvv(val);
    if (formErrors.cvv) setFormErrors({ ...formErrors, cvv: "" });
  };

  const validateForm = () => {
    if (totalCost === 0) return true;
    const errors: Record<string, string> = {};
    if (paymentOption === "card") {
      if (!cardholderName.trim()) {
        errors.name = "Cardholder Name is required";
      } else if (cardholderName.trim().length < 2) {
        errors.name = "Name must be at least 2 characters";
      } else if (!/^[A-Za-z\s]+$/.test(cardholderName)) {
        errors.name = "Name must contain only letters and spaces";
      }

      const cleanedCard = cardNumber.replace(/\s+/g, "");
      if (!cleanedCard) {
        errors.cardNumber = "Card Number is required";
      } else if (!/^\d{16}$/.test(cleanedCard)) {
        errors.cardNumber = "Card Number must be exactly 16 digits";
      }

      if (!expiry) {
        errors.expiry = "Expiry Date is required";
      } else if (!/^\d{2}\/\d{2}$/.test(expiry)) {
        errors.expiry = "Expiry format must be MM/YY";
      } else {
        const [m, y] = expiry.split("/").map(Number);
        const now = new Date();
        const currentMonth = now.getMonth() + 1;
        const currentYear = now.getFullYear() % 100;
        if (m < 1 || m > 12) {
          errors.expiry = "Invalid month";
        } else if (y < currentYear || (y === currentYear && m < currentMonth)) {
          errors.expiry = "Card has expired";
        }
      }

      if (!cvv) {
        errors.cvv = "CVV is required";
      } else if (!/^\d{3}$/.test(cvv)) {
        errors.cvv = "CVV must be exactly 3 digits";
      }

      if (!billingAddress.trim()) {
        errors.billingAddress = "Billing Address is required";
      }
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Submit payment handler
  const handlePaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    setProcessing(true);

    // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, 1500));

    try {
      if (bookingId) {
        // Update booking state in backend JSON DB
        await fetch("/api/bookings", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: bookingId,
            status: "confirmed",
            paymentStatus: "paid",
          }),
        });
      }
      
      // Clear selections & active ID
      window.localStorage.removeItem("divingsanatan_selections");
      window.localStorage.removeItem("active_booking_id");
      setSelections([]);
      
      setSuccess(true);
      fetchOrderHistory(); // Refresh history sidebar
    } catch (err) {
      console.error("Payment registration failure:", err);
      alert("Payment processed, but failed to sync database session.");
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="page-shell">
      <Header />

      <main className="checkout-container">
        
        {/* Page Title */}
        <section className="checkout-header">
          <h2 className="checkout-header-title">Payment/Checkout Page</h2>
          <p className="text-muted-sm">
            Complete your wellness transaction. Submitting authorizes instant booking dispatch.
          </p>
        </section>

        {success ? (
          <div className="checkout-success-view glass-panel">
            <span className="success-icon">✨</span>
            <h3>Alignment Secured!</h3>
            <p>Your payment has been successfully processed and your energy therapy session is confirmed.</p>
            <p className="success-instruction">Check your history in the sidebar or return home to explore more wellness resources.</p>
            <Button variant="gold" onClick={() => router.push("/")}>Return Home</Button>
          </div>
        ) : (
          <div className="checkout-grid">
            
            {/* Payment Details Form */}
            <div className="checkout-form-col">
              <form onSubmit={handlePaymentSubmit} noValidate className="payment-card-panel glass-panel">
                <h3 className="checkout-section-title">Payment Details</h3>

                {totalCost === 0 ? (
                  <div className="free-session-notice-box">
                    <span className="free-session-icon">✨</span>
                    <h4 className="free-session-title">Complimentary Session</h4>
                    <p className="free-session-desc">This session is completely free. No payment details or credit cards are required to secure your appointment.</p>
                  </div>
                ) : (
                  <>
                    {/* Options selector (From Slide 1) */}
                    <div className="payment-options-row">
                      <button 
                        type="button" 
                        className={`pay-opt-btn ${paymentOption === "card" ? "active" : ""}`}
                        onClick={() => setPaymentOption("card")}
                      >
                        💳 Credit Card
                      </button>
                      <button 
                        type="button" 
                        className={`pay-opt-btn ${paymentOption === "paypal" ? "active" : ""}`}
                        onClick={() => setPaymentOption("paypal")}
                      >
                        🅿️ PayPal
                      </button>
                      <button 
                        type="button" 
                        className={`pay-opt-btn ${paymentOption === "apple" ? "active" : ""}`}
                        onClick={() => setPaymentOption("apple")}
                      >
                        🍎 Apple Pay
                      </button>
                    </div>

                    {paymentOption === "card" ? (
                      <div className="payment-form-fields">
                        <div className="form-group">
                          <label>Cardholder Name</label>
                          <input 
                            type="text" 
                            className={`glass-input ${formErrors.name ? "input-border-error" : ""}`} 
                            placeholder="e.g. Sumeet" 
                            value={cardholderName}
                            onChange={(e) => {
                              setCardholderName(e.target.value);
                              if (formErrors.name) setFormErrors({ ...formErrors, name: "" });
                            }}
                          />
                          {formErrors.name && <span className="inline-error-msg">{formErrors.name}</span>}
                        </div>

                        <div className="form-group">
                          <label>Card Number</label>
                          <input 
                            type="text" 
                            className={`glass-input ${formErrors.cardNumber ? "input-border-error" : ""}`} 
                            placeholder="1111 - 2222 - 3333 - 4444" 
                            maxLength={19}
                            value={cardNumber}
                            onChange={handleCardNumberChange}
                          />
                          {formErrors.cardNumber && <span className="inline-error-msg">{formErrors.cardNumber}</span>}
                        </div>

                        <div className="form-row">
                          <div className="form-group form-group-flex">
                            <label>Expiry Date</label>
                            <input 
                              type="text" 
                              className={`glass-input ${formErrors.expiry ? "input-border-error" : ""}`} 
                              placeholder="MM/YY" 
                              maxLength={5}
                              value={expiry}
                              onChange={handleExpiryChange}
                            />
                            {formErrors.expiry && <span className="inline-error-msg">{formErrors.expiry}</span>}
                          </div>
                          <div className="form-group form-group-flex">
                            <label>CVV</label>
                            <input 
                              type="password" 
                              className={`glass-input ${formErrors.cvv ? "input-border-error" : ""}`} 
                              placeholder="•••" 
                              maxLength={3}
                              value={cvv}
                              onChange={handleCvvChange}
                            />
                            {formErrors.cvv && <span className="inline-error-msg">{formErrors.cvv}</span>}
                          </div>
                        </div>

                        <div className="form-group">
                          <label>Billing Address</label>
                          <input 
                            type="text" 
                            className={`glass-input ${formErrors.billingAddress ? "input-border-error" : ""}`} 
                            placeholder="777 Ethereal Pathway, Zen City, CA" 
                            value={billingAddress}
                            onChange={(e) => {
                              setBillingAddress(e.target.value);
                              if (formErrors.billingAddress) setFormErrors({ ...formErrors, billingAddress: "" });
                            }}
                          />
                          {formErrors.billingAddress && <span className="inline-error-msg">{formErrors.billingAddress}</span>}
                        </div>
                      </div>
                    ) : (
                      <div className="mock-payment-message">
                        <p>Redirecting transaction telemetry through secure {paymentOption === "paypal" ? "PayPal Vault" : "Apple Pay Gateway"} on confirmation click.</p>
                      </div>
                    )}
                  </>
                )}

                <Button 
                  variant="gold" 
                  type="submit" 
                  disabled={processing || selections.length === 0}
                  className="btn-full-mt-24"
                >
                  {processing ? "Securing Transaction..." : totalCost === 0 ? "Confirm Complimentary Booking" : `Complete Payment - ${formatCurrency(totalCost)}`}
                </Button>
              </form>
            </div>

            {/* Right side: Order Summary & Order History Sidebar (From Slide 2) */}
            <div className="checkout-summary-col">
              
              {/* Order Summary */}
              <Card variant="glass" className="card-pad-24 card-mb-24">
                <h3 className="checkout-section-title section-title-bordered">
                  Order Summary
                </h3>
                {selections.length === 0 ? (
                  <p className="text-muted-sm">No active sessions in cart.</p>
                ) : (
                  <div className="checkout-summary-items-list summary-list-stack">
                    {selections.map(s => (
                      <div key={s.id} className="summary-item-row">
                        <div className="item-label-group">
                          <span className="item-name">{s.name}</span>
                          <span className="item-prac">Practitioner: {s.practitioner}</span>
                        </div>
                        <span className="item-price">{formatCurrency(s.price)}</span>
                      </div>
                    ))}
                    
                    <div className="summary-total-row">
                      <span>Total Amount:</span>
                      <span className="summary-total-val">{formatCurrency(totalCost)}</span>
                    </div>
                  </div>
                )}
              </Card>

              {/* Order History Sidebar (From Slide 2) */}
              <Card variant="glass" className="history-sidebar-card">
                <h3 className="checkout-section-title section-title-bordered">
                  Order History
                </h3>
                
                <div className="history-list-container">
                  {orderHistory.length === 0 ? (
                    <p className="text-muted-xs-mt">
                      No past booking telemetry resolved.
                    </p>
                  ) : (
                    <div className="history-items-vertical-list">
                      {orderHistory.map(oh => (
                        <div key={oh.id} className="history-item-block">
                          <div className="history-header">
                            <span className="history-service-name">{oh.serviceName}</span>
                            <span className={`history-status-badge ${oh.paymentStatus}`}>
                              {oh.paymentStatus.toUpperCase()}
                            </span>
                          </div>
                          
                          <div className="history-body">
                            <span>Practitioner: <strong>{oh.practitionerName}</strong></span>
                            <span>Scheduled: <strong>{oh.date} ({oh.timeSlot})</strong></span>
                            <span>Fee: <strong>{formatCurrency(oh.price)}</strong></span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </Card>

            </div>

          </div>
        )}

      </main>

      <Footer />

      <style jsx>{`
        .checkout-container {
          max-width: 1200px;
          margin: 0 auto;
          padding: 40px 24px;
          display: flex;
          flex-direction: column;
          gap: 32px;
          width: 100%;
        }
        .checkout-header-title {
          font-size: 1.8rem;
          color: #4c1d95;
          margin-bottom: 8px;
        }
        .checkout-grid {
          display: grid;
          grid-template-columns: 1.4fr 1fr;
          gap: 32px;
          width: 100%;
        }
        .checkout-form-col {
          display: flex;
          flex-direction: column;
        }
        .payment-card-panel {
          padding: 32px;
        }
        .free-session-notice-box {
          background: rgba(168, 85, 247, 0.05);
          border: 1px solid rgba(168, 85, 247, 0.2);
          border-radius: 12px;
          padding: 20px;
          margin-bottom: 16px;
          color: hsl(var(--text-cream));
          text-align: center;
        }
        .free-session-icon {
          font-size: 2rem;
          display: block;
          margin-bottom: 8px;
        }
        .free-session-title {
          color: #a855f7;
          font-weight: 700;
          margin-bottom: 6px;
        }
        .free-session-desc {
          font-size: 0.88rem;
          color: hsl(var(--text-muted));
        }
        .checkout-section-title {
          font-family: var(--font-serif);
          font-size: 1.25rem;
          color: #4c1d95;
          margin-bottom: 20px;
          letter-spacing: 0.05em;
        }
        .payment-options-row {
          display: flex;
          gap: 12px;
          margin-bottom: 24px;
          background: rgba(0,0,0,0.04);
          padding: 6px;
          border-radius: 10px;
          border: 1px solid rgba(0,0,0,0.05);
        }
        .pay-opt-btn {
          flex: 1;
          background: transparent;
          border: none;
          color: hsl(var(--text-muted));
          padding: 10px 0;
          cursor: pointer;
          font-size: 0.85rem;
          font-weight: 600;
          border-radius: 8px;
          transition: var(--transition-fast);
        }
        .pay-opt-btn:hover {
          color: hsl(var(--text-cream));
        }
        .pay-opt-btn.active {
          background: rgba(255,255,255,0.9);
          color: #7c3aed;
          box-shadow: 0 4px 10px rgba(0,0,0,0.05);
        }
        .payment-form-fields {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        .form-group {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .input-border-error {
          border-color: #ef4444 !important;
          box-shadow: 0 0 10px rgba(239, 68, 68, 0.15) !important;
        }
        .inline-error-msg {
          color: #ef4444;
          font-size: 0.75rem;
          margin-top: 4px;
          font-weight: 600;
          text-align: left;
          display: block;
        }
        .form-group label {
          font-size: 0.8rem;
          color: hsl(var(--text-muted));
          text-transform: uppercase;
          letter-spacing: 0.05em;
          font-weight: 600;
        }
        .form-row {
          display: flex;
          gap: 16px;
        }
        .mock-payment-message {
          padding: 32px;
          text-align: center;
          background: rgba(0,0,0,0.01);
          border: 1px dashed rgba(0,0,0,0.1);
          border-radius: 12px;
          font-size: 0.9rem;
          color: hsl(var(--text-muted));
        }
        .checkout-summary-col {
          display: flex;
          flex-direction: column;
        }
        .summary-item-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-bottom: 1px dashed rgba(0,0,0,0.06);
          padding-bottom: 12px;
        }
        .item-label-group {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        .item-name {
          font-size: 0.95rem;
          color: hsl(var(--text-cream));
          font-weight: 600;
        }
        .item-prac {
          font-size: 0.8rem;
          color: hsl(var(--text-muted));
        }
        .item-price {
          font-family: var(--font-serif);
          color: #db2777;
          font-weight: 700;
        }
        .summary-total-row {
          display: flex;
          justify-content: space-between;
          font-size: 1.15rem;
          font-weight: 700;
          margin-top: 8px;
          border-top: 1px solid rgba(0,0,0,0.08);
          padding-top: 16px;
        }
        .summary-total-val {
          font-family: var(--font-serif);
          color: #db2777;
          font-size: 1.4rem;
        }
        .history-sidebar-card {
          padding: 24px;
        }
        .history-list-container {
          max-height: 350px;
          overflow-y: auto;
          margin-top: 16px;
          padding-right: 6px;
        }
        .history-items-vertical-list {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        .history-item-block {
          background: rgba(168, 85, 247, 0.03);
          border: 1px solid rgba(168, 85, 247, 0.15);
          padding: 12px 16px;
          border-radius: 12px;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .history-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .history-service-name {
          font-size: 0.88rem;
          font-weight: 600;
          color: #4c1d95;
        }
        .history-status-badge {
          font-size: 0.65rem;
          font-weight: 700;
          padding: 2px 8px;
          border-radius: 4px;
        }
        .history-status-badge.paid {
          background: rgba(34, 197, 94, 0.08);
          color: #15803d;
          border: 1px solid rgba(34, 197, 94, 0.25);
        }
        .history-status-badge.unpaid {
          background: rgba(239, 68, 68, 0.08);
          color: #b91c1c;
          border: 1px solid rgba(239, 68, 68, 0.25);
        }
        .history-body {
          display: flex;
          flex-direction: column;
          gap: 4px;
          font-size: 0.75rem;
          color: hsl(var(--text-muted));
        }
        .checkout-success-view {
          padding: 60px 40px;
          text-align: center;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 20px;
          max-width: 600px;
          margin: 0 auto;
        }
        .success-icon {
          font-size: 3rem;
        }
        .checkout-success-view h3 {
          font-size: 2rem;
          color: #4c1d95;
        }
        .success-instruction {
          font-size: 0.9rem;
          color: hsl(var(--text-muted));
        }
        @media (max-width: 768px) {
          .checkout-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
}
