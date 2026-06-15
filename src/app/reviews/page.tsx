"use client";

import React, { useState, useEffect } from "react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

interface Review {
  id: string;
  serviceName: string;
  practitionerId: string;
  practitionerName: string;
  clientName: string;
  rating: number;
  comment: string;
  date: string;
}

interface Practitioner {
  id: string;
  name: string;
}

export default function ReviewsPage() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [filteredReviews, setFilteredReviews] = useState<Review[]>([]);
  const [practitioners, setPractitioners] = useState<Practitioner[]>([]);

  // Filters
  const [selectedHealer, setSelectedHealer] = useState("all");

  // Form inputs
  const [clientName, setClientName] = useState("");
  const [practitionerId, setPractitionerId] = useState("");
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");

  // Fetch data
  const loadReviewsData = async () => {
    try {
      const rRes = await fetch("/api/reviews");
      const rJson = await rRes.json();

      const pRes = await fetch("/api/practitioners");
      const pJson = await pRes.json();

      if (rJson.success && pJson.success) {
        setReviews(rJson.data);
        setFilteredReviews(rJson.data);
        setPractitioners(pJson.data);
        if (pJson.data.length > 0) {
          setPractitionerId(pJson.data[0].id); // default select first practitioner
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadReviewsData();
  }, []);

  // Filter reviews
  useEffect(() => {
    if (selectedHealer === "all") {
      setFilteredReviews(reviews);
    } else {
      setFilteredReviews(reviews.filter(r => r.practitionerId === selectedHealer));
    }
  }, [reviews, selectedHealer]);

  // Aggregate stats
  const aggregateRating = reviews.length
    ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
    : "5.0";

  // Form submission
  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientName || !comment) {
      alert("Please enter your name and comment.");
      return;
    }

    setSubmitting(true);
    setMessage("");

    try {
      const selectedPracObj = practitioners.find(p => p.id === practitionerId);
      const practitionerName = selectedPracObj ? selectedPracObj.name : "Dr. Elara Vance";

      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          practitionerId,
          practitionerName,
          clientName,
          rating,
          comment,
          serviceName: "Energy Balancing Session", // default placeholder
        }),
      });

      const json = await res.json();
      if (json.success) {
        // Success
        setClientName("");
        setComment("");
        setRating(5);
        setMessage("✨ Thank you! Your feedback has been recorded.");
        loadReviewsData(); // refresh list
      } else {
        setMessage(`Error: ${json.error}`);
      }
    } catch (e) {
      console.error(e);
      setMessage("Failed to submit feedback.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>
      <Header />

      <main className="reviews-container">

        {/* Title */}
        <section className="reviews-header">
          <h1 className="reviews-title">Client Testimonials</h1>
          <p className="reviews-subtitle">
            Read verified reviews from clients who have aligned their energies at our healing sanctuary.
          </p>
        </section>

        {/* Aggregates block */}
        <section className="stats-cards-row">
          <Card variant="glowing" className="summary-stat-card">
            <span className="stat-label">Overall Rating</span>
            <h2 className="stat-value">{aggregateRating} / 5.0</h2>
            <div className="stat-stars">★ ★ ★ ★ ★</div>
            <p className="stat-desc">Based on {reviews.length} active client ratings</p>
          </Card>
        </section>

        {/* Split: Listing + Submit Form */}
        <section className="reviews-grid">

          {/* List */}
          <div className="reviews-list-col">
            <div className="list-header-row">
              <h3 className="column-title">Client Feedback ({filteredReviews.length})</h3>

              {/* Healer Filter */}
              <div className="healer-filter-wrapper">
                <select
                  className="glass-input small-select"
                  value={selectedHealer}
                  onChange={(e) => setSelectedHealer(e.target.value)}
                >
                  <option value="all">All Practitioners</option>
                  {practitioners.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="reviews-vertical-list">
              {filteredReviews.map(rv => (
                <Card key={rv.id} variant="glass" className="review-card-item">
                  <div className="review-card-header">
                    <span className="reviewer-name">{rv.clientName}</span>
                    <span className="review-stars">{"★".repeat(rv.rating)}{"☆".repeat(5 - rv.rating)}</span>
                  </div>

                  <p className="review-comment">
                    &ldquo;{rv.comment}&rdquo;
                  </p>

                  <div className="review-card-footer">
                    <span>Practitioner: <strong>{rv.practitionerName}</strong></span>
                    <span>Session: <strong>{rv.serviceName}</strong></span>
                  </div>
                </Card>
              ))}
            </div>
          </div>

          {/* Form */}
          <div className="reviews-form-col">
            <Card variant="glass" style={{ padding: "32px" }}>
              <h3 className="column-title" style={{ marginBottom: "20px" }}>Share Your Experience</h3>

              <form onSubmit={handleSubmitReview} className="feedback-submission-form">

                <div className="form-group">
                  <label>Your Name</label>
                  <input
                    type="text"
                    className="glass-input"
                    required
                    placeholder="e.g. Sumeet"
                    value={clientName}
                    onChange={(e) => setClientName(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label>Select Healer</label>
                  <select
                    className="glass-input"
                    value={practitionerId}
                    onChange={(e) => setPractitionerId(e.target.value)}
                  >
                    {practitioners.map(p => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>Rating ({rating} Stars)</label>
                  <select
                    className="glass-input"
                    value={rating}
                    onChange={(e) => setRating(Number(e.target.value))}
                  >
                    <option value={5}>5 Stars (Exceptional)</option>
                    <option value={4}>4 Stars (Highly Recommended)</option>
                    <option value={3}>3 Stars (Satisfactory)</option>
                    <option value={2}>2 Stars (Needs Improvement)</option>
                    <option value={1}>1 Star (Poor)</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Feedback Comment</label>
                  <textarea
                    className="glass-input text-area-input"
                    required
                    placeholder="Describe your emotional realignment, the practitioner's handling, and crystal layouts..."
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                  />
                </div>

                {message && <p className="form-feedback-msg">{message}</p>}

                <Button variant="gold" type="submit" disabled={submitting} >
                  {submitting ? "Submitting..." : "Submit Review"}
                </Button>

              </form>
            </Card>
          </div>

        </section>

      </main>

      <Footer />

      <style jsx>{`
        .reviews-container {
          max-width: 1200px;
          margin: 0 auto;
          padding: 60px 24px 40px;
          display: flex;
          flex-direction: column;
          gap: 40px;
          width: 100%;
        }
        .reviews-title {
          font-size: 2.8rem;
          color: #4c1d95;
          margin-bottom: 12px;
          text-align: center;
        }
        .reviews-subtitle {
          font-size: 1.05rem;
          color: hsl(var(--text-muted));
          text-align: center;
          max-width: 650px;
          margin: 0 auto;
        }
        .stats-cards-row {
          display: flex;
          justify-content: center;
        }
        .summary-stat-card {
          width: 100%;
          max-width: 480px;
          padding: 32px;
          text-align: center;
          display: flex;
          flex-direction: column;
          gap: 12px;
          align-items: center;
        }
        .stat-label {
          font-size: 0.85rem;
          color: hsl(var(--text-muted));
          text-transform: uppercase;
          letter-spacing: 0.05em;
          font-weight: 600;
        }
        .stat-value {
          font-family: var(--font-serif);
          font-size: 2.5rem;
          color: #4c1d95;
        }
        .stat-stars {
          color: #d97706;
          font-size: 1.2rem;
          letter-spacing: 2px;
        }
        .stat-desc {
          font-size: 0.85rem;
          color: hsl(var(--text-muted));
        }
        .reviews-grid {
          display: grid;
          grid-template-columns: 1.5fr 1fr;
          gap: 40px;
        }
        .reviews-list-col {
          display: flex;
          flex-direction: column;
          gap: 24px;
        }
        .list-header-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .column-title {
          font-family: var(--font-serif);
          font-size: 1.4rem;
          color: #4c1d95;
        }
        .small-select {
          padding: 8px 12px;
          font-size: 0.8rem;
          width: 180px;
        }
        .reviews-vertical-list {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }
        .review-card-item {
          display: flex;
          flex-direction: column;
          gap: 16px;
          padding: 24px;
        }
        .review-card-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .reviewer-name {
          font-size: 1.05rem;
          font-weight: 600;
          color: hsl(var(--text-cream));
        }
        .review-stars {
          color: #d97706;
          font-size: 0.88rem;
          letter-spacing: 1px;
        }
        .review-comment {
          font-size: 0.92rem;
          line-height: 1.6;
          font-style: italic;
          color: hsl(var(--text-cream) / 0.9);
        }
        .review-card-footer {
          display: flex;
          justify-content: space-between;
          font-size: 0.78rem;
          color: hsl(var(--text-muted));
          border-top: 1px solid rgba(0,0,0,0.05);
          padding-top: 12px;
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
        .form-feedback-msg {
          font-size: 0.85rem;
          color: #0d9488;
          margin-bottom: 8px;
          text-align: center;
        }
        @media (max-width: 768px) {
          .reviews-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
}
