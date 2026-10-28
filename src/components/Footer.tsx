import Link from "next/link";
import styles from "./Footer.module.css";

type FooterLink = { label: string; href: string };

// TODO: swap these placeholder routes / handles for your real ones.
const groups: { title: string; links: FooterLink[] }[] = [
  {
    title: "Explore",
    links: [
      { label: "Videos", href: "/videos" },
      { label: "Glossary", href: "/glossary" },
      { label: "Blog", href: "/blog" },
      { label: "About", href: "/about" },
    ],
  },
  {
    title: "Consult",
    links: [
      { label: "Spiritual healing", href: "/services/spiritual-healing" },
      { label: "Life coaching", href: "/services/life-coaching" },
      { label: "Vaastu", href: "/services/vaastu" },
      { label: "Marriage consultation", href: "/services/marriage-consultation" },
    ],
  },
  {
    title: "Follow",
    links: [
      { label: "YouTube", href: "https://www.youtube.com/@YOUR_HANDLE" },
      { label: "Instagram", href: "https://www.instagram.com/YOUR_HANDLE" },
    ],
  },
];

const isExternal = (href: string) => href.startsWith("http");

function FooterAnchor({ label, href }: FooterLink) {
  return isExternal(href) ? (
    <a className={styles.link} href={href} target="_blank" rel="noopener noreferrer">
      {label}
    </a>
  ) : (
    <Link className={styles.link} href={href}>
      {label}
    </Link>
  );
}

export default function Footer() {
  return (
    <footer className={styles.footer}>
      {/* Decorative: bindu with ripples spreading outward */}
      <svg className={styles.rings} viewBox="0 0 600 600" aria-hidden="true" focusable="false">
        <defs>
          <radialGradient id="footer-bindu-glow">
            <stop offset="0" stopColor="currentColor" stopOpacity="0.45" />
            <stop offset="1" stopColor="currentColor" stopOpacity="0" />
          </radialGradient>
        </defs>
        <circle cx="300" cy="300" r="70" fill="url(#footer-bindu-glow)" />
        {[0, 1, 2, 3, 4].map((i) => (
          <circle
            key={i}
            className={styles.ring}
            style={{ ["--i" as string]: i }}
            cx="300"
            cy="300"
            r="290"
          />
        ))}
        <circle className={styles.bindu} cx="300" cy="300" r="4" />
      </svg>

      <div className={styles.inner}>
        <div className={styles.top}>
          <div>
            <p className={styles.tagline} lang="hi">
              सनातन की गहराई में
            </p>
            <p className={styles.sub}>Vedic wisdom, Tantra and practice for everyday life.</p>
          </div>
          <Link className={styles.cta} href="/consultation">
            Book a consultation
          </Link>
        </div>

        <nav className={styles.cols} aria-label="Footer">
          {groups.map((group) => (
            <div key={group.title}>
              <h2 className={styles.heading}>{group.title}</h2>
              <ul className={styles.list}>
                {group.links.map((l) => (
                  <li key={l.href}>
                    <FooterAnchor {...l} />
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>

        <div className={styles.bottom}>
          <p className={styles.legal}>© {new Date().getFullYear()} Diving Sanatan</p>
          <div className={styles.legalLinks}>
            <Link className={styles.link} href="/privacy">
              Privacy
            </Link>
            <Link className={styles.link} href="/terms">
              Terms
            </Link>
          </div>
          <p className={styles.mantra} lang="sa">
            ॐ तत् सत्
          </p>
        </div>
      </div>
    </footer>
  );
}
