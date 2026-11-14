import { revalidatePath } from "next/cache";

/** Refresh the FAQ pages, sitemap and AI files after an edit. Never throws. */
export function revalidateFaq(slugs: string[] = []) {
  try {
    revalidatePath("/blog/faq");
    revalidatePath("/sitemap.xml");
    revalidatePath("/llms.txt");
    revalidatePath("/llm-full.txt");
    for (const s of slugs) if (s) revalidatePath(`/blog/faq/${s}`);
  } catch {
    /* pages also refresh on their own timer */
  }
}
