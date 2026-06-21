"use client";

import React, { useState } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

interface CityData {
  name: string;
  country: string;
  timezone: string;
  description: string;
  testimonials: { author: string; role: string; quote: string }[];
}

const CITY_DATABASE: Record<string, CityData> = {
  Ahmedabad: {
    name: "Ahmedabad",
    country: "India",
    timezone: "Asia/Kolkata (GMT+5:30)",
    description: "Welcome to Ahmedabad's premier holistic healing sanctuary. We support Ahmedabad's active business owners and residents in establishing inner peace, stabilizing stress, and aligning chakra centers.",
    testimonials: [
      {
        author: "Amit Patel",
        role: "Textile Entrepreneur",
        quote: "The sound therapy sessions in Ahmedabad completely re-balanced my busy trading lifestyle. I feel grounded and focused.",
      },
      {
        author: "Dr. Bindiya Shah",
        role: "Homeopath",
        quote: "Having referred several of my patients for aura mapping, the reports are consistently accurate and therapeutic.",
      },
    ],
  },
  Mumbai: {
    name: "Mumbai",
    country: "India",
    timezone: "Asia/Kolkata (GMT+5:30)",
    description: "In the heart of India's most energetic metropolis, we provide a quiet sanctuary. Realign your fields, shield your mind from city noise, and restore your life force.",
    testimonials: [
      {
        author: "Priya Mehta",
        role: "Creative Director",
        quote: "In the fast-paced life of Mumbai, finding this peace was a absolute necessity. The crystal node clearing is magnificent.",
      },
      {
        author: "Vikram Malhotra",
        role: "Financial Analyst",
        quote: "After long days at Dalal Street, a session here clears my mental static better than anything else.",
      },
    ],
  },
  London: {
    name: "London",
    country: "United Kingdom",
    timezone: "Europe/London (GMT+1)",
    description: "Bringing ancient Vedic healing practices directly to London's wellness community. Restore your internal fire, balance cold weather sluggishness, and align your crown energy.",
    testimonials: [
      {
        author: "Sarah Jenkins",
        role: "Yoga Instructor",
        quote: "Despite the cloudy London weather, my aura scan warmed my spiritual focus and helped me design better classes.",
      },
      {
        author: "David Vance",
        role: "Tech Consultant",
        quote: "Highly recommended for corporate fatigue. It helped me clear chronic head tension after weeks of long hours.",
      },
    ],
  },
  "New York": {
    name: "New York",
    country: "United States",
    timezone: "America/New_York (GMT-4)",
    description: "A serene escape from Manhattan's high-intensity grids. Protect your energetic boundaries, align your throat chakra to communicate effectively, and ground your root node.",
    testimonials: [
      {
        author: "John Dwyer",
        role: "Attorney",
        quote: "A true sanctuary in NYC. The sound bowl alignment resolved my courtroom stress and somatic tightness.",
      },
      {
        author: "Elena Rostova",
        role: "Visual Artist",
        quote: "My creative blocks completely dissolved after a single chakra scanning session. The results are visible.",
      },
    ],
  },
};

