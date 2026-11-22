import { revalidatePath } from "next/cache";

/** Refresh the topic pages, sitemap and AI files after an edit. Never throws. */
export function revalidateTopics(slugs: string[] = [], memberPaths: string[] = []) {
  try {
    revalidatePath("/blog/topics");
    revalidatePath("/sitemap.xml");
    revalidatePath("/llms.txt");
    revalidatePath("/llm-full.txt");
    for (const s of slugs) if (s) revalidatePath(`/blog/topics/${s}`);
    for (const p of memberPaths) if (p) revalidatePath(p);
  } catch {
    /* pages also refresh on their own timer */
  }
}
