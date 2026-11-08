"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { X } from "lucide-react";
import { formatPrice } from "@/lib/shopShared";
import { ORDER_STATUSES, ORDER_STATUS_LABEL, type OrderStatus, type ShopOrder } from "@/lib/shopOrdersShared";
import styles from "../adminShop.module.css";

type Filter = "all" | OrderStatus;

async function api<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...init,
    headers: init?.body ? { "Content-Type": "application/json" } : undefined,
    credentials: "same-origin",
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok || !json.success) throw Object.assign(new Error(json.error || `Request failed (${res.status})`), { status: res.status });
  return json as T;
}

const tone = (s: OrderStatus) =>
  s === "cancelled" || s === "refunded" ? styles.st_archived : s === "pending_payment" ? styles.st_draft : styles.st_published;

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<ShopOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [authIssue, setAuthIssue] = useState("");
  const [loadError, setLoadError] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState<ShopOrder | null>(null);
  const [status, setStatus] = useState<OrderStatus>("paid");
  const [tracking, setTracking] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ msg: string; err?: boolean } | null>(null);

  const notify = useCallback((msg: string, err = false) => {
    setToast({ msg, err });
    window.setTimeout(() => setToast(null), err ? 6000 : 3500);
  }, []);

  const load = useCallback(() => {
    return api<{ data: ShopOrder[] }>("/api/shop/admin/orders")
      .then((r) => {
        setOrders(r.data);
        setAuthIssue("");
        setLoadError("");
      })
      .catch((e: Error & { status?: number }) => {
        if (e.status === 401 || e.status === 403 || e.status === 503) setAuthIssue(e.message);
        else setLoadError(e.message);
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    let cancelled = false;
    api<{ data: ShopOrder[] }>("/api/shop/admin/orders")
      .then((r) => !cancelled && setOrders(r.data))
      .catch((e: Error & { status?: number }) => {
        if (cancelled) return;
        if (e.status === 401 || e.status === 403 || e.status === 503) setAuthIssue(e.message);
        else setLoadError(e.message);
      })
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, []);

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: orders.length };
    for (const o of orders) c[o.status] = (c[o.status] || 0) + 1;
    return c;
  }, [orders]);

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return orders
      .filter((o) => filter === "all" || o.status === filter)
      .filter((o) => !q || [o.orderNumber, o.customerName, o.customerEmail, o.customerPhone].join(" ").toLowerCase().includes(q));
  }, [orders, filter, query]);

  const openOrder = (o: ShopOrder) => {
    setOpen(o);
    setStatus(o.status);
    setTracking(o.trackingInfo);
    setNotes(o.adminNotes);
  };

  const save = async () => {
    if (!open) return;
    setSaving(true);
    try {
      const r = await api<{ data: ShopOrder }>(`/api/shop/admin/orders/${open.id}`, {
        method: "PATCH",
        body: JSON.stringify({ status, trackingInfo: tracking, adminNotes: notes }),
      });
      setOrders((list) => list.map((o) => (o.id === r.data.id ? r.data : o)));
      setOpen(r.data);
      notify("Order updated.");
    } catch (e) {
      notify(e instanceof Error ? e.message : "Could not update the order.", true);
    } finally {
      setSaving(false);
    }
  };

  const revenue = orders
    .filter((o) => ["paid", "processing", "shipped", "delivered"].includes(o.status))
    .reduce((s, o) => s + o.total, 0);

  return (
    <div className={styles.wrap}>
      {authIssue && (
        <div className={styles.banner} role="alert">
          <span>{authIssue}</span>
          <a href="/admin/login?logout=1" className={`${styles.btn} ${styles.secondary} ${styles.small}`}>Sign in again</a>
        </div>
      )}
      {loadError && (
        <div className={`${styles.banner} ${styles.bannerErr}`}>
          <span>{loadError}</span>
          <button className={`${styles.btn} ${styles.secondary} ${styles.small}`} onClick={() => { setLoading(true); void load(); }}>Try again</button>
        </div>
      )}

      <div className={styles.topbar}>
        <div>
          <h2 className={styles.h2}>Shop orders</h2>
          <p className={styles.sub}>See what customers ordered, update the status and add tracking details.</p>
        </div>
      </div>

      <div className={styles.stats}>
        <div className={styles.stat}><div className={styles.statNum}>{orders.length}</div><div className={styles.statLabel}>Total orders</div></div>
        <div className={styles.stat}><div className={styles.statNum}>{counts.paid || 0}</div><div className={styles.statLabel}>New paid (to fulfil)</div></div>
        <div className={styles.stat}><div className={styles.statNum}>{counts.pending_payment || 0}</div><div className={styles.statLabel}>Awaiting payment</div></div>
        <div className={styles.stat}><div className={styles.statNum}>{formatPrice(revenue, "INR")}</div><div className={styles.statLabel}>Paid revenue</div></div>
      </div>

      <div className={styles.filters}>
        <input className={styles.input} placeholder="Search order number, name, email or phone" aria-label="Search orders" value={query} onChange={(e) => setQuery(e.target.value)} />
        <div className={styles.tabsRow}>
          {(["all", ...ORDER_STATUSES] as Filter[]).map((f) => (
            <button key={f} type="button" className={`${styles.pill} ${filter === f ? styles.pillOn : ""}`} onClick={() => setFilter(f)}>
              {f === "all" ? "All" : ORDER_STATUS_LABEL[f]} ({counts[f] || 0})
            </button>
          ))}
        </div>
      </div>

      <div className={styles.tableCard}>
        {loading ? (
          <div className={styles.empty}>Loading orders…</div>
        ) : rows.length === 0 ? (
          <div className={styles.empty}>{orders.length === 0 ? "No orders yet. They will appear here as customers buy." : "No orders match your search."}</div>
        ) : (
          <table className={styles.table}>
            <thead><tr><th>Order</th><th>Date</th><th>Customer</th><th>Total</th><th>Status</th><th>Actions</th></tr></thead>
            <tbody>
              {rows.map((o) => (
                <tr key={o.id}>
                  <td><div className={styles.prodName}>{o.orderNumber}</div><div className={styles.prodSlug}>{o.items.length} {o.items.length === 1 ? "item" : "items"}</div></td>
                  <td>{o.createdAt ? new Date(o.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "–"}</td>
                  <td><div>{o.customerName}</div><div className={styles.prodSlug}>{o.customerPhone}</div></td>
                  <td>{formatPrice(o.total, o.currency)}</td>
                  <td><span className={`${styles.status} ${tone(o.status)}`}>{ORDER_STATUS_LABEL[o.status]}</span></td>
                  <td><button className={`${styles.btn} ${styles.secondary} ${styles.small}`} onClick={() => openOrder(o)}>View / update</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {open && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={`Order ${open.orderNumber}`}
          style={{ position: "fixed", inset: 0, zIndex: 2500, background: "rgba(15,23,42,0.45)", display: "flex", justifyContent: "flex-end" }}
          onClick={(e) => e.target === e.currentTarget && setOpen(null)}
        >
          <div style={{ width: "min(560px, 100%)", height: "100%", overflowY: "auto", background: "#fff", padding: 24, boxShadow: "-12px 0 40px rgba(0,0,0,0.15)" }}>
            <div className={styles.listRow} style={{ justifyContent: "space-between", marginBottom: 14 }}>
              <h3 className={styles.h2}>Order {open.orderNumber}</h3>
              <button className={`${styles.btn} ${styles.secondary} ${styles.small}`} onClick={() => setOpen(null)} aria-label="Close"><X size={15} /></button>
            </div>

            <div className={styles.panel} style={{ marginBottom: 16 }}>
              <div className={styles.field}>
                <label className={styles.label} htmlFor="o-status">Status</label>
                <select id="o-status" className={styles.select} value={status} onChange={(e) => setStatus(e.target.value as OrderStatus)}>
                  {ORDER_STATUSES.map((s) => (<option key={s} value={s}>{ORDER_STATUS_LABEL[s]}</option>))}
                </select>
                <span className={styles.hint}>Marking an order Cancelled or Refunded puts the items back in stock. Marking a manual order Paid takes them out of stock.</span>
              </div>
              <div className={styles.field}>
                <label className={styles.label} htmlFor="o-track">Tracking details (shown to the customer)</label>
                <input id="o-track" className={styles.input} value={tracking} maxLength={500} onChange={(e) => setTracking(e.target.value)} placeholder="e.g. Delhivery AWB 1234567890" />
              </div>
              <div className={styles.field}>
                <label className={styles.label} htmlFor="o-notes">Private notes (only you can see)</label>
                <textarea id="o-notes" className={styles.textarea} rows={3} value={notes} maxLength={2000} onChange={(e) => setNotes(e.target.value)} />
              </div>
              <button className={`${styles.btn} ${styles.primary}`} onClick={() => void save()} disabled={saving}>{saving ? "Saving…" : "Save changes"}</button>
            </div>

            <div className={styles.panel}>
              <h3 className={styles.sectionHead}>Items</h3>
              {open.items.map((l, i) => (
                <div key={i} className={styles.listRow} style={{ justifyContent: "space-between" }}>
                  <span>{l.name} × {l.qty}{l.sku ? ` (SKU ${l.sku})` : ""}</span><strong>{formatPrice(l.lineTotal, open.currency)}</strong>
                </div>
              ))}
              <div className={styles.listRow} style={{ justifyContent: "space-between" }}><span>Shipping</span><span>{open.shippingFee > 0 ? formatPrice(open.shippingFee, open.currency) : "Free"}</span></div>
              <div className={styles.listRow} style={{ justifyContent: "space-between" }}><strong>Total</strong><strong>{formatPrice(open.total, open.currency)}</strong></div>
              <h3 className={styles.sectionHead}>Customer</h3>
              <div>{open.customerName}<br />{open.customerEmail}<br />{open.customerPhone}</div>
              <h3 className={styles.sectionHead}>Ship to</h3>
              <div>{open.shippingAddress}<br />{open.shippingCity}, {open.shippingState} {open.shippingPincode}<br />{open.shippingCountry}</div>
              {open.customerNotes && (<><h3 className={styles.sectionHead}>Customer notes</h3><div>{open.customerNotes}</div></>)}
              <h3 className={styles.sectionHead}>Payment</h3>
              <div>{open.paymentMethod === "razorpay" ? "Razorpay (online)" : "Manual (you collect payment)"}{open.razorpayPaymentId ? `, payment ${open.razorpayPaymentId}` : ""}</div>
            </div>
          </div>
        </div>
      )}

      {toast && <div className={`${styles.toast} ${toast.err ? styles.toastErr : ""}`} role="status">{toast.msg}</div>}
    </div>
  );
}
