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



        {success ? (
          <div className="checkout-success-view glass-panel">
            <span className="success-icon">✨</span>
            <h3>Alignment Secured!</h3>
            <p>Your payment has been successfully processed and your energy therapy session is confirmed.</p>
            <p className="success-instruction">Check your history in the sidebar or return home to explore more wellness resources.</p>
            <Button variant="gold" onClick={() => router.push("/")}>Return Home</Button>
          </div>
        ) : (
          <div className="payment-slip-wrapper">
            <form onSubmit={handlePaymentSubmit} noValidate className="payment-slip-card glass-panel">

              {/* Slip Header Banner */}
              <div className="slip-header">
                <div className="slip-brand">
                  <span className="slip-icon">✨</span>
                  <div>
                    <h3 className="slip-title">Diving Sanatan</h3>
                    <p className="slip-subtitle">Official Checkout & Booking Voucher</p>
                  </div>
                </div>
                <div className="slip-badge">
                  <span>EXPRESS CHECKOUT</span>
                </div>
              </div>

              <div className="slip-divider"></div>

              {/* Booking Item Details */}
              {selections.length > 0 && (
                <div className="slip-item-row">
                  <img
                    src={getServiceImage(selections[0].image)}
                    alt={selections[0].name}
                    className="slip-item-thumb"
                  />
                  <div className="slip-item-details">
                    <span className="slip-item-category">
                      {selections[0].category || selections[0].categories?.[0] || "Healing Therapy"}
                    </span>
                    <h4 className="slip-item-name">{selections[0].name}</h4>
                    {selections[0].practitioner && (
                      <p className="slip-item-sub">Guided by {selections[0].practitioner}</p>
                    )}
                    {selections[0].duration && (
                      <span className="slip-item-duration">⏱ {selections[0].duration}</span>
                    )}
                  </div>
                  <div className="slip-item-price-col">
                    <span className="slip-price-label">Price</span>
                    <span className="slip-price-val">{formatCurrency(selections[0].price)}</span>
                  </div>
                </div>
              )}

              {/* Customer Input Section */}
              <div className="slip-field-section">
                <div className="form-group">
                  <label className="slip-field-label">Customer Name</label>
                  <input
                    type="text"
                    className={`glass-input slip-input ${formErrors.name ? "input-border-error" : ""}`}
                    placeholder="Enter your full name for booking receipt..."
                    value={cardholderName}
                    onChange={(e) => {
                      setCardholderName(e.target.value);
                      if (formErrors.name) setFormErrors({ ...formErrors, name: "" });
                    }}
                  />
                  {formErrors.name && <span className="inline-error-msg">{formErrors.name}</span>}
                </div>
              </div>

              {/* Payment Summary Line */}
              <div className="slip-summary-box">
                <div className="slip-summary-line">
                  <span>Session Fee</span>
                  <span>{formatCurrency(totalCost)}</span>
                </div>
                <div className="slip-summary-line">
                  <span>Taxes & Service Charge</span>
                  <span className="free-tag">Included</span>
                </div>
                <div className="slip-summary-line total-line">
                  <span>Total Payable Amount</span>
                  <span className="total-amount-highlight">{formatCurrency(totalCost)}</span>
                </div>
              </div>

              {paymentError && (
                <div className="payment-error-banner">
                  ⚠ {paymentError}
                </div>
              )}

              {/* Security & Direct Payment Info */}
              <div className="slip-payment-method-box">
                <div className="express-badge-row">
                  <span className="rzp-pill">🔒 Instant Payment Gateway</span>
                  <span className="rzp-pill gold">256-Bit SSL Encrypted</span>
                </div>
                <p className="express-desc">
                  Pay smoothly via <strong>UPI (GPay, PhonePe, Paytm, BHIM), Credit/Debit Cards, NetBanking</strong> or Wallets.
                </p>
              </div>

              {/* Submit CTA Button */}
              <button
                type="submit"
                disabled={processing || selections.length === 0}
                className="express-pay-btn slip-pay-btn"
              >
                {processing ? (
                  "Launching Payment Modal..."
                ) : totalCost === 0 ? (
                  "Confirm Complimentary Booking"
                ) : (
                  `🔒 PAY ${formatCurrency(totalCost)} NOW & CONFIRM`
                )}
              </button>

              <p className="instant-pay-hint">⚡ Click button above to complete transaction instantly</p>

            </form>
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
        .checkout-header {
          text-align: center;
        }
        .checkout-header-title {
          font-size: 2rem;
          color: #4c1d95;
          margin-bottom: 6px;
        }
        .payment-slip-wrapper {
          max-width: 620px;
          margin: 0 auto;
          width: 100%;
        }
        .payment-slip-card {
          padding: 36px;
          border-radius: 24px;
          background: rgba(255, 255, 255, 0.88);
          backdrop-filter: blur(16px);
          border: 1px solid rgba(124, 58, 237, 0.2);
          box-shadow: 0 20px 50px rgba(76, 29, 149, 0.08);
          display: flex;
          flex-direction: column;
          gap: 22px;
        }
        .slip-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .slip-brand {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .slip-icon {
          font-size: 1.8rem;
        }
        .slip-title {
          font-family: var(--font-serif);
          font-size: 1.35rem;
          color: #4c1d95;
          margin: 0;
          font-weight: 700;
        }
        .slip-subtitle {
          font-size: 0.82rem;
          color: #64748b;
          margin: 0;
        }
        .slip-badge {
          background: rgba(168, 85, 247, 0.1);
          color: #7c3aed;
          font-size: 0.68rem;
          font-weight: 800;
          padding: 4px 10px;
          border-radius: 20px;
          letter-spacing: 0.05em;
          border: 1px solid rgba(124, 58, 237, 0.2);
        }
        .slip-divider {
          height: 1px;
          border-bottom: 2px dashed rgba(124, 58, 237, 0.18);
          width: 100%;
        }
        .slip-item-row {
          display: flex;
          align-items: center;
          gap: 16px;
          background: linear-gradient(135deg, rgba(124, 58, 237, 0.03) 0%, rgba(219, 39, 119, 0.03) 100%);
          border: 1px solid rgba(124, 58, 237, 0.15);
          padding: 16px;
          border-radius: 16px;
        }
        .slip-item-thumb {
          width: 64px;
          height: 64px;
          border-radius: 12px;
          object-fit: cover;
          flex-shrink: 0;
          border: 1px solid rgba(124, 58, 237, 0.2);
        }
        .slip-item-details {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 3px;
        }
        .slip-item-category {
          font-size: 0.68rem;
          color: #6d28d9;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.04em;
        }
        .slip-item-name {
          font-size: 1.05rem;
          font-weight: 700;
          color: #4c1d95;
          margin: 0;
        }
        .slip-item-sub {
          font-size: 0.8rem;
          color: #64748b;
          margin: 0;
        }
        .slip-item-duration {
          font-size: 0.75rem;
          color: #9333ea;
        }
        .slip-item-price-col {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
        }
        .slip-price-label {
          font-size: 0.7rem;
          color: #64748b;
          text-transform: uppercase;
        }
        .slip-price-val {
          font-family: var(--font-serif);
          font-size: 1.25rem;
          font-weight: 700;
          color: #db2777;
        }
        .slip-field-section {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .slip-field-label {
          font-size: 0.82rem;
          font-weight: 700;
          color: #4c1d95;
          text-transform: uppercase;
          letter-spacing: 0.04em;
        }
        .slip-input {
          padding: 14px 16px;
          border-radius: 12px;
          border: 1px solid rgba(124, 58, 237, 0.2);
          background: rgba(255, 255, 255, 0.95);
          font-size: 0.95rem;
          color: #1e1b4b;
          width: 100%;
        }
        .slip-summary-box {
          background: rgba(0, 0, 0, 0.02);
          border: 1px solid rgba(0, 0, 0, 0.06);
          border-radius: 14px;
          padding: 16px 20px;
          display: flex;
          flex-direction: column;
          gap: 10px;
        }
        .slip-summary-line {
          display: flex;
          justify-content: space-between;
          font-size: 0.88rem;
          color: #64748b;
        }
        .free-tag {
          color: #16a34a;
          font-weight: 600;
        }
        .slip-summary-line.total-line {
          border-top: 1px dashed rgba(0, 0, 0, 0.1);
          padding-top: 12px;
          margin-top: 4px;
          font-size: 1.1rem;
          font-weight: 800;
          color: #4c1d95;
        }
        .total-amount-highlight {
          font-family: var(--font-serif);
          font-size: 1.45rem;
          color: #db2777;
          font-weight: 800;
        }
        .slip-payment-method-box {
          background: linear-gradient(135deg, rgba(124, 58, 237, 0.05) 0%, rgba(219, 39, 119, 0.05) 100%);
          border: 1px solid rgba(124, 58, 237, 0.2);
          padding: 16px 20px;
          border-radius: 14px;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .slip-pay-btn {
          margin-top: 6px;
        }
        .express-badge-row {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
        }
        .express-desc {
          font-size: 0.88rem;
          color: #334155;
          line-height: 1.5;
          margin: 0;
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
        .mb-20 {
          margin-bottom: 20px;
        }
        .express-pay-btn {
          width: 100%;
          background: linear-gradient(135deg, #7c3aed 0%, #a855f7 50%, #db2777 100%);
          color: #ffffff;
          font-size: 1.15rem;
          font-weight: 800;
          padding: 16px 24px;
          border-radius: 14px;
          border: none;
          cursor: pointer;
          box-shadow: 0 8px 25px rgba(124, 58, 237, 0.35);
          transition: all 0.25s ease;
          letter-spacing: 0.03em;
        }
        .express-pay-btn:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 12px 30px rgba(124, 58, 237, 0.45);
          filter: brightness(1.05);
        }
        .express-pay-btn:active:not(:disabled) {
          transform: translateY(0);
        }
        .express-pay-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
        .instant-pay-hint {
          text-align: center;
          font-size: 0.8rem;
          color: #64748b;
          margin-top: 12px;
          margin-bottom: 0;
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
