import Link from "next/link";
import type { ReactNode } from "react";
import { sanitizeHtml } from "@/utils/sanitizeHtml";
import { normalizeBlogHtml } from "@/utils/normalizeBlogHtml";
import { stripHtml, wordCount } from "@/lib/shopShared";
import { jsonLdString } from "@/lib/shopServer";
import { isUrl } from "@/lib/faqShared";
import {
  ITEM_LABEL,
  countsLabel,
  countsOf,
  itemsOfType,
  topicJsonLd,
  topicPath,
  type ResolvedItem,
  type Topic,
} from "@/lib/topicsShared";
import { QA_PATH } from "@/lib/qaShared";
import glossary from "../glossary/glossary.module.css";
import styles from "./topics.module.css";

const fmtDate = (d: string) => new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });

function ItemCard({ item }: { item: ResolvedItem }) {
  return (
    <Link href={item.path} className={styles.itemCard}>
      {item.type === "video" && item.image && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={item.image} alt="" className={styles.itemThumb} width={320} height={180} loading="lazy" />
      )}
      <span className={styles.itemKind}>{ITEM_LABEL[item.type]}</span>
      <span className={styles.itemTitle}>{item.title}</span>
      {item.summary && <p className={styles.itemText}>{item.summary}</p>}
    </Link>
  );
}

