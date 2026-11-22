import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { WatchPlayer, WatchRoot, WatchTranscript } from "./VideoWatch";
import SubscribeButton from "../SubscribeButton";
import AdSense from "@/components/AdSense";
import { getPublishedVideos, getVideoBySlug } from "@/lib/videoServer";
import {
  effectiveCanonical,
  effectiveMetaDescription,
  effectiveMetaTitle,
  effectiveSummary,
  formatDuration,
  isIndexableVideo,
  parseTranscript,
  relatedVideos,
  thumbnailOf,
  videoJsonLd,
  videoPath,
  videoUrl,
} from "@/lib/videoShared";
import { youtubeEmbedBase } from "@/lib/youtube";
import { truncate } from "@/lib/shopShared";
import { jsonLdString } from "@/lib/shopServer";
import { sanitizeHtml } from "@/utils/sanitizeHtml";
import { getTrailFor } from "@/lib/topicsServer";
import { TopicBadge, TopicTrail } from "@/components/blog/TopicTrail";
import { normalizeBlogHtml } from "@/utils/normalizeBlogHtml";
import { PlayIcon } from "../Icons";
import styles from "../video.module.css";

export const revalidate = 60;
export const dynamicParams = true;

type Props = { params: Promise<{ slug: string }> };

export async function generateStaticParams() {
  const all = await getPublishedVideos();
  return all.slice(0, 300).map((v) => ({ slug: v.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const v = await getVideoBySlug(slug);
  if (!v) return { title: { absolute: "Video not found | Diving Sanatan" }, robots: { index: false, follow: false } };

  const title = effectiveMetaTitle(v);
  const description = effectiveMetaDescription(v);
  const image = v.ogImage.trim() || thumbnailOf(v);
  const vertical = v.format === "vertical";
  return {
    title: { absolute: title },
    description,
    alternates: { canonical: effectiveCanonical(v) },
    robots: isIndexableVideo(v) ? { index: true, follow: true } : { index: false, follow: true },
    keywords: [v.focusKeyword, ...v.secondaryKeywords].filter(Boolean),
    openGraph: {
      type: "video.other",
      title,
      description,
      url: videoUrl(v.slug),
      siteName: "Diving Sanatan",
      images: [{ url: image, alt: v.title }],
      videos: [{ url: youtubeEmbedBase(v.youtubeId), width: vertical ? 720 : 1280, height: vertical ? 1280 : 720 }],
    },
    twitter: { card: "summary_large_image", title, description, images: [image] },
  };
}

const fmtDate = (d: string) => new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });

export default async function VideoPage({ params }: Props) {
  const { slug } = await params;
  const v = await getVideoBySlug(slug);
  if (!v) notFound();

  const [all, trail] = await Promise.all([getPublishedVideos(), getTrailFor("video", v.slug)]);
  const bySlug = new Map(all.map((x) => [x.slug, x]));
  let related = v.relatedVideos.map((s) => bySlug.get(s)).filter((x): x is NonNullable<typeof x> => !!x && x.id !== v.id && isIndexableVideo(x));
  if (related.length === 0) related = relatedVideos(v, all, 4);

  const idx = all.findIndex((x) => x.id === v.id);
  const prev = idx > 0 ? all[idx - 1] : null;
  const next = idx >= 0 && idx < all.length - 1 ? all[idx + 1] : null;

  const lines = parseTranscript(v.transcript);
  const takeaways = v.keyTakeaways.filter(Boolean);
  const questions = v.alternateQuestions.filter(Boolean);
  const sources = v.sources.filter((s) => s.url);
  const summary = effectiveSummary(v);
  const content = sanitizeHtml(v.content);
  const wide = v.format === "horizontal";

  return (
    <article className={styles.article}>
      <nav className={styles.crumbs} aria-label="Breadcrumb">
        <Link href="/">Home</Link><span aria-hidden="true">/</span>
        <Link href="/blog">Blog</Link><span aria-hidden="true">/</span>
        <Link href="/blog/video-transcripts">Video Blogs</Link><span aria-hidden="true">/</span>
        <span aria-current="page">{truncate(v.title, 60)}</span>
      </nav>

      <WatchRoot>
        <div className={`${styles.layout} ${wide ? styles.layoutWide : ""}`}>
          <WatchPlayer youtubeId={v.youtubeId} format={v.format} title={v.title} poster={thumbnailOf(v)} shareUrl={videoUrl(v.slug)} />

          <div>
            <span className={styles.badge}>{v.category || "Video"}</span>
            <h1 className={styles.h1}>{v.title}</h1>
            <TopicBadge trail={trail} />
            <p className={styles.byline}>
              {v.authorName && (
                <span style={{ display: "inline-flex", alignItems: "center", gap: 10 }}>
                  <span className={styles.avatar} aria-hidden="true">{v.authorName.charAt(0).toUpperCase()}</span>
                  <span>
                    <span className={styles.byName}>{v.authorName}</span>
                    {v.authorCredentials && <span>{v.authorCredentials}</span>}
                  </span>
                </span>
              )}
              {v.uploadDate && <span>{v.authorName && <span className={styles.dot} aria-hidden="true">· </span>}{fmtDate(v.uploadDate)}</span>}
              {v.durationSeconds ? <span><span className={styles.dot} aria-hidden="true">· </span>{formatDuration(v.durationSeconds)}</span> : null}
              {v.reviewedBy && <span><span className={styles.dot} aria-hidden="true">· </span>Reviewed by {v.reviewedBy}</span>}
            </p>

            {summary && (
              <section className={`${styles.answer} speakable-answer`} aria-label="Summary">
                <p className={styles.answerLabel}>In short</p>
                <p className={styles.answerText}>{summary}</p>
              </section>
            )}

            {takeaways.length > 0 && (
              <section className={styles.section} aria-labelledby="takeaways">
                <h2 id="takeaways" className={styles.h2}>Key takeaways</h2>
                <ul className={styles.takeaways}>{takeaways.map((t, i) => (<li key={i}>{t}</li>))}</ul>
              </section>
            )}

            {lines.length > 0 && (
              <section className={styles.section} aria-labelledby="transcript">
                <h2 id="transcript" className={styles.h2}>Transcript</h2>
                <WatchTranscript lines={lines} />
              </section>
            )}

            <AdSense adClient="ca-pub-4820128927673407" adSlot="3156896316" adLayout="in-article" adFormat="fluid" style={{ display: "block", textAlign: "center" }} />

            {content && (
              <section className={styles.section} aria-labelledby="writeup">
                <h2 id="writeup" className={styles.h2}>The full story</h2>
                <div className="prose" dangerouslySetInnerHTML={{ __html: normalizeBlogHtml(content) }} />
              </section>
            )}

            {questions.length > 0 && (
              <section className={styles.section} aria-labelledby="questions">
                <h2 id="questions" className={styles.h2}>Questions this video answers</h2>
                <ul className={styles.altList}>{questions.map((q, i) => (<li key={i}>{q}</li>))}</ul>
              </section>
            )}

            {sources.length > 0 && (
              <section className={styles.section} aria-labelledby="sources">
                <h2 id="sources" className={styles.h2}>Sources and further reading</h2>
                <ol className={styles.sources}>
                  {sources.map((s, i) => (<li key={i}><a href={s.url} target="_blank" rel="noopener noreferrer">{s.title}</a></li>))}
                </ol>
              </section>
            )}
          </div>
        </div>
      </WatchRoot>

      <aside className={styles.band} aria-label="Subscribe on YouTube" style={{ marginTop: 40 }}>
        <div className={styles.bandText}>
          <h2 className={styles.bandTitle}>Enjoyed this? There&apos;s more.</h2>
          <p className={styles.bandSub}>Subscribe to the Diving Sanatan YouTube channel so you never miss the next one.</p>
        </div>
        <SubscribeButton />
      </aside>

      {related.length > 0 && (
        <section className={styles.section} aria-labelledby="related">
          <h2 id="related" className={styles.h2}>More videos</h2>
          <ul className={styles.related}>
            {related.map((r) => (
              <li key={r.id}>
                <Link href={videoPath(r.slug)} className={styles.card} aria-label={`Watch: ${r.title}`}>
                  <div className={`${styles.poster} ${r.format === "horizontal" ? styles.posterWide : ""}`}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={thumbnailOf(r)} alt="" className={styles.posterImg} loading="lazy" />
                    <div className={styles.posterShade} />
                    <span className={styles.posterPlay}><PlayIcon /></span>
                    <div className={styles.posterBody}><h3 className={styles.posterTitle}>{r.title}</h3></div>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      <TopicTrail trail={trail} currentTitle={v.title} currentUrl={videoUrl(v.slug)} />

      <aside className={styles.cta}>
        <div>
          <h2 className={styles.ctaTitle}>Want guidance made for you?</h2>
          <p className={styles.ctaText}>Our practitioners offer personal sessions in healing, meditation and life guidance.</p>
        </div>
        <Link href="/explore-services" className={styles.btnLight}>Explore services</Link>
      </aside>

      <nav className={styles.pager} aria-label="More videos">
        {prev ? <Link href={videoPath(prev.slug)}>← {truncate(prev.title, 45)}</Link> : <span />}
        {next ? <Link href={videoPath(next.slug)}>{truncate(next.title, 45)} →</Link> : <span />}
      </nav>

      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdString(videoJsonLd(v)) }} />
    </article>
  );
}
