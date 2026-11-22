# Topic guides (pillar pages)

A topic ties together one guide, in-depth articles, videos, questions and glossary terms.
Each topic has its own page at `/blog/topics/<slug>`; every linked page points back to it.
The topic list itself is the `/blog` page (topic guides first, then articles; the sidebar categories and the search box still narrow the articles).
`/blog/topics` and `/blog/pillar` now permanently redirect to `/blog`, and `/admin/pillar` redirects to Admin > Topic Guides.

Two old files are no longer used and can be deleted from the repo: `src/app/blog/BlogListingClient.tsx` and `src/app/blog/pillar/PillarListingClient.tsx`.

## Where to manage it
Admin > **Topic Guides**
- Create or edit a topic: title, quick answer, the written guide, key takeaways, sources, reviewer, keywords, button.
- **What is in this topic:** search for anything or press *Suggest related* (it ranks unlinked pages by keyword overlap). Set the role (Main guide / In depth / Supporting) and the order.
- **Preview draft** opens the real page, visible to signed-in staff only.
- **Publish** needs: a title, a 25 to 70 word quick answer, and a guide of 150+ words or a main-guide article.
- The list view also shows **published pages that no topic links to**, with a quick "Add to topic" menu.

## What readers and search engines get
- Hub page: quick answer, key takeaways, table of contents, start-here card, the guide, articles and videos, questions with full short answers, key terms, sources, next-step button, other topics.
- Every linked article, question, video and glossary page: a "Part of the ... guide" line, previous/next in the guide, more on the topic, and a breadcrumb through the topic.
- Structured data: topic page (CollectionPage + Article + reading-path list + breadcrumbs, linked by @id), article pages (Article/BlogPosting + breadcrumbs + the topic they belong to), breadcrumb through the topic on question, video and glossary pages.
- Blog articles are now built on the server, so the full text is in the HTML that search and AI crawlers receive. Before, it was drawn in the browser.
- Sitemap, `llms.txt` and `llm-full.txt` list each topic and its reading path.

## Database
`supabase/migrations/20261121010000_topics_pillar_hubs.sql` (already applied): tables `topics` and `topic_items`, three draft topics, and small title fixes.
`supabase/migrations/20261121000000_lock_down_public_policies.sql` (already applied): removes open public database policies.
