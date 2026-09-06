"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useRouter } from "next/navigation";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { formatCurrency } from "@/utils/formatters";

import Script from "next/script";

declare global {
  interface Window {
    Razorpay: any;
  }
}

interface Service {
  id: string;
  name: string;
  price: number;
  duration?: string;
  practitioner?: string;
  category?: string;
  categories?: string[];
  image?: string;
  description?: string;
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
    aura_balancing: "/images/service_aura_scanning.png",
    crystal_healing: "/images/service_reiki_healing.png",
    chakra_clearing: "/images/service_chakra_healing.png",
    mindfulness_meditation: "/images/service_meditation_program.png",
    anxiety_release: "/images/service_reiki_healing.png",
    spiritual_counseling: "/images/service_personal_guidance.png",
    akashic: "/images/service_akashic.png",
    regression: "/images/service_regression.png",
  };
  return mappings[imgName] || "/images/service_chakra_healing.png";
};

export default function CheckoutPage() {
  const router = useRouter();

  // Local state
  const [selections, setSelections] = useState<Service[]>([]);
  const [bookingId, setBookingId] = useState<string | null>(null);
  
  // Customer details
  const [clientEmail, setClientEmail] = useState("");
  const [clientPhone, setClientPhone] = useState("");
  
  // Form input states
  const [paymentOption, setPaymentOption] = useState<"razorpay" | "card" | "paypal" | "apple">("razorpay");
  const [cardholderName, setCardholderName] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvv, setCvv] = useState("");
  const [billingAddress, setBillingAddress] = useState("");

  const [processing, setProcessing] = useState(false);
  const [success, setSuccess] = useState(false);
  const [paymentError, setPaymentError] = useState("");

  // Validation errors
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // History state
  const [orderHistory, setOrderHistory] = useState<BookingRecord[]>([]);

  // 1. Load Selections & Booking ID on mount, and enrich with service database
  useEffect(() => {
    async function initCheckoutData() {
      try {
        const storedSrv = window.localStorage.getItem("divingsanatan_selections");
        let initialSelections: Service[] = storedSrv ? JSON.parse(storedSrv) : [];

        const bid = window.localStorage.getItem("active_booking_id");
        if (bid) {
          setBookingId(bid);
        }

        // Fetch services from API to enrich image, duration, practitioner if missing
        try {
          const res = await fetch("/api/services");
          const json = await res.json();
          if (json.success && Array.isArray(json.data)) {
            const dbServices: Service[] = json.data;
            if (initialSelections.length > 0) {
              const enriched = initialSelections.map((sel) => {
                const match = dbServices.find(
                  (s) => s.id === sel.id || s.name.toLowerCase() === sel.name.toLowerCase()
                );
                if (match) {
                  return {
                    ...match,
                    ...sel,
                    image: sel.image || match.image,
                    category: sel.category || match.category || match.categories?.[0],
                    duration: sel.duration || match.duration,
                    practitioner: sel.practitioner || match.practitioner,
                  };
                }
                return sel;
              });
              setSelections(enriched);
            } else if (bid) {
              const bRes = await fetch("/api/bookings");
              const bJson = await bRes.json();
              if (bJson.success && Array.isArray(bJson.data)) {
                const activeBooking = bJson.data.find((b: any) => b.id === bid);
                if (activeBooking) {
                  const sMatch = dbServices.find(
                    (s) => s.name.toLowerCase() === activeBooking.serviceName.toLowerCase()
                  );
                  if (sMatch) {
                    setSelections([{ ...sMatch, practitioner: activeBooking.practitionerName || sMatch.practitioner }]);
                  }
                }
              }
            }
          } else if (initialSelections.length > 0) {
            setSelections(initialSelections);
          }
        } catch (srvErr) {
          console.warn("Could not load service database for enrichment:", srvErr);
          if (initialSelections.length > 0) {
            setSelections(initialSelections);
          }
        }

        const savedProfile = window.localStorage.getItem("divingsanatan_user_profile");
        if (savedProfile) {
          const parsed = JSON.parse(savedProfile);
          if (parsed.name) setCardholderName(parsed.name);
          if (parsed.email) setClientEmail(parsed.email);
          if (parsed.phone) setClientPhone(parsed.phone);
        }
        if (typeof window !== "undefined" && window.location.search.includes("success=true")) {
          setSuccess(true);
        }
      } catch (e) {
        console.warn(e);
      }
    }

    initCheckoutData();
  }, []);

  // 2. Fetch all bookings for order history sidebar
  const fetchOrderHistory = async () => {
    try {
      const res = await fetch("/api/bookings");
      const json = await res.json();
      if (json.success) {
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
    
    if (!cardholderName.trim()) {
      errors.name = "Full Name is required";
    }

    if (paymentOption === "card") {
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

  // Razorpay Checkout handler
  const handleRazorpayPayment = async () => {
    setProcessing(true);
    setPaymentError("");

    try {
      // 1. Create order on backend
      const res = await fetch("/api/razorpay/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: totalCost,
          bookingId: bookingId || "",
          notes: {
            customerName: cardholderName,
            customerEmail: clientEmail,
            customerPhone: clientPhone,
          },
        }),
      });

      const orderData = await res.json();
      if (!orderData.success) {
        setPaymentError(orderData.error || "Failed to initialize Razorpay payment");
        setProcessing(false);
        return;
      }

      const { order, keyId } = orderData;

      if (!window.Razorpay) {
        setPaymentError("Razorpay SDK failed to load. Please check your internet connection.");
        setProcessing(false);
        return;
      }

      // 2. Configure Razorpay modal options
      const selectedImageName = selections[0]?.image;
      const imagePath = getServiceImage(selectedImageName);
      const absoluteImageUrl = typeof window !== "undefined" && imagePath.startsWith("/")
        ? `${window.location.origin}${imagePath}`
        : imagePath;

      const options = {
        key: keyId,
        amount: order.amount,
        currency: order.currency,
        name: "Diving Sanatan",
        description: selections.map(s => s.name).join(", ") || "Wellness Therapy Session",
        image: absoluteImageUrl,
        order_id: order.id,
        handler: async function (response: any) {
          try {
            // 3. Verify signature on backend
            const verifyRes = await fetch("/api/razorpay/verify-payment", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                bookingId: bookingId,
              }),
            });

            const verifyJson = await verifyRes.json();

            if (verifyJson.success) {
              window.localStorage.removeItem("divingsanatan_selections");
              window.localStorage.removeItem("active_booking_id");
              setSelections([]);
              setSuccess(true);
              fetchOrderHistory();
            } else {
              setPaymentError(`Payment verification failed: ${verifyJson.error}`);
            }
          } catch (err: any) {
            console.error("Verification error:", err);
            setPaymentError("Payment verified, but sync failed.");
          } finally {
            setProcessing(false);
          }
        },
        prefill: {
          name: cardholderName || "Guest",
          email: clientEmail || "guest@divingsanatan.com",
          contact: clientPhone || "9999999999",
        },
        notes: {
          bookingId: bookingId || "",
        },
        theme: {
          color: "#7c3aed",
        },
        modal: {
          ondismiss: function () {
            setProcessing(false);
          },
        },
      };

      const rzp1 = new window.Razorpay(options);
      rzp1.on("payment.failed", function (response: any) {
        setPaymentError(`Payment Failed: ${response.error?.description || "Transaction cancelled"}`);
        setProcessing(false);
      });
      rzp1.open();
    } catch (err: any) {
      console.error("Razorpay Payment Error:", err);
      setPaymentError("Connection error while communicating with Razorpay.");
      setProcessing(false);
    }
  };

  // Submit payment handler
  const handlePaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    if (totalCost === 0) {
      // Free booking submit
      setProcessing(true);
      if (bookingId) {
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
      window.localStorage.removeItem("divingsanatan_selections");
      window.localStorage.removeItem("active_booking_id");
      setSelections([]);
      setSuccess(true);
      fetchOrderHistory();
      setProcessing(false);
      return;
    }

    if (paymentOption === "razorpay") {
      await handleRazorpayPayment();
      return;
    }

    // Fallback Card / Simulated Option
    setProcessing(true);
    await new Promise((resolve) => setTimeout(resolve, 1500));

    try {
      if (bookingId) {
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
      
      window.localStorage.removeItem("divingsanatan_selections");
      window.localStorage.removeItem("active_booking_id");
      setSelections([]);
      setSuccess(true);
      fetchOrderHistory();
    } catch (err) {
      console.error("Payment registration failure:", err);
      alert("Payment processed, but failed to sync database session.");
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="page-shell">
      <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="lazyOnload" />
      <Header />

      <main className="checkout-container">
        
        {/* Page Title */}
        <section className="checkout-header">
          <h2 className="checkout-header-title">Payment / Checkout</h2>
          <p className="text-muted-sm">
            Complete your wellness transaction securely via Razorpay (UPI, Credit/Debit Cards, NetBanking, Wallets).
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

              {/* Active Service Highlight Banner */}
              {selections.length > 0 && (
                <div className="selected-service-checkout-banner glass-panel">
                  <div className="banner-img-container">
                    <img
                      src={getServiceImage(selections[0].image)}
                      alt={selections[0].name}
                      className="banner-service-thumb"
                    />
                  </div>
                  <div className="banner-service-info">
                    <div className="banner-tag-row">
                      <span className="banner-service-tag">
                        {selections[0].category || selections[0].categories?.[0] || "Healing Session"}
                      </span>
                      {selections[0].duration && <span className="banner-duration-tag">⏱ {selections[0].duration}</span>}
                    </div>
                    <h3 className="banner-service-title">{selections[0].name}</h3>
                    {selections[0].practitioner && (
                      <p className="banner-practitioner-text">
                        Guided by <strong>{selections[0].practitioner}</strong>
                      </p>
                    )}
                  </div>
                  <div className="banner-service-price">
                    {formatCurrency(selections[0].price)}
                  </div>
                </div>
              )}

              <form onSubmit={handlePaymentSubmit} noValidate className="payment-card-panel glass-panel">
                <h3 className="checkout-section-title">Payment Method & Billing</h3>

                {paymentError && (
                  <div className="payment-error-banner">
                    ⚠ {paymentError}
                  </div>
                )}

                {totalCost === 0 ? (
                  <div className="free-session-notice-box">
                    <span className="free-session-icon">✨</span>
                    <h4 className="free-session-title">Complimentary Session</h4>
                    <p className="free-session-desc">This session is completely free. No payment details or credit cards are required to secure your appointment.</p>
                  </div>
                ) : (
                  <>
                    {/* Options selector */}
                    <div className="payment-options-row">
                      <button 
                        type="button" 
                        className={`pay-opt-btn ${paymentOption === "razorpay" ? "active" : ""}`}
                        onClick={() => setPaymentOption("razorpay")}
                      >
                        ⚡ Razorpay (UPI/Cards/NetBanking)
                      </button>
                      <button 
                        type="button" 
                        className={`pay-opt-btn ${paymentOption === "card" ? "active" : ""}`}
                        onClick={() => setPaymentOption("card")}
                      >
                        💳 Card
                      </button>
                      <button 
                        type="button" 
                        className={`pay-opt-btn ${paymentOption === "paypal" ? "active" : ""}`}
                        onClick={() => setPaymentOption("paypal")}
                      >
                        🅿️ PayPal
                      </button>
                    </div>

                    <div className="form-group mb-16">
                      <label>Customer Name</label>
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

                    {paymentOption === "razorpay" ? (
                      <div className="razorpay-info-box">
                        <div className="razorpay-badge-row">
                          <span className="rzp-pill">🔒 Secure 256-bit Encryption</span>
                          <span className="rzp-pill gold">Instant Confirmation</span>
                        </div>
                        <p className="razorpay-desc">
                          Pay smoothly using <strong>UPI (Google Pay, PhonePe, Paytm, BHIM), Credit/Debit Cards, NetBanking</strong> or popular Mobile Wallets via Razorpay.
                        </p>
                      </div>
                    ) : paymentOption === "card" ? (
                      <div className="payment-form-fields">
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
                  {processing ? "Securing Transaction..." : totalCost === 0 ? "Confirm Complimentary Booking" : paymentOption === "razorpay" ? `Pay with Razorpay - ${formatCurrency(totalCost)}` : `Complete Payment - ${formatCurrency(totalCost)}`}
                </Button>
              </form>
            </div>


            {/* Right side: Order Summary & Order History Sidebar */}
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
                      <div key={s.id} className="summary-item-card">
                        <img
                          src={getServiceImage(s.image)}
                          alt={s.name}
                          className="summary-item-thumb"
                        />
                        <div className="summary-item-info">
                          <span className="summary-item-name">{s.name}</span>
                          {s.practitioner && (
                            <span className="summary-item-prac">Guided by {s.practitioner}</span>
                          )}
                          {s.duration && (
                            <span className="summary-item-duration">⏱ {s.duration}</span>
                          )}
                        </div>
                        <span className="summary-item-price">{formatCurrency(s.price)}</span>
                      </div>
                    ))}
                    
                    <div className="summary-total-row">
                      <span>Total Amount:</span>
                      <span className="summary-total-val">{formatCurrency(totalCost)}</span>
                    </div>
                  </div>
                )}
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
        .payment-error-banner {
          background: rgba(239, 68, 68, 0.08);
          border: 1px solid rgba(239, 68, 68, 0.3);
          color: #dc2626;
          padding: 12px 16px;
          border-radius: 10px;
          font-size: 0.88rem;
          margin-bottom: 16px;
          font-weight: 500;
        }
        .razorpay-info-box {
          background: linear-gradient(135deg, rgba(124, 58, 237, 0.05) 0%, rgba(168, 85, 247, 0.08) 100%);
          border: 1px solid rgba(124, 58, 237, 0.2);
          padding: 20px;
          border-radius: 12px;
          display: flex;
          flex-direction: column;
          gap: 12px;
          margin-bottom: 16px;
        }
        .razorpay-badge-row {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
        }
        .rzp-pill {
          background: rgba(124, 58, 237, 0.1);
          color: #6d28d9;
          font-size: 0.72rem;
          font-weight: 700;
          padding: 4px 10px;
          border-radius: 20px;
        }
        .rzp-pill.gold {
          background: rgba(217, 119, 6, 0.1);
          color: #b45309;
        }
        .razorpay-desc {
          font-size: 0.88rem;
          color: #334155;
          line-height: 1.5;
        }
        .mb-16 {
          margin-bottom: 16px;
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
        .selected-service-checkout-banner {
          display: flex;
          align-items: center;
          gap: 16px;
          padding: 16px 20px;
          margin-bottom: 24px;
          background: linear-gradient(135deg, rgba(124, 58, 237, 0.06) 0%, rgba(219, 39, 119, 0.06) 100%);
          border: 1px solid rgba(124, 58, 237, 0.2);
          border-radius: 16px;
        }
        .banner-img-container {
          width: 72px;
          height: 72px;
          border-radius: 12px;
          overflow: hidden;
          flex-shrink: 0;
          border: 1px solid rgba(124, 58, 237, 0.2);
          box-shadow: 0 4px 12px rgba(0,0,0,0.06);
        }
        .banner-service-thumb {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        .banner-service-info {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        .banner-tag-row {
          display: flex;
          gap: 8px;
          align-items: center;
        }
        .banner-service-tag {
          background: rgba(124, 58, 237, 0.12);
          color: #6d28d9;
          font-size: 0.7rem;
          font-weight: 700;
          padding: 2px 8px;
          border-radius: 6px;
          text-transform: uppercase;
          letter-spacing: 0.03em;
        }
        .banner-duration-tag {
          font-size: 0.75rem;
          color: hsl(var(--text-muted));
        }
        .banner-service-title {
          font-size: 1.1rem;
          font-weight: 700;
          color: #4c1d95;
          margin: 0;
        }
        .banner-practitioner-text {
          font-size: 0.8rem;
          color: hsl(var(--text-muted));
          margin: 0;
        }
        .banner-service-price {
          font-family: var(--font-serif);
          font-size: 1.4rem;
          font-weight: 700;
          color: #db2777;
        }
        .checkout-summary-col {
          display: flex;
          flex-direction: column;
        }
        .summary-item-card {
          display: flex;
          align-items: center;
          gap: 12px;
          border-bottom: 1px dashed rgba(0,0,0,0.08);
          padding-bottom: 12px;
          margin-bottom: 12px;
        }
        .summary-item-thumb {
          width: 54px;
          height: 54px;
          border-radius: 10px;
          object-fit: cover;
          flex-shrink: 0;
          border: 1px solid rgba(0,0,0,0.08);
        }
        .summary-item-info {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 2px;
        }
        .summary-item-name {
          font-size: 0.92rem;
          color: #4c1d95;
          font-weight: 700;
        }
        .summary-item-prac {
          font-size: 0.78rem;
          color: hsl(var(--text-muted));
        }
        .summary-item-duration {
          font-size: 0.75rem;
          color: #6d28d9;
        }
        .summary-item-price {
          font-family: var(--font-serif);
          color: #db2777;
          font-weight: 700;
          font-size: 1.05rem;
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
        @media (max-width: 480px) {
          .payment-options-row {
            flex-direction: column !important;
            gap: 8px !important;
            padding: 8px !important;
          }
          .pay-opt-btn {
            width: 100% !important;
            padding: 12px 0 !important;
          }
        }
      `}</style>
    </div>
  );
}
