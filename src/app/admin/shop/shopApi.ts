import type { ShopProduct } from "@/lib/shopShared";

const TOKEN_KEY = "divingsanatan_admin_token";

export class ApiError extends Error {
  status: number;
  code?: string;
  constructor(message: string, status: number, code?: string) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

export const getAdminToken = (): string => {
  try {
    return window.sessionStorage.getItem(TOKEN_KEY) || "";
  } catch {
    return "";
  }
};

async function call<T>(url: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers);
  headers.set("Authorization", `Bearer ${getAdminToken()}`);
  if (init.body && !(init.body instanceof FormData)) headers.set("Content-Type", "application/json");

  const res = await fetch(url, { ...init, headers });
  const json = await res.json().catch(() => ({}));
  if (!res.ok || !json.success) {
    throw new ApiError(json.error || `Request failed (${res.status})`, res.status, json.code);
  }
  return json as T;
}

export const listProducts = () =>
  call<{ data: ShopProduct[] }>("/api/shop/admin/products").then((r) => r.data);

export const createProduct = (p: ShopProduct) =>
  call<{ data: ShopProduct }>("/api/shop/admin/products", { method: "POST", body: JSON.stringify(p) }).then((r) => r.data);

export const updateProduct = (p: ShopProduct) =>
  call<{ data: ShopProduct; redirectCreated?: boolean }>(`/api/shop/admin/products/${p.id}`, {
    method: "PUT",
    body: JSON.stringify(p),
  });

export const deleteProduct = (id: string) =>
  call<{ success: true }>(`/api/shop/admin/products/${id}`, { method: "DELETE" });

export async function uploadImage(file: File): Promise<string> {
  const form = new FormData();
  form.append("file", file);
  const r = await call<{ url: string }>("/api/shop/admin/upload", { method: "POST", body: form });
  return r.url;
}

/**
 * Shrinks big photos in the browser before upload (max 1600px, WebP).
 * Smaller images make product pages load faster, which helps SEO and sales.
 */
export async function compressImage(file: File, maxSide = 1600): Promise<File> {
  if (!file.type.startsWith("image/") || file.type === "image/gif") return file;
  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height));
    if (scale === 1 && file.size < 400 * 1024) return file;

    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    const ctx = canvas.getContext("2d");
    if (!ctx) return file;
    ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);

    const blob: Blob | null = await new Promise((resolve) => canvas.toBlob(resolve, "image/webp", 0.85));
    if (!blob || blob.size >= file.size) return file;
    return new File([blob], file.name.replace(/\.[^.]+$/, "") + ".webp", { type: "image/webp" });
  } catch {
    return file;
  }
}

export function blankProduct(): ShopProduct {
  return {
    id: "",
    slug: "",
    name: "",
    shortDescription: "",
    description: "",
    price: 0,
    compareAtPrice: null,
    currency: "INR",
    sku: "",
    stockStatus: "in_stock",
    stockQuantity: null,
    category: "",
    tags: [],
    images: [],
    highlights: [],
    specs: [],
    buyUrl: "",
    status: "draft",
    featured: false,
    sortOrder: 0,
    metaTitle: "",
    metaDescription: "",
    focusKeyword: "",
    canonicalUrl: "",
    ogImage: "",
    noindex: false,
    createdAt: "",
    updatedAt: "",
  };
}
