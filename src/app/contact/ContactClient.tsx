"use client";

import React, { useState, useEffect } from "react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

export default function ContactPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [submitted, setSubmitted] = useState(false);

  // Validation state
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Prefill name and email on mount
  useEffect(() => {
    const saved = window.localStorage.getItem("divingsanatan_user_profile");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.name) setName(parsed.name);
        if (parsed.email) setEmail(parsed.email);
      } catch (e) {
        console.warn("Failed to load saved profile in contact page:", e);
      }
    }
  }, []);

  const validateForm = () => {
    const errors: Record<string, string> = {};
    if (!name.trim()) {
      errors.name = "Name is required";
    } else if (name.trim().length < 2) {
      errors.name = "Name must be at least 2 characters";
    } else if (!/^[A-Za-z\s]+$/.test(name)) {
      errors.name = "Name must contain only letters and spaces";
    }

    const emailPattern = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/;
    if (!email.trim()) {
      errors.email = "Email Address is required";
    } else if (!emailPattern.test(email)) {
      errors.email = "Please enter a valid email address";
    }

    if (!message.trim()) {
      errors.message = "Message is required";
    } else if (message.trim().length < 10) {
      errors.message = "Message must be at least 10 characters";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setSubmitted(true);
    setName("");
    setEmail("");
    setSubject("");
    setMessage("");
    setFormErrors({});
  };

  return (
    <div className="page-shell">
      <Header />

      <main className="contact-container">

        {/* Title */}
        <section className="contact-header">
          <h1 className="contact-title">Contact Us</h1>
          <p className="contact-subtitle">
            Connect with our spiritual center for customized retreat requests or session inquiries.
          </p>
        </section>

        <section className="contact-grid">

          {/* Contact Details */}
          <div className="details-col">
            <Card variant="glass" className="details-card">
              <h3 className="card-heading">Healers Circle</h3>
              <p className="card-desc">
                Our sanctuary is open for pre-scheduled appointments and walk-in crystal consultations.
              </p>

              <div className="info-items-list">
                <div className="info-item">
                  <span className="info-icon">📍</span>
                  <div className="info-texts">
                    <strong>Our Address</strong>
                    <span>H.no. 54, Khanuja Enclave, Bawadia Kalan, Bhopal</span>
                  </div>
                </div>

                <div className="info-item">
                  <span className="info-icon">✉️</span>
                  <div className="info-texts">
                    <strong>Email Address</strong>
                    <span>support@divingsanatan.com</span>
                  </div>
                </div>

                <div className="info-item">
                  <span className="info-icon">📞</span>
                  <div className="info-texts">
                    <strong>Connect With Us</strong>
                    <div className="contact-socials">
                      <a href="https://youtube.com/@divingsanatan" target="_blank" rel="noopener noreferrer" className="contact-social-link">
                        <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" /></svg>
                        YouTube
                      </a>
                      <a href="https://facebook.com/divingsanatan" target="_blank" rel="noopener noreferrer" className="contact-social-link">
                        <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" /></svg>
                        Facebook
                      </a>
                      <a href="https://instagram.com/divingsanatan" target="_blank" rel="noopener noreferrer" className="contact-social-link">
                        <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" /></svg>
                        Instagram
                      </a>
                    </div>
                  </div>
                </div>

                <div className="info-item">
                  <span className="info-icon">🗓️</span>
                  <div className="info-texts">
                    <strong>Sanctuary Hours</strong>
                    <span>Mon - Fri: 8:00 AM - 9:00 PM EST<br />Sat - Sun: 9:00 AM - 6:00 PM EST</span>
                  </div>
                </div>
              </div>
            </Card>
          </div>

          {/* Form */}
          <div className="form-col">
            <Card variant="glass" className="card-pad-32">
              <h3 className="card-heading heading-mb-20">Send a Message</h3>

              {submitted ? (
                <div className="contact-success">
                  <span className="sparkle">✨</span>
                  <h4>Message Received!</h4>
                  <p>Our practitioners have received your transmission. We will reply within one solar cycle.</p>
                  <Button variant="gold" onClick={() => setSubmitted(false)}>Send Another Message</Button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} noValidate className="contact-form">
                  <div className="form-group">
                    <label>Your Name</label>
                    <input
                      type="text"
                      className={`glass-input ${formErrors.name ? "input-border-error" : ""}`}
                      placeholder="e.g. Sumeet"
                      value={name}
                      onChange={(e) => {
                        setName(e.target.value);
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
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        if (formErrors.email) setFormErrors({ ...formErrors, email: "" });
                      }}
                    />
                    {formErrors.email && <span className="inline-error-msg">{formErrors.email}</span>}
                  </div>

                  <div className="form-group">
                    <label>Subject</label>
                    <input
                      type="text"
                      className="glass-input"
                      placeholder="e.g. Aura balancing query"
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                    />
                  </div>

                  <div className="form-group">
                    <label>Message</label>
                    <textarea
                      className={`glass-input text-area-input ${formErrors.message ? "input-border-error" : ""}`}
                      placeholder="Write your message here..."
                      value={message}
                      onChange={(e) => {
                        setMessage(e.target.value);
                        if (formErrors.message) setFormErrors({ ...formErrors, message: "" });
                      }}
                    />
                    {formErrors.message && <span className="inline-error-msg">{formErrors.message}</span>}
                  </div>

                  <Button variant="gold" type="submit" >
                    Send Message
                  </Button>
                </form>
              )}
            </Card>
          </div>

        </section>

        {/* Graphical Map Mockup */}
        <section className="map-mockup-section">
          <Card variant="glass" className="map-card card-pad-20-center">
            <h3 className="card-heading heading-mb-16">Our Location Coordinates</h3>
            <div className="mock-map-canvas">
              <div className="map-grid-overlay" />
              <div className="map-target-point">
                <span className="ping-wave" />
                <span className="ping-center" />
                <span className="ping-label">Diving Sanatan Sanctuary</span>
              </div>
            </div>
          </Card>
        </section>

      </main>

      <Footer />

      <style jsx>{`
        .contact-container {
          max-width: 1200px;
          margin: 0 auto;
          padding: 60px 24px 40px;
          display: flex;
          flex-direction: column;
          gap: 48px;
          width: 100%;
        }
        .contact-title {
          font-size: 2.8rem;
          color: #4c1d95;
          margin-bottom: 12px;
          text-align: center;
        }
        .contact-subtitle {
          font-size: 1.05rem;
          color: hsl(var(--text-muted));
          text-align: center;
          max-width: 650px;
          margin: 0 auto;
        }
        .contact-grid {
          display: grid;
          grid-template-columns: 1fr 1.2fr;
          gap: 40px;
        }
        .details-col {
          display: flex;
          flex-direction: column;
        }
        .details-card {
          padding: 32px;
          display: flex;
          flex-direction: column;
          gap: 20px;
          height: 100%;
        }
        .card-heading {
          font-family: var(--font-serif);
          font-size: 1.4rem;
          color: #4c1d95;
        }
        .card-desc {
          font-size: 0.9rem;
          line-height: 1.6;
        }
        .info-items-list {
          display: flex;
          flex-direction: column;
          gap: 24px;
          margin-top: 12px;
        }
        .info-item {
          display: flex;
          gap: 16px;
          align-items: flex-start;
        }
        .info-icon {
          font-size: 1.4rem;
        }
        .info-texts {
          display: flex;
          flex-direction: column;
          gap: 4px;
          font-size: 0.88rem;
        }
        .info-texts strong {
          color: hsl(var(--text-cream));
        }
        .info-texts span {
          color: hsl(var(--text-muted));
          line-height: 1.5;
        }
        .contact-socials {
          display: flex;
          flex-direction: column;
          gap: 10px;
          margin-top: 4px;
        }
        .contact-social-link {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 0.88rem;
          color: hsl(var(--text-muted));
          text-decoration: none;
          transition: color 0.2s, padding-left 0.15s;
        }
        .contact-social-link:hover {
          color: #7c3aed;
          padding-left: 4px;
        }
        .form-group {
          display: flex;
          flex-direction: column;
          gap: 8px;
          margin-bottom: 20px;
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
        .text-area-input {
          height: 120px;
          resize: none;
        }
        .contact-success {
          text-align: center;
          padding: 40px 20px;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 16px;
        }
        .sparkle {
          font-size: 2.5rem;
        }
        .contact-success h4 {
          font-size: 1.4rem;
          color: #4c1d95;
        }
        .contact-success p {
          font-size: 0.9rem;
          margin-bottom: 8px;
        }
        .mock-map-canvas {
          height: 280px;
          background: rgba(255, 255, 255, 0.7);
          border-radius: 16px;
          border: 1px solid rgba(0,0,0,0.05);
          position: relative;
          overflow: hidden;
        }
        .map-grid-overlay {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-size: 20px 20px;
          background-image: 
            linear-gradient(to right, rgba(168,85,247,0.04) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(168,85,247,0.04) 1px, transparent 1px);
        }
        .map-target-point {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          display: flex;
          flex-direction: column;
          align-items: center;
        }
        .ping-center {
          width: 12px;
          height: 12px;
          background-color: #7c3aed;
          border-radius: 50%;
          box-shadow: 0 0 10px rgba(124,58,237,0.4);
          z-index: 2;
        }
        .ping-wave {
          position: absolute;
          width: 36px;
          height: 36px;
          border-radius: 50%;
          border: 2px solid #7c3aed;
          animation: ping 2s infinite ease-out;
          opacity: 0.8;
          z-index: 1;
        }
        .ping-label {
          margin-top: 12px;
          font-family: var(--font-serif);
          font-size: 0.8rem;
          font-weight: 600;
          color: #4c1d95;
          letter-spacing: 0.05em;
        }
        @keyframes ping {
          0% { transform: scale(0.3); opacity: 1; }
          100% { transform: scale(1.6); opacity: 0; }
        }
        @media (max-width: 768px) {
          .contact-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
}
