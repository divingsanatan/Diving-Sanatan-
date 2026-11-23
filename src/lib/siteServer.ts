/* eslint-disable @typescript-eslint/no-explicit-any */
import { supabaseServer } from "@/utils/supabaseServer";
import type { Practitioner, Service } from "@/types/database";
import { SITE_NAME, SITE_URL } from "./shopShared";

/* Server-side reads for services, practitioners and reviews, so these pages arrive complete in the HTML
   (search engines and AI crawlers that do not run JavaScript can read them). Same shapes as the public APIs. */

export interface ReviewItem {
  id: string;
  serviceId: string;
  serviceName: string;
  practitionerId: string;
  practitionerName: string;
  clientName: string;
  rating: number;
  comment: string;
  date: string;
}

const arr = (v: unknown): string[] => (Array.isArray(v) ? v.map((x) => String(x ?? "").trim()).filter(Boolean) : []);

export function mapService(s: any): Service {
  return {
    id: s.id,
    name: s.name,
    price: Number(s.price) || 0,
    duration: s.duration || "",
    rating: Number(s.rating) || 0,
    practitioner: s.practitioner || "",
    category: s.category || "",
    image: s.image || "",
    description: s.description || "",
    video_url: s.video_url || "",
    benefits: arr(s.benefits),
    process: arr(s.process),
    approval_status: s.approval_status || "published",
  };
}

export function mapPractitioner(p: any): Practitioner {
  return {
    id: p.id,
    name: p.name,
    specialty: p.specialty || "",
    bio: p.bio || "",
    rating: Number(p.rating) || 0,
    reviewsCount: Number(p.reviews_count) || 0,
    image: p.image || "",
    video_url: p.video_url || "",
    certifications: arr(p.certifications),
    expertise: arr(p.expertise),
    social_links: p.social_links || {},
    approval_status: p.approval_status || "published",
  };
}

export function mapReview(r: any): ReviewItem {
  return {
    id: r.id,
    serviceId: r.service_id || "",
    serviceName: r.service_name || "",
    practitionerId: r.practitioner_id || "",
    practitionerName: r.practitioner_name || "",
    clientName: r.client_name || "",
    rating: Number(r.rating) || 0,
    comment: r.comment || "",
    date: r.date || r.created_at || "",
  };
}

export async function getPublishedServices(): Promise<Service[]> {
  try {
    const { data, error } = await supabaseServer.from("services").select("*").eq("approval_status", "published").order("name", { ascending: true });
    if (error) return [];
    return (data || []).map(mapService);
  } catch {
    return [];
  }
}

export async function getServiceById(id: string): Promise<Service | null> {
  try {
    const { data } = await supabaseServer.from("services").select("*").eq("id", id).eq("approval_status", "published").maybeSingle();
    return data ? mapService(data) : null;
  } catch {
    return null;
  }
}

export async function getPublishedPractitioners(): Promise<Practitioner[]> {
  try {
    const { data, error } = await supabaseServer.from("practitioners").select("*").eq("approval_status", "published").order("name", { ascending: true });
    if (error) return [];
    return (data || []).map(mapPractitioner);
  } catch {
    return [];
  }
}

export async function getPractitionerById(id: string): Promise<Practitioner | null> {
  try {
    const { data } = await supabaseServer.from("practitioners").select("*").eq("id", id).eq("approval_status", "published").maybeSingle();
    return data ? mapPractitioner(data) : null;
  } catch {
    return null;
  }
}

export async function getAllReviews(): Promise<ReviewItem[]> {
  try {
    const { data, error } = await supabaseServer.from("reviews").select("*").order("date", { ascending: false }).limit(500);
    if (error) return [];
    return (data || []).map(mapReview);
  } catch {
    return [];
  }
}

/* ------------------------------- helpers ------------------------------- */

const FALLBACK_SERVICE_IMAGE = "/images/service_chakra_healing.png";

