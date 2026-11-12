import type { Metadata } from "next";
import Link from "next/link";
import GlossaryClient from "./GlossaryClient";
import { SITE_URL } from "@/lib/shopShared";
import { getPublishedGlossary } from "@/lib/glossaryServer";
import { coreWord, glossaryIndexJsonLd, termPath } from "@/lib/glossaryShared";
import { jsonLdString } from "@/lib/shopServer";
import type { GlossaryTerm } from "@/types/database";
import styles from "./glossary.module.css";

// Rebuilt at most once a minute, and instantly whenever a term is saved.
export const revalidate = 60;

const TITLE = "Spiritual Glossary: Sanatan Dharma, Chakra & Healing Terms | Diving Sanatan";
const DESCRIPTION =
  "Clear, trustworthy definitions of Sanatan Dharma, chakra, meditation and energy-healing terms such as Kundalini, Prana, Aura and Reiki, explained by Diving Sanatan.";

export const metadata: Metadata = {
  title: { absolute: TITLE },
  description: DESCRIPTION,
  alternates: { canonical: `${SITE_URL}/blog/glossary` },
  openGraph: { type: "website", title: TITLE, description: DESCRIPTION, url: `${SITE_URL}/blog/glossary`, siteName: "Diving Sanatan" },
  twitter: { card: "summary_large_image", title: TITLE, description: DESCRIPTION },
};

export default async function GlossaryPage() {
  const entries = await getPublishedGlossary();

  // Light version for the interactive list (the full text stays on each term's own page)
  const terms: GlossaryTerm[] = entries.map((e) => ({
    id: e.id,
    word: e.word,
    phonetic: e.phonetic,
    category: e.category,
    definition: e.definition,
    illustration: e.illustration,
    createdAt: e.createdAt,
    slug: e.slug,
  }));

  // A-Z groups for the crawlable index
  const groups = new Map<string, typeof entries>();
  for (const e of entries) {
    const letter = coreWord(e.word).charAt(0).toUpperCase() || "#";
    groups.set(letter, [...(groups.get(letter) || []), e]);
  }
  const letters = Array.from(groups.keys()).sort();

  return (
    <div className={styles.wrap}>
      <GlossaryClient initialTerms={terms} />

      {entries.length > 0 && (
        <section className={styles.indexCard} aria-labelledby="all-terms">
          <h2 id="all-terms" className={styles.indexTitle}>All glossary terms A–Z</h2>
          <p className={styles.indexSub}>{entries.length} definitions. Select any term for its full explanation.</p>
          {letters.map((l) => (
            <div key={l} className={styles.letterGroup}>
              <span className={styles.letter} aria-hidden="true">{l}</span>
              <div className={styles.chips}>
                {groups.get(l)!.map((e) => (
                  <Link key={e.id} href={termPath(e.slug)} className={styles.chip}>{e.word}</Link>
                ))}
              </div>
            </div>
          ))}
        </section>
      )}

      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdString(glossaryIndexJsonLd(entries)) }} />
    </div>
  );
}
