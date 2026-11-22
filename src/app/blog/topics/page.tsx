import type { Metadata } from "next";
import Link from "next/link";
import { getTopicsWithItems } from "@/lib/topicsServer";
import { countsLabel, countsOf, topicPath, topicsIndexJsonLd, TOPICS_NAME } from "@/lib/topicsShared";
import { SITE_NAME, SITE_URL } from "@/lib/shopShared";
import { jsonLdString } from "@/lib/shopServer";
import glossary from "../glossary/glossary.module.css";
import styles from "./topics.module.css";

export const revalidate = 60;

const TITLE = `Topic Guides: Chakras, Tantra, Sanatan Psychology | ${SITE_NAME}`;
const DESCRIPTION = "Start with a topic and follow a clear path: a short answer, a full guide, in-depth articles, videos, real questions answered by our healers and a glossary of key terms.";

export const metadata: Metadata = {
  title: { absolute: TITLE },
  description: DESCRIPTION,
  alternates: { canonical: `${SITE_URL}/blog/topics` },
  openGraph: { type: "website", title: TITLE, description: DESCRIPTION, url: `${SITE_URL}/blog/topics`, siteName: SITE_NAME },
  twitter: { card: "summary_large_image", title: TITLE, description: DESCRIPTION },
};

export default async function TopicsIndexPage() {
  const entries = await getTopicsWithItems();
  const topics = entries.map((e) => e.topic);

  return (
    <div className={`${glossary.wrap} ${styles.hubWrap}`}>
      <section className={styles.indexHero}>
        <h1 className={styles.indexTitle}>{TOPICS_NAME}</h1>
        <p className={styles.indexSub}>{DESCRIPTION}</p>
      </section>

      {entries.length === 0 ? (
        <p className={styles.emptyNote}>Topic guides are on the way. In the meantime, browse our <Link href="/blog">blog</Link>, <Link href="/blog/quora-qa">questions and answers</Link> and <Link href="/blog/glossary">glossary</Link>.</p>
      ) : (
        <div className={styles.topicGrid}>
          {entries.map(({ topic, items }) => (
            <Link key={topic.id} href={topicPath(topic.slug)} className={styles.topicCard}>
              <span className={styles.topicName}>{topic.title}</span>
              <p className={styles.topicText}>{topic.shortAnswer}</p>
              <span className={styles.topicCount}>{countsLabel(countsOf(items))}</span>
            </Link>
          ))}
        </div>
      )}

      {topics.length > 0 && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdString(topicsIndexJsonLd(topics)) }} />}
    </div>
  );
}
