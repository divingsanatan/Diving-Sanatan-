"use client";

import React, { useState, useEffect, Suspense, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { formatCurrency } from "@/utils/formatters";
import { Service } from "@/types/database";

interface Practitioner {
  id: string;
  name: string;
  specialty: string;
  bio: string;
  rating: number;
  reviewsCount: number;
  image: string;
}

function BookingContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryServiceId = searchParams.get("service");

  // Databases states
  const [services, setServices] = useState<Service[]>([]);
  const [practitioners, setPractitioners] = useState<Practitioner[]>([]);

  // Selection states
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [selectedPractitioner, setSelectedPractitioner] = useState<Practitioner | null>(null);
  const [selectedDate, setSelectedDate] = useState<number | null>(14); // Default to June 14
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<string | null>("10:00 AM");

  // Hover popup for practitioner bio
  const [showBioPopup, setShowBioPopup] = useState(false);

  // Form states
  const [clientName, setClientName] = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [clientPhone, setClientPhone] = useState("");
  const [clientNotes, setClientNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");

  // Validation states
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const getServiceImage = (imgName: string) => {
    if (!imgName) return "/images/reiki_placeholder.jpg";
    if (imgName.startsWith("http") || imgName.startsWith("/")) return imgName;
    const mappings: Record<string, string> = {
      aura_balancing: "/images/service_chakra.png",
      crystal_healing: "/images/service_regression.png",
      chakra_clearing: "/images/service_akashic.png",
      mindfulness_meditation: "/images/service_chakra.png",
      anxiety_release: "/images/service_regression.png",
      spiritual_counseling: "/images/service_akashic.png",
    };
    return mappings[imgName] || "/images/reiki_placeholder.jpg";
  };

  const getEmbedUrl = (url: string) => {
    if (!url) return null;
    const isVideoFile = url.match(/\.(mp4|webm|ogg|mov|mkv)($|\?)/i) || url.includes("/storage/v1/object/public/");
    if (isVideoFile) return null;
    if (url.includes("youtube.com/shorts/")) {
      const id = url.split("youtube.com/shorts/")[1]?.split(/[?&]/)[0];
      if (id) return `https://www.youtube.com/embed/${id}`;
    }
    const ytRegExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#&?]*).*/;
    const match = url.match(ytRegExp);
    if (match && match[2].length === 11) return `https://www.youtube.com/embed/${match[2]}`;
    if (url.includes("embed")) return url;
    return null;
  };

  // Prefill details from localStorage
  useEffect(() => {
    const saved = window.localStorage.getItem("divingsanatan_user_profile");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.name) setClientName(parsed.name);
        if (parsed.email) setClientEmail(parsed.email);
        if (parsed.phone) setClientPhone(parsed.phone);
      } catch (e) {
        console.warn("Failed to load saved profile in booking:", e);
      }
    }
  }, []);

  // Calendar dates mock (June 2026)
  const daysInMonth = Array.from({ length: 30 }, (_, i) => i + 1);
  const daysOfWeek = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
  const startingDayIndex = 1; // June 1st, 2026 starts on Monday (1)

  // Time slots mock
  const timeSlots = ["10:00 AM", "12:00 PM", "02:00 PM", "04:00 PM", "08:00 PM"];

  // Load services and practitioners
  useEffect(() => {
    async function loadData() {
      try {
        const sRes = await fetch("/api/services");
        const sJson = await sRes.json();

        const pRes = await fetch("/api/practitioners");
        const pJson = await pRes.json();

        if (sJson.success && pJson.success) {
          setServices(sJson.data);
          setPractitioners(pJson.data);

          // Resolve query service
          if (queryServiceId) {
            const activeSrv = sJson.data.find((s: Service) => s.id === queryServiceId);
            if (activeSrv) {
              setSelectedService(activeSrv);
              const activePrac = pJson.data.find((p: Practitioner) => p.name === activeSrv.practitioner);
              if (activePrac) setSelectedPractitioner(activePrac);
            }
          } else {
            // Default select first items
            setSelectedService(sJson.data[0]);
            const activePrac = pJson.data.find((p: Practitioner) => p.name === sJson.data[0].practitioner);
            if (activePrac) setSelectedPractitioner(activePrac);
          }
        }
      } catch (err) {
        console.error("Error loading scheduling databases:", err);
      }
    }
    loadData();
  }, [queryServiceId]);

  // Adjust practitioner when service changes
  const handleServiceChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const srv = services.find(s => s.id === e.target.value);
    if (srv) {
      setSelectedService(srv);
      const prac = practitioners.find(p => p.name === srv.practitioner);
      if (prac) setSelectedPractitioner(prac);
    }
  };

  const validateForm = () => {
    const errors: Record<string, string> = {};
    if (!clientName.trim()) {
      errors.name = "Full Name is required";
    } else if (clientName.trim().length < 2) {
      errors.name = "Full Name must be at least 2 characters";
    } else if (!/^[A-Za-z\s]+$/.test(clientName)) {
      errors.name = "Full Name must contain only letters and spaces";
    }

    const emailPattern = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/;
    if (!clientEmail.trim()) {
      errors.email = "Email Address is required";
    } else if (!emailPattern.test(clientEmail)) {
      errors.email = "Please enter a valid email address";
    }

    const digitsOnly = clientPhone.replace(/\D/g, "");
    if (!clientPhone.trim()) {
      errors.phone = "Phone number is required";
    } else if (digitsOnly.length < 10) {
      errors.phone = "Please enter a valid phone number with at least 10 digits";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Submit appointment booking
  const handleBookingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedService || !selectedPractitioner || !selectedDate || !selectedTimeSlot) {
      alert("Please ensure all booking metrics (Service, Practitioner, Date, Time) are selected.");
      return;
    }
    if (!validateForm()) return;

    setSubmitting(true);
    setMessage("");

    // Update localStorage cache
    try {
      const savedProfile = window.localStorage.getItem("divingsanatan_user_profile");
      const currentProfile = savedProfile ? JSON.parse(savedProfile) : {};
      const updatedProfile = {
        ...currentProfile,
        name: clientName,
        email: clientEmail,
        phone: clientPhone
      };
      window.localStorage.setItem("divingsanatan_user_profile", JSON.stringify(updatedProfile));
    } catch (err) {
      console.warn("Failed to update saved profile in booking:", err);
    }

    try {
      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          serviceId: selectedService.id,
          serviceName: selectedService.name,
          practitionerId: selectedPractitioner.id,
          practitionerName: selectedPractitioner.name,
          date: `2026-06-${selectedDate.toString().padStart(2, "0")}`,
          timeSlot: selectedTimeSlot,
          price: selectedService.price,
          clientName,
          clientEmail,
          clientPhone,
          notes: clientNotes,
        })
      });

      const json = await res.json();
      if (json.success) {
        // Automatically save newly booked session in local selections cart for seamless payment
        const activeSelections = [selectedService];
        window.localStorage.setItem("divingsanatan_selections", JSON.stringify(activeSelections));
        window.localStorage.setItem("active_booking_id", json.data.id);

        router.push("/checkout");
      } else {
        setMessage(`Booking error: ${json.error}`);
      }
    } catch (err) {
      console.error(err);
      setMessage("Connection error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const heroImageRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (selectedService && heroImageRef.current) {
      heroImageRef.current.style.setProperty(
        "--bg-image",
        `url(${getServiceImage(selectedService.image)})`
      );
    }
  }, [selectedService]);

  return (
    <div className="page-shell">
      <Header />

      <main className="booking-container">

        {/* Page title */}
        <section className="booking-header">
          <h2 className="booking-header-title">Booking/Calendar Page</h2>
          <p className="text-muted-sm">
            Align your schedule with our cosmic practitioners. Enter client telemetry to finalize appointments.
          </p>
        </section>

        <div className="booking-main-split">
          {/* Left — Service showcase */}
          <div className="booking-service-col">
            {selectedService ? (
              <Card variant="glass" className="service-showcase-card">
                <div
                  ref={heroImageRef}
                  className="service-hero-image bg-var-image"
                />
                <div className="service-showcase-body">
                  <div className="service-meta-row">
                    <span className="service-category-pill">
                      {selectedService.categories?.[0] || selectedService.category}
                    </span>
                    <span className="service-rating-pill">⭐ {selectedService.rating?.toFixed(1) || "5.0"}</span>
                  </div>
                  <h2 className="service-showcase-title">{selectedService.name}</h2>
                  <p className="service-practitioner-line">
                    Guided by <strong>{selectedService.practitioner}</strong> · {selectedService.duration}
                  </p>

                  <div className="service-rich-description">
                    {selectedService.description.split("\n").filter(Boolean).map((para, i) => (
                      <p key={i}>{para}</p>
                    ))}
                    {selectedService.benefits && selectedService.benefits.length > 0 && (
                      <ul className="service-benefits-list">
                        {selectedService.benefits.map((b, i) => (
                          <li key={i}>{b}</li>
                        ))}
                      </ul>
                    )}
                  </div>

                  <div className="service-video-section">
                    <span className="video-section-label">Session Preview</span>
                    {selectedService.video_url ? (
                      (() => {
                        const embedUrl = getEmbedUrl(selectedService.video_url!);
                        return embedUrl ? (
                          <div className="video-embed-wrapper">
                            <iframe
                              src={embedUrl}
                              title={`${selectedService.name} preview`}
                              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                              allowFullScreen
                            />
                          </div>
                        ) : (
                          <video
                            src={selectedService.video_url}
                            controls
                            poster={getServiceImage(selectedService.image)}
                            className="service-video-player"
                          />
                        );
                      })()
                    ) : (
                      <div className="video-placeholder-box">
                        <span className="video-placeholder-icon">▶</span>
                        <p>Guided session video preview will appear here.</p>
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            ) : (
              <Card variant="glass" className="service-showcase-card card-pad-40-center">
                <p className="text-muted-center">Select a healing session to view details.</p>
              </Card>
            )}
          </div>

          {/* Right — Calendar, booking form & summary */}
          <form onSubmit={handleBookingSubmit} noValidate className="booking-controls-col">
            <Card variant="glass" className="card-pad-24 card-mb-24 card-stack-16">
              <div className="selector-group">
                <label>Select Healing Session</label>
                <select
                  className="glass-input"
                  value={selectedService?.id || ""}
                  onChange={handleServiceChange}
                >
                  {services.map(s => (
                    <option key={s.id} value={s.id}>{s.name} ({formatCurrency(s.price)})</option>
                  ))}
                </select>
              </div>

              {selectedPractitioner && (
                <div className="practitioner-profile-row">
                  <div className="practitioner-info-box">
                    <span className="prac-name-label">Practitioner Assigned</span>
                    <h4 className="prac-name">{selectedPractitioner.name}</h4>
                    <span className="prac-spec">{selectedPractitioner.specialty}</span>
                  </div>
                  <button
                    type="button"
                    className="view-bio-trigger-btn"
                    onClick={() => setShowBioPopup(true)}
                  >
                    View Bio & Rating
                  </button>
                </div>
              )}
            </Card>

            <Card variant="glass" className="calendar-card card-pad-24 card-mb-24">
              <div className="calendar-header-row">
                <span className="month-year-label">June 2026</span>
                <div className="calendar-tab-toggles">
                  <span className="calendar-tab active">Month</span>
                  <span className="calendar-tab">Week</span>
                </div>
              </div>

              <div className="calendar-days-titles">
                {daysOfWeek.map(d => (
                  <span key={d} className="calendar-day-header">{d}</span>
                ))}
              </div>

              <div className="calendar-dates-grid">
                {Array.from({ length: startingDayIndex }).map((_, idx) => (
                  <span key={idx} className="calendar-date-cell empty" />
                ))}
                {daysInMonth.map(day => {
                  const isSelected = selectedDate === day;
                  return (
                    <button
                      key={day}
                      type="button"
                      className={`calendar-date-cell date-btn ${isSelected ? "selected" : ""}`}
                      onClick={() => setSelectedDate(day)}
                    >
                      {day}
                    </button>
                  );
                })}
              </div>

              <div className="time-slots-section">
                <span className="slots-title">Select Time (EST)</span>
                <div className="slots-grid">
                  {timeSlots.map(slot => {
                    const isSelected = selectedTimeSlot === slot;
                    return (
                      <button
                        key={slot}
                        type="button"
                        className={`slot-btn ${isSelected ? "selected" : ""}`}
                        onClick={() => setSelectedTimeSlot(slot)}
                      >
                        {slot}
                      </button>
                    );
                  })}
                </div>
              </div>
            </Card>

            <Card variant="glass" className="card-pad-24 card-stack-20">
              <h3 className="form-column-title">Client Details & Booking Form</h3>

              <div className="form-group">
                <label>Full Name</label>
                <input
                  type="text"
                  className={`glass-input ${formErrors.name ? "input-border-error" : ""}`}
                  placeholder="e.g. Sumeet"
                  value={clientName}
                  onChange={(e) => {
                    setClientName(e.target.value);
                    if (formErrors.name) setFormErrors({ ...formErrors, name: "" });
                  }}
                />
                {formErrors.name && <span className="inline-error-msg">{formErrors.name}</span>}
              </div>

              <div className="form-group">
                <label>Email Address</label>
                <input
                  type="email"
                  className={`glass-input ${formErrors.email ? "input-border-error" : ""}`}
                  placeholder="e.g. sumeet@example.com"
                  value={clientEmail}
                  onChange={(e) => {
                    setClientEmail(e.target.value);
                    if (formErrors.email) setFormErrors({ ...formErrors, email: "" });
                  }}
                />
                {formErrors.email && <span className="inline-error-msg">{formErrors.email}</span>}
              </div>

              <div className="form-group">
                <label>Phone Number</label>
                <input
                  type="tel"
                  className={`glass-input ${formErrors.phone ? "input-border-error" : ""}`}
                  placeholder="e.g. +1 (555) 019-2834"
                  value={clientPhone}
                  onChange={(e) => {
                    setClientPhone(e.target.value);
                    if (formErrors.phone) setFormErrors({ ...formErrors, phone: "" });
                  }}
                />
                {formErrors.phone && <span className="inline-error-msg">{formErrors.phone}</span>}
              </div>

              <div className="form-group">
                <label>Somatic Notes (Optional)</label>
                <textarea
                  className="glass-input text-area-input"
                  placeholder="Tell us what you're experiencing..."
                  value={clientNotes}
                  onChange={(e) => setClientNotes(e.target.value)}
                />
              </div>

              {selectedService && (
                <div className="summary-block">
                  <h4 className="summary-title">Summary</h4>
                  <div className="summary-rows">
                    <div className="summary-row">
                      <span>Service:</span>
                      <strong>{selectedService.name}</strong>
                    </div>
                    <div className="summary-row">
                      <span>Date:</span>
                      <strong>June {selectedDate}, 2026</strong>
                    </div>
                    <div className="summary-row">
                      <span>Time:</span>
                      <strong>{selectedTimeSlot}</strong>
                    </div>
                    <div className="summary-row pricing">
                      <span>Cost:</span>
                      <strong className="summary-price">{formatCurrency(selectedService.price)}</strong>
                    </div>
                  </div>
                </div>
              )}

              {message && <p className="error-message">{message}</p>}

              <Button variant="gold" type="submit" disabled={submitting}>
                {submitting ? "Securing Session..." : "Confirm Booking"}
              </Button>
            </Card>
          </form>
        </div>
      </main>

      {/* Practitioner Bio hover modal/popup (From Slide 2) */}
      {showBioPopup && selectedPractitioner && (
        <div className="bio-modal-overlay">
          <div className="bio-modal-card glass-panel">
            <button className="close-modal-btn" onClick={() => setShowBioPopup(false)}>×</button>
            <div className="bio-modal-header">
              <h3 className="modal-title">Practitioner Bio</h3>
              <p className="modal-spec">{selectedPractitioner.specialty}</p>
            </div>

            <div className="bio-modal-body">
              <h4 className="modal-prac-name">{selectedPractitioner.name}</h4>
              <div className="modal-stars-row">
                <span className="modal-stars">★ ★ ★ ★ ★</span>
                <span className="modal-rating-score">{selectedPractitioner.rating} ({selectedPractitioner.reviewsCount} Reviews)</span>
              </div>
              <p className="modal-desc-bio">
                {selectedPractitioner.bio}
              </p>
            </div>

            <div className="modal-actions-footer">
              <Button variant="gold" size="sm" onClick={() => setShowBioPopup(false)}>
                Back to Scheduling
              </Button>
            </div>
          </div>
        </div>
      )}

      <Footer />

      <style jsx>{`
        .booking-container {
          max-width: 1200px;
          margin: 0 auto;
          padding: 40px 24px;
          display: flex;
          flex-direction: column;
          gap: 32px;
          width: 100%;
        }
        .booking-header-title {
          font-size: 1.8rem;
          color: #4c1d95;
          margin-bottom: 8px;
        }
        .booking-main-split {
          display: grid;
          grid-template-columns: 1.1fr 1fr;
          gap: 32px;
          width: 100%;
          align-items: start;
        }
        .booking-service-col {
          position: sticky;
          top: 24px;
        }
        :global(.service-showcase-card) {
          padding: 0 !important;
          overflow: hidden;
        }
        .service-hero-image {
          width: 100%;
          height: 280px;
          background-size: cover;
          background-position: center;
        }
        .service-showcase-body {
          padding: 28px;
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        .service-meta-row {
          display: flex;
          gap: 10px;
          align-items: center;
        }
        .service-category-pill {
          background: rgba(16, 185, 129, 0.08);
          border: 1px solid rgba(16, 185, 129, 0.2);
          color: #065f46;
          font-size: 0.7rem;
          font-weight: 700;
          padding: 4px 10px;
          border-radius: 6px;
          text-transform: uppercase;
        }
        .service-rating-pill {
          font-size: 0.82rem;
          font-weight: 700;
          color: #b45309;
        }
        .service-showcase-title {
          font-family: var(--font-serif);
          font-size: 2rem;
          color: #4c1d95;
          line-height: 1.2;
        }
        .service-practitioner-line {
          font-size: 0.9rem;
          color: hsl(var(--text-muted));
        }
        .service-rich-description {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .service-rich-description p {
          font-size: 0.95rem;
          line-height: 1.75;
          color: #334155;
        }
        .service-benefits-list {
          margin: 4px 0 0 18px;
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        .service-benefits-list li {
          font-size: 0.88rem;
          color: #475569;
          line-height: 1.5;
        }
        .service-video-section {
          display: flex;
          flex-direction: column;
          gap: 10px;
          margin-top: 8px;
        }
        .video-section-label {
          font-size: 0.75rem;
          font-weight: 700;
          color: hsl(var(--text-muted));
          text-transform: uppercase;
          letter-spacing: 0.06em;
        }
        .video-embed-wrapper {
          position: relative;
          width: 100%;
          padding-bottom: 56.25%;
          border-radius: 16px;
          overflow: hidden;
          background: #000;
        }
        .video-embed-wrapper iframe {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          border: none;
        }
        .service-video-player {
          width: 100%;
          border-radius: 16px;
          aspect-ratio: 16/9;
          object-fit: cover;
          background: #000;
        }
        .video-placeholder-box {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 10px;
          min-height: 200px;
          background: rgba(0, 0, 0, 0.03);
          border: 1.5px dashed rgba(124, 58, 237, 0.2);
          border-radius: 16px;
          color: hsl(var(--text-muted));
          font-size: 0.88rem;
        }
        .video-placeholder-icon {
          width: 48px;
          height: 48px;
          border-radius: 50%;
          background: rgba(124, 58, 237, 0.1);
          color: #7c3aed;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.1rem;
        }
        .booking-controls-col {
          display: flex;
          flex-direction: column;
        }
        .form-column-title {
          font-family: var(--font-serif);
          font-size: 1.15rem;
          color: #4c1d95;
        }
        .selector-group {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .selector-group label, .form-group label {
          font-size: 0.8rem;
          color: hsl(var(--text-muted));
          text-transform: uppercase;
          letter-spacing: 0.05em;
          font-weight: 600;
        }
        .practitioner-profile-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          background: rgba(0,0,0,0.02);
          border: 1px solid rgba(0,0,0,0.05);
          padding: 16px;
          border-radius: 12px;
          margin-top: 4px;
        }
        .practitioner-info-box {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        .prac-name-label {
          font-size: 0.7rem;
          text-transform: uppercase;
          color: hsl(var(--text-muted));
          letter-spacing: 0.05em;
        }
        .prac-name {
          font-size: 1.15rem;
          color: #4c1d95;
        }
        .prac-spec {
          font-size: 0.8rem;
          color: hsl(var(--text-muted));
        }
        .view-bio-trigger-btn {
          background: transparent;
          border: 1px solid rgba(168, 85, 247, 0.4);
          color: #6d28d9;
          padding: 8px 14px;
          border-radius: 8px;
          cursor: pointer;
          font-size: 0.75rem;
          font-weight: 600;
          text-transform: uppercase;
          transition: var(--transition-fast);
        }
        .view-bio-trigger-btn:hover {
          background: rgba(168, 85, 247, 0.08);
          border-color: #7c3aed;
        }
        .calendar-header-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
        }
        .month-year-label {
          font-family: var(--font-serif);
          font-size: 1.25rem;
          color: #4c1d95;
          font-weight: 700;
        }
        .calendar-tab-toggles {
          display: flex;
          background: rgba(0,0,0,0.04);
          padding: 4px;
          border-radius: 8px;
        }
        .calendar-tab {
          font-size: 0.75rem;
          padding: 4px 12px;
          border-radius: 6px;
          color: hsl(var(--text-muted));
          cursor: pointer;
        }
        .calendar-tab.active {
          background: rgba(0,0,0,0.05);
          color: #7c3aed;
          font-weight: 600;
        }
        .calendar-days-titles {
          display: grid;
          grid-template-columns: repeat(7, 1fr);
          text-align: center;
          margin-bottom: 8px;
        }
        .calendar-day-header {
          font-size: 0.75rem;
          color: hsl(var(--text-muted));
          font-weight: 600;
          text-transform: uppercase;
        }
        .calendar-dates-grid {
          display: grid;
          grid-template-columns: repeat(7, 1fr);
          gap: 6px;
          text-align: center;
        }
        .calendar-date-cell {
          height: 38px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 8px;
          font-size: 0.9rem;
        }
        .calendar-date-cell.empty {
          background: transparent;
        }
        .date-btn {
          background: rgba(0,0,0,0.02);
          border: 1px solid rgba(0,0,0,0.04);
          color: hsl(var(--text-cream));
          cursor: pointer;
          transition: var(--transition-fast);
        }
        .date-btn:hover {
          border-color: #7c3aed;
          color: #7c3aed;
        }
        .date-btn.selected {
          background: #7c3aed;
          border-color: #7c3aed;
          color: #ffffff;
          font-weight: 700;
          box-shadow: 0 0 10px rgba(124, 58, 237, 0.3);
        }
        .time-slots-section {
          margin-top: 24px;
          border-top: 1px solid rgba(0,0,0,0.05);
          padding-top: 20px;
        }
        .slots-title {
          font-size: 0.8rem;
          color: hsl(var(--text-muted));
          text-transform: uppercase;
          letter-spacing: 0.05em;
          font-weight: 600;
          display: block;
          margin-bottom: 12px;
        }
        .slots-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(90px, 1fr));
          gap: 10px;
        }
        .slot-btn {
          background: rgba(0,0,0,0.02);
          border: 1px solid rgba(0,0,0,0.05);
          color: hsl(var(--text-cream));
          padding: 8px 0;
          border-radius: 8px;
          font-size: 0.8rem;
          cursor: pointer;
          transition: var(--transition-fast);
        }
        .slot-btn:hover {
          border-color: #7c3aed;
          color: #7c3aed;
        }
        .slot-btn.selected {
          background: #7c3aed;
          border-color: #7c3aed;
          color: #ffffff;
          font-weight: 700;
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
        .text-area-input {
          height: 100px;
          resize: none;
        }
        .summary-block {
          background: rgba(168, 85, 247, 0.03);
          border: 1px solid rgba(168, 85, 247, 0.15);
          padding: 16px;
          border-radius: 12px;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .summary-title {
          font-family: var(--font-serif);
          font-size: 0.95rem;
          color: #4c1d95;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          border-bottom: 1px solid rgba(0,0,0,0.06);
          padding-bottom: 8px;
        }
        .summary-rows {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .summary-row {
          display: flex;
          justify-content: space-between;
          font-size: 0.85rem;
        }
        .summary-row span {
          color: hsl(var(--text-muted));
        }
        .summary-row.pricing {
          border-top: 1px dashed rgba(0,0,0,0.1);
          padding-top: 8px;
          margin-top: 4px;
        }
        .summary-price {
          font-family: var(--font-serif);
          color: #db2777;
          font-size: 1.1rem;
        }
        .error-message {
          color: #ef4444;
          font-size: 0.85rem;
        }
        .bio-modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0,0,0,0.4);
          backdrop-filter: blur(8px);
          z-index: 1000;
          display: flex;
          justify-content: center;
          align-items: center;
          padding: 24px;
        }
        .bio-modal-card {
          width: 100%;
          max-width: 480px;
          padding: 32px;
          position: relative;
          display: flex;
          flex-direction: column;
          gap: 20px;
          animation: scaleUp 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .close-modal-btn {
          position: absolute;
          top: 16px;
          right: 16px;
          background: transparent;
          border: none;
          color: hsl(var(--text-muted));
          font-size: 1.8rem;
          cursor: pointer;
        }
        .close-modal-btn:hover {
          color: #ef4444;
        }
        .modal-title {
          color: #4c1d95;
          font-size: 1.5rem;
        }
        .modal-spec {
          font-size: 0.85rem;
          color: hsl(var(--text-muted));
        }
        .modal-prac-name {
          font-size: 1.2rem;
          color: hsl(var(--text-cream));
        }
        .modal-stars-row {
          display: flex;
          gap: 10px;
          align-items: center;
          margin: 6px 0 12px;
        }
        .modal-stars {
          color: #d97706;
          font-size: 0.95rem;
        }
        .modal-rating-score {
          font-size: 0.8rem;
          color: hsl(var(--text-muted));
        }
        .modal-desc-bio {
          font-size: 0.88rem;
          line-height: 1.7;
        }
        .modal-actions-footer {
          display: flex;
          justify-content: flex-end;
          margin-top: 12px;
        }
        @keyframes scaleUp {
          from { transform: scale(0.95); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
        @media (max-width: 1024px) {
          .booking-main-split {
            grid-template-columns: 1fr;
          }
          .booking-service-col {
            position: static;
          }
        }
      `}</style>
    </div>
  );
}

export default function BookingPage() {
  return (
    <Suspense fallback={<div>Aligning cosmic calendars...</div>}>
      <BookingContent />
    </Suspense>
  );
}
