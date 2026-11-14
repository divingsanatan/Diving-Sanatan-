import type { Metadata } from "next";
import Link from "next/link";
import FaqClient from "./FaqClient";
import { SITE_URL } from "@/lib/shopShared";
import { getPublishedFaqs } from "@/lib/faqServer";
import { faqIndexJsonLd, faqPath, effectiveShortAnswer } from "@/lib/faqShared";
import { jsonLdString } from "@/lib/shopServer";
import type { FAQItem } from "@/types/database";
import glossary from "../glossary/glossary.module.css";
import styles from "./faq.module.css";

// Rebuilt at most once a minute, and instantly whenever a FAQ is saved.
export const revalidate = 60;

const TITLE = "Spiritual Healing FAQ: Your Questions Answered | Diving Sanatan";
const DESCRIPTION =
  "Clear, practical answers to common questions about energy healing, chakra alignment, meditation, pranayama and booking a session with Diving Sanatan.";

export const metadata: Metadata = {
  title: { absolute: TITLE },
  description: DESCRIPTION,
  alternates: { canonical: `${SITE_URL}/blog/faq` },
  openGraph: { type: "website", title: TITLE, description: DESCRIPTION, url: `${SITE_URL}/blog/faq`, siteName: "Diving Sanatan" },
  twitter: { card: "summary_large_image", title: TITLE, description: DESCRIPTION },
};

export default async function FaqPage() {
  const entries = await getPublishedFaqs();
  const linkable = entries.filter((e) => e.slug); // all of them once the SQL migration has run

  // Light version for the interactive list. The structured data lives on each question's own page.
  const faqs: FAQItem[] = entries.map((e) => ({
    id: e.id,
    question: e.question,
    answer: e.answer,
    verified: e.verified,
    isPublished: true,
    createdAt: e.createdAt,
    slug: e.slug,
    shortAnswer: effectiveShortAnswer(e),
    reviewedBy: e.reviewedBy,
  }));

  return (
    <>
      <FaqClient initialFaqs={faqs} />

      {linkable.length > 0 && (
        <div className={glossary.wrap}>
          <section className={glossary.indexCard} aria-labelledby="all-questions">
            <h2 id="all-questions" className={glossary.indexTitle}>All questions</h2>
            <p className={glossary.indexSub}>{linkable.length} questions answered. Select any question for the full answer.</p>
            <ol className={styles.questionList}>
              {linkable.map((e) => (
                <li key={e.id}>
                  <Link href={faqPath(e.slug)}>{e.question}</Link>
                </li>
              ))}
            </ol>
          </section>
        </div>
      )}

      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdString(faqIndexJsonLd(linkable)) }} />
    </>
  );
}
