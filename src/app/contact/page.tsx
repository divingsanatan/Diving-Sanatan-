"use client";

import React, { useState } from "react";
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name && email && message) {
      setSubmitted(true);
      setName("");
      setEmail("");
      setSubject("");
      setMessage("");
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>
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
                    <strong>Sanctuary Address</strong>
                    <span>777 Ethereal Pathway, Zen City, CA 90210</span>
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
                    <strong>Telephone</strong>
                    <span>+1 (555) 777-AURA (2872)</span>
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
            <Card variant="glass" style={{ padding: "32px" }}>
              <h3 className="card-heading" style={{ marginBottom: "20px" }}>Send a Message</h3>
              
              {submitted ? (
                <div className="contact-success">
                  <span className="sparkle">✨</span>
                  <h4>Message Received!</h4>
                  <p>Our practitioners have received your transmission. We will reply within one solar cycle.</p>
                  <Button variant="gold" onClick={() => setSubmitted(false)}>Send Another Message</Button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="contact-form">
                  <div className="form-group">
                    <label>Your Name</label>
                    <input
                      type="text"
                      className="glass-input"
                      required
                      placeholder="e.g. Sumeet"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                    />
                  </div>

                  <div className="form-group">
                    <label>Email Address</label>
                    <input
                      type="email"
                      className="glass-input"
                      required
                      placeholder="e.g. sumeet@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
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
                      className="glass-input text-area-input"
                      required
                      placeholder="Write your message here..."
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                    />
                  </div>

                  <Button variant="gold" type="submit" style={{ width: "100%", marginTop: "12px" }}>
                    Send Message
                  </Button>
                </form>
              )}
            </Card>
          </div>

        </section>

        {/* Graphical Map Mockup */}
        <section className="map-mockup-section">
          <Card variant="glass" className="map-card" style={{ padding: "20px", textAlign: "center" }}>
            <h3 className="card-heading" style={{ marginBottom: "16px" }}>Our Location Coordinates</h3>
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
        .form-group {
          display: flex;
          flex-direction: column;
          gap: 8px;
          margin-bottom: 20px;
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
