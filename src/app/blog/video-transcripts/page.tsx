import type { Metadata } from "next";
import Link from "next/link";
import VideoHubClient from "./VideoHubClient";
import { SITE_URL } from "@/lib/shopShared";
import { getPublishedVideos } from "@/lib/videoServer";
import { isIndexableVideo, videoIndexJsonLd, videoPath } from "@/lib/videoShared";
import { jsonLdString } from "@/lib/shopServer";
import styles from "./video.module.css";

// Rebuilt at most once a minute, and instantly whenever a video is saved.
export const revalidate = 60;

const TITLE = "Spiritual Video Blogs & Shorts | Diving Sanatan";
const DESCRIPTION =
  "Watch short vertical videos on meditation, chakra healing, Vedic wisdom and everyday spiritual practice from Diving Sanatan. Subscribe on YouTube for more.";

export const metadata: Metadata = {
  title: { absolute: TITLE },
  description: DESCRIPTION,
  alternates: { canonical: `${SITE_URL}/blog/video-transcripts` },
  openGraph: { type: "website", title: TITLE, description: DESCRIPTION, url: `${SITE_URL}/blog/video-transcripts`, siteName: "Diving Sanatan" },
  twitter: { card: "summary_large_image", title: TITLE, description: DESCRIPTION },
};

export default async function VideoBlogsPage() {
  const videos = await getPublishedVideos();
  const listed = videos.filter(isIndexableVideo);

  return (
    <>
      <VideoHubClient videos={videos} />

      {listed.length > 0 && (
        <div className={styles.page} style={{ paddingTop: 0 }}>
          <details className={styles.allList}>
            <summary>Text list of all {listed.length} videos</summary>
            <ol>
              {listed.map((v) => (
                <li key={v.id}><Link href={videoPath(v.slug)}>{v.title}</Link></li>
              ))}
            </ol>
          </details>
        </div>
      )}

      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdString(videoIndexJsonLd(videos)) }} />
    </>
  );
}
