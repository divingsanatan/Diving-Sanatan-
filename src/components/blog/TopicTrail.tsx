import Link from "next/link";
import { jsonLdString } from "@/lib/shopServer";
import type { TopicTrailData } from "@/lib/topicsServer";
import { ITEM_LABEL, countsLabel, countsOf, memberBreadcrumbJsonLd, topicPath } from "@/lib/topicsShared";
import styles from "@/app/blog/topics/topics.module.css";

/** One line under the page title: this page belongs to a topic guide. Renders nothing when it has no topic. */
export function TopicBadge({ trail }: { trail: TopicTrailData | null }) {
  if (!trail) return null;
  const { topic, journey, index } = trail;
  return (
    <p className={styles.badgeLine}>
      Part of the <Link href={topicPath(topic.slug)}>{topic.title} guide</Link>
      {index >= 0 && journey.length > 1 && <>. Step {index + 1} of {journey.length}</>}
    </p>
  );
}

/** Bottom-of-page panel: previous and next in the guide, a few more pages on the topic, and a link back to the hub. */
export function TopicTrail({ trail, currentTitle, currentUrl }: { trail: TopicTrailData | null; currentTitle: string; currentUrl: string }) {
  if (!trail) return null;
  const { topic, prev, next, more, glossary, journey, index } = trail;
  const isTerm = index < 0 && glossary.some((g) => g.path === currentUrl.replace(/^https?:\/\/[^/]+/, ""));
  const start = journey[0] || null;
  const moreTerms = isTerm ? glossary.filter((g) => g.path !== currentUrl.replace(/^https?:\/\/[^/]+/, "")).slice(0, 6) : [];
  const counts = countsLabel(countsOf([...journey, ...glossary]));

  return (
    <aside className={styles.trail} aria-labelledby="topic-trail-h">
      <h2 id="topic-trail-h" className={styles.trailTitle}>Keep exploring {topic.title}</h2>
      <p className={styles.trailSub}>
        {isTerm ? <>This term is part of our <Link href={topicPath(topic.slug)}>{topic.title} guide</Link>.</> : <>This page is part of our <Link href={topicPath(topic.slug)}>{topic.title} guide</Link>, which connects {counts}.</>}
      </p>

      {(prev || next) && (
        <div className={styles.pager}>
          {prev ? (
            <Link href={prev.path} className={styles.pagerLink} rel="prev">
              <span className={styles.pagerDir}>Previous in this guide</span>
              <span className={styles.pagerName}>{prev.title}</span>
            </Link>
          ) : <span />}
          {next && (
            <Link href={next.path} className={`${styles.pagerLink} ${styles.pagerNext}`} rel="next">
              <span className={styles.pagerDir}>Next in this guide</span>
              <span className={styles.pagerName}>{next.title}</span>
            </Link>
          )}
        </div>
      )}

      {isTerm && start && (
        <div className={styles.pager}>
          <Link href={start.path} className={styles.pagerLink}>
            <span className={styles.pagerDir}>Start the guide</span>
            <span className={styles.pagerName}>{start.title}</span>
          </Link>
        </div>
      )}

      {more.length > 0 && !isTerm && (
        <>
          <p className={styles.moreTitle}>More on this topic</p>
          <ul className={styles.moreList}>
            {more.map((m) => (
              <li key={`${m.type}:${m.slug}`}><span className={styles.moreKind}>{ITEM_LABEL[m.type]}</span><Link href={m.path}>{m.title}</Link></li>
            ))}
          </ul>
        </>
      )}

      {moreTerms.length > 0 && (
        <>
          <p className={styles.moreTitle}>More key terms in this guide</p>
          <ul className={styles.moreList}>
            {moreTerms.map((m) => (<li key={m.slug}><Link href={m.path}>{m.title}</Link></li>))}
          </ul>
        </>
      )}

      <Link href={topicPath(topic.slug)} className={styles.trailLink}>Open the full {topic.title} guide</Link>

      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdString(memberBreadcrumbJsonLd(topic, currentTitle, currentUrl)) }} />
    </aside>
  );
}
