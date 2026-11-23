import Link from "next/link";
import { formatCurrency } from "@/utils/formatters";
import { jsonLdString } from "@/lib/shopServer";
import { servicePath, servicesListJsonLd } from "@/lib/siteServer";
import type { Service } from "@/types/database";
import styles from "@/app/services/[id]/service.module.css";

/** A plain list of every service with a link to its own page. Gives readers and crawlers a clear way to every service page. */
export default function ServicesIndex({ services }: { services: Service[] }) {
  if (!services.length) return null;
  return (
    <section className={styles.indexWrap} aria-labelledby="all-services">
      <h2 id="all-services" className={styles.indexTitle}>All healing services</h2>
      <p className={styles.indexSub}>Open any session to read what it involves, who guides it and what clients say.</p>
      <div className={styles.grid}>
        {services.map((s) => (
          <Link key={s.id} href={servicePath(s.id)} className={styles.card}>
            <span className={styles.cardName}>{s.name}</span>
            <span className={styles.cardMeta}>{[s.category, s.duration, formatCurrency(s.price)].filter(Boolean).join(" · ")}</span>
            <p className={styles.cardText}>{s.description}</p>
          </Link>
        ))}
      </div>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdString(servicesListJsonLd(services)) }} />
    </section>
  );
}
