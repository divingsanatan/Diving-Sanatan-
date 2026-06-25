"use client";

import React from "react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Card } from "@/components/ui/Card";

export default function PrivacyPage() {
  return (
    <div className="page-shell">
      <Header />

      <main className="privacy-container">
        
        <section className="privacy-header">
          <h1 className="privacy-title">Privacy Policy</h1>
          <p className="privacy-subtitle">Effective Date: June 7, 2026</p>
        </section>

        <section className="privacy-content">
          <Card variant="glass" className="privacy-card">
            
            <div className="policy-section">
              <h2 className="policy-heading">1. Energetic and Client Telemetry We Collect</h2>
              <p className="policy-text">
                At Diving Sanatan, we respect the integrity of your personal and scheduling records. We collect information necessary to facilitate scheduling, auric analysis, and payment operations, including:
              </p>
              <ul className="policy-list">
                <li>Personal Identity Identifiers (Name, Email Address, Telephone Number).</li>
                <li>Somatic search words and emotional query metrics used to evaluate chakra status.</li>
                <li>Historical booking telemetry (services chosen, date scheduling, practitioner assignments).</li>
                <li>Credit card and payment tokens routed securely to billing gateways (we do not store raw card numbers locally).</li>
              </ul>
            </div>

            <div className="policy-section">
              <h2 className="policy-heading">2. How We Utilize Collected Metrics</h2>
              <p className="policy-text">
                We strictly process data parameters to improve your sanctuary experience:
              </p>
              <ul className="policy-list">
                <li>To execute scheduling reservations, calculate practitioner loads, and record payment completions.</li>
                <li>To render custom client-facing SVG Aura diagrams matching your specific seeking criteria.</li>
                <li>To send moon cycle news and discount updates if you explicitly subscribe to our newsletter.</li>
              </ul>
            </div>

            <div className="policy-section">
              <h2 className="policy-heading">3. Energetic Records Disclosure & Third-Parties</h2>
              <p className="policy-text">
                We do not sell, rent, or lease client details to external entities. Your session logs, somatic notes, and booking dates remain protected under secure local system databases. Payment details are encrypted and transmitted directly to Stripe, PayPal, or Apple Pay processing vaults.
              </p>
            </div>

            <div className="policy-section">
              <h2 className="policy-heading">4. Cookies and Web Analytics</h2>
              <p className="policy-text">
                We use secure local storage parameters on your browser to temporarily save selection carts and active booking IDs. You can purge this data at any point by purging browser caches or clicking &ldquo;Clear All&rdquo; inside our cart drawer.
              </p>
            </div>

            <div className="policy-section">
              <h2 className="policy-heading">5. Rights and Contact Details</h2>
              <p className="policy-text">
                Should you wish to request total deletion of your scheduling history or update your email address in our newsletter system, please submit a message via our <a href="/contact" className="link-violet-underline">Contact Page</a> or email support@divingsanatan.com.
              </p>
            </div>

          </Card>
        </section>

      </main>

      <Footer />

      <style jsx>{`
        .privacy-container {
          max-width: 850px;
          margin: 0 auto;
          padding: 60px 24px 40px;
          display: flex;
          flex-direction: column;
          gap: 40px;
          width: 100%;
        }
        .privacy-title {
          font-size: 2.8rem;
          color: #4c1d95;
          margin-bottom: 8px;
          text-align: center;
        }
        .privacy-subtitle {
          font-size: 0.95rem;
          color: hsl(var(--text-muted));
          text-align: center;
        }
        .privacy-card {
          padding: 40px;
          display: flex;
          flex-direction: column;
          gap: 32px;
        }
        .policy-section {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .policy-heading {
          font-family: var(--font-serif);
          font-size: 1.25rem;
          color: #4c1d95;
          border-bottom: 1px solid rgba(0,0,0,0.06);
          padding-bottom: 8px;
        }
        .policy-text {
          font-size: 0.92rem;
          line-height: 1.7;
          color: hsl(var(--text-cream));
        }
        .policy-list {
          list-style-type: circle;
          padding-left: 20px;
          display: flex;
          flex-direction: column;
          gap: 8px;
          font-size: 0.9rem;
          color: hsl(var(--text-muted));
        }
        @media (max-width: 640px) {
          .privacy-card {
            padding: 24px;
          }
        }
      `}</style>
    </div>
  );
}
