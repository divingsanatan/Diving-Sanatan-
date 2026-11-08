"use client";

import { useMemo, useSyncExternalStore } from "react";

/** The shopping cart lives in the visitor's browser. Prices are NEVER stored: the server re-prices at checkout. */
const KEY = "ds_shop_cart";
const EVENT = "ds-cart-change";

export interface CartItem {
  productId: string;
  qty: number;
}

function readRaw(): string {
  try {
    return window.localStorage.getItem(KEY) || "[]";
  } catch {
    return "[]";
  }
}

function parse(raw: string): CartItem[] {
  try {
    const v = JSON.parse(raw);
    return Array.isArray(v)
      ? v
          .filter((i) => i && typeof i.productId === "string" && Number.isFinite(Number(i.qty)))
          .map((i) => ({ productId: i.productId, qty: Math.max(1, Math.min(20, Math.trunc(Number(i.qty)))) }))
      : [];
  } catch {
    return [];
  }
}

export const getCart = (): CartItem[] => parse(readRaw());

function save(items: CartItem[]) {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(items));
  } catch {
    /* storage unavailable */
  }
  window.dispatchEvent(new Event(EVENT));
}

export function addToCart(productId: string, qty = 1) {
  const items = getCart();
  const found = items.find((i) => i.productId === productId);
  if (found) found.qty = Math.min(20, found.qty + qty);
  else items.push({ productId, qty: Math.max(1, Math.min(20, qty)) });
  save(items);
}

export const setQty = (productId: string, qty: number) =>
  save(getCart().map((i) => (i.productId === productId ? { ...i, qty: Math.max(1, Math.min(20, qty)) } : i)));

export const removeFromCart = (productId: string) => save(getCart().filter((i) => i.productId !== productId));
export const clearCart = () => save([]);

function subscribe(cb: () => void) {
  window.addEventListener(EVENT, cb);
  window.addEventListener("storage", cb);
  return () => {
    window.removeEventListener(EVENT, cb);
    window.removeEventListener("storage", cb);
  };
}

/** Live cart contents (empty on the server render, real after the page loads). */
export function useCart(): CartItem[] {
  const raw = useSyncExternalStore(subscribe, readRaw, () => "[]");
  return useMemo(() => parse(raw), [raw]);
}

export const cartCount = (items: CartItem[]) => items.reduce((n, i) => n + i.qty, 0);
