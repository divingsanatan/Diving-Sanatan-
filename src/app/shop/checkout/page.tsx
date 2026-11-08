"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { formatPrice } from "@/lib/shopShared";
import { clearCart, useCart } from "@/lib/shopCart";
import type { Quote } from "@/lib/shopCommerce";
import styles from "../cart.module.css";
import shop from "../shop.module.css";

type RzpCtor = new (o: Record<string, unknown>) => {
  open(): void;
  on(event: string, cb: (r: { error?: { description?: string } }) => void): void;
};

function loadRazorpay(): Promise<RzpCtor | null> {
  const w = window as unknown as { Razorpay?: RzpCtor };
  if (w.Razorpay) return Promise.resolve(w.Razorpay);
  return new Promise((resolve) => {
    const s = document.createElement("script");
    s.src = "https://checkout.razorpay.com/v1/checkout.js";
    s.onload = () => resolve(w.Razorpay || null);
    s.onerror = () => resolve(null);
    document.body.appendChild(s);
  });
}

export default function CheckoutPage() {
  const router = useRouter();
  const items = useCart();
  const key = items.map((i) => `${i.productId}:${i.qty}`).join(",");
  const [quote, setQuote] = useState<Quote | null>(null);
  const [loadedKey, setLoadedKey] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [f, setF] = useState({
    name: "", email: "", phone: "", address: "", city: "", state: "", pincode: "", country: "India", notes: "",
  });
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setF((p) => ({ ...p, [k]: e.target.value }));

  // Pre-fill from the signed-in member, if any
  useEffect(() => {
    try {
      const s = JSON.parse(window.localStorage.getItem("divingsanatan_user_session") || "{}");
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setF((p) => ({ ...p, name: p.name || s.name || "", email: p.email || s.email || "", phone: p.phone || s.phone || "" }));
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    if (!key) return;
    fetch("/api/shop/quote", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ items }) })
      .then((r) => r.json())
      .then((j) => {
        if (cancelled) return;
        setQuote(j.success ? j.quote : null);
        if (!j.success) setError(j.error || "");
        setLoadedKey(key);
      })
      .catch(() => !cancelled && setLoadedKey(key));
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  const loading = !!key && loadedKey !== key;
  const finish = (orderId: string) => {
    clearCart();
    router.push(`/shop/order/${orderId}`);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (busy || !quote) return;
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/shop/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items,
          customer: { name: f.name, email: f.email, phone: f.phone },
          shipping: { address: f.address, city: f.city, state: f.state, pincode: f.pincode, country: f.country },
          notes: f.notes,
        }),
      });
      const j = await res.json();
      if (!j.success) {
        if (j.quote) setQuote(j.quote);
        setError(j.error || "We could not place your order.");
        setBusy(false);
        return;
      }
      if (j.mode === "manual") {
        finish(j.orderId);
        return;
      }

      const Rzp = await loadRazorpay();
      if (!Rzp) {
        setError("The payment window could not load. Please check your connection and try again.");
        setBusy(false);
        return;
      }
      const rz = new Rzp({
        key: j.razorpay.keyId,
        amount: j.razorpay.amount,
        currency: j.razorpay.currency,
        order_id: j.razorpay.orderId,
        name: "Diving Sanatan",
        description: `Order ${j.orderNumber}`,
        prefill: { name: f.name, email: f.email, contact: f.phone },
        theme: { color: "#6d28d9" },
        modal: {
          ondismiss: () => {
            setBusy(false);
            setError("Payment was not completed. Your cart is saved, so you can try again.");
          },
        },
        handler: async (resp: Record<string, string>) => {
          try {
            const v = await fetch("/api/shop/verify-payment", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ orderId: j.orderId, ...resp }),
            });
            const vj = await v.json();
            if (vj.success) finish(j.orderId);
            else {
              setError(`${vj.error || "We could not confirm your payment."} If money was deducted, please contact us with order ${j.orderNumber}.`);
              setBusy(false);
            }
          } catch {
            setError(`We could not confirm your payment. If money was deducted, please contact us with order ${j.orderNumber}.`);
            setBusy(false);
          }
        },
      });
      rz.on("payment.failed", (r) => {
        setError(r.error?.description || "The payment failed. Please try again.");
        setBusy(false);
      });
      rz.open();
    } catch {
      setError("Something went wrong. Please try again.");
      setBusy(false);
    }
  };

  return (
    <div className="page-shell">
      <Header />
      <main className={styles.wrap}>
        <h1 className={styles.h1}>Checkout</h1>
        <p className={styles.lead}>Tell us where to send your order.</p>

        {items.length === 0 ? (
          <div className={styles.empty}>
            <h2>Your cart is empty</h2>
            <Link href="/shop" className={shop.buy}>Continue shopping</Link>
          </div>
        ) : loading ? (
          <div className={styles.empty}><p>Loading…</p></div>
        ) : !quote ? (
          <div className={styles.empty}>
            <h2>We couldn&apos;t load your order</h2>
            <p>{error}</p>
            <Link href="/shop/cart" className={shop.buy}>Back to cart</Link>
          </div>
        ) : (
          <form onSubmit={submit} className={styles.layout} noValidate>
            <div className={`${styles.card} ${styles.form}`}>
              {quote.problems.length > 0 && (
                <div className={styles.problems} role="alert">{quote.problems.map((p, i) => (<div key={i}>{p}</div>))}</div>
              )}
              <h2 className={styles.formTitle} style={{ marginTop: 0 }}>Contact</h2>
              <div className={styles.field}><label htmlFor="c-name">Full name</label><input id="c-name" value={f.name} onChange={set("name")} autoComplete="name" required /></div>
              <div className={styles.row2}>
                <div className={styles.field}><label htmlFor="c-email">Email</label><input id="c-email" type="email" value={f.email} onChange={set("email")} autoComplete="email" required /></div>
                <div className={styles.field}><label htmlFor="c-phone">Phone</label><input id="c-phone" type="tel" value={f.phone} onChange={set("phone")} autoComplete="tel" required /></div>
              </div>
              <h2 className={styles.formTitle}>Delivery address</h2>
              <div className={styles.field}><label htmlFor="c-addr">Address</label><input id="c-addr" value={f.address} onChange={set("address")} autoComplete="street-address" required /></div>
              <div className={styles.row2}>
                <div className={styles.field}><label htmlFor="c-city">City</label><input id="c-city" value={f.city} onChange={set("city")} autoComplete="address-level2" required /></div>
                <div className={styles.field}><label htmlFor="c-state">State</label><input id="c-state" value={f.state} onChange={set("state")} autoComplete="address-level1" required /></div>
              </div>
              <div className={styles.row2}>
                <div className={styles.field}><label htmlFor="c-pin">PIN / postal code</label><input id="c-pin" inputMode="numeric" value={f.pincode} onChange={set("pincode")} autoComplete="postal-code" required /></div>
                <div className={styles.field}><label htmlFor="c-country">Country</label><input id="c-country" value={f.country} onChange={set("country")} autoComplete="country-name" required /></div>
              </div>
              <div className={styles.field}><label htmlFor="c-notes">Order notes (optional)</label><textarea id="c-notes" rows={3} value={f.notes} onChange={set("notes")} /></div>
              {error && <div className={styles.error} role="alert">{error}</div>}
            </div>

            <aside className={`${styles.card} ${styles.summary}`}>
              <h2 className={styles.sumTitle}>Your order</h2>
              {quote.lines.map((l) => (
                <div key={l.productId} className={styles.sumRow}><span>{l.name} × {l.qty}</span><span>{formatPrice(l.lineTotal, quote.currency)}</span></div>
              ))}
              <div className={styles.sumRow}><span>Shipping</span><span>{quote.shippingFee > 0 ? formatPrice(quote.shippingFee, quote.currency) : "Free"}</span></div>
              <div className={styles.sumTotal}><span>Total</span><span>{formatPrice(quote.total, quote.currency)}</span></div>
              <button type="submit" className={`${shop.buy} ${styles.go}`} disabled={busy}>
                {busy ? "Please wait…" : "Place order and pay"}
              </button>
              <p className={styles.secure}>Payments are processed securely by Razorpay.</p>
              <p className={styles.secure}><Link href="/shop/cart">Edit cart</Link></p>
            </aside>
          </form>
        )}
      </main>
      <Footer />
    </div>
  );
}
