import { supabaseServer } from "@/utils/supabaseServer";
import { sanitizeHtml } from "@/utils/sanitizeHtml";
import {
  CURRENCIES,
  SITE_NAME,
  SITE_URL,
  effectiveDescription,
  mapProductRow,
  productUrl,
  slugify,
  type ProductImage,
  type ProductSpec,
  type ShopProduct,
} from "./shopShared";

/* ------------------------------------------------------------------ */
/* Public reads (published products only)                              */
/* ------------------------------------------------------------------ */

export async function getPublishedProducts(): Promise<ShopProduct[]> {
  try {
    const { data, error } = await supabaseServer
      .from("shop_products")
      .select("*")
      .eq("status", "published")
      .order("featured", { ascending: false })
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: false })
      .limit(500);
    if (error) {
      console.error("getPublishedProducts:", error.message);
      return [];
    }
    return (data || []).map(mapProductRow);
  } catch (e) {
    console.error("getPublishedProducts failed:", e);
    return [];
  }
}

export async function getProductBySlug(slug: string): Promise<ShopProduct | null> {
  try {
    const { data, error } = await supabaseServer
      .from("shop_products")
      .select("*")
      .eq("slug", slug)
      .eq("status", "published")
      .maybeSingle();
    if (error || !data) return null;
    return mapProductRow(data);
  } catch (e) {
    console.error("getProductBySlug failed:", e);
    return null;
  }
}

export function relatedProducts(all: ShopProduct[], current: ShopProduct, limit = 4): ShopProduct[] {
  const others = all.filter((p) => p.id !== current.id);
  const same = others.filter((p) => current.category && p.category === current.category);
  const rest = others.filter((p) => !same.includes(p));
  return [...same, ...rest].slice(0, limit);
}

/* ------------------------------------------------------------------ */
/* Structured data (JSON-LD)                                           */
/* ------------------------------------------------------------------ */

const AVAILABILITY: Record<string, string> = {
  in_stock: "https://schema.org/InStock",
  out_of_stock: "https://schema.org/OutOfStock",
  preorder: "https://schema.org/PreOrder",
};

export function productJsonLd(p: ShopProduct) {
  const url = productUrl(p.slug);
  const images = p.images.map((i) => i.url).filter(Boolean);
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: p.name,
    description: effectiveDescription(p),
    ...(images.length ? { image: images } : {}),
    ...(p.sku ? { sku: p.sku } : {}),
    ...(p.category ? { category: p.category } : {}),
    brand: { "@type": "Brand", name: SITE_NAME },
    url,
    ...(p.price > 0
      ? {
          offers: {
            "@type": "Offer",
            url,
            price: p.price.toFixed(2),
            priceCurrency: p.currency,
            availability: AVAILABILITY[p.stockStatus] || AVAILABILITY.in_stock,
            itemCondition: "https://schema.org/NewCondition",
            seller: { "@type": "Organization", name: SITE_NAME },
          },
        }
      : {}),
  };
}

export function breadcrumbJsonLd(items: { name: string; path: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((it, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: it.name,
      item: `${SITE_URL}${it.path}`,
    })),
  };
}

export function itemListJsonLd(products: ShopProduct[]) {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    itemListElement: products.slice(0, 50).map((p, i) => ({
      "@type": "ListItem",
      position: i + 1,
      url: productUrl(p.slug),
      name: p.name,
    })),
  };
}

/** Safe to embed inside <script type="application/ld+json">. */
export function jsonLdString(data: unknown): string {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}

/* ------------------------------------------------------------------ */
/* Admin input validation                                              */
/* ------------------------------------------------------------------ */

type Row = Record<string, unknown>;

const isHttpUrl = (s: string) => /^https?:\/\/[^\s]+$/i.test(s);
const isImageUrl = (s: string) => isHttpUrl(s) || /^\/(?!\/)[^\s]*$/.test(s);
const str = (v: unknown, max: number) => (typeof v === "string" ? v.trim().slice(0, max) : "");

/**
 * Turns an untrusted request body into a database row, or a list of problems.
 * `partial` is not supported on purpose: the admin form always sends a full product.
 */
