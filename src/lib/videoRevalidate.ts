import { revalidatePath } from "next/cache";

/** Refresh the video pages, sitemap and AI files after an edit. Never throws. */
export function revalidateVideos(slugs: string[] = []) {
  try {
    revalidatePath("/blog/video-transcripts");
    revalidatePath("/sitemap.xml");
    revalidatePath("/llms.txt");
    revalidatePath("/llm-full.txt");
    for (const s of slugs) if (s) revalidatePath(`/blog/video-transcripts/${s}`);
  } catch {
    /* pages also refresh on their own timer */
  }
}
