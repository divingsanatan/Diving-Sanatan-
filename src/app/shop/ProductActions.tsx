"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, Check, Minus, Plus, ShoppingBag } from "lucide-react";
import { addToCart } from "@/lib/shopCart";
import styles from "./shop.module.css";
import cart from "./cart.module.css";

export default function ProductActions({
  productId,
  maxQty,
  preorder,
}: {
  productId: string;
  maxQty: number | null;
  preorder: boolean;
}) {
  const router = useRouter();
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);
  const cap = maxQty && maxQty > 0 ? Math.min(20, maxQty) : 20;

  const add = () => {
    addToCart(productId, qty);
    setAdded(true);
    window.setTimeout(() => setAdded(false), 4000);
  };

  return (
    <div className={cart.actions}>
      <div className={cart.qtyRow}>
        <span className={cart.qtyLabel}>Quantity</span>
        <div className={cart.stepper}>
          <button type="button" onClick={() => setQty((q) => Math.max(1, q - 1))} aria-label="Decrease quantity" disabled={qty <= 1}>
            <Minus size={16} />
          </button>
          <output aria-live="polite">{qty}</output>
          <button type="button" onClick={() => setQty((q) => Math.min(cap, q + 1))} aria-label="Increase quantity" disabled={qty >= cap}>
            <Plus size={16} />
          </button>
        </div>
      </div>

      <div className={styles.ctaRow}>
        <button type="button" className={styles.buy} onClick={add}>
          {added ? <Check size={18} aria-hidden="true" /> : <ShoppingBag size={18} aria-hidden="true" />}
          {added ? "Added to cart" : preorder ? "Pre-order: add to cart" : "Add to cart"}
        </button>
        <button
          type="button"
          className={styles.ghost}
          onClick={() => {
            addToCart(productId, qty);
            router.push("/shop/checkout");
          }}
        >
          Buy now <ArrowRight size={18} aria-hidden="true" />
        </button>
      </div>
      {added && (
        <p className={cart.addedNote} role="status">
          Item added. <Link href="/shop/cart">View your cart</Link>
        </p>
      )}
    </div>
  );
}
