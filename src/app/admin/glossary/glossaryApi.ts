import type { GlossaryEntry } from "@/lib/glossaryShared";
import { slugifyTerm } from "@/lib/glossaryShared";

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

async function call<T>(url: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers);
  if (init.body && !(init.body instanceof FormData)) headers.set("Content-Type", "application/json");
  const res = await fetch(url, { ...init, headers, credentials: "same-origin" });
  const json = await res.json().catch(() => ({}));
  if (!res.ok || !json.success) throw new ApiError(json.error || `Request failed (${res.status})`, res.status);
  return json as T;
}

/** Is a staff member signed in? The glossary can be read publicly, so this is checked separately. */
export async function checkStaffSession(): Promise<{ ok: boolean; message: string }> {
  try {
    const res = await fetch("/api/auth/me", { credentials: "same-origin" });
    if (!res.ok) return { ok: false, message: "Your admin session has expired. Please sign in again to edit the glossary." };
    const j = await res.json();
    return ["super_admin", "admin", "subadmin"].includes(j?.data?.role)
      ? { ok: true, message: "" }
      : { ok: false, message: "Only administrators can edit the glossary." };
  } catch {
    return { ok: true, message: "" }; // network hiccup: the API still enforces permissions
  }
}

export const listTerms = () => call<{ data: GlossaryEntry[] }>("/api/glossary?all=1").then((r) => r.data);
export const createTerm = (t: GlossaryEntry) => call<{ data: GlossaryEntry }>("/api/glossary", { method: "POST", body: JSON.stringify(t) }).then((r) => r.data);
export const updateTerm = (t: GlossaryEntry) =>
  call<{ data: GlossaryEntry; redirectCreated?: boolean }>("/api/glossary", { method: "PUT", body: JSON.stringify(t) });
export const deleteTerm = (id: string) => call<{ success: true }>(`/api/glossary?id=${encodeURIComponent(id)}`, { method: "DELETE" });
export const fillBlanks = () => call<{ updated: number; total: number }>("/api/glossary/bulk-seo", { method: "POST", body: "{}" });

export interface CategoryRow {
  id: string;
  name: string;
}
export const listCategories = () => call<{ data: CategoryRow[] }>("/api/glossary/categories").then((r) => r.data);
export const addCategory = (name: string) => call<{ data: CategoryRow }>("/api/glossary/categories", { method: "POST", body: JSON.stringify({ name }) });
export const renameCategory = (id: string, name: string) =>
  call<{ data: CategoryRow }>("/api/glossary/categories", { method: "PUT", body: JSON.stringify({ id, name }) });
export const removeCategory = (id: string) => call<{ success: true }>(`/api/glossary/categories?id=${encodeURIComponent(id)}`, { method: "DELETE" });

export async function uploadImage(file: File): Promise<string> {
  const form = new FormData();
  form.append("file", file);
  const r = await call<{ url: string }>("/api/upload", { method: "POST", body: form });
  return r.url;
}

export function blankTerm(): GlossaryEntry {
  return {
    id: "", slug: "", word: "", phonetic: "", category: "", definition: "", illustration: null, imageAlt: "",
    status: "draft", shortAnswer: "", extendedContent: "", origin: "", alternateNames: [], keyTakeaways: [],
    faqs: [], sources: [], sameAs: [], relatedTerms: [], reviewedBy: "", lastReviewed: null, metaTitle: "",
    metaDescription: "", focusKeyword: "", secondaryKeywords: [], canonicalUrl: "", ogImage: "", noindex: false,
    createdAt: "", updatedAt: "",
  };
}

export { slugifyTerm };
