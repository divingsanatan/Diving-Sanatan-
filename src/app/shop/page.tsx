import type { Metadata } from "next";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { SITE_URL } from "@/lib/shopShared";
import { breadcrumbJsonLd, getPublishedProducts, itemListJsonLd, jsonLdString } from "@/lib/shopServer";
import ShopCatalog from "./ShopCatalog";
import styles from "./shop.module.css";

// Rebuilt at most once a minute, and instantly whenever an admin saves a product.
export const revalidate = 60;

const TITLE = "Shop: Spiritual & Healing Essentials | Diving Sanatan";
const DESCRIPTION =
  "Browse thoughtfully chosen spiritual and healing essentials from Diving Sanatan to support your meditation practice, energy work and everyday wellbeing.";

export const metadata: Metadata = {
  title: { absolute: TITLE },
  description: DESCRIPTION,
  alternates: { canonical: `${SITE_URL}/shop` },
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    url: `${SITE_URL}/shop`,
    siteName: "Diving Sanatan",
    type: "website",
  },
  twitter: { card: "summary_large_image", title: TITLE, description: DESCRIPTION },
};

export default async function ShopPage() {
  const products = await getPublishedProducts();

  return (
    <div className="page-shell">
      <Header />
      <main className={styles.main}>
        <section className={styles.hero}>
          <span className={styles.eyebrow}>The Diving Sanatan Shop</span>
          <h1 className={styles.title}>Tools for your healing journey</h1>
          <p className={styles.subtitle}>
            Thoughtfully chosen essentials to support your practice, your space and your everyday wellbeing.
          </p>
        </section>

        <ShopCatalog products={products} />
      </main>
      <Footer />

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: jsonLdString(
            breadcrumbJsonLd([
              { name: "Home", path: "/" },
              { name: "Shop", path: "/shop" },
            ])
          ),
        }}
      />
      {products.length > 0 && (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdString(itemListJsonLd(products)) }} />
      )}
    </div>
  );
}
