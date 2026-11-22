import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import QaComments from "./QaComments";
import { getPublishedComments, getPublishedQuestions, getQuestionBySlug } from "@/lib/qaServer";
import {
  answerWho,
  effectiveCanonical,
  effectiveMetaDescription,
  effectiveMetaTitle,
  effectiveShortAnswer,
  isAnswered,
  isIndexable,
  qaJsonLd,
  qaPath,
  qaUrl,
  relatedQuestions,
} from "@/lib/qaShared";
import { stripHtml, truncate } from "@/lib/shopShared";
import { jsonLdString } from "@/lib/shopServer";
import { sanitizeHtml } from "@/utils/sanitizeHtml";
import { getTrailFor } from "@/lib/topicsServer";
import { TopicBadge, TopicTrail } from "@/components/blog/TopicTrail";
import { normalizeBlogHtml } from "@/utils/normalizeBlogHtml";
// The article look (quick-answer box, takeaways, related cards, sources, pager) is shared with the glossary.
import glossary from "../../glossary/glossary.module.css";
import styles from "../qa.module.css";

export const revalidate = 60;
export const dynamicParams = true;

type Props = { params: Promise<{ slug: string }> };

export async function generateStaticParams() {
  const all = await getPublishedQuestions();
  return all.filter(isIndexable).slice(0, 300).map((q) => ({ slug: q.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const q = await getQuestionBySlug(slug);
  if (!q) return { title: { absolute: "Question not found | Diving Sanatan" }, robots: { index: false, follow: false } };

  const title = effectiveMetaTitle(q);
  const description = effectiveMetaDescription(q);
  // Unanswered (or noindex) questions stay out of Google: a page with no answer is thin content.
  const indexable = isIndexable(q);
  return {
    title: { absolute: title },
    description,
    alternates: { canonical: effectiveCanonical(q) },
    robots: indexable ? { index: true, follow: true } : { index: false, follow: true },
    keywords: [q.focusKeyword, ...q.secondaryKeywords].filter(Boolean),
    openGraph: {
      type: "article",
      title,
      description,
      url: qaUrl(q.slug),
      siteName: "Diving Sanatan",
      images: q.ogImage ? [{ url: q.ogImage, alt: q.title }] : undefined,
      ...(q.updatedAt ? { modifiedTime: q.updatedAt } : {}),
    },
    twitter: { card: q.ogImage ? "summary_large_image" : "summary", title, description, images: q.ogImage ? [q.ogImage] : undefined },
  };
}

const fmtDate = (d: string) => new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });

export default async function QuestionPage({ params }: Props) {
  const { slug } = await params;
  const q = await getQuestionBySlug(slug);
  if (!q) notFound();

  const [comments, all, trail] = await Promise.all([getPublishedComments(q.id), getPublishedQuestions(), getTrailFor("qa", q.slug)]);
  const answered = isAnswered(q);
  const bySlug = new Map(all.map((x) => [x.slug, x]));
  let related = q.relatedQuestions.map((s) => bySlug.get(s)).filter((x): x is NonNullable<typeof x> => !!x && x.id !== q.id && isIndexable(x));
  if (related.length === 0) related = relatedQuestions(q, all, 4);

  const pool = all.filter(isIndexable);
  const idx = pool.findIndex((x) => x.id === q.id);
  const prev = idx > 0 ? pool[idx - 1] : null;
  const next = idx >= 0 && idx < pool.length - 1 ? pool[idx + 1] : null;

  const takeaways = q.keyTakeaways.filter(Boolean);
  const alternates = q.alternateQuestions.filter(Boolean);
  const sources = q.sources.filter((s) => s.url);
  const quick = effectiveShortAnswer(q);
  const norm = (t: string) => t.replace(/\s+/g, " ").trim();
  // Don't show the same sentence twice when the answer is just the quick answer
  const answerIsQuick = norm(stripHtml(q.answer)) === norm(quick) && !/<(ul|ol|h[2-6]|table|blockquote|a[\s>])/i.test(q.answer);
  const jsonLd = qaJsonLd(q, comments);
  const who = answerWho(q);

  return (
    <article className={`${glossary.wrap} ${glossary.article}`}>
      <nav className={glossary.crumbs} aria-label="Breadcrumb">
        <Link href="/">Home</Link><span aria-hidden="true">/</span>
        <Link href="/blog">Blog</Link><span aria-hidden="true">/</span>
        <Link href="/blog/quora-qa">Q&amp;A</Link><span aria-hidden="true">/</span>
        <span aria-current="page">{truncate(q.title, 60)}</span>
      </nav>

      <header>
        <span className={glossary.badge}>{q.category || "Q&A"}</span>
        <h1 className={glossary.h1}>{q.title}</h1>
        <p className={styles.asker}>
          Asked by {q.askedByName || "a community member"}
          {(q.publishedAt || q.createdAt) && <> · {fmtDate(q.publishedAt || q.createdAt)}</>}
        </p>
        <TopicBadge trail={trail} />
      </header>

      {q.description && <p className={styles.details}>{q.description}</p>}

      {answered ? (
        <>
          <section className={`${glossary.answer} speakable-answer`} aria-label="Quick answer">
            <p className={glossary.answerLabel}>Quick answer</p>
            <p className={glossary.answerText}>{quick}</p>
          </section>

          {who && (
            <div className={styles.healerCard}>
              {q.answererImage ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={q.answererImage} alt="" className={styles.avatar} width={40} height={40} loading="lazy" />
              ) : (
                <span className={styles.avatarFallback} aria-hidden="true">{(q.answererName || "H").charAt(0).toUpperCase()}</span>
              )}
              <div>
                <p className={styles.healerName}>Answered by {q.answererName}</p>
                <p className={styles.healerMeta}>
                  {[q.answererRole, q.answererCredentials].filter(Boolean).join(" · ")}
                  {q.answeredAt && <> · {fmtDate(q.answeredAt)}</>}
                </p>
              </div>
            </div>
          )}

          {takeaways.length > 0 && (
            <section className={glossary.section} aria-labelledby="takeaways">
              <h2 id="takeaways" className={glossary.h2}>Key takeaways</h2>
              <ul className={glossary.takeaways}>{takeaways.map((t, i) => (<li key={i}>{t}</li>))}</ul>
            </section>
          )}

          {!answerIsQuick && (
            <section className={glossary.section} aria-labelledby="full-answer">
              <h2 id="full-answer" className={glossary.h2}>The full answer</h2>
              <div className={glossary.prose} dangerouslySetInnerHTML={{ __html: normalizeBlogHtml(sanitizeHtml(q.answer)) }} />
            </section>
          )}

          {alternates.length > 0 && (
            <section className={glossary.section} aria-labelledby="alternates">
              <h2 id="alternates" className={glossary.h2}>Other ways to ask this</h2>
              <ul className={glossary.takeaways}>{alternates.map((a, i) => (<li key={i}>{a}</li>))}</ul>
            </section>
          )}
        </>
      ) : (
        <section className={`${styles.notice} ${styles.info} ${styles.waiting}`} aria-label="Awaiting an answer">
          A healer hasn&apos;t answered this question yet. You can add a comment below, or browse{" "}
          <Link href="/blog/quora-qa" className={styles.more}>other answered questions</Link>.
        </section>
      )}

      <section className={glossary.section} aria-labelledby="discussion">
        <h2 id="discussion" className={glossary.h2}>Discussion ({comments.length})</h2>
        <QaComments questionId={q.id} initialComments={comments} />
      </section>

      {related.length > 0 && (
        <section className={glossary.section} aria-labelledby="related">
          <h2 id="related" className={glossary.h2}>Related questions</h2>
          <div className={glossary.relatedGrid}>
            {related.map((r) => (
              <Link key={r.id} href={qaPath(r.slug)} className={glossary.relatedCard}>
                <span className={glossary.relatedName}>{r.title}</span>
                <p className={glossary.relatedText}>{effectiveShortAnswer(r)}</p>
              </Link>
            ))}
          </div>
        </section>
      )}

      {answered && sources.length > 0 && (
        <section className={glossary.section} aria-labelledby="sources">
          <h2 id="sources" className={glossary.h2}>Sources and further reading</h2>
          <ol className={glossary.sources}>
            {sources.map((s, i) => (
              <li key={i}><a href={s.url} target="_blank" rel="noopener noreferrer">{s.title}</a></li>
            ))}
          </ol>
        </section>
      )}

      <TopicTrail trail={trail} currentTitle={q.title} currentUrl={qaUrl(q.slug)} />

      <aside className={glossary.cta}>
        <div>
          <h2 className={glossary.ctaTitle}>Want personal guidance?</h2>
          <p className={glossary.ctaText}>Our certified practitioners can guide you one-to-one.</p>
        </div>
        <Link href="/explore-services" className={glossary.ctaBtn}>Find guidance</Link>
      </aside>

      <p className={styles.disclaimer}>
        Answers are shared for general wellbeing information and are not a substitute for professional medical advice, diagnosis or treatment.
      </p>

      <nav className={glossary.pager} aria-label="More questions">
        {prev ? <Link href={qaPath(prev.slug)}>← {truncate(prev.title, 45)}</Link> : <span />}
        {next ? <Link href={qaPath(next.slug)}>{truncate(next.title, 45)} →</Link> : <span />}
      </nav>

      {jsonLd && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdString(jsonLd) }} />}
    </article>
  );
}
