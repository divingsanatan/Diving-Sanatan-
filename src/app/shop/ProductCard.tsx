import React from "react";
import Link from "next/link";
import { ImageIcon } from "lucide-react";
import { discountPercent, formatPrice, productPath, type ShopProduct } from "@/lib/shopShared";
import styles from "./shop.module.css";

export function ProductCard({ product, priority = false }: { product: ShopProduct; priority?: boolean }) {
  const img = product.images[0];
  const off = discountPercent(product.price, product.compareAtPrice);
  const soldOut = product.stockStatus === "out_of_stock";

  return (
    <Link href={productPath(product.slug)} className={styles.card}>
      <div className={styles.cardMedia}>
        {img ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={img.url}
            alt={img.alt || product.name}
            className={styles.cardImg}
            loading={priority ? "eager" : "lazy"}
            decoding="async"
            width={600}
            height={600}
          />
        ) : (
          <div className={styles.noImg} aria-hidden="true">
            <ImageIcon size={44} />
          </div>
        )}
        <div className={styles.badges}>
          {soldOut && <span className={`${styles.badge} ${styles.badgeOut}`}>Sold out</span>}
          {!soldOut && off > 0 && <span className={`${styles.badge} ${styles.badgeSale}`}>{off}% off</span>}
          {product.featured && !soldOut && <span className={styles.badge}>Featured</span>}
          {product.stockStatus === "preorder" && <span className={styles.badge}>Pre-order</span>}
        </div>
      </div>
      <div className={styles.cardBody}>
        {product.category && <span className={styles.cardCat}>{product.category}</span>}
        <h3 className={styles.cardName}>{product.name}</h3>
        {product.shortDescription && <p className={styles.cardShort}>{product.shortDescription}</p>}
        <div className={styles.priceRow}>
          {product.price > 0 ? (
            <>
              <span className={styles.price}>{formatPrice(product.price, product.currency)}</span>
              {off > 0 && product.compareAtPrice !== null && (
                <span className={styles.was}>{formatPrice(product.compareAtPrice, product.currency)}</span>
              )}
            </>
          ) : (
            <span className={styles.price}>View details</span>
          )}
        </div>
      </div>
    </Link>
  );
}
