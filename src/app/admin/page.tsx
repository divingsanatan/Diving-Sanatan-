"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { formatCurrency } from "@/utils/formatters";
import { Booking, Service, Practitioner, Review } from "@/types/database";
import { RefreshCw } from "lucide-react";
import StatsDashboard from "@/components/admin/StatsDashboard";

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
      <StatsDashboard
        pageType="overview"
        actions={
          <button className="btn btn-secondary" onClick={loadDashboardData}>
            <RefreshCw size={14} style={{ marginRight: "6px" }} />
            Refresh Monitor
          </button>
        }
      />

      {loading ? (
        <p className="text-center" style={{ padding: "40px", color: "#6c757d" }}>Loading metrics...</p>
      ) : (
        <>


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
