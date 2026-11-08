"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, Minus, Plus } from "lucide-react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { formatPrice } from "@/lib/shopShared";
import { removeFromCart, setQty, useCart } from "@/lib/shopCart";
import type { Quote } from "@/lib/shopCommerce";
import styles from "../cart.module.css";
import shop from "../shop.module.css";

export default function CartPage() {
  const items = useCart();
  const key = items.map((i) => `${i.productId}:${i.qty}`).join(",");
  const [quote, setQuote] = useState<Quote | null>(null);
  const [error, setError] = useState("");
  const [loadedKey, setLoadedKey] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    if (!key) return;
    fetch("/api/shop/quote", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ items }),
    })
      .then((r) => r.json())
      .then((j) => {
        if (cancelled) return;
        if (j.success) {
          setQuote(j.quote);
          setError("");
        } else {
          setQuote(null);
          setError(j.error || "Could not load your cart.");
        }
        setLoadedKey(key);
      })
      .catch(() => {
        if (!cancelled) {
          setError("Could not load your cart. Please check your connection.");
          setLoadedKey(key);
        }
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  const loading = !!key && loadedKey !== key;

  return (
    <div className="page-shell">
      <Header />
      <main className={styles.wrap}>
        <h1 className={styles.h1}>Your cart</h1>
        <p className={styles.lead}>Review your items before checkout.</p>

        {items.length === 0 ? (
          <div className={styles.empty}>
            <h2>Your cart is empty</h2>
            <p>Browse the shop and add something you love.</p>
            <Link href="/shop" className={shop.buy}>Continue shopping</Link>
          </div>
        ) : loading ? (
          <div className={styles.empty}><p>Loading your cart…</p></div>
        ) : (
          <>
            {quote && quote.problems.length > 0 && (
              <div className={styles.problems} role="alert">
                {quote.problems.map((p, i) => (<div key={i}>{p}</div>))}
              </div>
            )}
            {error && !quote ? (
              <div className={styles.empty}>
                <h2>We couldn&apos;t load your cart</h2>
                <p>{error}</p>
                <Link href="/shop" className={shop.buy}>Back to the shop</Link>
              </div>
            ) : quote ? (
              <div className={styles.layout}>
                <div className={styles.card}>
                  {quote.lines.map((l) => (
                    <div key={l.productId} className={styles.item}>
                      {l.image ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={l.image} alt="" className={styles.thumb} width={84} height={84} />
                      ) : (
                        <div className={styles.thumb} />
                      )}
                      <div>
                        <p className={styles.name}><Link href={`/shop/${l.slug}`}>{l.name}</Link></p>
                        <p className={styles.unit}>{formatPrice(l.price, quote.currency)} each</p>
                        <div className={styles.lineActions}>
                          <div className={styles.stepper}>
                            <button type="button" aria-label={`Decrease quantity of ${l.name}`} disabled={l.qty <= 1} onClick={() => setQty(l.productId, l.qty - 1)}><Minus size={14} /></button>
                            <output>{l.qty}</output>
                            <button type="button" aria-label={`Increase quantity of ${l.name}`} disabled={l.qty >= Math.min(20, l.maxQty ?? 20)} onClick={() => setQty(l.productId, l.qty + 1)}><Plus size={14} /></button>
                          </div>
                          <button type="button" className={styles.remove} onClick={() => removeFromCart(l.productId)}>Remove</button>
                        </div>
                      </div>
                      <div className={styles.lineTotal}>{formatPrice(l.lineTotal, quote.currency)}</div>
                    </div>
                  ))}
                </div>

                <aside className={`${styles.card} ${styles.summary}`}>
                  <h2 className={styles.sumTitle}>Order summary</h2>
                  <div className={styles.sumRow}><span>Subtotal</span><span>{formatPrice(quote.subtotal, quote.currency)}</span></div>
                  <div className={styles.sumRow}><span>Shipping</span><span>{quote.shippingFee > 0 ? formatPrice(quote.shippingFee, quote.currency) : "Free"}</span></div>
                  <div className={styles.sumTotal}><span>Total</span><span>{formatPrice(quote.total, quote.currency)}</span></div>
                  <Link href="/shop/checkout" className={`${shop.buy} ${styles.go}`}>
                    Proceed to checkout <ArrowRight size={18} aria-hidden="true" />
                  </Link>
                  <p className={styles.secure}>Prices are confirmed securely at checkout.</p>
                </aside>
              </div>
            ) : null}
          </>
        )}
      </main>
      <Footer />
    </div>
  );
}
