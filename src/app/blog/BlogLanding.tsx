"use client";

import Link from "next/link";
import { useBlog } from "./BlogContext";
import glossary from "./glossary/glossary.module.css";
import styles from "./topics/topics.module.css";

export interface LandingTopic {
  slug: string;
  title: string;
  shortAnswer: string;
  counts: string;
}
export interface LandingArticle {
  key: string;
  path: string;
  title: string;
  summary: string;
  category: string;
  image: string;
}

/**
 * The /blog page: topic guides first, then articles.
 * The sidebar's category list and the page search box (shared blog context) narrow the articles, as they did before.
 * All content arrives from the server, so it is in the page HTML for search and AI crawlers.
 */
export default function BlogLanding({ topics, articles }: { topics: LandingTopic[]; articles: LandingArticle[] }) {
  const { searchQuery, activeCategory } = useBlog();
  const q = (searchQuery || "").trim().toLowerCase();
  const cat = (activeCategory || "all").toLowerCase();

  const shownArticles = articles
    .filter((a) => cat === "all" || a.category.toLowerCase() === cat)
    .filter((a) => !q || `${a.title} ${a.summary} ${a.category}`.toLowerCase().includes(q));
  const shownTopics = cat !== "all" ? [] : topics.filter((t) => !q || `${t.title} ${t.shortAnswer}`.toLowerCase().includes(q));
  const filtering = q.length > 0 || cat !== "all";

  return (
    <div className={`${glossary.wrap} ${styles.hubWrap}`}>
      <section className={styles.indexHero}>
        <h1 className={styles.indexTitle}>Spiritual Healing and Sanatan Dharma Guides</h1>
        <p className={styles.indexSub}>
          Start with a topic and follow a clear path: a short answer, a full guide, in-depth articles, videos, real questions answered by our healers and a glossary of key terms.
        </p>
        <p className={styles.quickRow}>
          <Link href="/blog/quora-qa" className={styles.quickLink}>Questions and answers</Link>
          <Link href="/blog/video-transcripts" className={styles.quickLink}>Videos</Link>
          <Link href="/blog/glossary" className={styles.quickLink}>Glossary</Link>
        </p>
      </section>

      {shownTopics.length > 0 && (
        <section aria-labelledby="landing-topics" className={glossary.section} style={{ marginTop: 0 }}>
          <h2 id="landing-topics" className={glossary.h2}>Start with a topic</h2>
          <div className={styles.topicGrid}>
            {shownTopics.map((t) => (
              <Link key={t.slug} href={`/blog/topics/${t.slug}`} className={styles.topicCard}>
                <span className={styles.topicName}>{t.title}</span>
                <p className={styles.topicText}>{t.shortAnswer}</p>
                {t.counts && <span className={styles.topicCount}>{t.counts}</span>}
              </Link>
            ))}
          </div>
        </section>
      )}

      <section aria-labelledby="landing-articles" className={glossary.section}>
        <h2 id="landing-articles" className={glossary.h2}>{filtering ? "Matching articles" : "Articles"}</h2>
        {shownArticles.length === 0 ? (
          <p className={styles.emptyNote}>{filtering ? "No articles match that search. Clear the search or pick another category." : "Articles are on the way. In the meantime, browse our questions and answers or the glossary."}</p>
        ) : (
          <div className={styles.itemGrid}>
            {shownArticles.map((a) => (
              <Link key={a.key} href={a.path} className={styles.itemCard}>
                {a.image && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={a.image} alt="" className={styles.itemThumb} width={320} height={180} loading="lazy" />
                )}
                <span className={styles.itemKind}>{a.category || "Article"}</span>
                <span className={styles.itemTitle}>{a.title}</span>
                {a.summary && <p className={styles.itemText}>{a.summary}</p>}
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
