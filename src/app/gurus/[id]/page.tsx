import type { Metadata } from "next";
import GuruDetailPage from "./GuruProfileClient";
import { jsonLdString } from "@/lib/shopServer";
import { SITE_NAME, truncate } from "@/lib/shopShared";
import { absoluteUrl, getAllReviews, getPractitionerById, getPublishedPractitioners, getPublishedServices, guruJsonLd, guruUrl } from "@/lib/siteServer";

// Built on the server so the profile is in the HTML for search engines and AI crawlers. Refreshed every 5 minutes.
export const revalidate = 300;
export const dynamicParams = true;

type Props = { params: Promise<{ id: string }> };

export async function generateStaticParams() {
  const all = await getPublishedPractitioners();
  return all.map((p) => ({ id: p.id }));
}

const plain = (html: string) => html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const p = await getPractitionerById(id);
  // Unpublished profiles stay out of search. Staff can still open them with ?preview=true.
  if (!p) return { title: { absolute: `Guru profile | ${SITE_NAME}` }, robots: { index: false, follow: false } };
  const title = truncate(`${p.name}${p.specialty ? `: ${p.specialty}` : ""} | ${SITE_NAME}`, 70);
  const description = truncate(plain(p.bio) || `${p.name} is a practitioner at ${SITE_NAME}.`, 155);
  const img = p.image && (p.image.startsWith("http") || p.image.startsWith("/")) ? [{ url: absoluteUrl(p.image), alt: p.name }] : undefined;
  return {
    title: { absolute: title },
    description,
    alternates: { canonical: guruUrl(p.id) },
    robots: { index: true, follow: true },
    openGraph: { type: "profile", title: p.name, description, url: guruUrl(p.id), siteName: SITE_NAME, images: img },
    twitter: { card: img ? "summary_large_image" : "summary", title: p.name, description, images: img?.map((i) => i.url) },
  };
}

export default async function GuruPage({ params }: Props) {
  const { id } = await params;
  const healer = await getPractitionerById(id);
  // Not found or unpublished: the page still loads for staff previews, but with nothing to index.
  if (!healer) return <GuruDetailPage />;

  const [services, reviews] = await Promise.all([getPublishedServices(), getAllReviews()]);
  const mine = services.filter((s) => s.practitioner.trim().toLowerCase() === healer.name.trim().toLowerCase());
  const myReviews = reviews.filter((r) => r.practitionerId === healer.id || r.practitionerName.trim().toLowerCase() === healer.name.trim().toLowerCase());

  return (
    <>
      <GuruDetailPage initial={{ healer, services: mine, reviews: myReviews }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdString(guruJsonLd(healer)) }} />
    </>
  );
}

