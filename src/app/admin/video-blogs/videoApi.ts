import type { VideoPost } from "@/lib/videoShared";

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

/** Is a staff member signed in? The server enforces permissions; this only decides what to show. */
export async function checkStaffSession(): Promise<{ ok: boolean; message: string }> {
  try {
    const res = await fetch("/api/auth/me", { credentials: "same-origin" });
    if (!res.ok) return { ok: false, message: "Your admin session has expired. Please sign in again to edit videos." };
    const j = await res.json();
    return STAFF_ROLES.includes(j?.data?.role) ? { ok: true, message: "" } : { ok: false, message: "Only administrators can edit videos." };
  } catch {
    return { ok: true, message: "" }; // network hiccup: the API still enforces permissions
  }
}

export interface ImportReport {
  imported: { title: string; slug: string; status: string }[];
  skipped: { title: string; reason: string }[];
  redirects: boolean;
}

export const listVideos = () => call<{ data: VideoPost[] }>("/api/videos?all=1").then((r) => r.data);
export const createVideo = (v: VideoPost) => call<{ data: VideoPost }>("/api/videos", { method: "POST", body: JSON.stringify(v) }).then((r) => r.data);
export const updateVideo = (v: Partial<VideoPost> & { id: string }) =>
  call<{ data: VideoPost; redirectCreated?: boolean }>("/api/videos", { method: "PUT", body: JSON.stringify(v) });
export const deleteVideo = (id: string) => call<{ success: true }>(`/api/videos?id=${encodeURIComponent(id)}`, { method: "DELETE" });
export const fillBlanks = () => call<{ updated: number; total: number }>("/api/videos/bulk-seo", { method: "POST", body: "{}" });
export const importFromBlogs = (redirects: boolean) =>
  call<ImportReport>("/api/videos/import", { method: "POST", body: JSON.stringify({ redirects }) });

export function blankVideo(): VideoPost {
  return {
    id: "", slug: "", title: "", description: "", format: "vertical", youtubeId: "", thumbnailUrl: "", durationSeconds: null, uploadDate: new Date().toISOString().slice(0, 10),
    category: "", authorName: "", authorCredentials: "", transcript: "", content: "", shortAnswer: "", keyTakeaways: [], alternateQuestions: [], sources: [], sameAs: [],
    relatedVideos: [], reviewedBy: "", lastReviewed: null, metaTitle: "", metaDescription: "", focusKeyword: "", secondaryKeywords: [], canonicalUrl: "", ogImage: "",
    noindex: false, featured: false, status: "draft", sourceBlogId: "", publishedAt: null, createdAt: "", updatedAt: "",
  };
}
