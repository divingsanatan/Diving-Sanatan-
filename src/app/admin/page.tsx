"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { formatCurrency } from "@/utils/formatters";
import { Booking, Service, Practitioner, Review } from "@/types/database";
import { DollarSign, Calendar, Users, Star, RefreshCw } from "lucide-react";

export default function AdminDashboardPage() {
  const router = useRouter();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [practitioners, setPractitioners] = useState<Practitioner[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const [bRes, sRes, pRes, rRes] = await Promise.all([
        fetch("/api/bookings"),
        fetch("/api/services"),
        fetch("/api/practitioners"),
        fetch("/api/reviews")
      ]);

      const bJson = await bRes.json();
      const sJson = await sRes.json();
      const pJson = await pRes.json();
      const rJson = await rRes.json();

      if (bJson.success && sJson.success && pJson.success && rJson.success) {
        setBookings(bJson.data);
        setServices(sJson.data);
        setPractitioners(pJson.data);
        setReviews(rJson.data);
      }
    } catch (err) {
      console.error("Failed to load dashboard data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  const totalRevenue = bookings
    .filter(b => b.paymentStatus === "paid" && b.status !== "cancelled")
    .reduce((sum, b) => sum + b.price, 0);

  const pendingCount = bookings.filter(b => b.status === "pending").length;

  return (
    <div className="dashboard-content">
      {/* Header Row */}
      <div className="flex-between mb-4">
        <div>
          <p style={{ margin: 0, color: "#6c757d", fontSize: "0.95rem" }}>
            Real-time analytics monitor and administrative overview of sanctuary systems.
          </p>
        </div>
        <button className="btn btn-secondary" onClick={loadDashboardData}>
          <RefreshCw size={14} style={{ marginRight: "6px" }} />
          Refresh Monitor
        </button>
      </div>

      {loading ? (
        <p className="text-center" style={{ padding: "40px", color: "#6c757d" }}>Loading metrics...</p>
      ) : (
        <>
          {/* Stats Widgets */}
          <section className="stats-row">
            <div className="small-box bg-success">
              <div className="inner">
                <h3>{formatCurrency(totalRevenue)}</h3>
                <p>Sanctuary Revenue</p>
                <span style={{ fontSize: "0.78rem", opacity: 0.8 }}>From paid confirmed bookings</span>
              </div>
              <div className="icon">
                <DollarSign size={50} />
              </div>
            </div>

            <div className="small-box bg-info">
              <div className="inner">
                <h3>{bookings.length}</h3>
                <p>Active Bookings</p>
                <span style={{ fontSize: "0.78rem", opacity: 0.8 }}>{pendingCount} pending approvals</span>
              </div>
              <div className="icon">
                <Calendar size={50} />
              </div>
            </div>

            <div className="small-box bg-warning">
              <div className="inner" style={{ color: "#1f2d3d" }}>
                <h3>{practitioners.length}</h3>
                <p style={{ color: "#1f2d3d" }}>Certified Healers</p>
                <span style={{ fontSize: "0.78rem", opacity: 0.8 }}>Active in directory</span>
              </div>
              <div className="icon">
                <Users size={50} />
              </div>
            </div>

            <div className="small-box bg-danger">
              <div className="inner">
                <h3>{reviews.length}</h3>
                <p>Client Reviews</p>
                <span style={{ fontSize: "0.78rem", opacity: 0.8 }}>Testimonials recorded</span>
              </div>
              <div className="icon">
                <Star size={50} />
              </div>
            </div>
          </section>

          {/* Quick Links Card */}
          <div className="card mt-4">
            <div className="card-header" style={{ borderBottom: "1px solid #dee2e6", padding: "12px 20px", background: "#f8f9fa", fontWeight: "700" }}>
              Quick Navigation Links
            </div>
            <div className="card-body" style={{ padding: "20px", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "15px" }}>
              <button className="btn btn-primary" onClick={() => router.push("/admin/bookings")}>Manage Bookings</button>
              <button className="btn btn-primary" onClick={() => router.push("/admin/services")}>Manage Services</button>
              <button className="btn btn-primary" onClick={() => router.push("/admin/practitioners")}>Manage Healers</button>
              <button className="btn btn-primary" onClick={() => router.push("/admin/blogs")}>Manage Publications</button>
            </div>
          </div>
        </>
      )}

      <style jsx>{`
        .dashboard-content {
          display: flex;
          flex-direction: column;
          gap: 15px;
        }
        .mb-4 {
          margin-bottom: 1.5rem;
        }
        .mt-4 {
          margin-top: 1.5rem;
        }
      `}</style>
    </div>
  );
}
