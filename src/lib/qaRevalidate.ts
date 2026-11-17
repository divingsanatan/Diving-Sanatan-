import { revalidatePath } from "next/cache";

/** Refresh the Q&A pages, sitemap and AI files after an edit. Never throws. */
export function revalidateQa(slugs: string[] = []) {
  try {
    revalidatePath("/blog/quora-qa");
    revalidatePath("/sitemap.xml");
    revalidatePath("/llms.txt");
    revalidatePath("/llm-full.txt");
    for (const s of slugs) if (s) revalidatePath(`/blog/quora-qa/${s}`);
  } catch {
    /* pages also refresh on their own timer */
  }
}
