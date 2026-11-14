# FAQ SEO / GEO / AEO flow

The FAQ section works like the Glossary: every question has its own page, its own SEO fields, and scores.

## Deploy order (important)
1. Run `supabase/migrations/20261114000000_faq_seo.sql` in the Supabase SQL editor (safe to re-run).
2. Deploy the code.
3. In Admin > FAQs click **Fill empty basics for all**, then work through the weakest FAQs.

If the code goes live before the SQL, the FAQ list still works (it falls back to the old publish flag), but
question pages and schema only start working after the migration.

## Where things live
| What | File |
|---|---|
| Types, scoring (SEO/GEO/AEO), JSON-LD, slug rules | `src/lib/faqShared.ts` |
| Database reads, input validation, "fill blanks" | `src/lib/faqServer.ts` |
| Cache refresh after edits | `src/lib/faqRevalidate.ts` |
| API (public = published only; staff `?all=1`) | `src/app/api/faq/route.ts`, `src/app/api/faq/bulk-seo/route.ts` |
| FAQ hub page (server rendered) | `src/app/blog/faq/page.tsx` |
| Interactive accordion (existing design) | `src/app/blog/faq/FaqClient.tsx` |
| One page per question | `src/app/blog/faq/[slug]/page.tsx` |
| Admin list + editor | `src/app/admin/faq/page.tsx`, `FaqEditor.tsx`, `faqApi.ts` |
| Sitemap, llms.txt, llm-full.txt | `src/app/sitemap.ts`, `src/app/llms.txt/route.ts`, `src/app/llm-full.txt/route.ts` |

## Rules
- Status is the source of truth (`draft` / `published`). The old `is_published` column is kept in sync by a database trigger.
- Visitors can only read published FAQs (database policy). Drafts are private.
- Changing a live question's address creates a 301 redirect automatically.
- The hub page does not repeat FAQPage markup; each question page carries it.
- Google stopped showing FAQ rich results on 7 May 2026. The markup stays valid for other search engines and AI systems.
  The visible, well-written answer on its own page is what matters.