export default function LocalSEOPage() {
  const [selectedCity, setSelectedCity] = useState("Ahmedabad");
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedTime, setSelectedTime] = useState("");
  const [userName, setUserName] = useState("");

  const activeCity = CITY_DATABASE[selectedCity] || CITY_DATABASE.Ahmedabad;

  const handleBookingSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!userName || !selectedDate || !selectedTime) {
      alert("Please fill out all scheduling options.");
      return;
    }
    alert(`Thank you ${userName}! Your free session in ${activeCity.name} is reserved for ${selectedDate} at ${selectedTime} (${activeCity.timezone}).`);
    setUserName("");
    setSelectedDate("");
    setSelectedTime("");
  };

  return (
    <div className="local-seo-page">
      <div className="location-selector-bar glass-panel">
        <label className="selector-label">Select Your Region:</label>
        <div className="city-buttons">
          {Object.keys(CITY_DATABASE).map((cityName) => (
            <button
              key={cityName}
              className={`city-select-btn ${selectedCity === cityName ? "active" : ""}`}
              onClick={() => setSelectedCity(cityName)}
            >
              {cityName}
            </button>
          ))}
        </div>
      </div>

      <div className="local-main-grid">
        {/* Left: SEO Content & Testimonials */}
        <div className="local-content-col">
          <section className="location-intro">
            <h1 className="location-title">
              Spiritual Healing & Aura Clearing for Seekers in{" "}
              <span className="gold-text-gradient">{activeCity.name}</span>
            </h1>
            <p className="location-desc">{activeCity.description}</p>
          </section>

          {/* Testimonials */}
          <section className="local-testimonials-section">
            <h3 className="section-title">Local Testimonials ({activeCity.name})</h3>
            <div className="testimonials-list">
              {activeCity.testimonials.map((t, idx) => (
                <Card key={idx} variant="glass" className="testimonial-card">
                  <span className="quote-icon">“</span>
                  <p className="testimonial-quote">{t.quote}</p>
                  <div className="testimonial-meta">
                    <span className="author-name">{t.author}</span>
                    <span className="author-role">{t.role}</span>
                  </div>
                </Card>
              ))}
            </div>
          </section>
        </div>

        {/* Right: Booking Form Widget */}
        <div className="local-booking-col">
          <Card variant="glass" className="booking-widget-card">
            <h3 className="widget-title">Local Booking Scheduler</h3>
            <p className="widget-desc">Schedule a free 15-minute introductory energy check-in from {activeCity.name}.</p>

            <form onSubmit={handleBookingSubmit} className="booking-form">
              <div className="form-group">
                <label>Your Name</label>
                <input
                  type="text"
                  placeholder="Enter your name"
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                  className="glass-input form-input"
                  required
                />
              </div>

              <div className="form-group">
                <label>Country of Residence</label>
                <input
                  type="text"
                  value={activeCity.country}
                  disabled
                  className="glass-input form-input disabled-input"
                />
              </div>

              <div className="form-group">
                <label>Local Timezone</label>
                <input
                  type="text"
                  value={activeCity.timezone}
                  disabled
                  className="glass-input form-input disabled-input"
                />
              </div>

              <div className="form-group">
                <label>Select Date</label>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="glass-input form-input"
                  required
                />
              </div>

              <div className="form-group">
                <label>Select Time</label>
                <input
                  type="time"
                  value={selectedTime}
                  onChange={(e) => setSelectedTime(e.target.value)}
                  className="glass-input form-input"
                  required
                />
              </div>

              <Button type="submit" variant="gold" size="lg" className="submit-booking-btn">
                Confirm Booking in {activeCity.name}
              </Button>
            </form>
          </Card>
        </div>
      </div>

      <style jsx>{`
        .local-seo-page {
          display: flex;
          flex-direction: column;
          gap: 32px;
          width: 100%;
        }
        .location-selector-bar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 16px 24px;
          border-radius: 16px;
        }
        .selector-label {
          font-weight: 700;
          font-family: var(--font-serif);
          font-size: 1.1rem;
          color: #4c1d95;
        }
        .city-buttons {
          display: flex;
          gap: 10px;
        }
        .city-select-btn {
          background: transparent;
          border: 1px solid rgba(0, 0, 0, 0.05);
          padding: 8px 16px;
          border-radius: 8px;
          cursor: pointer;
          font-weight: 600;
          color: hsl(var(--text-muted));
          transition: var(--transition-fast);
        }
        .city-select-btn:hover {
          border-color: rgba(168, 85, 247, 0.3);
          color: #7c3aed;
        }
        .city-select-btn.active {
          background: #7c3aed;
          color: #ffffff;
          border-color: #7c3aed;
          box-shadow: 0 4px 10px rgba(124, 58, 237, 0.2);
        }
        .local-main-grid {
          display: grid;
          grid-template-columns: 1.12fr 0.88fr;
          gap: 32px;
          align-items: flex-start;
        }
        .local-content-col {
          display: flex;
          flex-direction: column;
          gap: 32px;
        }
        .location-intro {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .location-title {
          font-size: 2.5rem;
          color: #4c1d95;
          line-height: 1.25;
        }
        .location-desc {
          font-size: 1.05rem;
          line-height: 1.7;
          color: hsl(var(--text-muted));
        }
        .local-testimonials-section {
          display: flex;
          flex-direction: column;
          gap: 18px;
        }
        .section-title {
          font-size: 1.4rem;
          color: #4c1d95;
        }
        .testimonials-list {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        .testimonial-card {
          padding: 20px 24px !important;
          border-radius: 16px;
          display: flex;
          flex-direction: column;
          gap: 8px;
          position: relative;
        }
        .quote-icon {
          position: absolute;
          top: 10px;
          left: 14px;
          font-size: 3.5rem;
          font-family: var(--font-serif);
          color: rgba(168, 85, 247, 0.08);
          line-height: 1;
        }
        .testimonial-quote {
          font-size: 0.95rem;
          line-height: 1.6;
          color: hsl(var(--text-cream));
          z-index: 1;
          font-style: italic;
        }
        .testimonial-meta {
          display: flex;
          justify-content: flex-end;
          align-items: baseline;
          gap: 10px;
          font-size: 0.78rem;
          color: hsl(var(--text-muted));
        }
        .author-name {
          font-weight: 700;
          color: #4c1d95;
        }
        .booking-widget-card {
          padding: 28px !important;
          border-radius: 20px;
        }
        .widget-title {
          font-size: 1.35rem;
          color: #4c1d95;
          margin-bottom: 6px;
        }
        .widget-desc {
          font-size: 0.85rem;
          color: hsl(var(--text-muted));
          line-height: 1.4;
          margin-bottom: 24px;
        }
        .booking-form {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        .form-group {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        .form-group label {
          font-size: 0.72rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: hsl(var(--text-muted));
        }
        .form-input {
          padding: 10px 14px;
          border-radius: 8px;
          font-size: 0.9rem;
        }
        .disabled-input {
          background: rgba(0, 0, 0, 0.04);
          color: hsl(var(--text-muted));
          border-color: rgba(0, 0, 0, 0.05);
          cursor: not-allowed;
        }
        .submit-booking-btn {
          margin-top: 10px;
          width: 100%;
        }

        @media (max-width: 900px) {
          .location-selector-bar {
            flex-direction: column;
            gap: 12px;
            align-items: flex-start;
          }
          .local-main-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
}
