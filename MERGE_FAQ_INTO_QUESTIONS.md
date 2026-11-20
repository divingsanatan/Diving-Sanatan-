# FAQ + Q&A merged into one "Questions & Answers" hub

## Already done on the live Supabase project (20 Nov 2026)
- The 8 published FAQs were copied into `qa_questions` as expert (team) answered questions.
- 9 permanent (301) redirects were added: `/blog/faq` and every `/blog/faq/<slug>` now go to `/blog/quora-qa/...`.
- `qa_comments.body_format` column added (existing comments stay plain text).
- The old `faqs` table was NOT touched. It is your backup.

## What you still need to do: deploy the code
Copy the files in this zip into the repo (same paths), commit, and let Vercel deploy.
Nothing breaks if the code is deployed late: the redirects already work, and old comments still show.

## What changed in the code
- Comments: small rich text box (bold, italic, bullet list, quote, link). Up to 3 links per comment, http(s) only,
  every link is `rel="nofollow ugc"` and opens in a new tab. Cleaned on the server (allow-list) and again when shown.
- Hub: "All questions / Expert answers / From the community" filter. Wording changed to "Questions & Answers".
- Navigation (blog sidebar, portal menu, footer): the separate FAQ entry is gone.
- sitemap.xml, llms.txt, llm-full.txt: FAQ section removed (those questions are listed once, under Questions & Answers).
- Guru answers still come from the admin screen (Admin > Q&A). Visitor comments still wait for staff approval.

## Not changed on purpose
- The address stays `/blog/quora-qa` (renaming it to something like `/blog/questions` touches ~16 files plus new redirects).
- The old `/blog/faq` pages and the admin FAQ screen still exist in the code but are no longer linked or listed.