/** The topic hub page. Used by the public page and by the staff-only draft preview. */
export default function TopicHub({ topic, items, otherTopics, preview = false }: { topic: Topic; items: ResolvedItem[]; otherTopics: Topic[]; preview?: boolean }) {
  const counts = countsOf(items);
  const pillar = items.find((i) => i.role === "pillar" && i.type === "blog") || null;
  const deeper = [...itemsOfType(items, "blog"), ...itemsOfType(items, "video")].filter((i) => i !== pillar);
  const questions = itemsOfType(items, "qa");
  const terms = itemsOfType(items, "glossary");
  const guideHtml = topic.overviewHtml.trim() ? normalizeBlogHtml(sanitizeHtml(topic.overviewHtml)) : "";
  const hasGuide = wordCount(stripHtml(topic.overviewHtml)) > 0;
  const sources = topic.sources.filter((s) => s.title && isUrl(s.url));
  const takeaways = topic.keyTakeaways.filter(Boolean);
  const peopleAsk = topic.alternateQuestions.filter(Boolean);
  const cta = topic.ctaLabel.trim() && topic.ctaUrl.trim();
  const reviewed = topic.reviewedBy.trim();

  const toc: { id: string; label: string }[] = [];
  if (hasGuide) toc.push({ id: "guide", label: "The guide" });
  if (pillar) toc.push({ id: "start", label: "Start here" });
  if (deeper.length) toc.push({ id: "deeper", label: "Go deeper" });
  if (questions.length) toc.push({ id: "questions", label: "Questions people ask" });
  if (terms.length) toc.push({ id: "terms", label: "Key terms" });
  if (sources.length) toc.push({ id: "sources", label: "Sources" });

  const section = (id: string, title: string, body: ReactNode) => (
    <section id={id} className={glossary.section} aria-labelledby={`${id}-h`}>
      <h2 id={`${id}-h`} className={glossary.h2}>{title}</h2>
      {body}
    </section>
  );

  return (
    <article className={`${glossary.wrap} ${glossary.article} ${styles.hubWrap}`}>
      {preview && <p className={styles.previewBanner}>Preview. This topic is a draft and is not public yet. Only signed-in staff can see this page. Publish it from Admin &rsaquo; Topics.</p>}

      <nav className={glossary.crumbs} aria-label="Breadcrumb">
        <Link href="/">Home</Link><span aria-hidden="true">/</span>
        <Link href="/blog">Blog</Link><span aria-hidden="true">/</span>
        <span aria-current="page">{topic.title}</span>
      </nav>

      <header>
        <span className={glossary.badge}>Topic guide</span>
        <h1 className={glossary.h1}>{topic.title}</h1>
        <p className={styles.byline}>
          By <strong>{topic.authorName || "Diving Sanatan Team"}</strong>
          {reviewed && <>. Reviewed by <strong>{reviewed}</strong></>}
          {topic.lastReviewed && <>. Last reviewed {fmtDate(topic.lastReviewed)}</>}
          {!topic.lastReviewed && topic.updatedAt && <>. Updated {fmtDate(topic.updatedAt)}</>}
        </p>
        {countsLabel(counts) && <p className={styles.byline}>This guide connects {countsLabel(counts)}.</p>}
      </header>

      {topic.shortAnswer.trim() && (
        <section className={`${glossary.answer} speakable-answer`} aria-label="Quick answer">
          <p className={glossary.answerLabel}>Quick answer</p>
          <p className={glossary.answerText}>{topic.shortAnswer}</p>
        </section>
      )}

      {takeaways.length > 0 && (
        <section className={glossary.section} aria-labelledby="takeaways">
          <h2 id="takeaways" className={glossary.h2}>Key takeaways</h2>
          <ul className={glossary.takeaways}>{takeaways.map((t, i) => (<li key={i}>{t}</li>))}</ul>
        </section>
      )}

      {toc.length > 1 && (
        <nav className={styles.toc} aria-label="On this page">
          <p className={styles.tocTitle}>On this page</p>
          <ul className={styles.tocList}>{toc.map((t) => (<li key={t.id}><a href={`#${t.id}`}>{t.label}</a></li>))}</ul>
        </nav>
      )}

      {pillar && (
        <section id="start" aria-label="Start here">
          <Link href={pillar.path} className={styles.startCard}>
            <p className={styles.startLabel}>Start here: the full guide</p>
            <p className={styles.startTitle}>{pillar.title}</p>
            {pillar.summary && <p className={styles.startText}>{pillar.summary}</p>}
          </Link>
        </section>
      )}

      {hasGuide && (
        <section id="guide" className={glossary.section} aria-label="The guide">
          <div className={glossary.prose} dangerouslySetInnerHTML={{ __html: guideHtml }} />
        </section>
      )}

      {deeper.length > 0 && section("deeper", "Go deeper", <div className={styles.itemGrid}>{deeper.map((i) => (<ItemCard key={`${i.type}:${i.slug}`} item={i} />))}</div>)}

      {questions.length > 0 &&
        section(
          "questions",
          "Questions people ask",
          <>
            <ul className={styles.qaList}>
              {questions.map((q) => (
                <li key={q.slug} className={styles.qaItem}>
                  <h3 className={styles.qaQuestion}><Link href={q.path}>{q.title}</Link></h3>
                  <p className={styles.qaAnswer}>{q.summary}</p>
                  <Link href={q.path} className={styles.qaMore}>Read the full answer</Link>
                </li>
              ))}
            </ul>
            <p className={styles.askBox}>Have a question about {topic.title.toLowerCase()}? <Link href={QA_PATH}>Ask our healers</Link> and see all answered questions.</p>
          </>
        )}

      {questions.length === 0 && peopleAsk.length > 0 &&
        section(
          "questions",
          "Questions people ask",
          <>
            <p>These are common questions on this topic. We are preparing full answers.</p>
            <ul className={styles.peopleAsk}>{peopleAsk.map((q, i) => (<li key={i}>{q}</li>))}</ul>
            <p className={styles.askBox}><Link href={QA_PATH}>Ask our healers a question</Link></p>
          </>
        )}

      {terms.length > 0 &&
        section(
          "terms",
          "Key terms",
          <div className={glossary.chips}>
            {terms.map((t) => (<Link key={t.slug} href={t.path} className={glossary.chip} title={t.summary}>{t.title}</Link>))}
          </div>
        )}

      {cta && (
        <div className={glossary.cta}>
          <div>
            <p className={glossary.ctaTitle}>Take the next step</p>
            {topic.ctaText.trim() && <p className={glossary.ctaText}>{topic.ctaText}</p>}
          </div>
          <Link href={topic.ctaUrl} className={glossary.ctaBtn}>{topic.ctaLabel}</Link>
        </div>
      )}

      {sources.length > 0 &&
        section(
          "sources",
          "Sources",
          <ol className={glossary.sources}>
            {sources.map((s) => (<li key={s.url}><a href={s.url} target="_blank" rel="noopener noreferrer">{s.title}</a></li>))}
          </ol>
        )}

      {otherTopics.length > 0 &&
        section(
          "more-topics",
          "Explore other topics",
          <div className={styles.topicGrid}>
            {otherTopics.map((t) => (
              <Link key={t.id} href={topicPath(t.slug)} className={styles.topicCard}>
                <span className={styles.topicName}>{t.title}</span>
                <p className={styles.topicText}>{t.shortAnswer}</p>
              </Link>
            ))}
          </div>
        )}

      {!preview && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdString(topicJsonLd(topic, items)) }} />}
    </article>
  );
}