export function parseProductInput(body: unknown): { ok: true; row: Row } | { ok: false; errors: string[] } {
  const b = (body && typeof body === "object" ? body : {}) as Record<string, unknown>;
  const errors: string[] = [];

  const name = str(b.name, 150);
  if (!name) errors.push("Product name is required.");

  let slug = str(b.slug, 100).toLowerCase();
  slug = slug ? slugify(slug) : slugify(name);
  if (!slug) errors.push("A URL slug could not be created. Enter one manually.");

  const price = b.price === undefined || b.price === null || b.price === "" ? 0 : Number(b.price);
  if (!Number.isFinite(price) || price < 0 || price > 10_000_000) errors.push("Price must be a number between 0 and 10,000,000.");

  let compareAt: number | null = null;
  if (b.compareAtPrice !== null && b.compareAtPrice !== undefined && b.compareAtPrice !== "") {
    compareAt = Number(b.compareAtPrice);
    if (!Number.isFinite(compareAt) || compareAt < 0 || compareAt > 10_000_000) errors.push("Compare-at price must be a valid number.");
  }

  const currency = str(b.currency, 3).toUpperCase() || "INR";
  if (!(CURRENCIES as readonly string[]).includes(currency)) errors.push("Unsupported currency.");

  const stockStatus = str(b.stockStatus, 20) || "in_stock";
  if (!["in_stock", "out_of_stock", "preorder"].includes(stockStatus)) errors.push("Invalid stock status.");

  let stockQuantity: number | null = null;
  if (b.stockQuantity !== null && b.stockQuantity !== undefined && b.stockQuantity !== "") {
    stockQuantity = Number(b.stockQuantity);
    if (!Number.isInteger(stockQuantity) || stockQuantity < 0 || stockQuantity > 1_000_000) errors.push("Stock quantity must be a whole number.");
  }

  const status = str(b.status, 20) || "draft";
  if (!["draft", "published", "archived"].includes(status)) errors.push("Invalid status.");

  const buyUrl = str(b.buyUrl, 600);
  if (buyUrl && !isHttpUrl(buyUrl)) errors.push("Buy link must start with http:// or https://");

  const canonicalUrl = str(b.canonicalUrl, 600);
  if (canonicalUrl && !isHttpUrl(canonicalUrl)) errors.push("Canonical URL must start with http:// or https://");

  const ogImage = str(b.ogImage, 600);
  if (ogImage && !isImageUrl(ogImage)) errors.push("Social image must be a valid URL.");

  const images: ProductImage[] = [];
  if (Array.isArray(b.images)) {
    for (const raw of b.images.slice(0, 12)) {
      const it = (raw || {}) as Record<string, unknown>;
      const url = str(it.url, 600);
      if (!url) continue;
      if (!isImageUrl(url)) {
        errors.push("One of the images has an invalid URL.");
        break;
      }
      images.push({ url, alt: str(it.alt, 200) });
    }
  }

  const tags = Array.isArray(b.tags)
    ? Array.from(new Set(b.tags.map((t) => str(t, 40)).filter(Boolean))).slice(0, 20)
    : [];
  const highlights = Array.isArray(b.highlights) ? b.highlights.map((h) => str(h, 200)).filter(Boolean).slice(0, 12) : [];
  const specs: ProductSpec[] = Array.isArray(b.specs)
    ? b.specs
        .map((s) => {
          const it = (s || {}) as Record<string, unknown>;
          return { label: str(it.label, 60), value: str(it.value, 200) };
        })
        .filter((s) => s.label && s.value)
        .slice(0, 20)
    : [];

  if (errors.length) return { ok: false, errors };

  return {
    ok: true,
    row: {
      slug,
      name,
      short_description: str(b.shortDescription, 400),
      description: sanitizeHtml(typeof b.description === "string" ? b.description.slice(0, 60_000) : ""),
      price,
      compare_at_price: compareAt,
      currency,
      sku: str(b.sku, 80),
      stock_status: stockStatus,
      stock_quantity: stockQuantity,
      category: str(b.category, 80),
      tags,
      images,
      highlights,
      specs,
      buy_url: buyUrl,
      status,
      featured: !!b.featured,
      sort_order: Number.isFinite(Number(b.sortOrder)) ? Math.trunc(Number(b.sortOrder)) : 0,
      meta_title: str(b.metaTitle, 120),
      meta_description: str(b.metaDescription, 320),
      focus_keyword: str(b.focusKeyword, 80),
      canonical_url: canonicalUrl,
      og_image: ogImage,
      noindex: !!b.noindex,
    },
  };
}
