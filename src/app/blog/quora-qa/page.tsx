import type { Metadata } from "next";
import Link from "next/link";
import QaBoardClient from "./QaBoardClient";
import { SITE_URL } from "@/lib/shopShared";
import { getPublishedQuestions, allowedCategories } from "@/lib/qaServer";
import { isIndexable, qaIndexJsonLd, qaPath } from "@/lib/qaShared";
import { jsonLdString } from "@/lib/shopServer";
import glossary from "../glossary/glossary.module.css";
import faq from "./qaList.module.css";

// Rebuilt at most once a minute, and instantly whenever a question or answer is saved.
export const revalidate = 60;

const TITLE = "Ask a Healer: Spiritual Healing Q&A | Diving Sanatan";
const DESCRIPTION =
  "Ask questions about energy healing, chakras, meditation and wellbeing, and read answers from certified healers at Diving Sanatan.";

export const metadata: Metadata = {
  title: { absolute: TITLE },
  description: DESCRIPTION,
  alternates: { canonical: `${SITE_URL}/blog/quora-qa` },
  openGraph: { type: "website", title: TITLE, description: DESCRIPTION, url: `${SITE_URL}/blog/quora-qa`, siteName: "Diving Sanatan" },
  twitter: { card: "summary_large_image", title: TITLE, description: DESCRIPTION },
};

export default async function QaBoardPage() {
  const [questions, categories] = await Promise.all([getPublishedQuestions(), allowedCategories()]);
  const answered = questions.filter(isIndexable);

  return (
    <>
      <QaBoardClient initialQuestions={questions} categories={categories} />

      {answered.length > 0 && (
        <div className={glossary.wrap}>
          <section className={glossary.indexCard} aria-labelledby="all-answered">
            <h2 id="all-answered" className={glossary.indexTitle}>All answered questions</h2>
            <p className={glossary.indexSub}>{answered.length} questions answered by our healers. Select any question for the full answer.</p>
            <ol className={faq.questionList}>
              {answered.map((q) => (
                <li key={q.id}>
                  <Link href={qaPath(q.slug)}>{q.title}</Link>
                </li>
              ))}
            </ol>
          </section>
        </div>
      )}

      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdString(qaIndexJsonLd(questions)) }} />
    </>
  );
}
