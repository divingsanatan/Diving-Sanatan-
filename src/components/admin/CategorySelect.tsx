"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import shop from "@/app/admin/shop/adminShop.module.css";

/**
 * The one category picker for every kind of content (articles, videos, questions, glossary terms).
 * The list comes from Admin > Content Categories. Nothing can be typed in here, so the list stays tidy.
 */
export default function CategorySelect({
  id,
  value,
  onChange,
  disabled,
  emptyLabel = "No category",
}: {
  id: string;
  value: string;
  onChange: (name: string) => void;
  disabled?: boolean;
  emptyLabel?: string;
}) {
  const [names, setNames] = useState<string[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/blogs/categories?admin_view=true", { cache: "no-store", credentials: "same-origin" });
        const json = await res.json();
        if (!cancelled) setNames(json.success ? (json.data as { name: string }[]).map((c) => c.name) : []);
      } catch {
        if (!cancelled) setNames([]);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const list = names || [];
  const unknown = !!value && names !== null && !list.includes(value);

  return (
    <>
      <select id={id} className={shop.select} disabled={disabled} value={value} onChange={(e) => onChange(e.target.value)}>
        <option value="">{emptyLabel}</option>
        {list.map((n) => (<option key={n} value={n}>{n}</option>))}
        {unknown && <option value={value}>{value} (not in the list)</option>}
      </select>
      <span className={shop.hint}>
        One shared list for all content. <Link href="/admin/content-categories">Add or rename categories</Link>
      </span>
    </>
  );
}
