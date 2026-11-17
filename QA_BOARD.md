# Q&A Board (SEO / GEO / AEO flow)

The Q&A Board used to live only in each visitor's own browser (localStorage), so nothing was shared and nothing
could be indexed. It now uses real database tables, real login checks, and the same SEO flow as the FAQ and Glossary.

## How it works
1. A signed-in visitor asks a question. It is saved as **pending** (private) with their first name and last initial only
   (or "Community member" if they ask anonymously).
2. Staff approve it in Admin > Q&A Board (**published**) or reject it.
3. A healer (guru role) or staff member writes the official answer. Healers can only edit the answer fields.
4. Once answered, the question page is indexable and gets Q&A (QAPage) structured data, a quick answer for AI
   assistants, sources, takeaways and related questions. Unanswered questions stay `noindex` and out of the sitemap.
5. Signed-in visitors can comment. Visitor comments wait for staff approval; healer and team comments go live at once.

## Deploy order (important)
1. Run `supabase/migrations/20261114010000_qa_board.sql` in the Supabase SQL editor (safe to re-run).
2. Deploy the code.
3. Ask a test question while signed in, approve it in the admin screen, answer it, then click **Fill empty basics for all**.

Until the SQL runs, the board simply shows no questions (it will not break).

## Rules that must not be weakened
- The two tables are **server only**: row level security is on with no public policies. Never add a public
  `select` policy: it would expose asker ids and private moderation notes.
- Identity always comes from the signed login cookie (`requireUser` / `requirePanel` / `requireStaff`), never from the request body.
- Public responses use `mapQaRow(row, false)`. Only staff get `moderationNote` and `askedByProfileId`.
- Visitor text is plain text only, limited in length, and link-spam limited. Daily limits: 5 questions, 20 comments.
- `COMMENTS_NEED_APPROVAL` in `src/lib/qaServer.ts` switches comment pre-moderation on or off.
- Changing a live question's address creates a 301 redirect automatically.

## Where things live
| What | File |
|---|---|
| Types, privacy-safe names, scoring, QAPage JSON-LD | `src/lib/qaShared.ts` |
| Reads, validation, role-aware editing, fill blanks | `src/lib/qaServer.ts` |
| API | `src/app/api/qa/questions/route.ts`, `.../questions/bulk-seo/route.ts`, `src/app/api/qa/comments/route.ts` |
| Board (server rendered) + interactive list and ask form | `src/app/blog/quora-qa/page.tsx`, `QaBoardClient.tsx` |
| One page per question + comments | `src/app/blog/quora-qa/[slug]/page.tsx`, `QaComments.tsx` |
| Admin (moderation, answering, SEO scores) | `src/app/admin/quora-qa/page.tsx`, `QaEditor.tsx`, `qaApi.ts` |
| Sitemap, llms.txt, llm-full.txt | `src/app/sitemap.ts`, `src/app/llms.txt/route.ts`, `src/app/llm-full.txt/route.ts` |

## Not built (yet)
Upvotes, followers and view counters existed only as invented numbers in the old browser-only page, so they were
removed. Real versions need extra tables. Email to the asker when their question is answered is also not built.
