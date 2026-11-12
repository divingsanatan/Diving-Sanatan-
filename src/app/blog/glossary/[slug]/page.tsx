import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getGlossaryBySlug, getPublishedGlossary } from "@/lib/glossaryServer";
import {
  coreWord,
  effectiveCanonical,
  effectiveMetaDescription,
  effectiveMetaTitle,
  effectiveShortAnswer,
  termJsonLd,
  termPath,
  termUrl,
} from "@/lib/glossaryShared";
import { jsonLdString } from "@/lib/shopServer";
import { sanitizeHtml } from "@/utils/sanitizeHtml";
import { normalizeBlogHtml } from "@/utils/normalizeBlogHtml";
import styles from "../glossary.module.css";

export const revalidate = 60;
export const dynamicParams = true;

type Props = { params: Promise<{ slug: string }> };

export async function generateStaticParams() {
  const all = await getPublishedGlossary();
  return all.slice(0, 300).map((e) => ({ slug: e.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const e = await getGlossaryBySlug(slug);
  if (!e) return { title: { absolute: "Term not found | Diving Sanatan" }, robots: { index: false, follow: false } };

  const title = effectiveMetaTitle(e);
  const description = effectiveMetaDescription(e);
  const image = e.ogImage || (e.illustration && /^https?:/.test(e.illustration) ? e.illustration : "");
  return {
    title: { absolute: title },
    description,
    alternates: { canonical: effectiveCanonical(e) },
    robots: e.noindex ? { index: false, follow: true } : { index: true, follow: true },
    keywords: [e.focusKeyword, ...e.secondaryKeywords].filter(Boolean),
    openGraph: {
      type: "article",
      title,
      description,
      url: termUrl(e.slug),
      siteName: "Diving Sanatan",
      images: image ? [{ url: image, alt: e.imageAlt || coreWord(e.word) }] : undefined,
      ...(e.updatedAt ? { modifiedTime: e.updatedAt } : {}),
    },
    twitter: { card: image ? "summary_large_image" : "summary", title, description, images: image ? [image] : undefined },
  };
}

const fmtDate = (d: string) =>
  new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" });

export default async function GlossaryTermPage({ params }: Props) {
  const { slug } = await params;
  const e = await getGlossaryBySlug(slug);
  if (!e) notFound();

  const all = await getPublishedGlossary();
  const bySlug = new Map(all.map((x) => [x.slug, x]));
  let related = e.relatedTerms.map((s) => bySlug.get(s)).filter((x): x is NonNullable<typeof x> => !!x && x.id !== e.id);
  if (related.length === 0) related = all.filter((x) => x.id !== e.id && x.category && x.category === e.category).slice(0, 4);

  const idx = all.findIndex((x) => x.id === e.id);
  const prev = idx > 0 ? all[idx - 1] : null;
  const next = idx >= 0 && idx < all.length - 1 ? all[idx + 1] : null;

  const core = coreWord(e.word);
  const hasImage = !!e.illustration && /^(https?:)?\/\//.test(e.illustration);
  const faqs = e.faqs.filter((f) => f.question && f.answer);
  const takeaways = e.keyTakeaways.filter(Boolean);
  const sources = e.sources.filter((s) => s.url);
  const extended = sanitizeHtml(e.extendedContent);

  return (
    <article className={`${styles.wrap} ${styles.article}`}>
      <nav className={styles.crumbs} aria-label="Breadcrumb">
        <Link href="/">Home</Link><span aria-hidden="true">/</span>
        <Link href="/blog">Blog</Link><span aria-hidden="true">/</span>
        <Link href="/blog/glossary">Glossary</Link><span aria-hidden="true">/</span>
        <span aria-current="page">{core}</span>
      </nav>

      <header>
        {e.category && <span className={styles.badge}>{e.category}</span>}
        <h1 className={styles.h1}>{core}</h1>
        {e.phonetic && <div className={styles.phonetic}>{e.phonetic}</div>}
        {e.alternateNames.length > 0 && (
          <p className={styles.altNames}><strong>Also known as:</strong> {e.alternateNames.join(", ")}</p>
        )}
        {(e.reviewedBy || e.lastReviewed) && (
          <p className={styles.meta}>
            {e.reviewedBy && <>Reviewed by {e.reviewedBy}</>}
            {e.reviewedBy && e.lastReviewed && " · "}
            {e.lastReviewed && <>Last reviewed {fmtDate(e.lastReviewed)}</>}
          </p>
        )}
      </header>

      <section className={`${styles.answer} speakable-answer`} aria-label="Quick answer">
        <p className={styles.answerLabel}>Quick answer</p>
        <p className={styles.answerText}>{effectiveShortAnswer(e)}</p>
      </section>

      {takeaways.length > 0 && (
        <section className={styles.section} aria-labelledby="takeaways">
          <h2 id="takeaways" className={styles.h2}>Key takeaways</h2>
          <ul className={styles.takeaways}>{takeaways.map((t, i) => (<li key={i}>{t}</li>))}</ul>
        </section>
      )}

      <section className={styles.section} aria-labelledby="meaning">
        <h2 id="meaning" className={styles.h2}>What is {core}?</h2>
        {hasImage && (
          <figure className={styles.figure}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={e.illustration as string} alt={e.imageAlt || `${core} illustration`} width={820} height={420} loading="lazy" decoding="async" />
          </figure>
        )}
        <div className={styles.prose} dangerouslySetInnerHTML={{ __html: normalizeBlogHtml(sanitizeHtml(e.definition)) }} />
        {extended && <div className={styles.prose} dangerouslySetInnerHTML={{ __html: extended }} />}
      </section>

      {e.origin && (
        <section className={styles.section} aria-labelledby="origin">
          <h2 id="origin" className={styles.h2}>Origin of the word</h2>
          <p className={styles.prose}>{e.origin}</p>
        </section>
      )}

      {faqs.length > 0 && (
        <section className={`${styles.section} ${styles.faq}`} aria-labelledby="faqs">
          <h2 id="faqs" className={styles.h2}>Frequently asked questions about {core}</h2>
          {faqs.map((f, i) => (
            <details key={i}>
              <summary>{f.question}</summary>
              <div>{f.answer}</div>
            </details>
          ))}
        </section>
      )}

      {related.length > 0 && (
        <section className={styles.section} aria-labelledby="related">
          <h2 id="related" className={styles.h2}>Related terms</h2>
          <div className={styles.relatedGrid}>
            {related.map((r) => (
              <Link key={r.id} href={termPath(r.slug)} className={styles.relatedCard}>
                <span className={styles.relatedName}>{coreWord(r.word)}</span>
                <p className={styles.relatedText}>{effectiveShortAnswer(r)}</p>
              </Link>
            ))}
          </div>
        </section>
      )}

      {sources.length > 0 && (
        <section className={styles.section} aria-labelledby="sources">
          <h2 id="sources" className={styles.h2}>Sources and further reading</h2>
          <ol className={styles.sources}>
            {sources.map((s, i) => (
              <li key={i}><a href={s.url} target="_blank" rel="noopener noreferrer">{s.title}</a></li>
            ))}
          </ol>
        </section>
      )}

      <aside className={styles.cta}>
        <div>
          <h2 className={styles.ctaTitle}>Want to experience {core} guidance?</h2>
          <p className={styles.ctaText}>Our certified practitioners can guide you personally.</p>
        </div>
        <Link href="/explore-services" className={styles.ctaBtn}>Find guidance</Link>
      </aside>

      <nav className={styles.pager} aria-label="More glossary terms">
        {prev ? <Link href={termPath(prev.slug)}>← {coreWord(prev.word)}</Link> : <span />}
        {next ? <Link href={termPath(next.slug)}>{coreWord(next.word)} →</Link> : <span />}
      </nav>

      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdString(termJsonLd(e)) }} />
    </article>
  );
}
