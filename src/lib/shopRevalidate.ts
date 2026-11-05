import { revalidatePath } from "next/cache";

/** Refresh cached shop pages + sitemap after an admin change. Never throws. */
export function revalidateShop(slugs: string[] = []) {
  try {
    revalidatePath("/shop");
    revalidatePath("/sitemap.xml");
    for (const s of slugs) if (s) revalidatePath(`/shop/${s}`);
  } catch {
    /* not fatal: pages also refresh on their own timer */
  }
}
