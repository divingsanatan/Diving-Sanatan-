import type { QaComment, QaQuestion, QaStatus } from "@/lib/qaShared";

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

export const STAFF_ROLES = ["super_admin", "admin", "subadmin"];

/** Who is signed in? The server decides what they may do; this only decides what to show. */
export async function whoAmI(): Promise<{ role: string; name: string } | null> {
  try {
    const res = await fetch("/api/auth/me", { credentials: "same-origin", cache: "no-store" });
    if (!res.ok) return null;
    const j = await res.json();
    return j?.success ? { role: j.data.role, name: j.data.name || "" } : null;
  } catch {
    return null;
  }
}

export interface PractitionerOption {
  id: string;
  name: string;
  specialty: string;
  credentials: string;
  image: string;
}

export async function listPractitioners(): Promise<PractitionerOption[]> {
  try {
    const res = await fetch("/api/practitioners", { cache: "no-store" });
    const j = await res.json();
    if (!j?.success || !Array.isArray(j.data)) return [];
    return j.data.map((p: Record<string, unknown>) => {
      const certs = Array.isArray(p.certifications)
        ? (p.certifications as unknown[])
            .map((c) => (typeof c === "string" ? c : (c as Record<string, unknown>)?.name || (c as Record<string, unknown>)?.title || ""))
            .filter(Boolean)
            .slice(0, 2)
            .join(", ")
        : "";
      const img = typeof p.image === "string" && /^(https?:\/\/|\/)/.test(p.image) ? p.image : "";
      return { id: String(p.id), name: String(p.name || ""), specialty: String(p.specialty || ""), credentials: certs, image: img };
    });
  } catch {
    return [];
  }
}

export const listQuestions = () => call<{ data: QaQuestion[] }>("/api/qa/questions?all=1").then((r) => r.data);
export const createQuestion = (q: QaQuestion) =>
  call<{ data: QaQuestion }>("/api/qa/questions", { method: "POST", body: JSON.stringify({ ...q, admin: true }) }).then((r) => r.data);
export const updateQuestion = (q: Partial<QaQuestion> & { id: string }) =>
  call<{ data: QaQuestion; redirectCreated?: boolean }>("/api/qa/questions", { method: "PUT", body: JSON.stringify(q) });
export const setQuestionStatus = (id: string, status: QaStatus, moderationNote?: string) =>
  updateQuestion({ id, status, ...(moderationNote !== undefined ? { moderationNote } : {}) });
export const deleteQuestion = (id: string) => call<{ success: true }>(`/api/qa/questions?id=${encodeURIComponent(id)}`, { method: "DELETE" });
export const fillBlanks = () => call<{ updated: number; total: number }>("/api/qa/questions/bulk-seo", { method: "POST", body: "{}" });

export const listComments = (status: QaStatus) => call<{ data: QaComment[] }>(`/api/qa/comments?all=1&status=${status}`).then((r) => r.data);
export const setCommentStatus = (id: string, status: QaStatus) => call<{ data: QaComment }>("/api/qa/comments", { method: "PUT", body: JSON.stringify({ id, status }) });
export const deleteComment = (id: string) => call<{ success: true }>(`/api/qa/comments?id=${encodeURIComponent(id)}`, { method: "DELETE" });

export function blankQuestion(): QaQuestion {
  return {
    id: "", slug: "", title: "", description: "", category: "", source: "staff", askedByName: "", anonymous: false, status: "published",
    answer: "", shortAnswer: "", answererName: "", answererRole: "", answererCredentials: "", answererImage: "", practitionerId: "", answeredAt: null,
    keyTakeaways: [], sources: [], sameAs: [], relatedQuestions: [], alternateQuestions: [], reviewedBy: "", lastReviewed: null,
    metaTitle: "", metaDescription: "", focusKeyword: "", secondaryKeywords: [], canonicalUrl: "", ogImage: "", noindex: false,
    publishedAt: null, createdAt: "", updatedAt: "", moderationNote: "",
  };
}
