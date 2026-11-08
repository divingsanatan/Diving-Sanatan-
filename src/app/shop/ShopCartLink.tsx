"use client";

import React from "react";
import Link from "next/link";
import { ShoppingBag } from "lucide-react";
import { cartCount, useCart } from "@/lib/shopCart";
import styles from "./cart.module.css";

export default function ShopCartLink() {
  const count = cartCount(useCart());
  return (
    <Link href="/shop/cart" className={styles.cartLink} aria-label={`Shopping cart, ${count} ${count === 1 ? "item" : "items"}`}>
      <ShoppingBag size={18} aria-hidden="true" />
      <span>Cart</span>
      {count > 0 && <span className={styles.cartBadge}>{count}</span>}
    </Link>
  );
}
