"use client";

import React, { useState } from "react";
import { ImageIcon } from "lucide-react";
import type { ProductImage } from "@/lib/shopShared";
import styles from "./shop.module.css";

export default function ProductGallery({ images, name }: { images: ProductImage[]; name: string }) {
  const [active, setActive] = useState(0);
  const current = images[active] ?? images[0];

  if (!current) {
    return (
      <div className={styles.gallery}>
        <div className={styles.stage}>
          <div className={styles.noImg} aria-hidden="true">
            <ImageIcon size={64} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.gallery}>
      <div className={styles.stage}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={current.url}
          alt={current.alt || name}
          className={styles.stageImg}
          width={900}
          height={900}
          decoding="async"
          fetchPriority={active === 0 ? "high" : "auto"}
        />
      </div>
      {images.length > 1 && (
        <div className={styles.thumbs} role="group" aria-label="Product images">
          {images.map((img, i) => (
            <button
              key={`${img.url}-${i}`}
              type="button"
              className={`${styles.thumb} ${i === active ? styles.thumbActive : ""}`}
              onClick={() => setActive(i)}
              aria-label={`Show image ${i + 1} of ${images.length}`}
              aria-pressed={i === active}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={img.url} alt="" loading="lazy" decoding="async" width={74} height={74} />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
