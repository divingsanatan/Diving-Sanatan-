"use client";

import React, { useMemo, useState } from "react";
import { Search } from "lucide-react";
import type { ShopProduct } from "@/lib/shopShared";
import { ProductCard } from "./ProductCard";
import styles from "./shop.module.css";

type SortKey = "featured" | "newest" | "price-asc" | "price-desc" | "name";

export default function ShopCatalog({ products }: { products: ShopProduct[] }) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("all");
  const [sort, setSort] = useState<SortKey>("featured");

  const categories = useMemo(
    () => Array.from(new Set(products.map((p) => p.category).filter(Boolean))).sort((a, b) => a.localeCompare(b)),
    [products]
  );

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = products.filter((p) => {
      if (category !== "all" && p.category !== category) return false;
      if (!q) return true;
      return [p.name, p.shortDescription, p.category, p.tags.join(" ")].join(" ").toLowerCase().includes(q);
    });
    const sorted = [...list];
    switch (sort) {
      case "newest":
        sorted.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
        break;
      case "price-asc":
        sorted.sort((a, b) => a.price - b.price);
        break;
      case "price-desc":
        sorted.sort((a, b) => b.price - a.price);
        break;
      case "name":
        sorted.sort((a, b) => a.name.localeCompare(b.name));
        break;
      default:
        break; // server already orders by featured, then custom order
    }
    return sorted;
  }, [products, query, category, sort]);

  if (products.length === 0) {
    return (
      <div className={styles.empty}>
        <h2 className={styles.emptyTitle}>Our shop is being stocked</h2>
        <p>New products are on their way. Please check back soon.</p>
      </div>
    );
  }

  return (
    <>
      <div className={styles.toolbar}>
        <div className={styles.searchWrap}>
          <Search size={18} className={styles.searchIcon} aria-hidden="true" />
          <input
            type="search"
            className={styles.search}
            placeholder="Search products"
            aria-label="Search products"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <label>
          <span className="sr-only" style={{ position: "absolute", left: -9999 }}>Sort products</span>
          <select className={styles.sort} value={sort} onChange={(e) => setSort(e.target.value as SortKey)}>
            <option value="featured">Featured</option>
            <option value="newest">Newest</option>
            <option value="price-asc">Price: low to high</option>
            <option value="price-desc">Price: high to low</option>
            <option value="name">Name A–Z</option>
          </select>
        </label>
      </div>

      {categories.length > 0 && (
        <div className={styles.chips} role="group" aria-label="Filter by category">
          {["all", ...categories].map((c) => (
            <button
              key={c}
              type="button"
              className={`${styles.chip} ${category === c ? styles.chipActive : ""}`}
              aria-pressed={category === c}
              onClick={() => setCategory(c)}
            >
              {c === "all" ? "All products" : c}
            </button>
          ))}
        </div>
      )}

      <p className={styles.count} aria-live="polite">
        {visible.length} {visible.length === 1 ? "product" : "products"}
      </p>

      {visible.length === 0 ? (
        <div className={styles.empty}>
          <h2 className={styles.emptyTitle}>No products found</h2>
          <p>Try a different search or category.</p>
        </div>
      ) : (
        <div className={styles.grid}>
          {visible.map((p, i) => (
            <ProductCard key={p.id} product={p} priority={i < 4} />
          ))}
        </div>
      )}
    </>
  );
}
