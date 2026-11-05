/**
 * Shop helpers that are safe to import from BOTH server and client code
 * (no database access in here).
 */

export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "https://divingsanatan.online").replace(/\/+$/, "");
export const SITE_NAME = "Diving Sanatan";

export type StockStatus = "in_stock" | "out_of_stock" | "preorder";
export type ProductStatus = "draft" | "published" | "archived";

export interface ProductImage {
  url: string;
  alt: string;
}
export interface ProductSpec {
  label: string;
  value: string;
}

export interface ShopProduct {
  id: string;
  slug: string;
  name: string;
  shortDescription: string;
  description: string;
  price: number;
  compareAtPrice: number | null;
  currency: string;
  sku: string;
  stockStatus: StockStatus;
  stockQuantity: number | null;
  category: string;
  tags: string[];
  images: ProductImage[];
  highlights: string[];
  specs: ProductSpec[];
  buyUrl: string;
  status: ProductStatus;
  featured: boolean;
  sortOrder: number;
  metaTitle: string;
  metaDescription: string;
  focusKeyword: string;
  canonicalUrl: string;
  ogImage: string;
  noindex: boolean;
  createdAt: string;
  updatedAt: string;
}

export const CURRENCIES = ["INR", "USD", "EUR", "GBP"] as const;

/** Database row (snake_case) -> app object (camelCase). */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function mapProductRow(r: any): ShopProduct {
  const arr = <T,>(v: unknown): T[] => (Array.isArray(v) ? (v as T[]) : []);
  return {
    id: r.id,
    slug: r.slug,
    name: r.name ?? "",
    shortDescription: r.short_description ?? "",
    description: r.description ?? "",
    price: Number(r.price ?? 0),
    compareAtPrice: r.compare_at_price === null || r.compare_at_price === undefined ? null : Number(r.compare_at_price),
    currency: r.currency || "INR",
    sku: r.sku ?? "",
    stockStatus: (r.stock_status as StockStatus) || "in_stock",
    stockQuantity: r.stock_quantity === null || r.stock_quantity === undefined ? null : Number(r.stock_quantity),
    category: r.category ?? "",
    tags: arr<string>(r.tags),
    images: arr<ProductImage>(r.images).filter((i) => i && typeof i.url === "string"),
    highlights: arr<string>(r.highlights),
    specs: arr<ProductSpec>(r.specs),
    buyUrl: r.buy_url ?? "",
    status: (r.status as ProductStatus) || "draft",
    featured: !!r.featured,
    sortOrder: Number(r.sort_order ?? 0),
    metaTitle: r.meta_title ?? "",
    metaDescription: r.meta_description ?? "",
    focusKeyword: r.focus_keyword ?? "",
    canonicalUrl: r.canonical_url ?? "",
    ogImage: r.og_image ?? "",
    noindex: !!r.noindex,
    createdAt: r.created_at ?? "",
    updatedAt: r.updated_at ?? "",
  };
}

export function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 90)
    .replace(/-+$/g, "");
}

export function formatPrice(amount: number, currency = "INR"): string {
  try {
    return new Intl.NumberFormat(currency === "INR" ? "en-IN" : "en-US", {
      style: "currency",
      currency,
      maximumFractionDigits: amount % 1 === 0 ? 0 : 2,
    }).format(amount);
  } catch {
    return `${currency} ${amount}`;
  }
}

export function discountPercent(price: number, compareAt: number | null): number {
  if (!compareAt || compareAt <= price || price < 0) return 0;
  return Math.round(((compareAt - price) / compareAt) * 100);
}

