import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, MessageCircle } from "lucide-react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import {
  discountPercent,
  effectiveDescription,
  effectiveTitle,
  formatPrice,
  productUrl,
} from "@/lib/shopShared";
import {
  breadcrumbJsonLd,
  getProductBySlug,
  getPublishedProducts,
  jsonLdString,
  productJsonLd,
  relatedProducts,
} from "@/lib/shopServer";
import { sanitizeHtml } from "@/utils/sanitizeHtml";
import { ProductCard } from "../ProductCard";
import ProductGallery from "../ProductGallery";
import ProductActions from "../ProductActions";
import ShopCartLink from "../ShopCartLink";
import styles from "../shop.module.css";

export const revalidate = 60;
export const dynamicParams = true;

type Props = { params: Promise<{ slug: string }> };

export async function generateStaticParams() {
  const products = await getPublishedProducts();
  return products.slice(0, 100).map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) {
    return { title: { absolute: "Product not found | Diving Sanatan" }, robots: { index: false, follow: false } };
  }

  const title = effectiveTitle(product);
  const description = effectiveDescription(product);
  const url = productUrl(product.slug);
  const image = product.ogImage || product.images[0]?.url;

  return {
    title: { absolute: title },
    description,
    alternates: { canonical: product.canonicalUrl || url },
    robots: product.noindex ? { index: false, follow: true } : { index: true, follow: true },
    openGraph: {
      type: "website",
      title,
      description,
      url,
      siteName: "Diving Sanatan",
      images: image ? [{ url: image, alt: product.images[0]?.alt || product.name }] : undefined,
    },
    twitter: {
      card: image ? "summary_large_image" : "summary",
      title,
      description,
      images: image ? [image] : undefined,
    },
  };
}

const STOCK_LABEL: Record<string, string> = {
  in_stock: "In stock",
  out_of_stock: "Out of stock",
  preorder: "Available for pre-order",
};

export default async function ProductPage({ params }: Props) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) notFound();

  const all = await getPublishedProducts();
  const related = relatedProducts(all, product, 4);

  const off = discountPercent(product.price, product.compareAtPrice);
  const soldOut = product.stockStatus === "out_of_stock";
  const enquiryHref = `/contact?product=${encodeURIComponent(product.name)}`;
  const dotClass = soldOut ? styles.dotOut : product.stockStatus === "preorder" ? styles.dotPre : "";

  return (
    <div className="page-shell">
      <Header />
      <main className={styles.main}>
        <nav className={styles.crumbs} aria-label="Breadcrumb">
          <Link href="/">Home</Link>
          <span aria-hidden="true">/</span>
          <Link href="/shop">Shop</Link>
          <span aria-hidden="true">/</span>
          <span aria-current="page">{product.name}</span>
          <span style={{ marginLeft: "auto" }}><ShopCartLink /></span>
        </nav>

        <article className={styles.product}>
          <ProductGallery images={product.images} name={product.name} />

          <div className={styles.info}>
            {product.category && <span className={styles.infoCat}>{product.category}</span>}
            <h1 className={styles.h1}>{product.name}</h1>

            {product.price > 0 && (
              <div className={styles.bigPrice}>
                <span className={styles.bigPriceNow}>{formatPrice(product.price, product.currency)}</span>
                {off > 0 && product.compareAtPrice !== null && (
                  <>
                    <span className={styles.bigPriceWas}>{formatPrice(product.compareAtPrice, product.currency)}</span>
                    <span className={styles.save}>Save {off}%</span>
                  </>
                )}
              </div>
            )}

            {product.shortDescription && <p className={styles.lead}>{product.shortDescription}</p>}

            <span className={styles.stock}>
              <span className={`${styles.dot} ${dotClass}`} aria-hidden="true" />
              {STOCK_LABEL[product.stockStatus]}
              {product.stockStatus === "in_stock" &&
                product.stockQuantity !== null &&
                product.stockQuantity > 0 &&
                product.stockQuantity <= 5 &&
                ` · Only ${product.stockQuantity} left`}
            </span>

            {product.price > 0 && !soldOut ? (
              <>
                <ProductActions
                  productId={product.id}
                  maxQty={product.stockQuantity}
                  preorder={product.stockStatus === "preorder"}
                />
                <div className={styles.ctaRow}>
                  {product.buyUrl && (
                    <a href={product.buyUrl} target="_blank" rel="noopener noreferrer" className={styles.ghost}>
                      Buy on partner site <ArrowRight size={18} aria-hidden="true" />
                    </a>
                  )}
                  <Link href={enquiryHref} className={styles.ghost}>
                    <MessageCircle size={18} aria-hidden="true" /> Ask a question
                  </Link>
                </div>
              </>
            ) : (
              <div className={styles.ctaRow}>
                {soldOut ? (
                  <Link href={enquiryHref} className={styles.ghost}>
                    <MessageCircle size={18} aria-hidden="true" /> Ask about availability
                  </Link>
                ) : (
                  <Link href={enquiryHref} className={styles.buy}>
                    Enquire to order <ArrowRight size={18} aria-hidden="true" />
                  </Link>
                )}
              </div>
            )}

            {product.highlights.length > 0 && (
              <ul className={styles.highlights}>
                {product.highlights.map((h, i) => (
                  <li key={i}>{h}</li>
                ))}
              </ul>
            )}

            {(product.sku || product.tags.length > 0) && (
              <div className={styles.meta}>
                {product.sku && <span className={styles.tag}>SKU: {product.sku}</span>}
                {product.tags.map((t) => (
                  <span key={t} className={styles.tag}>
                    {t}
                  </span>
                ))}
              </div>
            )}
          </div>
        </article>

        {product.description && (
          <section className={styles.section} aria-labelledby="about-heading">
            <h2 id="about-heading" className={styles.sectionTitle}>
              About this product
            </h2>
            <div className={styles.prose} dangerouslySetInnerHTML={{ __html: sanitizeHtml(product.description) }} />
          </section>
        )}

        {product.specs.length > 0 && (
          <section className={styles.section} aria-labelledby="details-heading">
            <h2 id="details-heading" className={styles.sectionTitle}>
              Product details
            </h2>
            <table className={styles.specs}>
              <tbody>
                {product.specs.map((s, i) => (
                  <tr key={i}>
                    <th scope="row">{s.label}</th>
                    <td>{s.value}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        )}

        <section className={styles.help}>
          <div>
            <h2 className={styles.helpTitle}>Not sure what you need?</h2>
            <p className={styles.helpText}>Tell us what you are working through and our practitioners will guide you.</p>
          </div>
          <Link href="/explore-services" className={styles.buy}>
            Find guidance <ArrowRight size={18} aria-hidden="true" />
          </Link>
        </section>

        {related.length > 0 && (
          <section className={styles.section} aria-labelledby="related-heading">
            <h2 id="related-heading" className={styles.sectionTitle}>
              You may also like
            </h2>
            <div className={styles.grid}>
              {related.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </section>
        )}
      </main>
      <Footer />

      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdString(productJsonLd(product)) }} />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: jsonLdString(
            breadcrumbJsonLd([
              { name: "Home", path: "/" },
              { name: "Shop", path: "/shop" },
              { name: product.name, path: `/shop/${product.slug}` },
            ])
          ),
        }}
      />
    </div>
  );
}
