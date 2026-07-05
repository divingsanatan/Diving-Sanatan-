"use client";

import React, { useState, useEffect } from "react";
import { Card } from "@/components/ui/Card";
import { formatCurrency } from "@/utils/formatters";
import { Booking } from "@/types/database";
import { RefreshCw } from "lucide-react";

export default function AdminBookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  const loadBookings = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/bookings");
      const json = await res.json();
      if (json.success) {
        setBookings(json.data);
        setCurrentPage(1); // Reset page on refresh
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

  // Pagination Logic
  const totalPages = Math.ceil(bookings.length / itemsPerPage);
  const paginatedBookings = bookings.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <div className="dashboard-content">
      <div className="flex-between mb-3">
        <p style={{ margin: 0, color: "#6c757d", fontSize: "0.9rem" }}>
          Monitor and coordinate scheduled appointments, manage confirmation states, and track customer payments.
        </p>
        <button className="btn btn-secondary btn-sm" onClick={loadBookings}>
          <RefreshCw size={12} style={{ marginRight: "6px" }} />
          Refresh Bookings
        </button>
      </div>

      {loading ? (
        <p className="text-center" style={{ padding: "40px", color: "#6c757d" }}>Loading bookings...</p>
      ) : (
        <Card variant="glass" className="card-primary" style={{ padding: "0 !important" }}>
          <div className="table-responsive">
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
                {paginatedBookings.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="text-center" style={{ padding: "20px" }}>No scheduled appointments.</td>
                  </tr>
                ) : (
                  paginatedBookings.map(b => (
                    <tr key={b.id}>
                      <td>
                        <strong>{b.clientName}</strong>
                        <div style={{ fontSize: "0.75rem", color: "#6c757d" }}>{b.clientEmail} | {b.clientPhone}</div>
                      </td>
                      <td>{b.serviceName}</td>
                      <td>{b.practitionerName}</td>
                      <td>{b.date} ({b.timeSlot})</td>
                      <td style={{ fontWeight: "600" }}>{formatCurrency(b.price)}</td>
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
                        <div style={{ display: "flex", gap: "6px" }}>
                          {b.status === "pending" && (
                            <button className="btn btn-success btn-sm" onClick={() => handleUpdateStatus(b.id, "status", "confirmed")}>
                              Confirm
                            </button>
                          )}
                          {b.status !== "cancelled" && (
                            <button className="btn btn-danger btn-sm" onClick={() => handleUpdateStatus(b.id, "status", "cancelled")}>
                              Cancel
                            </button>
                          )}
                          {b.paymentStatus === "unpaid" ? (
                            <button className="btn btn-primary btn-sm" onClick={() => handleUpdateStatus(b.id, "paymentStatus", "paid")}>
                              Mark Paid
                            </button>
                          ) : (
                            <button className="btn btn-secondary btn-sm" onClick={() => handleUpdateStatus(b.id, "paymentStatus", "unpaid")}>
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

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="admin-pagination-wrapper">
              <span className="pagination-info">
                Showing {bookings.length === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1} to {Math.min(bookings.length, currentPage * itemsPerPage)} of {bookings.length} entries
              </span>
              <ul className="admin-pagination">
                <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
                  <button onClick={() => setCurrentPage(1)} disabled={currentPage === 1}>« First</button>
                </li>
                <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
                  <button onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))} disabled={currentPage === 1}>Prev</button>
                </li>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(pageNum => (
                  <li key={pageNum} className={`page-item ${currentPage === pageNum ? 'active' : ''}`}>
                    <button onClick={() => setCurrentPage(pageNum)}>{pageNum}</button>
                  </li>
                ))}
                <li className={`page-item ${currentPage === totalPages ? 'disabled' : ''}`}>
                  <button onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))} disabled={currentPage === totalPages}>Next</button>
                </li>
                <li className={`page-item ${currentPage === totalPages ? 'disabled' : ''}`}>
                  <button onClick={() => setCurrentPage(totalPages)} disabled={currentPage === totalPages}>Last »</button>
                </li>
              </ul>
            </div>
          )}
        </Card>
      )}

      <style jsx>{`
        .mb-3 {
          margin-bottom: 1rem;
        }
        .table-responsive {
          width: 100%;
          overflow-x: auto;
        }
      `}</style>
    </div>
  );
}
