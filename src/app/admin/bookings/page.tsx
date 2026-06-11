"use client";

import React, { useState, useEffect } from "react";
import { Card } from "@/components/ui/Card";
import { formatCurrency } from "@/utils/formatters";
import { Booking } from "@/types/database";

export default function AdminBookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  const loadBookings = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/bookings");
      const json = await res.json();
      if (json.success) {
        setBookings(json.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBookings();
  }, []);

  const handleUpdateStatus = async (id: string, field: "status" | "paymentStatus", value: string) => {
    try {
      const res = await fetch("/api/bookings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id,
          [field]: value
        })
      });
      const json = await res.json();
      if (json.success) {
        loadBookings();
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="dashboard-content">
      <div className="dashboard-header-row">
        <div>
          <h2>Bookings Scheduler</h2>
          <p style={{ color: "hsl(var(--text-muted))", fontSize: "0.9rem", marginTop: "4px" }}>
            Monitor and coordinate scheduled appointments, manage confirmation states, and track customer payments.
          </p>
        </div>
        <button className="sync-btn" onClick={loadBookings}>
          🔄 Refresh Bookings
        </button>
      </div>

      {loading ? (
        <p style={{ color: "hsl(var(--text-muted))", marginTop: "40px" }}>Loading bookings...</p>
      ) : (
        <Card variant="glass" style={{ padding: "0", overflow: "hidden" }}>
          <div className="table-wrapper">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Client Name</th>
                  <th>Session / Service</th>
                  <th>Practitioner</th>
                  <th>Date / Time</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th>Payment</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {bookings.length === 0 ? (
                  <tr>
                    <td colSpan={8} style={{ textAlign: "center", padding: "32px" }}>No scheduled appointments.</td>
                  </tr>
                ) : (
                  bookings.map(b => (
                    <tr key={b.id}>
                      <td>
                        <strong>{b.clientName}</strong>
                        <div className="client-meta">{b.clientEmail} | {b.clientPhone}</div>
                      </td>
                      <td>{b.serviceName}</td>
                      <td>{b.practitionerName}</td>
                      <td>{b.date} ({b.timeSlot})</td>
                      <td style={{ fontFamily: "var(--font-serif)", fontWeight: "600" }}>{formatCurrency(b.price)}</td>
                      <td>
                        <span className={`status-badge ${b.status}`}>
                          {b.status}
                        </span>
                      </td>
                      <td>
                        <span className={`payment-badge ${b.paymentStatus}`}>
                          {b.paymentStatus}
                        </span>
                      </td>
                      <td>
                        <div className="action-btns-group">
                          {b.status === "pending" && (
                            <button className="tbl-btn success" onClick={() => handleUpdateStatus(b.id, "status", "confirmed")}>
                              Confirm
                            </button>
                          )}
                          {b.status !== "cancelled" && (
                            <button className="tbl-btn danger" onClick={() => handleUpdateStatus(b.id, "status", "cancelled")}>
                              Cancel
                            </button>
                          )}
                          {b.paymentStatus === "unpaid" ? (
                            <button className="tbl-btn pay" onClick={() => handleUpdateStatus(b.id, "paymentStatus", "paid")}>
                              Mark Paid
                            </button>
                          ) : (
                            <button className="tbl-btn pay-un" onClick={() => handleUpdateStatus(b.id, "paymentStatus", "unpaid")}>
                              Mark Unpaid
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      <style jsx>{`
        .dashboard-content {
          display: flex;
          flex-direction: column;
          gap: 32px;
        }
        .dashboard-header-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .dashboard-header-row h2 {
          font-family: var(--font-serif);
          color: #4c1d95;
          font-size: 1.8rem;
        }
        .sync-btn {
          background: rgba(0,0,0,0.02);
          border: 1px solid rgba(0,0,0,0.08);
          color: hsl(var(--text-cream));
          padding: 10px 18px;
          border-radius: 8px;
          cursor: pointer;
          font-size: 0.85rem;
          font-weight: 600;
          transition: var(--transition-fast);
        }
        .sync-btn:hover {
          background: rgba(168, 85, 247, 0.08);
          border-color: #7c3aed;
          color: #7c3aed;
        }
        .table-wrapper {
          width: 100%;
          overflow-x: auto;
        }
        .admin-table {
          width: 100%;
          border-collapse: collapse;
          text-align: left;
          font-size: 0.88rem;
        }
        .admin-table th {
          background: rgba(0,0,0,0.02);
          border-bottom: 1px solid rgba(0,0,0,0.08);
          padding: 16px 20px;
          font-weight: 600;
          text-transform: uppercase;
          font-size: 0.75rem;
          color: hsl(var(--text-muted));
          letter-spacing: 0.05em;
        }
        .admin-table td {
          border-bottom: 1px solid rgba(0,0,0,0.05);
          padding: 18px 20px;
          vertical-align: middle;
        }
        .client-meta {
          font-size: 0.75rem;
          color: hsl(var(--text-muted));
          margin-top: 4px;
        }
        .status-badge {
          font-size: 0.7rem;
          font-weight: 700;
          padding: 4px 10px;
          border-radius: 6px;
          text-transform: uppercase;
        }
        .status-badge.confirmed { background: rgba(34, 197, 94, 0.08); color: #15803d; border: 1px solid rgba(34, 197, 94, 0.25); }
        .status-badge.pending { background: rgba(234, 179, 8, 0.08); color: #b45309; border: 1px solid rgba(234, 179, 8, 0.25); }
        .status-badge.cancelled { background: rgba(239, 68, 68, 0.08); color: #b91c1c; border: 1px solid rgba(239, 68, 68, 0.25); }
 
        .payment-badge {
          font-size: 0.7rem;
          font-weight: 700;
          padding: 4px 10px;
          border-radius: 6px;
          text-transform: uppercase;
        }
        .payment-badge.paid { background: rgba(34, 197, 94, 0.08); color: #15803d; border: 1px solid rgba(34, 197, 94, 0.25); }
        .payment-badge.unpaid { background: rgba(239, 68, 68, 0.08); color: #b91c1c; border: 1px solid rgba(239, 68, 68, 0.25); }
        
        .action-btns-group {
          display: flex;
          gap: 6px;
        }
        .tbl-btn {
          border: none;
          padding: 6px 12px;
          border-radius: 6px;
          cursor: pointer;
          font-size: 0.75rem;
          font-weight: 600;
          transition: var(--transition-fast);
        }
        .tbl-btn.success { background: rgba(34, 197, 94, 0.08); color: #15803d; border: 1px solid rgba(34, 197, 94, 0.2); }
        .tbl-btn.success:hover { background: #15803d; color: #fff; }
        .tbl-btn.danger { background: rgba(239, 68, 68, 0.08); color: #b91c1c; border: 1px solid rgba(239, 68, 68, 0.2); }
        .tbl-btn.danger:hover { background: #b91c1c; color: #fff; }
        .tbl-btn.pay { background: rgba(168, 85, 247, 0.08); color: #6d28d9; border: 1px solid rgba(168, 85, 247, 0.25); }
        .tbl-btn.pay:hover { background: #7c3aed; color: #fff; }
        .tbl-btn.pay-un { background: rgba(0,0,0,0.02); color: hsl(var(--text-muted)); border: 1px solid rgba(0,0,0,0.08); }
        .tbl-btn.pay-un:hover { border-color: #ef4444; color: #ef4444; }
      `}</style>
    </div>
  );
}
