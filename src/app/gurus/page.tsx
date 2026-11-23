import type { Metadata } from "next";
import GurusPage from "./GurusClient";
import { jsonLdString } from "@/lib/shopServer";
import { SITE_NAME, SITE_URL } from "@/lib/shopShared";
import { getPublishedPractitioners, guruUrl } from "@/lib/siteServer";

export const revalidate = 300;

const TITLE = `Our Certified Gurus and Healing Guides | ${SITE_NAME}`;
const DESCRIPTION = "Meet the practitioners behind Diving Sanatan: their specialities, experience and the sessions they guide, from chakra balancing and meditation to energy healing.";

export const metadata: Metadata = {
  title: { absolute: TITLE },
  description: DESCRIPTION,
  alternates: { canonical: `${SITE_URL}/gurus` },
  openGraph: { type: "website", title: TITLE, description: DESCRIPTION, url: `${SITE_URL}/gurus`, siteName: SITE_NAME },
  twitter: { card: "summary", title: TITLE, description: DESCRIPTION },
};

export default async function Page() {
  const practitioners = await getPublishedPractitioners();
  const ld = {
    "@context": "https://schema.org",
    "@graph": [
      { "@type": "ItemList", name: `${SITE_NAME} practitioners`, itemListElement: practitioners.map((p, n) => ({ "@type": "ListItem", position: n + 1, url: guruUrl(p.id), name: p.name })) },
      { "@type": "BreadcrumbList", itemListElement: [{ "@type": "ListItem", position: 1, name: "Home", item: SITE_URL }, { "@type": "ListItem", position: 2, name: "Our gurus", item: `${SITE_URL}/gurus` }] },
    ],
  };
  return (
    <>
      <GurusPage initial={practitioners} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdString(ld) }} />
    </>
  );
}
