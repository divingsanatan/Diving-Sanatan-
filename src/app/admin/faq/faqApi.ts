import type { FaqEntry } from "@/lib/faqShared";
import { slugifyQuestion } from "@/lib/faqShared";

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
  const res = await fetch(url, { ...init, headers, credentials: "same-origin", cache: "no-store" });
  const json = await res.json().catch(() => ({}));
  if (!res.ok || !json.success) throw new ApiError(json.error || `Request failed (${res.status})`, res.status);
  return json as T;
}

/** Is a staff member signed in? FAQs can be read publicly, so this is checked separately. */
export async function checkStaffSession(): Promise<{ ok: boolean; message: string }> {
  try {
    const res = await fetch("/api/auth/me", { credentials: "same-origin" });
    if (!res.ok) return { ok: false, message: "Your admin session has expired. Please sign in again to edit FAQs." };
    const j = await res.json();
    return ["super_admin", "admin", "subadmin"].includes(j?.data?.role)
      ? { ok: true, message: "" }
      : { ok: false, message: "Only administrators can edit FAQs." };
  } catch {
    return { ok: true, message: "" }; // network hiccup: the API still enforces permissions
  }
}

export const listFaqs = () => call<{ data: FaqEntry[] }>("/api/faq?all=1").then((r) => r.data);
export const createFaq = (f: FaqEntry) => call<{ data: FaqEntry }>("/api/faq", { method: "POST", body: JSON.stringify(f) }).then((r) => r.data);
export const updateFaq = (f: FaqEntry) =>
  call<{ data: FaqEntry; redirectCreated?: boolean }>("/api/faq", { method: "PUT", body: JSON.stringify(f) });
export const deleteFaq = (id: string) => call<{ success: true }>(`/api/faq?id=${encodeURIComponent(id)}`, { method: "DELETE" });
export const fillBlanks = () => call<{ updated: number; total: number }>("/api/faq/bulk-seo", { method: "POST", body: "{}" });

export function blankFaq(): FaqEntry {
  return {
    id: "", slug: "", question: "", answer: "", status: "draft", verified: true, isPublished: false,
    shortAnswer: "", extendedContent: "", alternateQuestions: [], keyTakeaways: [], sources: [], sameAs: [],
    relatedFaqs: [], reviewedBy: "", lastReviewed: null, metaTitle: "", metaDescription: "", focusKeyword: "",
    secondaryKeywords: [], canonicalUrl: "", ogImage: "", noindex: false, createdAt: "", updatedAt: "",
  };
}

export { slugifyQuestion };