/** Some old records store a keyword like "aura_balancing" instead of a picture. Those get the default picture. */
export function serviceImagePath(image: string): string {
  return image && (image.startsWith("http") || image.startsWith("/")) ? image : FALLBACK_SERVICE_IMAGE;
}
export const absoluteUrl = (path: string) => (/^https?:\/\//i.test(path) ? path : `${SITE_URL}${path.startsWith("/") ? path : `/${path}`}`);

export const servicePath = (id: string) => `/services/${id}`;
export const serviceUrl = (id: string) => `${SITE_URL}${servicePath(id)}`;
export const guruPath = (id: string) => `/gurus/${id}`;
export const guruUrl = (id: string) => `${SITE_URL}${guruPath(id)}`;

export function ratingSummary(reviews: ReviewItem[]): { count: number; average: number } | null {
  const rated = reviews.filter((r) => r.rating >= 1 && r.rating <= 5);
  if (!rated.length) return null;
  const average = Math.round((rated.reduce((s, r) => s + r.rating, 0) / rated.length) * 10) / 10;
  return { count: rated.length, average };
}

const ORG = { "@type": "Organization", name: SITE_NAME, url: SITE_URL };
const first = (name: string) => name.trim().split(/\s+/)[0] || "Client";

/**
 * Service markup. Ratings come only from real review rows that are shown on the page.
 * The rating column on the services table is not used: it is not backed by visible reviews.
 */
export function serviceJsonLd(s: Service, reviews: ReviewItem[]) {
  const url = serviceUrl(s.id);
  const sum = ratingSummary(reviews);
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Service",
        "@id": `${url}#service`,
        name: s.name,
        description: s.description,
        url,
        ...(s.category ? { serviceType: s.category } : {}),
        image: absoluteUrl(serviceImagePath(s.image)),
        provider: ORG,
        offers: {
          "@type": "Offer",
          url: `${SITE_URL}/booking?service=${encodeURIComponent(s.id)}`,
          price: s.price,
          priceCurrency: "INR",
          availability: "https://schema.org/InStock",
        },
        ...(sum ? { aggregateRating: { "@type": "AggregateRating", ratingValue: sum.average, reviewCount: sum.count, bestRating: 5, worstRating: 1 } } : {}),
        ...(reviews.length
          ? { review: reviews.slice(0, 10).map((r) => ({ "@type": "Review", author: { "@type": "Person", name: first(r.clientName) }, reviewRating: { "@type": "Rating", ratingValue: r.rating, bestRating: 5, worstRating: 1 }, reviewBody: r.comment, ...(r.date ? { datePublished: new Date(r.date).toISOString().slice(0, 10) } : {}) })) }
          : {}),
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
          { "@type": "ListItem", position: 2, name: "Services", item: `${SITE_URL}/services` },
          { "@type": "ListItem", position: 3, name: s.name, item: url },
        ],
      },
    ],
  };
}

export function servicesListJsonLd(services: Service[]) {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: `${SITE_NAME} healing services`,
    itemListElement: services.map((s, n) => ({ "@type": "ListItem", position: n + 1, url: serviceUrl(s.id), name: s.name })),
  };
}

/** Practitioner profile markup. */
export function guruJsonLd(p: Practitioner) {
  const url = guruUrl(p.id);
  const sameAs = Object.values(p.social_links || {}).filter((u): u is string => typeof u === "string" && /^https?:\/\//i.test(u));
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Person",
        "@id": `${url}#person`,
        name: p.name,
        url,
        jobTitle: p.specialty,
        description: p.bio.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim().slice(0, 500),
        ...(p.image && (p.image.startsWith("http") || p.image.startsWith("/")) ? { image: absoluteUrl(p.image) } : {}),
        ...(p.expertise?.length ? { knowsAbout: p.expertise } : {}),
        ...(sameAs.length ? { sameAs } : {}),
        worksFor: ORG,
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
          { "@type": "ListItem", position: 2, name: "Our gurus", item: `${SITE_URL}/gurus` },
          { "@type": "ListItem", position: 3, name: p.name, item: url },
        ],
      },
    ],
  };
}
