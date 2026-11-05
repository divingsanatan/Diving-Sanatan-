"use client";

import React, { useRef, useState } from "react";
import { ArrowDown, ArrowUp, ImagePlus, Trash2 } from "lucide-react";
import type { ProductImage } from "@/lib/shopShared";
import { compressImage, uploadImage } from "./shopApi";
import styles from "./adminShop.module.css";

const MAX_IMAGES = 12;

export default function ImagesPanel({
  images,
  productName,
  onChange,
  onError,
}: {
  images: ProductImage[];
  productName: string;
  onChange: (next: ProductImage[]) => void;
  onError: (message: string) => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(0);
  const [dragOn, setDragOn] = useState(false);
  const [urlInput, setUrlInput] = useState("");

  const handleFiles = async (list: FileList | File[]) => {
    const files = Array.from(list).filter((f) => f.type.startsWith("image/"));
    if (!files.length) {
      onError("Please choose image files (JPEG, PNG, WebP).");
      return;
    }
    const room = MAX_IMAGES - images.length;
    if (room <= 0) {
      onError(`You can add up to ${MAX_IMAGES} images per product.`);
      return;
    }

    setBusy((n) => n + files.slice(0, room).length);
    const added: ProductImage[] = [];
    for (const file of files.slice(0, room)) {
      try {
        const small = await compressImage(file);
        const url = await uploadImage(small);
        added.push({ url, alt: productName ? productName : "" });
      } catch (e) {
        onError(e instanceof Error ? e.message : "Upload failed.");
      } finally {
        setBusy((n) => n - 1);
      }
    }
    if (added.length) onChange([...images, ...added]);
  };

  const move = (from: number, to: number) => {
    if (to < 0 || to >= images.length) return;
    const next = [...images];
    const [item] = next.splice(from, 1);
    next.splice(to, 0, item);
    onChange(next);
  };

  const addUrl = () => {
    const u = urlInput.trim();
    if (!/^https?:\/\/\S+$/i.test(u)) {
      onError("Enter a full image address starting with https://");
      return;
    }
    if (images.length >= MAX_IMAGES) {
      onError(`You can add up to ${MAX_IMAGES} images per product.`);
      return;
    }
    onChange([...images, { url: u, alt: productName }]);
    setUrlInput("");
  };

  return (
    <div className={styles.panel}>
      <div>
        <h3 className={styles.sectionHead}>Product images</h3>
        <p className={styles.hint}>
          The first image is the main photo (shown in the shop and in Google results). Large photos are shrunk
          automatically so pages load fast. Square images look best.
        </p>
      </div>

      <div
        className={`${styles.drop} ${dragOn ? styles.dropOn : ""}`}
        onClick={() => fileRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setDragOn(true);
        }}
        onDragLeave={() => setDragOn(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOn(false);
          void handleFiles(e.dataTransfer.files);
        }}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && fileRef.current?.click()}
      >
        <ImagePlus size={26} style={{ marginBottom: 6 }} aria-hidden="true" />
        <div>
          {busy > 0 ? `Uploading ${busy} image${busy > 1 ? "s" : ""}…` : "Click to choose images, or drag and drop them here"}
        </div>
        <input
          ref={fileRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif,image/avif"
          multiple
          hidden
          onChange={(e) => {
            if (e.target.files) void handleFiles(e.target.files);
            e.target.value = "";
          }}
        />
      </div>

      <div className={styles.listRow}>
        <input
          className={styles.input}
          placeholder="…or paste an image address (https://)"
          value={urlInput}
          onChange={(e) => setUrlInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addUrl())}
        />
        <button type="button" className={`${styles.btn} ${styles.secondary}`} onClick={addUrl}>
          Add
        </button>
      </div>

      {images.length > 0 && (
        <div className={styles.imgList}>
          {images.map((img, i) => (
            <div key={`${img.url}-${i}`} className={styles.imgItem}>
              <div className={styles.imgPrev}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={img.url} alt="" />
                {i === 0 && <span className={styles.primaryTag}>MAIN</span>}
              </div>
              <div className={styles.field}>
                <label className={styles.label} htmlFor={`alt-${i}`}>
                  Alt text {img.alt.trim() ? "" : "(missing)"}
                </label>
                <input
                  id={`alt-${i}`}
                  className={styles.input}
                  value={img.alt}
                  maxLength={200}
                  placeholder="Describe this image, e.g. 'Rudraksha mala on a wooden table'"
                  onChange={(e) => onChange(images.map((x, j) => (j === i ? { ...x, alt: e.target.value } : x)))}
                />
              </div>
              <div className={styles.imgBtns}>
                <button
                  type="button"
                  className={`${styles.btn} ${styles.secondary} ${styles.small}`}
                  onClick={() => move(i, i - 1)}
                  disabled={i === 0}
                  aria-label="Move image earlier"
                >
                  <ArrowUp size={14} />
                </button>
                <button
                  type="button"
                  className={`${styles.btn} ${styles.secondary} ${styles.small}`}
                  onClick={() => move(i, i + 1)}
                  disabled={i === images.length - 1}
                  aria-label="Move image later"
                >
                  <ArrowDown size={14} />
                </button>
                <button
                  type="button"
                  className={`${styles.btn} ${styles.danger} ${styles.small}`}
                  onClick={() => onChange(images.filter((_, j) => j !== i))}
                  aria-label="Remove image"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
