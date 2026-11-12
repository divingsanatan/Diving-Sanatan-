import { revalidatePath } from "next/cache";

/** Refresh the glossary pages, sitemap and AI files after an edit. Never throws. */
export function revalidateGlossary(slugs: string[] = []) {
  try {
    revalidatePath("/blog/glossary");
    revalidatePath("/sitemap.xml");
    revalidatePath("/llms.txt");
    revalidatePath("/llm-full.txt");
    for (const s of slugs) if (s) revalidatePath(`/blog/glossary/${s}`);
  } catch {
    /* pages also refresh on their own timer */
  }
}