export function stripHtml(html: string): string {
  return (html || "")
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

export function wordCount(text: string): number {
  const t = stripHtml(text);
  return t ? t.split(" ").length : 0;
}

export function truncate(text: string, max: number): string {
  const t = text.trim();
  if (t.length <= max) return t;
  const cut = t.slice(0, max - 1);
  const lastSpace = cut.lastIndexOf(" ");
  return `${(lastSpace > max * 0.6 ? cut.slice(0, lastSpace) : cut).trim()}…`;
}

export const productPath = (slug: string) => `/shop/${slug}`;
export const productUrl = (slug: string) => `${SITE_URL}${productPath(slug)}`;

/** What Google will most likely show as the page title. */
export function effectiveTitle(p: Pick<ShopProduct, "metaTitle" | "name">): string {
  return p.metaTitle.trim() || `${p.name} | ${SITE_NAME}`;
}
export function effectiveDescription(p: Pick<ShopProduct, "metaDescription" | "shortDescription" | "description">): string {
  return (
    p.metaDescription.trim() ||
    truncate(p.shortDescription.trim() || stripHtml(p.description), 155)
  );
}

export interface SeoCheck {
  id: string;
  label: string;
  pass: boolean;
  weight: number;
  hint: string;
}

/** Simple, explainable on-page SEO score (0-100) used by the admin panel. */
export function seoChecks(p: ShopProduct): { score: number; checks: SeoCheck[] } {
  const kw = p.focusKeyword.trim().toLowerCase();
  const title = effectiveTitle(p);
  const desc = effectiveDescription(p);
  const bodyText = stripHtml(p.description);
  const first100 = bodyText.split(" ").slice(0, 100).join(" ").toLowerCase();
  const has = (s: string) => !!kw && s.toLowerCase().includes(kw);
  const kwSlug = kw.replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");

  const checks: SeoCheck[] = [
    {
      id: "title",
      label: "Page title is 30–60 characters",
      pass: p.metaTitle.trim().length >= 30 && p.metaTitle.trim().length <= 60,
      weight: 12,
      hint: p.metaTitle.trim() ? `Currently ${p.metaTitle.trim().length} characters.` : "Write a custom SEO title so it isn't left to chance.",
    },
    {
      id: "desc",
      label: "Meta description is 70–160 characters",
      pass: p.metaDescription.trim().length >= 70 && p.metaDescription.trim().length <= 160,
      weight: 12,
      hint: p.metaDescription.trim() ? `Currently ${p.metaDescription.trim().length} characters.` : "Add a compelling summary that makes people click.",
    },
    { id: "kw", label: "Focus keyword is set", pass: !!kw, weight: 8, hint: "The main phrase you want this product to rank for." },
    { id: "kwTitle", label: "Focus keyword is in the title", pass: has(title), weight: 10, hint: "Put the keyword near the start of the title." },
    { id: "kwDesc", label: "Focus keyword is in the meta description", pass: has(desc), weight: 8, hint: "Use it naturally once." },
    { id: "kwSlug", label: "Focus keyword is in the URL", pass: !!kwSlug && p.slug.includes(kwSlug), weight: 5, hint: "Short, keyword-rich URLs rank and read better." },
    { id: "kwBody", label: "Focus keyword appears early in the description", pass: has(first100), weight: 5, hint: "Mention it within the first 100 words." },
    { id: "img", label: "Has at least one product image", pass: p.images.length > 0, weight: 10, hint: "Products with images get far more clicks." },
    { id: "alt", label: "Every image has alt text", pass: p.images.length > 0 && p.images.every((i) => i.alt.trim().length > 0), weight: 10, hint: "Describe each image; it helps image search and accessibility." },
    { id: "len", label: "Description has 150+ words", pass: wordCount(p.description) >= 150, weight: 10, hint: `Currently ${wordCount(p.description)} words. Thin pages rank poorly.` },
    { id: "slugLen", label: "URL is short and clean (≤ 60 characters)", pass: p.slug.length > 0 && p.slug.length <= 60, weight: 5, hint: "Remove filler words from the URL." },
    { id: "price", label: "Price is set (enables rich results)", pass: p.price > 0, weight: 5, hint: "Google shows price in results only if one is provided." },
  ];

  const score = checks.reduce((sum, c) => sum + (c.pass ? c.weight : 0), 0);
  return { score, checks };
}
