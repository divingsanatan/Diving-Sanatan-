import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { formatCurrency } from "@/utils/formatters";
import { jsonLdString } from "@/lib/shopServer";
import { SITE_NAME, truncate } from "@/lib/shopShared";
import {
  absoluteUrl,
  getAllReviews,
  getPractitionerById,
  getPublishedPractitioners,
  getPublishedServices,
  getServiceById,
  guruPath,
  ratingSummary,
  serviceImagePath,
  serviceJsonLd,
  servicePath,
  serviceUrl,
} from "@/lib/siteServer";
import styles from "./service.module.css";

// Built on the server so the full page is in the HTML for search engines and AI crawlers. Refreshed every 5 minutes.
export const revalidate = 300;
export const dynamicParams = true;

type Props = { params: Promise<{ id: string }> };

export async function generateStaticParams() {
  const all = await getPublishedServices();
  return all.map((s) => ({ id: s.id }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const s = await getServiceById(id);
  if (!s) return { title: { absolute: `Service not found | ${SITE_NAME}` }, robots: { index: false, follow: false } };
  const title = `${s.name}${s.category ? `: ${s.category} session` : ""} | ${SITE_NAME}`;
  const description = truncate(s.description || `${s.name} with ${SITE_NAME}.`, 155);
  const image = absoluteUrl(serviceImagePath(s.image));
  return {
    title: { absolute: truncate(title, 70) },
    description,
    alternates: { canonical: serviceUrl(s.id) },
    robots: { index: true, follow: true },
    openGraph: { type: "website", title: s.name, description, url: serviceUrl(s.id), siteName: SITE_NAME, images: [{ url: image, alt: s.name }] },
    twitter: { card: "summary_large_image", title: s.name, description, images: [image] },
  };
}

export default async function ServicePage({ params }: Props) {
  const { id } = await params;
  const service = await getServiceById(id);
  if (!service) notFound();

  const [allServices, allReviews, practitioners] = await Promise.all([getPublishedServices(), getAllReviews(), getPublishedPractitioners()]);
  const reviews = allReviews.filter((r) => r.serviceId === service.id);
  const summary = ratingSummary(reviews);
  const guide = practitioners.find((p) => p.name.trim().toLowerCase() === service.practitioner.trim().toLowerCase()) || (await getPractitionerById(service.practitioner));
  const related = allServices.filter((x) => x.id !== service.id && x.category && x.category === service.category).slice(0, 3);
  const more = related.length ? related : allServices.filter((x) => x.id !== service.id).slice(0, 3);
  const paragraphs = service.description.split(/\n{1,}/).map((t) => t.trim()).filter(Boolean);

  return (
    <div className="page-shell">
      <Header />
      <main className={styles.main}>
        <nav className={styles.crumbs} aria-label="Breadcrumb">
          <Link href="/">Home</Link><span aria-hidden="true">/</span>
          <Link href="/services">Services</Link><span aria-hidden="true">/</span>
          <span aria-current="page">{service.name}</span>
        </nav>

        <header className={styles.hero}>
          <div>
            {service.category && <span className={styles.kind}>{service.category}</span>}
            <h1 className={styles.h1}>{service.name}</h1>
            {paragraphs[0] && <p className={styles.lead}>{paragraphs[0]}</p>}
            <ul className={styles.facts}>
              {service.duration && <li><strong>Duration:</strong> {service.duration}</li>}
              <li><strong>Price:</strong> {formatCurrency(service.price)}</li>
              {guide ? (
                <li><strong>Guided by:</strong> <Link href={guruPath(guide.id)}>{guide.name}</Link></li>
              ) : service.practitioner ? (
                <li><strong>Guided by:</strong> {service.practitioner}</li>
              ) : null}
              {summary && <li><strong>Client rating:</strong> {summary.average} out of 5 ({summary.count} {summary.count === 1 ? "review" : "reviews"})</li>}
            </ul>
            <Link href={`/booking?service=${encodeURIComponent(service.id)}`} className={styles.cta}>Book this session</Link>
          </div>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={serviceImagePath(service.image)} alt={`${service.name} session`} className={styles.picture} width={640} height={480} />
        </header>

        {paragraphs.length > 1 && (
          <section className={styles.section} aria-labelledby="about">
            <h2 id="about" className={styles.h2}>About this session</h2>
            <div className={styles.prose}>{paragraphs.slice(1).map((t, i) => (<p key={i}>{t}</p>))}</div>
          </section>
        )}

        {service.benefits && service.benefits.length > 0 && (
          <section className={styles.section} aria-labelledby="benefits">
            <h2 id="benefits" className={styles.h2}>What you may gain</h2>
            <ul className={styles.list}>{service.benefits.map((b, i) => (<li key={i}>{b}</li>))}</ul>
          </section>
        )}

        {service.process && service.process.length > 0 && (
          <section className={styles.section} aria-labelledby="process">
            <h2 id="process" className={styles.h2}>How the session works</h2>
            <ol className={styles.list}>{service.process.map((b, i) => (<li key={i}>{b}</li>))}</ol>
          </section>
        )}

        {reviews.length > 0 && (
          <section className={styles.section} aria-labelledby="reviews">
            <h2 id="reviews" className={styles.h2}>What clients say</h2>
            <ul className={styles.reviews}>
              {reviews.slice(0, 10).map((r) => (
                <li key={r.id} className={styles.review}>
                  <span className={styles.stars} aria-label={`${r.rating} out of 5`}>{"★".repeat(Math.max(0, Math.min(5, r.rating)))}</span>
                  <p className={styles.reviewText}>{r.comment}</p>
                  <span className={styles.reviewBy}>{r.clientName.trim().split(/\s+/)[0] || "Client"}</span>
                </li>
              ))}
            </ul>
          </section>
        )}

        <p className={styles.note}>These sessions are for spiritual and emotional wellbeing. They complement, and do not replace, care from a doctor or a qualified mental health professional.</p>

        {more.length > 0 && (
          <section className={styles.section} aria-labelledby="more">
            <h2 id="more" className={styles.h2}>{related.length ? "Related sessions" : "More sessions"}</h2>
            <div className={styles.grid}>
              {more.map((x) => (
                <Link key={x.id} href={servicePath(x.id)} className={styles.card}>
                  <span className={styles.cardName}>{x.name}</span>
                  <span className={styles.cardMeta}>{[x.duration, formatCurrency(x.price)].filter(Boolean).join(" · ")}</span>
                  <p className={styles.cardText}>{x.description}</p>
                </Link>
              ))}
            </div>
            <p className={styles.note} style={{ marginTop: 16 }}><Link href="/services">See all services</Link></p>
          </section>
        )}

        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdString(serviceJsonLd(service, reviews)) }} />
      </main>
      <Footer />
    </div>
  );
}
