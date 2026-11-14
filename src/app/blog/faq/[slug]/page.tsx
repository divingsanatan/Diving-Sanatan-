import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getFaqBySlug, getPublishedFaqs } from "@/lib/faqServer";
import {
  effectiveCanonical,
  effectiveMetaDescription,
  effectiveMetaTitle,
  effectiveShortAnswer,
  faqJsonLd,
  faqPath,
  faqUrl,
  relatedBySimilarity,
} from "@/lib/faqShared";
import { stripHtml, truncate } from "@/lib/shopShared";
import { jsonLdString } from "@/lib/shopServer";
import { sanitizeHtml } from "@/utils/sanitizeHtml";
import { normalizeBlogHtml } from "@/utils/normalizeBlogHtml";
// The article look (quick-answer box, takeaways, related cards, sources, pager) is shared with the glossary.
import glossary from "../../glossary/glossary.module.css";
import styles from "../faq.module.css";

export const revalidate = 60;
export const dynamicParams = true;

type Props = { params: Promise<{ slug: string }> };

export async function generateStaticParams() {
  const all = await getPublishedFaqs();
  return all.slice(0, 300).map((e) => ({ slug: e.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const e = await getFaqBySlug(slug);
  if (!e) return { title: { absolute: "Question not found | Diving Sanatan" }, robots: { index: false, follow: false } };

  const title = effectiveMetaTitle(e);
  const description = effectiveMetaDescription(e);
  const image = e.ogImage;
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
      url: faqUrl(e.slug),
      siteName: "Diving Sanatan",
      images: image ? [{ url: image, alt: e.question }] : undefined,
      ...(e.updatedAt ? { modifiedTime: e.updatedAt } : {}),
    },
    twitter: { card: image ? "summary_large_image" : "summary", title, description, images: image ? [image] : undefined },
  };
}

const fmtDate = (d: string) =>
  new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" });

export default async function FaqQuestionPage({ params }: Props) {
  const { slug } = await params;
  const e = await getFaqBySlug(slug);
  if (!e) notFound();

  const all = await getPublishedFaqs();
  const bySlug = new Map(all.map((x) => [x.slug, x]));
  let related = e.relatedFaqs.map((s) => bySlug.get(s)).filter((x): x is NonNullable<typeof x> => !!x && x.id !== e.id);
  if (related.length === 0) related = relatedBySimilarity(e, all, 4);

  const idx = all.findIndex((x) => x.id === e.id);
  const prev = idx > 0 ? all[idx - 1] : null;
  const next = idx >= 0 && idx < all.length - 1 ? all[idx + 1] : null;

  const takeaways = e.keyTakeaways.filter(Boolean);
  const alternates = e.alternateQuestions.filter(Boolean);
  const sources = e.sources.filter((s) => s.url);
  const extended = sanitizeHtml(e.extendedContent);

  // Short answers are often identical to the quick answer. Don't show the same sentence twice,
  // unless the full answer carries formatting (lists, headings, links…) that the plain quick answer lacks.
  const quick = effectiveShortAnswer(e);
  const norm = (t: string) => t.replace(/\s+/g, " ").trim();
  const answerIsQuick = norm(stripHtml(e.answer)) === norm(quick) && !/<(ul|ol|h[2-6]|table|blockquote|a[\s>])/i.test(e.answer);

  return (
    <article className={`${glossary.wrap} ${glossary.article}`}>
      <nav className={glossary.crumbs} aria-label="Breadcrumb">
        <Link href="/">Home</Link><span aria-hidden="true">/</span>
        <Link href="/blog">Blog</Link><span aria-hidden="true">/</span>
        <Link href="/blog/faq">FAQ</Link><span aria-hidden="true">/</span>
        <span aria-current="page">{truncate(e.question, 60)}</span>
      </nav>

      <header>
        <span className={glossary.badge}>FAQ</span>
        {e.verified && (
          <span className={styles.verified}>
            ✓ {e.reviewedBy ? `Reviewed by ${e.reviewedBy}` : "Verified by Dr. Meera Sharma"}
          </span>
        )}
        <h1 className={glossary.h1}>{e.question}</h1>
        {(e.reviewedBy || e.lastReviewed) && (
          <p className={glossary.meta}>
            {e.reviewedBy && !e.verified && <>Reviewed by {e.reviewedBy}</>}
            {e.reviewedBy && !e.verified && e.lastReviewed && " · "}
            {e.lastReviewed && <>Last reviewed {fmtDate(e.lastReviewed)}</>}
          </p>
        )}
      </header>

      <section className={`${glossary.answer} speakable-answer`} aria-label="Quick answer">
        <p className={glossary.answerLabel}>Quick answer</p>
        <p className={glossary.answerText}>{quick}</p>
      </section>

      {takeaways.length > 0 && (
        <section className={glossary.section} aria-labelledby="takeaways">
          <h2 id="takeaways" className={glossary.h2}>Key takeaways</h2>
          <ul className={glossary.takeaways}>{takeaways.map((t, i) => (<li key={i}>{t}</li>))}</ul>
        </section>
      )}

      {(!answerIsQuick || extended) && (
        <section className={glossary.section} aria-labelledby="full-answer">
          <h2 id="full-answer" className={glossary.h2}>{answerIsQuick ? "In more detail" : "The full answer"}</h2>
          {!answerIsQuick && <div className={glossary.prose} dangerouslySetInnerHTML={{ __html: normalizeBlogHtml(sanitizeHtml(e.answer)) }} />}
          {extended && <div className={glossary.prose} dangerouslySetInnerHTML={{ __html: extended }} />}
        </section>
      )}

      {alternates.length > 0 && (
        <section className={glossary.section} aria-labelledby="alternates">
          <h2 id="alternates" className={glossary.h2}>Other ways to ask this</h2>
          <ul className={styles.altList}>{alternates.map((q, i) => (<li key={i}>{q}</li>))}</ul>
        </section>
      )}

      {related.length > 0 && (
        <section className={glossary.section} aria-labelledby="related">
          <h2 id="related" className={glossary.h2}>Related questions</h2>
          <div className={glossary.relatedGrid}>
            {related.map((r) => (
              <Link key={r.id} href={faqPath(r.slug)} className={glossary.relatedCard}>
                <span className={glossary.relatedName}>{r.question}</span>
                <p className={glossary.relatedText}>{effectiveShortAnswer(r)}</p>
              </Link>
            ))}
          </div>
        </section>
      )}

      {sources.length > 0 && (
        <section className={glossary.section} aria-labelledby="sources">
          <h2 id="sources" className={glossary.h2}>Sources and further reading</h2>
          <ol className={glossary.sources}>
            {sources.map((s, i) => (
              <li key={i}><a href={s.url} target="_blank" rel="noopener noreferrer">{s.title}</a></li>
            ))}
          </ol>
        </section>
      )}

      <aside className={glossary.cta}>
        <div>
          <h2 className={glossary.ctaTitle}>Still have questions?</h2>
          <p className={glossary.ctaText}>Our certified practitioners can guide you personally.</p>
        </div>
        <Link href="/explore-services" className={glossary.ctaBtn}>Find guidance</Link>
      </aside>

      <nav className={glossary.pager} aria-label="More questions">
        {prev ? <Link href={faqPath(prev.slug)}>← {truncate(prev.question, 45)}</Link> : <span />}
        {next ? <Link href={faqPath(next.slug)}>{truncate(next.question, 45)} →</Link> : <span />}
      </nav>

      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdString(faqJsonLd(e)) }} />
    </article>
  );
}
